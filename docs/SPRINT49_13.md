# Sprint 49.13 — CSS Route Split + Firebase SKU Catalog

## Mục tiêu

- Giảm CSS tải ban đầu trên storefront mà không xóa mù CSS legacy.
- Chuẩn hóa catalog Firebase với SKU làm ID/node key.
- Nhập CSV có URL hình ảnh và header tiếng Việt/Anh.
- Chuẩn bị đầy đủ Firebase Rules, environment variables và deploy Vercel.

## Thay đổi code

- Thêm `src/product-data.ts` để canonicalize sản phẩm và map Firebase record.
- Nâng cấp `src/firebase.ts` với multi-location update.
- Viết lại `src/csv.ts` để tự nhận dạng Shopify CSV và CSV tùy chỉnh.
- Cập nhật `src/context.tsx` để đọc/ghi `timeforge/products/{SKU}`.
- Cập nhật Product Editor để bắt buộc và validate SKU.
- Nâng cấp màn hình Import/Export trong Admin.
- Tách CSS legacy theo route bằng `src/legacy.css`.
- Thêm `src/base.css` và `src/v4913-storefront-compat.css`.
- Thêm `.env.example`, Firebase Rules, template CSV và tài liệu deploy.

## Kết quả build

- TypeScript: Passed.
- Vite production build: Passed.
- Orphaned TS/TSX modules: 0.
- Initial storefront CSS: khoảng 31–32 KB gzip.
- Legacy CSS: nằm trong lazy chunk riêng, không còn tải cùng storefront ban đầu.
