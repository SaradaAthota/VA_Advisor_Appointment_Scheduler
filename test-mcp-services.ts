/**
 * Direct MCP Services Testing Script
 * 
 * This script tests the MCP services directly without going through the API.
 * Run with: npx ts-node test-mcp-services.ts
 * 
 * Make sure your .env file has the required Google OAuth credentials:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN
 * - GOOGLE_CALENDAR_ID (optional, defaults to 'primary')
 * - GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID
 * - GOOGLE_SHEETS_SHEET_NAME (optional, defaults to 'Sheet1')
 * - ADVISOR_EMAIL
 */

import * as dotenv from 'dotenv';
import { GoogleCalendarMcpService } from './src/mcp/services/google-calendar-mcp.service';
import { GoogleSheetsMcpService } from './src/mcp/services/google-sheets-mcp.service';
import { GmailMcpService } from './src/mcp/services/gmail-mcp.service';
import { GoogleOAuthService } from './src/mcp/services/google-oauth.service';
import { Topic } from './src/domain/models/topic.enum';
import { Slot } from './src/domain/models/slot.model';

// Load environment variables from .env file
dotenv.config();

async function testMcpServices() {
  console.log('🧪 Testing MCP Services...\n');

  // Check if credentials are configured
  const hasCredentials = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  if (hasCredentials) {
    console.log('✅ OAuth credentials found - testing with REAL Google APIs\n');
  } else {
    console.log('⚠️  OAuth credentials not found - testing in MOCK mode\n');
    console.log('To test with real APIs, add to .env:');
    console.log('  - GOOGLE_CLIENT_ID');
    console.log('  - GOOGLE_CLIENT_SECRET');
    console.log('  - GOOGLE_REFRESH_TOKEN\n');
  }

  const oauthService = new GoogleOAuthService();
  const calendarService = new GoogleCalendarMcpService(oauthService);
  const sheetsService = new GoogleSheetsMcpService(oauthService);
  const emailService = new GmailMcpService(oauthService);

  // Use a future date for testing (next week)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  futureDate.setHours(10, 0, 0, 0); // 10:00 AM

  const slot: Slot = {
    id: 'slot-test-001',
    startTime: futureDate,
    endTime: new Date(futureDate.getTime() + 30 * 60 * 1000), // 30 minutes later
    isAvailable: true,
  };

  const bookingCode = 'NL-TEST';
  const topic = Topic.KYC_ONBOARDING;

  try {
    // Test 1: Calendar Service
    console.log('📅 Testing Google Calendar MCP Service...');
    const calendarResult = await calendarService.createTentativeHold(
      topic,
      bookingCode,
      slot,
    );
    console.log('✅ Calendar Result:', JSON.stringify(calendarResult, null, 2));
    console.log('');

    // Test 2: Sheets Service
    console.log('📊 Testing Google Sheets MCP Service...');
    const sheetsResult = await sheetsService.appendBookingEntry(
      slot.startTime,
      topic,
      slot,
      bookingCode,
    );
    console.log('✅ Sheets Result:', JSON.stringify(sheetsResult, null, 2));
    console.log('');

    // Test 3: Email Service
    console.log('📧 Testing Gmail MCP Service...');
    const emailResult = await emailService.createAdvisorEmailDraft(
      topic,
      bookingCode,
      slot,
      {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        additionalNotes: 'This is a test booking',
      },
    );
    console.log('✅ Email Result:', JSON.stringify(emailResult, null, 2));
    console.log('');

    console.log('✅ All MCP services tested successfully!');
  } catch (error) {
    console.error('❌ Error testing MCP services:', error);
    process.exit(1);
  }
}

testMcpServices();

