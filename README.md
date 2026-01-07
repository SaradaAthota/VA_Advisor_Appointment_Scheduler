# Voice Agent: Advisor Appointment Scheduler

A comprehensive voice agent system for booking advisor appointments with topic and time preference collection, slot offering, confirmation, and calendar/notes/email integration via Google APIs (MCP).

## 🎯 Project Status: Phase 7 Complete ✅

**All phases are now complete:**
- ✅ **Phase 1**: Backend Core (Domain + Unit Tests)
- ✅ **Phase 2**: Frontend UI + Unit Tests
- ✅ **Phase 3**: Backend APIs for UI
- ✅ **Phase 4**: MCP Interfaces + Implementations
- ✅ **Phase 5**: MCP Orchestration on Booking Confirm
- ✅ **Phase 6**: Voice Logic (Text-Only)
- ✅ **Phase 7**: STT + TTS Integration

## 🚀 Features

### Core Functionality
- **Booking Management**: Create, confirm, reschedule, and cancel appointments
- **Slot Management**: Intelligent slot offering based on time preferences
- **Database Persistence**: SQLite database for bookings and conversation logs
- **Voice Agent**: Text and voice-based conversation interface
- **MCP Integration**: Google Calendar, Google Sheets, and Gmail integration

### Voice Agent Capabilities
- **Speech-to-Text (STT)**: OpenAI Whisper API for voice transcription
- **Text-to-Speech (TTS)**: OpenAI Neural TTS for voice responses
- **Intent Recognition**: LLM-based intent detection
- **Conversation Management**: State-based conversation flow
- **Session Persistence**: Conversation history stored in database
- **Topic Recognition**: Flexible topic extraction (KYC, SIP, Statements, etc.)
- **Number Recognition**: Supports both text ("one", "two") and digits ("1", "2")

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.1.3
- **Framework**: NestJS 10.0.0
  - `@nestjs/common`: Core NestJS functionality
  - `@nestjs/core`: Framework core
  - `@nestjs/platform-express`: Express.js adapter
  - `@nestjs/config`: Configuration management
  - `@nestjs/typeorm`: TypeORM integration
- **Database**: 
  - SQLite 3 (via `sqlite3` 5.1.7)
  - TypeORM 0.3.28 (ORM)
- **Validation**: 
  - `class-validator` 0.14.0
  - `class-transformer` 0.5.1
- **Utilities**:
  - `uuid` 13.0.0 (UUID generation)
  - `rxjs` 7.8.1 (Reactive programming)
  - `reflect-metadata` 0.1.13 (Metadata reflection)

### Frontend

- **Framework**: React 18.2.0
- **Language**: TypeScript 5.3.3
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router DOM 6.20.0
- **UI**: Custom CSS components

### Voice & AI Services

- **OpenAI SDK**: `openai` 6.15.0
  - **Speech-to-Text (STT)**: Whisper API (`whisper-1` model)
  - **Text-to-Speech (TTS)**: Neural TTS (`tts-1` model, `nova` voice)
  - **LLM**: GPT-4o-mini (for intent recognition and conversation)

### Google APIs (MCP Services)

- **Google APIs Client**: `googleapis` 169.0.0
  - **Google Calendar API**: Calendar event creation
  - **Google Sheets API**: Spreadsheet logging
  - **Gmail API**: Email draft creation
  - **Google OAuth2**: Authentication

### Testing

**Backend Testing:**
- `jest` 29.5.0 (Test framework)
- `ts-jest` 29.1.0 (TypeScript support)
- `supertest` 6.3.3 (HTTP assertions)
- `@nestjs/testing` 10.0.0 (NestJS testing utilities)

**Frontend Testing:**
- `vitest` 1.0.4 (Test framework)
- `@testing-library/react` 14.1.2 (React testing utilities)
- `@testing-library/jest-dom` 6.1.5 (DOM matchers)
- `@testing-library/user-event` 14.5.1 (User interaction simulation)
- `jsdom` 23.0.1 (DOM environment)

### Development Tools

- **Linting**: 
  - `eslint` 8.42.0
  - `@typescript-eslint/eslint-plugin` 6.0.0
  - `@typescript-eslint/parser` 6.0.0
- **Formatting**: `prettier` 3.0.0
- **Type Definitions**:
  - `@types/node` 20.3.1
  - `@types/express` 4.17.17
  - `@types/jest` 29.5.2
  - `@types/multer` 2.0.0
  - `@types/react` 18.2.43
  - `@types/react-dom` 18.2.17
- **Build Tools**:
  - `ts-node` 10.9.1 (TypeScript execution)
  - `ts-loader` 9.4.3 (Webpack TypeScript loader)
  - `tsconfig-paths` 4.2.0 (Path mapping)
- **Environment**: `dotenv` 17.2.3 (Environment variables)

### Architecture Patterns

- **Backend**: 
  - Domain-Driven Design (DDD)
  - Dependency Injection (NestJS)
  - Repository Pattern (TypeORM)
  - Service Layer Architecture
- **Frontend**: 
  - Component-Based Architecture
  - React Hooks
  - Service Layer for API calls

## 📁 Project Structure

```
├── src/                              # Backend
│   ├── domain/                        # Domain layer
│   │   ├── models/                    # Domain models (Topic, Booking, Slot, etc.)
│   │   └── services/                  # Core business logic
│   ├── booking/                       # Booking API
│   │   ├── booking.controller.ts      # REST endpoints
│   │   ├── booking.service.ts         # API service layer
│   │   ├── entities/                  # TypeORM entities
│   │   └── dto/                       # Data Transfer Objects
│   ├── mcp/                           # MCP Services
│   │   ├── interfaces/                # MCP interface abstractions
│   │   ├── services/                  # Google API implementations
│   │   └── config/                    # MCP configuration
│   ├── voice/                         # Voice Agent
│   │   ├── services/                  # Conversation, STT, TTS services
│   │   ├── models/                    # Conversation state, intent enums
│   │   ├── entities/                  # Conversation log entity
│   │   └── dto/                       # Voice API DTOs
│   └── main.ts                         # Application entry point
│
└── frontend/                          # Frontend
    ├── src/
    │   ├── components/
    │   │   ├── BookingCodeInput/      # Booking code lookup
    │   │   ├── BookingDetails/        # Booking details display
    │   │   ├── ContactForm/           # Contact details form
    │   │   ├── ConfirmationMessage/   # Success confirmation
    │   │   └── VoiceAgentModal/       # Voice agent UI
    │   ├── pages/
    │   │   ├── BookingLookup.tsx      # Landing page
    │   │   ├── BookingCompletion.tsx   # Completion page
    │   │   └── BookingReschedule.tsx  # Reschedule page
    │   └── services/                   # API services
    └── package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with APIs enabled (for MCP services)
- OpenAI API key (for voice agent)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VA_Advisor_Appointment_Scheduler
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   # Server Configuration
   PORT=3000
   FRONTEND_URL=http://localhost:5173

   # Google OAuth
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

   # Google Calendar
   GOOGLE_CALENDAR_ID=primary

   # Google Sheets
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

   # Gmail
   ADVISOR_EMAIL=advisor@example.com

   # OpenAI (for Voice Agent)
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_TTS_MODEL=tts-1
   OPENAI_TTS_VOICE=nova
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   npm run start:dev
   ```
   Backend will be available at `http://localhost:3000`

2. **Start the frontend server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

## 🧪 Testing

### Running Tests

**Backend Tests:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

**Frontend Tests:**
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

**Run Specific Test Suites:**
```bash
# Unit tests only
npm test -- --testPathPattern="\.spec\.ts$"

# Integration tests only
npm test -- --testPathPattern="integration"

# E2E tests only
npm run test:e2e
```

### Test Structure
```
test/
├── integration/          # Integration tests
│   ├── booking-flow.integration.spec.ts
│   ├── voice-agent.integration.spec.ts
│   └── mcp.integration.spec.ts
├── e2e/                  # End-to-end tests
│   ├── complete-booking-flow.e2e.spec.ts
│   └── voice-agent-booking.e2e.spec.ts
└── unit/                 # Unit tests
    └── voice/
        ├── stt.service.spec.ts
        └── tts.service.spec.ts
```

## 📚 Key Features

### Booking Management

- **Create Booking**: Generate tentative bookings with topic and slot preferences
- **Confirm Booking**: Complete bookings with contact details
- **Reschedule Booking**: Change booking date/time
- **Cancel Booking**: Cancel existing bookings
- **Booking Lookup**: Find bookings by booking code (NL-XXXX format)

### Voice Agent

- **Text Mode**: Type messages for testing
- **Voice Mode**: Speak naturally using microphone
- **Topic Recognition**: Understands topics like "KYC onboarding", "SIP mandates", etc.
- **Number Selection**: Accepts "one", "two", "three" or "1", "2", "3"
- **Conversation Flow**: Guided conversation from greeting to booking confirmation
- **Session Persistence**: Conversation history saved in database

### MCP Integration

- **Google Calendar**: Creates calendar events for bookings
- **Google Sheets**: Logs booking entries in spreadsheet
- **Gmail**: Creates email drafts for advisor notifications

## 🔍 Viewing Data

### Database (SQLite)

The application uses SQLite database (`bookings.db`) to store:
- **Bookings**: All booking records with status, slots, and contact details
- **Conversation Logs**: All voice agent conversations with transcriptions

**Quick Access:**
- Use **DB Browser for SQLite** (recommended): Download from https://sqlitebrowser.org/
- Use **VS Code SQLite Extension**: Install "SQLite Viewer" extension
- Use **API Endpoints**: `GET /voice/logs/all` or `GET /voice/logs/session/:sessionId`

See `HOW_TO_VIEW_DATABASE.md` for detailed instructions on viewing the database.

### Conversation Logs

All voice agent conversations are logged to the database with:
- **User messages**: STT transcribed text with `isVoiceInput: true` metadata
- **Assistant messages**: TTS source text with `isTtsGenerated: true`, `ttsModel`, and `ttsVoice` metadata
- **System messages**: Intent recognition, state changes, and booking actions

**Viewing Options:**
1. **Database Query**: `SELECT * FROM conversation_logs WHERE sessionId = '...' ORDER BY timestamp`
2. **API Endpoint**: `GET /voice/logs/session/:sessionId`
3. **DB Browser**: Open `bookings.db` → Browse `conversation_logs` table

See `HOW_TO_VIEW_CONVERSATION_LOGS.md` for detailed instructions.

## 📖 API Endpoints

### Booking Endpoints

- `GET /bookings/:bookingCode` - Get booking by code
- `POST /bookings/:bookingCode/complete` - Complete booking with contact details
- `POST /bookings/:bookingCode/reschedule` - Reschedule booking
- `POST /bookings/:bookingCode/cancel` - Cancel booking
- `POST /bookings/offer-slots` - Get available slots
- `GET /bookings/debug/all` - Get all bookings (debug)

### Voice Agent Endpoints

- `POST /voice/session/start` - Start new conversation session
- `POST /voice/session/:sessionId/message` - Send text message
- `POST /voice/session/:sessionId/voice-message` - Send voice message (STT + TTS)
- `GET /voice/session/:sessionId/history` - Get conversation history
- `GET /voice/session/:sessionId/state` - Get session state
- `GET /voice/session/:sessionId/debug` - Get session debug info
- `GET /voice/logs/all` - Get all conversation logs
- `GET /voice/logs/session/:sessionId` - Get logs for specific session

## 🎯 Domain Models

### Topic Enum
- `KYC_ONBOARDING` - KYC/Onboarding
- `SIP_MANDATES` - SIP/Mandates
- `STATEMENTS_TAX_DOCS` - Statements/Tax Docs
- `WITHDRAWALS_TIMELINES` - Withdrawals & Timelines
- `ACCOUNT_CHANGES_NOMINEE` - Account Changes/Nominee

### Booking Status
- `TENTATIVE` - Initial booking state
- `CONFIRMED` - Booking confirmed
- `RESCHEDULED` - Booking rescheduled
- `CANCELLED` - Booking cancelled
- `WAITLISTED` - No slots available, added to waitlist

## 🔐 Security & Privacy

- No PII on voice calls (no phone/email/account numbers)
- Secure booking code format (NL-XXXX)
- Contact details only collected during booking completion
- All data stored locally in SQLite database

## 📝 Key Constraints

- Time zone: IST (Asia/Kolkata)
- Booking code format: NL-XXXX (4 alphanumeric characters)
- Business hours: 9 AM - 6 PM IST
- Slot duration: 30 minutes
- Weekends excluded
- No investment advice provided (educational links only)

## 🐛 Troubleshooting

### Voice Agent Issues

1. **502 Bad Gateway Error**: OpenAI API is temporarily unavailable. Wait a moment and try again, or use text mode.

2. **Topic Not Recognized**: 
   - Try saying just "KYC" instead of "KYC onboarding"
   - Use number selection: "one", "two", etc.
   - Switch to text mode to verify topic extraction works

3. **STT Transcription Issues**:
   - Speak clearly and slowly
   - Ensure good microphone quality
   - Check backend logs for `[STT]` messages
   - If transcription returns garbage characters, check audio quality and microphone settings
   - Try using text mode as a workaround

4. **Conversation Stuck in Loop**:
   - Check backend logs for state transitions
   - Verify topic extraction is working (check `[TOPIC EXTRACTION]` logs)
   - Try using number selection ("one", "two") instead of topic names
   - Switch to text mode to verify conversation logic

5. **Conversation Logs Not Saving**:
   - Check database file permissions
   - Verify backend logs for any database errors
   - Check that conversation log service is initialized
   - Verify session ID is being generated correctly

### Database Issues

- Database file: `bookings.db` in project root
- Use DB Browser for SQLite to view data
- See `HOW_TO_VIEW_DATABASE.md` for detailed instructions

### API Issues

- **502 Bad Gateway**: OpenAI API temporarily unavailable, wait and retry
- **401 Unauthorized**: Check `OPENAI_API_KEY` in `.env` file
- **429 Rate Limit**: Too many requests, wait before retrying

## 📝 Voice Agent Conversation Logging

### What's Logged

**User Messages (Voice Input):**
- STT transcribed text stored in `content` field
- Metadata includes `isVoiceInput: true` and `transcribedText`
- Stored with `role='user'` in `conversation_logs` table

**Assistant Messages (TTS Output):**
- Text that gets converted to TTS stored in `content` field
- Metadata includes `isTtsGenerated: true`, `ttsModel`, and `ttsVoice`
- Stored with `role='assistant'` in `conversation_logs` table

**System Messages:**
- Intent recognition results
- State transitions
- Booking actions (create, reschedule, cancel)

### Log Structure

Each log entry contains:
- `id`: Unique UUID
- `sessionId`: Conversation session ID
- `role`: 'user', 'assistant', or 'system'
- `content`: Message text
- `intent`: Detected intent (if applicable)
- `state`: Conversation state (if applicable)
- `bookingCode`: Booking code (if booking created)
- `metadata`: JSON with additional details (voice input flags, TTS model, etc.)
- `timestamp`: When the log was created

## 📄 License

MIT

## 🙏 Acknowledgments

Built with NestJS, React, TypeScript, OpenAI APIs, and Google APIs.
