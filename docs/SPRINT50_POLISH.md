# Luxury Timeforge V50

## Giao diện khách

- Thêm lớp thiết kế vang đỏ, vàng champagne và nền kem, lấy cảm hứng từ các cửa hàng đồng hồ cao cấp.
- Thiết kế lại logo và favicon theo monogram TF tối giản.
- Chuẩn hóa khoảng cách, typography, card sản phẩm, header, hero, footer và trạng thái focus.
- Responsive riêng cho desktop, tablet và mobile; lưới sản phẩm giữ hai cột trên điện thoại phù hợp.
- Trang Tạp chí và bài viết dùng màu chữ/nền tường minh để tránh xung đột contrast.

## Admin và trình tùy chỉnh

- Chuẩn hóa cỡ chữ, chiều cao input, card, bảng, topbar và navigation Admin.
- Nâng cấp trình tùy chỉnh với:
  - kiểm tra tỷ lệ tương phản WCAG AA;
  - bật/tắt khung section trong preview;
  - thêm mức zoom 56%, 68%, 84%, 100% và 115%;
  - trạng thái autosave trực quan;
  - hủy toàn bộ thay đổi chưa lưu;
  - autosave cả theme và cấu hình mở rộng.

## Hiệu năng

- Storefront không còn nạp gói CSS legacy khoảng 236 KB ở entry khách.
- Ảnh thẻ Tạp chí trang chủ dùng `SmartImage`, kích thước nội tại và lazy loading.
- Giữ route splitting hiện có cho Admin, Analytics, Theme Editor và các module nặng.

## Kiểm thử

- TypeScript type-check: đạt.
- Vite production build: đạt.
- Responsive grid check: đạt.
- Admin CSS order check: đạt.
- Content pages check: đạt.
- Dead-code reachability check: đạt.
