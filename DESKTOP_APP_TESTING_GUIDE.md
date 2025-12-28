# 🧪 Desktop App Testing Guide - Sign In/Sign Up Issue

**Date:** December 27, 2025  
**Issue:** Cannot access sign in/sign up pages in desktop app  
**Status:** ⚠️ **IDENTIFIED - Solution Provided**

---

## 🔍 Problem Identified

The desktop app is having issues because:

1. **Multiple dev servers running** on different ports (3000, 3001, 3002)
2. **Old sessions** from previous testing
3. **404 errors** for sign in/sign up pages on some ports

---

## ✅ Solution: Clean Restart

### Step 1: Stop All Running Processes

1. **Close the desktop app window** (if open)

2. **In terminal, press `Ctrl+C`** multiple times to stop all processes

3. **Kill any remaining processes:**
   ```bash
   pkill -f "next dev"
   pkill -f "tauri dev"
   ```

4. **Verify they're stopped:**
   ```bash
   lsof -i :3000
   lsof -i :3001
   lsof -i :3002
   ```
   (Should show nothing)

---

### Step 2: Clear Cache and Session Data

```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"

# Clear Next.js cache
rm -rf .next

# Clear node modules cache (optional, if issues persist)
# rm -rf node_modules/.cache
```

---

### Step 3: Start Fresh

```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"

# Start the desktop app
TMPDIR="/Volumes/Softwaare Program/rust-temp" npm run tauri:dev
```

**Wait for:**
- ✅ "Next.js ready on http://localhost:3000"
- ✅ Rust compilation to finish
- ✅ Desktop window to open

---

### Step 4: Clear Session in Desktop App

When the desktop app opens:

1. **Right-click anywhere** in the app
2. **Click "Inspect Element"**
3. **Go to Console tab**
4. **Run this command:**
   ```javascript
   document.cookie = 'user-session=; path=/; max-age=0';
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
5. **Press Enter**

The app should now show the **Sign In** page!

---

## 🧪 Testing Sign Up/Sign In

### Test 1: Sign Up

1. **Click "Sign Up"** link
2. **Fill in the form:**
   - Email: `desktop-test@example.com`
   - Password: `password123`
   - First Name: Desktop
   - Last Name: Test

3. **Click "Sign Up" button**

4. **Expected Result:**
   - ✅ No 503 errors
   - ✅ No "Using local storage" warnings
   - ✅ Account created successfully
   - ✅ Redirected to onboarding page

5. **Check Console** (should see):
   ```
   ✅ API call to: https://app.shotiqai.com/api/auth/signup
   ✅ Response: 200 OK
   ```

---

### Test 2: Verify Cross-Platform Sync

1. **Open browser:** https://app.shotiqai.com/signin
2. **Sign in with:** `desktop-test@example.com` / `password123`
3. **Expected Result:**
   - ✅ It works! (Same database!)

---

## 🔍 Troubleshooting

### Issue 1: Desktop App Shows Blank Screen

**Symptom:** Window opens but nothing displays

**Solution:**
```bash
# Stop everything
pkill -f "next dev"
pkill -f "tauri dev"

# Clear cache
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"
rm -rf .next

# Restart
TMPDIR="/Volumes/Softwaare Program/rust-temp" npm run tauri:dev
```

---

### Issue 2: Shows Onboarding or Upload Page

**Symptom:** Desktop app shows onboarding or upload instead of sign in

**Solution:** Clear session (Step 4 above)
```javascript
document.cookie = 'user-session=; path=/; max-age=0';
localStorage.clear();
location.reload();
```

---

### Issue 3: 404 Error on Sign In Page

**Symptom:** "404: This page could not be found"

**Cause:** Old dev server running on wrong port

**Solution:**
1. Stop all processes (`Ctrl+C`)
2. Kill remaining: `pkill -f "next dev"`
3. Clear cache: `rm -rf .next`
4. Restart: `npm run tauri:dev`

---

### Issue 4: "Failed to fetch" Error

**Symptom:** Error when trying to sign up/sign in

**Possible Causes:**
1. **No internet connection** - Check your connection
2. **Production API down** - Check https://app.shotiqai.com
3. **CORS issue** - Check browser console for details

**Solution:**
1. Verify https://app.shotiqai.com is accessible in browser
2. Check console for specific error messages
3. Ensure `.env.local` has correct API URL

---

### Issue 5: Multiple Ports in Use

**Symptom:** "Port 3000 is in use, trying 3001... trying 3002..."

**Solution:**
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Verify ports are free
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Restart
npm run tauri:dev
```

---

## 📋 Quick Command Reference

### Stop Everything:
```bash
pkill -f "next dev"
pkill -f "tauri dev"
```

### Clear Cache:
```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"
rm -rf .next
```

### Start Desktop App:
```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"
TMPDIR="/Volumes/Softwaare Program/rust-temp" npm run tauri:dev
```

### Clear Session (in Desktop App Console):
```javascript
document.cookie = 'user-session=; path=/; max-age=0';
localStorage.clear();
location.reload();
```

### Navigate to Sign In:
```javascript
window.location.href = '/signin'
```

### Navigate to Sign Up:
```javascript
window.location.href = '/signup'
```

---

## ✅ What Should Happen

### After Clean Restart:

1. **Desktop app opens**
2. **Shows "Loading..."** briefly
3. **Redirects to Sign In page** (no session exists)
4. **Sign In page loads** with email/password fields
5. **Can click "Sign Up"** to create account

### After Signing Up:

1. **Account created** via https://app.shotiqai.com/api/auth/signup
2. **No errors** in console
3. **Redirected to onboarding** page
4. **Can sign in on web app** with same credentials

---

## 🎯 Summary

**Problem:** Cannot access sign in/sign up pages  
**Causes:**
1. Multiple dev servers running
2. Old session cookies
3. 404 errors on old ports

**Solution:**
1. Stop all processes
2. Clear cache (`rm -rf .next`)
3. Restart desktop app
4. Clear session in DevTools console

**Expected Result:** Sign in page loads, can create account, cross-platform sync works

---

## 📞 If Still Having Issues

**Please provide:**
1. **Screenshot** of what you see in desktop app
2. **Console errors** (right-click → Inspect → Console tab)
3. **Terminal output** from `npm run tauri:dev`
4. **Port being used** (check terminal: "Local: http://localhost:XXXX")

---

**Try the clean restart steps above and let me know the results!** 🚀
