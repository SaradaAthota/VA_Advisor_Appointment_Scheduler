# How to Add PostgreSQL to Railway

## 🔍 Current Issue

The app is still using SQLite because `DATABASE_URL` is not set. You need to add PostgreSQL to Railway.

## ✅ Step-by-Step Instructions

### Step 1: Add PostgreSQL Database

1. **Go to Railway Dashboard**
   - Open: https://railway.app
   - Click on your project: `VA_Advisor_Appointment_Scheduler`

2. **Add PostgreSQL Service**
   - Click the **"New"** button (top right)
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**
   - Railway will automatically:
     - Create a PostgreSQL database
     - Set `DATABASE_URL` environment variable
     - Link it to your backend service

### Step 2: Verify Environment Variable

1. **Check Environment Variables**
   - Go to your **backend service** (not the database)
   - Click **"Variables"** tab
   - Look for `DATABASE_URL`
   - It should look like: `postgresql://postgres:password@host:port/railway`

2. **If DATABASE_URL is Missing**
   - Go to the **PostgreSQL service** you just created
   - Click **"Variables"** tab
   - Copy the `DATABASE_URL` value
   - Go back to your **backend service**
   - Click **"Variables"** tab
   - Click **"New Variable"**
   - Name: `DATABASE_URL`
   - Value: Paste the connection string
   - Click **"Add"**

### Step 3: Redeploy

1. **Trigger Redeploy**
   - Railway should auto-redeploy when you add the database
   - Or manually: Go to **Deployments** → Click **"Redeploy"**

2. **Check Logs**
   - After redeploy, check **Deploy Logs**
   - You should see: `✅ Using PostgreSQL database (DATABASE_URL detected)`
   - If you see: `⚠️ Using SQLite database (DATABASE_URL not found)` → DATABASE_URL is not set correctly

### Step 4: Verify It's Working

1. **Check Logs for Database Type**
   - Look for: `✅ Using PostgreSQL database`
   - Should NOT see: `⚠️ Using SQLite database`

2. **Test Endpoint**
   - `https://your-app.up.railway.app/bookings/debug/all`
   - Should return: `{"count":0,"bookings":[]}` (no more SQLite errors)

## 🎯 Quick Checklist

- [ ] PostgreSQL database added to Railway
- [ ] `DATABASE_URL` environment variable set in backend service
- [ ] Backend service redeployed
- [ ] Logs show "✅ Using PostgreSQL database"
- [ ] `/bookings/debug/all` endpoint works (no SQLite errors)

## 🐛 Troubleshooting

### Still seeing SQLite errors?

1. **Check DATABASE_URL is set:**
   - Backend service → Variables tab
   - Look for `DATABASE_URL`
   - Should start with `postgresql://`

2. **Check DATABASE_URL format:**
   - Should be: `postgresql://user:password@host:port/database`
   - Railway provides this automatically

3. **Force redeploy:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment

4. **Check logs:**
   - Look for database type message
   - If still showing SQLite, DATABASE_URL is not being read

## 📝 Note

- **Local Development**: Will still use SQLite (no DATABASE_URL locally)
- **Railway Production**: Will use PostgreSQL (DATABASE_URL set by Railway)
- **No code changes needed**: The app auto-detects which database to use!

