# 🚀 Quick Start: OAuth Setup (5 นาที)

## 📋 ขั้นตอนย่อ (สำหรับคนรีบ)

### 1️⃣ Supabase Dashboard Setup (2 นาที)

#### ตั้งค่า URL Configuration
```
1. เปิด Supabase Dashboard → เลือก Project
2. Authentication → URL Configuration
3. เพิ่ม Redirect URLs:
   - https://your-domain.com/**
   - http://localhost:3000/**
4. Save
```

---

### 2️⃣ Google OAuth Setup (1.5 นาที)

```
1. เปิด https://console.cloud.google.com/
2. Create Credentials → OAuth client ID → Web application
3. Authorized redirect URIs:
   https://<your-project-ref>.supabase.co/auth/v1/callback
4. Copy Client ID + Client Secret
5. ไปที่ Supabase → Authentication → Providers → Google
6. Paste Client ID + Secret → Save
```

**หา Project Ref:**
- Supabase Dashboard → Settings → API
- Project URL: `https://xxxxx.supabase.co` ← xxxxx คือ project-ref

---

### 3️⃣ GitHub OAuth Setup (1.5 นาที)

```
1. เปิด https://github.com/settings/developers
2. OAuth Apps → New OAuth App
3. Callback URL:
   https://<your-project-ref>.supabase.co/auth/v1/callback
4. Copy Client ID + Generate Client Secret
5. ไปที่ Supabase → Authentication → Providers → GitHub
6. Paste Client ID + Secret → Save
```

---

## ✅ ทดสอบ (30 วินาที)

```
1. เปิดเว็บของคุณ
2. คลิก "Login with Google"
3. เลือกบัญชี Google
4. เข้าสู่ระบบสำเร็จ ✅

หรือ

1. คลิก "Login with GitHub"
2. Authorize
3. เข้าสู่ระบบสำเร็จ ✅
```

---

## 🔍 Console Logs (ถ้าสำเร็จ)

เปิด DevTools (F12) → Console จะเห็น:

```
🔄 Redirecting to Google OAuth...
🔍 Detected OAuth callback in URL
🔄 Processing OAuth callback...
🔄 Auth state changed: SIGNED_IN user@gmail.com
✅ OAuth login successful: user@gmail.com
✅ User signed in
```

---

## ❌ ถ้าเจอปัญหา

### Error: "Invalid redirect URL"
**แก้:** เพิ่ม URL ของคุณใน Supabase → Authentication → URL Configuration

### Error: "redirect_uri_mismatch"
**แก้:** ตรวจสอบว่า Redirect URI ใน Google/GitHub Console ต้องเป็น:
```
https://<project-ref>.supabase.co/auth/v1/callback
```

### Login แล้วไม่เกิดอะไร
**แก้:** เปิด Console (F12) ดู error log

---

## 📚 เอกสารเพิ่มเติม

- [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) - คำแนะนำแบบละเอียด
- [OAUTH_IMPLEMENTATION.md](./OAUTH_IMPLEMENTATION.md) - สรุปการเปลี่ยนแปลงโค้ด

---

## ✨ ทำเสร็จแล้ว!

OAuth Login พร้อมใช้งาน 🎉

**Features:**
- ✅ Login ด้วย Google
- ✅ Login ด้วย GitHub  
- ✅ Auto restore session
- ✅ Secure token storage
- ✅ Error handling
- ✅ Toast notifications

**Next Steps:**
- Deploy to production
- Test on mobile devices
- Monitor Supabase Dashboard → Authentication → Users
