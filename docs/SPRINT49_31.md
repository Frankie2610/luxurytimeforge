# Sprint 49.31 — Chunked Firebase CSV import

## Thay đổi

- Chia multi-location update thành các lô tối đa 100 đường dẫn.
- Mỗi lô được Firebase xác nhận trước khi chuyển sang lô tiếp theo.
- Nếu Firebase từ chối, lỗi có số lô cùng đường dẫn SKU đầu và cuối để khoanh vùng.
- Sản phẩm thiếu URL ảnh được bỏ qua trước khi tạo payload.
- Key raw không hợp lệ vẫn được loại lúc đọc CSV và trước lúc ghi Firebase.

## Kiểm thử adidas.csv

- Parser nhận 2.534 sản phẩm có SKU hợp lệ.
- 58 sản phẩm không có URL ảnh được bỏ qua.
- 2.476 sản phẩm sẵn sàng ghi Firebase.
- Payload được chia thành 25 lô, tối đa 100 sản phẩm mỗi lô.

Chế độ merge có thể chạy lại an toàn nếu kết nối bị gián đoạn giữa các lô.
