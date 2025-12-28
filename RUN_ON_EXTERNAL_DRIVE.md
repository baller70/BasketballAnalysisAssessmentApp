# 💾 Running Tauri on External Drive

## ✅ Your Situation

- **Internal Drive:** 97-100% full (only 378 MB free) ❌
- **External Drive:** 768 GB free ✅
- **Project Location:** Already on external drive ✅

**Solution:** Use the external drive for Rust temporary files!

---

## 🚀 EASIEST WAY - Use the Script

**Just run this command:**

```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI"
./start-desktop-external.sh
```

This script automatically:
- ✅ Uses external drive for temporary files
- ✅ Uses external drive for build artifacts
- ✅ Checks available space
- ✅ Starts the desktop app

---

## 🎯 MANUAL WAY - Set Environment Variables

**Copy and paste these commands:**

```bash
# Set temporary directory to external drive
export TMPDIR="/Volumes/Softwaare Program/rust-temp"

# Navigate to project
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"

# Start Tauri
npm run tauri:dev
```

---

## 📊 Space Requirements

**Your External Drive:**
- Total: 931 GB
- Used: 164 GB
- **Available: 768 GB** ✅

**Tauri Needs:**
- Temporary files: 3-5 GB
- Build artifacts: 2-3 GB
- **Total: ~5-8 GB**

**Result:** You have MORE than enough space! 🎉

---

## ⏱️ What to Expect

**First Run (1-2 minutes):**
```
🖥️  Starting SHOTIQ AI Basketball Analysis Desktop App...
💾 Using external drive for temporary files

✅ Node version: v20.19.2
✅ Rust version: 1.92.0
💾 Available space on external drive: 768Gi

🚀 Starting Tauri desktop app...

   Compiling tauri v2.9.5
   Compiling shotiq-basketball-analysis v0.1.0
    Finished dev [unoptimized + debuginfo] target(s) in 1m 23s

▲ Next.js 14.2.28
- Local:        http://localhost:3000

[Desktop window opens! 🎉]
```

**Subsequent Runs (~30 seconds):**
- Much faster
- No Rust compilation needed
- Just Next.js startup

---

## 🎯 RECOMMENDED: Use the Script

**The script is better because it:**
1. Automatically sets up environment variables
2. Checks available space
3. Verifies Node and Rust are installed
4. Shows clear progress messages
5. Handles errors gracefully

**Just run:**
```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI"
./start-desktop-external.sh
```

---

## 💡 Why This Works

**The Problem:**
- Rust compiler creates temporary files in `/tmp` (on internal drive)
- Your internal drive is 100% full
- Compilation fails with "No space left on device"

**The Solution:**
- Set `TMPDIR` to point to external drive
- Rust uses external drive for temporary files
- External drive has 768 GB free
- Compilation succeeds! ✅

---

## 🔧 Troubleshooting

### "External drive not found"

**Check if drive is mounted:**
```bash
ls -la "/Volumes/Softwaare Program"
```

If not mounted, plug in your external drive.

### "Permission denied"

**Make script executable:**
```bash
chmod +x "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/start-desktop-external.sh"
```

### "Still no space"

**Check internal drive usage:**
```bash
df -h /
```

If still 100% full, you may need to free up a little space (even 1-2 GB helps) for system operations.

---

## 🎉 Ready to Try?

**Copy and paste this command:**

```bash
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI" && ./start-desktop-external.sh
```

**What will happen:**
1. Script checks everything is ready
2. Shows available space (768 GB)
3. Starts Rust compilation (uses external drive)
4. Starts Next.js dev server
5. Opens desktop window with your app! 🚀

**First run takes 1-2 minutes. Be patient!**

---

## 📝 Notes

- All build files go to: `/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis/src-tauri/target/`
- All temp files go to: `/Volumes/Softwaare Program/rust-temp/`
- Nothing touches your full internal drive
- You can delete `/Volumes/Softwaare Program/rust-temp/` after building to free up space

---

**Status:** ✅ Ready to build on external drive!
