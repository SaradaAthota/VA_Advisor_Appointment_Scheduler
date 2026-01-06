import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { Topic } from '../domain/models/topic.enum';
import { Slot } from '../domain/models/slot.model';
import { GoogleCalendarMcpService } from '../mcp/services/google-calendar-mcp.service';
import { GoogleDocsMcpService } from '../mcp/services/google-docs-mcp.service';
import { GmailMcpService } from '../mcp/services/gmail-mcp.service';
import { BookingStatus } from '../domain/models/booking-status.enum';

describe('BookingService', () => {
    let service: BookingService;
    let calendarMcp: jest.Mocked<GoogleCalendarMcpService>;
    let docsMcp: jest.Mocked<GoogleDocsMcpService>;
    let emailMcp: jest.Mocked<GmailMcpService>;

    beforeEach(async () => {
        // Create mock MCP services
        const mockCalendarMcp = {
            createTentativeHold: jest.fn(),
        };
        const mockDocsMcp = {
            appendBookingEntry: jest.fn(),
        };
        const mockEmailMcp = {
            createAdvisorEmailDraft: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BookingService,
                {
                    provide: GoogleCalendarMcpService,
                    useValue: mockCalendarMcp,
                },
                {
                    provide: GoogleDocsMcpService,
                    useValue: mockDocsMcp,
                },
                {
                    provide: GmailMcpService,
                    useValue: mockEmailMcp,
                },
            ],
        }).compile();

        service = module.get<BookingService>(BookingService);
        calendarMcp = module.get(GoogleCalendarMcpService);
        docsMcp = module.get(GoogleDocsMcpService);
        emailMcp = module.get(GmailMcpService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findByBookingCode', () => {
        it('should return null for invalid booking code format', async () => {
            const result = await service.findByBookingCode('INVALID');
            expect(result).toBeNull();
        });

        it('should return null for non-existent booking', async () => {
            const result = await service.findByBookingCode('NL-XXXX');
            expect(result).toBeNull();
        });
    });

    describe('createTestBooking', () => {
        it('should create a test booking', async () => {
            const slot: Slot = {
                id: 'slot-1',
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T10:30:00Z'),
                isAvailable: true,
            };

            const booking = await service.createTestBooking(
                Topic.KYC_ONBOARDING,
                slot,
                slot,
            );

            expect(booking).toBeDefined();
            expect(booking.topic).toBe(Topic.KYC_ONBOARDING);
            expect(booking.bookingCode).toMatch(/^NL-[A-Z0-9]{4}$/);
        });
    });

    describe('completeBooking', () => {
        it('should complete booking and trigger MCP actions', async () => {
            // First create a booking
            const slot: Slot = {
                id: 'slot-1',
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T10:30:00Z'),
                isAvailable: true,
            };

            const booking = await service.createTestBooking(
                Topic.KYC_ONBOARDING,
                slot,
                slot,
            );

            // Mock MCP service responses
            calendarMcp.createTentativeHold.mockResolvedValue({
                eventId: 'event-123',
                calendarId: 'primary',
                htmlLink: 'https://calendar.google.com/event?eid=event-123',
                startTime: slot.startTime,
                endTime: slot.endTime,
            });

            docsMcp.appendBookingEntry.mockResolvedValue({
                documentId: 'doc-123',
                documentUrl: 'https://docs.google.com/document/d/doc-123',
                appendedAt: new Date(),
            });

            emailMcp.createAdvisorEmailDraft.mockResolvedValue({
                draftId: 'draft-123',
                messageId: 'msg-123',
                subject: 'New Advisor Appointment: KYC/Onboarding - NL-XXXX',
                requiresApproval: true,
            });

            // Complete the booking
            await service.completeBooking(booking.bookingCode, {
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '9876543210',
            });

            // Verify booking was confirmed
            const completedBooking = await service.findByBookingCode(
                booking.bookingCode,
            );
            expect(completedBooking?.status).toBe(BookingStatus.CONFIRMED);

            // Verify MCP actions were called
            expect(calendarMcp.createTentativeHold).toHaveBeenCalledWith(
                Topic.KYC_ONBOARDING,
                booking.bookingCode,
                slot,
            );
            expect(docsMcp.appendBookingEntry).toHaveBeenCalledWith(
                slot.startTime,
                Topic.KYC_ONBOARDING,
                slot,
                booking.bookingCode,
            );
            expect(emailMcp.createAdvisorEmailDraft).toHaveBeenCalledWith(
                Topic.KYC_ONBOARDING,
                booking.bookingCode,
                slot,
                {
                    fullName: 'John Doe',
                    email: 'john@example.com',
                    phone: '9876543210',
                    additionalNotes: undefined,
                },
            );
        });

        it('should handle MCP errors gracefully', async () => {
            // Create a booking
            const slot: Slot = {
                id: 'slot-1',
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T10:30:00Z'),
                isAvailable: true,
            };

            const booking = await service.createTestBooking(
                Topic.SIP_MANDATES,
                slot,
                slot,
            );

            // Mock MCP service to throw error
            calendarMcp.createTentativeHold.mockRejectedValue(
                new Error('Calendar API error'),
            );

            // Complete booking should still succeed (MCP errors are logged but don't fail booking)
            await expect(
                service.completeBooking(booking.bookingCode, {
                    fullName: 'Jane Doe',
                    email: 'jane@example.com',
                    phone: '9876543211',
                }),
            ).resolves.not.toThrow();

            // Verify booking was still confirmed
            const completedBooking = await service.findByBookingCode(
                booking.bookingCode,
            );
            expect(completedBooking?.status).toBe(BookingStatus.CONFIRMED);
        });

        it('should include additional notes in email draft', async () => {
            const slot: Slot = {
                id: 'slot-1',
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T10:30:00Z'),
                isAvailable: true,
            };

            const booking = await service.createTestBooking(
                Topic.STATEMENTS_TAX_DOCS,
                slot,
                slot,
            );

            // Mock MCP services
            calendarMcp.createTentativeHold.mockResolvedValue({
                eventId: 'event-123',
                calendarId: 'primary',
                startTime: slot.startTime,
                endTime: slot.endTime,
            });

            docsMcp.appendBookingEntry.mockResolvedValue({
                documentId: 'doc-123',
                appendedAt: new Date(),
            });

            emailMcp.createAdvisorEmailDraft.mockResolvedValue({
                draftId: 'draft-123',
                subject: 'Test',
                requiresApproval: true,
            });

            await service.completeBooking(booking.bookingCode, {
                fullName: 'Bob Smith',
                email: 'bob@example.com',
                phone: '9876543212',
                additionalNotes: 'Please prepare tax documents',
            });

            // Verify email draft was called with additional notes
            expect(emailMcp.createAdvisorEmailDraft).toHaveBeenCalledWith(
                Topic.STATEMENTS_TAX_DOCS,
                booking.bookingCode,
                slot,
                expect.objectContaining({
                    additionalNotes: 'Please prepare tax documents',
                }),
            );
        });
    });
});

