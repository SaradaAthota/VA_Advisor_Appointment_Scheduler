import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConversationState, Intent } from '../../src/voice/models';

describe('Voice Agent Integration Tests', () => {
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

  describe('Session Management', () => {
    it('TC-VOICE-001: Should start new session', async () => {
      const response = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);

      expect(response.body.sessionId).toBeDefined();
      expect(response.body.greeting).toBeDefined();
      expect(response.body.greeting.length).toBeGreaterThan(0);

      sessionId = response.body.sessionId;
    });

    it('Should get session state', async () => {
      if (!sessionId) {
        const startResponse = await request(app.getHttpServer())
          .post('/voice/session/start')
          .expect(201);
        sessionId = startResponse.body.sessionId;
      }

      const response = await request(app.getHttpServer())
        .get(`/voice/session/${sessionId}/state`)
        .expect(200);

      expect(response.body.state).toBeDefined();
    });

    it('Should get conversation history', async () => {
      if (!sessionId) {
        const startResponse = await request(app.getHttpServer())
          .post('/voice/session/start')
          .expect(201);
        sessionId = startResponse.body.sessionId;
      }

      const response = await request(app.getHttpServer())
        .get(`/voice/session/${sessionId}/history`)
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
    });
  });

  describe('Text Message Processing', () => {
    beforeEach(async () => {
      const startResponse = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);
      sessionId = startResponse.body.sessionId;
    });

    it('TC-VOICE-002: Should process text message', async () => {
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'Hello, I want to book an appointment' })
        .expect(201);

      expect(response.body.response).toBeDefined();
      expect(response.body.state).toBeDefined();
    });

    it('TC-VOICE-004: Should recognize topic from text', async () => {
      // Start session
      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to book an appointment' })
        .expect(201);

      // Provide topic
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'KYC onboarding' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.COLLECTING_TIME_PREFERENCE);
    });

    it('TC-VOICE-005: Should recognize number selection', async () => {
      // Start session
      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to book an appointment' })
        .expect(201);

      // Provide topic as number
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'one' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.COLLECTING_TIME_PREFERENCE);
    });

    it('Should handle time preference', async () => {
      // Navigate to time preference state
      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to book an appointment' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'KYC onboarding' })
        .expect(201);

      // Provide time preference
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'Monday morning' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.OFFERING_SLOTS);
    });

    it('Should handle slot selection', async () => {
      // Navigate to slot selection
      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to book an appointment' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'KYC onboarding' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'Monday morning' })
        .expect(201);

      // Select slot
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: '1' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.CONFIRMING_BOOKING);
    });

    it('Should handle booking confirmation', async () => {
      // Navigate through flow to confirmation
      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to book an appointment' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'KYC onboarding' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'Monday morning' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: '1' })
        .expect(201);

      // Confirm booking
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'yes' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.BOOKING_CONFIRMED);
      expect(response.body.bookingCode).toBeDefined();
    });
  });

  describe('Intent Recognition', () => {
    beforeEach(async () => {
      const startResponse = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);
      sessionId = startResponse.body.sessionId;
    });

    it('Should recognize booking intent', async () => {
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to book an appointment' })
        .expect(201);

      // Should transition to topic collection
      expect(response.body.state).toBe(ConversationState.COLLECTING_TOPIC);
    });

    it('Should recognize reschedule intent', async () => {
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to reschedule my appointment' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.RESCHEDULING);
    });

    it('Should recognize cancel intent', async () => {
      const response = await request(app.getHttpServer())
        .post(`/voice/session/${sessionId}/message`)
        .send({ message: 'I want to cancel my appointment' })
        .expect(201);

      expect(response.body.state).toBe(ConversationState.CANCELLING);
    });
  });

  describe('Error Handling', () => {
    it('Should return 404 for non-existent session', async () => {
      await request(app.getHttpServer())
        .post('/voice/session/invalid-session-id/message')
        .send({ message: 'Hello' })
        .expect(404);
    });

    it('Should handle invalid message format', async () => {
      const startResponse = await request(app.getHttpServer())
        .post('/voice/session/start')
        .expect(201);
      const sid = startResponse.body.sessionId;

      await request(app.getHttpServer())
        .post(`/voice/session/${sid}/message`)
        .send({})
        .expect(400);
    });
  });
});

