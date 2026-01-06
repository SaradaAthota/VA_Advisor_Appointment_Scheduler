import { Slot, TimePreference } from '../models/slot.model';

export class MockCalendarService {
  private readonly businessHours = {
    start: 9, // 9 AM
    end: 18, // 6 PM
  };

  private readonly slotDurationMinutes = 30;
  private readonly timeZone = 'IST';

  /**
   * Gets available slots for a given date range
   * In a real implementation, this would query a calendar API
   */
  getAvailableSlots(startDate: Date, endDate: Date): Slot[] {
    const slots: Slot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Generate slots for business hours
      for (let hour = this.businessHours.start; hour < this.businessHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += this.slotDurationMinutes) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + this.slotDurationMinutes);

          // Mock: Randomly mark some slots as unavailable (70% available)
          const isAvailable = Math.random() > 0.3;

          slots.push({
            id: `slot-${slotStart.getTime()}`,
            startTime: slotStart,
            endTime: slotEnd,
            isAvailable,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots.filter((slot) => slot.isAvailable);
  }

  /**
   * Finds slots matching time preference
   */
  findSlotsByPreference(
    preference: TimePreference,
    availableSlots: Slot[],
  ): Slot[] {
    let filtered = [...availableSlots];

    if (preference.specificDate) {
      const targetDate = new Date(preference.specificDate);
      filtered = filtered.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return (
          slotDate.getDate() === targetDate.getDate() &&
          slotDate.getMonth() === targetDate.getMonth() &&
          slotDate.getFullYear() === targetDate.getFullYear()
        );
      });
    } else if (preference.day) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const targetDayIndex = dayNames.findIndex(
        (d) => d.toLowerCase() === preference.day!.toLowerCase(),
      );

      if (targetDayIndex !== -1) {
        filtered = filtered.filter((slot) => {
          return new Date(slot.startTime).getDay() === targetDayIndex;
        });
      }
    }

    if (preference.timeOfDay) {
      filtered = filtered.filter((slot) => {
        const hour = new Date(slot.startTime).getHours();
        switch (preference.timeOfDay) {
          case 'morning':
            return hour >= 9 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 18;
          default:
            return true;
        }
      });
    }

    return filtered;
  }

  /**
   * Gets the next N available slots from today
   */
  getNextAvailableSlots(count: number = 10): Slot[] {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14); // Look ahead 2 weeks

    const allSlots = this.getAvailableSlots(today, endDate);
    return allSlots.slice(0, count);
  }

  /**
   * Checks if a specific slot is available
   */
  isSlotAvailable(slotId: string, allBookedSlots: Slot[]): boolean {
    return !allBookedSlots.some((booked) => booked.id === slotId);
  }

  getTimeZone(): string {
    return this.timeZone;
  }
}

