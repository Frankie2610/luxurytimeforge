# Sprint 49.38 — Admin CSS cascade cleanup

## Nguyên nhân

Các module Admin được lazy-load và tự import stylesheet riêng. Khi người dùng chuyển qua nhiều màn hình, trình duyệt tiếp tục giữ các stylesheet đã tải; thứ tự cascade vì vậy phụ thuộc vào lịch sử điều hướng thay vì một thứ tự cố định.

Ngoài ra, một số selector shell/header và cảnh báo lời mời khai báo lại cùng property ở phần cuối stylesheet.

## Cách sửa

- Tạo `src/admin-v4938.css` làm entry duy nhất cho CSS chỉ dành cho Admin.
- Quy định thứ tự: shell → catalog → operations → customers → content → resource fixes → product editor → team → theme editor.
- Xóa import CSS Admin khỏi các route lazy; stylesheet Journal dùng chung với storefront vẫn được giữ riêng.
- Loại 29 declaration shadowed trong shell và 3 declaration shadowed trong Team mà không thay đổi computed style.
- Thêm script `scripts/check-admin-css.mjs` để chặn việc route Admin import CSS trực tiếp trở lại.

## Kiểm tra

- `npm run admin:css:check`
- `npm run typecheck`
- `npm run responsive:check`
- `npm run css:audit`
- `npm run code:audit`
- `npm run build`

Kết quả bundle: một chunk `admin-shell-v16-*.css` chứa cascade Admin; các route Admin không còn sinh CSS chunk riêng.

