import { describe, it, expect, beforeEach } from 'vitest';
import { bookingService } from './booking.service';

describe('BookingService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('validateBookingCode', () => {
    it('validates correct booking code format', () => {
      expect(bookingService.validateBookingCode('NL-A742')).toBe(true);
      expect(bookingService.validateBookingCode('NL-1234')).toBe(true);
      expect(bookingService.validateBookingCode('NL-ABCD')).toBe(true);
    });

    it('rejects invalid booking code format', () => {
      expect(bookingService.validateBookingCode('NL-123')).toBe(false);
      expect(bookingService.validateBookingCode('NL-12345')).toBe(false);
      expect(bookingService.validateBookingCode('ABC-1234')).toBe(false);
      expect(bookingService.validateBookingCode('')).toBe(false);
    });
  });

  describe('findByBookingCode', () => {
    it('returns mock booking for NL-TEST', async () => {
      const booking = await bookingService.findByBookingCode('NL-TEST');

      expect(booking).not.toBeNull();
      expect(booking?.bookingCode).toBe('NL-TEST');
      expect(booking?.topic).toBe('KYC/Onboarding');
      expect(booking?.status).toBe('TENTATIVE');
    });

    it('returns null for non-existent booking code', async () => {
      const booking = await bookingService.findByBookingCode('NL-INVALID');
      expect(booking).toBeNull();
    });

    it('returns booking from localStorage if available', async () => {
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

      const booking = await bookingService.findByBookingCode('NL-CUSTOM');
      expect(booking).not.toBeNull();
      expect(booking?.bookingCode).toBe('NL-CUSTOM');
    });
  });

  describe('completeBooking', () => {
    it('completes booking and stores in localStorage', async () => {
      const contactDetails = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
      };

      const result = await bookingService.completeBooking('NL-TEST', contactDetails);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Booking completed successfully!');

      const completed = JSON.parse(localStorage.getItem('completedBookings') || '[]');
      expect(completed).toHaveLength(1);
      expect(completed[0].bookingCode).toBe('NL-TEST');
      expect(completed[0].contactDetails).toEqual(contactDetails);
    });

    it('stores multiple completed bookings', async () => {
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

      await bookingService.completeBooking('NL-TEST1', contactDetails1);
      await bookingService.completeBooking('NL-TEST2', contactDetails2);

      const completed = JSON.parse(localStorage.getItem('completedBookings') || '[]');
      expect(completed).toHaveLength(2);
    });
  });
});

