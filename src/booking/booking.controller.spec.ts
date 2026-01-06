import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, HttpException } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Topic } from '../domain/models/topic.enum';
import { BookingStatus } from '../domain/models/booking-status.enum';
import { Slot } from '../domain/models/slot.model';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBooking = {
    id: 'booking-1',
    bookingCode: 'NL-A742',
    topic: Topic.KYC_ONBOARDING,
    preferredSlot: {
      id: 'slot-1',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T10:30:00Z'),
      isAvailable: true,
    },
    alternativeSlot: {
      id: 'slot-2',
      startTime: new Date('2024-01-15T14:00:00Z'),
      endTime: new Date('2024-01-15T14:30:00Z'),
      isAvailable: true,
    },
    status: BookingStatus.TENTATIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    timeZone: 'IST',
  };

  const mockBookingService = {
    findByBookingCode: jest.fn(),
    completeBooking: jest.fn(),
    createTestBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByBookingCode', () => {
    it('should return a booking', async () => {
      mockBookingService.findByBookingCode.mockResolvedValue(mockBooking);

      const result = await controller.findByBookingCode('NL-A742');

      expect(result).toBeDefined();
      expect(result.bookingCode).toBe('NL-A742');
      expect(result.topic).toBe(Topic.KYC_ONBOARDING);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingService.findByBookingCode.mockResolvedValue(null);

      await expect(controller.findByBookingCode('NL-INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw HttpException when booking is cancelled', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      mockBookingService.findByBookingCode.mockResolvedValue(cancelledBooking);

      await expect(controller.findByBookingCode('NL-A742')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('completeBooking', () => {
    it('should complete a booking successfully', async () => {
      mockBookingService.findByBookingCode.mockResolvedValue(mockBooking);
      mockBookingService.completeBooking.mockResolvedValue(undefined);

      const result = await controller.completeBooking('NL-A742', {
        contactDetails: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
        },
      });

      expect(result.success).toBe(true);
      expect(service.completeBooking).toHaveBeenCalled();
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingService.findByBookingCode.mockResolvedValue(null);

      await expect(
        controller.completeBooking('NL-INVALID', {
          contactDetails: {
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210',
          },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw HttpException when booking is cancelled', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      mockBookingService.findByBookingCode.mockResolvedValue(cancelledBooking);

      await expect(
        controller.completeBooking('NL-A742', {
          contactDetails: {
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210',
          },
        }),
      ).rejects.toThrow(HttpException);
    });
  });
});

