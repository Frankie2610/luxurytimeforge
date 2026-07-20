# Firebase Authentication — Luxury Timeforge v49.14

## Luồng đã tích hợp

- `/admin/login` dùng Firebase Authentication.
- Đăng nhập bằng Google hoặc Email/Mật khẩu.
- Firebase duy trì phiên đăng nhập trên thiết bị bằng `browserLocalPersistence`.
- `/admin/**` được bảo vệ bởi route guard.
- Email ngoài allowlist bị đăng xuất ngay.
- Có luồng gửi email đặt lại mật khẩu.
- Nút Đăng xuất nằm trong menu tài khoản Admin.
- Demo login chỉ hoạt động khi `VITE_ENABLE_DEMO_LOGIN=true`; không bật trên Vercel production.

## Không gửi service account key

Firebase Web App config (`apiKey`, `authDomain`, `projectId`, `appId`, `databaseURL`) là cấu hình client. Tuy nhiên, tuyệt đối không đưa các loại sau vào source hoặc chat:

- service-account JSON;
- private key;
- Firebase Admin SDK credential;
- token truy cập CLI.

## 1. Bật phương thức đăng nhập

Firebase Console → Authentication → Sign-in method:

1. Bật **Google**.
2. Bật **Email/Password**.
3. Authentication → Users → Add user để tạo tài khoản email/mật khẩu quản trị, hoặc đăng nhập Google bằng email đã khai báo.

## 2. Authorized domains

Firebase Console → Authentication → Settings → Authorized domains, thêm:

- `localhost` cho local;
- domain Vercel production;
- domain Vercel preview cần dùng;
- domain riêng sau khi kết nối.

## 3. Biến môi trường

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_OWNER_EMAIL=owner@luxurytimeforge.vn
VITE_ADMIN_EMAILS=admin1@luxurytimeforge.vn,admin2@luxurytimeforge.vn
VITE_ADMIN_ROLE_MAP=owner@luxurytimeforge.vn:owner,admin1@luxurytimeforge.vn:admin
VITE_ENABLE_DEMO_LOGIN=false
```

`VITE_OWNER_EMAIL`, `VITE_ADMIN_EMAILS` và email trong `VITE_ADMIN_ROLE_MAP` cùng tạo allowlist đăng nhập.

## 4. Sinh và deploy Security Rules

Rules trong repository mặc định **từ chối mọi ghi dữ liệu** cho tới khi được sinh từ allowlist:

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm dlx firebase-tools login
corepack.cmd pnpm dlx firebase-tools use --add
corepack.cmd pnpm dlx firebase-tools deploy --only database
```

Script đưa email allowlist vào điều kiện `auth.token.email` của Realtime Database Rules. Client-side route guard chỉ bảo vệ giao diện; Security Rules mới là lớp bảo vệ dữ liệu thật.

## 5. Vercel

Thêm cùng bộ biến vào Project Settings → Environment Variables cho Production/Preview. Sau khi sửa biến, redeploy dự án.

Không bật `VITE_ENABLE_DEMO_LOGIN` trên Vercel.
