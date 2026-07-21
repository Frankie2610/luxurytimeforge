# Sprint 49.30 — Two-layer CSV sanitization

## Sửa lỗi

CSV Shopify có các header như `Google Shopping / Google Product Category` và metafield chứa `.`, `/`, `[` hoặc `]`. Firebase Realtime Database không cho phép những ký tự này trong object key.

Sprint 49.30 xử lý ở hai lớp:

1. Khi đọc CSV, `rawShopify` chỉ nhận các header hợp lệ với Firebase.
2. Trước mọi lệnh `set` hoặc `update`, payload tiếp tục được làm sạch đệ quy.

Các cột chuẩn được ánh xạ sang model sản phẩm trước khi raw data bị lọc, nên tên, SKU, giá, tồn kho, mô tả, biến thể và URL ảnh CDN vẫn được giữ.

## Kiểm thử adidas.csv

- SKU kiểm tra: `AOFH23001`.
- Key raw không hợp lệ trước làm sạch: 70.
- Key raw không hợp lệ sau làm sạch: 0.
- `Google Shopping / Google Product Category` không còn trong `rawShopify`.
- URL ảnh Shopify CDN của sản phẩm vẫn giữ nguyên.

Nếu giao diện vẫn hiện lỗi key cũ sau khi dùng bản này, trình duyệt hoặc tiến trình Vite vẫn đang chạy bundle cũ. Dừng server cũ và chạy `corepack.cmd pnpm run dev -- --force` trong đúng thư mục Sprint 49.30.
