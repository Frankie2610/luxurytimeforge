# V0.68.x — Product Operations / BPM Release Center

## Mục tiêu
Biến dữ liệu vận hành thành workflow Product Operations có thể dùng thật thay vì thêm một dashboard chỉ để xem số.

## Tính năng
- Business-impact triage: payment exception, fulfillment SLA, referral fraud/reward review và low-stock risk.
- Revenue-at-risk signal lấy từ trạng thái order hiện tại.
- UAT checklist theo Critical / High / Medium và release-readiness score.
- Release decision gate: `BLOCKED`, `RISK ACCEPTANCE`, hoặc `READY`.
- Change management: release candidate, owner, rollback plan, business sign-off, support readiness, measurement plan.
- BPM As-is → To-be board: mỗi cải tiến có pain point, trạng thái mục tiêu và KPI đo lường.
- Responsive desktop, tablet và mobile 360px-class.

## Fit JD1 — BPM / AI Transformation
- Process discovery từ exception thực tế.
- As-is → To-be workflow redesign.
- Human-in-the-loop governance cho referral fraud và exception.
- KPI / adoption / measurement planning.
- Change management và rollback planning.

## Fit JD3 — Product Operations
- Triage theo business impact thay vì thứ tự ticket.
- UAT / edge-case coverage và release readiness.
- SLA visibility và support readiness.
- Release governance có blocker, risk acceptance và rollback.

## Persistence
UAT, release-control và process-improvement state dùng first-party localStorage để giữ trạng thái admin nhẹ. Các operational metric chính được tính trực tiếp từ commerce state hiện tại.
