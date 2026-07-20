# CSS & bundle performance — v49.14

## Kết quả production build

- Global CSS: 3.96 KB gzip.
- Storefront CSS: 28.15 KB gzip.
- Storefront initial CSS: khoảng 32.11 KB gzip.
- Login CSS: 2.01 KB gzip.
- Login initial CSS: khoảng 5.97 KB gzip.
- Legacy CSS: 50.93 KB gzip, chỉ tải khi route Admin/module legacy cần.

## Tỷ lệ tối ưu

So với baseline storefront trước khi route-split CSS khoảng 54 KB gzip:

- Storefront initial CSS giảm khoảng 40.5%.
- Route login trước đây kéo theo legacy CSS khoảng 54.9 KB gzip; hiện còn khoảng 6.0 KB gzip, giảm khoảng 89.1%.

## Điều cần hiểu đúng

Tổng source CSS vẫn còn 759.5 KB với 1,670 `!important` và 2,017 selector trùng. Nghĩa là runtime tải ban đầu đã cải thiện rõ, nhưng cleanup CSS legacy toàn dự án mới hoàn thành khoảng 35–40% theo mục tiêu an toàn. Không nên xóa hàng loạt vì các module Admin cũ vẫn phụ thuộc vào chúng.
