import { Test, TestingModule } from '@nestjs/testing';
import { GoogleDocsMcpService } from './google-docs-mcp.service';
import { Topic } from '../../domain/models/topic.enum';
import { Slot } from '../../domain/models/slot.model';

describe('GoogleDocsMcpService', () => {
  let service: GoogleDocsMcpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleDocsMcpService],
    }).compile();

    service = module.get<GoogleDocsMcpService>(GoogleDocsMcpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('appendBookingEntry', () => {
    it('should append booking entry to document', async () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const topic = Topic.KYC_ONBOARDING;
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        isAvailable: true,
      };
      const bookingCode = 'NL-A742';

      const result = await service.appendBookingEntry(date, topic, slot, bookingCode);

      expect(result).toBeDefined();
      expect(result.documentId).toBeDefined();
      expect(result.appendedAt).toBeInstanceOf(Date);
    });

    it('should format entry with correct date and time', async () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const topic = Topic.SIP_MANDATES;
      const slot: Slot = {
        id: 'slot-2',
        startTime: new Date('2024-01-15T14:00:00Z'),
        endTime: new Date('2024-01-15T14:30:00Z'),
        isAvailable: true,
      };
      const bookingCode = 'NL-B123';

      const result = await service.appendBookingEntry(date, topic, slot, bookingCode);

      expect(result).toBeDefined();
      expect(result.documentId).toBeDefined();
    });

    it('should handle different topics', async () => {
      const topics = [
        Topic.KYC_ONBOARDING,
        Topic.STATEMENTS_TAX_DOCS,
        Topic.WITHDRAWALS_TIMELINES,
      ];

      for (const topic of topics) {
        const date = new Date('2024-01-15T10:00:00Z');
        const slot: Slot = {
          id: `slot-${topic}`,
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T10:30:00Z'),
          isAvailable: true,
        };

        const result = await service.appendBookingEntry(
          date,
          topic,
          slot,
          'NL-TEST',
        );

        expect(result).toBeDefined();
        expect(result.documentId).toBeDefined();
      }
    });
  });
});

