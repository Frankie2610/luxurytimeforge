# Sprint 23 — Storefront Template Linkage

## Blog Editor

Modal bài viết dùng Radix Tabs với hai tab:

- **Nội dung:** chỉ hiển thị chữ, phù hợp chỉnh nội dung thông thường.
- **HTML:** chỉnh trực tiếp mã `<p>`, `<h2>`, `<ul>`, `<li>` và các cấu trúc HTML khác.

Nội dung plain text được chuyển về HTML khi chỉnh. Khi chuyển từ HTML về Nội dung, hệ thống tạo bản đọc không có tag.

## Online Store liên kết storefront

Theme Editor lưu đồng thời:

- Theme settings.
- Template sections.
- Nested blocks.
- Countdown.
- Cart drawer.
- Newsletter popup.
- Privacy banner.
- Footer visibility.

Nút Lưu xuất bản theme và phát sự kiện cập nhật để storefront nhận cấu hình mới.

### Product template

Storefront đọc:

- Hiện/ẩn breadcrumb.
- Kích thước gallery.
- Sticky product info.
- Vendor, SKU và stock.
- Giá so sánh và phần trăm giảm.
- Variant picker.
- Quantity.
- Wishlist.
- Buy now.
- Description.
- Trust section.
- Product recommendations, limit và columns.

### Collection template

Storefront đọc:

- Hiện/ẩn banner.
- Banner image và height.
- Hiện/ẩn filters, count và sort.
- Product columns.
- Page size.

### Cart template

Storefront đọc:

- Hiện/ẩn cart section.
- Coupon.
- Shipping progress.
- Trust content.

## Overlay và Footer

- Countdown hiển thị phía trên header.
- Cart drawer có thể tắt; khi tắt, icon giỏ hàng mở trang `/cart`.
- Newsletter popup và privacy banner có renderer storefront.
- Footer có thể ẩn/hiện.

## UI polish

- Breadcrumb dạng pill, dùng Chevron thay dấu `/`.
- Badge giỏ hàng nền burgundy, chữ trắng và kích thước dễ đọc.
- Theme Editor header chia ba vùng ổn định.
- Link mở preview dẫn đúng route template.
