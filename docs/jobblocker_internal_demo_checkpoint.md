# JobBlocker Internal Demo Checkpoint

## 1) Current status
- Internal-demo stable.
- Demo data seeded.
- 8 jobs visible.
- App visually checked and looks good.

## 2) Recent completed work
- Company ownership scoped on job detail/status updates.
- Child job data guarded by parent company ownership.
- RLS transition plan documented.
- Customer-safe summary helper added.
- Internal customer-safe preview added.
- Customer-safe rules documented.
- Accessibility labels improved.
- Visible encoding artifacts fixed.
- Minimal job core field editing added.
- Closed jobs display as Finished.
- Internal demo seed SQL added.

## 3) Important caution
- Do not rerun `supabase/demo_seed_internal.local.sql` unless intentionally adding duplicate demo jobs.
- Keep `supabase/demo_seed_internal.local.sql` uncommitted if it contains real company ID.
- Public customer links, auth, RLS, payments, notifications, and integrations are not done.

## 4) Next possible actions
- Record short walkthrough.
- Demo internally.
- Define thin auth/tenant plan.
- Shelf cleanly and return to CoreBond/SNHU/house.
