JobBlocker v0.4 Dashboard Patch

Files included:
- app/page.tsx

What it does:
- Replaces the marketing homepage with a real Supabase-backed dashboard.
- Fetches jobs for NEXT_PUBLIC_DEMO_COMPANY_ID.
- Shows real counts:
  - Active Jobs
  - Needs Attention
  - Waiting Approval
  - Inspection Phase
  - Ready to Move
- Shows matching job sections.
- Uses existing JobCard component.

Install:
1. Copy app/page.tsx into H:\JobBlocker\jobblocker\app\page.tsx
2. Restart dev server.
3. Open http://localhost:3000

Test:
- Create jobs.
- Change statuses manually in Supabase for now if needed.
- Confirm Dashboard reflects real database rows.
