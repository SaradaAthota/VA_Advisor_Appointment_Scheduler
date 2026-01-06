import { BookingService } from './booking.service';
import { BookingCodeService } from './booking-code.service';
import { Topic } from '../models/topic.enum';
import { BookingStatus } from '../models/booking-status.enum';
import { Slot } from '../models/slot.model';

describe('BookingService', () => {
  let bookingService: BookingService;
  let bookingCodeService: BookingCodeService;

  beforeEach(() => {
    bookingCodeService = new BookingCodeService();
    bookingService = new BookingService(bookingCodeService);
  });

  describe('createBooking', () => {
    it('should create a tentative booking', () => {
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const booking = bookingService.createBooking(Topic.KYC_ONBOARDING, slot);

      expect(booking).toBeDefined();
      expect(booking.status).toBe(BookingStatus.TENTATIVE);
      expect(booking.topic).toBe(Topic.KYC_ONBOARDING);
      expect(booking.bookingCode).toMatch(/^NL-[A-Z0-9]{4}$/);
      expect(booking.preferredSlot).toEqual(slot);
      expect(booking.timeZone).toBe('IST');
    });

    it('should create booking with alternative slot', () => {
      const preferredSlot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const alternativeSlot: Slot = {
        id: 'slot-2',
        startTime: new Date('2024-01-15T14:00:00'),
        endTime: new Date('2024-01-15T14:30:00'),
        isAvailable: true,
      };

      const booking = bookingService.createBooking(
        Topic.SIP_MANDATES,
        preferredSlot,
        alternativeSlot,
      );

      expect(booking.alternativeSlot).toEqual(alternativeSlot);
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a tentative booking', () => {
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const booking = bookingService.createBooking(Topic.KYC_ONBOARDING, slot);
      const confirmed = bookingService.confirmBooking(booking.bookingCode);

      expect(confirmed).toBeDefined();
      expect(confirmed!.status).toBe(BookingStatus.CONFIRMED);
      expect(confirmed!.id).toBe(booking.id);
    });

    it('should return null for non-existent booking code', () => {
      const confirmed = bookingService.confirmBooking('NL-INVALID');
      expect(confirmed).toBeNull();
    });

    it('should not confirm a cancelled booking', () => {
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const booking = bookingService.createBooking(Topic.KYC_ONBOARDING, slot);
      bookingService.cancelBooking(booking.bookingCode);
      const confirmed = bookingService.confirmBooking(booking.bookingCode);

      expect(confirmed).toBeNull();
    });
  });

  describe('rescheduleBooking', () => {
    it('should reschedule a booking', () => {
      const originalSlot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const newSlot: Slot = {
        id: 'slot-2',
        startTime: new Date('2024-01-16T14:00:00'),
        endTime: new Date('2024-01-16T14:30:00'),
        isAvailable: true,
      };

      const booking = bookingService.createBooking(
        Topic.KYC_ONBOARDING,
        originalSlot,
      );
      const rescheduled = bookingService.rescheduleBooking(
        booking.bookingCode,
        newSlot,
      );

      expect(rescheduled).toBeDefined();
      expect(rescheduled!.preferredSlot).toEqual(newSlot);
      expect(rescheduled!.status).toBe(BookingStatus.RESCHEDULED);
    });

    it('should return null for non-existent booking code', () => {
      const newSlot: Slot = {
        id: 'slot-2',
        startTime: new Date('2024-01-16T14:00:00'),
        endTime: new Date('2024-01-16T14:30:00'),
        isAvailable: true,
      };

      const rescheduled = bookingService.rescheduleBooking(
        'NL-INVALID',
        newSlot,
      );
      expect(rescheduled).toBeNull();
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', () => {
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const booking = bookingService.createBooking(Topic.KYC_ONBOARDING, slot);
      const cancelled = bookingService.cancelBooking(booking.bookingCode);

      expect(cancelled).toBeDefined();
      expect(cancelled!.status).toBe(BookingStatus.CANCELLED);
    });

    it('should return null for non-existent booking code', () => {
      const cancelled = bookingService.cancelBooking('NL-INVALID');
      expect(cancelled).toBeNull();
    });
  });

  describe('findByBookingCode', () => {
    it('should find booking by code', () => {
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const booking = bookingService.createBooking(Topic.KYC_ONBOARDING, slot);
      const found = bookingService.findByBookingCode(booking.bookingCode);

      expect(found).toBeDefined();
      expect(found!.id).toBe(booking.id);
    });

    it('should return null for non-existent code', () => {
      const found = bookingService.findByBookingCode('NL-INVALID');
      expect(found).toBeNull();
    });
  });

  describe('createWaitlistBooking', () => {
    it('should create a waitlisted booking', () => {
      const booking = bookingService.createWaitlistBooking(
        Topic.STATEMENTS_TAX_DOCS,
      );

      expect(booking).toBeDefined();
      expect(booking.status).toBe(BookingStatus.WAITLISTED);
      expect(booking.topic).toBe(Topic.STATEMENTS_TAX_DOCS);
      expect(booking.bookingCode).toMatch(/^NL-[A-Z0-9]{4}$/);
    });
  });

  describe('getBookedSlots', () => {
    it('should return all booked slots excluding cancelled and waitlisted', () => {
      const slot1: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00'),
        isAvailable: true,
      };

      const slot2: Slot = {
        id: 'slot-2',
        startTime: new Date('2024-01-15T11:00:00'),
        endTime: new Date('2024-01-15T11:30:00'),
        isAvailable: true,
      };

      bookingService.createBooking(Topic.KYC_ONBOARDING, slot1);
      bookingService.createBooking(Topic.SIP_MANDATES, slot2);
      bookingService.createWaitlistBooking(Topic.STATEMENTS_TAX_DOCS);

      const bookedSlots = bookingService.getBookedSlots();
      expect(bookedSlots.length).toBe(2);
      expect(bookedSlots).toContainEqual(slot1);
      expect(bookedSlots).toContainEqual(slot2);
    });
  });
});

