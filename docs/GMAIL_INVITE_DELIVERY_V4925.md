# Gmail invitation delivery

Luồng mời dùng Firebase Authentication `sendSignInLinkToEmail`. Khi giao diện báo Firebase đã tiếp nhận, request API đã thành công nhưng trình duyệt không thể xác nhận Gmail đã đưa thư vào Inbox.

## Cấu hình bắt buộc

1. Firebase Console → Authentication → Sign-in method: bật **Email/Password** và **Email link (passwordless sign-in)**.
2. Authentication → Settings → Authorized domains: thêm domain production. Nếu thử từ localhost với project tạo sau ngày 28/04/2025, thêm `localhost` thủ công.
3. Đặt `VITE_PUBLIC_SITE_URL` bằng URL production HTTPS.
4. Nếu project có custom Firebase Hosting link domain, đặt `VITE_FIREBASE_AUTH_LINK_DOMAIN`. Nếu không có thì để trống để Firebase chọn domain mặc định.

## Nếu Gmail vẫn chưa nhận

- Kiểm tra Spam và Promotions.
- Kiểm tra Authentication Usage/quota. Gói Spark chỉ cho 5 email link sign-in mỗi ngày; Blaze có quota cao hơn.
- Không bấm gửi lại liên tục vì mỗi lần dùng thêm quota.
- Dùng nút **Sao chép link** trong admin để gửi liên kết dự phòng trong lúc kiểm tra cấu hình/quota.

Để có log giao thư, retry và sender theo domain riêng, cần một backend email transactional đã xác thực tên miền. Không đặt API key email ở biến `VITE_*` vì các biến đó được đóng gói công khai trong trình duyệt.
