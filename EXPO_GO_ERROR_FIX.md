# Expo Go Error Fix - "Failed to download remote update" 🔧

## Problem
You're seeing: **"java.io.Exception: Failed to download remote update"** in Expo Go

## Root Causes

This error happens when Expo Go can't download the JavaScript bundle from the development server. Common reasons:

1. **Network connectivity issues** between your phone and the server
2. **Firewall or security settings** blocking the connection
3. **Tunnel connection problems** with Expo's ngrok tunnel
4. **Bundle size too large** for initial download
5. **Slow network** causing timeout

---

## ✅ Solutions (Try in Order)

### Solution 1: Use Direct URL Instead of QR Code (RECOMMENDED)

**Steps:**

1. **Get the Expo Tunnel URL:**
   - Check your preview URL: `https://pocket-cursor.preview.emergentagent.com`
   - This is your Expo tunnel endpoint

2. **In Expo Go App:**
   - Open Expo Go
   - Tap "Enter URL manually"
   - Enter: `exp://pocket-cursor.preview.emergentagent.com`
   - Or try: `https://pocket-cursor.preview.emergentagent.com`

3. **Wait for bundle to load** (first load takes 30-60 seconds)

---

### Solution 2: Clear Expo Go Cache

**Steps:**

1. Open Expo Go app
2. Go to Settings (gear icon)
3. Tap "Clear Cache"
4. Close and reopen Expo Go
5. Try connecting again

---

### Solution 3: Ensure Good Network Connection

**Check:**
- ✅ Phone has strong WiFi/mobile data
- ✅ Not on restrictive corporate network
- ✅ VPN is disabled (if using one)
- ✅ Phone can access internet normally

**Test:**
- Open browser on phone
- Visit: `https://pocket-cursor.preview.emergentagent.com`
- Should see the app preview page

---

### Solution 4: Use LAN Connection (If on Same Network)

**If your phone and development server are on the same network:**

1. Stop the current Expo server
2. Restart with LAN mode:
   ```bash
   cd /app/frontend
   sudo supervisorctl stop expo
   # Then restart with LAN
   npx expo start --lan
   ```

3. Scan the new QR code or use the LAN URL shown

---

### Solution 5: Reduce Bundle Size

The initial bundle might be too large. Let me optimize:

**Create a minimal test route:**

1. Create `/app/frontend/app/test.tsx`:
```typescript
import { View, Text } from 'react-native';

export default function Test() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Mobile IDE Test</Text>
    </View>
  );
}
```

2. Access: `exp://pocket-cursor.preview.emergentagent.com/test`

3. If this works, the main app bundle might be too large

---

### Solution 6: Check Expo Dev Tools

**In your browser:**

1. Go to: `http://localhost:3000`
2. Check Metro Bundler status
3. Look for any bundle errors
4. Ensure bundling completes successfully

---

### Solution 7: Try Development Build (Advanced)

If Expo Go continues to fail, use a development build:

**Steps:**

1. Install development client:
   ```bash
   cd /app/frontend
   npx expo install expo-dev-client
   ```

2. Build development APK:
   ```bash
   eas build --profile development --platform android
   ```

3. Install the dev build APK
4. Open it (doesn't use Expo Go)

---

## 🔍 Debugging Steps

### Check Server Logs

```bash
# Check if bundle is being served
tail -f /var/log/supervisor/expo.out.log

# Look for errors
tail -f /var/log/supervisor/expo.err.log
```

### Test Network Connectivity

**From your phone's browser:**
1. Visit: `https://pocket-cursor.preview.emergentagent.com`
2. Should see: Expo preview page
3. If not loading → Network issue

### Check Expo Status

```bash
cd /app/frontend
npx expo doctor
```

---

## 🎯 Quick Fix Command

**Restart Expo with clean state:**

```bash
# Stop Expo
sudo supervisorctl stop expo

# Clear cache
cd /app/frontend
rm -rf .expo node_modules/.cache

# Restart
sudo supervisorctl start expo

# Wait 30 seconds for tunnel to establish
sleep 30

# Check status
sudo supervisorctl status expo
```

---

## 📱 Alternative: Test on Web First

**While debugging mobile:**

1. Open browser on your computer
2. Visit: `http://localhost:3000`
3. Test the app in web mode
4. All features should work in browser

---

## 🐛 Common Errors & Fixes

### "Network request failed"
- **Fix:** Check internet connection on phone
- **Fix:** Disable VPN
- **Fix:** Try mobile data instead of WiFi

### "Could not connect to development server"
- **Fix:** Ensure tunnel is running
- **Fix:** Check firewall settings
- **Fix:** Restart Expo server

### "Bundle download timeout"
- **Fix:** First bundle takes time (wait 60s)
- **Fix:** Use faster network
- **Fix:** Try LAN mode instead of tunnel

### "Unauthorized request"
- **Fix:** This is a warning, not the main issue
- **Fix:** Related to CORS from browser
- **Fix:** Doesn't affect Expo Go connection

---

## ✅ Recommended Approach

**For immediate testing:**

1. **Use Web Preview:**
   - Go to: `http://localhost:3000`
   - Test in browser first
   - All features work on web

2. **For Mobile Testing:**
   - Option A: Build APK with EAS (takes 15 min)
   - Option B: Try direct URL in Expo Go
   - Option C: Clear cache and retry

3. **If nothing works:**
   - Build development APK
   - Install on device
   - Test without Expo Go

---

## 📊 Expected Behavior

**First Load:**
- Takes 30-60 seconds
- Shows "Downloading JavaScript bundle..."
- Progress bar fills up
- Then app loads

**Subsequent Loads:**
- Much faster (cache used)
- 5-10 seconds typically

---

## 🔗 Useful Commands

```bash
# Check Expo status
sudo supervisorctl status expo

# Restart Expo
sudo supervisorctl restart expo

# View logs
tail -f /var/log/supervisor/expo.out.log

# Test if server is accessible
curl -I http://localhost:3000

# Check tunnel status
cd /app/frontend && npx expo start --tunnel
```

---

## 💡 Pro Tips

1. **First time loading is slow** - Be patient
2. **Good network is critical** - Use WiFi or good LTE
3. **Web preview works great** - Test there first
4. **Development builds are more stable** - Consider using
5. **APK build is most reliable** - Best for real testing

---

## 🎯 Immediate Action

**Try this now:**

1. Open Expo Go on your phone
2. Tap "Enter URL manually"
3. Enter: `exp://pocket-cursor.preview.emergentagent.com`
4. Wait 60 seconds for bundle to download
5. Should start loading!

**If that doesn't work:**

1. Open browser on phone
2. Visit: `https://pocket-cursor.preview.emergentagent.com`
3. Test app in mobile browser
4. Works as Progressive Web App

---

## 📞 Need More Help?

If none of these work, let me know:
- What error message you see exactly
- Your network type (WiFi/LTE/5G)
- Phone model and Android version
- What step you're on

I'll help debug further! 🔧
