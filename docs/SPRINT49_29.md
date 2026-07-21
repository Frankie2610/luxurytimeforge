# Sprint 49.29 — Complete Firebase Rules

## Nguyên nhân batch CSV bị từ chối

Firebase Realtime Database trả về `permission_denied` cho cả lỗi phân quyền lẫn lỗi `.validate`. File `adidas.csv` có 58 sản phẩm có SKU hợp lệ nhưng chưa có URL ảnh. Rules cũ bắt buộc `images` phải tồn tại và có phần tử, nên một sản phẩm không ảnh khiến toàn bộ lệnh update nhiều đường dẫn bị hủy.

## Thay đổi Rules

- Giữ quyền ghi sản phẩm cho `owner`, `admin` và `manager`.
- Giữ kiểm tra `id`, `sku`, `handle`, `title`, `status`, `published`, `price`, `inventory`, `variants`, `createdAt` và `updatedAt`.
- Cho phép node `images` không tồn tại.
- Nếu node `images` tồn tại, nó vẫn phải có ít nhất một phần tử.
- Không mở quyền ghi công khai.

## Tạo và triển khai Rules thật

`firebase.rules.json` trong source mặc định vẫn deny-by-default. Sau khi đặt `.env.local` đúng project, chạy:

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm run firebase:rules:check
corepack.cmd pnpm run firebase:rules:doctor
corepack.cmd pnpm dlx firebase-tools use YOUR_PROJECT_ID
corepack.cmd pnpm run firebase:rules:deploy
```

Sau khi deploy, đăng xuất và đăng nhập lại Admin rồi nhập lại CSV.
