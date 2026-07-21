# Sprint 49.27 — Order summary và PayOS

## Giao diện

- Xóa stylesheet `v4926-commerce.css` và toàn bộ selector cũ của card tóm tắt giỏ hàng.
- Dựng lại card bằng namespace `tf4927-*`: header, coupon, tổng tiền, CTA và ba thẻ COD/PayOS/Secure.
- Nút `Áp dụng` có nền burgundy, chữ trắng và focus ring riêng; không còn phụ thuộc CSS button cũ.
- Ba thẻ thanh toán dùng icon SVG thật (`Banknote`, `QrCode`, `ShieldCheck`) và tự chuyển sang bố cục dọc trên mobile.
- Trang kết quả PayOS có bốn trạng thái: đang xác minh, thành công, hủy và lỗi/hết hạn; mobile dùng CTA full-width.

## Luồng PayOS

1. Checkout tạo đơn `pending`, gửi `orderId` và snapshot đơn hàng tới `POST /api/payments/create`.
2. Server không tin giá từ browser: đọc catalog, mã giảm giá và cấu hình vận chuyển từ Firebase để tính lại toàn bộ tổng tiền, sau đó mới lưu đơn.
3. Secret được SDK PayOS sử dụng ở server; browser chỉ nhận `checkoutUrl`.
4. PayOS đưa khách về `/payment/payos/return`; route này gọi `GET /api/payments/status` với token ngẫu nhiên của phiên.
5. `POST /api/payments/webhook` xác minh chữ ký PayOS, so khớp số tiền rồi cập nhật `paymentStatus` trong Firebase.

Không đánh dấu thành công từ query string. URL quay về chỉ dùng để mở trang kết quả; trạng thái được đối chiếu lại từ API PayOS.

## Biến môi trường server

```env
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PUBLIC_SITE_URL=https://your-domain.com
PAYOS_LINK_TTL_MINUTES=15

FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_DATABASE_AUTH=
```

Không đặt ba khóa PayOS trong biến có tiền tố `VITE_`. `FIREBASE_DATABASE_AUTH` cũng chỉ được cấu hình trên server/Vercel.

## Thiết lập

```powershell
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm run payos:doctor
corepack.cmd pnpm run build
```

Trong PayOS Dashboard, đăng ký webhook:

```text
https://your-domain.com/api/payments/webhook
```

Sau khi deploy, vào Admin → Cài đặt → Thanh toán & giao hàng, bật “Quét QR ngân hàng qua PayOS”, chọn provider PayOS và giữ endpoint `/api/payments/create`.

PayOS không tách sandbox riêng. Khi kiểm thử end-to-end, dùng đơn có giá trị nhỏ và tài khoản PayOS thử nghiệm phù hợp.

## Kiểm tra phát hành

```powershell
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run css:audit
corepack.cmd pnpm run code:audit
corepack.cmd pnpm run build:report
```
