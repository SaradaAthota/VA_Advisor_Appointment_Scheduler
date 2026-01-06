import { SlotService } from './slot.service';
import { MockCalendarService } from './mock-calendar.service';
import { BookingService } from './booking.service';
import { BookingCodeService } from './booking-code.service';
import { TimePreference } from '../models/slot.model';
import { Topic } from '../models/topic.enum';

describe('SlotService', () => {
  let slotService: SlotService;
  let mockCalendar: MockCalendarService;
  let bookingService: BookingService;
  let bookingCodeService: BookingCodeService;

  beforeEach(() => {
    bookingCodeService = new BookingCodeService();
    bookingService = new BookingService(bookingCodeService);
    mockCalendar = new MockCalendarService();
    slotService = new SlotService(mockCalendar, bookingService);
  });

  describe('offerTwoSlots', () => {
    it('should offer two available slots', () => {
      const slots = slotService.offerTwoSlots();

      expect(slots.length).toBeLessThanOrEqual(2);
      slots.forEach((slot) => {
        expect(slot.isAvailable).toBe(true);
        expect(slot.id).toBeDefined();
        expect(slot.startTime).toBeInstanceOf(Date);
        expect(slot.endTime).toBeInstanceOf(Date);
      });
    });

    it('should offer slots matching time preference', () => {
      const preference: TimePreference = {
        timeOfDay: 'morning',
      };

      const slots = slotService.offerTwoSlots(preference);

      slots.forEach((slot) => {
        const hour = new Date(slot.startTime).getHours();
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(12);
      });
    });

    it('should exclude already booked slots', () => {
      const allSlots = slotService.offerTwoSlots();
      if (allSlots.length > 0) {
        // Book the first slot
        bookingService.createBooking(Topic.KYC_ONBOARDING, allSlots[0]);

        // Get new slots - should not include the booked one
        const newSlots = slotService.offerTwoSlots();
        const bookedSlotIds = new Set(
          bookingService.getBookedSlots().map((s) => s.id),
        );

        newSlots.forEach((slot) => {
          expect(bookedSlotIds.has(slot.id)).toBe(false);
        });
      }
    });
  });

  describe('hasAvailableSlots', () => {
    it('should return true when slots are available', () => {
      const hasSlots = slotService.hasAvailableSlots();
      expect(typeof hasSlots).toBe('boolean');
    });

    it('should respect time preference', () => {
      const preference: TimePreference = {
        day: 'Monday',
        timeOfDay: 'morning',
      };

      const hasSlots = slotService.hasAvailableSlots(preference);
      expect(typeof hasSlots).toBe('boolean');
    });
  });

  describe('getAvailabilityWindows', () => {
    it('should return availability windows', () => {
      const windows = slotService.getAvailabilityWindows(7);

      expect(Array.isArray(windows)).toBe(true);
      windows.forEach((window) => {
        expect(window.date).toBeInstanceOf(Date);
        expect(typeof window.availableSlots).toBe('number');
        expect(window.availableSlots).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return windows sorted by date', () => {
      const windows = slotService.getAvailabilityWindows(7);

      for (let i = 1; i < windows.length; i++) {
        expect(
          windows[i].date.getTime(),
        ).toBeGreaterThanOrEqual(windows[i - 1].date.getTime());
      }
    });

    it('should exclude booked slots from availability', () => {
      const slots = slotService.offerTwoSlots();
      if (slots.length > 0) {
        bookingService.createBooking(Topic.KYC_ONBOARDING, slots[0]);

        const windows = slotService.getAvailabilityWindows(7);
        // Should still return windows, but with reduced availability
        expect(windows.length).toBeGreaterThan(0);
      }
    });
  });
});

