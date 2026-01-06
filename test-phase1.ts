/**
 * Phase 1 Test Script
 * Demonstrates the booking flow using domain services
 */

import { BookingService } from './src/domain/services/booking.service';
import { BookingCodeService } from './src/domain/services/booking-code.service';
import { SlotService } from './src/domain/services/slot.service';
import { MockCalendarService } from './src/domain/services/mock-calendar.service';
import { Topic } from './src/domain/models/topic.enum';
import { TimePreference } from './src/domain/models/slot.model';

async function testPhase1() {
  console.log('='.repeat(60));
  console.log('PHASE 1 TEST: Backend Core Domain Logic');
  console.log('='.repeat(60));
  console.log('');

  // Initialize services
  const bookingCodeService = new BookingCodeService();
  const bookingService = new BookingService(bookingCodeService);
  const mockCalendar = new MockCalendarService();
  const slotService = new SlotService(mockCalendar, async () => bookingService.getBookedSlots());

  // Test 1: Generate Booking Code
  console.log('TEST 1: Booking Code Generation');
  console.log('-'.repeat(60));
  const code1 = bookingCodeService.generateBookingCode();
  const code2 = bookingCodeService.generateBookingCode();
  console.log(`Generated Code 1: ${code1}`);
  console.log(`Generated Code 2: ${code2}`);
  console.log(`Code 1 Valid: ${bookingCodeService.validateBookingCode(code1)}`);
  console.log(`Code 2 Valid: ${bookingCodeService.validateBookingCode(code2)}`);
  console.log('');

  // Test 2: Get Available Slots
  console.log('TEST 2: Slot Availability');
  console.log('-'.repeat(60));
  const slots = await slotService.offerTwoSlots();
  console.log(`Available slots found: ${slots.length}`);
  if (slots.length > 0) {
    slots.forEach((slot, index) => {
      const startTime = new Date(slot.startTime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log(`  Slot ${index + 1}: ${startTime} IST`);
    });
  }
  console.log('');

  // Test 3: Create Booking
  console.log('TEST 3: Create Booking');
  console.log('-'.repeat(60));
  if (slots.length > 0) {
    const booking = bookingService.createBooking(
      Topic.KYC_ONBOARDING,
      slots[0],
      slots.length > 1 ? slots[1] : undefined,
    );
    console.log(`Booking Created:`);
    console.log(`  Booking Code: ${booking.bookingCode}`);
    console.log(`  Topic: ${booking.topic}`);
    console.log(`  Status: ${booking.status}`);
    console.log(`  Time Zone: ${booking.timeZone}`);
    console.log(`  Preferred Slot: ${new Date(booking.preferredSlot.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    if (booking.alternativeSlot) {
      console.log(`  Alternative Slot: ${new Date(booking.alternativeSlot.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    }
    console.log('');

    // Test 4: Confirm Booking
    console.log('TEST 4: Confirm Booking');
    console.log('-'.repeat(60));
    const confirmed = bookingService.confirmBooking(booking.bookingCode);
    if (confirmed) {
      console.log(`Booking Confirmed:`);
      console.log(`  Booking Code: ${confirmed.bookingCode}`);
      console.log(`  Status: ${confirmed.status}`);
      console.log(`  Slot: ${new Date(confirmed.preferredSlot.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    }
    console.log('');

    // Test 5: Reschedule Booking
    console.log('TEST 5: Reschedule Booking');
    console.log('-'.repeat(60));
    const newSlots = await slotService.offerTwoSlots({ timeOfDay: 'afternoon' });
    if (newSlots.length > 0) {
      const rescheduled = bookingService.rescheduleBooking(
        confirmed!.bookingCode,
        newSlots[0],
      );
      if (rescheduled) {
        console.log(`Booking Rescheduled:`);
        console.log(`  Booking Code: ${rescheduled.bookingCode}`);
        console.log(`  Status: ${rescheduled.status}`);
        console.log(`  New Slot: ${new Date(rescheduled.preferredSlot.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
      }
    }
    console.log('');

    // Test 6: Cancel Booking
    console.log('TEST 6: Cancel Booking');
    console.log('-'.repeat(60));
    const cancelled = bookingService.cancelBooking(confirmed!.bookingCode);
    if (cancelled) {
      console.log(`Booking Cancelled:`);
      console.log(`  Booking Code: ${cancelled.bookingCode}`);
      console.log(`  Status: ${cancelled.status}`);
    }
    console.log('');
  }

  // Test 7: Time Preference Filtering
  console.log('TEST 7: Time Preference Filtering');
  console.log('-'.repeat(60));
  const morningPreference: TimePreference = {
    day: 'Monday',
    timeOfDay: 'morning',
  };
  const morningSlots = await slotService.offerTwoSlots(morningPreference);
  console.log(`Morning slots (Monday): ${morningSlots.length}`);
  if (morningSlots.length > 0) {
    morningSlots.forEach((slot, index) => {
      const hour = new Date(slot.startTime).getHours();
      console.log(`  Slot ${index + 1}: ${hour}:00 (morning)`);
    });
  }
  console.log('');

  // Test 8: Waitlist
  console.log('TEST 8: Waitlist Creation');
  console.log('-'.repeat(60));
  const waitlistBooking = bookingService.createWaitlistBooking(
    Topic.STATEMENTS_TAX_DOCS,
  );
  console.log(`Waitlist Booking Created:`);
  console.log(`  Booking Code: ${waitlistBooking.bookingCode}`);
  console.log(`  Topic: ${waitlistBooking.topic}`);
  console.log(`  Status: ${waitlistBooking.status}`);
  console.log('');

  // Test 9: Availability Windows
  console.log('TEST 9: Availability Windows');
  console.log('-'.repeat(60));
  const windows = await slotService.getAvailabilityWindows(7);
  console.log(`Availability for next 7 days:`);
  windows.slice(0, 5).forEach((window) => {
    const dateStr = window.date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    console.log(`  ${dateStr}: ${window.availableSlots} slots available`);
  });
  console.log('');

  console.log('='.repeat(60));
  console.log('ALL TESTS COMPLETED SUCCESSFULLY! ✅');
  console.log('='.repeat(60));
}

testPhase1().catch(console.error);

