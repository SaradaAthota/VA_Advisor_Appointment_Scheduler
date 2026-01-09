# How to Check Gmail, Calendar, and Sheets for Booking Updates

## 📋 Overview

When a booking is **completed** (via `/bookings/:bookingCode/complete`), the system automatically:
1. ✅ Creates a calendar event in Google Calendar
2. ✅ Appends a row to Google Sheets
3. ✅ Creates an email draft in Gmail

**Important:** These actions only work if Google OAuth is properly configured. Otherwise, the system runs in "mock mode" (logs actions but doesn't actually create anything).

---

## 🔍 Step 1: Check if Google APIs are Enabled

### Check Railway Logs

1. Go to **Railway Dashboard** → Your backend service
2. Click **"Deploy Logs"** or **"Logs"** tab
3. Look for these messages at startup:

**If you see:**
```
[GoogleCalendarMcpService] Google Calendar MCP Service initialized in mock mode
[GoogleSheetsMcpService] Google Sheets MCP Service initialized in mock mode
[GmailMcpService] Gmail MCP Service initialized in mock mode
```
→ **Mock mode is active** - No real API calls are being made

**If you see:**
```
[GoogleCalendarMcpService] Google Calendar MCP Service initialized with real API
[GoogleSheetsMcpService] Google Sheets MCP Service initialized with real API
[GmailMcpService] Gmail MCP Service initialized with real API
```
→ **Real API is active** - Actual Google API calls are being made

---

## 🔧 Step 2: Enable Real Google APIs (If in Mock Mode)

To enable real Google API integration, you need to set these environment variables in Railway:

### Required Environment Variables

1. **Google OAuth Credentials:**
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=https://your-backend-url/auth/google/callback
   GOOGLE_REFRESH_TOKEN=your-refresh-token
   ```

2. **Google Calendar:**
   ```
   GOOGLE_CALENDAR_ID=primary
   GOOGLE_CALENDAR_ENABLED=true
   ```

3. **Google Sheets:**
   ```
   GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID=your-spreadsheet-id
   GOOGLE_SHEETS_SHEET_NAME=Sheet1
   GOOGLE_SHEETS_ENABLED=true
   ```

4. **Gmail:**
   ```
   ADVISOR_EMAIL=your-email@gmail.com
   GMAIL_ENABLED=true
   ```

### How to Set Environment Variables in Railway

1. Go to **Railway Dashboard** → Your backend service
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Add each variable name and value
5. Click **"Add"**
6. Railway will automatically redeploy

---

## 📅 Step 3: How to Check Each Service

### 1. Check Google Calendar

**What to look for:**
- Event title format: `Advisor Q&A — {Topic} — {BookingCode}`
- Example: `Advisor Q&A — KYC/Onboarding — NL-R94U`
- Event time matches the booking slot time
- Event is marked as "Tentative" or "Busy"

**How to check:**
1. Go to [Google Calendar](https://calendar.google.com)
2. Look for events with title starting with "Advisor Q&A"
3. Check the date and time match your booking
4. Click on the event to see details

**If no events appear:**
- Check Railway logs for errors during booking completion
- Verify `GOOGLE_CALENDAR_ENABLED=true` is set
- Verify OAuth credentials are correct
- Check if service is in mock mode

---

### 2. Check Google Sheets

**What to look for:**
- New row added to your spreadsheet
- Columns: Date | Time | Topic | Booking Code | Status
- Example row:
  ```
  January 16, 2026 | 10:00 AM - 10:30 AM | KYC/Onboarding | NL-R94U | TENTATIVE
  ```

**How to check:**
1. Open your Google Sheets spreadsheet
2. Go to the sheet specified in `GOOGLE_SHEETS_SHEET_NAME` (default: `Sheet1`)
3. Look for new rows at the bottom
4. Check the booking code matches

**If no rows appear:**
- Check Railway logs for errors
- Verify `GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID` is correct
- Verify `GOOGLE_SHEETS_ENABLED=true` is set
- Verify the spreadsheet ID has the correct format (no spaces)
- Check if service is in mock mode

**Spreadsheet ID format:**
- Correct: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- Wrong: ` 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms ` (with spaces)

---

### 3. Check Gmail

**What to look for:**
- Email draft in Gmail
- Subject: `New Advisor Appointment: {Topic} — {BookingCode}`
- Example: `New Advisor Appointment: KYC/Onboarding — NL-R94U`
- Draft contains booking details and contact information

**How to check:**
1. Go to [Gmail](https://mail.google.com)
2. Click **"Drafts"** in the left sidebar
3. Look for emails with subject starting with "New Advisor Appointment"
4. Open the draft to see booking details

**If no drafts appear:**
- Check Railway logs for errors
- Verify `ADVISOR_EMAIL` is set to your Gmail address
- Verify `GMAIL_ENABLED=true` is set
- Verify OAuth has Gmail scope permissions
- Check if service is in mock mode

---

## 🧪 Step 4: Test Booking Completion

### Create a Test Booking

1. **Create a booking** via frontend or API:
   ```bash
   curl -X POST https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app/bookings/create \
     -H "Content-Type: application/json" \
     -d '{
       "topic": "KYC/Onboarding",
       "preferredSlot": {
         "id": "slot-2026-01-16-10:00",
         "startTime": "2026-01-16T10:00:00.000Z",
         "endTime": "2026-01-16T10:30:00.000Z",
         "isAvailable": true
       }
     }'
   ```

2. **Note the booking code** from the response (e.g., `NL-R94U`)

3. **Complete the booking** with contact details:
   ```bash
   curl -X POST https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app/bookings/NL-R94U/complete \
     -H "Content-Type: application/json" \
     -d '{
       "contactDetails": {
         "fullName": "John Doe",
         "email": "john@example.com",
         "phone": "9876543210",
         "additionalNotes": "Test booking"
       }
     }'
   ```

4. **Check Railway logs** for MCP action messages:
   ```
   Starting MCP actions for booking: NL-R94U
   Creating calendar hold...
   Calendar hold created: event-123 for booking NL-R94U
   Appending to notes spreadsheet...
   Booking entry appended to spreadsheet: doc-123 for booking NL-R94U
   Creating email draft...
   Email draft created: draft-123 for booking NL-R94U
   ✅ MCP actions completed successfully for booking: NL-R94U
   ```

5. **Check Google Calendar, Sheets, and Gmail** as described above

---

## 🔍 Step 5: Troubleshooting

### Issue: Services are in Mock Mode

**Symptoms:**
- Logs show "initialized in mock mode"
- No calendar events, sheet rows, or email drafts created

**Solution:**
1. Set up Google OAuth credentials
2. Add all required environment variables
3. Redeploy the backend
4. Check logs to confirm "initialized with real API"

### Issue: Calendar Events Not Created

**Check:**
- `GOOGLE_CALENDAR_ENABLED=true` is set
- `GOOGLE_CALENDAR_ID` is correct (usually `primary`)
- OAuth has Calendar API scope
- Check Railway logs for specific error messages

### Issue: Sheets Rows Not Appended

**Check:**
- `GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID` is correct (no spaces!)
- `GOOGLE_SHEETS_SHEET_NAME` matches your sheet name
- Spreadsheet is shared with the OAuth service account email
- Check Railway logs for specific error messages

### Issue: Gmail Drafts Not Created

**Check:**
- `ADVISOR_EMAIL` is set to a valid Gmail address
- `GMAIL_ENABLED=true` is set
- OAuth has Gmail API scope
- Check Railway logs for specific error messages

### Issue: MCP Actions Fail Silently

**Check Railway Logs for:**
```
❌ MCP actions failed for booking {code}: {error message}
Error details: {error details}
```

**Common errors:**
- `Invalid credentials` → OAuth tokens expired or invalid
- `Permission denied` → OAuth doesn't have required scopes
- `Spreadsheet not found` → Wrong spreadsheet ID
- `Calendar not found` → Wrong calendar ID

---

## 📝 Quick Reference: What Happens When

### Booking Created (`POST /bookings/create`)
- ✅ Booking saved to database
- ❌ **No Google API calls** (booking is still TENTATIVE)

### Booking Completed (`POST /bookings/:code/complete`)
- ✅ Booking status changed to CONFIRMED
- ✅ **Calendar event created** (if APIs enabled)
- ✅ **Sheet row appended** (if APIs enabled)
- ✅ **Email draft created** (if APIs enabled)

### Booking Rescheduled (`POST /bookings/:code/reschedule`)
- ✅ Booking updated in database
- ✅ **Calendar event updated** (if APIs enabled)
- ✅ **Sheet row updated** (if APIs enabled)
- ✅ **Email draft updated** (if APIs enabled)

### Booking Cancelled (`POST /bookings/:code/cancel`)
- ✅ Booking status changed to CANCELLED
- ✅ **Calendar event deleted** (if APIs enabled)
- ✅ **Sheet row marked as cancelled** (if APIs enabled)
- ✅ **Cancellation email draft created** (if APIs enabled)

---

## ✅ Verification Checklist

- [ ] Checked Railway logs - services initialized correctly
- [ ] Created a test booking
- [ ] Completed the booking with contact details
- [ ] Checked Railway logs - MCP actions completed
- [ ] Verified calendar event exists in Google Calendar
- [ ] Verified row added to Google Sheets
- [ ] Verified email draft exists in Gmail
- [ ] All booking details match across all three services

---

## 🔗 Useful Links

- **Google Calendar:** https://calendar.google.com
- **Google Sheets:** https://sheets.google.com
- **Gmail:** https://mail.google.com
- **Railway Dashboard:** https://railway.app/dashboard
- **Backend API:** https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app

---

## 💡 Notes

- **Mock Mode:** If Google APIs are not configured, the system runs in mock mode. Actions are logged but not actually executed. This is useful for development and testing without setting up Google OAuth.

- **Real API Mode:** Requires proper Google OAuth setup with all required scopes (Calendar, Sheets, Gmail).

- **Error Handling:** If MCP actions fail, the booking completion still succeeds. Errors are logged but don't prevent the booking from being confirmed. This ensures the booking system remains functional even if Google APIs are temporarily unavailable.

