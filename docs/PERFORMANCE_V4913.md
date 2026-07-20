# Performance & CSS Optimization — Sprint 49.13

## Kết quả chính

CSS legacy trước đây được import toàn cục từ `app.css`, nên storefront tải cả CSS của nhiều màn hình Admin cũ.

Sprint 49.13 chuyển sang:

```text
src/base.css
src/legacy.css
src/v4913-storefront-compat.css
```

### Cách hoạt động

- `base.css`: reset, accessibility và reduced motion dùng toàn ứng dụng.
- `legacy.css`: các stylesheet Sprint 10–23, chỉ import trong route Admin/tài khoản còn cần.
- `v4913-storefront-compat.css`: các rule storefront nền tảng nhỏ, thay cho việc tải toàn bộ legacy CSS.

## Bundle CSS sau build

| Bundle | Raw | Gzip | Khi tải |
|---|---:|---:|---|
| Global `index.css` | ~13.7 KB | ~3.9 KB | Ban đầu |
| Storefront CSS | ~159.5 KB | ~27.5 KB | Khi vào storefront |
| Legacy CSS | ~257.5 KB | ~49.8 KB | Chỉ route cần legacy/Admin |

Initial storefront CSS khoảng **31–32 KB gzip**, giảm đáng kể so với cấu trúc cũ tải CSS legacy ngay từ đầu.

## Các tối ưu khác

- Firebase SDK tiếp tục lazy-load khi có cấu hình.
- Catalog lớn không còn luôn được stringify vào localStorage khi Firebase đang bật.
- Tạo/sửa/xóa sản phẩm ghi theo node SKU, giảm dữ liệu gửi lại.
- CSS exact duplicate ở lớp mới được loại bỏ an toàn.
- Route build tiếp tục được code-split bởi Vite.

## Audit hiện tại

Toàn source vẫn còn nhiều CSS legacy phục vụ Admin cũ:

```text
CSS files: 25
Source CSS: khoảng 754.7 KB
!important: 1670
Duplicated selectors: 2006
Orphaned TS/TSX modules: 0
```

Các con số source-wide không đồng nghĩa toàn bộ CSS được tải vào storefront. Legacy CSS hiện nằm trong chunk lazy riêng.

## Việc chưa nên làm tự động

Không nên tiếp tục xóa hàng loạt selector chỉ dựa trên grep vì:

- Theme Editor tạo class động.
- Nhiều màn hình Admin được lazy-load.
- Một số class chỉ xuất hiện từ dữ liệu hoặc component render có điều kiện.

Hướng cleanup an toàn tiếp theo:

1. Chụp visual baseline từng route.
2. Dọn từng route Admin.
3. Chạy visual regression sau mỗi nhóm.
4. Thay dần legacy class bằng namespace mới.
5. Xóa stylesheet cũ khi không còn route sử dụng.

## Lệnh kiểm tra

```powershell
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run build
corepack.cmd pnpm run css:audit
corepack.cmd pnpm run code:audit
node scripts/bundle-report.mjs
```
