# Sprint 25 — Lazy CSS chunks và Admin resource system

## 1. CSS được tải theo khu vực

`app.css` chỉ giữ CSS chung, Tailwind, design system, token và legacy layer.

Storefront tải riêng:

- `v24-storefront.css`
- `v25-storefront.css`

Admin tải riêng:

- `v24-admin.css`
- `v25-admin.css`

Theme Editor tải thêm:

- `v25-theme-editor.css`

Kết quả build tạo ba CSS chunk riêng thay vì đưa toàn bộ phần V24/V25 vào CSS khởi tạo.

## 2. Component system Admin

File mới:

- `src/admin-ui-v25.tsx`

Component dùng chung:

- `AdminResourceFrame`
- `AdminResourceSurface`
- `AdminResourceIntro`
- `AdminEmptyState`
- `AdminMetricGrid`
- `AdminMetric`

Đã áp dụng cho Products, Orders và các trang index trong `admin-operations-v10.tsx`, gồm Customers, Inventory và Discounts.

## 3. Storefront polish

- Khung nội dung tối đa 1360px.
- Header và navigation rõ hơn.
- Product card có khoảng thở và chuyển động nhẹ.
- PDP cân lại gallery, buy panel, CTA và accordion.
- Collection controls chuyển thành surface có chiều cao thống nhất.
- Journal dùng chiều rộng đọc phù hợp hơn.
- Responsive riêng cho 1100px, 760px và 430px.

## 4. Admin polish

- Resource intro và action group thống nhất.
- Saved views, toolbar và table cùng mật độ.
- Row selected, bulk action và empty state đồng bộ.
- Drawer/modal có radius, shadow và header thống nhất.
- Media grid có hover và khoảng cách ổn định.
- Tablet/mobile chuyển toolbar thành một cột và giữ table trong vùng cuộn riêng.

## 5. Phần vẫn còn legacy

CSS legacy vẫn còn nhiều selector trùng và `!important`. V25 ưu tiên tách tải và chuẩn hóa các trang quan trọng, chưa xóa toàn bộ 24 lớp lịch sử. Báo cáo chi tiết nằm trong `docs/CSS_AUDIT_V25.json`.
