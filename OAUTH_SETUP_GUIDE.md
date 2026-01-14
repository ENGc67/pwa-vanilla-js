# 🔐 คู่มือติดตั้ง OAuth Login (Google & GitHub)

## 📋 ขั้นตอนการติดตั้ง

### 1️⃣ Setup Supabase Dashboard

#### A. เปิด Authentication Settings
1. เข้า [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่ **Authentication** → **Providers**

#### B. ตั้งค่า Site URL และ Redirect URLs
1. ไปที่ **Authentication** → **URL Configuration**
2. ตั้งค่าดังนี้:

```
Site URL: 
https://your-domain.com
(หรือ http://localhost:3000 สำหรับ development)

Redirect URLs (เพิ่มทั้งหมด):
https://your-domain.com/**
https://your-domain.com/
http://localhost:3000/**
http://localhost:3000/
```

---

### 2️⃣ Setup Google OAuth

#### A. สร้าง Google OAuth Client
1. เข้า [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ (หรือเลือก Project ที่มี)
3. ไปที่ **APIs & Services** → **Credentials**
4. คลิก **Create Credentials** → **OAuth client ID**
5. เลือก **Application type: Web application**

#### B. กำหนด Authorized redirect URIs
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

ตัวอย่าง:
```
https://abcdefghijk.supabase.co/auth/v1/callback
```

**หา Project Ref:**
- ไปที่ Supabase Dashboard → Settings → API
- ดูที่ Project URL: `https://<project-ref>.supabase.co`

#### C. คัดลอก Credentials
- **Client ID**: เลขยาวๆ ลงท้ายด้วย `.apps.googleusercontent.com`
- **Client Secret**: รหัสลับ

#### D. เพิ่มใน Supabase Dashboard
1. กลับไปที่ Supabase Dashboard
2. **Authentication** → **Providers** → **Google**
3. เปิด **Enable Sign in with Google**
4. วาง **Client ID** และ **Client Secret**
5. คลิก **Save**

---

### 3️⃣ Setup GitHub OAuth

#### A. สร้าง GitHub OAuth App
1. เข้า [GitHub Settings](https://github.com/settings/developers)
2. ไปที่ **Developer settings** → **OAuth Apps**
3. คลิก **New OAuth App**

#### B. กรอกข้อมูล
```
Application name: Your App Name
Homepage URL: https://your-domain.com
Authorization callback URL: https://<your-project-ref>.supabase.co/auth/v1/callback
```

#### C. คัดลอก Credentials
- **Client ID**: รหัส GitHub Client
- **Client Secret**: สร้างใหม่ และคัดลอก (แสดงครั้งเดียว!)

#### D. เพิ่มใน Supabase Dashboard
1. กลับไปที่ Supabase Dashboard
2. **Authentication** → **Providers** → **GitHub**
3. เปิด **Enable Sign in with GitHub**
4. วาง **Client ID** และ **Client Secret**
5. คลิก **Save**

---

## 🧪 ทดสอบการทำงาน

### ขั้นตอนทดสอบ:
1. ✅ เปิดเว็บของคุณ
2. ✅ คลิกปุ่ม "Login with Google" หรือ "Login with GitHub"
3. ✅ ระบบจะเปิดหน้าต่าง OAuth
4. ✅ เลือกบัญชีที่ต้องการ
5. ✅ ระบบจะ redirect กลับมา
6. ✅ เข้าสู่ระบบอัตโนมัติ

### ตรวจสอบ Console:
```javascript
// ควรเห็นข้อความนี้:
🔄 Auth state changed: SIGNED_IN user@email.com
✅ User signed in
```

---

## 🔧 Troubleshooting

### ❌ ปัญหา: Redirect URI mismatch
**สาเหตุ:** Redirect URL ไม่ตรงกับที่ตั้งค่าใน OAuth Provider

**วิธีแก้:**
1. ตรวจสอบ Redirect URL ใน Google/GitHub Console
2. ต้องเป็น: `https://<project-ref>.supabase.co/auth/v1/callback`
3. ห้ามมี trailing slash `/`

### ❌ ปัญหา: PKCE flow error
**สาเหตุ:** Supabase ใช้ PKCE flow สำหรับ OAuth

**วิธีแก้:** โค้ดใหม่ใช้ `flowType: 'pkce'` อยู่แล้ว

### ❌ ปัญหา: Session not restored after redirect
**สาเหตุ:** ไม่มี callback handler

**วิธีแก้:** โค้ดใหม่มี `handleOAuthCallback()` แล้ว

### ❌ ปัญหา: Error "Invalid redirect URL"
**สาเหตุ:** Redirect URL ไม่ได้อยู่ใน whitelist

**วิธีแก้:**
1. ไปที่ Supabase Dashboard → Authentication → URL Configuration
2. เพิ่ม URL ของคุณใน "Redirect URLs"

---

## 📱 PWA Offline Support

OAuth login ต้องการ internet connection เสมอ เพราะต้อง:
1. เชื่อมต่อกับ OAuth Provider (Google/GitHub)
2. รับ token จาก Supabase
3. บันทึก session

แต่หลังจาก login แล้ว:
- ✅ Session จะถูกเก็บใน localStorage
- ✅ สามารถใช้งาน offline ได้ (read cache data)
- ✅ Auto restore session เมื่อเปิดเว็บใหม่

---

## 🔒 Security Best Practices

1. **ห้าม** เปิดเผย Client Secret ใน frontend code
   - เก็บไว้ใน Supabase Dashboard เท่านั้น

2. **ใช้ HTTPS** ใน production เสมอ
   - OAuth providers บังคับใช้ HTTPS

3. **Validate redirect URL**
   - ตั้งค่า whitelist ใน Supabase Dashboard

4. **Token refresh** เกิดอัตโนมัติ
   - Supabase จัดการ token refresh ให้เอง

---

## 📚 เอกสารเพิ่มเติม

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

✅ **OAuth Setup Complete!** พร้อมใช้งานได้แล้ว 🎉
