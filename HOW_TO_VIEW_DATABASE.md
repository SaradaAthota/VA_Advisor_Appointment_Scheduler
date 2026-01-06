# How to View the SQLite Database (bookings.db)

## 🎯 Quick Options

### Option 1: DB Browser for SQLite (Recommended - GUI)
**Best for: Visual browsing and editing**

1. **Download DB Browser for SQLite:**
   - Visit: https://sqlitebrowser.org/
   - Download the Windows installer
   - Install it

2. **Open the database:**
   - Launch "DB Browser for SQLite"
   - Click "Open Database"
   - Navigate to your project folder
   - Select `bookings.db`
   - Click "Open"

3. **View data:**
   - Click on "Browse Data" tab
   - Select table: `bookings`
   - See all your bookings!

---

### Option 2: VS Code Extension (Easiest)
**Best for: If you're already using VS Code**

1. **Install Extension:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for: "SQLite Viewer" or "SQLite"
   - Install one of these:
     - **SQLite Viewer** by Florian Klampfer
     - **SQLite** by alexcvzz

2. **Open the database:**
   - Right-click on `bookings.db` in VS Code
   - Select "Open Database" or "Open with SQLite Viewer"
   - View your data!

---

### Option 3: Command Line (SQLite CLI)
**Best for: Quick queries and automation**

1. **Install SQLite:**
   - Download from: https://www.sqlite.org/download.html
   - Or use via Node.js: `npm install -g sqlite3`

2. **Open database:**
   ```bash
   sqlite3 bookings.db
   ```

3. **View all bookings:**
   ```sql
   SELECT * FROM bookings;
   ```

4. **View specific booking:**
   ```sql
   SELECT * FROM bookings WHERE bookingCode = 'NL-A742';
   ```

5. **Exit:**
   ```sql
   .exit
   ```

---

### Option 4: Online SQLite Viewer
**Best for: Quick viewing without installation**

1. **Visit:**
   - https://sqliteviewer.app/
   - Or https://inloop.github.io/sqlite-viewer/

2. **Upload:**
   - Click "Choose File"
   - Select `bookings.db`
   - View your data!

---

### Option 5: Node.js Script (Programmatic)
**Best for: Custom queries and automation**

Create a file `view-db.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bookings.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database.');
});

// View all bookings
db.all('SELECT * FROM bookings', [], (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    return;
  }
  console.log('\nAll Bookings:');
  console.log('='.repeat(80));
  rows.forEach((row, index) => {
    console.log(`\nBooking ${index + 1}:`);
    console.log(`  ID: ${row.id}`);
    console.log(`  Booking Code: ${row.bookingCode}`);
    console.log(`  Topic: ${row.topic}`);
    console.log(`  Status: ${row.status}`);
    console.log(`  Preferred Slot: ${row.preferredSlotStartTime}`);
    console.log(`  Created: ${row.createdAt}`);
  });
  console.log(`\nTotal: ${rows.length} bookings`);
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('\nDatabase connection closed.');
  }
});
```

Run it:
```bash
node view-db.js
```

---

## 🚀 Recommended: DB Browser for SQLite

**Why?**
- ✅ Free and open source
- ✅ Easy to use GUI
- ✅ Can edit data
- ✅ Can run SQL queries
- ✅ Can export data
- ✅ Works on Windows, Mac, Linux

**Download:** https://sqlitebrowser.org/

---

## 📊 Quick SQL Queries

Once you have the database open, try these queries:

### View all bookings:
```sql
SELECT * FROM bookings;
```

### View bookings by status:
```sql
SELECT * FROM bookings WHERE status = 'CONFIRMED';
```

### View bookings by topic:
```sql
SELECT * FROM bookings WHERE topic = 'KYC_ONBOARDING';
```

### Count bookings:
```sql
SELECT COUNT(*) as total_bookings FROM bookings;
```

### View recent bookings:
```sql
SELECT * FROM bookings ORDER BY createdAt DESC LIMIT 10;
```

### View booking with specific code:
```sql
SELECT * FROM bookings WHERE bookingCode = 'NL-A742';
```

---

## 🔍 Database Schema

**Table: `bookings`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `bookingCode` | TEXT | Unique booking code |
| `topic` | TEXT | Booking topic |
| `preferredSlotId` | TEXT | Preferred slot ID |
| `preferredSlotStartTime` | TEXT | Preferred slot start (ISO string) |
| `preferredSlotEndTime` | TEXT | Preferred slot end (ISO string) |
| `preferredSlotIsAvailable` | INTEGER | Preferred slot availability (0/1) |
| `alternativeSlotId` | TEXT | Alternative slot ID (nullable) |
| `alternativeSlotStartTime` | TEXT | Alternative slot start (nullable) |
| `alternativeSlotEndTime` | TEXT | Alternative slot end (nullable) |
| `alternativeSlotIsAvailable` | INTEGER | Alternative slot availability (nullable) |
| `status` | TEXT | Booking status |
| `timeZone` | TEXT | Time zone |
| `createdAt` | TEXT | Creation timestamp |
| `updatedAt` | TEXT | Last update timestamp |

---

## 💡 Tips

1. **Backup the database:**
   - Copy `bookings.db` to a safe location
   - Or use: `sqlite3 bookings.db ".backup backup.db"`

2. **Export to CSV:**
   - In DB Browser: File → Export → Export table to CSV

3. **View in VS Code:**
   - Install SQLite extension
   - Right-click → Open Database

4. **Check database size:**
   ```bash
   dir bookings.db
   ```

---

## ✅ Quick Start (Easiest)

1. **Download DB Browser for SQLite:**
   - https://sqlitebrowser.org/
   - Install it

2. **Open `bookings.db`:**
   - Launch DB Browser
   - File → Open Database
   - Select `bookings.db`

3. **View your bookings:**
   - Click "Browse Data" tab
   - Select "bookings" table
   - Done! 🎉

---

**That's it! You can now view all your bookings in the database.** 🎊

