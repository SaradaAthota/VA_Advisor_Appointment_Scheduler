# How to View Conversation Logs (Text Logs)

## 📍 Location

**Text logs are stored in the SQLite database:**
- **File:** `bookings.db` (in project root)
- **Table:** `conversation_logs`
- **Database:** Same database as bookings (SQLite)

---

## 🔍 Method 1: Using DB Browser for SQLite (Recommended)

### **Step 1: Open Database**
1. Open **DB Browser for SQLite**
2. Click **"Open Database"**
3. Navigate to: `C:\Users\srinivas\NextLeap\Milestones\VA_Advisor_Appointment_Scheduler\bookings.db`
4. Click **Open**

### **Step 2: View Conversation Logs**
1. Click on **"Browse Data"** tab
2. Select table: **`conversation_logs`**
3. You'll see all conversation logs with columns:
   - `id` - Unique log entry ID
   - `sessionId` - Conversation session ID
   - `role` - 'user', 'assistant', or 'system'
   - `content` - The actual message text
   - `intent` - Detected intent (if applicable)
   - `state` - Conversation state (if applicable)
   - `bookingCode` - Booking code (if booking was created)
   - `metadata` - Additional metadata (JSON string)
   - `timestamp` - When the log was created

### **Step 3: Filter by Session**
To see all logs for a specific conversation:
1. Click **"Execute SQL"** tab
2. Run this query:
```sql
SELECT * FROM conversation_logs 
WHERE sessionId = 'YOUR_SESSION_ID'
ORDER BY timestamp ASC;
```

Replace `YOUR_SESSION_ID` with the actual session ID (you can find it in localStorage or from the API response).

---

## 🔍 Method 2: Using SQL Queries

### **View All Logs:**
```sql
SELECT * FROM conversation_logs ORDER BY timestamp DESC;
```

### **View Logs by Session:**
```sql
SELECT * FROM conversation_logs 
WHERE sessionId = 'YOUR_SESSION_ID'
ORDER BY timestamp ASC;
```

### **View Logs by Booking Code:**
```sql
SELECT * FROM conversation_logs 
WHERE bookingCode = 'NL-XXXX'
ORDER BY timestamp ASC;
```

### **View Only User Messages:**
```sql
SELECT * FROM conversation_logs 
WHERE role = 'user'
ORDER BY timestamp DESC;
```

### **View Only Assistant Messages:**
```sql
SELECT * FROM conversation_logs 
WHERE role = 'assistant'
ORDER BY timestamp DESC;
```

### **View System Messages (Intents, State Changes):**
```sql
SELECT * FROM conversation_logs 
WHERE role = 'system'
ORDER BY timestamp DESC;
```

### **View Recent Logs (Last 50):**
```sql
SELECT * FROM conversation_logs 
ORDER BY timestamp DESC 
LIMIT 50;
```

### **View Logs for Today:**
```sql
SELECT * FROM conversation_logs 
WHERE DATE(timestamp) = DATE('now')
ORDER BY timestamp DESC;
```

---

## 🔍 Method 3: Using API Endpoint

### **Get Conversation History for a Session:**
```bash
GET http://localhost:3000/voice/session/{sessionId}/history
```

**Example:**
```bash
curl http://localhost:3000/voice/session/abc-123-def/history
```

**Response:**
```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Hello! I'm your advisor appointment scheduler...",
      "timestamp": "2026-01-06T10:30:00Z",
      "metadata": {
        "intent": null,
        "state": "greeting",
        "bookingCode": null
      }
    },
    {
      "role": "user",
      "content": "I want to book an appointment",
      "timestamp": "2026-01-06T10:30:15Z",
      "metadata": {
        "intent": "book_new",
        "state": "greeting"
      }
    }
  ]
}
```

---

## 📊 What's Logged

### **✅ Logged:**
- ✅ **User input text** - Everything the user types/says
- ✅ **Assistant/LLM response text** - All assistant responses
- ✅ **System messages** - Intent recognition, state changes, booking actions
- ✅ **Intent recognition** - Detected intent + confidence score
- ✅ **State changes** - Conversation state transitions
- ✅ **Booking actions** - Create, reschedule, cancel actions

### **❌ NOT Logged:**
- ❌ **Audio** - No audio files (text-only in Phase 6)

---

## 🔍 Method 4: Find Session ID

### **From Browser Console:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Type:
```javascript
localStorage.getItem('voiceAgentSessionId')
```
4. This will show your current session ID

### **From Database:**
```sql
SELECT DISTINCT sessionId, COUNT(*) as message_count
FROM conversation_logs
GROUP BY sessionId
ORDER BY MAX(timestamp) DESC;
```

---

## 📋 Example Queries

### **View Complete Conversation Flow:**
```sql
SELECT 
  timestamp,
  role,
  content,
  intent,
  state,
  bookingCode
FROM conversation_logs
WHERE sessionId = 'YOUR_SESSION_ID'
ORDER BY timestamp ASC;
```

### **View All Bookings Created via Voice Agent:**
```sql
SELECT DISTINCT
  bookingCode,
  sessionId,
  MAX(timestamp) as created_at
FROM conversation_logs
WHERE bookingCode IS NOT NULL
GROUP BY bookingCode, sessionId
ORDER BY created_at DESC;
```

### **View Intent Recognition Stats:**
```sql
SELECT 
  intent,
  COUNT(*) as count
FROM conversation_logs
WHERE intent IS NOT NULL
GROUP BY intent
ORDER BY count DESC;
```

### **View State Transition Flow:**
```sql
SELECT 
  timestamp,
  state,
  content
FROM conversation_logs
WHERE role = 'system' 
  AND state IS NOT NULL
ORDER BY timestamp ASC;
```

---

## 🛠️ Quick Access Script

You can also create a simple Node.js script to view logs:

```javascript
// view-logs.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bookings.db');

db.all(`
  SELECT * FROM conversation_logs 
  ORDER BY timestamp DESC 
  LIMIT 20
`, (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.table(rows);
  }
  db.close();
});
```

Run with:
```bash
node view-logs.js
```

---

## 📝 Log Structure

Each log entry contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique log entry ID |
| `sessionId` | String | Conversation session ID |
| `role` | String | 'user', 'assistant', or 'system' |
| `content` | Text | The actual message/content |
| `intent` | String | Detected intent (optional) |
| `state` | String | Conversation state (optional) |
| `bookingCode` | String | Booking code if booking created |
| `metadata` | JSON | Additional metadata (JSON string) |
| `timestamp` | DateTime | When the log was created |

---

## 🎯 Summary

**Text logs are stored in:**
- **File:** `bookings.db` (SQLite database)
- **Table:** `conversation_logs`
- **Location:** Project root directory

**To view:**
1. Use DB Browser for SQLite (easiest)
2. Use SQL queries
3. Use API endpoint: `GET /voice/session/:sessionId/history`
4. Check browser localStorage for session ID

**All conversation text is logged, including:**
- User inputs
- Assistant responses
- Intent recognition
- State changes
- Booking actions

