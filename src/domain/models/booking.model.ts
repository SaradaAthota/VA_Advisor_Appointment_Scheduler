import { Topic } from './topic.enum';
import { BookingStatus } from './booking-status.enum';
import { Slot } from './slot.model';

export interface Booking {
  id: string;
  bookingCode: string;
  topic: Topic;
  preferredSlot: Slot;
  alternativeSlot?: Slot;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  secureLink?: string;
  timeZone: string; // e.g., "IST"
}

