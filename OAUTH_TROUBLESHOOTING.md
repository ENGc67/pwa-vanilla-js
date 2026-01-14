# 🐛 OAuth Troubleshooting Guide

## ❌ Common Errors และวิธีแก้

### 1. Error: "Invalid redirect URL"

**ข้อความ Error:**
```
Error: Invalid redirect URL. The redirect URL must be added to your Supabase URL Configuration.
```

**สาเหตุ:**
- URL ของคุณไม่ได้อยู่ใน whitelist ของ Supabase

**วิธีแก้:**
1. เปิด Supabase Dashboard
2. ไปที่ **Authentication** → **URL Configuration**
3. เพิ่ม URL ใน **Redirect URLs**:
   ```
   https://your-domain.com/**
   http://localhost:3000/**
   ```
4. คลิก **Save**
5. รอ 1-2 นาที แล้วลองใหม่

**ตรวจสอบ:**
```javascript
// Console log ควรเห็น:
🔄 Redirecting to Google OAuth...
// ถ้าเห็น error แทน แสดงว่ายังไม่ได้ config
```

---

### 2. Error: "redirect_uri_mismatch" (Google)

**ข้อความ Error:**
```
Error 400: redirect_uri_mismatch
The redirect URI in the request does not match the ones authorized for the OAuth client.
```

**สาเหตุ:**
- Redirect URI ใน Google Cloud Console ไม่ตรง

**วิธีแก้:**
1. เปิด [Google Cloud Console](https://console.cloud.google.com/)
2. ไปที่ **APIs & Services** → **Credentials**
3. เลือก OAuth Client ID ของคุณ
4. **Authorized redirect URIs** ต้องเป็น:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
5. **ห้ามมี trailing slash** `/`
6. คลิก **Save**

**หา Project Ref:**
```
Supabase Dashboard → Settings → API → Project URL
https://xxxxx.supabase.co
       ↑
   project-ref
```

**ตรวจสอบ:**
```javascript
// URL ต้องตรงกันทุกที่:
Google Console: https://xxxxx.supabase.co/auth/v1/callback
Supabase URL:   https://xxxxx.supabase.co
                       ↑ ต้องเหมือนกัน
```

---

### 3. Error: "redirect_uri_mismatch" (GitHub)

**ข้อความ Error:**
```
The redirect_uri MUST match the registered callback URL for this application.
```

**สาเหตุ:**
- Callback URL ใน GitHub OAuth App ไม่ตรง

**วิธีแก้:**
1. เปิด [GitHub Developer Settings](https://github.com/settings/developers)
2. เลือก **OAuth Apps** → เลือก App ของคุณ
3. **Authorization callback URL** ต้องเป็น:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
4. คลิก **Update application**

**ตรวจสอบ:**
```javascript
// ใน Console ควรเห็น:
🔄 Redirecting to GitHub OAuth...
// แล้ว redirect ไปยัง github.com/login/oauth/authorize
```

---

### 4. Error: "access_denied"

**ข้อความ Error:**
```
เข้าสู่ระบบไม่สำเร็จ: access_denied
User denied access
```

**สาเหตุ:**
- User กด "Cancel" หรือ "Deny" บน OAuth consent screen

**วิธีแก้:**
- นี่ไม่ใช่ bug - เป็นพฤติกรรมปกติ
- User ต้องกด "Allow" หรือ "Authorize" แทน

**Behavior:**
```javascript
// ระบบจะ:
1. แสดง toast: "เข้าสู่ระบบไม่สำเร็จ: access_denied"
2. Clean URL hash
3. อยู่ที่หน้า login
4. User สามารถลองใหม่ได้
```

---

### 5. Error: "Session not restored after redirect"

**ข้อความใน Console:**
```
🔍 Detected OAuth callback in URL
🔄 Processing OAuth callback...
⚠️ No session after OAuth redirect
```

**สาเหตุ:**
- Supabase ยังไม่ทันสร้าง session เสร็จ
- localStorage ถูกบล็อก (Private browsing mode)

**วิธีแก้:**

**Option 1: เพิ่มเวลารอ**
```javascript
// ใน handleOAuthCallback()
// เพิ่มเวลารอจาก 1000ms เป็น 2000ms
await new Promise(resolve => setTimeout(resolve, 2000));
```

**Option 2: ตรวจสอบ localStorage**
```javascript
// เปิด Console (F12) แล้วทดสอบ:
localStorage.setItem('test', 'test');
console.log(localStorage.getItem('test'));
// ถ้าได้ 'test' แสดงว่า localStorage ใช้งานได้

// ลบทดสอบ:
localStorage.removeItem('test');
```

**Option 3: ปิด Private Browsing**
- Private/Incognito mode อาจบล็อก localStorage
- ใช้ normal browsing mode แทน

---

### 6. Error: "Failed to fetch"

**ข้อความ Error:**
```
ไม่สามารถเข้าสู่ระบบด้วย Google ได้: Failed to fetch
```

**สาเหตุ:**
- ไม่มี internet connection
- Network error
- Firewall บล็อก

**วิธีแก้:**
1. ตรวจสอบ internet connection
2. ลองเปิดเว็บอื่น (google.com)
3. Disable VPN/Proxy
4. ปิด Firewall ชั่วคราว
5. ลองใหม่

---

### 7. Error: "PKCE flow requires a code_challenge"

**ข้อความ Error:**
```
PKCE flow requires a code_challenge to be present
```

**สาเหตุ:**
- Supabase client version เก่าเกินไป

**วิธีแก้:**
1. Update Supabase client:
   ```html
   <!-- เปลี่ยนจาก version เก่า -->
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@1"></script>
   
   <!-- เป็น version ใหม่ -->
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```

2. ตรวจสอบ version:
   ```javascript
   console.log('Supabase version:', supabase.version);
   // ควรเป็น 2.x.x ขึ้นไป
   ```

---

### 8. Error: "Popup blocked"

**ข้อความ:**
```
Popup window was blocked by the browser
```

**สาเหตุ:**
- Browser บล็อก popup window

**วิธีแก้:**
- โค้ดปัจจุบันไม่ใช้ popup (ใช้ redirect แทน)
- ถ้าเจอ error นี้ แสดงว่ามีโค้ดเก่าที่ใช้ popup อยู่

**ตรวจสอบ:**
```javascript
// โค้ดปัจจุบันควรเป็น:
options: {
  skipBrowserRedirect: false  // ✅ ใช้ redirect (ไม่ใช้ popup)
}

// ถ้าเป็นแบบนี้ → เปลี่ยนเป็น false
options: {
  skipBrowserRedirect: true  // ❌ จะใช้ popup (อาจถูกบล็อก)
}
```

---

### 9. Error: "Client ID not found"

**ข้อความ Error:**
```
OAuth client not found
Invalid client ID
```

**สาเหตุ:**
- Client ID ใน Supabase Dashboard ไม่ถูกต้อง
- Copy Client ID ไม่ครบ

**วิธีแก้:**

**สำหรับ Google:**
1. เปิด Google Cloud Console
2. คัดลอก Client ID ใหม่ (ทั้งหมด)
   ```
   123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ← ต้องคัดลอกทั้งหมด
   ```
3. ไปที่ Supabase → Authentication → Providers → Google
4. Paste Client ID ใหม่
5. **Save**

**สำหรับ GitHub:**
1. เปิด GitHub Developer Settings
2. คัดลอก Client ID ใหม่
3. ไปที่ Supabase → Authentication → Providers → GitHub
4. Paste Client ID ใหม่
5. **Save**

---

### 10. Infinite redirect loop

**อาการ:**
- หน้าเว็บ redirect ไปมาไม่หยุด
- Console แสดง:
  ```
  🔍 Detected OAuth callback in URL
  🔄 Processing OAuth callback...
  🔍 Detected OAuth callback in URL
  🔄 Processing OAuth callback...
  ... (loop)
  ```

**สาเหตุ:**
- URL hash ไม่ถูกลบ

**วิธีแก้:**
1. เช็คว่า `handleOAuthCallback()` ลบ hash หรือไม่:
   ```javascript
   // ต้องมีบรรทัดนี้:
   window.history.replaceState(null, null, window.location.pathname);
   // หรือ:
   window.location.hash = '';
   ```

2. Clear browser cache และ cookies
3. ลองใน Incognito mode

---

## 🔍 Debugging Tips

### 1. เปิด Console Log
```javascript
// กด F12 → Console
// ควรเห็น logs ตามลำดับ:

// เมื่อคลิก login:
🔄 Redirecting to Google OAuth...

// เมื่อ redirect กลับมา:
🔍 Detected OAuth callback in URL
🔄 Processing OAuth callback...
✅ OAuth login successful: user@gmail.com
🔄 Auth state changed: SIGNED_IN user@gmail.com
✅ User signed in
```

### 2. ตรวจสอบ URL hash
```javascript
// เปิด Console แล้วพิมพ์:
console.log(window.location.hash);

// ถ้า OAuth callback สำเร็จ จะเห็น:
#access_token=xxx&refresh_token=yyy&...

// ถ้า error:
#error=access_denied&error_description=User%20denied
```

### 3. ตรวจสอบ Session
```javascript
// เปิด Console แล้วพิมพ์:
const { data: { session } } = await db.auth.getSession();
console.log('Current session:', session);

// ถ้า login แล้ว จะเห็น:
{
  access_token: "xxx",
  refresh_token: "yyy",
  user: { email: "user@gmail.com", ... }
}
```

### 4. ตรวจสอบ localStorage
```javascript
// เปิด Console แล้วพิมพ์:
Object.keys(localStorage)
  .filter(key => key.includes('supabase'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key));
  });

// จะเห็น Supabase session data
```

### 5. Network Tab (F12 → Network)
```
ตรวจสอบ requests:
1. POST /auth/v1/token → ควรได้ 200 OK
2. GET /auth/v1/user → ควรได้ 200 OK

ถ้าได้ 400/401 → Client ID/Secret ผิด
ถ้าได้ 403 → Permission denied
ถ้าได้ 500 → Supabase server error
```

---

## 📱 Platform-Specific Issues

### iOS Safari
**ปัญหา:** localStorage ถูกล้างบ่อย

**แก้:**
- ใช้ Supabase session persistence (auto)
- ไม่ต้องแก้อะไร - Supabase จัดการให้

### Chrome Mobile
**ปัญหา:** Redirect ช้า

**แก้:**
- เพิ่มเวลารอใน `handleOAuthCallback()`:
  ```javascript
  await new Promise(resolve => setTimeout(resolve, 2000));
  ```

### Firefox
**ปัญหา:** CORS error

**แก้:**
- ตรวจสอบ Supabase CORS settings
- Supabase → Settings → API → CORS Origins
- เพิ่ม domain ของคุณ

---

## ✅ Checklist การแก้ปัญหา

### ก่อนแจ้งปัญหา ให้ลองทำตามนี้:
- [ ] เช็ค Console log (F12)
- [ ] เช็ค Network tab (F12 → Network)
- [ ] ลองใน Incognito mode
- [ ] Clear cache และ cookies
- [ ] ตรวจสอบ internet connection
- [ ] ตรวจสอบ Supabase Dashboard settings
- [ ] ตรวจสอบ Google/GitHub OAuth settings
- [ ] ลองใน browser อื่น
- [ ] ลองบน device อื่น
- [ ] อ่าน error message ให้ละเอียด

---

## 📞 Support Resources

### Official Documentation
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)

### Internal Docs
- [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) - Setup instructions
- [OAUTH_IMPLEMENTATION.md](./OAUTH_IMPLEMENTATION.md) - Implementation details
- [QUICK_START_OAUTH.md](./QUICK_START_OAUTH.md) - Quick start guide

### Community
- [Supabase Discord](https://discord.supabase.com/)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)

---

## 🎯 Still Having Issues?

**Collect this information:**
1. Error message (copy exact text)
2. Console logs (F12 → Console → screenshot)
3. Network requests (F12 → Network → screenshot)
4. Browser and version (Chrome 120, Safari 17, etc.)
5. Steps to reproduce
6. Screenshots

**Then:**
- Check Supabase Discord
- Post to GitHub Discussions
- Or contact support

---

**💡 Tip:** 90% ของปัญหา OAuth เกิดจาก Redirect URL ที่ตั้งค่าไม่ถูกต้อง ตรวจสอบให้แน่ใจว่า URL ตรงกันทุกที่!
