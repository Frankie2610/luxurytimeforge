# Luxury Timeforge — Sprint 49.35

Sprint 49.35 chuyển catalog website khách sang Firebase source-of-truth, tách dữ liệu public khỏi các đường dẫn Admin cần đăng nhập và hiển thị đúng nguồn dữ liệu đang hoạt động.

Chi tiết triển khai: `docs/SPRINT49_35.md`.

## Điểm chính của Sprint 49.35

- Catalog public tải độc lập từ `timeforge/products`; lỗi quyền ở dữ liệu Admin không còn làm rớt toàn bộ lần tải.
- Firebase trả catalog rỗng thì website dùng đúng catalog rỗng, không giữ lại sản phẩm seed/local cũ.
- Dữ liệu private chỉ tải sau khi Firebase Authentication khôi phục phiên đăng nhập hợp lệ.
- Admin hiển thị `Firebase live`, trạng thái đang tải hoặc fallback dựa trên lần đọc catalog thật.
- Xóa rule CSS `padding-block: var(--tf-r-section)` khỏi wrapper trang để loại khoảng cách dọc dư.

---

# Luxury Timeforge — Sprint 49.34

Sprint 49.34 sửa tận gốc xung đột cascade khiến catalog chỉ chuyển thành hai cột sau 430 px, đồng thời giảm công việc xử lý ảnh ngoài viewport khi một trang có 50 sản phẩm.

Chi tiết triển khai: `docs/SPRINT49_34.md`.

## Điểm chính của Sprint 49.34

- Rule một cột có `!important` trong legacy layer chỉ còn áp dụng dưới 380 px.
- Viewport 380–520 px nhận hai cột trực tiếp, với container rộng hơn và gap 8 px.
- Card được ép `min-width: 0` để nội dung không làm nở cột.
- Toàn bộ SmartImage dùng chung một IntersectionObserver; timeout kiểm tra ảnh chỉ chạy khi card đến gần viewport.

---

# Luxury Timeforge — Sprint 49.33

Sprint 49.33 làm sạch toàn bộ chrome của trang bộ sưu tập: dựng lại banner, toolbar và newsletter bằng namespace riêng; thu gọn khoảng cách desktop và khóa lưới 380–520 px ở hai sản phẩm mỗi hàng.

Chi tiết triển khai: `docs/SPRINT49_33.md`.

## Điểm chính của Sprint 49.33

- Bỏ dòng phụ “Trang 1 / 2 · 1–50 trong 97 sản phẩm” dưới nút phân trang.
- Xóa CSS toolbar `tf4932-*` và CSS banner `tf4924-*` khỏi luồng collection.
- Newsletter không còn nhận đồng thời các lớp `v26` và `v27`.
- Giảm padding/margin giữa banner, toolbar, lưới sản phẩm, phân trang và newsletter.
- Viewport 380–520 px luôn hiển thị đúng hai card sản phẩm mỗi hàng.

---

# Luxury Timeforge — Sprint 49.32

Sprint 49.32 bổ sung phân trang collection 50 sản phẩm/trang và dựng lại toolbar Bộ lọc/Kết quả/Sắp xếp bằng namespace CSS riêng, tối ưu desktop, tablet và mobile.

Chi tiết triển khai và checklist deploy: `docs/SPRINT49_32.md`.

## Điểm chính của Sprint 49.32

- Collection không còn cắt cứng 24 sản phẩm đầu tiên.
- 97 sản phẩm được chia thành hai trang: 50 và 47 sản phẩm.
- Bộ đếm hiển thị tổng kết quả cùng khoảng đang xem.
- Phân trang reset khi đổi bộ lọc/sắp xếp và cuộn về đầu danh sách khi chuyển trang.
- Toolbar và pagination dùng namespace `tf4932-*`, không nhận CSS toolbar cũ.

---

# Luxury Timeforge — Sprint 49.31

Sprint 49.31 chia catalog lớn thành các lô Firebase nhỏ, bỏ qua sản phẩm chưa có ảnh và thêm vị trí lô/SKU vào lỗi để tránh một record làm hủy toàn bộ 2.500 sản phẩm.

Chi tiết triển khai: `docs/SPRINT49_31.md`.

## Điểm chính của Sprint 49.31

- Import Firebase theo lô tối đa 100 đường dẫn thay vì một update nguyên khối.
- Tự động bỏ qua 58 sản phẩm không có URL ảnh trong `adidas.csv`.
- Lỗi Firebase hiển thị số lô và khoảng đường dẫn SKU đang ghi.
- Giữ hai lớp làm sạch key CSV và toàn bộ Rules bảo mật Sprint 49.30.

---

# Luxury Timeforge — Sprint 49.30

Sprint 49.30 loại key CSV không tương thích Firebase ngay khi đọc file và tiếp tục làm sạch lần hai trước khi ghi. Cách bảo vệ hai lớp này xử lý dứt điểm lỗi `rawShopify.Google Shopping / Google Product Category`.

Chi tiết triển khai: `docs/SPRINT49_30.md`.

## Điểm chính của Sprint 49.30

- `rawShopify` chỉ giữ các header dùng được làm Firebase object key.
- URL CDN nằm trong giá trị vẫn được giữ nguyên.
- Payload được làm sạch lần hai tại `firebaseClient.write` và `firebaseClient.update`.
- Đã kiểm thử trực tiếp SKU `AOFH23001`: 70 key cấm trước import, 0 key cấm sau làm sạch.

---

# Luxury Timeforge — Sprint 49.29

Sprint 49.29 cập nhật toàn bộ Firebase Rules để batch import CSV vẫn an toàn nhưng chấp nhận sản phẩm chưa có ảnh. Quyền ghi sản phẩm vẫn giới hạn cho `owner`, `admin` và `manager`.

Chi tiết triển khai: `docs/SPRINT49_29.md`.

## Điểm chính của Sprint 49.29

- Không còn bắt buộc node `images` phải tồn tại khi ghi sản phẩm.
- Nếu `images` tồn tại, Rules vẫn yêu cầu danh sách có phần tử.
- Toàn bộ role, lời mời, đơn hàng, khách hàng, theme và nội dung giữ nguyên phân quyền bảo mật.
- Rules thật tiếp tục được tạo từ `.env.local` bằng `pnpm run firebase:rules:generate`.

---

# Luxury Timeforge — Sprint 49.28

Sprint 49.28 sửa luồng import CSV để tự động bỏ qua các cột raw có tên không tương thích Firebase Realtime Database, đồng thời giữ nguyên dữ liệu sản phẩm chuẩn và toàn bộ URL ảnh CDN hợp lệ.

Chi tiết triển khai: `docs/SPRINT49_28.md`.

## Điểm chính của Sprint 49.28

- Mọi payload ghi Firebase đều được làm sạch đệ quy trước khi `set` hoặc `update`.
- Key rỗng hoặc chứa `. # $ / [ ]` được bỏ qua; giá trị URL CDN không bị thay đổi.
- Trang nhập CSV cảnh báo rõ số cột raw bị bỏ qua trước khi người quản trị xác nhận.
- Đã kiểm thử bằng `adidas.csv`: 70 header raw không hợp lệ được bỏ qua, 13.651 URL CDN hợp lệ vẫn được giữ.

---

# Luxury Timeforge — Sprint 49.27

Sprint 49.27 dựng lại hoàn toàn card tóm tắt đơn hàng, thay ba ô COD/PayOS/Secure bằng icon thật và bổ sung luồng thanh toán PayOS có xác minh server + webhook Firebase.

Chi tiết triển khai: `docs/SPRINT49_27.md`.

## Điểm chính của Sprint 49.27

- CSS tóm tắt đơn hàng dùng namespace `tf4927-*`; stylesheet coupon/payment 49.26 đã xóa.
- Nút áp dụng mã ưu đãi tương phản ổn định, tổng cộng rõ hơn và CTA gọn trên desktop/mobile.
- Checkout có lựa chọn quét QR ngân hàng qua PayOS.
- Server nhận mã + snapshot đơn, tính lại giá/giảm giá/vận chuyển từ Firebase rồi mới lưu đơn và tạo payment link.
- Trang kết quả không tin query string; trạng thái được hỏi lại PayOS, webhook có kiểm tra chữ ký và số tiền.
- Có `pnpm run payos:doctor` để kiểm tra cấu hình mà không tạo giao dịch.

---

# Luxury Timeforge — Sprint 49.26

Sprint 49.26 chuyển toàn bộ luồng nhập ảnh sang URL CDN, xác nhận ghi Firebase trước khi báo import CSV thành công, xử lý đúng quota email mời và polish giỏ hàng/thanh toán trên mobile.

Chi tiết thay đổi và checklist triển khai: `docs/SPRINT49_26.md`.

## Điểm chính của Sprint 49.26

- Nút “Áp dụng” có namespace CSS mới, tương phản trắng/đen ổn định ở giỏ hàng và checkout; CSS coupon cũ đã được gỡ.
- Nhóm COD/BANK/SECURE dùng card compact mới, tự xếp lại tại 680 px và 360 px.
- Theme Editor giảm font, khoảng cách và chiều cao control trong inspector để cân đối như Shopify.
- Product, collection, blog và Theme Editor chỉ nhận URL CDN; mã upload, biến môi trường và connection hint Cloudinary đã được gỡ.
- Import CSV chờ Firebase xác nhận: replace ghi lại catalog; merge chỉ cập nhật SKU thay đổi và xóa key SKU cũ khi cần.
- `auth/quota-exceeded` hiển thị cảnh báo đúng trạng thái cùng link dự phòng, không còn báo nhầm là lời mời bị mất.

# Luxury Timeforge v0.49.19-alpha.1

Sprint 49.19 là bản hotfix khôi phục nền CSS storefront ổn định của 49.16, đồng thời giữ lại card sản phẩm phẳng, blog mới, Admin catalog và luồng mời quản trị viên.

## Điểm mới

- Product card storefront dùng namespace mới `v4918`, không còn nhận CSS card cũ.
- Card, media và vùng thông tin không viền, không bo góc, không border-top/bottom và không shadow.
- Ảnh sản phẩm giữ nền trắng, căn giữa và có khoảng thở như catalog luxury.
- Storefront thống nhất một font Inter, font-style normal trên desktop, tablet và mobile.
- `/admin/products`: bỏ tiêu đề bị lặp, cô lập CSS khỏi legacy và chuẩn hóa toolbar/bảng/bộ lọc.
- `/admin/collections`: card, toolbar và modal mới, responsive desktop/tablet/mobile.
- `/blogs` và `/blogs/:handle`: giao diện editorial luxury mới, không tải `legacy.css` trên route khách.
- `/admin/settings/team`: gửi email mời, theo dõi trạng thái, gửi lại, thu hồi và đổi role.
- `/admin/accept-invite`: xác thực Firebase Email Link và kích hoạt thành viên động.
- Firebase Rules mới bảo vệ `adminInvitations` và `adminMembers`.

## Cấu hình luồng lời mời

Xem `docs/FIREBASE_ADMIN_INVITES_V4917.md`. Sau khi điền `.env.local`, bắt buộc tạo và deploy rules:

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm dlx firebase-tools deploy --only database
```

## Kiểm tra local

```powershell
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run build
corepack.cmd pnpm run dev
```

---

# Luxury Timeforge Commerce — Sprint 49.13

Bản tiếp tục ổn định từ Sprint 49.12, tập trung vào **hiệu năng CSS**, **catalog Firebase theo SKU**, **nhập CSV linh hoạt** và **chuẩn bị deploy Vercel**.

## Thay đổi chính

### 1. CSS tải theo route

- CSS storefront không còn kéo toàn bộ CSS legacy của Admin vào lần tải đầu.
- CSS legacy được chuyển sang `src/legacy.css` và chỉ được tải ở các route quản trị/tài khoản còn cần.
- Storefront dùng `src/base.css` và `src/v4913-storefront-compat.css` thay cho nhiều rule legacy toàn cục.
- Initial storefront CSS giảm từ khoảng **54 KB gzip** xuống khoảng **32 KB gzip**.

### 2. Firebase theo SKU

Catalog được lưu theo cấu trúc:

```text
timeforge/products/{SKU}
```

Ví dụ:

```text
timeforge/products/VE3F00122
timeforge/products/SFKZ00726
```

Mỗi sản phẩm có:

```text
id = SKU
sku = SKU
```

Tạo/chỉnh sửa/xóa một sản phẩm chỉ tác động đúng node SKU tương ứng. Nhập hàng loạt CSV sẽ đồng bộ catalog theo SKU.

### 3. Nhập CSV linh hoạt

Importer tự nhận diện:

- CSV Shopify.
- CSV theo mẫu Luxury Timeforge.
- CSV tùy chỉnh có tên cột tiếng Việt hoặc tiếng Anh phổ biến.

URL hình ảnh được lấy trực tiếp từ các cột như:

```text
Image Src
Image URL
Hình ảnh
Hình ảnh 1
Hình ảnh 2
Ảnh sản phẩm
```

File mẫu:

```text
templates/luxury-timeforge-products-template.csv
```

### 4. Firebase và Vercel

Đã thêm:

```text
.env.example
firebase.json
firebase.rules.json
firebase.rules.example.json
vercel.json
```

Tài liệu chi tiết:

```text
docs/FIREBASE_CSV_V4913.md
docs/VERCEL_DEPLOY_V4913.md
docs/PERFORMANCE_V4913.md
```

## Chạy dự án

### PowerShell với pnpm

```powershell
corepack.cmd enable
corepack.cmd prepare pnpm@10.15.1 --activate
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm run dev
```

### Hoặc npm.cmd

```powershell
npm.cmd install
npm.cmd run dev
```

Mở:

```text
http://localhost:5173
```

## Kiểm tra production

```powershell
corepack.cmd pnpm run typecheck
corepack.cmd pnpm run build
corepack.cmd pnpm run css:audit
corepack.cmd pnpm run code:audit
node scripts/bundle-report.mjs
```

## Thứ tự triển khai đề xuất

1. Tạo Firebase project và Realtime Database.
2. Bật Authentication cho tài khoản Admin.
3. Điền `.env.local` từ `.env.example`.
4. Deploy `firebase.rules.json`.
5. Chạy local và import CSV trong Admin.
6. Kiểm tra dữ liệu tại `timeforge/products/{SKU}`.
7. Đẩy source lên Git và import project vào Vercel.
8. Khai báo biến môi trường trên Vercel rồi redeploy.

## Firebase Admin Login (v49.14)

- Route: `/admin/login`
- Providers: Google và Email/Password
- Guard: toàn bộ `/admin/**`
- Password reset: có sẵn trên form đăng nhập
- Security Rules: sinh từ email allowlist bằng `pnpm run firebase:rules:generate`
- Hướng dẫn: `docs/FIREBASE_AUTH_V4914.md`


## Sprint 49.16
- Bỏ nhãn phụ “Tình trạng kho”; CTA đổi thành “Thêm giỏ hàng”.
- Thu gọn heading Sản phẩm liên quan trên mobile.
- SmartImage xử lý ảnh cache, URL lỗi và timeout; ảnh hover thứ hai chỉ tải khi người dùng hover.
