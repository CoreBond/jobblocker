-- JobBlocker Working App v1
-- current_company_id() function update (documentation / migration capture)
-- -----------------------------------------------------------------------
-- This file documents the function change applied in Supabase.
-- Do not auto-apply without review in your migration workflow.
--
-- Behavior order:
-- 1) Check public.company_memberships first (working-app company context)
-- 2) Fall back to public.profiles.company_id (legacy/demo compatibility)
-- 3) Fall back to the preserved demo UUID
--
-- This preserves compatibility with existing jobs RLS policies that
-- reference public.current_company_id().

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select cm.company_id
      from public.company_memberships cm
      where cm.user_id = auth.uid()
      order by cm.created_at asc
      limit 1
    ),
    (
      select p.company_id
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    '36c00d38-e483-45bd-ba21-7f916d10b30f'::uuid
  );
$$;
