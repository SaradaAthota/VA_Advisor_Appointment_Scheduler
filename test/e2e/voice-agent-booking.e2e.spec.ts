import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConversationState } from '../../src/voice/models';

describe('Voice Agent Booking E2E Tests', () => {
  let app: INestApplication;
  let sessionId: string;

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

  describe('E2E: Complete Booking via Voice Agent', () => {
    it('TC-VOICE-006: Should complete booking through voice agent conversation', async () => {
      // Step 1: Start session
      const startResponse = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);

      sessionId = startResponse.body.sessionId;
      expect(sessionId).toBeDefined();

      // Step 2: Express booking intent
      const intentResponse = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to book an appointment' })
        .expect(201);

      expect(intentResponse.body.state).toBe(ConversationState.COLLECTING_TOPIC);

      // Step 3: Provide topic
      const topicResponse = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'KYC onboarding' })
        .expect(201);

      expect(topicResponse.body.state).toBe(ConversationState.COLLECTING_TIME_PREFERENCE);

      // Step 4: Provide time preference
      const timeResponse = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'Monday morning' })
        .expect(201);

      expect(timeResponse.body.state).toBe(ConversationState.OFFERING_SLOTS);
      expect(timeResponse.body.response).toContain('available slots');

      // Step 5: Select slot
      const slotResponse = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: '1' })
        .expect(201);

      expect(slotResponse.body.state).toBe(ConversationState.CONFIRMING_BOOKING);
      expect(slotResponse.body.response).toContain('confirm');

      // Step 6: Confirm booking
      const confirmResponse = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'yes' })
        .expect(201);

      expect(confirmResponse.body.state).toBe(ConversationState.BOOKING_CONFIRMED);
      expect(confirmResponse.body.bookingCode).toBeDefined();
      expect(confirmResponse.body.bookingCode).toMatch(/^NL-[A-Z0-9]{4}$/);
    });

    it('Should handle reschedule through voice agent', async () => {
      // Start session
      const startResponse = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);

      const sid = startResponse.body.sessionId;

      // Express reschedule intent
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sid}/message`)
        .send({ message: 'I want to reschedule my appointment' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.RESCHEDULING);
    });

    it('Should handle cancellation through voice agent', async () => {
      // Start session
      const startResponse = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);

      const sid = startResponse.body.sessionId;

      // Express cancel intent
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sid}/message`)
        .send({ message: 'I want to cancel my appointment' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.CANCELLING);
    });
  });

  describe('E2E: Voice Agent Error Handling', () => {
    it('Should handle invalid session gracefully', async () => {
      await request(app.getHttpServer())
        .post('/voice/session/invalid-session/message')
        .send({ message: 'Hello' })
        .expect(404);
    });

    it('Should handle empty messages', async () => {
      const startResponse = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);

      const sid = startResponse.body.sessionId;

      await request(app.getHttpServer())
        .post(`/voice/session/${sid}/message`)
        .send({ message: '' })
        .expect(400);
    });
  });
});

