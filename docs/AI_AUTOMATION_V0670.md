# Luxury TimeForge V0.67.0 — AI & Automation

## 1. AI Watch Advisor

Route: `/watch-finder`

Khách có thể nhập câu tự nhiên, ví dụ:

> Nam, khoảng 7 triệu, mặt dưới 42mm, dây kim loại, đi làm văn phòng.

Flow:

1. `/api/meta?resource=watch-advisor` dùng Gemini để chuyển câu tự nhiên thành intent JSON có cấu trúc.
2. Gemini chỉ hiểu nhu cầu; không nhận catalog và không tự bịa sản phẩm.
3. Storefront dùng intent để rank catalog thật đang publish và còn hàng.
4. Nếu Gemini chưa cấu hình / lỗi quota, local smart parser tiếp tục chạy để demo không bị gián đoạn.

Env server:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

## 2. Back-in-stock automation

Khách ở PDP hết hàng có thể để email / điện thoại tại `timeforge/stockAlerts`.

Khi Admin lưu sản phẩm, source gọi processor hiện có `/api/price-alerts/process` hai mode:

- Price Alert: body `{ "sku": "..." }`
- Stock Alert: body `{ "mode": "stock", "sku": "..." }`

Nếu tồn kho đã quay lại và alert là email:

1. Hệ thống gửi email bằng Resend.
2. Alert chuyển `waiting -> notified`.
3. Lưu `notifiedAt`, `notifiedInventory`, `deliveryChannel`.

Ngoài trigger tức thời, Vercel Cron gọi GET `/api/price-alerts/process` mỗi ngày lúc 02:00 UTC (09:00 Việt Nam) để bắt các thay đổi tồn kho đến từ bulk import / nguồn khác. Nếu cấu hình `CRON_SECRET`, GET cron bắt buộc đúng bearer token do Vercel gửi.

Phone alert hiện được giữ ở trạng thái chờ; source không giả lập SMS khi chưa có SMS provider.

Env server:

```env
FIREBASE_DATABASE_URL=
FIREBASE_DATABASE_AUTH=
RESEND_API_KEY=
NEWSLETTER_FROM_EMAIL=
NEWSLETTER_REPLY_TO=
NEWSLETTER_STORE_NAME=Luxury TimeForge
CRON_SECRET=
```

## 3. Paid order -> warranty automation

Khi order chuyển từ chưa thanh toán sang `paid`:

- PayOS webhook: chạy server-to-server trực tiếp qua `syncWarrantyForPaidOrder`.
- Admin xác nhận bank transfer / COD / manual paid: client gọi `/api/price-alerts/process` với body `{ "mode": "warranty", "orderId": "..." }` sau khi order được ghi Firebase.

Flow:

1. Đọc order đã paid từ Firebase server.
2. Tạo 1 `warrantyPending` record cho mỗi sản phẩm/quantity.
3. Lưu customer, email, phone, SKU, brand, purchase date và thời hạn bảo hành mặc định 24 tháng.
4. Nếu có URL kích hoạt + Resend, gửi email mời khách kích hoạt.
5. Order được cập nhật `warrantyAutomationStatus`, `warrantyRecordCount`, `warrantySyncedAt`, `warrantyActivationEmailStatus`.
6. Admin Order Detail hiển thị trạng thái automation sau payment.

Đây mới là hồ sơ **chờ kích hoạt**. Khách vẫn phải qua OTP/email verification ở hệ thống bảo hành trước khi bảo hành có hiệu lực.

Env:

```env
WARRANTY_ACTIVATION_URL=https://your-shopify-domain/pages/kich-hoat-bao-hanh
```

## Demo interview nhanh

1. Mở `/watch-finder` và nhập câu nhu cầu tự nhiên -> show AI intent + catalog ranking thật.
2. Chọn một sản phẩm hết hàng, đăng ký email Stock Alert; vào Admin tăng inventory > 0 -> hệ thống tự chạy Stock Alert processor.
3. Chuyển một order sang Paid -> mở Order Detail và show `Bảo hành điện tử đã được chuẩn bị`.

## Kiểm tra source

```bash
node scripts/check-v670-ai-automation.mjs
node scripts/check-v652-vercel-hobby.mjs
```
