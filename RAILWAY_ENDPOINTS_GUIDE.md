# Railway Endpoints Guide

## ✅ Correct Endpoints to Test

### Root & Health Endpoints
- **Root:** `https://your-app.up.railway.app/`
- **Health Check:** `https://your-app.up.railway.app/health`
- **Test Endpoint:** `https://your-app.up.railway.app/test`

### Booking Endpoints
- **Get All Bookings (Debug):** `https://your-app.up.railway.app/bookings/debug/all`
- **Get Booking by Code:** `https://your-app.up.railway.app/bookings/:bookingCode`
- **Create Booking:** `POST https://your-app.up.railway.app/bookings/create`
- **Offer Slots:** `POST https://your-app.up.railway.app/bookings/offer-slots`

### Voice Agent Endpoints
- **Start Session:** `POST https://your-app.up.railway.app/voice/session/start`
- **Get All Logs:** `https://your-app.up.railway.app/voice/logs/all`

## ❌ Endpoints That DON'T Exist
- `/bookings/debug/health` ❌ (This doesn't exist!)
- `/bookings/health` ❌
- `/debug/health` ❌

## 🔍 Troubleshooting Railway "Not Found" Error

If you're seeing Railway's "Not Found" page (with the train icon), it means:

1. **The Railway service might not be running**
   - Check Railway Dashboard → Deploy Logs
   - Look for "Application is running on: http://localhost:3000"
   - Verify the deployment status is "Active"

2. **The route doesn't exist**
   - Make sure you're using the correct endpoint path
   - Check the list above for valid endpoints

3. **The application crashed on startup**
   - Check Railway Deploy Logs for error messages
   - Look for TypeScript compilation errors
   - Check for missing environment variables

## 🧪 Quick Test Commands

```bash
# Test root endpoint
curl https://your-app.up.railway.app/

# Test health endpoint (CORRECT)
curl https://your-app.up.railway.app/health

# Test bookings debug (CORRECT)
curl https://your-app.up.railway.app/bookings/debug/all

# Test voice session start
curl -X POST https://your-app.up.railway.app/voice/session/start \
  -H "Content-Type: application/json"
```

## 📋 Steps to Verify Deployment

1. **Check Railway Dashboard:**
   - Go to your service
   - Check "Deploy Logs" tab
   - Look for successful build and startup messages

2. **Verify Application Started:**
   - Should see: "Application is running on: http://localhost:3000"
   - Should see: "CORS enabled for: ..."
   - Should see: "Routes registered successfully"

3. **Test Correct Endpoints:**
   - Try `/health` (not `/bookings/debug/health`)
   - Try `/bookings/debug/all` (for bookings)
   - Try `/` (root endpoint)

4. **If Still Getting 404:**
   - Check if Railway deployment completed successfully
   - Verify environment variables are set
   - Check for any build errors in logs
   - Try forcing a redeploy

