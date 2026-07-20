# Sprint 31

## Storefront typography

- Dùng system font hiện đại, ưu tiên Segoe UI Variable trên Windows.
- Tăng body weight và heading weight theo một thang thống nhất.
- Giảm tình trạng chữ mỏng, đậm nhạt không đều giữa các section.

## Product Detail

- Buy panel tăng padding theo breakpoint.
- Giá, giá so sánh, badge giảm giá, lợi ích mua hàng và CTA được phân cấp lại.
- Mô tả vẫn giữ bố cục editorial, không dùng bảng.
- Khi hết hàng, số lượng về trạng thái vô hiệu hóa và cả hai CTA mua hàng đều bị khóa.

## Homepage section heading

- Các section Selection, Best Sellers, Journal và Related Products dùng chung một layout heading mới.
- Heading nhỏ gọn hơn, có đường phân cách và điểm nhấn accent.
- Link “Xem tất cả” trở thành action dạng editorial thay vì button bo tròn.

## Checkout imagery

- Ảnh checkout lấy từ `product.images` trước.
- Nếu thiếu, hệ thống đọc `Image Src`, `Variant Image`, `Image URL`, `image` hoặc `secure_url` trong dữ liệu Shopify gốc.
- Nếu URL lỗi, `SmartImage` tự chuyển sang SVG fallback nội bộ.
- Ảnh được ép hiển thị trên skeleton để tránh tình trạng khung ảnh trống.

## Inventory safety

- `addToCart` từ chối sản phẩm hết hàng.
- Số lượng thêm và cập nhật được giới hạn theo tồn kho của variant.
- Variant hết hàng không thể đi qua luồng Mua ngay.
