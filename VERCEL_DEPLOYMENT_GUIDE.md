# Vercel Frontend Deployment Guide

## 📋 Prerequisites

1. ✅ Backend deployed on Railway (already done)
2. ✅ Backend URL: `https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app`
3. ✅ GitHub account connected to Vercel
4. ✅ Vercel account (free tier works)

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Frontend Code

The frontend code is already in the `frontend/` directory. Make sure all changes are committed:

```bash
git add frontend/
git commit -m "Standardize API environment variable name"
git push
```

### Step 2: Connect Repository to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **"Add New..."** → **"Project"**
4. Import your repository: `VA_Advisor_Appointment_Scheduler`
5. Click **"Import"**

### Step 3: Configure Vercel Project Settings

**Important Settings:**

1. **Framework Preset:** `Vite` (or `Other` if Vite not available)
2. **Root Directory:** `frontend` ⚠️ **CRITICAL - Set this to `frontend`**
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `npm install`

**Screenshot Guide:**
- Framework Preset: Select "Vite" or "Other"
- Root Directory: Type `frontend` (this tells Vercel to build from the frontend folder)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 4: Set Environment Variables

Before deploying, add environment variables:

1. In Vercel project settings, go to **"Environment Variables"** tab
2. Click **"Add New"**
3. Add the following variable:

**Variable Name:** `VITE_API_BASE_URL`  
**Value:** `https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app`  
**Environment:** Production, Preview, Development (select all three)

**Important Notes:**
- ✅ Variable name must be `VITE_API_BASE_URL` (Vite requires `VITE_` prefix)
- ✅ Use your actual Railway backend URL
- ✅ No trailing slash at the end
- ✅ Select all environments (Production, Preview, Development)

### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 1-2 minutes)
3. Vercel will automatically assign a URL like: `https://your-app-name.vercel.app`

### Step 6: Update Backend CORS

After deployment, you'll get a Vercel URL. Update the backend to allow CORS from this URL:

1. Go to Railway dashboard → Your backend service
2. Go to **Variables** tab
3. Add/Update environment variable:

**Variable Name:** `FRONTEND_URL`  
**Value:** `https://your-app-name.vercel.app` (your actual Vercel URL)

4. Railway will automatically redeploy

**Alternative:** The backend code already supports multiple origins, so you can also add the Vercel URL to the `FRONTEND_URL` variable as a comma-separated list, or just set it to the Vercel URL.

### Step 7: Verify Deployment

1. **Test Frontend URL:**
   - Open your Vercel URL in browser
   - Should see the booking app interface

2. **Test API Connection:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to create a booking or start a voice session
   - Check if requests go to: `https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app`
   - Should see successful API calls (200 status)

3. **Test CORS:**
   - If you see CORS errors in console, verify `FRONTEND_URL` is set correctly in Railway
   - Backend should allow requests from your Vercel domain

---

## 🔧 Troubleshooting

### Issue 1: Build Fails - "Cannot find module"

**Solution:**
- Verify Root Directory is set to `frontend`
- Check that `package.json` exists in `frontend/` directory
- Ensure all dependencies are in `package.json`

### Issue 2: 404 Errors on Routes

**Solution:**
- Vite SPA needs a rewrite rule
- In Vercel project settings → **"Settings"** → **"Rewrites"**
- Add rewrite rule:
  ```
  Source: /(.*)
  Destination: /index.html
  ```

### Issue 3: API Calls Fail - CORS Error

**Solution:**
1. Check `VITE_API_BASE_URL` is set correctly in Vercel
2. Check `FRONTEND_URL` is set correctly in Railway (should be your Vercel URL)
3. Verify backend CORS allows your Vercel domain
4. Check browser console for exact error message

### Issue 4: API Calls Go to localhost:3000

**Solution:**
- Environment variable not set correctly
- Verify `VITE_API_BASE_URL` is set in Vercel
- Rebuild the deployment (Vercel → Deployments → Redeploy)

### Issue 5: Build Succeeds but App Doesn't Load

**Solution:**
- Check Vercel build logs for warnings
- Verify Output Directory is set to `dist`
- Check browser console for JavaScript errors

---

## 📝 Environment Variables Summary

### Frontend (Vercel)
- `VITE_API_BASE_URL`: `https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app`

### Backend (Railway)
- `FRONTEND_URL`: `https://your-app-name.vercel.app` (your Vercel URL)

---

## ✅ Deployment Checklist

- [ ] Frontend code committed and pushed to GitHub
- [ ] Vercel project created and connected to GitHub repo
- [ ] Root Directory set to `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] `VITE_API_BASE_URL` environment variable set in Vercel
- [ ] Frontend deployed successfully
- [ ] Vercel URL obtained
- [ ] `FRONTEND_URL` set in Railway backend
- [ ] Backend redeployed with new CORS settings
- [ ] Frontend tested - API calls working
- [ ] CORS verified - no errors in browser console

---

## 🎉 Success Indicators

✅ Frontend loads at Vercel URL  
✅ No console errors  
✅ API calls go to Railway backend  
✅ Bookings can be created  
✅ Voice agent can start sessions  
✅ No CORS errors  

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard
- **Backend URL:** https://vaadvisorappointmentscheduler-production-8bf4.up.railway.app
- **Frontend URL:** (will be provided after Vercel deployment)

---

## 📞 Next Steps After Deployment

1. Test all features:
   - Create booking
   - Lookup booking
   - Complete booking
   - Voice agent conversation

2. Update README.md with production URLs

3. Set up custom domain (optional):
   - Vercel supports custom domains
   - Update `FRONTEND_URL` in Railway if using custom domain

4. Monitor:
   - Vercel Analytics (optional)
   - Railway logs for backend errors
   - Browser console for frontend errors

