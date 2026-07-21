# Sprint 49.34 — Mobile grid cascade và image performance

## Sửa responsive 380–520 px

- Nguyên nhân thực tế là rule `max-width:430px` trong `@layer legacy` dùng `!important` và ép `v23-columns-*` về một cột.
- Breakpoint legacy đã được chuyển xuống `max-width:379px`.
- Khoảng 380–520 px được khóa hai cột, gap ngang 8 px và vùng kết quả dùng gần hết chiều ngang màn hình.
- Product card, media và grid đều có `min-width:0`/`max-width:100%` để tên hoặc giá dài không làm nở cột.

## Performance ảnh

- Giữ native lazy loading và chỉ tạo ảnh phụ khi hover/focus.
- SmartImage dùng chung một IntersectionObserver thay vì khởi chạy kiểm tra cho mọi card.
- Timeout phát hiện link ảnh lỗi chỉ bắt đầu khi ảnh cách viewport tối đa 800 px.
- `content-visibility:auto` tiếp tục trì hoãn paint/layout cho card ngoài màn hình.

## Kiểm thử

- Kiểm tra source không còn rule legacy một cột ở 430 px.
- TypeScript, CSS audit, dead-code audit và Vite production build.

