# Test Report — Sprint 25

## Kết quả

- `npm ci`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm audit --omit=dev`: 0 vulnerability.
- `npm run css:audit`: pass.

## Route checks

Các route sau trả HTTP 200 qua Vite Preview:

- `/`
- `/collections`
- `/products/versace-medusa-eclipse-ve5f00126`
- `/blogs`
- `/cart`
- `/admin/login`
- `/admin`
- `/admin/products`
- `/admin/orders`
- `/admin/customers`
- `/admin/online-store`

## CSS production

- CSS chung: khoảng 388.6 KB.
- CSS storefront lazy chunk: khoảng 22.3 KB.
- CSS Admin lazy chunk: khoảng 20.4 KB.
- CSS Theme Editor lazy chunk: khoảng 2.8 KB.

V24 đưa phần V24 storefront/Admin vào CSS chung. V25 tách chúng khỏi entry CSS, nên từng route chỉ tải chunk tương ứng.

## Giới hạn kiểm thử

Chromium headless trong môi trường build tiếp tục bị treo khi truy cập loopback, nên không dùng screenshot tự động làm bằng chứng pixel-perfect. Kết quả dựa trên TypeScript, production build, route runtime, CSS audit và rà breakpoint trong source.
