"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const booking_service_1 = require("./booking.service");
(0, vitest_1.describe)('BookingService', () => {
    (0, vitest_1.beforeEach)(() => {
        localStorage.clear();
    });
    (0, vitest_1.describe)('validateBookingCode', () => {
        (0, vitest_1.it)('validates correct booking code format', () => {
            (0, vitest_1.expect)(booking_service_1.bookingService.validateBookingCode('NL-A742')).toBe(true);
            (0, vitest_1.expect)(booking_service_1.bookingService.validateBookingCode('NL-1234')).toBe(true);
            (0, vitest_1.expect)(booking_service_1.bookingService.validateBookingCode('NL-ABCD')).toBe(true);
        });
        (0, vitest_1.it)('rejects invalid booking code format', () => {
            (0, vitest_1.expect)(booking_service_1.bookingService.validateBookingCode('NL-123')).toBe(false);
            (0, vitest_1.expect)(booking_service_1.bookingService.validateBookingCode('NL-12345')).toBe(false);
            (0, vitest_1.expect)(booking_service_1.bookingService.validateBookingCode('ABC-1234')).toBe(false);
            (0, vitest_1.expect)(booking_service_1.bookingService.validateBookingCode('')).toBe(false);
        });
    });
    (0, vitest_1.describe)('findByBookingCode', () => {
        (0, vitest_1.it)('returns mock booking for NL-TEST', async () => {
            const booking = await booking_service_1.bookingService.findByBookingCode('NL-TEST');
            (0, vitest_1.expect)(booking).not.toBeNull();
            (0, vitest_1.expect)(booking?.bookingCode).toBe('NL-TEST');
            (0, vitest_1.expect)(booking?.topic).toBe('KYC/Onboarding');
            (0, vitest_1.expect)(booking?.status).toBe('TENTATIVE');
        });
        (0, vitest_1.it)('returns null for non-existent booking code', async () => {
            const booking = await booking_service_1.bookingService.findByBookingCode('NL-INVALID');
            (0, vitest_1.expect)(booking).toBeNull();
        });
        (0, vitest_1.it)('returns booking from localStorage if available', async () => {
            const mockBooking = {
                id: 'booking-1',
                bookingCode: 'NL-CUSTOM',
                topic: 'SIP/Mandates',
                preferredSlot: {
                    id: 'slot-1',
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString(),
                    isAvailable: true,
                },
                status: 'TENTATIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                timeZone: 'IST',
            };
            localStorage.setItem('mockBookings', JSON.stringify([mockBooking]));
            const booking = await booking_service_1.bookingService.findByBookingCode('NL-CUSTOM');
            (0, vitest_1.expect)(booking).not.toBeNull();
            (0, vitest_1.expect)(booking?.bookingCode).toBe('NL-CUSTOM');
        });
    });
    (0, vitest_1.describe)('completeBooking', () => {
        (0, vitest_1.it)('completes booking and stores in localStorage', async () => {
            const contactDetails = {
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '9876543210',
            };
            const result = await booking_service_1.bookingService.completeBooking('NL-TEST', contactDetails);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('Booking completed successfully!');
            const completed = JSON.parse(localStorage.getItem('completedBookings') || '[]');
            (0, vitest_1.expect)(completed).toHaveLength(1);
            (0, vitest_1.expect)(completed[0].bookingCode).toBe('NL-TEST');
            (0, vitest_1.expect)(completed[0].contactDetails).toEqual(contactDetails);
        });
        (0, vitest_1.it)('stores multiple completed bookings', async () => {
            const contactDetails1 = {
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '9876543210',
            };
            const contactDetails2 = {
                fullName: 'Jane Smith',
                email: 'jane@example.com',
                phone: '9876543211',
            };
            await booking_service_1.bookingService.completeBooking('NL-TEST1', contactDetails1);
            await booking_service_1.bookingService.completeBooking('NL-TEST2', contactDetails2);
            const completed = JSON.parse(localStorage.getItem('completedBookings') || '[]');
            (0, vitest_1.expect)(completed).toHaveLength(2);
        });
    });
});
