# Luxury Timeforge Sprint 49.25

Phiên bản: `0.49.25-alpha.1`

## Storefront

- Polish toolbar bộ sưu tập thành một control rail có phân cấp rõ giữa lọc, số kết quả và sắp xếp.
- Modal lọc dùng namespace `tf4925`, drawer desktop và bottom sheet mobile, không nhận CSS modal lọc cũ.
- Tăng diện tích ảnh trong product card và giảm nguồn ảnh tối ưu từ 900 xuống 720 px.
- Polish giỏ hàng, checkout và order summary; tăng độ đọc của typography mobile, giữ bố cục an toàn đến 360 px.
- Chỉ eager-load hai ảnh đầu trong giỏ hàng để giảm tranh chấp băng thông.

## Admin và Theme Editor

- Search của Orders, Customers và Inventory dùng class `tf4925-admin-search` độc lập; Returns có rule cô lập tương ứng.
- Toolbar tìm kiếm chuyển một cột trên mobile để input và action không đè nhau.
- Theme Editor theo mô hình Shopify: sidebar tree/inspector xếp tầng trên desktop vừa, tách hai cột từ 1600 px, drawer dọc trên tablet/mobile.
- Giảm tỷ lệ typography và độ rộng sidebar để tăng diện tích preview.

## Email mời quản trị

- Hỗ trợ biến tùy chọn `VITE_FIREBASE_AUTH_LINK_DOMAIN` cho custom Firebase Hosting link domain.
- Sau khi API thành công, UI ghi rõ Firebase chỉ mới tiếp nhận yêu cầu và cung cấp nút sao chép link ngay.
- Bổ sung hướng dẫn quota Gmail/Firebase tại `docs/GMAIL_INVITE_DELIVERY_V4925.md`.

## Kiểm tra

```powershell
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run build
```

Lưu ý: Firebase Spark hiện có quota email link sign-in rất thấp. Kiểm tra Authentication Usage trước khi gửi lại nhiều lần.
