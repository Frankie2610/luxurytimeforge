# Luxury Timeforge Sprint 49.24

Phiên bản: `0.49.24-alpha.1`

## Storefront

- Product card nhỏ gọn hơn trên mọi breakpoint; thương hiệu, tên và giá được căn giữa.
- Giá bán khi có khuyến mãi dùng màu đỏ và lớn hơn giá gốc.
- Trang bộ sưu tập có banner editorial và toolbar tối giản với namespace `tf4924` hoàn toàn mới.
- Timeline giao hàng được dựng lại theo bố cục ngang: icon lớn, typography nhỏ, co giãn an toàn đến màn hình 360 px.
- Grid sản phẩm giữ hai cột trên mobile để card không bị phóng quá lớn.

## Admin và Theme Editor

- `/admin/online-store` là scroll container độc lập trong layout full-bleed.
- Theme Editor chỉ còn một stylesheet thống nhất, không nối các lớp override theo sprint.
- Desktop dùng tree + inspector hai cột; từ 1024 px trở xuống sidebar chuyển thành drawer.
- Autosave chỉ chạy khi theme thực sự dirty, debounce 900 ms và dùng ref ổn định cho hàm lưu.

## Email mời quản trị

- Continue URL lấy từ `window.location.origin` tại thời điểm gửi, tránh dùng nhầm localhost/domain cũ trong biến môi trường.
- Form hiển thị hostname đang dùng để đối chiếu với Firebase Authentication → Authorized domains.
- Firebase Authentication chỉ xác nhận nhận yêu cầu gửi, không cung cấp biên nhận vào Inbox; link sao chép vẫn là phương án dự phòng có chủ đích.

## Hiệu năng

- Product card ngoài viewport dùng `content-visibility: auto` khi trình duyệt hỗ trợ.
- Hai iframe preview ở trang tổng quan Online Store dùng lazy loading.
- Autosave không còn phát sinh ghi Realtime Database chỉ vì provider render lại.

## Kiểm tra

```powershell
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run audit:project
corepack.cmd pnpm run build
```

Sau khi cấu hình `.env.local`, kiểm tra Firebase Rules:

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm run firebase:rules:check
corepack.cmd pnpm run firebase:rules:deploy
```
