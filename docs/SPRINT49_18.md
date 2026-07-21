# Sprint 49.18

## Product cards storefront

- Đổi toàn bộ namespace card từ `v4910` sang `v4918` để tách khỏi CSS lịch sử.
- Xóa các rule card `v4910` khỏi `v4912-storefront.css`.
- Card, media, info và price không còn border, border-radius, border-top, border-bottom hoặc box-shadow.
- Giữ badge giảm giá và nút yêu thích như các control nổi độc lập.
- Ảnh căn giữa trên nền trắng, `object-fit: contain` và giữ lazy loading/ảnh hover theo yêu cầu trước.
- Responsive: 4 cột desktop theo grid hiện tại, card phẳng trên tablet và mobile.

## Typography

- Toàn bộ storefront dùng một font Inter/system sans-serif.
- Heading, body, product title, price, button và form đều kế thừa cùng font.
- Ép `font-style: normal`; `code` và `pre` vẫn giữ monospace.
