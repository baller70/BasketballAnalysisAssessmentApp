# 🚀 Quick Start Guide

## Basketball Image Approval System

### ⏱️ 2-Minute Setup

---

## Step 1: Launch the Server

```bash
cd /home/ubuntu/basketball_app/youtube_collection/approval_interface
python3 app.py
```

You should see:
```
🏀 BASKETBALL IMAGE APPROVAL INTERFACE
============================================================

📍 Server running at: http://localhost:5000

💡 Instructions:
   1. Open http://localhost:5000 in your browser
   2. Review each image
   3. Click APPROVE or REJECT
   4. Use keyboard shortcuts: A (approve), R (reject)
```

---

## Step 2: Open the Interface

**In your browser, navigate to:**
```
http://localhost:5000
```

---

## Step 3: Review Images

### Quick Review Process:
1. Look at the image
2. Ask: "Is this a good basketball shooting photo?"
3. Press **A** to approve OR **R** to reject
4. System auto-advances to next image

### Keyboard Shortcuts (Fast!)
- **A** = Approve
- **R** = Reject  
- **Space** = Next image
- **G** = Grid view

---

## Step 4: Export Results

1. Click **"Export Approved"** button
2. Downloads JSON file with approved images
3. Done! ✅

---

## 📊 What to Approve

✅ **YES - Approve if:**
- Basketball is visible
- Person shooting (not dribbling)
- Full body or torso visible
- Clear, good quality
- Real photo (not diagram)

❌ **NO - Reject if:**
- No basketball visible
- Blurry or poor quality
- Diagram/illustration
- Just hand close-ups
- Multiple people unclear

---

## 🎯 Goal

- **Total Images:** 25
- **Target:** 10-20 approved images
- **Time:** 5-10 minutes

---

## 💾 Where Are Approved Images?

Approved images are automatically copied to:
```
/home/ubuntu/basketball_app/youtube_collection/approved_images/
```

---

## 🆘 Need Help?

**Port already in use?**
- Stop other Flask apps
- Or change port in `app.py`

**Images not showing?**
- Check Flask server is running
- Check console for errors

**Want to change a decision?**
- Use grid view
- Click image to review again
- Click "Reset" button

---

## 📋 Full Documentation

See: `COLLECTION_REPORT.md` for complete details

---

**Ready? Let's go! 🏀**

```bash
python3 app.py
```
