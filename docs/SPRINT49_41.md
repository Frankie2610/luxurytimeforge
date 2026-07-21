# Sprint 49.41 — Editable About page and non-blocking Theme Editor

## Trang Giới thiệu

- Bổ sung `about` vào `ManagedContentPageSlug` và dữ liệu mặc định.
- Admin `/admin/pages` mở mặc định tab Giới thiệu, quản lý nhãn, tiêu đề, mô tả, trạng thái xuất bản và danh sách mục nội dung.
- Dữ liệu được lưu tại `timeforge/contentPages/about`; localStorage chỉ đóng vai trò cache/fallback.
- Storefront `/pages/about` render trực tiếp nội dung đã quản lý.
- Layout storefront sử dụng namespace `tf4941-about-*`, tách khỏi cascade `v18-story-*` cũ.

## Theme Editor

- Giữ nguyên Admin shell khi đổi sang `?view=editor`; editor hiển thị dưới dạng overlay fixed toàn viewport.
- Thêm launch frame trong hai animation frame để trình duyệt kịp paint phản hồi trước khi mount cây editor lớn.
- Memo hóa phép so sánh draft/baseline, tránh stringify theme lặp lại ở các render không liên quan.
- Preview trên trang tổng quan Cửa hàng online có cờ iframe editor nên không khởi tạo Admin Auth observer hoặc ghi analytics.

## UI và responsive

- Polish overview, danh sách trang và editor form trên Admin.
- Tablet hiển thị bốn trang trên một hàng; tablet hẹp chuyển hai cột; mobile chuyển một cột.
- Trang Giới thiệu cân lại hero, typography, nhịp nội dung và CTA cho desktop/tablet/mobile.
- Navigation chính sách trên mobile chuyển thành lưới hai cột để chứa đủ bốn trang.

## Kiểm tra

- Content/editor regression: 6/6 đạt.
- Auth iframe regression: 6/6 đạt.
- Admin CSS cascade: đạt.
- Responsive product grid: đạt.
- TypeScript: đạt.
- Dead-code audit: 0 orphan modules.
- Vite production build: đạt, 3.798 modules transformed.
