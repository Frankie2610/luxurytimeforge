# Sprint 49.35 — Firebase source-of-truth

## Vấn đề

Loader cũ đọc catalog public và toàn bộ dữ liệu Admin private trong cùng một `Promise.all`. Khi khách chưa đăng nhập, Firebase Rules từ chối một đường dẫn private như `customers`, `orders` hoặc `themes/draft`; toàn bộ promise bị reject trước khi state sản phẩm được cập nhật. Lỗi lại bị nuốt bởi `.catch(() => {})`, nên website tiếp tục hiển thị localStorage hoặc seed dù CSV đã được ghi lên Firebase.

## Thay đổi

- Loader public dùng `Promise.allSettled` cho `products`, `collections`, `discounts` và published theme.
- Kết quả `timeforge/products` luôn thay thế catalog hiện tại, kể cả khi Firebase trả về rỗng.
- Loader private đợi Auth hoàn tất và chỉ chạy cho tài khoản Admin active.
- Một đường dẫn private bị từ chối không còn hủy các đường dẫn private khác.
- Context cung cấp `dataSource` và `dataError`; thanh trạng thái Admin phản ánh lần đọc catalog thực tế thay vì chỉ kiểm tra biến cấu hình.
- Selector global áp `padding-block: var(--tf-r-section)` lên wrapper storefront đã được xóa.

## Cách xác minh sau khi chạy local

1. Mở Admin, đăng nhập và nhập CSV.
2. Hard refresh trang khách hoặc mở cửa sổ ẩn danh.
3. Thanh trạng thái Admin phải hiện `Firebase live` sau khi catalog đọc thành công.
4. Số lượng/SKU trên website khách phải khớp node `timeforge/products` trong Realtime Database.
5. Nếu Rules public read chưa deploy, Admin sẽ hiện fallback và trang Cài đặt hiển thị lỗi đọc Firebase thay vì báo nhầm đã kết nối.

## Kiểm tra kỹ thuật

- `pnpm run build`
- `pnpm run audit:project`
- Kiểm tra selector CSS cũ không còn trong `src` và bundle production.
