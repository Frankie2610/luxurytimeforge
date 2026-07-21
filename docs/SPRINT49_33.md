# Sprint 49.33 — Collection layout cleanup

## Thay đổi giao diện

- Gỡ dòng trạng thái phụ dưới cụm nút phân trang; giữ điều hướng trước, sau và số trang.
- Thay toolbar `tf4932-*` bằng `tf4933-*` gọn hơn, ít khung và cân lại ba vùng bộ lọc, tổng kết quả, sắp xếp.
- Chuyển banner collection từ `tf4924-*` sang `tf4933-*`, giảm cỡ chữ và khoảng cách dọc trên desktop.
- Newsletter dùng duy nhất `tf4933-newsletter`, không còn cộng dồn `lux-newsletter`, `v26-newsletter` và `v27-newsletter`.
- Giảm padding của vùng kết quả, trạng thái rỗng, phân trang và khoảng cách trước/sau newsletter.

## Responsive

- 380–520 px: luôn hai card sản phẩm mỗi hàng, kể cả khi cấu hình theme đang chọn số cột khác.
- Dưới 380 px: một card mỗi hàng.
- Toolbar tự thu gọn nhãn phụ, icon và tổng kết quả trên mobile.
- Newsletter chuyển một cột từ 680 px và giữ form email vừa màn hình.

## Kiểm thử

- TypeScript build.
- CSS audit.
- Dead-code audit.
- Vite production build.

