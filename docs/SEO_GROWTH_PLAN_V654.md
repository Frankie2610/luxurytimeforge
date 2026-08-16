# SEO & Online Sales Growth Plan — Luxury TimeForge

## Ưu tiên 1: Google Merchant Center + free listings
Tạo feed sản phẩm đồng bộ title, SKU/GTIN nếu có, brand, giá, giá sale, availability, ảnh, link sản phẩm và category. Kết hợp feed với Product structured data hiện tại để tăng độ chính xác dữ liệu và khả năng xuất hiện trên Google Shopping, Images và Lens.

## Ưu tiên 2: Merchant listing schema đầy đủ
Mở rộng `Product` / `Offer` theo dữ liệu thật:
- shipping details;
- return policy;
- category / product type;
- sale price / price validity nếu có;
- GTIN/MPN khi sản phẩm có dữ liệu chính hãng.
Không thêm trường không có bằng chứng thật.

## Ưu tiên 3: Product variants
Nếu một mẫu có biến thể màu/dây/size có ý nghĩa tìm kiếm, tạo URL variant ổn định và `ProductGroup` + `hasVariant` / `variesBy`. Không index hàng loạt query variant vô nghĩa.

## Ưu tiên 4: Product review thực sự theo SKU/product
Hiện testimonial là review cửa hàng. Nếu muốn rating rich result cho product, cần thêm review gắn `productId`/SKU và hiển thị công khai trên đúng trang sản phẩm; sau đó mới thêm `review` / `aggregateRating` schema. Không dùng testimonial chung làm product rating.

## Ưu tiên 5: Landing page SEO có intent mua hàng
Tạo collection/landing page curated thay vì index mọi filter URL, ví dụ:
- Đồng hồ nam dưới 5 triệu;
- Đồng hồ nữ mặt nhỏ;
- Seiko automatic chính hãng;
- đồng hồ dây kim loại đi làm;
- quà tặng đồng hồ theo ngân sách.
Mỗi landing page cần title, H1, đoạn mô tả riêng, sản phẩm phù hợp và internal links.

## Ưu tiên 6: Journal kéo traffic top/mid funnel
Bài viết phải trả lời intent thật và link về collection/product, ví dụ:
- cổ tay 15/16/17 cm đeo mặt bao nhiêu mm;
- automatic vs quartz;
- cách chọn đồng hồ làm quà;
- chống nước 3ATM/5ATM/10ATM;
- so sánh 2 mẫu đang bán.
Sitemap V0.65.4 đã đưa bài published vào crawl list.

## Ưu tiên 7: Search Console + Merchant Listings reports
Theo dõi:
- query có impression cao nhưng CTR thấp → sửa title/meta;
- trang product/collection impression tăng nhưng position thấp → bổ sung nội dung/internal links;
- Product/Merchant listing errors;
- Core Web Vitals: LCP, INP, CLS.

## Ưu tiên 8: Conversion SEO
Organic traffic chỉ có giá trị nếu chuyển thành đơn. Trên product page nên đo:
- view product → add to cart;
- add to cart → checkout;
- checkout → purchase;
- use Quick View / Compare / Watch Finder;
- price alert / stock alert signup.
Từ đó ưu tiên SEO cho nhóm URL có conversion tốt thay vì chạy theo traffic tổng.
