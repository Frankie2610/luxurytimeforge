# Sprint 49.39 — Admin UI polish

## Mục tiêu

Làm giao diện Admin gọn và nhất quán hơn mà không thêm một lớp CSS route mới hoặc làm thay đổi thứ tự cascade đã cố định ở Sprint 49.38.

## Thay đổi

- Tinh chỉnh token nền, border, radius và shadow trong shell Admin.
- Giảm sidebar còn 244 px và topbar còn 60 px trên desktop.
- Giảm khoảng trắng của page header, tăng chiều rộng nội dung hữu dụng và cân lại typography.
- Chuẩn hóa input, select, textarea, button, bảng và trạng thái keyboard focus.
- Tách selector input văn bản khỏi checkbox/radio để tránh layout form bị kéo cao.
- Polish dashboard với hero tối, KPI card gọn, danh sách đơn hàng và hoạt động rõ cấp bậc.
- Thêm breakpoint dashboard cho desktop, tablet, mobile và màn hình rất nhỏ.
- Giới hạn sticky table header vào đúng các table shell, không ảnh hưởng bảng trong rich-content editor.
- Hỗ trợ `prefers-reduced-motion`.

## Kiểm tra

- `pnpm run admin:css:check`
- `pnpm run typecheck`
- `pnpm run audit:project`
- `pnpm run responsive:check`
- `pnpm run build`

Tất cả kiểm tra đều đạt; production vẫn chỉ có một chunk CSS Admin.
