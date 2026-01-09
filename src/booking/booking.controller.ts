import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CompleteBookingDto } from './dto/complete-booking.dto';
import { CreateTestBookingDto } from './dto/create-test-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { Slot } from '../domain/models/slot.model';
import { Booking } from '../domain/models/booking.model';
import { MockCalendarService } from '../domain/services/mock-calendar.service';
import { SlotService } from '../domain/services/slot.service';
import { BookingService as DomainBookingService } from '../domain/services/booking.service';
import { BookingCodeService } from '../domain/services/booking-code.service';

@Controller('bookings')
export class BookingController {
  private mockCalendar: MockCalendarService;
  private slotService: SlotService;
  private domainBookingService: DomainBookingService;

  constructor(private readonly bookingService: BookingService) {
    this.mockCalendar = new MockCalendarService();
    const bookingCodeService = new BookingCodeService();
    this.domainBookingService = new DomainBookingService(bookingCodeService);
    this.slotService = new SlotService(
      this.mockCalendar,
      async () => await this.bookingService.getBookedSlots(),
    );
  }

  @Get(':bookingCode')
  async findByBookingCode(
    @Param('bookingCode') bookingCode: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingService.findByBookingCode(bookingCode);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if booking is cancelled
    if (booking.status === 'CANCELLED') {
      throw new HttpException(
        'This booking has been cancelled',
        HttpStatus.GONE,
      );
    }

    return this.mapToResponseDto(booking);
  }

  @Post(':bookingCode/complete')
  async completeBooking(
    @Param('bookingCode') bookingCode: string,
    @Body() completeBookingDto: CompleteBookingDto,
  ): Promise<{ success: boolean; message: string }> {
    const booking = await this.bookingService.findByBookingCode(bookingCode);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new HttpException(
        'Cannot complete a cancelled booking',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Complete the booking with contact details
    await this.bookingService.completeBooking(
      bookingCode,
      completeBookingDto.contactDetails,
    );

    return {
      success: true,
      message: 'Booking completed successfully',
    };
  }

  @Post('create')
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    try {
      // Convert DTO slots to domain Slot objects
      const preferredSlot: Slot = {
        id: createBookingDto.preferredSlot.id,
        startTime: new Date(createBookingDto.preferredSlot.startTime),
        endTime: new Date(createBookingDto.preferredSlot.endTime),
        isAvailable: createBookingDto.preferredSlot.isAvailable,
      };

      const alternativeSlot: Slot | undefined = createBookingDto.alternativeSlot
        ? {
            id: createBookingDto.alternativeSlot.id,
            startTime: new Date(createBookingDto.alternativeSlot.startTime),
            endTime: new Date(createBookingDto.alternativeSlot.endTime),
            isAvailable: createBookingDto.alternativeSlot.isAvailable,
          }
        : undefined;

      // Check if preferred slot is already booked (using database)
      const bookedSlots = await this.bookingService.getBookedSlots();
      const isPreferredSlotBooked = bookedSlots.some(
        (booked) => booked.id === preferredSlot.id,
      );

      if (isPreferredSlotBooked) {
        throw new HttpException(
          'Preferred slot is already booked. Please choose another slot.',
          HttpStatus.CONFLICT,
        );
      }

      // Check for Sunday booking
      if (preferredSlot.startTime.getDay() === 0) {
        throw new HttpException(
          'Bookings are not available on Sundays',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create booking with validation
      const booking = await this.bookingService.createBooking(
        createBookingDto.topic,
        preferredSlot,
        alternativeSlot,
      );

      return this.mapToResponseDto(booking);
    } catch (error) {
      if (error.message.includes('already booked')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      if (error.message.includes('Sundays')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        error.message || 'Failed to create booking',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('offer-slots')
  async offerSlots(
    @Body() body: { topic?: string; day?: string; timeOfDay?: string; excludeBookingCode?: string },
  ): Promise<{ slots: BookingResponseDto['preferredSlot'][]; waitlist?: boolean }> {
    const preference = body.day || body.timeOfDay
      ? {
          day: body.day,
          timeOfDay: body.timeOfDay === 'any' 
            ? undefined 
            : (body.timeOfDay as 'morning' | 'afternoon' | 'evening' | undefined),
        }
      : undefined;

    // For reschedule, create a SlotService instance that excludes the current booking
    // This allows showing slots on the same date as the current booking
    const getBookedSlotsFn = body.excludeBookingCode
      ? async () => await this.bookingService.getBookedSlots(body.excludeBookingCode)
      : async () => await this.bookingService.getBookedSlots();
    
    const slotServiceForRequest = new SlotService(
      this.mockCalendar,
      getBookedSlotsFn,
    );

    // For reschedule, get more slots (20) to give user more options
    const slotCount = body.excludeBookingCode ? 20 : 5;
    const availableSlots = await slotServiceForRequest.offerMultipleSlots(
      slotCount, 
      preference,
    );

    if (availableSlots.length === 0) {
      // No slots available - create waitlist booking
      const waitlistBooking = await this.bookingService.createWaitlistBooking(
        body.topic as any,
      );
      return {
        slots: [],
        waitlist: true,
      };
    }

    // Ensure all returned slots are explicitly marked as available
    const validatedSlots = availableSlots
      .filter((slot) => {
        // Double-check: only return slots that are available
        return slot.isAvailable === true && new Date(slot.startTime) > new Date();
      })
      .map((slot) => ({
        id: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        isAvailable: true, // Explicitly set to true - all returned slots are available
      }));

    return {
      slots: validatedSlots,
      waitlist: false,
    };
  }

  @Post(':bookingCode/cancel')
  async cancelBooking(
    @Param('bookingCode') bookingCode: string,
  ): Promise<{ success: boolean; message: string }> {
    const booking = await this.bookingService.findByBookingCode(bookingCode);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new HttpException(
        'This booking is already cancelled',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cancel the booking
    await this.bookingService.cancelBooking(bookingCode);

    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  }

  @Post(':bookingCode/reschedule')
  async rescheduleBooking(
    @Param('bookingCode') bookingCode: string,
    @Body() rescheduleBookingDto: RescheduleBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingService.findByBookingCode(bookingCode);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new HttpException(
        'Cannot reschedule a cancelled booking',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Convert DTO slots to domain Slot objects
    const newPreferredSlot: Slot = {
      id: rescheduleBookingDto.newPreferredSlot.id,
      startTime: new Date(rescheduleBookingDto.newPreferredSlot.startTime),
      endTime: new Date(rescheduleBookingDto.newPreferredSlot.endTime),
      isAvailable: rescheduleBookingDto.newPreferredSlot.isAvailable,
    };

    const newAlternativeSlot: Slot | undefined = rescheduleBookingDto.newAlternativeSlot
      ? {
          id: rescheduleBookingDto.newAlternativeSlot.id,
          startTime: new Date(rescheduleBookingDto.newAlternativeSlot.startTime),
          endTime: new Date(rescheduleBookingDto.newAlternativeSlot.endTime),
          isAvailable: rescheduleBookingDto.newAlternativeSlot.isAvailable,
        }
      : undefined;

    try {
      // Reschedule the booking with validation
      await this.bookingService.rescheduleBooking(
        bookingCode,
        newPreferredSlot,
        newAlternativeSlot,
      );

      // Get updated booking
      const updatedBooking = await this.bookingService.findByBookingCode(bookingCode);
      return this.mapToResponseDto(updatedBooking!);
    } catch (error) {
      if (error.message.includes('already booked')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      if (error.message.includes('Sundays')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      if (error.message.includes('cancelled')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        error.message || 'Failed to reschedule booking',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('debug/all')
  async getAllBookings(): Promise<{ count: number; bookings: BookingResponseDto[] }> {
    try {
      // Debug endpoint to see all bookings in database
      // This helps verify if bookings exist after server restart
      const entities = await this.bookingService.getAllBookingsFromDb();
      
      // Simplify: just return the entities directly without complex mapping
      return {
        count: entities.length,
        bookings: entities.map((entity) => ({
          bookingCode: entity.bookingCode,
          status: entity.status,
          topic: entity.topic,
          preferredSlotStartTime: entity.preferredSlotStartTime,
          preferredSlotEndTime: entity.preferredSlotEndTime,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        })),
      };
    } catch (error) {
      console.error('Error in getAllBookings:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test/create')
  async createTestBooking(
    @Body() createTestBookingDto: CreateTestBookingDto,
  ): Promise<BookingResponseDto> {
    // Create a test booking for development/testing
    const slots = this.mockCalendar.getNextAvailableSlots(2);
    if (slots.length < 2) {
      throw new HttpException(
        'Not enough available slots for test booking',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const booking = await this.bookingService.createTestBooking(
      createTestBookingDto.topic,
      slots[0],
      slots[1],
    );

    return this.mapToResponseDto(booking);
  }

  private mapToResponseDto(booking: any): BookingResponseDto {
    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      topic: booking.topic,
      preferredSlot: {
        id: booking.preferredSlot.id,
        startTime: booking.preferredSlot.startTime.toISOString(),
        endTime: booking.preferredSlot.endTime.toISOString(),
        isAvailable: booking.preferredSlot.isAvailable,
      },
      alternativeSlot: booking.alternativeSlot
        ? {
          id: booking.alternativeSlot.id,
          startTime: booking.alternativeSlot.startTime.toISOString(),
          endTime: booking.alternativeSlot.endTime.toISOString(),
          isAvailable: booking.alternativeSlot.isAvailable,
        }
        : undefined,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      timeZone: booking.timeZone,
    };
  }
}

