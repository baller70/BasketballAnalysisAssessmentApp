# 🖥️ How to Run the Desktop App

## ⚠️ IMPORTANT: You Must Be in the Correct Directory!

The error you got (`Missing script: "tauri:dev"`) happened because you ran the command from your home directory instead of the project directory.

---

## ✅ CORRECT WAY - Option 1 (Easiest)

**From the project root directory:**

```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI"
./start-desktop.sh
```

This script automatically:
- Navigates to the correct directory
- Switches to Node 20
- Installs dependencies if needed
- Starts the desktop app

---

## ✅ CORRECT WAY - Option 2 (Manual)

**Navigate to basketball-analysis directory first:**

```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"
npm run tauri:dev
```

---

## ❌ WRONG WAY (What You Did)

```bash
# DON'T do this from your home directory:
cd ~
npm run tauri:dev  # ❌ This won't work!
```

The `tauri:dev` script only exists in the `basketball-analysis/package.json` file, so you must be in that directory!

---

## 📋 Step-by-Step Instructions

### Step 1: Open Terminal

Open your Terminal app (or use the one you already have open)

### Step 2: Navigate to Project

```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI"
```

### Step 3: Run the Desktop App

```bash
./start-desktop.sh
```

### Step 4: Wait for App to Launch

You'll see:
1. Next.js dev server starting
2. Rust compilation (first time only - takes 1-2 minutes)
3. Desktop window opening with your app

---

## 🎯 What to Expect

**First Time Running:**
- Rust will compile (1-2 minutes)
- Next.js will build
- Desktop window will open

**Subsequent Runs:**
- Much faster (30 seconds)
- Hot-reload enabled
- Changes reflect immediately

---

## 🐛 Troubleshooting

### "Missing script: tauri:dev"

**Problem:** You're in the wrong directory

**Solution:**
```bash
# Check where you are
pwd

# Should show: /Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis
# If not, navigate there:
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"
```

### "command not found: npm"

**Problem:** Node.js not in PATH

**Solution:**
```bash
source "$HOME/.nvm/nvm.sh"
nvm use 20
```

### "Rust not found"

**Problem:** Rust not in PATH

**Solution:**
```bash
source "$HOME/.cargo/env"
rustc --version  # Should show 1.92.0
```

### Window is Blank

**Problem:** Next.js dev server not running

**Solution:**
- Wait a few more seconds
- Check terminal for errors
- Try stopping (Ctrl+C) and restarting

---

## 📍 Quick Reference

**Project Root:**
```
/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI
```

**App Directory:**
```
/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis
```

**Scripts:**
- `./start-desktop.sh` - From project root
- `npm run tauri:dev` - From basketball-analysis directory
- `npm run tauri:build` - Build for production

---

## 🎉 Success!

When it works, you'll see:
- Terminal showing "Ready in X seconds"
- Desktop window opens
- Your basketball analysis app running natively
- DevTools available (right-click → Inspect)

---

**Need more help?** See `basketball-analysis/TAURI_INSTALLATION_COMPLETE.md`
