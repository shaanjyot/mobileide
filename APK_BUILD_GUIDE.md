# 📱 Mobile IDE APK Build Guide

## Overview

This guide explains how to build and install the Mobile IDE APK on your Android device for testing.

---

## 🎯 Quick Start Options

### Option 1: Use Expo Go (Fastest - No Build Required)

**Best for:** Quick testing, no installation needed

1. **Install Expo Go on your Android device:**
   - Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   
2. **Connect to the app:**
   - Open Expo Go
   - Scan the QR code from your Expo development server
   - Or enter URL: `exp://localhost:3000`

3. **Advantages:**
   - Instant testing
   - No build required
   - Hot reload enabled
   - Easy debugging

---

### Option 2: Build APK with EAS Build (Recommended)

**Best for:** Standalone testing, sharing with others

#### Prerequisites
- Expo account (free at https://expo.dev)
- EAS CLI installed

#### Steps:

**1. Install EAS CLI (if not already installed):**
```bash
cd /app/frontend
npm install -g eas-cli
```

**2. Login to Expo:**
```bash
eas login
```
Enter your Expo credentials

**3. Configure the project:**
```bash
eas build:configure
```

**4. Build APK:**
```bash
# For preview/testing (unsigned APK)
eas build --platform android --profile preview

# Or for production (signed APK)
eas build --platform android --profile production
```

**5. Wait for build to complete:**
- Build process takes 10-20 minutes
- You'll get a download link when ready
- APK will be available at: https://expo.dev/accounts/[your-account]/projects/mobile-ide/builds

**6. Download and Install:**
- Download APK from the provided link
- Transfer to your Android device
- Enable "Install from Unknown Sources" in Settings
- Install the APK

---

### Option 3: Local Build with Expo (Development Build)

**Best for:** Full control, custom native code

**Note:** Requires Android Studio and SDK installed locally

```bash
cd /app/frontend

# Install expo-dev-client
npx expo install expo-dev-client

# Build locally
npx expo run:android
```

This creates a development build with hot reload capabilities.

---

## 📦 Current Configuration

### App Details
```json
{
  "name": "Mobile IDE",
  "version": "1.0.0",
  "package": "com.mobilide.app",
  "bundleId": "com.mobilide.app"
}
```

### Permissions Required
- `INTERNET` - For API calls and AI features
- `ACCESS_NETWORK_STATE` - For connectivity checks

### Build Profiles (eas.json)
```json
{
  "preview": {
    "distribution": "internal",
    "android": {
      "buildType": "apk"
    }
  },
  "production": {
    "android": {
      "buildType": "apk"
    }
  }
}
```

---

## 🔧 Alternative: Manual APK Export

If you have access to Android Studio:

**1. Export JavaScript Bundle:**
```bash
cd /app/frontend
npx expo export --platform android
```

**2. Copy bundle to Android project:**
```bash
# Copy assets to Android project
cp -r dist/* android/app/src/main/assets/
```

**3. Build with Gradle:**
```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🚀 Recommended Approach for This Environment

Since we're in a Kubernetes container, the **best approach is EAS Build**:

### Step-by-Step EAS Build Process:

```bash
# 1. Navigate to frontend directory
cd /app/frontend

# 2. Install EAS CLI globally
npm install -g eas-cli

# 3. Login to Expo (create free account if needed)
eas login

# 4. Initialize EAS in your project
eas build:configure

# 5. Start the build for Android APK
eas build --platform android --profile preview --non-interactive

# 6. Monitor build progress
# You'll get a URL to track progress: https://expo.dev/...

# 7. Download APK when ready
# EAS will provide a download link
```

### Expected Output:
```
✔ Build finished successfully
📱 APK: https://expo.dev/artifacts/[build-id]/mobile-ide-build.apk

Download size: ~50-80MB
Install size: ~100-150MB
```

---

## 📲 Installing the APK on Android

### On Android Device:

**1. Enable Unknown Sources:**
   - Go to Settings → Security
   - Enable "Install from Unknown Sources"
   - Or per-app: Settings → Apps → Chrome/Browser → Allow from this source

**2. Download APK:**
   - Open the EAS build link on your device
   - Or transfer APK via USB/email/cloud

**3. Install:**
   - Tap the APK file
   - Click "Install"
   - Grant permissions when prompted

**4. Launch:**
   - Find "Mobile IDE" in your app drawer
   - Open and start coding!

---

## 🧪 Testing Checklist

After installing the APK, test these features:

### Core Features
- [ ] App launches successfully
- [ ] Home screen loads
- [ ] Navigate to Projects
- [ ] Create new project
- [ ] Create new file

### Editor Features
- [ ] Open file in editor
- [ ] Code editing works
- [ ] Syntax highlighting visible
- [ ] Save file works
- [ ] File list displays

### AI Features
- [ ] Open AI chat (💬 icon)
- [ ] Send message to AI
- [ ] AI responds correctly
- [ ] Open Enhanced AI chat (✨ icon)
- [ ] Code blocks show Apply button
- [ ] Apply code to file works

### Code Execution
- [ ] Write Python code
- [ ] Click Run button
- [ ] Output displays correctly
- [ ] Try JavaScript execution
- [ ] Error handling works

### Network
- [ ] Backend API connection works
- [ ] Projects sync to cloud
- [ ] Files save to database
- [ ] AI chat uses internet

---

## ⚠️ Important Notes

### Backend Configuration

**The APK needs to connect to your backend API.**

**For Testing:**

1. **Update backend URL in .env:**
```bash
# In /app/frontend/.env
EXPO_PUBLIC_BACKEND_URL=https://your-deployed-backend-url.com
```

2. **Rebuild APK after changing backend URL**

**For Production:**
- Deploy backend to a public server
- Update EXPO_PUBLIC_BACKEND_URL to production URL
- Rebuild APK

### Known Limitations

1. **First Build:** Takes 10-20 minutes
2. **APK Size:** ~50-80MB download
3. **Android Version:** Requires Android 5.0+ (API 21+)
4. **Internet Required:** For AI features and cloud sync
5. **Backend Dependency:** Needs backend server running

---

## 🐛 Troubleshooting

### Build Errors

**Error: "Not logged in"**
```bash
eas login
```

**Error: "Project not configured"**
```bash
eas build:configure
```

**Error: "Build failed"**
- Check build logs at expo.dev
- Ensure app.json is valid
- Verify all dependencies installed

### Installation Errors

**Error: "App not installed"**
- Enable "Unknown Sources"
- Check storage space (need 150MB+)
- Uninstall previous version

**Error: "Parse error"**
- APK may be corrupted, re-download
- Check Android version compatibility

### Runtime Errors

**App crashes on launch:**
- Check backend URL is correct
- Ensure internet connection
- Check logcat for errors

**AI features not working:**
- Verify backend is accessible
- Check EMERGENT_LLM_KEY is configured
- Test API endpoints with curl

**Can't save files:**
- Check internet connection
- Verify MongoDB is running
- Check backend logs

---

## 📊 Build Specifications

### Output Details
```
Format: APK (Android Package)
Architecture: arm64-v8a, armeabi-v7a, x86, x86_64
Min SDK: 21 (Android 5.0)
Target SDK: 34 (Android 14)
Compiled: Java 11, Gradle 8.0
Bundle: Metro bundler
```

### Performance
```
Cold start: ~2-3 seconds
Hot reload: < 1 second (dev build)
Bundle size: ~30MB
Assets: ~20MB
Total: ~50MB
```

---

## 🔗 Useful Links

- **Expo Documentation:** https://docs.expo.dev
- **EAS Build Guide:** https://docs.expo.dev/build/introduction/
- **Android APK Install:** https://www.wikihow.com/Install-APK-Files-on-Android
- **Expo Go App:** https://expo.dev/go

---

## 📝 Summary

**For Quick Testing:** Use Expo Go app (scan QR code)
**For Sharing/Production:** Build APK with EAS Build
**For Development:** Use development build with expo-dev-client

**Recommended command:**
```bash
cd /app/frontend && eas build --platform android --profile preview
```

This will create an installable APK you can download and share! 🚀

---

**Need Help?**
- Check Expo forums: https://forums.expo.dev
- Report issues: File a bug report with logs
- Contact support: support@expo.dev
