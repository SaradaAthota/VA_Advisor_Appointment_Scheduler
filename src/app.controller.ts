import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(private dataSource: DataSource) {}
  @Get()
  getRoot() {
    return {
      message: 'VA Advisor Appointment Scheduler API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        system: {
          'GET /health': 'Health check',
          'GET /test': 'Test endpoint',
          'GET /db-info': 'Database information and connection status',
        },
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

  @Get('test')
  getTest() {
    return {
      message: 'AppController is working!',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db-info')
  async getDbInfo() {
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.POSTGRES_URL || 
                       process.env.POSTGRES_PRIVATE_URL;
    
    const isPostgres = databaseUrl && (
      databaseUrl.startsWith('postgresql://') || 
      databaseUrl.startsWith('postgres://')
    );
    
    // Get actual database type from TypeORM connection
    const actualDbType = this.dataSource.options.type;
    const actualDbName = this.dataSource.options.database || 
                        (this.dataSource.options as any).url?.substring(0, 30) || 
                        'unknown';
    
    // Test database connection
    let connectionStatus = 'unknown';
    try {
      await this.dataSource.query('SELECT 1');
      connectionStatus = 'connected';
    } catch (error) {
      connectionStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }
    
    return {
      databaseType: isPostgres ? 'postgresql' : 'sqlite',
      actualDatabaseType: actualDbType,
      actualDatabaseName: actualDbName,
      hasDatabaseUrl: !!databaseUrl,
      databaseUrlPreview: databaseUrl 
        ? `${databaseUrl.substring(0, 30)}...` 
        : 'not set',
      connectionStatus: connectionStatus,
      timestamp: new Date().toISOString(),
    };
  }
}

