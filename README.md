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
  - PostgreSQL (via `pg` - Railway managed)
  - TypeORM 0.3.28 (ORM)
  - SQLite 3 (via `sqlite3` 5.1.7) - for local development only
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

## 🏗️ System Architecture

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Frontend (Vercel)                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │   React UI   │  │ Voice Agent  │  │ Booking      │     │  │
│  │  │   Components │  │   Modal      │  │ Management   │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │         │                  │                  │               │  │
│  │         └──────────────────┼──────────────────┘               │  │
│  │                            │                                   │  │
│  │                    ┌───────▼────────┐                          │  │
│  │                    │  API Service  │                          │  │
│  │                    │    Layer       │                          │  │
│  │                    └───────┬────────┘                          │  │
│  └────────────────────────────┼──────────────────────────────────┘  │
│                               │ HTTP/REST API                        │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                      BACKEND LAYER (Railway)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    NestJS Application                        │  │
│  │                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │   Booking    │  │   Voice      │  │     MCP      │       │  │
│  │  │   Module     │  │   Module     │  │   Module     │       │  │
│  │  │              │  │              │  │              │       │  │
│  │  │ • Create     │  │ • STT        │  │ • Calendar   │       │  │
│  │  │ • Complete   │  │ • TTS        │  │ • Sheets     │       │  │
│  │  │ • Cancel     │  │ • Intent     │  │ • Gmail      │       │  │
│  │  │ • Reschedule │  │ • Conversation│ │ • OAuth      │       │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │  │
│  │         │                  │                  │               │  │
│  │         └──────────────────┼──────────────────┘               │  │
│  │                            │                                   │  │
│  │                    ┌───────▼────────┐                          │  │
│  │                    │  Domain Layer  │                          │  │
│  │                    │  (Business    │                          │  │
│  │                    │   Logic)      │                          │  │
│  │                    └───────┬────────┘                          │  │
│  └────────────────────────────┼──────────────────────────────────┘  │
│                               │                                       │
│  ┌────────────────────────────▼──────────────────────────────────┐  │
│  │                    Data Access Layer                           │  │
│  │                    (TypeORM)                                  │  │
│  └────────────────────────────┬──────────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                      DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database (Railway)                   │  │
│  │                                                               │  │
│  │  ┌──────────────┐              ┌──────────────┐            │  │
│  │  │   bookings   │              │ conversation│            │  │
│  │  │     table    │              │    logs     │            │  │
│  │  │              │              │    table    │            │  │
│  │  └──────────────┘              └──────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │   OpenAI     │  │   Google     │  │   Google     │            │  │
│  │   APIs       │  │   Calendar  │  │   Sheets     │            │  │
│  │              │  │   API       │  │   API        │            │  │
│  │ • Whisper    │  │              │  │              │            │  │
│  │ • TTS        │  └──────────────┘  └──────────────┘            │  │
│  │ • GPT-4o     │  ┌──────────────┐                             │  │
│  └──────────────┘  │   Gmail API  │                             │  │
│                    └──────────────┘                             │  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**1. Booking Creation Flow:**
```
User (Frontend) 
  → API Service Layer 
  → Booking Controller 
  → Booking Service 
  → Domain Service 
  → TypeORM Repository 
  → PostgreSQL Database
```

**2. Voice Agent Flow:**
```
User Voice Input (Frontend)
  → Voice Controller (/voice/session/:id/voice-message)
  → STT Service (OpenAI Whisper)
  → Conversation Service (Intent Recognition)
  → Domain Service (Booking Logic)
  → TTS Service (OpenAI TTS)
  → Audio Response to User
```

**3. Booking Completion Flow:**
```
User Completes Booking (Frontend)
  → Booking Controller (/bookings/:code/complete)
  → Booking Service
  → MCP Orchestration
    ├── Google Calendar Service → Create Event
    ├── Google Sheets Service → Add Row
    └── Gmail Service → Create Draft
  → Update Database (Status: CONFIRMED)
```

### Data Flow Architecture

**Request Flow:**
1. **Client Request** → Frontend makes HTTP request
2. **API Gateway** → NestJS routes to appropriate controller
3. **Controller** → Validates request, calls service
4. **Service Layer** → Business logic processing
5. **Domain Layer** → Core domain logic
6. **Repository** → Data access via TypeORM
7. **Database** → PostgreSQL stores/retrieves data

**Response Flow:**
1. **Database** → Returns data
2. **Repository** → Maps to domain models
3. **Service** → Applies business rules
4. **Controller** → Maps to DTOs
5. **API Response** → JSON sent to client

### Service Architecture

**Backend Services:**
- **Booking Service**: Manages booking CRUD operations
- **Voice Service**: Handles STT, TTS, and conversation management
- **Conversation Service**: Manages conversation state and flow
- **Intent Recognition Service**: Classifies user intents using LLM
- **Slot Service**: Manages slot availability and offering
- **MCP Services**: Google Calendar, Sheets, and Gmail integrations

**Frontend Services:**
- **Booking Service**: API calls for booking operations
- **Voice Agent Service**: WebSocket/HTTP communication with voice endpoints

### Security Architecture

- **CORS**: Configured for specific frontend origins
- **Input Validation**: DTOs with class-validator
- **Environment Variables**: Sensitive data stored securely
- **OAuth 2.0**: Google API authentication
- **API Keys**: OpenAI and Google credentials secured

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
- OpenAI API key (for voice agent) - Get from https://platform.openai.com/api-keys
- Google Cloud Project with APIs enabled (optional, for MCP services)

### Local Development Setup

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

   # Database (PostgreSQL for production, SQLite for local)
   # For local development, SQLite is used automatically
   # For production, set DATABASE_URL from Railway PostgreSQL service
   DATABASE_URL=postgresql://postgres:password@localhost:5432/your_db
   DATABASE_SYNC=true

   # OpenAI (Required for Voice Agent)
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_TTS_MODEL=tts-1
   OPENAI_TTS_VOICE=nova

   # Google OAuth (Optional - for MCP services)
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   GOOGLE_REFRESH_TOKEN=your_refresh_token

   # Google Calendar
   GOOGLE_CALENDAR_ID=primary
   GOOGLE_CALENDAR_ENABLED=true

   # Google Sheets
   GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SHEETS_SHEET_NAME=Sheet1
   GOOGLE_SHEETS_ENABLED=true

   # Google Docs
   GOOGLE_DOCS_PRE_BOOKINGS_DOC_ID=your_doc_id
   GOOGLE_DOCS_ENABLED=true

   # Gmail
   ADVISOR_EMAIL=advisor@example.com
   GMAIL_ENABLED=true
   ```

5. **Run the application**
   
   **Backend** (Terminal 1):
   ```bash
   npm run start:dev
   ```
   Backend will be available at `http://localhost:3000`

   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

---

## 🚀 Deployment Guide

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   Railway        │         │   Vercel          │     │
│  │   (Backend)      │◄────────┤   (Frontend)     │     │
│  │                  │  API    │                  │     │
│  │  • Node.js App   │  Calls  │  • React App     │     │
│  │  • PostgreSQL    │         │  • Static Files   │     │
│  │  (Railway DB)    │         │                  │     │
│  └──────────────────┘         └──────────────────┘     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ **Backend** → Railway (Node.js NestJS application)
- ✅ **Database** → Railway PostgreSQL (managed database service)
- ✅ **Frontend** → Vercel (React static files)

---

## 📋 Part 1: Backend Deployment (Railway)

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended)
4. Authorize Railway to access your GitHub repositories

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `VA_Advisor_Appointment_Scheduler`
4. Railway will automatically detect it's a Node.js project

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create a PostgreSQL database
3. **Copy the `DATABASE_URL`** from the database service's **Variables** tab
   - It will look like: `postgresql://postgres:password@hostname:5432/railway`
   - You'll need this in the next step

### Step 4: Configure Build Settings

**⚠️ Important: We're deploying ONLY the backend to Railway. The frontend will be deployed separately to Vercel.**

1. Click on your **backend service** (not the database)
2. Go to **Settings** tab
3. **Root Directory**: Set to `.` (project root)
4. **Build Command**: `npm install && npm run build` (or use `railway.json` which is already configured)
5. **Start Command**: `npm run start:prod`

**Note:** The project includes a `railway.json` file that automatically configures these settings.

### Step 5: Add Environment Variables

1. Go to your **backend service** → **Variables** tab
2. Click **"New Variable"** for each variable
3. Add the following (update values as needed):

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend.vercel.app

# Database (PostgreSQL) - Copy from Railway PostgreSQL service
DATABASE_URL=postgresql://postgres:password@hostname:5432/railway
DATABASE_SYNC=true

# OpenAI (Required)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=nova

# Google APIs (Optional - can leave empty for mock mode)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID=
GOOGLE_SHEETS_SHEET_NAME=Sheet1
GOOGLE_SHEETS_ENABLED=true
ADVISOR_EMAIL=advisor@example.com
GMAIL_ENABLED=true
```

**Important Notes:**
- `DATABASE_URL` - Copy this from your PostgreSQL service's Variables tab in Railway
- `DATABASE_SYNC=true` - Enables automatic table creation (set to `false` in production after initial setup)
- Replace `your-openai-key-here` with your actual OpenAI API key
- `FRONTEND_URL` - Update this after deploying frontend (Step 6 in Part 2)
- Google API variables can be empty if using mock mode

### Step 6: Deploy Backend & Generate Public Domain

1. Railway will automatically start deploying after you add environment variables
2. Watch **Deploy Logs** tab for progress
3. Wait for "Build successful" message
4. **Generate Public Domain:**
   - Go to **Settings** tab
   - Scroll to **Networking** section
   - Under **"Public Networking"**, click **"Generate Domain"** button
   - Wait a few seconds for Railway to create the domain
   - Your backend URL will appear (e.g., `https://your-app-name.up.railway.app`)
5. **Copy this URL** - you'll need it for frontend configuration

### Step 7: Verify Backend & Database

**Quick Verification:**

1. **Get your backend URL:**
   - Railway dashboard → Settings → Networking → Copy Public Domain URL
   - Example: `https://your-app-name.up.railway.app`

2. **Test root endpoint:**
   - Open: `https://your-app-name.up.railway.app/`
   - ✅ Should return JSON with API information and database status

3. **Test database endpoint:**
   - Open: `https://your-app-name.up.railway.app/db-info`
   - ✅ Should return database type (PostgreSQL) and connection status

4. **Test bookings endpoint:**
   - Open: `https://your-app-name.up.railway.app/bookings/debug/all`
   - ✅ Should return JSON: `[]` (empty array) or booking data

5. **Check Railway logs:**
   - Go to **Deploy Logs** tab
   - Look for: "Server running on port 8080"
   - ✅ No error messages

**Database:**
- PostgreSQL database is automatically created by Railway
- Tables are created automatically when `DATABASE_SYNC=true`
- Database persists on Railway's managed PostgreSQL service ✅

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended)
4. Authorize Vercel to access your GitHub repositories

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find your repository: `VA_Advisor_Appointment_Scheduler`
3. Click **"Import"**

### Step 3: Configure Project Settings

**⚠️ IMPORTANT Settings:**
- **Framework Preset**: Vite (should auto-detect)
- **Root Directory**: `frontend` ⚠️ **MUST SET THIS!**
- **Build Command**: `npm run build` (should auto-fill)
- **Output Directory**: `dist` (should auto-fill)
- **Install Command**: `npm install` (should auto-fill)

### Step 4: Add Environment Variable

1. Scroll down to **Environment Variables** section
2. Click **"Add"**
3. Add:
   ```
   Variable Name: VITE_API_BASE_URL
   Value: https://your-app-name.up.railway.app
   ```
   (Replace with your Railway backend URL from Part 1, Step 5)

### Step 5: Deploy Frontend

1. Click **"Deploy"** button
2. Wait for build to complete (2-3 minutes)
3. Once deployed, Vercel provides a URL: `https://your-app-name.vercel.app`
4. **Copy this URL** - this is your frontend URL

### Step 6: Update Backend CORS

1. Go back to Railway dashboard
2. Go to **Variables** tab
3. Update `FRONTEND_URL` to: `https://your-app-name.vercel.app`
4. Railway will automatically redeploy with updated CORS settings

### Step 7: Test Frontend in Production

1. **Open your Vercel URL:**
   - Navigate to: `https://your-app-name.vercel.app`
   - The page should load without errors

2. **Verify Basic Functionality:**
   - ✅ Page loads successfully
   - ✅ No console errors (press F12 to open browser console)
   - ✅ No CORS errors in console
   - ✅ UI elements are visible and styled correctly

3. **Test Booking Lookup:**
   - Enter a booking code (if you have one from previous tests)
   - Verify booking details are displayed correctly
   - Test with invalid booking code to see error handling

4. **Test Voice Agent:**
   - Click the **"Voice Agent"** button
   - Modal should open with voice agent interface
   - **Text Mode Test:**
     - Type a message: "Hello"
     - Verify you get a greeting response
     - Try: "I want to book an appointment for KYC onboarding"
     - Follow the conversation flow
   - **Voice Mode Test (if microphone is available):**
     - Click microphone button
     - Speak clearly: "Hello"
     - Verify transcription appears
     - Verify voice response plays back

5. **Test Complete Booking Flow:**
   - Start a new conversation via Voice Agent
   - Select a topic (e.g., "KYC onboarding")
   - Choose a time preference (e.g., "Monday morning")
   - Select a slot from the offered options
   - Confirm the booking
   - Complete booking with contact details
   - Verify booking code is generated
   - Verify confirmation message appears

6. **Verify Backend Integration:**
   - Check browser Network tab (F12 → Network)
   - Verify API calls are going to your Railway backend URL
   - Verify responses are successful (status 200)
   - Check that bookings are being created in database

7. **Test on Different Devices:**
   - Test on desktop browser
   - Test on mobile device (if applicable)
   - Verify responsive design works correctly

**Expected Behavior:**
- ✅ All API calls succeed
- ✅ Voice agent conversation flows smoothly
- ✅ Bookings are created and stored
- ✅ No errors in browser console
- ✅ UI is responsive and user-friendly

---

## 💾 PostgreSQL Database on Railway

### How It Works

**✅ Database is managed by Railway PostgreSQL service:**

1. **Database Service**
   - PostgreSQL database is created as a separate Railway service
   - Managed by Railway (automatic backups, scaling, etc.)
   - Connection string provided via `DATABASE_URL` environment variable

2. **Persistence**
   - ✅ Railway automatically manages PostgreSQL persistence
   - ✅ Database survives redeployments
   - ✅ Automatic backups (Railway managed)
   - ✅ Production-ready and scalable

3. **What's Stored**
   - `bookings` table - All booking records
   - `conversation_logs` table - Voice agent conversation history

4. **Table Creation**
   - Tables are created automatically when `DATABASE_SYNC=true`
   - After initial setup, set `DATABASE_SYNC=false` for production safety
   - Or use TypeORM migrations for production deployments

### Database Lifecycle

```
First Deployment:
  PostgreSQL service created → Backend connects → Tables created → Ready!

Redeployment:
  Backend redeploys → Connects to existing PostgreSQL → Data intact → Ready!

Data Storage:
  All bookings and logs → Stored in PostgreSQL → Railway managed service
```

### Database Backup

**✅ Railway automatically handles PostgreSQL backups:**
- Railway manages automatic backups for PostgreSQL services
- Check Railway dashboard for backup and restore options
- No manual backup setup required

---

## ✅ Post-Deployment Verification

### Backend Verification

- [ ] Backend URL accessible: `https://your-app.up.railway.app`
- [ ] Health check works: `GET /bookings/debug/all`
- [ ] Database file created (check Railway logs)
- [ ] Can create bookings via API
- [ ] Data persists after redeploy

### Frontend Verification

- [ ] Frontend URL accessible: `https://your-app.vercel.app`
- [ ] Page loads without errors
- [ ] No CORS errors in browser console
- [ ] Can connect to backend API
- [ ] Voice agent works

### Database Verification

- [ ] PostgreSQL service is running in Railway
- [ ] `DATABASE_URL` is set correctly
- [ ] Database tables created (check `/db-info` endpoint)
- [ ] Can create bookings (test via UI)
- [ ] Bookings persist after page refresh
- [ ] Conversation logs are being saved
- [ ] Data survives redeployments

### Integration Verification

- [ ] Frontend can connect to backend (check browser console)
- [ ] CORS is configured correctly (no CORS errors)
- [ ] Voice agent can process messages
- [ ] Bookings are being created in database
- [ ] Complete booking flow works end-to-end

---

## 🐛 Deployment Troubleshooting

### Backend Issues

**Build Fails:**
- Check Railway logs for specific error
- Verify all dependencies are in `package.json`
- Check for TypeScript compilation errors

**Backend Not Starting:**
- Verify `start:prod` command is correct
- Check all required environment variables are set
- Review logs for error messages

**502 Bad Gateway / Application failed to respond:**
- **First**: Check Railway **Deploy Logs** tab for error messages
- Backend might be starting up (wait 1-2 minutes)
- Check if backend process is running
- Review logs for crashes
- Verify Start Command is `npm run start:prod` (not build command)
- Check if `dist/main.js` exists (build must complete successfully)
- Verify environment variables are set (especially `PORT` and `OPENAI_API_KEY`)
- See `TROUBLESHOOT_RAILWAY_ERROR.md` for detailed debugging steps

### Frontend Issues

**Build Fails:**
- Verify `frontend` is set as root directory
- Check build command: `npm run build`
- Review for TypeScript errors

**API Connection Errors:**
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend URL is accessible
- Verify CORS is configured in backend

**Blank Page:**
- Check browser console for errors
- Verify build output directory is `dist`
- Check if index.html exists in dist folder

### Database Issues

**Database Connection Failed:**
- Verify `DATABASE_URL` is set correctly (copy from PostgreSQL service)
- Check PostgreSQL service is running in Railway
- Verify `DATABASE_SYNC=true` for initial table creation
- Check Railway logs for connection errors

**Tables Not Created:**
- Ensure `DATABASE_SYNC=true` is set (for initial setup)
- Check Railway logs for TypeORM errors
- Verify `DATABASE_URL` format is correct
- After initial setup, consider using migrations instead of sync

**Database Not Persisting:**
- Railway PostgreSQL automatically persists data
- Test: Create booking → Redeploy → Check if booking exists
- Verify PostgreSQL service is not being deleted/recreated

### CORS Issues

**CORS Errors in Browser:**
- Verify `FRONTEND_URL` in Railway matches Vercel URL exactly
- Check backend logs for CORS configuration
- Ensure no trailing slashes in URLs
- Verify credentials are enabled if using cookies

## 🧪 Comprehensive Testing Guide

This section provides detailed instructions for testing all functionalities of the application in production.

---

## 📋 Part 1: Backend API Testing

### Prerequisites
- Backend URL: `https://your-app-name.up.railway.app`
- API testing tool: Browser, Postman, or cURL

### 1. Health Check & System Info

**Test Root Endpoint:**
```bash
curl https://your-app-name.up.railway.app/
```
**Expected:** JSON response with API information, database status, and available endpoints

**Test Health Endpoint:**
```bash
curl https://your-app-name.up.railway.app/health
```
**Expected:** `{"status":"ok"}`

**Test Database Info:**
```bash
curl https://your-app-name.up.railway.app/db-info
```
**Expected:** Database type (PostgreSQL), connection status, and environment info

**Test Google API Status:**
```bash
curl https://your-app-name.up.railway.app/google-api-status
```
**Expected:** OAuth configuration status and MCP service status (mock/real)

---

### 2. Booking Creation

**Create a New Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "KYC/Onboarding",
    "preferredSlot": {
      "id": "slot-2026-01-25-10:00",
      "startTime": "2026-01-25T10:00:00.000Z",
      "endTime": "2026-01-25T10:30:00.000Z",
      "isAvailable": true
    }
  }'
```
**Expected:** JSON with `bookingCode` (e.g., `NL-XXXX`), `status: "TENTATIVE"`, and slot details

**Test with Different Topics:**
- `KYC/Onboarding`
- `SIP/Mandates`
- `Statements/Tax Docs`
- `Withdrawals & Timelines`
- `Account Changes/Nominee`

**Verify:** Each booking gets a unique booking code

---

### 3. Booking Lookup

**Get Booking by Code:**
```bash
curl https://your-app-name.up.railway.app/bookings/NL-XXXX
```
**Expected:** Full booking details including topic, slot, status, and contact details (if completed)

**Test Invalid Booking Code:**
```bash
curl https://your-app-name.up.railway.app/bookings/INVALID
```
**Expected:** `404 Not Found` with "Booking not found" message

**Test Cancelled Booking:**
```bash
curl https://your-app-name.up.railway.app/bookings/NL-CANCELLED
```
**Expected:** `410 Gone` with "This booking has been cancelled" message

---

### 4. Complete Booking

**Complete a Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/NL-XXXX/complete \
  -H "Content-Type: application/json" \
  -d '{
    "contactDetails": {
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210",
      "additionalNotes": "Test booking completion"
    }
  }'
```
**Expected:** `{"success": true, "message": "Booking completed successfully"}`

**Verify:**
- Booking status changes to `CONFIRMED`
- Google Calendar event is created (if APIs configured)
- Google Sheets entry is added (if APIs configured)
- Gmail draft is created (if APIs configured)

**Test with Missing Fields:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/NL-XXXX/complete \
  -H "Content-Type: application/json" \
  -d '{
    "contactDetails": {
      "fullName": "John Doe"
    }
  }'
```
**Expected:** Validation error for missing required fields

---

### 5. Cancel Booking

**Cancel a Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/NL-XXXX/cancel \
  -H "Content-Type: application/json"
```
**Expected:** `{"success": true, "message": "Booking cancelled successfully"}`

**Verify:**
- Booking status changes to `CANCELLED`
- Google Calendar event is updated (if APIs configured)
- Google Sheets entry is updated (if APIs configured)
- Cancellation email draft is created (if APIs configured)

**Test Cancelling Already Cancelled Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/NL-CANCELLED/cancel
```
**Expected:** Error message indicating booking is already cancelled

---

### 6. Reschedule Booking

**Reschedule a Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/NL-XXXX/reschedule \
  -H "Content-Type: application/json" \
  -d '{
    "newSlot": {
      "id": "slot-2026-01-26-14:00",
      "startTime": "2026-01-26T14:00:00.000Z",
      "endTime": "2026-01-26T14:30:00.000Z",
      "isAvailable": true
    }
  }'
```
**Expected:** `{"success": true, "message": "Booking rescheduled successfully"}`

**Verify:**
- Booking slot is updated
- Booking status changes to `RESCHEDULED`
- Google Calendar event is updated (if APIs configured)
- Google Sheets entry is updated (if APIs configured)

**Test Rescheduling to Unavailable Slot:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/NL-XXXX/reschedule \
  -H "Content-Type: application/json" \
  -d '{
    "newSlot": {
      "id": "slot-2026-01-25-10:00",
      "startTime": "2026-01-25T10:00:00.000Z",
      "endTime": "2026-01-25T10:30:00.000Z",
      "isAvailable": false
    }
  }'
```
**Expected:** Error indicating slot is not available

---

### 7. Get Available Slots

**Request Available Slots:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/offer-slots \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-25",
    "timePreference": "morning"
  }'
```
**Expected:** Array of available slots for the specified date and time preference

**Test Different Time Preferences:**
- `morning` - 9:00 AM - 12:00 PM
- `afternoon` - 12:00 PM - 3:00 PM
- `evening` - 3:00 PM - 6:00 PM

**Test with Specific Date:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/offer-slots \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-25"
  }'
```
**Expected:** All available slots for that date

---

### 8. Debug Endpoints

**Get All Bookings (Debug):**
```bash
curl https://your-app-name.up.railway.app/bookings/debug/all
```
**Expected:** Array of all bookings in the database

**Create Test Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/bookings/test/create \
  -H "Content-Type: application/json"
```
**Expected:** A test booking with random data

---

## 🎤 Part 2: Voice Agent Testing

### Prerequisites
- Backend URL: `https://your-app-name.up.railway.app`
- Frontend URL: `https://your-app-name.vercel.app` (or use API directly)

### 1. Start a Conversation Session

**Start New Session:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/session/start \
  -H "Content-Type: application/json"
```
**Expected:** JSON with `sessionId` and `greeting` message

**Save the `sessionId`** for subsequent requests

---

### 2. Send Text Messages

**Send a Greeting:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/session/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello"
  }'
```
**Expected:** Assistant greeting and conversation start

**Request Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/session/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I want to book an appointment for KYC onboarding"
  }'
```
**Expected:** Assistant asks for time preference

**Provide Time Preference:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/session/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Monday morning"
  }'
```
**Expected:** Assistant offers available slots

**Select a Slot:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/session/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Slot number 1"
  }'
```
**Expected:** Assistant asks for confirmation

**Confirm Booking:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/session/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Yes"
  }'
```
**Expected:** Booking created with booking code

---

### 3. Send Voice Messages (STT + TTS)

**Send Voice Message:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/session/{sessionId}/voice-message \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@audio-file.webm"
```
**Expected:** 
- Audio is transcribed (STT)
- Assistant response is generated
- Audio response is returned (TTS)

**Note:** Requires a valid audio file (WebM, WAV, or MP3 format)

---

### 4. Get Conversation History

**Get Full History:**
```bash
curl https://your-app-name.up.railway.app/voice/session/{sessionId}/history
```
**Expected:** Array of all messages in the conversation

**Verify:**
- User messages are included
- Assistant responses are included
- System messages (intent, state changes) are included
- Timestamps are present

---

### 5. Get Session State

**Get Current State:**
```bash
curl https://your-app-name.up.railway.app/voice/session/{sessionId}/state
```
**Expected:** Current conversation state, intent, and booking code (if booking created)

**Verify:**
- State transitions correctly (greeting → collecting_topic → collecting_time_preference → offering_slots → confirming_booking → completed)
- Intent is recognized correctly
- Booking code is present when booking is created

---

### 6. Get Session Debug Info

**Get Debug Information:**
```bash
curl https://your-app-name.up.railway.app/voice/session/{sessionId}/debug
```
**Expected:** Detailed debug information including state, intent, history, and metadata

---

### 7. View All Conversation Logs

**Get All Logs:**
```bash
curl https://your-app-name.up.railway.app/voice/logs/all
```
**Expected:** Array of all conversation logs from all sessions

**Get Logs for Specific Session:**
```bash
curl https://your-app-name.up.railway.app/voice/logs/session/{sessionId}
```
**Expected:** All logs for the specified session

---

### 8. Test STT (Speech-to-Text) Directly

**Test STT Endpoint:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/stt \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@audio-file.webm"
```
**Expected:** Transcribed text from the audio file

**Verify:**
- Transcription is accurate
- Handles different audio formats (WebM, WAV, MP3)
- Returns error for invalid audio files

---

### 9. Test TTS (Text-to-Speech) Directly

**Test TTS Endpoint:**
```bash
curl -X POST https://your-app-name.up.railway.app/voice/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how can I help you today?"
  }'
```
**Expected:** Audio file (MP3) as binary response

**Verify:**
- Audio is generated correctly
- Can be played in audio player
- Different voices work (if configured)

---

## 🎯 Part 3: Complete Booking Flow Testing

### End-to-End Test Scenario

**Step 1: Create Booking via Voice Agent**
1. Start a conversation session
2. Send: "I want to book an appointment for KYC onboarding"
3. Send: "Monday morning"
4. Send: "Slot number 1"
5. Send: "Yes" to confirm
6. **Verify:** Booking code is received

**Step 2: Complete Booking**
1. Use the booking code from Step 1
2. Complete booking with contact details
3. **Verify:** 
   - Booking status is `CONFIRMED`
   - Google Calendar event created (check calendar)
   - Google Sheets entry added (check spreadsheet)
   - Gmail draft created (check drafts)

**Step 3: Reschedule Booking**
1. Use the booking code from Step 1
2. Reschedule to a different slot
3. **Verify:**
   - Booking status is `RESCHEDULED`
   - Slot is updated
   - Google Calendar event updated
   - Google Sheets entry updated

**Step 4: Cancel Booking**
1. Use the booking code from Step 1
2. Cancel the booking
3. **Verify:**
   - Booking status is `CANCELLED`
   - Cannot lookup booking (returns 410)
   - Google Calendar event updated
   - Cancellation email draft created

---

## 🔍 Part 4: Database Verification

### Check Database Contents

**Via API:**
```bash
# Get all bookings
curl https://your-app-name.up.railway.app/bookings/debug/all

# Get all conversation logs
curl https://your-app-name.up.railway.app/voice/logs/all
```

**Via Railway PostgreSQL:**
1. Go to Railway dashboard
2. Open PostgreSQL service
3. Use Railway's database viewer or connect via CLI
4. Query tables:
   ```sql
   SELECT * FROM bookings;
   SELECT * FROM conversation_logs;
   ```

**Verify:**
- Bookings are persisted correctly
- Conversation logs are saved
- Data survives redeployments

---

## 🔗 Part 5: Google API Integration Testing

### Prerequisites
- Google OAuth credentials configured
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` set in Railway

### 1. Check API Status

```bash
curl https://your-app-name.up.railway.app/google-api-status
```
**Expected:** Shows which services are using real APIs vs mock mode

### 2. Test Calendar Integration

**Create a Booking:**
1. Complete a booking via API or voice agent
2. **Verify:** 
   - Go to Google Calendar
   - Event appears with correct title: "Advisor Q&A — {Topic} — {Code}"
   - Time is correct (IST timezone)
   - Event details are correct

### 3. Test Sheets Integration

**Create a Booking:**
1. Complete a booking via API or voice agent
2. **Verify:**
   - Go to Google Sheets
   - New row added with booking details
   - Date and time are correct (IST)
   - Booking code, topic, and contact details are present

### 4. Test Gmail Integration

**Create a Booking:**
1. Complete a booking via API or voice agent
2. **Verify:**
   - Go to Gmail → Drafts
   - Draft email created with booking details
   - Subject line includes booking code
   - Email body has correct date/time (IST)
   - Contact details are included

**Cancel a Booking:**
1. Cancel a booking
2. **Verify:**
   - Cancellation email draft created
   - Email mentions cancellation

---

## 🧪 Running Automated Tests

### Backend Tests
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

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Run Specific Test Suites
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

### Database (PostgreSQL)

The application uses PostgreSQL database (production) or SQLite (local development) to store:
- **Bookings**: All booking records with status, slots, and contact details
- **Conversation Logs**: All voice agent conversations with transcriptions

**Quick Access:**
- **Production**: Use Railway PostgreSQL dashboard or connect via `DATABASE_URL`
- **Local Development**: Use **DB Browser for SQLite** (recommended): Download from https://sqlitebrowser.org/
- **API Endpoints**: `GET /voice/logs/all` or `GET /voice/logs/session/:sessionId`
- **Database Info**: `GET /db-info` - Returns database type and connection status

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
- All data stored in PostgreSQL database (production) or SQLite (local development)

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
