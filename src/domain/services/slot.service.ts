import { Slot, TimePreference } from '../models/slot.model';
import { MockCalendarService } from './mock-calendar.service';

export class SlotService {
  private mockCalendar: MockCalendarService;
  private getBookedSlotsFn: () => Promise<Slot[]>;

  constructor(
    mockCalendar: MockCalendarService,
    getBookedSlotsFn: () => Promise<Slot[]>,
  ) {
    this.mockCalendar = mockCalendar;
    this.getBookedSlotsFn = getBookedSlotsFn;
  }

  /**
   * Offers two available slots based on time preference
   * Only returns slots that are:
   * - Available (isAvailable: true)
   * - Not already booked
   * - In the future (not in the past)
   */
  async offerTwoSlots(preference?: TimePreference): Promise<Slot[]> {
    const bookedSlots = await this.getBookedSlotsFn();
    const now = new Date();
    let availableSlots: Slot[];

    if (preference) {
      const allSlots = this.mockCalendar.getNextAvailableSlots(50);
      availableSlots = this.mockCalendar.findSlotsByPreference(
        preference,
        allSlots,
      );
    } else {
      availableSlots = this.mockCalendar.getNextAvailableSlots(20);
    }

    // Filter out already booked slots
    const bookedSlotIds = new Set(bookedSlots.map((s) => s.id));
    
    // Explicit validation: Only return slots that are:
    // 1. Available (isAvailable: true)
    // 2. Not already booked
    // 3. In the future (startTime > now)
    availableSlots = availableSlots.filter((slot) => {
      const isNotBooked = !bookedSlotIds.has(slot.id);
      const isAvailable = slot.isAvailable === true;
      const isInFuture = new Date(slot.startTime) > now;
      
      return isNotBooked && isAvailable && isInFuture;
    });

    // Return first two available slots
    return availableSlots.slice(0, 2);
  }

  /**
   * Offers multiple available slots (up to count) for alternative options
   * Only returns slots that are:
   * - Available (isAvailable: true)
   * - Not already booked
   * - In the future (not in the past)
   * Note: The getBookedSlotsFn can exclude specific bookings (for reschedule)
   */
  async offerMultipleSlots(count: number = 5, preference?: TimePreference): Promise<Slot[]> {
    const bookedSlots = await this.getBookedSlotsFn();
    const now = new Date();
    let availableSlots: Slot[];

    if (preference) {
      const allSlots = this.mockCalendar.getNextAvailableSlots(50);
      availableSlots = this.mockCalendar.findSlotsByPreference(
        preference,
        allSlots,
      );
    } else {
      // Get more slots for reschedule scenarios (when count > 10)
      const slotPoolSize = count > 10 ? 100 : 20;
      availableSlots = this.mockCalendar.getNextAvailableSlots(slotPoolSize);
    }

    // Filter out already booked slots
    // Note: getBookedSlotsFn already excludes the current booking if excludeBookingCode was provided
    const bookedSlotIds = new Set(bookedSlots.map((s) => s.id));
    
    // Explicit validation: Only return slots that are:
    // 1. Available (isAvailable: true)
    // 2. Not already booked
    // 3. In the future (startTime > now)
    availableSlots = availableSlots.filter((slot) => {
      const isNotBooked = !bookedSlotIds.has(slot.id);
      const isAvailable = slot.isAvailable === true;
      const isInFuture = new Date(slot.startTime) > now;
      
      return isNotBooked && isAvailable && isInFuture;
    });

    // Return up to count available slots
    return availableSlots.slice(0, count);
  }

  /**
   * Checks if there are any available slots matching the preference
   */
  async hasAvailableSlots(preference?: TimePreference): Promise<boolean> {
    const slots = await this.offerTwoSlots(preference);
    return slots.length > 0;
  }

  /**
   * Gets availability windows (for "check availability" intent)
   */
  async getAvailabilityWindows(daysAhead: number = 14): Promise<{
    date: Date;
    availableSlots: number;
  }[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);

    const allSlots = this.mockCalendar.getAvailableSlots(today, endDate);
    const bookedSlots = await this.getBookedSlotsFn();
    const bookedSlotIds = new Set(bookedSlots.map((s) => s.id));

    const availableSlots = allSlots.filter(
      (slot) => !bookedSlotIds.has(slot.id),
    );

    // Group by date
    const slotsByDate = new Map<string, Slot[]>();
    for (const slot of availableSlots) {
      const dateKey = new Date(slot.startTime).toDateString();
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(slot);
    }

    // Convert to array
    const windows: { date: Date; availableSlots: number }[] = [];
    for (const [dateKey, slots] of slotsByDate.entries()) {
      windows.push({
        date: new Date(dateKey),
        availableSlots: slots.length,
      });
    }

    return windows.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

