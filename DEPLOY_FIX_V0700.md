# V0.70.0 — Vercel SEO build hotfix

Lỗi deployment (commit e47d79a) xảy ra **sau** khi TypeScript, Vite build và SEO prerender hoàn tất. Hai guard kiểm tra phiên bản trong `scripts/check-v664-ai-seo.mjs` và `scripts/check-v665-index-safety.mjs` giới hạn bản release ở các phiên bản 0.66.x / 0.67.0, khiến bản 0.70.0 bị từ chối dù các kiểm tra SEO còn lại vẫn được giữ nguyên.

## Đã thay đổi
- Cả hai script chấp nhận phiên bản SemVer >= 0.66.4 (SEO) và >= 0.66.5 (index safety), bao gồm 0.70.0 và các bản sau.
- Không đổi `package.json`, không tắt hoặc bỏ bất kỳ bước kiểm tra SEO/indexing nào.
- Không chỉnh logic checkout, Member/FOMO, Firebase rules hay giao diện.

## Đã xác minh trong môi trường này
- `node --check` của cả hai script: PASS.
- `node scripts/check-v664-ai-seo.mjs`: PASS kiểm tra ở mức source; do không có `dist/`, chưa xác minh phần HTML sau prerender ở môi trường này.
- `node scripts/check-v665-index-safety.mjs`: PASS.
- `node scripts/check-v666-prerender-flash.mjs`: PASS.
- Regression V0.70 Member/FOMO, V0.69, V0.68; Firebase Rules, responsive-grid và Admin CSS check: PASS.
- Log Vercel do chủ shop cung cấp cho thấy TypeScript/Vite và prerender 1.644 routes hoàn thành trước khi guard phiên bản gây lỗi. Đây KHÔNG phải kết quả full build mới trên source đã sửa.

## Triển khai
Dùng mã nguồn ZIP này để thay mã nguồn trên GitHub, commit/push branch `master`, sau đó redeploy trên Vercel. Nếu chỉ muốn áp hotfix lên repo đang dùng, chỉ cần copy đè **hai file** `scripts/check-v664-ai-seo.mjs` và `scripts/check-v665-index-safety.mjs`. Tránh overwrite cấu hình .env hoặc dữ liệu thực tế.
