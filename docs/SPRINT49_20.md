# Sprint 49.20 — Mobile PDP, checkout sheet, admin boot and Rules diagnostics

## Storefront mobile

- Breadcrumb sản phẩm luôn nằm trên một dòng, tên sản phẩm dài được ellipsis.
- Thanh chủ đề Journal dùng horizontal scroll nhỏ gọn trên tablet/mobile.
- Thu nhỏ heading `DỊCH VỤ TIMEFORGE` và `GỢI Ý PHÙ HỢP` trên điện thoại.
- Giảm khoảng trống giữa chi tiết sản phẩm, dịch vụ và sản phẩm liên quan.
- Thêm `content-visibility` cho các section nặng ở dưới màn hình.
- Preconnect Cloudinary để rút ngắn thời gian bắt đầu tải ảnh.

## Checkout mobile

- `Tóm tắt đơn hàng` mở thành bottom sheet cố định thay vì xuất hiện ở cuối biểu mẫu.
- Có backdrop, nút đóng, khóa scroll và hỗ trợ phím Escape.
- Bottom sheet giới hạn chiều cao và tự cuộn nội dung.

## Admin loading

- Route Admin và bước xác thực dùng cùng skeleton shell.
- Không còn nhá logo Luxury Timeforge kích thước lớn trước loader.

## Firebase Rules

- Thông báo `permission denied` nêu rõ operation và path bị từ chối.
- Generator dừng nếu rules vẫn chứa deny bootstrap.
- Thêm `pnpm run firebase:rules:check` trước khi deploy.
