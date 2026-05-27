import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { createClient } from "@/lib/supabase/server";

type CreateJobPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

async function createWorkingJob(formData: FormData) {
  "use server";

  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  if (!context.companyId) {
    redirect("/app/jobs/new?error=Company+setup+is+required+before+creating+jobs.");
  }

  const name = String(formData.get("name") || "").trim();
  const customerName = String(formData.get("customer_name") || "").trim();
  const customerPhone = String(formData.get("customer_phone") || "").trim();
  const customerEmail = String(formData.get("customer_email") || "").trim();
  const jobAddress = String(formData.get("job_address") || "").trim();
  const jobType = String(formData.get("job_type") || "").trim();
  const nextAction = String(formData.get("next_action") || "").trim();
  const statusRaw = String(formData.get("status") || "").trim();
  const status = statusRaw || "active";

  if (!name) {
    redirect("/app/jobs/new?error=Job+name+is+required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("jobs").insert({
    company_id: context.companyId,
    name,
    customer_name: customerName || null,
    customer_phone: customerPhone || null,
    customer_email: customerEmail || null,
    job_address: jobAddress || null,
    job_type: jobType || null,
    status,
    next_action: nextAction || "Review job details.",
  });

  if (error) {
    redirect(`/app/jobs/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app/jobs");
}

export default async function WorkingAppNewJobPage({ searchParams }: CreateJobPageProps) {
  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = resolvedSearchParams?.error || "";

  if (!context.companyId) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AppHeader />

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-bold text-orange-700">Working App</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">Create Job</h1>
              <p className="mt-2 text-sm text-slate-700">
                Logged in as: {context.email || "unknown user"}
              </p>
              <p className="mt-2 text-sm text-slate-700">Company: Not configured yet</p>
              <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Company setup is needed before real job data can be connected.
              </p>

              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/app/jobs">Back to Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Create Job</h1>
            <p className="mt-2 text-sm text-slate-700">
              Company: {context.companyName || context.companyId}
            </p>

            {errorMessage ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {errorMessage}
              </p>
            ) : null}

            <form action={createWorkingJob} className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Customer</p>

                <div className="mt-2 space-y-3">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Customer name</span>
                    <Input name="customer_name" placeholder="Smith Family" />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Job address / location</span>
                    <Input name="job_address" placeholder="123 Main St, Denver, CO" />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Customer phone (optional)</span>
                    <Input name="customer_phone" placeholder="(303) 555-0100" />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Customer email (optional)</span>
                    <Input name="customer_email" type="email" placeholder="customer@example.com" />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Job Details</p>

                <div className="mt-2 space-y-3">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Job name</span>
                    <Input name="name" placeholder="Kitchen Remodel - Smith" required />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Job type (optional)</span>
                    <Input name="job_type" placeholder="Residential Remodel" />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Next action</span>
                    <Input name="next_action" defaultValue="Review job details." />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Create Job
                </Button>
                <Button asChild variant="outline">
                  <Link href="/app/jobs">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
