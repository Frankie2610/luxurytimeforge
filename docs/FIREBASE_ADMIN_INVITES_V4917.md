# Firebase Admin Invitations — Sprint 49.17

Sprint 49.17 bổ sung luồng mời quản trị viên bằng Firebase Authentication Email Link và Realtime Database.

## Luồng hoạt động

1. Chủ cửa hàng mở `/admin/settings/team`.
2. Nhập họ tên, email và vai trò.
3. Hệ thống tạo lời mời tại `timeforge/adminInvitations/{inviteId}`.
4. Firebase Authentication gửi email đăng nhập một lần.
5. Người nhận mở liên kết `/admin/accept-invite?invite={inviteId}` và nhập đúng email đã nhận thư.
6. Sau khi Firebase xác thực email, lời mời chuyển từ `pending` sang `accepted`.
7. Thành viên được tạo tại `timeforge/adminMembers/{uid}` và có thể vào Admin theo đúng vai trò.

Luồng này không cần service account hoặc Firebase Admin SDK trong frontend. Không đưa private key vào source, GitHub hay Vercel.

## 1. Biến môi trường

Sao chép `.env.example` thành `.env.local` và điền:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_OWNER_EMAIL=owner@example.com
VITE_ADMIN_EMAILS=
VITE_ADMIN_ROLE_MAP=
VITE_ENABLE_DEMO_LOGIN=false
```

`VITE_OWNER_EMAIL` là tài khoản bootstrap duy nhất có quyền quản lý lời mời. Các quản trị viên mới được lưu động trong Realtime Database, không cần thêm vào env.

## 2. Bật phương thức đăng nhập

Trong Firebase Console:

1. Authentication → Sign-in method.
2. Bật Email/Password.
3. Bật Email link (passwordless sign-in).
4. Có thể bật Google nếu vẫn dùng nút đăng nhập Google.
5. Authentication → Settings → Authorized domains: thêm `localhost`, domain Vercel và domain riêng.

## 3. Tạo và deploy Security Rules

Rules trong ZIP mặc định là deny-by-default. Sau khi điền `.env.local`, chạy:

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm dlx firebase-tools use
corepack.cmd pnpm dlx firebase-tools deploy --only database
```

Lệnh generate nhúng email chủ sở hữu vào `firebase.rules.json` và giữ phần kiểm tra role động tại:

```text
timeforge/adminMembers/{uid}
```

Không deploy `firebase.rules.json` trước khi chạy generator với đúng `VITE_OWNER_EMAIL`.

## 4. Gửi lời mời

Đăng nhập bằng tài khoản chủ sở hữu, sau đó mở:

```text
/admin/settings/team
```

Chọn một vai trò:

- Quản trị viên
- Quản lý
- Nhân viên vận hành
- Biên tập nội dung

Lời mời mặc định hết hạn sau 7 ngày. Chủ sở hữu có thể gửi lại, sao chép liên kết hoặc thu hồi lời mời.

## 5. Vercel

Thêm toàn bộ biến `VITE_FIREBASE_*` và `VITE_OWNER_EMAIL` vào:

```text
Vercel → Project → Settings → Environment Variables
```

Áp dụng cho Production và Preview, sau đó tạo deployment mới. Thêm domain deployment vào Firebase Authorized domains.

## 6. Mẫu email

Firebase Console → Authentication → Templates cho phép chỉnh tên người gửi, tiêu đề và nội dung email đăng nhập. Email do Firebase gửi là email xác thực/đăng nhập một lần; trang đích của Luxury Timeforge hiển thị nội dung chấp nhận lời mời và kích hoạt vai trò.

## 7. Kiểm tra tối thiểu

- Chủ sở hữu gửi được lời mời.
- Realtime Database có node `adminInvitations` trạng thái `pending`.
- Người nhận mở email và nhập đúng địa chỉ email.
- Lời mời chuyển thành `accepted`.
- Node `adminMembers/{uid}` được tạo với `status: active`.
- Người nhận đăng nhập lại và chỉ nhìn thấy các trang đúng với vai trò.
- Email khác không thể đọc hoặc chấp nhận lời mời.
