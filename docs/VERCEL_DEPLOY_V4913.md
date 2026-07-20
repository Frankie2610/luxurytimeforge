# Deploy Vercel — Sprint 49.13

## 1. Kiểm tra local

```powershell
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run build
corepack.cmd pnpm run preview
```

Mặc định Vite build vào:

```text
dist
```

## 2. Đẩy source lên Git

Không commit các file sau:

```text
.env.local
node_modules
dist nếu không muốn lưu build artifact
```

`.env.example` được giữ lại để mô tả biến cần cấu hình.

## 3. Import vào Vercel

Trong Vercel:

1. Chọn **Add New → Project**.
2. Import repository.
3. Framework Preset: **Vite**.
4. Install Command:

```text
pnpm install --frozen-lockfile
```

5. Build Command:

```text
pnpm run build
```

6. Output Directory:

```text
dist
```

`vercel.json` đã có rewrite để các route React như `/products/...`, `/cart`, `/checkout`, `/admin/...` mở trực tiếp hoặc refresh mà không bị 404.

## 4. Khai báo Environment Variables

Vào **Project Settings → Environment Variables** và thêm toàn bộ biến đang dùng trong `.env.example`:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_OWNER_EMAIL
VITE_ADMIN_EMAILS
VITE_ADMIN_ROLE_MAP
```

Nếu dùng Cloudinary:

```text
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

Nên bật biến cho ít nhất:

- Production.
- Preview nếu cần test branch/deployment preview.

Sau khi thêm hoặc thay đổi biến môi trường, tạo một deployment mới để Vite đóng gói giá trị mới.

## 5. Firebase Authentication domain

Trong Firebase Console → Authentication → Settings → Authorized domains:

- Thêm domain Vercel production của dự án.
- Thêm custom domain sau khi kết nối domain riêng.

Nếu không thêm domain, đăng nhập Firebase trên Vercel có thể bị từ chối.

## 6. Deploy bằng Vercel CLI (tùy chọn)

```powershell
corepack.cmd pnpm dlx vercel login
corepack.cmd pnpm dlx vercel
corepack.cmd pnpm dlx vercel --prod
```

Lần đầu CLI sẽ hỏi liên kết project và thư mục output.

## 7. Checklist sau deploy

- [ ] Trang chủ mở bình thường.
- [ ] Refresh trực tiếp trang sản phẩm không 404.
- [ ] `/cart` và `/checkout` hoạt động.
- [ ] Admin đăng nhập được.
- [ ] Storefront đọc catalog từ Firebase.
- [ ] Import CSV tạo node theo SKU.
- [ ] Ảnh URL từ CSV hiển thị.
- [ ] Tạo/sửa/xóa sản phẩm chỉ thay đổi node SKU tương ứng.
- [ ] Firebase Rules đã deploy.
- [ ] Domain Vercel nằm trong Firebase Authorized domains.

## Firebase Authentication trên Vercel (v49.14)

1. Thêm `VITE_OWNER_EMAIL`, `VITE_ADMIN_EMAILS`, `VITE_ADMIN_ROLE_MAP` và giữ `VITE_ENABLE_DEMO_LOGIN=false` trong Vercel Environment Variables.
2. Firebase Console → Authentication → Sign-in method: bật Google và Email/Password.
3. Firebase Console → Authentication → Settings → Authorized domains: thêm domain Vercel production, domain preview cần dùng và domain riêng.
4. Sau khi đổi biến môi trường, redeploy Vercel.
5. Trước khi deploy Database Rules, tạo `.env.local` và chạy `pnpm run firebase:rules:generate`.

Chi tiết: `docs/FIREBASE_AUTH_V4914.md`.
