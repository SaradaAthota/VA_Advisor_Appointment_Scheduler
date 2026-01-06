import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { BookingStatus } from '../../src/domain/models';

describe('Complete Booking Flow E2E Tests', () => {
  let app: INestApplication;

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

  describe('E2E: Complete Booking Flow', () => {
    it('Should complete full booking flow from start to finish', async () => {
      // Step 1: Get available slots
      const slotsResponse = await request(app.getHttpServer())
        .post('/bookings/offer-slots')
        .send({ topic: 'KYC/Onboarding' })
        .expect(200);

      expect(slotsResponse.body.slots).toBeDefined();
      expect(slotsResponse.body.slots.length).toBeGreaterThan(0);

      // Step 2: Create tentative booking
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'KYC/Onboarding' })
        .expect(201);

      const bookingCode = createResponse.body.bookingCode;
      expect(bookingCode).toMatch(/^NL-[A-Z0-9]{4}$/);
      expect(createResponse.body.status).toBe(BookingStatus.TENTATIVE);

      // Step 3: Lookup booking
      const lookupResponse = await request(app.getHttpServer())
        .get(`/bookings/${bookingCode}`)
        .expect(200);

      expect(lookupResponse.body.bookingCode).toBe(bookingCode);
      expect(lookupResponse.body.topic).toBe('KYC/Onboarding');

      // Step 4: Complete booking with contact details
      const completeResponse = await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/complete`)
        .send({
          contactDetails: {
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phone: '9876543210',
            additionalNotes: 'E2E test booking',
          },
        })
        .expect(200);

      expect(completeResponse.body.success).toBe(true);

      // Step 5: Verify booking is confirmed
      const verifiedResponse = await request(app.getHttpServer())
        .get(`/bookings/${bookingCode}`)
        .expect(200);

      expect(verifiedResponse.body.status).toBe(BookingStatus.CONFIRMED);
    });

    it('Should complete booking flow with reschedule', async () => {
      // Create and confirm booking
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'SIP/Mandates' })
        .expect(201);

      const bookingCode = createResponse.body.bookingCode;

      await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/complete`)
        .send({
          contactDetails: {
            fullName: 'Jane Doe',
            email: 'jane@example.com',
            phone: '9876543211',
          },
        })
        .expect(200);

      // Get new slots for reschedule
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

      // Verify rescheduled
      const verifiedResponse = await request(app.getHttpServer())
        .get(`/bookings/${bookingCode}`)
        .expect(200);

      expect(verifiedResponse.body.status).toBe(BookingStatus.RESCHEDULED);
    });

    it('Should complete booking flow with cancellation', async () => {
      // Create and confirm booking
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'Statements/Tax Docs' })
        .expect(201);

      const bookingCode = createResponse.body.bookingCode;

      await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/complete`)
        .send({
          contactDetails: {
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '9876543212',
          },
        })
        .expect(200);

      // Cancel booking
      const cancelResponse = await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/cancel`)
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);

      // Verify cancelled
      const verifiedResponse = await request(app.getHttpServer())
        .get(`/bookings/${bookingCode}`)
        .expect(200);

      expect(verifiedResponse.body.status).toBe(BookingStatus.CANCELLED);
    });
  });
});

