# Luxury Timeforge Sprint 49.21

## Trang khách `/blogs`

- Thanh chủ đề chuyển thành rail button có trạng thái active, tương phản tốt và vuốt ngang trên mobile.
- Featured story dùng panel burgundy đậm, chữ trắng rõ và bố cục gọn hơn.
- Card bài viết desktop/tablet có surface, shadow nhẹ và hệ thống spacing đồng nhất.
- Mobile chuyển card bài viết thành dạng media list ngang 112px, giảm đáng kể chiều cao mỗi card.
- Tên bài, mô tả và CTA được giới hạn dòng để tránh card kéo dài.
- Nội dung bài “Giữ đồng hồ luôn bền đẹp...” luôn nằm trên nền trắng hoặc burgundy đậm, không còn chữ chìm vào ảnh/nền.

## Admin Đơn hàng

- Bỏ phần intro lặp lại tiêu đề page shell.
- Thêm operation banner với tổng đơn, đã thanh toán và chờ xử lý.
- Nút “Tạo đơn nháp” được đặt trong operation banner và responsive về full-width trên mobile.
- Table surface, tabs và toolbar được chuẩn hóa lại theo cùng hệ thống card.

## Admin Hàng tồn kho

- Bỏ phần heading “Tồn kho” lặp với page shell “Hàng tồn kho”.
- Thêm inventory banner, legend Còn hàng / Sắp hết / Hết hàng.
- Làm lại rhythm giữa banner, metrics, table và lịch sử điều chỉnh.
- Responsive riêng cho tablet/mobile.

## Email mời quản trị viên

- Bổ sung `VITE_PUBLIC_SITE_URL` để dùng một origin ổn định cho Firebase email action link.
- Bắt và dịch các lỗi Firebase Auth thường gặp: provider chưa bật, domain chưa được phép, quota, API key, network.
- Lời mời không còn bị xóa khi Firebase gửi email thất bại; trạng thái được giữ lại và hiển thị “Lỗi gửi email”.
- Gửi lại email cập nhật `deliveryStatus`, `deliveryError`, `lastSentAt`.

## Kiểm tra trước deploy

```powershell
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run build
```
