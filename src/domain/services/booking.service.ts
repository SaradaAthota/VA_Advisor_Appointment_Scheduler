import { Booking } from '../models/booking.model';
import { BookingStatus } from '../models/booking-status.enum';
import { Topic } from '../models/topic.enum';
import { Slot } from '../models/slot.model';
import { BookingCodeService } from './booking-code.service';

export class BookingService {
  private bookings: Map<string, Booking> = new Map();
  private bookingCodeService: BookingCodeService;

  constructor(bookingCodeService: BookingCodeService) {
    this.bookingCodeService = bookingCodeService;
  }

  /**
   * Creates a new tentative booking
   */
  createBooking(
    topic: Topic,
    preferredSlot: Slot,
    alternativeSlot?: Slot,
  ): Booking {
    const bookingCode = this.bookingCodeService.generateBookingCode();
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const booking: Booking = {
      id: bookingId,
      bookingCode,
      topic,
      preferredSlot,
      alternativeSlot,
      status: BookingStatus.TENTATIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      timeZone: 'IST',
    };

    this.bookings.set(bookingId, booking);
    return booking;
  }

  /**
   * Confirms a booking (changes status from TENTATIVE to CONFIRMED)
   */
  confirmBooking(bookingCode: string): Booking | null {
    const booking = this.findByBookingCode(bookingCode);
    if (!booking || booking.status === BookingStatus.CANCELLED) {
      return null;
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.updatedAt = new Date();
    return booking;
  }

  /**
   * Reschedules a booking to a new slot
   */
  rescheduleBooking(
    bookingCode: string,
    newPreferredSlot: Slot,
    newAlternativeSlot?: Slot,
  ): Booking | null {
    const booking = this.findByBookingCode(bookingCode);
    if (!booking || booking.status === BookingStatus.CANCELLED) {
      return null;
    }

    booking.preferredSlot = newPreferredSlot;
    booking.alternativeSlot = newAlternativeSlot;
    booking.status = BookingStatus.RESCHEDULED;
    booking.updatedAt = new Date();

    return booking;
  }

  /**
   * Cancels a booking
   */
  cancelBooking(bookingCode: string): Booking | null {
    const booking = this.findByBookingCode(bookingCode);
    if (!booking) {
      return null;
    }

    booking.status = BookingStatus.CANCELLED;
    booking.updatedAt = new Date();
    return booking;
  }

  /**
   * Finds a booking by booking code
   */
  findByBookingCode(bookingCode: string): Booking | null {
    for (const booking of this.bookings.values()) {
      if (booking.bookingCode === bookingCode) {
        return booking;
      }
    }
    return null;
  }

  /**
   * Finds a booking by ID
   */
  findById(bookingId: string): Booking | null {
    return this.bookings.get(bookingId) || null;
  }

  /**
   * Gets all bookings (for testing/admin purposes)
   */
  getAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  /**
   * Creates a waitlist entry when no slots are available
   */
  createWaitlistBooking(topic: Topic): Booking {
    const bookingCode = this.bookingCodeService.generateBookingCode();
    const bookingId = `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create a placeholder slot for waitlist
    const placeholderSlot: Slot = {
      id: 'waitlist-placeholder',
      startTime: new Date(),
      endTime: new Date(),
      isAvailable: false,
    };

    const booking: Booking = {
      id: bookingId,
      bookingCode,
      topic,
      preferredSlot: placeholderSlot,
      status: BookingStatus.WAITLISTED,
      createdAt: new Date(),
      updatedAt: new Date(),
      timeZone: 'IST',
    };

    this.bookings.set(bookingId, booking);
    return booking;
  }

  /**
   * Gets all booked slots (for availability checking)
   */
  getBookedSlots(): Slot[] {
    const bookedSlots: Slot[] = [];
    for (const booking of this.bookings.values()) {
      if (
        booking.status !== BookingStatus.CANCELLED &&
        booking.status !== BookingStatus.WAITLISTED
      ) {
        bookedSlots.push(booking.preferredSlot);
        if (booking.alternativeSlot) {
          bookedSlots.push(booking.alternativeSlot);
        }
      }
    }
    return bookedSlots;
  }
}

