import { MockCalendarService } from './mock-calendar.service';
import { TimePreference } from '../models/slot.model';

describe('MockCalendarService', () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  describe('getAvailableSlots', () => {
    it('should return available slots for date range', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      const slots = service.getAvailableSlots(startDate, endDate);

      expect(slots.length).toBeGreaterThan(0);
      slots.forEach((slot) => {
        expect(slot.isAvailable).toBe(true);
        expect(slot.startTime).toBeInstanceOf(Date);
        expect(slot.endTime).toBeInstanceOf(Date);
      });
    });

    it('should skip weekends', () => {
      const startDate = new Date('2024-01-13'); // Saturday
      const endDate = new Date('2024-01-14'); // Sunday
      const slots = service.getAvailableSlots(startDate, endDate);

      // Should have no slots on weekends
      expect(slots.length).toBe(0);
    });

    it('should generate slots within business hours', () => {
      const startDate = new Date('2024-01-15'); // Monday
      const endDate = new Date('2024-01-15');
      const slots = service.getAvailableSlots(startDate, endDate);

      slots.forEach((slot) => {
        const hour = slot.startTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(18);
      });
    });
  });

  describe('findSlotsByPreference', () => {
    it('should filter slots by specific date', () => {
      const allSlots = service.getNextAvailableSlots(50);
      const targetDate = new Date(allSlots[0].startTime);

      const preference: TimePreference = {
        specificDate: targetDate,
      };

      const filtered = service.findSlotsByPreference(preference, allSlots);

      filtered.forEach((slot) => {
        const slotDate = new Date(slot.startTime);
        expect(slotDate.toDateString()).toBe(targetDate.toDateString());
      });
    });

    it('should filter slots by day of week', () => {
      const allSlots = service.getNextAvailableSlots(100);
      const preference: TimePreference = {
        day: 'Monday',
      };

      const filtered = service.findSlotsByPreference(preference, allSlots);

      filtered.forEach((slot) => {
        const dayOfWeek = new Date(slot.startTime).getDay();
        expect(dayOfWeek).toBe(1); // Monday = 1
      });
    });

    it('should filter slots by time of day - morning', () => {
      const allSlots = service.getNextAvailableSlots(50);
      const preference: TimePreference = {
        timeOfDay: 'morning',
      };

      const filtered = service.findSlotsByPreference(preference, allSlots);

      filtered.forEach((slot) => {
        const hour = new Date(slot.startTime).getHours();
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(12);
      });
    });

    it('should filter slots by time of day - afternoon', () => {
      const allSlots = service.getNextAvailableSlots(50);
      const preference: TimePreference = {
        timeOfDay: 'afternoon',
      };

      const filtered = service.findSlotsByPreference(preference, allSlots);

      filtered.forEach((slot) => {
        const hour = new Date(slot.startTime).getHours();
        expect(hour).toBeGreaterThanOrEqual(12);
        expect(hour).toBeLessThan(17);
      });
    });

    it('should filter slots by time of day - evening', () => {
      const allSlots = service.getNextAvailableSlots(50);
      const preference: TimePreference = {
        timeOfDay: 'evening',
      };

      const filtered = service.findSlotsByPreference(preference, allSlots);

      filtered.forEach((slot) => {
        const hour = new Date(slot.startTime).getHours();
        expect(hour).toBeGreaterThanOrEqual(17);
        expect(hour).toBeLessThan(18);
      });
    });
  });

  describe('getNextAvailableSlots', () => {
    it('should return requested number of slots', () => {
      const slots = service.getNextAvailableSlots(5);
      expect(slots.length).toBe(5);
    });

    it('should return only available slots', () => {
      const slots = service.getNextAvailableSlots(10);
      slots.forEach((slot) => {
        expect(slot.isAvailable).toBe(true);
      });
    });
  });

  describe('getTimeZone', () => {
    it('should return IST timezone', () => {
      expect(service.getTimeZone()).toBe('IST');
    });
  });
});

