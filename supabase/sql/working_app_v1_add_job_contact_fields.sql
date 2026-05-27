alter table public.jobs
  add column if not exists customer_phone text;

alter table public.jobs
  add column if not exists customer_email text;
