import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GoogleOAuthService } from './mcp/services/google-oauth.service';

@Controller()
export class AppController {
  constructor(
    private dataSource: DataSource,
    private googleOAuthService: GoogleOAuthService,
  ) {}
  @Get()
  getRoot() {
    // Get database info directly from DataSource
    const dbType = this.dataSource.options.type;
    const dbUrl = (this.dataSource.options as any).url;
    const dbName = this.dataSource.options.database;
    const hasPostgresUrl = process.env.DATABASE_URL && (
      process.env.DATABASE_URL.startsWith('postgresql://') ||
      process.env.DATABASE_URL.startsWith('postgres://') ||
      process.env.DATABASE_URL.includes('postgres.railway.internal')
    );
    
    return {
      message: 'VA Advisor Appointment Scheduler API',
      version: '1.0.0',
      status: 'running',
      database: {
        type: dbType,
        detectedFromEnv: hasPostgresUrl ? 'postgresql' : 'sqlite',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL 
          ? `${process.env.DATABASE_URL.substring(0, 50)}...` 
          : 'not set',
        actualConnection: dbUrl ? `${dbUrl.substring(0, 50)}...` : (dbName || 'unknown'),
      },
      endpoints: {
        system: {
          'GET /health': 'Health check',
          'GET /test': 'Test endpoint',
          'GET /db-info': 'Database information and connection status',
          'GET /google-api-status': 'Google API configuration status',
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

  @Get('google-api-status')
  getGoogleApiStatus() {
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;
    const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;
    
    const isConfigured = this.googleOAuthService.isConfigured();
    
    return {
      oauth: {
        configured: isConfigured,
        hasClientId: hasClientId,
        hasClientSecret: hasClientSecret,
        hasRefreshToken: hasRefreshToken,
        hasRedirectUri: hasRedirectUri,
        clientIdPreview: process.env.GOOGLE_CLIENT_ID 
          ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` 
          : 'not set',
      },
      services: {
        calendar: {
          enabled: process.env.GOOGLE_CALENDAR_ENABLED === 'true',
          calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
          usingRealApi: isConfigured && process.env.GOOGLE_CALENDAR_ENABLED === 'true',
        },
        sheets: {
          enabled: process.env.GOOGLE_SHEETS_ENABLED === 'true',
          spreadsheetId: process.env.GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID 
            ? `${process.env.GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID.substring(0, 30)}...` 
            : 'not set',
          sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1',
          usingRealApi: isConfigured && process.env.GOOGLE_SHEETS_ENABLED === 'true',
        },
        gmail: {
          enabled: process.env.GMAIL_ENABLED === 'true',
          advisorEmail: process.env.ADVISOR_EMAIL || 'not set',
          usingRealApi: isConfigured && process.env.GMAIL_ENABLED === 'true',
        },
      },
      status: isConfigured ? 'real-api' : 'mock-mode',
      message: isConfigured 
        ? 'Google APIs are configured and will use real API calls' 
        : 'Google APIs are not configured - running in mock mode. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to enable real APIs.',
      timestamp: new Date().toISOString(),
    };
  }
}

