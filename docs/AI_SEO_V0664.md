# Luxury TimeForge V0.66.4 — Google + AI SEO

Bản này tập trung vào khả năng **crawl, index, hiểu entity/sản phẩm và trích dẫn dữ liệu công khai**. Không có cấu hình nào có thể bảo đảm Google, ChatGPT, Gemini hay một mô hình AI sẽ xếp hạng, trích dẫn hoặc dùng nội dung để huấn luyện; bản này chỉ tối ưu và mở đúng các tín hiệu kỹ thuật cần thiết.

## Những thay đổi chính

- Prerender HTML sau build cho homepage, collection, product, blog và các trang SEO chính. Product/collection/blog không còn phụ thuộc hoàn toàn vào React/Firebase client để crawler hiểu nội dung.
- Mỗi route prerender có title, description, canonical, Open Graph, Twitter metadata và JSON-LD riêng.
- Product JSON-LD: Product, Offer, Brand, SKU/MPN, GTIN hợp lệ, availability, shipping, review/rating công khai, thuộc tính đồng hồ công khai.
- Collection JSON-LD có ItemList; hỗ trợ cả collection manual và automatic theo conditions.
- Blog có BlogPosting schema.
- Entity cửa hàng dùng `OnlineStore + Organization`, tên chuẩn `Luxury TimeForge`, alternate name `Luxury TimeForge Vietnam` để tránh nhầm với các entity "TimeForge" khác.
- `robots.txt` explicit allow cho `OAI-SearchBot`, `GPTBot`, `Google-Extended`; các trang admin/account/checkout/payment/search/cart... bị chặn crawl/noindex.
- Endpoint máy đọc:
  - `/llms.txt`
  - `/llms-full.txt`
  - `/ai-catalog.json`
  - `/sitemap.xml`
  - `/image-sitemap.xml`
  - `/google-products.xml`
- `ai-catalog.json` chỉ xuất dữ liệu storefront công khai cần cho máy đọc: sản phẩm, giá, trạng thái hàng, thương hiệu, SKU/GTIN, thuộc tính, options/variants, ảnh, collections, bài viết và policy URLs. Không xuất cost hay dữ liệu khách hàng/admin.
- Production URL mặc định: `https://luxurytimeforge.vercel.app`.
- Hỗ trợ Google Search Console verification qua `VITE_GOOGLE_SITE_VERIFICATION`.

## Environment Variables trên Vercel

Đảm bảo Production có tối thiểu:

```env
VITE_PUBLIC_SITE_URL=https://luxurytimeforge.vercel.app
VITE_GOOGLE_SITE_VERIFICATION=TOKEN_GOOGLE_SEARCH_CONSOLE
VITE_FIREBASE_DATABASE_URL=https://...firebaseio.com
```

`VITE_GOOGLE_SITE_VERIFICATION` chỉ lấy chuỗi bên trong `content="..."` của thẻ Google, không dán cả thẻ HTML.

Các biến Firebase client hiện có của dự án vẫn phải giữ nguyên để storefront hoạt động. `FIREBASE_DATABASE_AUTH` là tùy chọn cho prerender; V0.66.4 đã đọc reviews công khai bằng query `status=published` đúng với Firebase rules, nên không cần mở quyền đọc draft reviews.

## Sau khi deploy

Mở trực tiếp và xác nhận trả HTTP 200:

- `https://luxurytimeforge.vercel.app/robots.txt`
- `https://luxurytimeforge.vercel.app/sitemap.xml`
- `https://luxurytimeforge.vercel.app/image-sitemap.xml`
- `https://luxurytimeforge.vercel.app/llms.txt`
- `https://luxurytimeforge.vercel.app/llms-full.txt`
- `https://luxurytimeforge.vercel.app/ai-catalog.json`
- `https://luxurytimeforge.vercel.app/google-products.xml`

Mở **View Source** của một URL sản phẩm. Trong source phải thấy trực tiếp:

- tên sản phẩm;
- giá/SKU/thương hiệu;
- canonical đúng URL sản phẩm;
- `<script type="application/ld+json">` có `Product`;
- mô tả và thuộc tính sản phẩm.

Nếu View Source vẫn chỉ thấy shell chung, kiểm tra log build Vercel xem `scripts/prerender-seo.mjs` có đọc được Firebase Database URL hay không.

## Google Search Console

1. Verify URL-prefix property.
2. Submit `sitemap.xml`.
3. Submit `image-sitemap.xml`.
4. Dùng URL Inspection cho homepage, collection quan trọng và một vài product quan trọng. Không cần spam Request Indexing toàn bộ catalog; sitemap mới là cơ chế chính.
5. Kiểm tra Product URLs bằng Rich Results Test để xác nhận Product/Merchant structured data.

## AI crawler semantics

- `OAI-SearchBot`: cho phép nội dung công khai đủ điều kiện được ChatGPT Search khám phá/tóm tắt/trích dẫn.
- `GPTBot`: cho phép khả năng nội dung công khai được OpenAI thu thập cho mục đích cải thiện/huấn luyện mô hình theo chính sách hiện hành; không có bảo đảm nội dung cụ thể sẽ được dùng hay model sẽ "nhớ" website.
- `Googlebot`: cần cho Google Search index; Google AI Overviews/AI Mode dựa trên Search index và hệ thống ranking.
- `Google-Extended`: được explicit allow để Google có thể dùng nội dung theo phạm vi mà token này kiểm soát cho Gemini/Vertex AI; token này không quyết định Google Search ranking.
- `llms.txt` là tín hiệu bổ sung và chưa phải tiêu chuẩn bắt buộc của Google/OpenAI. Nguồn chính vẫn là HTML crawlable, sitemap, structured data, entity consistency và nội dung hữu ích.

## Dữ liệu cần giữ nhất quán

Để AI hiểu Luxury TimeForge là đúng một entity, nên giữ đồng nhất trên website, Google Business/Profile nếu có, Facebook, Instagram, TikTok, các marketplace/listing:

- Tên: **Luxury TimeForge**
- URL chính thức
- điện thoại/email
- địa chỉ
- chính sách bảo hành/giao hàng/đổi trả

Không nên dùng `TimeForge` một mình làm alternate name vì tên này đã có nhiều entity khác trên Internet.
