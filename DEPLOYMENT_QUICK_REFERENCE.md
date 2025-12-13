# 🎯 Deployment Quick Reference Card

## 📋 Essential Information

### Backend Repository
```
https://github.com/baller70/BasketballAnalysisAssessmentApp.git
```

### Backend Location
```
/home/ubuntu/basketball_app/python-backend/
```

### Replicate API Token
```
r8_XVbSqNpDmahHdfRWDjmivN2ZNPk3MUH2w1N4x
```

---

## 🚀 Recommended Platform: Railway

**Why Railway?**
- ✅ Best Python + Docker support
- ✅ Free tier ($5 credit/month)
- ✅ Automatic HTTPS & domain
- ✅ Simple environment variables
- ✅ Perfect for MediaPipe/OpenCV

**Deploy URL:** [railway.app](https://railway.app)

---

## 🔑 Required Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `REPLICATE_API_TOKEN` | `r8_XVbSqNpDmahHdfRWDjmivN2ZNPk3MUH2w1N4x` | Already configured |
| `ALLOWED_ORIGINS` | `https://YOUR-FRONTEND-URL,http://localhost:3000` | ⚠️ MUST UPDATE |
| `HOST` | `0.0.0.0` | Standard |
| `PORT` | `$PORT` (Railway) / `10000` (Render) | Platform-specific |
| `MEDIAPIPE_MODEL_COMPLEXITY` | `2` | Optional (0-2) |

---

## ⚙️ Critical Configuration Steps

### 1. Root Directory (Railway/Render)
```
python-backend
```
⚠️ **Must set this** - backend is in subdirectory

### 2. Frontend Environment Variable
```bash
NEXT_PUBLIC_PYTHON_API_URL=https://your-backend-url.up.railway.app
```
⚠️ **No trailing slash!**

### 3. Update CORS
Add your Abacus AI frontend URL to `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=https://basketball-app.abacus.ai,http://localhost:3000
```

---

## 🧪 Testing Commands

### Health Check
```bash
curl https://your-backend-url/health
```

**Expected Response:**
```json
{"status": "healthy", "version": "1.0.0", "mediapipe_available": true}
```

### Test from Browser Console
```javascript
fetch('https://your-backend-url/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend working:', data))
  .catch(err => console.error('❌ Error:', err));
```

---

## 🔧 Common Issues & Quick Fixes

### CORS Error
```bash
# Add frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://your-frontend.abacus.ai,http://localhost:3000
```

### 404 Not Found
```bash
# Check Root Directory setting
Root Directory: python-backend
```

### Build Failed
```bash
# Verify Dockerfile exists
ls python-backend/Dockerfile
```

### Frontend Can't Connect
```bash
# Check environment variable (no trailing slash!)
NEXT_PUBLIC_PYTHON_API_URL=https://backend-url.com
```

---

## 📚 Documentation Files

| File | Purpose | Size |
|------|---------|------|
| `PYTHON_BACKEND_DEPLOYMENT_GUIDE.md` | Comprehensive guide (Railway, Render, Vercel) | 32 KB |
| `QUICK_DEPLOY.md` | Fast Railway deployment (10-15 min) | 6.6 KB |
| `DEPLOYMENT_QUICK_REFERENCE.md` | This file - essential info | 3 KB |

---

## ⏱️ Estimated Timeline

| Step | Time |
|------|------|
| Create Railway account | 2 min |
| Connect repository | 1 min |
| Configure root directory | 1 min |
| Add environment variables | 3 min |
| Generate domain | 1 min |
| Wait for deployment | 3-5 min |
| Test backend | 1 min |
| Update frontend | 2 min |
| Test integration | 2 min |
| **TOTAL** | **15-20 min** |

---

## 🔗 Important URLs (After Deployment)

### Backend
- **API:** `https://your-backend-url`
- **Health:** `https://your-backend-url/health`
- **Docs:** `https://your-backend-url/docs` (auto-generated)

### Frontend
- **App:** `https://your-frontend-url.abacus.ai`

### Dashboards
- **Railway:** [railway.app/dashboard](https://railway.app/dashboard)
- **Render:** [render.com/dashboard](https://render.com/dashboard)

---

## 🎯 Next Steps After Reading This

1. **Quick deployment?** → Read `QUICK_DEPLOY.md`
2. **Need details?** → Read `PYTHON_BACKEND_DEPLOYMENT_GUIDE.md`
3. **Ready to deploy?** → Go to [railway.app](https://railway.app)

---

**Last Updated:** December 4, 2025  
**Recommended Platform:** Railway  
**Estimated Cost:** Free tier sufficient for testing, $5-10/month for production
