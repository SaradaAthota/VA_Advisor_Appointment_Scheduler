/**
 * Diagnostic script to check if environment variables are being loaded
 * Run: npx ts-node diagnose-env-loading.ts
 */

import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { GoogleOAuthService } from './src/mcp/services/google-oauth.service';

async function diagnose() {
  console.log('\n🔍 Environment Variable Loading Diagnostic\n');
  console.log('='.repeat(60));

  // Step 1: Check .env file directly
  console.log('\n📋 Step 1: Reading .env file directly (using dotenv)...');
  dotenv.config();
  
  const directClientId = process.env.GOOGLE_CLIENT_ID;
  const directClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const directRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  console.log(`  GOOGLE_CLIENT_ID: ${directClientId ? '✅ Found' : '❌ Missing'}`);
  if (directClientId) {
    console.log(`    Value: ${directClientId.substring(0, 20)}...`);
  }
  console.log(`  GOOGLE_CLIENT_SECRET: ${directClientSecret ? '✅ Found' : '❌ Missing'}`);
  if (directClientSecret) {
    console.log(`    Value: ${directClientSecret.substring(0, 10)}...`);
  }
  console.log(`  GOOGLE_REFRESH_TOKEN: ${directRefreshToken ? '✅ Found' : '❌ Missing'}`);
  if (directRefreshToken) {
    console.log(`    Value: ${directRefreshToken.substring(0, 20)}...`);
  }

  // Step 2: Check through NestJS ConfigModule
  console.log('\n📋 Step 2: Checking through NestJS application...');
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const oauthService = app.get(GoogleOAuthService);
    
    // Check what the service sees
    const isConfigured = oauthService.isConfigured();
    console.log(`  OAuth Service isConfigured(): ${isConfigured ? '✅ TRUE' : '❌ FALSE'}`);
    
    // Check process.env directly in the app context
    const appClientId = process.env.GOOGLE_CLIENT_ID;
    const appClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    console.log(`  process.env.GOOGLE_CLIENT_ID in app: ${appClientId ? '✅ Found' : '❌ Missing'}`);
    console.log(`  process.env.GOOGLE_CLIENT_SECRET in app: ${appClientSecret ? '✅ Found' : '❌ Missing'}`);
    console.log(`  process.env.GOOGLE_REFRESH_TOKEN in app: ${appRefreshToken ? '✅ Found' : '❌ Missing'}`);
    
    await app.close();
  } catch (error) {
    console.error(`  ❌ Error checking NestJS app: ${error.message}`);
  }

  // Step 3: Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  
  if (directClientId && directClientSecret && directRefreshToken) {
    console.log('✅ .env file has all required credentials');
  } else {
    console.log('❌ .env file is missing some credentials');
  }

  if (directClientId && directClientSecret && directRefreshToken) {
    console.log('\n💡 If services are still in mock mode:');
    console.log('   1. Check that ConfigModule.forRoot() is called in mcp.module.ts');
    console.log('   2. Restart the backend server after any changes');
    console.log('   3. Check backend logs for initialization messages');
  }

  console.log('\n');
}

diagnose().catch(console.error);

