import { Test, TestingModule } from '@nestjs/testing';
import { GmailMcpService } from './gmail-mcp.service';
import { Topic } from '../../domain/models/topic.enum';
import { Slot } from '../../domain/models/slot.model';
import { EmailContactDetails } from '../interfaces/email-mcp.interface';

describe('GmailMcpService', () => {
  let service: GmailMcpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GmailMcpService],
    }).compile();

    service = module.get<GmailMcpService>(GmailMcpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdvisorEmailDraft', () => {
    it('should create an email draft', async () => {
      const topic = Topic.KYC_ONBOARDING;
      const bookingCode = 'NL-A742';
      const slot: Slot = {
        id: 'slot-1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        isAvailable: true,
      };
      const contactDetails: EmailContactDetails = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
      };

      const result = await service.createAdvisorEmailDraft(
        topic,
        bookingCode,
        slot,
        contactDetails,
      );

      expect(result).toBeDefined();
      expect(result.draftId).toBeDefined();
      expect(result.subject).toBeDefined();
      expect(result.requiresApproval).toBe(true);
      expect(result.subject).toContain(topic);
      expect(result.subject).toContain(bookingCode);
    });

    it('should include contact details in email', async () => {
      const topic = Topic.SIP_MANDATES;
      const bookingCode = 'NL-B123';
      const slot: Slot = {
        id: 'slot-2',
        startTime: new Date('2024-01-16T14:00:00Z'),
        endTime: new Date('2024-01-16T14:30:00Z'),
        isAvailable: true,
      };
      const contactDetails: EmailContactDetails = {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '9876543211',
        additionalNotes: 'Please call before the appointment',
      };

      const result = await service.createAdvisorEmailDraft(
        topic,
        bookingCode,
        slot,
        contactDetails,
      );

      expect(result).toBeDefined();
      expect(result.draftId).toBeDefined();
      expect(result.subject).toContain('New Advisor Appointment');
    });

    it('should handle email without additional notes', async () => {
      const topic = Topic.STATEMENTS_TAX_DOCS;
      const bookingCode = 'NL-C456';
      const slot: Slot = {
        id: 'slot-3',
        startTime: new Date('2024-01-17T09:00:00Z'),
        endTime: new Date('2024-01-17T09:30:00Z'),
        isAvailable: true,
      };
      const contactDetails: EmailContactDetails = {
        fullName: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '9876543212',
      };

      const result = await service.createAdvisorEmailDraft(
        topic,
        bookingCode,
        slot,
        contactDetails,
      );

      expect(result).toBeDefined();
      expect(result.draftId).toBeDefined();
      expect(result.requiresApproval).toBe(true);
    });

    it('should format subject correctly', async () => {
      const topic = Topic.WITHDRAWALS_TIMELINES;
      const bookingCode = 'NL-D789';
      const slot: Slot = {
        id: 'slot-4',
        startTime: new Date('2024-01-18T11:00:00Z'),
        endTime: new Date('2024-01-18T11:30:00Z'),
        isAvailable: true,
      };
      const contactDetails: EmailContactDetails = {
        fullName: 'Alice Brown',
        email: 'alice@example.com',
        phone: '9876543213',
      };

      const result = await service.createAdvisorEmailDraft(
        topic,
        bookingCode,
        slot,
        contactDetails,
      );

      expect(result.subject).toBe(
        `New Advisor Appointment: ${topic} - ${bookingCode}`,
      );
    });
  });
});

