# JobBlocker RLS/Auth Transition Notes

## 1) Current demo-mode ownership model
- `NEXT_PUBLIC_DEMO_COMPANY_ID` is the current tenant/company selector.
- `jobs` and `activity_log` include `company_id`.
- `permits`, `inspections`, and `notes` are protected through parent job ownership checks.

## 2) Current app tables
- `jobs`
- `activity_log`
- `permits`
- `inspections`
- `notes`

## 3) Future RLS direction
- `jobs` and `activity_log` should be company-scoped directly by `company_id`.
- Child tables should be protected through `EXISTS` checks against the parent `jobs` table.
- Enable only `SELECT` / `INSERT` / `UPDATE` policies needed by the current app first.
- Add `DELETE` policies later only if the product actually needs delete behavior.

## 4) Auth transition caution
- Replace public demo company ID authorization with a real tenant/company claim or membership mapping.
- Do not trust client-provided `company_id` once auth is active.
- Server-side routes should enforce tenant ownership before writes.

## 5) KISS principle
- Keep this simple for small businesses.
- Avoid enterprise permission complexity until paid tiers or real customer requirements justify it.
