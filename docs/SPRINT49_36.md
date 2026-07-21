# Sprint 49.36 — Mobile product grid 380–520 px

## Nguyên nhân

`sprint14.css` vẫn chứa rule cũ dưới 420 px ép `.lux-product-grid` về một cột. Dù các sprint mới có rule hai cột, CSS legacy có thể thắng khi thứ tự stylesheet chunk thay đổi.

## Cách sửa

- Xóa declaration một cột khỏi `sprint14.css`.
- Thêm `v4936-mobile-product-grid.css` và import sau toàn bộ stylesheet storefront.
- 380–520 px: hai cột `minmax(0,1fr)`, gap ngang 8 px.
- Dưới 380 px: một cột.
- Card, media, thông tin và giá đều có `min-width:0`; kích thước chữ/ảnh được giảm vừa đủ cho màn hình 380 px.
- Selector padding global gây khoảng trống desktop không còn trong source hoặc bundle.

## Viewport kiểm tra

- 379 px: 1 cột.
- 380, 390, 412, 428, 430 và 520 px: 2 cột.
- 521 px trở lên: theo grid tablet/desktop hiện hành.

Chạy `pnpm run responsive:check` để kiểm tra regression CSS.
