import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'VA Advisor Appointment Scheduler API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        bookings: {
          'GET /bookings/:bookingCode': 'Get booking by code',
          'POST /bookings/:bookingCode/complete': 'Complete booking with contact details',
          'POST /bookings/:bookingCode/reschedule': 'Reschedule booking',
          'POST /bookings/:bookingCode/cancel': 'Cancel booking',
          'POST /bookings/offer-slots': 'Get available slots',
          'GET /bookings/debug/all': 'Get all bookings (debug)',
        },
        voice: {
          'POST /voice/session/start': 'Start new conversation session',
          'POST /voice/session/:sessionId/message': 'Send text message',
          'POST /voice/session/:sessionId/voice-message': 'Send voice message (STT + TTS)',
          'GET /voice/session/:sessionId/history': 'Get conversation history',
          'GET /voice/session/:sessionId/state': 'Get session state',
          'GET /voice/logs/all': 'Get all conversation logs',
          'GET /voice/logs/session/:sessionId': 'Get logs for specific session',
        },
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

