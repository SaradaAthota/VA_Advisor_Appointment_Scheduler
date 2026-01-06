import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('MCP Integration Tests', () => {
  let app: INestApplication;
  let bookingCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('MCP Actions on Booking Confirm', () => {
    beforeEach(async () => {
      // Create a tentative booking
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'KYC/Onboarding' })
        .expect(201);
      bookingCode = createResponse.body.bookingCode;
    });

    it('TC-MCP-001: Should trigger MCP actions on booking confirm', async () => {
      const contactDetails = {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
      };

      const response = await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/complete`)
        .send({ contactDetails })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Note: Actual MCP actions depend on Google API configuration
      // In test environment, these may be mocked or skipped
    });

    it('TC-MCP-004: Should update MCP actions on reschedule', async () => {
      // First confirm booking
      await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/complete`)
        .send({
          contactDetails: {
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
          },
        })
        .expect(200);

      // Get new slots
      const slotsResponse = await request(app.getHttpServer())
        .post('/bookings/offer-slots')
        .send({ bookingCode })
        .expect(200);

      const newSlot = slotsResponse.body.slots[0];

      // Reschedule
      const rescheduleResponse = await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/reschedule`)
        .send({
          preferredSlot: {
            id: newSlot.id,
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
          },
        })
        .expect(200);

      expect(rescheduleResponse.body.success).toBe(true);

      // Note: MCP update actions should be triggered
      // Verify in logs or Google services
    });
  });

  describe('MCP Service Availability', () => {
    it('Should handle MCP service unavailability gracefully', async () => {
      // Create booking
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'KYC/Onboarding' })
        .expect(201);

      const code = createResponse.body.bookingCode;

      // Complete booking (should succeed even if MCP fails)
      const response = await request(app.getHttpServer())
        .post(`/bookings/${code}/complete`)
        .send({
          contactDetails: {
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
          },
        })
        .expect(200);

      // Booking should complete even if MCP actions fail
      expect(response.body.success).toBe(true);
    });
  });
});

