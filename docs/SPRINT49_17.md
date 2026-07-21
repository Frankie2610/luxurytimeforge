# Sprint 49.17

## Admin Catalog

- Loại bỏ tiêu đề catalog bị lặp trong trang Sản phẩm.
- Tách stylesheet hậu legacy cho `/admin/products` và `/admin/collections`.
- Chuẩn hóa toolbar, nút hành động, tab, thanh tìm kiếm, bộ lọc, bảng và trạng thái rỗng.
- Viết lại card Bộ sưu tập và modal chỉnh sửa.
- Responsive riêng cho desktop, tablet và mobile.

## TimeForge Journal

- Bỏ phụ thuộc `legacy.css` ở route khách `/blogs`.
- Viết lại hero editorial, thanh danh mục, bài nổi bật, grid bài viết và CTA đăng ký.
- Viết lại trang chi tiết bài viết với cover, meta, nội dung, sidebar và bài liên quan.
- Responsive riêng cho tablet và mobile.

## Admin Invitations

- Trang Nhân sự & phân quyền mới.
- Gửi lời mời bằng Firebase Authentication Email Link.
- Trạng thái pending, accepted, cancelled và hết hạn 7 ngày.
- Trang `/admin/accept-invite` xác thực đúng email và kích hoạt thành viên.
- Thành viên động lưu tại `timeforge/adminMembers/{uid}`.
- Security Rules kiểm tra chủ sở hữu, trạng thái thành viên và role.
