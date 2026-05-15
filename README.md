# JobBlocker App Scaffold v1

This is the first real app scaffold for JobBlocker.

It is intentionally boring:
- Next.js App Router
- TypeScript
- Tailwind
- Supabase client/server helpers
- Basic Jobs CRUD starter
- Local UI components, no shadcn install required yet

## What this scaffold proves

First real build goal:

```txt
Create Job → Save to Supabase → Fetch Jobs → Render Jobs List
```

No Pro features yet. No Stripe yet. No file upload yet. No pretending we are Procore with a haircut.

## Setup

Create a Next app first:

```bash
npx create-next-app@latest jobblocker --typescript --eslint --app --tailwind --src-dir false --import-alias "@/*"
cd jobblocker
```

Install Supabase packages:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Copy the files from this scaffold into the project root.

## Environment

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEMO_COMPANY_ID=your_test_company_uuid
```

## Important

The schema uses company-owned records. For the first dev pass, create a test company in Supabase and paste that UUID into `NEXT_PUBLIC_DEMO_COMPANY_ID`.

Later, we replace that with real auth/company onboarding.

## Run

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Next build steps

1. Run `jobblocker_schema_v1.sql` in Supabase.
2. Insert one test company.
3. Put that company UUID in `.env.local`.
4. Run app.
5. Create a job.
6. See it appear in Jobs list.

That is the engine starting.
