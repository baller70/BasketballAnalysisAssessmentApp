# 🏀 SHOTIQ AI - START HERE

## 🚀 Quick Start Guide

### Step 1: Start the Development Server

**Option A: Use the startup script (Recommended)**
```bash
./start-dev.sh
```

**Option B: Use npm from root**
```bash
npm run dev
```

**Option C: Manual start**
```bash
cd basketball-analysis
npm run dev
```

### Step 2: Open Your Browser

Navigate to: **http://localhost:3000**

---

## 📁 Important: Which Directory to Use?

### ✅ **USE THIS:** `basketball-analysis/`
- This is the **MAIN, CURRENT, FEATURE-COMPLETE** application
- All development should happen here
- This is what gets deployed to production

### ⚠️ **DO NOT USE:** `nextjs_space/`
- This is an **OLD/DEPRECATED** version
- Keep for reference only
- Do not develop or run from here

---

## 🔧 Common Commands

From the **project root**:
```bash
npm run dev          # Start development server (main app)
npm run build        # Build for production
npm run install-main # Install dependencies in main app
npm run info         # Show which directories to use
```

From **basketball-analysis/** directory:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npx prisma studio    # Open database GUI
```

---

## 📚 Documentation

- **`README.md`** - Full project documentation
- **`basketball-analysis/README.md`** - Application-specific docs
- **`basketball-analysis/DEVELOPER_GUIDE.md`** - Developer guidelines
- **`DEPLOYMENT_ANALYSIS.md`** - Deployment information

---

## 🆘 Need Help?

### "Which version am I running?"
Check the terminal output - it should show `basketball-analysis/` in the path.

### "How do I ensure I'm using the right version?"
Always use `./start-dev.sh` or `npm run dev` from the project root.

### "Can I delete nextjs_space/?"
Keep it for now as a reference, but **never run or develop from it**.

---

## ✨ You're All Set!

Run `./start-dev.sh` and start building! 🚀

**Last Updated:** December 27, 2025
