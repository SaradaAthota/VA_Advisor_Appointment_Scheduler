# Railway PostgreSQL Setup - Complete Guide

## 🎯 Critical Steps

### Step 1: Add PostgreSQL to Railway (REQUIRED)

**This is the most important step!** Without this, `DATABASE_URL` won't exist and the app will use SQLite.

1. Go to **Railway Dashboard** → Your Project
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create PostgreSQL database
   - Set `DATABASE_URL` environment variable
   - Link it to your backend service

### Step 2: Verify DATABASE_URL is Set

1. Go to your **backend service** (not the database service)
2. Click **"Variables"** tab
3. Look for `DATABASE_URL`
4. Should look like: `postgresql://postgres:password@host:port/railway`

**If DATABASE_URL is missing:**
- Go to **PostgreSQL service** → **Variables** tab
- Copy the `DATABASE_URL` value
- Go to **backend service** → **Variables** tab
- Add new variable: `DATABASE_URL` = (paste value)

### Step 3: Enable Database Sync (Initial Setup)

For the first deployment, you need to create tables. You have two options:

#### Option A: Use Synchronize (Quick Start)

1. Go to **backend service** → **Variables** tab
2. Add new variable:
   - Name: `DATABASE_SYNC`
   - Value: `true`
3. Redeploy

This will auto-create tables on first start.

#### Option B: Use Migrations (Production Best Practice)

1. Keep `DATABASE_SYNC=false` (or don't set it)
2. Create migrations (see below)
3. Run migrations

### Step 4: Redeploy

1. Railway should auto-redeploy after adding PostgreSQL
2. Or manually: **Deployments** → **"Redeploy"**

### Step 5: Verify

Check **Deploy Logs** for:
- ✅ `✅ Using PostgreSQL database (DATABASE_URL detected)`
- ❌ NOT: `⚠️ Using SQLite database (DATABASE_URL not found)`

Test endpoint:
- `https://your-app.up.railway.app/bookings/debug/all`
- Should return: `{"count":0,"bookings":[]}` (no SQLite errors!)

---

## 📋 Current Configuration

The app is configured to:
- **Use PostgreSQL** when `DATABASE_URL` is present (Railway)
- **Use SQLite** when `DATABASE_URL` is missing (local dev)
- **Auto-detect** which database to use

### PostgreSQL Config (Production)
```typescript
{
  type: 'postgres',
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: process.env.DATABASE_SYNC === 'true', // Disabled by default
  ssl: { rejectUnauthorized: false },
}
```

### SQLite Config (Local Dev)
```typescript
{
  type: 'sqlite',
  database: 'bookings.db',
  entities: [BookingEntity, ConversationLogEntity],
  synchronize: true, // Enabled for local dev
}
```

---

## 🔧 Setting Up Migrations (Optional - For Production)

If you want to use migrations instead of `synchronize`:

### 1. Install TypeORM CLI (if not already installed)
```bash
npm install --save-dev typeorm
```

### 2. Create Migration Script in package.json
```json
{
  "scripts": {
    "migration:generate": "typeorm migration:generate -n",
    "migration:run": "typeorm migration:run",
    "migration:revert": "typeorm migration:revert"
  }
}
```

### 3. Generate Initial Migration
```bash
npm run migration:generate -- src/migrations/InitialSchema
```

### 4. Run Migration on Railway
Add to Railway's **Pre-deploy Command**:
```bash
npm run migration:run
```

**OR** run manually after deployment:
```bash
# Connect to Railway service and run:
npm run migration:run
```

---

## ⚠️ Important Notes

1. **DATABASE_URL is Required**: Without it, app falls back to SQLite
2. **Synchronize vs Migrations**:
   - `synchronize: true` = Auto-create tables (good for initial setup)
   - `synchronize: false` + migrations = Production best practice
3. **Local Development**: Still uses SQLite (no DATABASE_URL locally)
4. **Production**: Uses PostgreSQL (DATABASE_URL set by Railway)

---

## 🐛 Troubleshooting

### Still seeing SQLite errors?

1. **Check DATABASE_URL exists:**
   - Backend service → Variables tab
   - Must be present and start with `postgresql://`

2. **Check logs:**
   - Look for database type message
   - If showing SQLite, DATABASE_URL is not set

3. **Force redeploy:**
   - Deployments → Redeploy

4. **Verify PostgreSQL service:**
   - Make sure PostgreSQL database service exists
   - Check it's linked to backend service

### "no such table" errors?

1. **Enable synchronize temporarily:**
   - Add `DATABASE_SYNC=true` to environment variables
   - Redeploy
   - Tables will be auto-created

2. **Or run migrations:**
   - Generate and run migrations (see above)

---

## ✅ Checklist

- [ ] PostgreSQL database added to Railway
- [ ] `DATABASE_URL` environment variable set in backend service
- [ ] `DATABASE_SYNC=true` set (for initial setup) OR migrations configured
- [ ] Backend service redeployed
- [ ] Logs show "✅ Using PostgreSQL database"
- [ ] `/bookings/debug/all` endpoint works (no SQLite errors)

