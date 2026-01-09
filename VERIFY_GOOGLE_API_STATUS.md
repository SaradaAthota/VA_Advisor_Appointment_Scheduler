# How to Verify if Backend is Using Real Google APIs

## 🔍 Quick Check: Railway Logs

### Step 1: Check Startup Logs

1. Go to **Railway Dashboard** → Your backend service
2. Click **"Deploy Logs"** or **"Logs"** tab
3. Scroll to the startup section (when the app first starts)
4. Look for these specific log messages:

**If you see these messages:**
```
[GoogleCalendarMcpService] Google Calendar MCP Service initialized in mock mode
[GoogleSheetsMcpService] Google Sheets MCP Service initialized in mock mode
[GmailMcpService] Gmail MCP Service initialized in mock mode
```
→ **❌ Backend is in MOCK MODE** - No real API calls are being made

**If you see these messages:**
```
[GoogleCalendarMcpService] Google Calendar MCP Service initialized with real API
[GoogleSheetsMcpService] Google Sheets MCP Service initialized with real API
[GmailMcpService] Gmail MCP Service initialized with real API
```
→ **✅ Backend is using REAL APIs** - Actual Google API calls are being made

---

## 🔧 Step 2: Check Environment Variables

### Required Variables for Real APIs

Go to **Railway Dashboard** → Your backend service → **"Variables"** tab

**Check if these are set:**

1. **OAuth Credentials (REQUIRED):**
   - `GOOGLE_CLIENT_ID` - Must be set
   - `GOOGLE_CLIENT_SECRET` - Must be set
   - `GOOGLE_REFRESH_TOKEN` - Must be set
   - `GOOGLE_REDIRECT_URI` - Optional but recommended

2. **Service-Specific Variables:**
   - `GOOGLE_CALENDAR_ENABLED=true` (for Calendar)
   - `GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID=...` (for Sheets)
   - `GOOGLE_SHEETS_ENABLED=true` (for Sheets)
   - `ADVISOR_EMAIL=your-email@gmail.com` (for Gmail)
   - `GMAIL_ENABLED=true` (for Gmail)

**If any of the OAuth credentials are missing:**
→ Backend will automatically use **MOCK MODE**

---

## 🧪 Step 3: Test Booking Completion and Check Logs

### Create and Complete a Booking

1. **Create a booking** (via frontend or API)
2. **Complete the booking** with contact details
3. **Check Railway logs** immediately after completion

### What to Look For in Logs

**If using REAL APIs, you should see:**
```
Starting MCP actions for booking: NL-XXXX
Creating calendar hold...
Calendar hold created: event-abc123 for booking NL-XXXX
Appending to notes spreadsheet...
Booking entry appended to spreadsheet: doc-xyz789 for booking NL-XXXX
Creating email draft...
Email draft created: draft-123 for booking NL-XXXX
✅ MCP actions completed successfully for booking: NL-XXXX
```

**If using MOCK MODE, you might see:**
```
Starting MCP actions for booking: NL-XXXX
Creating calendar hold...
Calendar hold created: mock-event-123 for booking NL-XXXX
Appending to notes spreadsheet...
Booking entry appended to spreadsheet: mock-doc-123 for booking NL-XXXX
Creating email draft...
Email draft created: mock-draft-123 for booking NL-XXXX
✅ MCP actions completed successfully for booking: NL-XXXX
```

**Or you might see errors:**
```
❌ MCP actions failed for booking NL-XXXX: {error message}
```

---

## 🚨 Common Issues

### Issue 1: Services in Mock Mode

**Symptom:** Logs show "initialized in mock mode"

**Cause:** Missing OAuth credentials

**Solution:**
1. Set `GOOGLE_CLIENT_ID`
2. Set `GOOGLE_CLIENT_SECRET`
3. Set `GOOGLE_REFRESH_TOKEN`
4. Redeploy backend
5. Check logs again

### Issue 2: OAuth Credentials Invalid

**Symptom:** Logs show "initialized with real API" but actions fail

**Cause:** Invalid or expired refresh token

**Solution:**
1. Regenerate OAuth credentials
2. Get a new refresh token
3. Update environment variables
4. Redeploy backend

### Issue 3: Missing Service-Specific Variables

**Symptom:** Service initialized but specific actions fail

**Cause:** Missing service configuration

**Solution:**
- For Calendar: Set `GOOGLE_CALENDAR_ENABLED=true`
- For Sheets: Set `GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID` and `GOOGLE_SHEETS_ENABLED=true`
- For Gmail: Set `ADVISOR_EMAIL` and `GMAIL_ENABLED=true`

---

## 📋 Quick Verification Checklist

- [ ] Checked Railway startup logs
- [ ] Verified log messages show "real API" or "mock mode"
- [ ] Checked environment variables in Railway
- [ ] Verified OAuth credentials are set
- [ ] Tested booking completion
- [ ] Checked logs after booking completion
- [ ] Verified no errors in logs

---

## 🔗 Next Steps

If backend is in **MOCK MODE:**
1. Set up Google OAuth credentials
2. Add required environment variables
3. Redeploy backend
4. Verify logs show "real API"

If backend is using **REAL APIs** but updates not appearing:
1. Check for errors in logs
2. Verify OAuth permissions/scopes
3. Verify spreadsheet ID is correct
4. Verify calendar ID is correct
5. Check if refresh token is valid

