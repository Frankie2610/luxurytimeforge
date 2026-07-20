# Firebase + CSV — Sprint 49.13

## 1. Schema catalog

Sản phẩm được lưu trong Firebase Realtime Database theo SKU:

```text
timeforge
└── products
    ├── VE3F00122
    │   ├── id: "VE3F00122"
    │   ├── sku: "VE3F00122"
    │   ├── title: "Đồng Hồ Nữ Medusa Infinite"
    │   ├── images
    │   │   ├── 0: "https://.../VE3F00122_1.png"
    │   │   └── 1: "https://.../VE3F00122_2.png"
    │   ├── price: 19600000
    │   ├── compareAtPrice: 39200000
    │   └── inventory: 5
    └── SFKZ00726
```

### Quy tắc SKU

- SKU là bắt buộc.
- SKU đồng thời là `product.id` và Firebase node key.
- Không dùng các ký tự bị Firebase cấm trong key:

```text
. # $ [ ] /
```

Ví dụ hợp lệ:

```text
VE3F00122
SFKZ00726
GW0555L2
```

## 2. Tạo Firebase project

Trong Firebase Console:

1. Tạo project.
2. Thêm **Web App**.
3. Mở **Realtime Database** và tạo database.
4. Mở **Authentication** và bật phương thức đăng nhập dùng cho Admin, thường là Email/Password hoặc Google.
5. Sao chép cấu hình Web App vào `.env.local`.

Tạo file `.env.local` từ `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

Điền:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_OWNER_EMAIL=owner@your-domain.com
VITE_ADMIN_EMAILS=owner@your-domain.com,staff@your-domain.com
VITE_ADMIN_ROLE_MAP=owner@your-domain.com:owner,staff@your-domain.com:staff
```

Khởi động lại Vite sau khi sửa `.env.local`.

## 3. Deploy Firebase Rules

Rules đã chuẩn bị tại:

```text
firebase.rules.json
```

Cài và đăng nhập Firebase CLI bằng pnpm:

```powershell
corepack.cmd pnpm dlx firebase-tools login
corepack.cmd pnpm dlx firebase-tools use --add
corepack.cmd pnpm dlx firebase-tools deploy --only database
```

Rules hiện tại:

- Catalog sản phẩm được đọc công khai để storefront hoạt động.
- Chỉ tài khoản đã đăng nhập mới được tạo/sửa/xóa sản phẩm.
- Node sản phẩm phải có `id` và `sku` trùng với key `{SKU}`.
- Dữ liệu Admin như customers/orders/theme draft yêu cầu đăng nhập.

## 4. Chuẩn bị CSV

File mẫu:

```text
templates/luxury-timeforge-products-template.csv
```

Các cột chính:

| Cột | Bắt buộc | Ghi chú |
|---|---:|---|
| SKU | Có | ID duy nhất và Firebase key |
| Tên sản phẩm | Có | Tên hiển thị |
| Thương hiệu | Nên có | VERSACE, FERRAGAMO... |
| Giá bán | Có | Chỉ dùng số hoặc định dạng tiền phổ biến |
| Giá gốc | Không | Dùng để tính giảm giá |
| Số lượng | Không | Tồn kho, mặc định 0 |
| Hình ảnh 1...n | Nên có | URL ảnh trực tiếp |
| Mô tả sản phẩm | Không | Text hoặc HTML |
| Trạng thái | Không | `active`, `draft`, `archived` |

Importer cũng nhận các header phổ biến khác như:

```text
Variant SKU
Product Name
Vendor
Variant Price
Variant Compare At Price
Variant Inventory Qty
Image Src
Image URL
```

### URL hình ảnh

- Mỗi cột có thể chứa một URL.
- Một ô cũng có thể chứa nhiều URL ngăn cách bằng dấu phẩy, chấm phẩy, dấu `|` hoặc xuống dòng.
- Nên dùng URL HTTPS công khai.
- URL hình ảnh trong CSV được giữ nguyên, không upload lại Firebase Storage.

## 5. Import trong Admin

1. Chạy ứng dụng và đăng nhập Admin.
2. Vào **Nhập / xuất**.
3. Chọn file CSV.
4. Kiểm tra preview:
   - số dòng;
   - số sản phẩm;
   - cảnh báo thiếu SKU/ảnh;
   - đường dẫn `timeforge/products/{SKU}`.
5. Chọn:
   - **Gộp dữ liệu**: cập nhật SKU đã có, thêm SKU mới;
   - **Thay toàn bộ catalog**: thay toàn bộ danh sách sản phẩm.
6. Xác nhận import.

Sau import, kiểm tra Firebase Realtime Database:

```text
timeforge/products
```

## 6. Cách cập nhật dữ liệu

- Tạo/chỉnh một sản phẩm: ghi đúng `timeforge/products/{SKU}`.
- Đổi SKU: tạo node SKU mới và xóa node SKU cũ.
- Xóa nhiều sản phẩm: dùng multi-location update để xóa các node SKU trong một lần gọi.
- Import gộp/thay toàn bộ: canonicalize sản phẩm trước khi đồng bộ.

## 7. Checklist trước khi import dữ liệu thật

- [ ] SKU không trùng nhau.
- [ ] SKU không chứa `. # $ [ ] /`.
- [ ] Giá bán và tồn kho là số.
- [ ] URL ảnh truy cập công khai.
- [ ] Cột trạng thái đúng ý định đăng bán.
- [ ] Đã backup CSV gốc.
- [ ] Firebase Rules đã deploy.
- [ ] Tài khoản Admin đăng nhập thành công.
