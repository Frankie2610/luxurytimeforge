# Sprint 32

## Mục tiêu

Khắc phục lỗi ảnh sản phẩm ở giỏ hàng và checkout, đồng thời polish các khu vực storefront được phản hồi trực tiếp qua ảnh chụp.

## Thay đổi chính

- Native commerce image renderer cho cart/checkout với fallback SVG.
- Xóa nhãn tiếng Anh `ORDER SUMMARY` tại trang giỏ hàng.
- Badge số lượng checkout được neo chính xác theo thumbnail.
- PDP có hệ pill/chip cho xác thực, vận chuyển và tồn kho.
- Delivery timeline giảm độ nặng của connector/dot.
- Section heading có cấu trúc ba cột và CTA “Xem tất cả” mới.
- Footer newsletter sửa kích thước input, line-height, button và breakpoint mobile.

## Roadmap tiếp theo

- Di chuyển Product Editor và Order Detail sang component system mới.
- Tiếp tục loại selector legacy đã bị V24–V32 thay thế.
- Bổ sung visual regression khi môi trường Chromium ổn định.
