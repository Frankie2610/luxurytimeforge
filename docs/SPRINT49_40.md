# Sprint 49.40 — Stable Theme Editor session and UI polish

## Mục tiêu

Ngăn “Mở trình tùy chỉnh” làm phiên Admin bị đưa về màn hình đăng nhập, đồng thời giảm công việc nền của live preview và polish giao diện mà vẫn giữ một cascade CSS Admin cố định.

## Sửa phiên đăng nhập

- Nhận diện iframe storefront của Theme Editor bằng đồng thời `theme_preview=1`, `tf_editor=1` và trạng thái đang nằm trong iframe.
- Không khởi tạo Firebase Auth observer, không đọc session cache và không bật auth loading trong iframe này.
- Xóa hành vi tự `signOut` khỏi observer nền. Nếu việc đọc quyền thất bại tạm thời, Admin giữ phiên Firebase và dùng session đã xác minh trong tab.
- Hai lệnh `signOut` còn lại chỉ phục vụ đăng nhập tài khoản không có quyền và thao tác đăng xuất chủ động.
- Thêm `scripts/check-auth-session.mjs` để khóa các điều kiện trên bằng regression check.

## Performance

- Iframe preview không ghi `page_view`, `product_view`, attribution hoặc analytics session giả vào storage.
- Cập nhật local preview dùng deferred state; autosave draft Firebase được debounce 1,6 giây.
- Product card ngoài viewport dùng `content-visibility: auto` và intrinsic size để giảm chi phí render collection dài.

## UI polish

- Theme Editor có sidebar gọn hơn, inspector rõ hơn, preview toolbar và focus state nhất quán.
- Admin giảm chiều cao topbar/page header, input và hàng bảng để tăng diện tích nội dung.
- Header storefront gọn hơn; trạng thái hover/active/focus rõ và không làm tăng layout shift.

## Kiểm tra

- `node scripts/check-auth-session.mjs`: đạt 6/6.
- `node scripts/check-admin-css.mjs`: đạt.
- TypeScript project build: đạt.
- Vite production build: đạt, 3.798 modules transformed.
- Dead-code audit: không có orphan module.
