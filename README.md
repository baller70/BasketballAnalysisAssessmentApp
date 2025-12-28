# SHOTIQ AI - Basketball Shooting Analysis Platform

## 🎯 Multi-Platform Support

**SHOTIQ AI is ready for deployment across ALL platforms:**

- ✅ **Web** (Browser) - Currently running
- ✅ **Desktop** (Tauri) - macOS, Windows, Linux - **INSTALLED & READY!** 🎉
- 🎯 **iOS** (Mobile) - iPhone & iPad - Ready to implement
- 🎯 **Android** (Mobile) - Phones & Tablets - Ready to implement

**Status:** Desktop app ready! Platform abstraction layer created. 90% code sharing across all platforms.

📖 **See:** `basketball-analysis/TAURI_INSTALLATION_COMPLETE.md` for desktop setup details

---

## 🚀 Quick Start (IMPORTANT - READ THIS FIRST!)

### Starting the Web Application

**Use this command to start the web version:**

```bash
./start-dev.sh
```

Or manually:

```bash
cd basketball-analysis
npm run dev
```

Then open: **http://localhost:3000**

### Starting the Desktop Application (NEW! 🎉)

**Use this command to start the desktop app:**

```bash
./start-desktop.sh
```

Or manually:

```bash
cd basketball-analysis
npm run tauri:dev
```

This will launch a native desktop window with your app!

---

## 📁 Project Structure (IMPORTANT)

This repository contains multiple directories. Here's what each one is:

### ✅ **PRIMARY APPLICATION** (Use This!)

- **`basketball-analysis/`** - **MAIN, FEATURE-COMPLETE APPLICATION**
  - This is the production-ready version
  - Contains all latest features
  - This is what you should always run and develop on
  - **Node Version Required:** 20.x

### 📦 Other Directories

- **`nextjs_space/`** - ⚠️ **OLD/DEPRECATED VERSION** - Do not use
- **`python-backend/`** - FastAPI backend for pose detection
- **`huggingface-backend/`** - Flask backend for advanced analysis
- **`python-scraper/`** - Data collection tools
- **`dual_tier_analysis/`** - Tier comparison logic
- **`image_collection/`** - Dataset management

---

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 20.x (managed via nvm)
- npm 10.x
- PostgreSQL (for database)

### First Time Setup

1. **Make the startup script executable:**
   ```bash
   chmod +x start-dev.sh
   ```

2. **Run the startup script:**
   ```bash
   ./start-dev.sh
   ```

   This will automatically:
   - Switch to Node.js 20
   - Install dependencies if needed
   - Start the development server

### Manual Setup (Alternative)

```bash
# Switch to Node 20
nvm use 20

# Navigate to the main app
cd basketball-analysis

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🎯 Key Features

- **AI-Powered Analysis**: Computer vision-based shooting form analysis
- **Video & Image Upload**: Support for both media types
- **Elite Shooter Comparison**: Compare your form to NBA players
- **Profile System**: Personalized user profiles and progress tracking
- **Gamification**: Points, badges, and achievement system
- **Coaching Insights**: Detailed feedback and drill recommendations
- **Session History**: Track improvement over time

---

## 📚 Technology Stack

### Frontend (basketball-analysis/)
- **Framework:** Next.js 14.2.28
- **Language:** TypeScript 5.x
- **Styling:** TailwindCSS 3.3.3
- **State Management:** Zustand 5.0.9
- **Database ORM:** Prisma 6.7.0
- **UI Components:** Radix UI
- **Animations:** Framer Motion, GSAP

### Backend Services
- **Python Backend:** FastAPI + MediaPipe
- **HuggingFace Backend:** Flask + YOLOv8
- **Database:** PostgreSQL

---

## 🔧 Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database (Prisma)
```bash
npx prisma generate  # Generate Prisma Client
npx prisma migrate   # Run database migrations
npx prisma studio    # Open Prisma Studio GUI
```

---

## ⚠️ Important Notes

1. **Always use `basketball-analysis/` directory** - This is the main app
2. **Do not use `nextjs_space/`** - This is an old version
3. **Use Node 20.x** - Required for Prisma compatibility
4. **Use the startup script** - `./start-dev.sh` ensures correct setup

---

## 🐛 Troubleshooting

### "Wrong version of the app is running"
- Make sure you're in the `basketball-analysis/` directory
- Use the `./start-dev.sh` script from the project root

### "Prisma Client errors"
- Run: `npx prisma generate`
- Make sure you're using Node 20.x: `nvm use 20`

### "Port 3000 already in use"
- Kill existing Next.js processes: `pkill -f "next dev"`
- Or use a different port: `PORT=3001 npm run dev`

### "Node version issues"
- Install Node 20: `nvm install 20`
- Switch to Node 20: `nvm use 20`

---

## 📖 Documentation

For more detailed documentation, see:
- `basketball-analysis/README.md` - Detailed app documentation
- `basketball-analysis/DEVELOPER_GUIDE.md` - Developer guide
- `basketball-analysis/ARCHITECTURE.md` - Architecture overview
- `DEPLOYMENT_ANALYSIS.md` - Deployment information

---

## 📞 Support

If you encounter issues, check:
1. You're in the `basketball-analysis/` directory
2. You're using Node 20.x (`node -v`)
3. Dependencies are installed (`node_modules/` exists)
4. The startup script is executable (`chmod +x start-dev.sh`)

---

**Last Updated:** December 27, 2025
