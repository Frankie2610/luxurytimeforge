# Firebase email invitation — Sprint 49.21

## Biến môi trường

Thêm origin dùng cho email action link:

```dotenv
# Local
VITE_PUBLIC_SITE_URL=http://localhost:5173

# Production — thay bằng domain thật
# VITE_PUBLIC_SITE_URL=https://timeforge.vn
```

Không thêm dấu `/` ở cuối cũng được; source sẽ tự loại bỏ.

## Firebase Console

### 1. Bật phương thức đăng nhập

Vào:

```text
Firebase Console
→ Authentication
→ Sign-in method
→ Email/Password
```

Bật cả:

```text
Email/Password
Email link (passwordless sign-in)
```

### 2. Authorized domains

Vào:

```text
Firebase Console
→ Authentication
→ Settings
→ Authorized domains
```

Local thêm:

```text
localhost
```

Production thêm domain thực tế, không kèm `https://` và không kèm path:

```text
timeforge.vn
luxury-timeforge.vercel.app
```

### 3. Khởi động lại Vite

Sau khi sửa `.env.local`:

```powershell
Ctrl + C
corepack.cmd pnpm run dev
```

### 4. Vercel

Thêm `VITE_PUBLIC_SITE_URL` và các `VITE_FIREBASE_*` tại Environment Variables rồi tạo deployment mới.

## Lỗi thường gặp

- `auth/operation-not-allowed`: Email Link hoặc Email/Password chưa bật.
- `auth/unauthorized-continue-uri`: domain của `VITE_PUBLIC_SITE_URL` chưa nằm trong Authorized domains.
- `auth/invalid-continue-uri`: URL không hợp lệ hoặc không dùng http/https.
- `auth/quota-exceeded`: vượt hạn mức gửi email.
- `auth/too-many-requests`: Firebase tạm giới hạn do gửi quá nhiều lần.

Dòng `Cross-Origin-Opener-Policy ... window.closed` liên quan tới cửa sổ OAuth/popup; request gửi email thất bại được xác định bởi request `accounts:sendOobCode` và mã lỗi Firebase Auth hiển thị trong giao diện Sprint 49.21.
