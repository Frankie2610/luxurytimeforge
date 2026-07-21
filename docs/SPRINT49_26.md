# Sprint 49.26 — CDN, Firebase CSV và responsive commerce

## Storefront

- Thay mới component mã giảm giá bằng namespace `tf4926-coupon`; xóa selector coupon cũ để tránh `tf-button--secondary` làm chữ đen trên nền đen.
- Dàn lại COD, BANK và SECURE thành ba reassurance card có badge riêng, thu gọn trên mobile và chuyển nút áp dụng thành full-width ở màn hình 360 px.
- Giữ các chunk storefront/admin tách theo route; xóa preconnect và mã upload của nhà cung cấp ảnh cũ.

## Ảnh CDN

- Product Editor nhận một hoặc nhiều URL CDN, ngăn URL không phải HTTP/HTTPS, loại trùng và giữ ảnh đầu tiên làm ảnh đại diện.
- Collection, Blog và Theme Editor đều dùng trường URL CDN kèm preview lazy-load.
- URL được lưu nguyên trạng để tương thích với mọi CDN; format/quality/resize nên được cấu hình tại CDN đang sử dụng.

## Import CSV → Firebase

- Khi badge admin hiển thị **Đã kết nối**, import chỉ báo thành công sau khi Realtime Database xác nhận ghi dữ liệu.
- Chế độ **Thay toàn bộ catalog** ghi record `timeforge/products` theo SKU.
- Chế độ **Cập nhật và giữ dữ liệu hiện có** dùng multi-path update, chỉ ghi SKU thay đổi để giảm payload.
- URL từ `Image Src`, `Image URL`, `Variant Image` và các cột ảnh được lưu trong `images` của sản phẩm.
- Khi admin đang ở **Dữ liệu local**, import vẫn hoạt động nhưng chỉ lưu localStorage và thông báo ghi rõ chế độ local.

## Email mời quản trị

- `auth/quota-exceeded` là giới hạn gửi của Firebase Authentication, không phải lỗi mất lời mời.
- Admin giữ record pending, hiển thị cảnh báo quota và cho sao chép link dự phòng.
- Có thể chờ quota làm mới hoặc nâng gói Firebase; không nên bấm gửi lại liên tục khi quota đã hết.

## Theme Editor và mobile

- Inspector giảm font label/control, chiều cao select/input, spacing của switch và khu vực Blocks.
- Coupon và payment cards có breakpoint 680 px và 360 px, không dùng selector legacy.

## Xác minh

- `tsc -b --pretty false`: đạt.
- `vite build`: đạt, 3.802 module được transform.
- CSS audit và dead-code audit: chạy thành công, không có module orphan.
