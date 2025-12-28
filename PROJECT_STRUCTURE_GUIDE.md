# SHOTIQ AI - Project Structure & Startup Guide

## 🎯 Problem Solved

**Issue:** Multiple Next.js applications in the project caused confusion about which version to run.

**Solution:** Clear documentation, automated startup script, and visual markers to ensure you always use the correct version.

---

## 📁 Directory Structure

```
SHOTIQAI/
├── ✅ basketball-analysis/          ← MAIN APP (USE THIS!)
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── ✅_THIS_IS_THE_MAIN_APP.md
│
├── ⚠️  nextjs_space/                ← OLD VERSION (DO NOT USE!)
│   └── ⚠️_DO_NOT_USE_THIS_DIRECTORY.md
│
├── python-backend/                  ← FastAPI backend
├── huggingface-backend/             ← Flask backend
├── python-scraper/                  ← Data collection
├── dual_tier_analysis/              ← Tier comparison
│
├── 🚀 start-dev.sh                  ← AUTOMATED STARTUP SCRIPT
├── 📖 START_HERE.md                 ← QUICK START GUIDE
├── 📖 README.md                     ← FULL DOCUMENTATION
├── 📖 PROJECT_STRUCTURE_GUIDE.md    ← THIS FILE
└── package.json                     ← Root package with helper scripts
```

---

## 🚀 How to Start the Server (3 Ways)

### Method 1: Automated Script (Recommended) ⭐

```bash
./start-dev.sh
```

**What it does:**
- ✅ Automatically switches to Node.js 20
- ✅ Checks if dependencies are installed
- ✅ Navigates to the correct directory
- ✅ Starts the development server
- ✅ Shows clear status messages

### Method 2: NPM Script from Root

```bash
npm run dev
```

This automatically runs the main app from `basketball-analysis/`.

### Method 3: Manual Start

```bash
cd basketball-analysis
nvm use 20
npm run dev
```

---

## 🔧 What Was Fixed

### 1. **Startup Script Created**
- **File:** `start-dev.sh`
- **Purpose:** Ensures correct Node version and directory
- **Made executable:** `chmod +x start-dev.sh`

### 2. **Root Package.json Updated**
Added helper scripts:
```json
{
  "scripts": {
    "dev": "cd basketball-analysis && npm run dev",
    "start": "cd basketball-analysis && npm start",
    "build": "cd basketball-analysis && npm run build",
    "install-main": "cd basketball-analysis && npm install",
    "info": "echo 'Main App: basketball-analysis/ | Old: nextjs_space/'"
  }
}
```

### 3. **Prisma Configuration Fixed**
- **Issue:** Hardcoded Linux path in `schema.prisma`
- **Fixed:** Removed `output = "/home/ubuntu/..."` line
- **Result:** Prisma now works on Mac/Linux/Windows

### 4. **Visual Markers Added**
- ✅ `basketball-analysis/✅_THIS_IS_THE_MAIN_APP.md`
- ⚠️ `nextjs_space/⚠️_DO_NOT_USE_THIS_DIRECTORY.md`

### 5. **Documentation Created**
- `START_HERE.md` - Quick start guide
- `README.md` - Comprehensive documentation
- `PROJECT_STRUCTURE_GUIDE.md` - This file

---

## 📋 Quick Reference

### Check Which Version Is Running

Look at the terminal output:
```bash
# ✅ CORRECT - Should see:
cd basketball-analysis && npm run dev

# ❌ WRONG - If you see:
cd nextjs_space && npm run dev
# Stop it and use ./start-dev.sh instead
```

### Stop All Running Servers

```bash
pkill -f "next dev"
```

### Check Node Version

```bash
node -v
# Should show: v20.x.x
```

### Switch to Node 20

```bash
nvm use 20
```

---

## 🎯 Key Takeaways

1. **Always use `basketball-analysis/`** - This is the main app
2. **Never use `nextjs_space/`** - This is deprecated
3. **Use `./start-dev.sh`** - Easiest way to start correctly
4. **Node 20.x required** - Managed automatically by startup script
5. **Port 3000** - Default development port

---

## 🔍 How to Verify You're Using the Right Version

### Check 1: Terminal Path
Your terminal should show:
```
cd basketball-analysis
```

### Check 2: Package.json
```bash
cat package.json | grep '"name"'
# Should show: "basketball-analysis"
```

### Check 3: Features
The correct version has:
- ✅ Profile wizard
- ✅ Gamification system
- ✅ Elite shooter comparison
- ✅ Video analysis
- ✅ Session history

If you don't see these features, you're running the wrong version!

---

## 🆘 Troubleshooting

### "I accidentally started the wrong version"

```bash
# Stop all servers
pkill -f "next dev"

# Start the correct one
./start-dev.sh
```

### "Port 3000 is already in use"

```bash
# Kill existing process
pkill -f "next dev"

# Or use different port
cd basketball-analysis
PORT=3001 npm run dev
```

### "Prisma errors"

```bash
cd basketball-analysis
npx prisma generate
npm run dev
```

### "Node version errors"

```bash
nvm install 20
nvm use 20
cd basketball-analysis
npm install
npm run dev
```

---

## 📊 Application Comparison

| Feature | basketball-analysis/ | nextjs_space/ |
|---------|---------------------|---------------|
| Status | ✅ Active | ⚠️ Deprecated |
| Features | Full-featured | Basic |
| Node Version | 20.x | 24.x |
| Prisma Version | 6.7.0 | 7.1.0 |
| Database | PostgreSQL | PostgreSQL |
| Use For | Production | Reference only |

---

## 🎓 Best Practices

1. **Always start with:** `./start-dev.sh`
2. **Before coding:** Verify you're in `basketball-analysis/`
3. **Before committing:** Make sure changes are in the right directory
4. **Before deploying:** Double-check you're deploying from `basketball-analysis/`

---

## 📞 Summary

**To start development:**
```bash
./start-dev.sh
```

**To verify correct version:**
- Check terminal shows `basketball-analysis/`
- Check URL: http://localhost:3000
- Check features: Should have profile wizard, gamification, etc.

**If something's wrong:**
1. Stop all servers: `pkill -f "next dev"`
2. Run: `./start-dev.sh`
3. Verify: http://localhost:3000

---

**Created:** December 27, 2025  
**Purpose:** Prevent confusion about which application version to use  
**Status:** ✅ Complete - You're all set!
