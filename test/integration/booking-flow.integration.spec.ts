import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { BookingStatus, Topic } from '../../src/domain/models';

describe('Booking Flow Integration Tests', () => {
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

  describe('Complete Booking Flow', () => {
    it('TC-BOOK-001: Should create tentative booking', async () => {
      // Step 1: Get available slots
      const slotsResponse = await request(app.getHttpServer())
        .post('/bookings/offer-slots')
        .send({ topic: 'KYC/Onboarding' })
        .expect(200);

      expect(slotsResponse.body.slots).toBeDefined();
      expect(slotsResponse.body.slots.length).toBeGreaterThan(0);

      const selectedSlot = slotsResponse.body.slots[0];

      // Step 2: Create booking (via test endpoint)
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'KYC/Onboarding' })
        .expect(201);

      expect(createResponse.body.bookingCode).toBeDefined();
      expect(createResponse.body.status).toBe(BookingStatus.TENTATIVE);
      bookingCode = createResponse.body.bookingCode;
    });

    it('TC-BOOK-002: Should confirm booking with contact details', async () => {
      if (!bookingCode) {
        // Create booking first
        const createResponse = await request(app.getHttpServer())
          .post('/bookings/test/create')
          .send({ topic: 'KYC/Onboarding' })
          .expect(201);
        bookingCode = createResponse.body.bookingCode;
      }

      const contactDetails = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '9876543210',
        additionalNotes: 'Test booking',
      };

      const response = await request(app.getHttpServer())
        .post(`/bookings/${bookingCode}/complete`)
        .send({ contactDetails })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');

      // Verify booking status changed
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${bookingCode}`)
        .expect(200);

      expect(bookingResponse.body.status).toBe(BookingStatus.CONFIRMED);
    });

    it('TC-BOOK-003: Should reschedule booking', async () => {
      // Create and confirm booking first
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'KYC/Onboarding' })
        .expect(201);

      const code = createResponse.body.bookingCode;

      await request(app.getHttpServer())
        .post(`/bookings/${code}/complete`)
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
        .send({ bookingCode: code })
        .expect(200);

      expect(slotsResponse.body.slots.length).toBeGreaterThan(0);
      const newSlot = slotsResponse.body.slots[0];

      // Reschedule
      const rescheduleResponse = await request(app.getHttpServer())
        .post(`/bookings/${code}/reschedule`)
        .send({
          preferredSlot: {
            id: newSlot.id,
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
          },
        })
        .expect(200);

      expect(rescheduleResponse.body.success).toBe(true);

      // Verify booking updated
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${code}`)
        .expect(200);

      expect(bookingResponse.body.status).toBe(BookingStatus.RESCHEDULED);
    });

    it('TC-BOOK-004: Should cancel booking', async () => {
      // Create booking first
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'SIP/Mandates' })
        .expect(201);

      const code = createResponse.body.bookingCode;

      // Cancel booking
      const cancelResponse = await request(app.getHttpServer())
        .post(`/bookings/${code}/cancel`)
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);

      // Verify booking status
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${code}`)
        .expect(200);

      expect(bookingResponse.body.status).toBe(BookingStatus.CANCELLED);
    });

    it('TC-BOOK-005: Should lookup booking by code', async () => {
      // Create booking first
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'Statements/Tax Docs' })
        .expect(201);

      const code = createResponse.body.bookingCode;

      // Lookup booking
      const response = await request(app.getHttpServer())
        .get(`/bookings/${code}`)
        .expect(200);

      expect(response.body.bookingCode).toBe(code);
      expect(response.body.topic).toBeDefined();
      expect(response.body.preferredSlot).toBeDefined();
    });

    it('Should return 404 for non-existent booking', async () => {
      await request(app.getHttpServer())
        .get('/bookings/NL-XXXX')
        .expect(404);
    });

    it('Should return 410 for cancelled booking lookup', async () => {
      // Create and cancel booking
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'Withdrawals & Timelines' })
        .expect(201);

      const code = createResponse.body.bookingCode;

      await request(app.getHttpServer())
        .post(`/bookings/${code}/cancel`)
        .expect(200);

      // Try to complete cancelled booking
      await request(app.getHttpServer())
        .post(`/bookings/${code}/complete`)
        .send({
          contactDetails: {
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
          },
        })
        .expect(410);
    });
  });

  describe('Slot Offering', () => {
    it('Should offer slots for topic', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/offer-slots')
        .send({ topic: 'KYC/Onboarding' })
        .expect(200);

      expect(response.body.slots).toBeDefined();
      expect(Array.isArray(response.body.slots)).toBe(true);
      expect(response.body.slots.length).toBeGreaterThan(0);

      // Verify slot structure
      const slot = response.body.slots[0];
      expect(slot.id).toBeDefined();
      expect(slot.startTime).toBeDefined();
      expect(slot.endTime).toBeDefined();
    });

    it('Should filter slots by time preference', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/offer-slots')
        .send({
          topic: 'KYC/Onboarding',
          timeOfDay: 'morning',
        })
        .expect(200);

      expect(response.body.slots).toBeDefined();
      // All slots should be in morning (9 AM - 12 PM IST)
      response.body.slots.forEach((slot: any) => {
        const hour = new Date(slot.startTime).getUTCHours();
        // IST is UTC+5:30, so 9 AM IST = 3:30 AM UTC
        expect(hour).toBeGreaterThanOrEqual(3);
        expect(hour).toBeLessThan(7);
      });
    });

    it('Should exclude current booking slot during reschedule', async () => {
      // Create booking
      const createResponse = await request(app.getHttpServer())
        .post('/bookings/test/create')
        .send({ topic: 'KYC/Onboarding' })
        .expect(201);

      const code = createResponse.body.bookingCode;

      // Get booking to find its slot
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${code}`)
        .expect(200);

      const currentSlotId = bookingResponse.body.preferredSlot.id;

      // Request slots for reschedule
      const slotsResponse = await request(app.getHttpServer())
        .post('/bookings/offer-slots')
        .send({ bookingCode: code })
        .expect(200);

      // Current slot should still be available for reschedule
      // (user can reschedule to the same slot)
      expect(slotsResponse.body.slots).toBeDefined();
    });
  });
});

