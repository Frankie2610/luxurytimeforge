# Sprint 49.28 — Firebase-safe CSV import

## Thay đổi

- Thêm bộ làm sạch payload dùng chung trước mọi thao tác ghi Firebase Realtime Database.
- Tự động bỏ qua object key rỗng hoặc chứa ký tự Firebase cấm: `.`, `#`, `$`, `/`, `[` và `]`.
- Chỉ bỏ thuộc tính raw không hợp lệ; các trường đã chuẩn hóa như SKU, tên, giá, hình ảnh, biến thể và tồn kho vẫn được nhập.
- Giữ nguyên giá trị chuỗi, bao gồm toàn bộ URL ảnh CDN và query string của URL.
- Màn hình import báo trước số header raw sẽ bị bỏ qua.

## Kiểm thử với adidas.csv

- 113 header được đọc.
- 70 header raw có tên không tương thích Firebase được nhận diện và bỏ qua khi ghi.
- 2.554 sản phẩm được nhận diện theo handle.
- 13.651 URL ảnh trong `Image Src` và `Variant Image` được giữ nguyên.
- Không phát hiện URL ảnh sai định dạng.

Người quản trị có thể nhập trực tiếp file CSV hiện tại, không cần xóa thủ công các cột Google Shopping hoặc metafield.

## Nguyên tắc an toàn dữ liệu

Bộ lọc chạy tại lớp ghi Firebase nên bảo vệ cả import CSV lẫn các payload khác. Array vẫn giữ nguyên vị trí; giá trị `undefined` trong array được chuyển thành `null`, còn thuộc tính `undefined` trong object được bỏ qua.
