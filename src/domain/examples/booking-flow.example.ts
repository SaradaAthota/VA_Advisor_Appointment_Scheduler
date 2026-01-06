/**
 * Example demonstrating the booking flow using domain services
 * This is for Phase 1 - Backend Core demonstration
 */

import { BookingService } from '../services/booking.service';
import { BookingCodeService } from '../services/booking-code.service';
import { SlotService } from '../services/slot.service';
import { MockCalendarService } from '../services/mock-calendar.service';
import { Topic } from '../models/topic.enum';
import { TimePreference } from '../models/slot.model';

export async function demonstrateBookingFlow() {
  // Initialize services
  const bookingCodeService = new BookingCodeService();
  const bookingService = new BookingService(bookingCodeService);
  const mockCalendar = new MockCalendarService();
  const slotService = new SlotService(mockCalendar, async () => bookingService.getBookedSlots());

  console.log('=== Booking Flow Demonstration ===\n');

  // Step 1: User provides topic and time preference
  const topic = Topic.KYC_ONBOARDING;
  const preference: TimePreference = {
    day: 'Monday',
    timeOfDay: 'morning',
  };

  console.log(`1. User wants to book: ${topic}`);
  console.log(`   Preference: ${preference.day} ${preference.timeOfDay}\n`);

  // Step 2: Offer two slots
  const availableSlots = await slotService.offerTwoSlots(preference);
  console.log(`2. Available slots offered:`);
  availableSlots.forEach((slot, index) => {
    const startTime = new Date(slot.startTime).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });
    console.log(`   Option ${index + 1}: ${startTime} IST`);
  });
  console.log('');

  if (availableSlots.length === 0) {
    // Step 3a: No slots available - create waitlist
    console.log('3. No slots available - creating waitlist entry');
    const waitlistBooking = bookingService.createWaitlistBooking(topic);
    console.log(`   Waitlist Booking Code: ${waitlistBooking.bookingCode}`);
    return;
  }

  // Step 3: User confirms first slot
  const selectedSlot = availableSlots[0];
  const alternativeSlot = availableSlots.length > 1 ? availableSlots[1] : undefined;

  console.log(`3. User confirms slot: ${new Date(selectedSlot.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`);

  // Step 4: Create tentative booking
  const booking = bookingService.createBooking(topic, selectedSlot, alternativeSlot);
  console.log(`4. Tentative booking created:`);
  console.log(`   Booking Code: ${booking.bookingCode}`);
  console.log(`   Status: ${booking.status}`);
  console.log(`   Topic: ${booking.topic}`);
  console.log(`   Time Zone: ${booking.timeZone}\n`);

  // Step 5: Confirm booking
  const confirmedBooking = bookingService.confirmBooking(booking.bookingCode);
  if (confirmedBooking) {
    console.log(`5. Booking confirmed:`);
    console.log(`   Booking Code: ${confirmedBooking.bookingCode}`);
    console.log(`   Status: ${confirmedBooking.status}`);
    console.log(`   Slot: ${new Date(confirmedBooking.preferredSlot.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`);
  }

  // Step 6: Demonstrate reschedule
  console.log('6. User wants to reschedule...');
  const newSlots = await slotService.offerTwoSlots({ timeOfDay: 'afternoon' });
  if (newSlots.length > 0) {
    const rescheduled = bookingService.rescheduleBooking(
      confirmedBooking!.bookingCode,
      newSlots[0],
    );
    if (rescheduled) {
      console.log(`   Rescheduled to: ${new Date(rescheduled.preferredSlot.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
      console.log(`   New Status: ${rescheduled.status}\n`);
    }
  }

  // Step 7: Demonstrate cancel
  console.log('7. User cancels booking...');
  const cancelled = bookingService.cancelBooking(confirmedBooking!.bookingCode);
  if (cancelled) {
    console.log(`   Booking ${cancelled.bookingCode} cancelled`);
    console.log(`   Status: ${cancelled.status}\n`);
  }

  // Step 8: Check availability windows
  console.log('8. Checking availability windows (next 7 days):');
  const windows = await slotService.getAvailabilityWindows(7);
  windows.slice(0, 5).forEach((window) => {
    const dateStr = window.date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    console.log(`   ${dateStr}: ${window.availableSlots} slots available`);
  });
}

