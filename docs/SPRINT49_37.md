# Sprint 49.37 — Product deep links và Firebase Admin session

## Lỗi đã sửa

- “Xem trên cửa hàng” mở tab mới rồi chuyển sang `/404` vì Product Page kiểm tra catalog local trước khi lần đọc Firebase hoàn tất.
- Admin thỉnh thoảng bị đưa về trang đăng nhập khi lần đọc `adminMembers` gặp lỗi mạng/quyền tạm thời.
- Callback xác thực bất đồng bộ cũ có thể hoàn tất muộn và ghi đè trạng thái mới.

## Cách xử lý

- Product Page dùng trạng thái tải catalog, chỉ trả `/404` sau khi nguồn Firebase đã hoàn tất.
- Route sản phẩm tìm theo handle chuẩn hóa và tương thích thêm ID/SKU.
- Handle nhập từ CSV được chuẩn hóa khi chuyển thành product canonical.
- Firebase Auth chờ `authStateReady()` sau khi thiết lập `browserLocalPersistence`.
- Session Admin đã xác minh được cache theo tab; cache bị xóa khi Firebase xác nhận đăng xuất hoặc người dùng bấm đăng xuất.
- Đọc quyền lỗi tạm thời được retry theo backoff; không gọi `signOut()` chỉ vì lỗi đọc tạm thời.
- Mỗi lần Auth thay đổi có revision token để kết quả cũ không ghi đè phiên mới.

## Kiểm tra

- `npm run typecheck`
- `npm run responsive:check`
- `npm run css:audit`
- `npm run code:audit`
- `npm run build`

