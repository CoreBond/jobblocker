-- JobBlocker Working App v1: company/user context foundation (PROPOSAL ONLY)
-- ------------------------------------------------------------------------
-- This file is a proposal for review.
-- Do NOT auto-apply in production without review.
-- Keeps scope intentionally small for small-business multi-user access.

-- ============================================================
-- 1) SAFE TO APPLY NOW
-- ============================================================

-- 1.1) Companies
-- Purpose: top-level tenant record used by company-scoped jobs.
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2) Company memberships
-- Purpose: link authenticated Supabase users to one company.
-- Role is intentionally simple in v1: owner, manager, member.
create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint company_memberships_role_check check (role in ('owner', 'manager', 'member')),
  constraint company_memberships_company_user_unique unique (company_id, user_id)
);

-- 1.3) Membership indexes
-- For fast user->memberships and company->memberships lookups.
create index if not exists idx_company_memberships_user_id
  on public.company_memberships(user_id);

create index if not exists idx_company_memberships_company_id
  on public.company_memberships(company_id);

-- 1.4) RLS on new tables only
-- Enable RLS on new tables and add minimal read policies.
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;

-- Authenticated users can read their own membership rows.
drop policy if exists "Members can read own memberships" on public.company_memberships;
create policy "Members can read own memberships"
  on public.company_memberships
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can read companies where they have membership.
drop policy if exists "Members can read own companies" on public.companies;
create policy "Members can read own companies"
  on public.companies
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2) REVIEW BEFORE APPLYING TO JOBS
-- ============================================================
-- IMPORTANT:
-- Demo routes currently depend on public jobs access filtered by
-- NEXT_PUBLIC_DEMO_COMPANY_ID in app code. Review all jobs changes
-- below before applying so demo mode remains stable.

-- 2.1) Optional jobs company index (only if missing).
-- Safe to run even if it already exists because of IF NOT EXISTS.
create index if not exists idx_jobs_company_id
  on public.jobs(company_id);

-- 2.2) Jobs RLS policy proposal
-- Authenticated users can access jobs where jobs.company_id matches
-- one of their company memberships.
drop policy if exists "Members can access company jobs" on public.jobs;
create policy "Members can access company jobs"
  on public.jobs
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = jobs.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = jobs.company_id
        and cm.user_id = auth.uid()
    )
  );

-- 2.3) Optional explicit jobs RLS enablement step
-- Review impact on existing demo flows before enabling.
-- alter table public.jobs enable row level security;

-- 2.4) Optional future FK hardening on jobs.company_id
-- If/when jobs data is clean and companies is fully adopted,
-- consider enforcing jobs.company_id -> companies.id FK.
-- Keep commented for now to avoid unexpected migration risk.
--
-- alter table public.jobs
--   add constraint jobs_company_id_fkey
--   foreign key (company_id)
--   references public.companies(id);

-- 3) Example seed snippets (manual, for review/testing)
-- Replace UUIDs with real values from your Supabase project.
--
-- Example A: create one company.
-- insert into public.companies (id, name)
-- values ('11111111-1111-1111-1111-111111111111', 'Acme Contracting LLC');
--
-- Example B: connect one existing auth user as owner.
-- insert into public.company_memberships (company_id, user_id, role)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
--   'owner'
-- );
--
-- Example C: add another user as manager.
-- insert into public.company_memberships (company_id, user_id, role)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
--   'manager'
-- );
--
-- Example D: add another user as member.
-- insert into public.company_memberships (company_id, user_id, role)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'cccccccc-cccc-cccc-cccc-cccccccccccc',
--   'member'
-- );
