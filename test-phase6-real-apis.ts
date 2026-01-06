/**
 * Phase 6 Testing Script - Real APIs
 * Tests voice agent with real Google APIs and OpenAI
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (result.message) {
    console.log(`   ${result.message}`);
  }
  if (result.data && !result.passed) {
    console.log(`   Data:`, JSON.stringify(result.data, null, 2));
  }
  console.log('');
}

async function testStartSession(): Promise<string | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}/voice/session/start`);
    
    if (response.data.sessionId && response.data.greeting) {
      logResult({
        name: 'Test 1: Start Session',
        passed: true,
        message: `Session created: ${response.data.sessionId.substring(0, 8)}...`,
        data: { sessionId: response.data.sessionId },
      });
      return response.data.sessionId;
    } else {
      logResult({
        name: 'Test 1: Start Session',
        passed: false,
        message: 'Missing sessionId or greeting',
        data: response.data,
      });
      return null;
    }
  } catch (error: any) {
    logResult({
      name: 'Test 1: Start Session',
      passed: false,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
}

async function testProcessMessage(sessionId: string, message: string, expectedIntent?: string): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/voice/session/${sessionId}/message`,
      { message }
    );

    const hasResponse = response.data.response && response.data.response.length > 0;
    const hasState = response.data.state;

    logResult({
      name: `Test: Process Message - "${message.substring(0, 30)}..."`,
      passed: hasResponse && hasState,
      message: hasResponse 
        ? `Response: ${response.data.response.substring(0, 50)}... | State: ${response.data.state}`
        : 'Missing response or state',
      data: {
        response: response.data.response?.substring(0, 100),
        state: response.data.state,
        bookingCode: response.data.bookingCode,
      },
    });

    return response.data;
  } catch (error: any) {
    logResult({
      name: `Test: Process Message - "${message.substring(0, 30)}..."`,
      passed: false,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
}

async function testBookingFlow(sessionId: string): Promise<boolean> {
  console.log('\n📋 Testing Complete Booking Flow...\n');

  // Step 1: Greeting (already done)
  // Step 2: Provide topic
  const topicResponse = await testProcessMessage(
    sessionId,
    'I want to book an appointment for KYC/Onboarding'
  );
  if (!topicResponse) return false;

  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 3: Provide time preference
  const timeResponse = await testProcessMessage(
    sessionId,
    'I prefer next Tuesday'
  );
  if (!timeResponse) return false;

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 4: Select a slot (if offered)
  if (timeResponse.state === 'offering_slots') {
    const slotResponse = await testProcessMessage(
      sessionId,
      'I choose the first slot'
    );
    if (!slotResponse) return false;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Confirm booking
    if (slotResponse.state === 'confirming_booking') {
      const confirmResponse = await testProcessMessage(
        sessionId,
        'Yes, confirm my booking'
      );

      if (confirmResponse?.bookingCode) {
        logResult({
          name: 'Test: Booking Created',
          passed: true,
          message: `Booking code: ${confirmResponse.bookingCode}`,
          data: { bookingCode: confirmResponse.bookingCode },
        });
        return true;
      }
    }
  }

  return false;
}

async function testGetHistory(sessionId: string): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/voice/session/${sessionId}/history`);
    
    const hasMessages = response.data.messages && response.data.messages.length > 0;
    
    logResult({
      name: 'Test: Get Conversation History',
      passed: hasMessages,
      message: hasMessages 
        ? `Found ${response.data.messages.length} messages`
        : 'No messages found',
      data: { messageCount: response.data.messages?.length },
    });

    return hasMessages;
  } catch (error: any) {
    logResult({
      name: 'Test: Get Conversation History',
      passed: false,
      message: error.message,
      data: error.response?.data,
    });
    return false;
  }
}

async function testGetLogs(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/voice/logs/all`);
    
    const hasLogs = Array.isArray(response.data) && response.data.length > 0;
    
    logResult({
      name: 'Test: Get Conversation Logs',
      passed: hasLogs,
      message: hasLogs 
        ? `Found ${response.data.length} log entries`
        : 'No logs found',
      data: { logCount: response.data.length },
    });

    return hasLogs;
  } catch (error: any) {
    logResult({
      name: 'Test: Get Conversation Logs',
      passed: false,
      message: error.message,
      data: error.response?.data,
    });
    return false;
  }
}

async function testCheckBackendHealth(): Promise<boolean> {
  try {
    // Try to get logs endpoint as health check
    await axios.get(`${API_BASE_URL}/voice/logs/all`, { timeout: 2000 });
    return true;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('   Please start it with: npm run start:dev\n');
      return false;
    }
    return true; // Other errors are OK (might be no logs yet)
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 Phase 6 Testing - Real APIs');
  console.log('='.repeat(60));
  console.log('');

  // Check backend is running
  const backendRunning = await testCheckBackendHealth();
  if (!backendRunning) {
    process.exit(1);
  }

  console.log('✅ Backend server is running\n');

  // Test 1: Start session
  const sessionId = await testStartSession();
  if (!sessionId) {
    console.log('❌ Cannot continue without session. Exiting...\n');
    process.exit(1);
  }

  // Test 2: Get history
  await testGetHistory(sessionId);

  // Test 3: Process various messages
  console.log('\n📝 Testing Intent Recognition...\n');
  
  await testProcessMessage(sessionId, 'I want to book an appointment');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testProcessMessage(sessionId, 'What slots are available?');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 4: Complete booking flow
  console.log('\n📋 Testing Complete Booking Flow...\n');
  const newSessionId = await testStartSession();
  if (newSessionId) {
    await testBookingFlow(newSessionId);
  }

  // Test 5: Get logs
  await testGetLogs();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('');

  if (failed > 0) {
    console.log('❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('');

  // Check if real APIs are being used
  console.log('🔍 Verifying Real API Usage:');
  console.log('   Check backend logs for:');
  console.log('   - "initialized with real API" (Calendar, Sheets, Gmail)');
  console.log('   - "Google Calendar MCP Service initialized with real API"');
  console.log('   - "Google Sheets MCP Service initialized with real API"');
  console.log('   - "Gmail MCP Service initialized with real API"');
  console.log('');
  console.log('   If you see "mock mode" instead, check your .env file.\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

