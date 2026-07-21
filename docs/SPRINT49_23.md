# Luxury Timeforge Sprint 49.23

## Trang Bảo hành, Giao hàng và Đổi trả

- Thêm route `/admin/pages` và quyền `content.manage`.
- Cho phép sửa nhãn mở đầu, tiêu đề, mô tả, trạng thái hiển thị và các mục nội dung có thể thêm, xóa hoặc đổi thứ tự.
- Dữ liệu lưu tại `timeforge/contentPages/{warranty|shipping|returns}` và có bản local dự phòng.
- Storefront dùng layout editorial mới, có điều hướng giữa ba chính sách, CTA hỗ trợ và breakpoint riêng cho tablet/mobile.
- Trên màn hình nhỏ, các pill được thu gọn, tự xuống dòng; menu trang chuyển thành lưới 2–3 cột để không tràn ngang.

## Admin Journal và Mã giảm giá

- Journal admin dùng namespace `.tf4923-*`, không tái sử dụng các class cũ từng bị `!important` đè.
- Toolbar, bảng bài viết, modal biên tập và trạng thái responsive được làm lại.
- Mã giảm giá có overview, số liệu hiệu lực/lượt dùng, saved views, search, danh sách responsive và modal mới.
- Các vùng mới nằm trong `src/v4923-admin-content.css` để cô lập khỏi legacy cascade.

## Theme customizer

- `firebaseSafeValue()` lọc `undefined` đệ quy trước mọi lệnh `set`/`update` của Realtime Database.
- Thuộc tính object có giá trị `undefined` bị loại bỏ; vị trí `undefined` trong mảng thành `null` để giữ chỉ số ổn định.
- Block theme chỉ tạo `children` khi thực sự có dữ liệu, kể cả lúc normalize và duplicate.

Lỗi cũ sau đây không còn được gửi tới Firebase:

```text
set failed: value argument contains undefined in property 'timeforge.themes.draft.templates.home.sections.0.blocks.0.children'
```

## Email mời quản trị

- Giao diện chỉ báo Firebase đã nhận yêu cầu gửi, không khẳng định email đã tới Inbox.
- Nhắc kiểm tra Spam và tab Quảng cáo.
- Link sao chép dự phòng hoạt động cả khi người nhận chưa đăng nhập: hệ thống yêu cầu đúng email rồi gửi một Email Link xác thực mới.
- Trang chấp nhận lời mời hỗ trợ cả Email Link của Firebase và link lời mời thông thường.

Để email thực sự được gửi, Firebase Console cần bật `Email/Password` và `Email link (passwordless sign-in)`, đồng thời thêm domain local/production vào Authentication → Settings → Authorized domains.

## Firebase Rules

Template đã thêm quyền đọc công khai và quyền ghi `content.manage` cho `contentPages`. Sau khi cấu hình `.env.local`, cần tạo lại và deploy rules:

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm run firebase:rules:check
corepack.cmd pnpm run firebase:rules:deploy
```

Không deploy trực tiếp bản `firebase.rules.json` deny-by-default được đóng gói sẵn; file đó phải được generate theo `VITE_OWNER_EMAIL` trước.

## Hiệu năng và storefront

- Giữ code splitting theo route và CSS splitting production.
- Ảnh nội dung ngoài màn hình dùng lazy loading/async decoding.
- Các section thấp hơn fold dùng `content-visibility` với intrinsic size để giảm công việc render ban đầu.
- Giữ `prefers-reduced-motion` cho người dùng giảm chuyển động.
- Build target được chuẩn hóa ở ES2022.

## Kiểm tra

```powershell
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run build
corepack.cmd pnpm run css:audit
corepack.cmd pnpm run code:audit
```

Vòng visual QA tự động cần một preview URL truy cập được từ trình duyệt kiểm thử. Nếu chỉ chạy trong workspace local bị chặn mạng, hãy kiểm tra thủ công các route sau sau khi giải nén:

- `/pages/warranty`, `/pages/shipping`, `/pages/returns` ở desktop và mobile.
- `/admin/pages` với tài khoản có `content.manage`.
- `/admin/blogs`, `/admin/discounts` ở 1440 px, 768 px và 390 px.
- `/admin/online-store` khi thêm, duplicate, sắp xếp và lưu block group/non-group.
