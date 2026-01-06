# MCP (Model Context Protocol) Services

This module provides MCP interfaces and implementations for integrating with external services:
- **Google Calendar** - For creating tentative calendar holds
- **Google Docs** - For appending booking entries to notes
- **Gmail** - For creating email drafts (approval-gated)

## Architecture

### Interfaces

All MCP services implement interfaces defined in `src/mcp/interfaces/`:
- `ICalendarMcp` - Calendar operations
- `INotesMcp` - Notes/document operations
- `IEmailMcp` - Email draft operations

### Implementations

Current implementations in `src/mcp/services/`:
- `GoogleCalendarMcpService` - Google Calendar integration
- `GoogleDocsMcpService` - Google Docs integration
- `GmailMcpService` - Gmail integration

## Phase 4 Status

**Current Implementation:** Mock/Stub implementations
- Services are structured and ready for integration
- All interfaces are defined
- Unit tests are passing
- Services return mock data for Phase 4

**Phase 5 Integration:**
- Will replace mock implementations with actual Google API calls
- Will add OAuth2 authentication
- Will add error handling and retry logic

## Configuration

Environment variables (see `.env.example`):

```env
# Google Calendar
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_ENABLED=true

# Google Docs
GOOGLE_DOCS_PRE_BOOKINGS_DOC_ID=your-doc-id
GOOGLE_DOCS_ENABLED=true

# Gmail
ADVISOR_EMAIL=advisor@example.com
GMAIL_ENABLED=true
```

## Usage

### In NestJS Services

```typescript
import { GoogleCalendarMcpService } from './mcp/services/google-calendar-mcp.service';

@Injectable()
export class BookingService {
  constructor(
    private calendarMcp: GoogleCalendarMcpService,
  ) {}

  async confirmBooking(bookingCode: string) {
    // Create calendar hold
    const calendarEvent = await this.calendarMcp.createTentativeHold(
      booking.topic,
      bookingCode,
      booking.preferredSlot,
    );
  }
}
```

## API Reference

### GoogleCalendarMcpService

#### `createTentativeHold(topic, bookingCode, slot)`

Creates a tentative calendar hold with title format:
`"Advisor Q&A — {Topic} — {Code}"`

**Parameters:**
- `topic: Topic` - Appointment topic
- `bookingCode: string` - Booking code (e.g., "NL-A742")
- `slot: Slot` - Time slot for appointment

**Returns:** `Promise<CalendarEventResult>`

### GoogleDocsMcpService

#### `appendBookingEntry(date, topic, slot, bookingCode)`

Appends booking entry to "Advisor Pre-Bookings" document.

**Format:** `{date} | {time} | {topic} | {code} | Slot: {slotId}`

**Parameters:**
- `date: Date` - Booking date
- `topic: Topic` - Appointment topic
- `slot: Slot` - Time slot
- `bookingCode: string` - Booking code

**Returns:** `Promise<NotesAppendResult>`

### GmailMcpService

#### `createAdvisorEmailDraft(topic, bookingCode, slot, contactDetails)`

Creates an email draft for advisor notification (approval-gated).

**Email includes:**
- Booking code
- Topic
- Date and time (IST)
- Contact details (name, email, phone)
- Additional notes (if provided)

**Parameters:**
- `topic: Topic` - Appointment topic
- `bookingCode: string` - Booking code
- `slot: Slot` - Confirmed time slot
- `contactDetails: EmailContactDetails` - Contact information

**Returns:** `Promise<EmailDraftResult>`

## Testing

Run MCP service tests:

```bash
npm test -- src/mcp
```

## Next Steps (Phase 5)

1. Add Google OAuth2 authentication
2. Implement actual Google Calendar API calls
3. Implement actual Google Docs API calls
4. Implement actual Gmail API calls
5. Add error handling and retry logic
6. Add logging and monitoring

