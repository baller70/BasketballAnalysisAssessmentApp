# 🔧 How to Access Sign In/Sign Up Pages in Desktop App

## 🔍 The Issue

The desktop app might be showing the onboarding or upload page instead of sign in/sign up because:
1. There's an old session cookie from previous testing
2. The app thinks you're already logged in
3. The middleware is redirecting you away from sign in/sign up pages

---

## ✅ Solution 1: Clear Session Data (Easiest)

### Option A: Use Browser DevTools in Desktop App

1. **Open the desktop app**
2. **Right-click anywhere** in the app
3. **Click "Inspect Element"** or "Inspect"
4. **Go to the Console tab**
5. **Run this command:**
   ```javascript
   document.cookie = 'user-session=; path=/; max-age=0';
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
6. **Press Enter**
7. The app will reload and show the sign in page!

---

### Option B: Navigate Directly to Sign In

1. **Open the desktop app**
2. **Right-click** → **Inspect Element**
3. **In the Console, run:**
   ```javascript
   window.location.href = '/signin'
   ```
4. This will take you directly to the sign in page

---

### Option C: Navigate Directly to Sign Up

1. **Open the desktop app**
2. **Right-click** → **Inspect Element**
3. **In the Console, run:**
   ```javascript
   window.location.href = '/signup'
   ```
4. This will take you directly to the sign up page

---

## ✅ Solution 2: Stop and Restart Desktop App

1. **Close the desktop app window**
2. **In terminal, press `Ctrl+C`** to stop the process
3. **Run this command to clear session:**
   ```bash
   cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"
   rm -rf .next/cache
   ```
4. **Restart the desktop app:**
   ```bash
   TMPDIR="/Volumes/Softwaare Program/rust-temp" npm run tauri:dev
   ```

---

## 🧪 Testing Sign Up/Sign In

Once you can see the sign in page:

### Test Sign Up:
1. Click "Sign Up" link
2. Fill in:
   - Email: `desktop-user@example.com`
   - Password: `password123`
   - First Name: Desktop
   - Last Name: User
3. Click "Sign Up"
4. Should work with NO errors!

### Test Sign In:
1. Use the account you just created
2. Email: `desktop-user@example.com`
3. Password: `password123`
4. Click "Sign In"
5. Should work!

---

## 🔍 What to Look For

### ✅ Good Signs:
- You see the sign in/sign up page
- No "Using local storage" warnings
- No 503 errors
- Account created successfully

### ❌ If You See:
- **Onboarding page:** Old session exists, clear it (Solution 1)
- **Upload page:** Old session exists, clear it (Solution 1)
- **Blank page:** Check console for errors
- **"Failed to fetch":** Check internet connection

---

## 📝 Quick Commands Reference

### Clear Session (in Desktop App Console):
```javascript
document.cookie = 'user-session=; path=/; max-age=0';
localStorage.clear();
location.reload();
```

### Go to Sign In:
```javascript
window.location.href = '/signin'
```

### Go to Sign Up:
```javascript
window.location.href = '/signup'
```

### Check if Authenticated:
```javascript
console.log('Cookie:', document.cookie);
console.log('LocalStorage:', localStorage.getItem('basketball-auth'));
```

---

## 🎯 Summary

**Problem:** Desktop app shows onboarding/upload instead of sign in/sign up  
**Cause:** Old session cookie from testing  
**Solution:** Clear session data using DevTools console  
**Command:** `document.cookie = 'user-session=; path=/; max-age=0'; localStorage.clear(); location.reload();`

---

**Try Solution 1, Option A first - it's the quickest!** 🚀
