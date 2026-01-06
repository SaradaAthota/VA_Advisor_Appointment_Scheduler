import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCalendarMcpService } from './google-calendar-mcp.service';
import { Topic } from '../../domain/models/topic.enum';
import { Slot } from '../../domain/models/slot.model';

describe('GoogleCalendarMcpService', () => {
  let service: GoogleCalendarMcpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleCalendarMcpService],
    }).compile();

    service = module.get<GoogleCalendarMcpService>(GoogleCalendarMcpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTentativeHold', () => {
    it('should create a tentative calendar hold', async () => {
      const topic = Topic.KYC_ONBOARDING;
      const bookingCode = 'NL-A742';
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        isAvailable: true,
      };

      const result = await service.createTentativeHold(topic, bookingCode, slot);

      expect(result).toBeDefined();
      expect(result.eventId).toBeDefined();
      expect(result.calendarId).toBeDefined();
      expect(result.startTime).toEqual(slot.startTime);
      expect(result.endTime).toEqual(slot.endTime);
    });

    it('should format event title correctly', async () => {
      const topic = Topic.SIP_MANDATES;
      const bookingCode = 'NL-B123';
      const slot: Slot = {
        id: 'slot-2',
        startTime: new Date('2024-01-16T14:00:00Z'),
        endTime: new Date('2024-01-16T14:30:00Z'),
        isAvailable: true,
      };

      const result = await service.createTentativeHold(topic, bookingCode, slot);

      expect(result.eventId).toBeDefined();
      expect(result.eventId).toContain('event-');
    });

    it('should handle different topics', async () => {
      const topics = [
        Topic.KYC_ONBOARDING,
        Topic.SIP_MANDATES,
        Topic.STATEMENTS_TAX_DOCS,
        Topic.WITHDRAWALS_TIMELINES,
        Topic.ACCOUNT_CHANGES_NOMINEE,
      ];

      for (const topic of topics) {
        const slot: Slot = {
          id: `slot-${topic}`,
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T10:30:00Z'),
          isAvailable: true,
        };

        const result = await service.createTentativeHold(
          topic,
          'NL-TEST',
          slot,
        );

        expect(result).toBeDefined();
        expect(result.eventId).toBeDefined();
      }
    });
  });
});

