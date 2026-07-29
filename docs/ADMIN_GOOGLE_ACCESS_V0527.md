# V0.52.7 — Quyền đăng nhập Google cho thành viên Admin

## Cách sử dụng

1. Mở **Admin → Nhân sự và phân quyền**.
2. Khi mời thành viên, Admin chủ động bật hoặc tắt **Cho phép đăng nhập bằng Google**.
3. Nếu được bật, người nhận có thể vào `/admin/login` và dùng đúng tài khoản Google trùng email được mời.
4. Nếu bị tắt, Google Sign-In bị từ chối; người nhận vẫn có thể xác thực bằng email link hoặc email/mật khẩu.
5. Với thành viên đang hoạt động, Admin có thể đổi trạng thái **Google bật / Google tắt** ngay trong danh sách.

## Bảo mật

- Quyền được lưu tại `timeforge/adminInvitations/{inviteId}/allowGoogleSignIn` và `timeforge/adminMembers/{uid}/allowGoogleSignIn`.
- Giao diện đăng nhập kiểm tra cờ này.
- Firebase Rules cũng kiểm tra `auth.token.firebase.sign_in_provider`, nên không thể dùng client khác để bỏ qua lựa chọn của Admin.
- Email chính trong `VITE_OWNER_EMAIL` luôn giữ quyền bootstrap. Các email bootstrap khác vẫn phải có `allowGoogleSignIn: true` khi dùng Google.

## Sau khi deploy source

- Bật Google tại **Firebase Authentication → Sign-in method → Google**.
- Thêm domain Vercel/domain riêng vào **Authorized domains**.
- Publish `firebase.rules.json` mới hoặc chạy `pnpm run firebase:rules:deploy`.
