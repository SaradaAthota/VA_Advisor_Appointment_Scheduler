import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    BookingService as DomainBookingService,
    BookingCodeService,
} from '../domain/services';
import { ContactDetailsDto } from './dto/contact-details.dto';
import { Slot } from '../domain/models/slot.model';
import { Topic } from '../domain/models/topic.enum';
import { BookingStatus } from '../domain/models/booking-status.enum';
import { Booking } from '../domain/models/booking.model';
import { GoogleCalendarMcpService } from '../mcp/services/google-calendar-mcp.service';
import { GoogleSheetsMcpService } from '../mcp/services/google-sheets-mcp.service';
import { GmailMcpService } from '../mcp/services/gmail-mcp.service';
import { BookingEntity } from './entities/booking.entity';

@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);
    private bookingCodeService: BookingCodeService;
    private domainBookingService: DomainBookingService;

    constructor(
        @InjectRepository(BookingEntity)
        private readonly bookingRepository: Repository<BookingEntity>,
        private readonly calendarMcp: GoogleCalendarMcpService,
        private readonly sheetsMcp: GoogleSheetsMcpService,
        private readonly emailMcp: GmailMcpService,
    ) {
        this.bookingCodeService = new BookingCodeService();
        this.domainBookingService = new DomainBookingService(
            this.bookingCodeService,
        );
    }

    /**
     * Converts BookingEntity to domain Booking model
     */
    /**
     * Converts BookingEntity to domain Booking model
     * Ensures dates are Date objects (SQLite may return strings)
     * SQLite stores dates in UTC, we need to interpret them correctly
     */
    private entityToDomain(entity: BookingEntity): Booking {
        // Ensure dates are Date objects (SQLite may return strings)
        // SQLite stores dates as UTC timestamps, but we interpret them as local time
        // The dates are stored correctly, we just need to ensure they're Date objects
        let preferredStart: Date;
        let preferredEnd: Date;
        
        if (entity.preferredSlotStartTime instanceof Date) {
            preferredStart = entity.preferredSlotStartTime;
            preferredEnd = entity.preferredSlotEndTime;
        } else {
            // Parse string dates - SQLite may return them as strings
            // The string format from SQLite should be in ISO format or UTC
            preferredStart = new Date(entity.preferredSlotStartTime);
            preferredEnd = new Date(entity.preferredSlotEndTime);
        }
        
        // Validate dates
        if (isNaN(preferredStart.getTime()) || isNaN(preferredEnd.getTime())) {
            this.logger.error(`Invalid dates in entity ${entity.id}: ${entity.preferredSlotStartTime}, ${entity.preferredSlotEndTime}`);
            throw new Error(`Invalid date values in booking entity ${entity.id}`);
        }
        
        let alternativeSlot: Slot | undefined;
        if (entity.alternativeSlotId) {
            let altStart: Date;
            let altEnd: Date;
            
            if (entity.alternativeSlotStartTime instanceof Date) {
                altStart = entity.alternativeSlotStartTime;
                altEnd = entity.alternativeSlotEndTime!;
            } else {
                altStart = new Date(entity.alternativeSlotStartTime!);
                altEnd = new Date(entity.alternativeSlotEndTime!);
            }
            
            if (isNaN(altStart.getTime()) || isNaN(altEnd.getTime())) {
                this.logger.warn(`Invalid alternative slot dates in entity ${entity.id}`);
            } else {
                alternativeSlot = {
                    id: entity.alternativeSlotId,
                    startTime: altStart,
                    endTime: altEnd,
                    isAvailable: entity.alternativeSlotIsAvailable!,
                };
            }
        }
        
        return {
            id: entity.id,
            bookingCode: entity.bookingCode,
            topic: entity.topic,
            preferredSlot: {
                id: entity.preferredSlotId,
                startTime: preferredStart,
                endTime: preferredEnd,
                isAvailable: entity.preferredSlotIsAvailable,
            },
            alternativeSlot,
            status: entity.status,
            createdAt: entity.createdAt instanceof Date ? entity.createdAt : new Date(entity.createdAt),
            updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt : new Date(entity.updatedAt),
            timeZone: entity.timeZone,
        };
    }

    /**
     * Converts domain Booking model to BookingEntity
     */
    private domainToEntity(booking: Booking): BookingEntity {
        const entity = new BookingEntity();
        entity.id = booking.id;
        entity.bookingCode = booking.bookingCode;
        entity.topic = booking.topic;
        entity.preferredSlotId = booking.preferredSlot.id;
        entity.preferredSlotStartTime = booking.preferredSlot.startTime;
        entity.preferredSlotEndTime = booking.preferredSlot.endTime;
        entity.preferredSlotIsAvailable = booking.preferredSlot.isAvailable;
        if (booking.alternativeSlot) {
            entity.alternativeSlotId = booking.alternativeSlot.id;
            entity.alternativeSlotStartTime = booking.alternativeSlot.startTime;
            entity.alternativeSlotEndTime = booking.alternativeSlot.endTime;
            entity.alternativeSlotIsAvailable = booking.alternativeSlot.isAvailable;
        }
        entity.status = booking.status;
        entity.timeZone = booking.timeZone;
        entity.createdAt = booking.createdAt;
        entity.updatedAt = booking.updatedAt;
        return entity;
    }

    async findByBookingCode(bookingCode: string): Promise<Booking | null> {
        // Validate booking code format
        if (!this.bookingCodeService.validateBookingCode(bookingCode)) {
            return null;
        }

        // Find in database
        const entity = await this.bookingRepository.findOne({
            where: { bookingCode },
        });

        if (!entity) {
            return null;
        }

        return this.entityToDomain(entity);
    }

    async completeBooking(
        bookingCode: string,
        contactDetails: ContactDetailsDto,
    ): Promise<void> {
        this.logger.log(`Completing booking: ${bookingCode}`);

        // Find the booking
        const booking = await this.findByBookingCode(bookingCode);
        if (!booking) {
            throw new Error(`Booking ${bookingCode} not found`);
        }

        // Confirm the booking (change status from TENTATIVE to CONFIRMED)
        await this.updateBookingStatus(bookingCode, BookingStatus.CONFIRMED);

        // Phase 5: Trigger MCP actions (Calendar, Notes, Email)
        try {
            this.logger.log(`Starting MCP actions for booking: ${bookingCode}`);
            await this.triggerMcpActions(bookingCode, booking, contactDetails);
            this.logger.log(`✅ MCP actions completed successfully for booking: ${bookingCode}`);
        } catch (error) {
            // Log MCP errors but don't fail the booking completion
            // In production, you might want to implement retry logic or queue these operations
            this.logger.error(
                `❌ MCP actions failed for booking ${bookingCode}: ${error.message}`,
                error.stack,
            );
            this.logger.error(
                `Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`,
            );
            // Optionally, you could throw here if MCP actions are critical
            // throw new Error(`Failed to complete MCP actions: ${error.message}`);
        }

        // Log contact details (in a real app, this would go to a database)
        this.logger.debug(`Booking ${bookingCode} completed with contact details:`, {
            fullName: contactDetails.fullName,
            email: contactDetails.email,
            phone: contactDetails.phone,
            additionalNotes: contactDetails.additionalNotes,
        });
    }

    /**
     * Triggers MCP actions when a booking is confirmed
     * - Creates calendar hold
     * - Appends to notes document
     * - Creates email draft
     */
    private async triggerMcpActions(
        bookingCode: string,
        booking: any,
        contactDetails: ContactDetailsDto,
    ): Promise<void> {
        this.logger.log(`Triggering MCP actions for booking: ${bookingCode}`);

        // 1. Create calendar hold
        try {
            this.logger.debug('Creating calendar hold...');
            const calendarEvent = await this.calendarMcp.createTentativeHold(
                booking.topic,
                bookingCode,
                booking.preferredSlot,
            );
            this.logger.log(
                `Calendar hold created: ${calendarEvent.eventId} for booking ${bookingCode}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to create calendar hold for booking ${bookingCode}: ${error.message}`,
            );
            throw error;
        }

        // 2. Append to notes spreadsheet
        try {
            this.logger.debug('Appending to notes spreadsheet...');
            const notesResult = await this.sheetsMcp.appendBookingEntry(
                booking.preferredSlot.startTime,
                booking.topic,
                booking.preferredSlot,
                bookingCode,
            );
            this.logger.log(
                `Booking entry appended to spreadsheet: ${notesResult.documentId} for booking ${bookingCode}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to append to notes spreadsheet for booking ${bookingCode}: ${error.message}`,
            );
            throw error;
        }

        // 3. Create email draft
        try {
            this.logger.debug('Creating email draft...');
            const emailDraft = await this.emailMcp.createAdvisorEmailDraft(
                booking.topic,
                bookingCode,
                booking.preferredSlot,
                {
                    fullName: contactDetails.fullName,
                    email: contactDetails.email,
                    phone: contactDetails.phone,
                    additionalNotes: contactDetails.additionalNotes,
                },
            );
            this.logger.log(
                `Email draft created: ${emailDraft.draftId} for booking ${bookingCode}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to create email draft for booking ${bookingCode}: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Helper method to update booking status in database
     */
    private async updateBookingStatus(
        bookingCode: string,
        status: BookingStatus,
    ): Promise<void> {
        const entity = await this.bookingRepository.findOne({
            where: { bookingCode },
        });
        if (entity) {
            entity.status = status;
            entity.updatedAt = new Date();
            await this.bookingRepository.save(entity);
        }
    }

    async createTestBooking(
        topic: Topic,
        preferredSlot: Slot,
        alternativeSlot: Slot,
    ): Promise<Booking> {
        const booking = this.domainBookingService.createBooking(
            topic,
            preferredSlot,
            alternativeSlot,
        );
        // Save to database
        const entity = this.domainToEntity(booking);
        const savedEntity = await this.bookingRepository.save(entity);
        return this.entityToDomain(savedEntity);
    }

    /**
     * Creates a booking with validation
     * - Checks if slots are already booked
     * - Validates slot availability
     * - Returns waitlist booking if no slots available
     */
    async createBooking(
        topic: Topic,
        preferredSlot: Slot,
        alternativeSlot?: Slot,
    ) {
        console.error('🔥🔥🔥 BookingService.createBooking called 🔥🔥🔥');
        console.error('Topic:', topic);
        console.error('Preferred Slot:', JSON.stringify(preferredSlot));
        
        // Check if preferred slot is already booked
        console.error('🔍 Checking booked slots from database...');
        const bookedSlots = await this.getBookedSlots();
        console.error('📊 Found booked slots:', bookedSlots.length);
        const isPreferredSlotBooked = bookedSlots.some(
            (booked) => booked.id === preferredSlot.id,
        );

        if (isPreferredSlotBooked) {
            throw new Error(
                `Preferred slot ${preferredSlot.id} is already booked`,
            );
        }

        // Check if alternative slot is already booked (if provided)
        if (alternativeSlot) {
            const isAlternativeSlotBooked = bookedSlots.some(
                (booked) => booked.id === alternativeSlot.id,
            );

            if (isAlternativeSlotBooked) {
                throw new Error(
                    `Alternative slot ${alternativeSlot.id} is already booked`,
                );
            }
        }

        // Validate slot is not on Sunday
        const preferredSlotDate = new Date(preferredSlot.startTime);
        if (preferredSlotDate.getDay() === 0) {
            throw new Error('Bookings are not available on Sundays');
        }

        if (alternativeSlot) {
            const alternativeSlotDate = new Date(alternativeSlot.startTime);
            if (alternativeSlotDate.getDay() === 0) {
                throw new Error('Bookings are not available on Sundays');
            }
        }

        // Create the booking using domain service (for business logic)
        const booking = this.domainBookingService.createBooking(
            topic,
            preferredSlot,
            alternativeSlot,
        );
        
        // Save to database
        console.error('💾 Saving booking to database...');
        console.error('Database repository type:', this.bookingRepository.constructor.name);
        const entity = this.domainToEntity(booking);
        console.error('Entity to save:', JSON.stringify(entity, null, 2));
        try {
            const savedEntity = await this.bookingRepository.save(entity);
            console.error('✅✅✅ Booking saved successfully to database! ✅✅✅');
            console.error('Saved entity ID:', savedEntity.id);
            return this.entityToDomain(savedEntity);
        } catch (error) {
            console.error('❌❌❌ DATABASE SAVE ERROR ❌❌❌');
            console.error('Error:', error);
            console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
            throw error;
        }
    }

    /**
     * Creates a waitlist booking when no slots are available
     */
    async createWaitlistBooking(topic: Topic): Promise<Booking> {
        const booking = this.domainBookingService.createWaitlistBooking(topic);
        // Save to database
        const entity = this.domainToEntity(booking);
        const savedEntity = await this.bookingRepository.save(entity);
        return this.entityToDomain(savedEntity);
    }

    /**
     * Gets all bookings from database (for debug endpoint)
     */
    async getAllBookingsFromDb(): Promise<BookingEntity[]> {
        return await this.bookingRepository.find();
    }

    /**
     * Gets all booked slots from database
     * @param excludeBookingCode - Optional booking code to exclude (for reschedule)
     */
    async getBookedSlots(excludeBookingCode?: string): Promise<Slot[]> {
        const bookings = await this.bookingRepository.find({
            where: [
                { status: BookingStatus.TENTATIVE },
                { status: BookingStatus.CONFIRMED },
                { status: BookingStatus.RESCHEDULED },
            ],
        });

        const bookedSlots: Slot[] = [];
        for (const booking of bookings) {
            // Skip the excluded booking (for reschedule - allow showing slots on same date)
            if (excludeBookingCode && booking.bookingCode === excludeBookingCode) {
                continue;
            }
            
            bookedSlots.push({
                id: booking.preferredSlotId,
                startTime: booking.preferredSlotStartTime,
                endTime: booking.preferredSlotEndTime,
                isAvailable: false, // These are booked
            });
            if (booking.alternativeSlotId) {
                bookedSlots.push({
                    id: booking.alternativeSlotId,
                    startTime: booking.alternativeSlotStartTime!,
                    endTime: booking.alternativeSlotEndTime!,
                    isAvailable: false,
                });
            }
        }
        return bookedSlots;
    }

    /**
     * Checks if a slot is available (not already booked)
     */
    async isSlotAvailable(slotId: string): Promise<boolean> {
        const bookedSlots = await this.getBookedSlots();
        return !bookedSlots.some((booked) => booked.id === slotId);
    }

    /**
     * Cancels a booking
     * - Updates booking status to CANCELLED
     * - Triggers MCP actions to update/delete calendar, sheets, email
     */
    async cancelBooking(bookingCode: string): Promise<void> {
        this.logger.log(`Cancelling booking: ${bookingCode}`);

        // Find the booking
        const booking = await this.findByBookingCode(bookingCode);
        if (!booking) {
            throw new Error(`Booking ${bookingCode} not found`);
        }

        // Check if already cancelled
        if (booking.status === 'CANCELLED') {
            throw new Error(`Booking ${bookingCode} is already cancelled`);
        }

        // Cancel the booking in database
        await this.updateBookingStatus(bookingCode, BookingStatus.CANCELLED);

        // Trigger MCP actions to clean up calendar, sheets, email
        try {
            await this.triggerCancelMcpActions(bookingCode, booking);
            this.logger.log(`MCP cleanup actions completed for cancelled booking: ${bookingCode}`);
        } catch (error) {
            // Log MCP errors but don't fail the cancellation
            this.logger.error(
                `MCP cleanup actions failed for cancelled booking ${bookingCode}: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Reschedules a booking to new slots
     * - Validates new slots are available
     * - Updates booking with new slots
     * - Triggers MCP actions to update calendar, sheets, email
     */
    async rescheduleBooking(
        bookingCode: string,
        newPreferredSlot: Slot,
        newAlternativeSlot?: Slot,
    ): Promise<Booking> {
        this.logger.log(`Rescheduling booking: ${bookingCode}`);

        // Find the booking
        const booking = await this.findByBookingCode(bookingCode);
        if (!booking) {
            throw new Error(`Booking ${bookingCode} not found`);
        }

        // Check if booking is cancelled
        if (booking.status === 'CANCELLED') {
            throw new Error(`Cannot reschedule a cancelled booking`);
        }

        // Validate new preferred slot is available
        const bookedSlots = await this.getBookedSlots();
        const isPreferredSlotBooked = bookedSlots.some(
            (booked) => booked.id === newPreferredSlot.id && booked.id !== booking.preferredSlot.id,
        );

        if (isPreferredSlotBooked) {
            throw new Error(
                `Preferred slot ${newPreferredSlot.id} is already booked`,
            );
        }

        // Validate new alternative slot is available (if provided)
        if (newAlternativeSlot) {
            const isAlternativeSlotBooked = bookedSlots.some(
                (booked) => booked.id === newAlternativeSlot.id && booked.id !== booking.preferredSlot.id,
            );

            if (isAlternativeSlotBooked) {
                throw new Error(
                    `Alternative slot ${newAlternativeSlot.id} is already booked`,
                );
            }
        }

        // Validate slot is not on Sunday
        const preferredSlotDate = new Date(newPreferredSlot.startTime);
        if (preferredSlotDate.getDay() === 0) {
            throw new Error('Bookings are not available on Sundays');
        }

        if (newAlternativeSlot) {
            const alternativeSlotDate = new Date(newAlternativeSlot.startTime);
            if (alternativeSlotDate.getDay() === 0) {
                throw new Error('Bookings are not available on Sundays');
            }
        }

        // Store old slot for MCP updates
        const oldPreferredSlot = booking.preferredSlot;

        // Update booking in database - ensure dates are Date objects
        const entity = await this.bookingRepository.findOne({
            where: { bookingCode },
        });
        if (!entity) {
            throw new Error(`Booking entity not found for ${bookingCode}`);
        }
        
        // Ensure dates are Date objects
        // Frontend sends dates as ISO strings, we parse them as Date objects
        const preferredStart = newPreferredSlot.startTime instanceof Date 
            ? newPreferredSlot.startTime 
            : new Date(newPreferredSlot.startTime as string | number | Date);
        const preferredEnd = newPreferredSlot.endTime instanceof Date 
            ? newPreferredSlot.endTime 
            : new Date(newPreferredSlot.endTime as string | number | Date);
        
        entity.preferredSlotId = newPreferredSlot.id;
        entity.preferredSlotStartTime = preferredStart;
        entity.preferredSlotEndTime = preferredEnd;
        entity.preferredSlotIsAvailable = newPreferredSlot.isAvailable;
        
        if (newAlternativeSlot) {
            const altStart = newAlternativeSlot.startTime instanceof Date 
                ? newAlternativeSlot.startTime 
                : new Date(newAlternativeSlot.startTime as string | number | Date);
            const altEnd = newAlternativeSlot.endTime instanceof Date 
                ? newAlternativeSlot.endTime 
                : new Date(newAlternativeSlot.endTime as string | number | Date);
            
            entity.alternativeSlotId = newAlternativeSlot.id;
            entity.alternativeSlotStartTime = altStart;
            entity.alternativeSlotEndTime = altEnd;
            entity.alternativeSlotIsAvailable = newAlternativeSlot.isAvailable;
        } else {
            entity.alternativeSlotId = null;
            entity.alternativeSlotStartTime = null;
            entity.alternativeSlotEndTime = null;
            entity.alternativeSlotIsAvailable = null;
        }
        
        entity.status = BookingStatus.RESCHEDULED;
        entity.updatedAt = new Date();
        await this.bookingRepository.save(entity);

        // Get updated booking
        const updatedBooking = await this.findByBookingCode(bookingCode);
        if (!updatedBooking) {
            throw new Error(`Failed to retrieve updated booking ${bookingCode}`);
        }

        // Trigger MCP actions to update calendar, sheets, email
        try {
            await this.triggerRescheduleMcpActions(
                bookingCode,
                updatedBooking,
                oldPreferredSlot,
            );
            this.logger.log(`MCP update actions completed for rescheduled booking: ${bookingCode}`);
        } catch (error) {
            // Log MCP errors but don't fail the reschedule
            this.logger.error(
                `MCP update actions failed for rescheduled booking ${bookingCode}: ${error.message}`,
                error.stack,
            );
        }

        return updatedBooking;
    }

    /**
     * Triggers MCP cleanup actions when a booking is cancelled
     * - Deletes calendar event
     * - Marks sheets entry as cancelled
     * - Deletes email draft
     */
    private async triggerCancelMcpActions(
        bookingCode: string,
        booking: Booking,
    ): Promise<void> {
        this.logger.log(`Triggering MCP cleanup actions for cancelled booking: ${bookingCode}`);

        // 1. Delete calendar event
        try {
            this.logger.debug('Deleting calendar event...');
            const result = await this.calendarMcp.deleteEvent(bookingCode);
            this.logger.log(`Calendar event deleted: ${result.message}`);
        } catch (error) {
            this.logger.error(
                `Failed to delete calendar event for booking ${bookingCode}: ${error.message}`,
            );
            // Don't throw - continue with other cleanup actions
        }

        // 2. Mark sheets entry as cancelled
        try {
            this.logger.debug('Marking sheets entry as cancelled...');
            await this.sheetsMcp.cancelBookingEntry(bookingCode);
            this.logger.log(`Sheets entry marked as cancelled for booking ${bookingCode}`);
        } catch (error) {
            this.logger.error(
                `Failed to mark sheets entry as cancelled for booking ${bookingCode}: ${error.message}`,
            );
            // Don't throw - continue with other cleanup actions
        }

        // 3. Create/update cancellation email draft
        // Instead of deleting, we create a cancellation draft so advisor is notified
        try {
            this.logger.debug('Creating cancellation email draft...');
            const result = await this.emailMcp.createCancellationDraft(
                bookingCode,
                booking.topic,
                booking.preferredSlot,
            );
            this.logger.log(`Cancellation draft created/updated: ${result.draftId}`);
        } catch (error) {
            this.logger.error(
                `Failed to create cancellation draft for booking ${bookingCode}: ${error.message}`,
            );
            // Don't throw - email draft creation is not critical
        }
    }

    /**
     * Triggers MCP update actions when a booking is rescheduled
     * - Updates calendar event with new time
     * - Updates sheets entry with new time
     * - Updates email draft with new time
     */
    private async triggerRescheduleMcpActions(
        bookingCode: string,
        booking: Booking,
        oldSlot: Slot,
    ): Promise<void> {
        this.logger.log(`Triggering MCP update actions for rescheduled booking: ${bookingCode}`);

        // 1. Update calendar event with new time
        try {
            this.logger.debug('Updating calendar event...');
            await this.calendarMcp.updateEvent(bookingCode, booking.preferredSlot);
            this.logger.log(`Calendar event updated for booking ${bookingCode}`);
        } catch (error) {
            this.logger.error(
                `Failed to update calendar event for booking ${bookingCode}: ${error.message}`,
            );
            throw error;
        }

        // 2. Update sheets entry with new time
        try {
            this.logger.debug('Updating sheets entry...');
            await this.sheetsMcp.updateBookingEntry(bookingCode, booking.preferredSlot);
            this.logger.log(`Sheets entry updated for booking ${bookingCode}`);
        } catch (error) {
            this.logger.error(
                `Failed to update sheets entry for booking ${bookingCode}: ${error.message}`,
            );
            throw error;
        }

        // 3. Update email draft with new time
        // Note: We need contact details, but they're not stored in booking
        // Try to find and update the draft anyway (it will create a new one if not found)
        try {
            this.logger.debug('Updating email draft...');
            // Use placeholder contact details since we don't store them
            // The update method will find the draft by booking code and update it
            await this.emailMcp.updateEmailDraft(
                bookingCode,
                booking.topic,
                booking.preferredSlot,
                {
                    fullName: 'Rescheduled Booking',
                    email: 'noreply@example.com',
                    phone: 'N/A',
                    additionalNotes: 'Booking was rescheduled',
                },
            );
            this.logger.log(`Email draft updated for booking ${bookingCode}`);
        } catch (error) {
            this.logger.error(
                `Failed to update email draft for booking ${bookingCode}: ${error.message}`,
            );
            // Don't throw - email update is not critical
        }
    }
}

