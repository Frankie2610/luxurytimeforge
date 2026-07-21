# Sprint 49.16

- Bỏ nhãn phụ `Tình trạng kho` ở trang chi tiết sản phẩm.
- Đổi CTA thành `Thêm giỏ hàng` trên desktop và mobile fixed bar.
- Thu gọn heading `Gợi ý phù hợp / Sản phẩm liên quan` trên tablet và mobile.
- Sửa SmartImage không bị kẹt skeleton khi ảnh đã có trong cache.
- URL ảnh lỗi hoặc bị chặn sẽ tự chuyển sang ảnh dự phòng sau timeout.
- Ảnh hover thứ hai của product card chỉ được tải khi người dùng hover/focus, giảm tải mạng và số request ban đầu.
- Cloudinary dùng `c_fit` cho ảnh có kích thước vuông để tránh crop đồng hồ.
