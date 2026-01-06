import { Topic } from '../../domain/models/topic.enum';
import { BookingStatus } from '../../domain/models/booking-status.enum';

export class SlotDto {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAvailable: boolean;
}

export class BookingResponseDto {
  id: string;
  bookingCode: string;
  topic: Topic;
  preferredSlot: SlotDto;
  alternativeSlot?: SlotDto;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  timeZone: string;
}

