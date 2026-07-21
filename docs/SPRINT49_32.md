# Sprint 49.32 — Collection pagination và toolbar

## Storefront

- Lọc và sắp xếp chạy trên toàn bộ catalog trước khi phân trang.
- Mỗi trang hiển thị tối thiểu 50 sản phẩm; theme mới mặc định 50 và cho phép cấu hình 50–100.
- Bộ đếm hiển thị tổng số sản phẩm và khoảng hiện tại, ví dụ `1–50 đang hiển thị`.
- Phân trang có trang trước, trang sau, số trang, trạng thái disabled và `aria-current`.
- Chuyển bộ lọc, khoảng giá, tồn kho hoặc cách sắp xếp sẽ trở về trang 1.
- Toolbar mới dùng namespace `tf4932-*` để cô lập khỏi `tf4924-*` và `tf4925-*`.
- Breakpoint tablet 900 px, mobile 640 px và mobile nhỏ 370 px.
- Trong khoảng màn hình 380–520 px, lưới bộ sưu tập được khóa 2 sản phẩm mỗi hàng.

## CSV và Firebase

Giữ toàn bộ sửa lỗi của Sprint 49.31: loại key CSV cấm ở hai lớp, bỏ sản phẩm thiếu ảnh và ghi Firebase theo lô 100 đường dẫn.

## Deploy an toàn

1. Giải nén source mới và chép riêng `.env.local` từ source đang hoạt động.
2. Cài dependency bằng `corepack.cmd pnpm install`.
3. Tạo Rules thật từ email owner: `corepack.cmd pnpm run firebase:rules:generate`.
4. Chạy `firebase:rules:check` và `firebase:rules:doctor`.
5. Đăng nhập Firebase CLI bằng tài khoản có quyền trên project.
6. Deploy đích danh `VITE_FIREBASE_PROJECT_ID`; chỉ tiếp tục khi terminal báo `Deploy complete!`.
7. Chạy Vite với `--force`, đăng xuất/đăng nhập lại Admin và dùng chế độ import merge trước.

Không publish file Rules mặc định có `auth != null && false` và không dán trực tiếp `firebase.rules.template.json` vào Firebase Console.
