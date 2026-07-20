# Sprint 29 — Storefront & Theme Editor Refinement

## Storefront

- Chuẩn hóa typography về `Avenir Next / Helvetica Neue` với fallback an toàn.
- Product cards không còn card bo góc lồng nhau; media vuông, thông tin nằm phẳng bên dưới.
- Nhãn giảm giá dùng nền đỏ, chữ trắng và vị trí cố định trên ảnh.
- Product description/specifications có max-width đọc, padding và đường phân cách rõ.
- Search sử dụng Radix Dialog: focus trap, Escape, click overlay để đóng.
- Collection filters sử dụng Radix Dialog drawer bên trái, overlay đen toàn màn hình.

## Checkout

- Summary có header, số lượng sản phẩm, ảnh vuông, badge số lượng và vendor riêng.
- Discount form, subtotal, shipping, total và CTA được chia lớp rõ ràng.
- Ba cam kết bảo mật/minh bạch/đóng gói trở thành các ô thông tin riêng.
- Card checkout dùng border sắc, shadow nhẹ và giảm bo góc để gần giao diện luxury retail.

## Theme Editor

- Topbar chia bốn vùng ổn định: navigation, theme identity, template picker và command bar.
- Device switch, zoom, undo, redo, menu và Save nằm cùng một command surface.
- Save có chiều rộng cố định và không bị tụt khỏi header.
