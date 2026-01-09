import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleCalendarMcpService } from './services/google-calendar-mcp.service';
import { GoogleSheetsMcpService } from './services/google-sheets-mcp.service';
import { GmailMcpService } from './services/gmail-mcp.service';
import { GoogleOAuthService } from './services/google-oauth.service';

/**
 * MCP Module
 * Provides MCP services for Calendar, Notes (Sheets), and Email (Gmail)
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false, // Only available in this module
      envFilePath: '.env', // Load .env file from project root
    }),
  ],
  providers: [
    GoogleOAuthService,
    GoogleCalendarMcpService,
    GoogleSheetsMcpService,
    GmailMcpService,
  ],
  exports: [
    GoogleOAuthService,
    GoogleCalendarMcpService,
    GoogleSheetsMcpService,
    GmailMcpService,
  ],
})
export class McpModule { }

