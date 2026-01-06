/**
 * Quick diagnostic script to check MCP configuration
 * Run: npx ts-node check-mcp-config.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('\n🔍 MCP Configuration Check\n');
console.log('='.repeat(50));

// Check OAuth credentials
console.log('\n📋 OAuth Credentials:');
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

console.log(`  GOOGLE_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
console.log(`  GOOGLE_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}`);
console.log(`  GOOGLE_REFRESH_TOKEN: ${refreshToken ? '✅ Set' : '❌ Missing'}`);
console.log(`  GOOGLE_REDIRECT_URI: ${redirectUri || 'Not set (optional)'}`);

const oauthConfigured = !!(clientId && clientSecret && refreshToken);
console.log(`\n  OAuth Status: ${oauthConfigured ? '✅ CONFIGURED (Real API)' : '❌ NOT CONFIGURED (Mock Mode)'}`);

// Check Calendar
console.log('\n📅 Google Calendar:');
const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
console.log(`  GOOGLE_CALENDAR_ID: ${calendarId}`);

// Check Sheets
console.log('\n📊 Google Sheets:');
const spreadsheetId = process.env.GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID;
const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';
console.log(`  GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID: ${spreadsheetId ? '✅ Set' : '❌ Missing'}`);
console.log(`  GOOGLE_SHEETS_SHEET_NAME: ${sheetName}`);

if (spreadsheetId) {
  console.log(`  Spreadsheet Link: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
}

// Check Gmail (uses OAuth credentials)
console.log('\n📧 Gmail:');
console.log(`  Uses OAuth credentials (same as above)`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:\n');

if (oauthConfigured) {
  console.log('✅ OAuth credentials are configured');
  console.log('✅ MCP services will use REAL Google APIs');
  
  if (!spreadsheetId) {
    console.log('⚠️  Warning: Google Sheets ID is missing');
    console.log('   Sheets entries will not be created');
  }
} else {
  console.log('❌ OAuth credentials are NOT configured');
  console.log('❌ MCP services will use MOCK mode (no real API calls)');
  console.log('\n📝 To enable real APIs:');
  console.log('   1. Follow STEP_BY_STEP_API_SETUP.md');
  console.log('   2. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env');
  console.log('   3. Restart backend server');
}

console.log('\n' + '='.repeat(50));
console.log('\n💡 Next Steps:');
console.log('   1. Check backend server logs when completing a booking');
console.log('   2. Look for "MCP actions" log messages');
console.log('   3. If errors occur, check TROUBLESHOOT_MCP_ACTIONS.md');
console.log('\n');

