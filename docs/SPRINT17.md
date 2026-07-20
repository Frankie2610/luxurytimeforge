# TimeForge Sprint 17

## Mục tiêu

- Sửa phần tiêu đề và action bar của trang Sản phẩm Admin bị chồng bố cục.
- Giữ nguyên HTML từ Shopify CSV trong trình sửa sản phẩm.
- Thêm tab Trình soạn thảo và HTML cho mô tả.
- Làm lại trang Cửa hàng online theo cấu trúc quản lý theme và Customize của Shopify.
- Thu gọn trang chi tiết sản phẩm theo tỷ lệ của website đồng hồ luxury.
- Làm lại banner bộ sưu tập và phần mô tả/thông số sản phẩm.

## Thay đổi chính

### Admin Products

- Action bar mới, tách rõ Nhập CSV, Xuất CSV và Thêm sản phẩm.
- Không còn nhãn “Ảnh đại diện” trên media sản phẩm; dùng “Ảnh chính”.
- Media grid có khoảng cách, ảnh dùng `object-fit: contain`.
- Mô tả có hai tab dùng Radix Tabs:
  - Trình soạn thảo trực quan.
  - HTML source editor.
- HTML nhập từ Shopify CSV được giữ nguyên trong `descriptionHtml`.

### Import / Export

- Product preview dùng grid 2 cột desktop, 1 cột tablet/mobile.
- Card có vùng ảnh vuông, tên tối đa 2 dòng, handle ellipsis và badge không đè nội dung.

### Online Store

- Màn tổng quan theme hiện tại.
- Preview cửa hàng, trạng thái Published, thông tin phiên bản và nút Customize.
- Theme Library tách riêng.
- Màn Customize vẫn giữ cấu trúc Template → Sections → Blocks → Settings → Preview.
- Desktop dùng 3 cột; tablet và mobile tự chuyển panel.

### Storefront

- Product title và cụm mua hàng nhỏ gọn hơn.
- Gallery ảnh chính vuông, giới hạn kích thước và dùng `contain`.
- Các benefit được đưa gần giá bán.
- Loại sản phẩm không còn bị tự thêm vào bảng thông số.
- Mô tả và thông số đổi thành layout một cột giống trang sản phẩm tham chiếu.
- Banner bộ sưu tập có overlay, typography, badge và thanh filter nổi mới.

## Responsive

- Desktop: 3-column Theme Editor, 2-column import preview, compact PDP.
- Tablet: Online Store preview chuyển 1 cột, inspector nổi, PDP tự xuống hàng.
- Mobile: action bar, import preview, media grid, collection banner và PDP đều chuyển layout riêng.
