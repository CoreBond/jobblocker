import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { updateJobCoreFieldsServer } from "@/lib/db/jobs-server";
import { getStatusLabel } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/types/jobblocker";

type EditJobPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

const ALLOWED_STATUSES: JobStatus[] = [
  "active",
  "needs_attention",
  "waiting_approval",
  "inspection_phase",
  "ready_to_move",
  "ready_to_close",
  "closed",
];

async function updateWorkingJob(formData: FormData) {
  "use server";

  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  if (!context.companyId) {
    redirect("/app/jobs?error=Company+setup+is+required+before+editing+jobs.");
  }

  const jobId = String(formData.get("job_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const customerName = String(formData.get("customer_name") || "").trim();
  const customerPhone = String(formData.get("customer_phone") || "").trim();
  const customerEmail = String(formData.get("customer_email") || "").trim();
  const jobType = String(formData.get("job_type") || "").trim();
  const jobAddress = String(formData.get("job_address") || "").trim();
  const jobCompanyId = String(formData.get("job_company_id") || "").trim();
  const status = String(formData.get("status") || "").trim() as JobStatus;
  const nextAction = String(formData.get("next_action") || "").trim();

  if (!jobId) {
    console.error("[WorkingAppEditJob] updateWorkingJob early redirect: missing job id");
    redirect("/app/jobs?error=Missing+job+id.");
  }

  if (!name) {
    console.error("[WorkingAppEditJob] updateWorkingJob early redirect: missing required job fields", {
      jobId,
      hasName: Boolean(name),
    });
    redirect(`/app/jobs/${jobId}/edit?error=Job+name+is+required.`);
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    console.error("[WorkingAppEditJob] updateWorkingJob early redirect: invalid status selected", {
      jobId,
      status,
    });
    redirect(`/app/jobs/${jobId}/edit?error=Invalid+status+selected.`);
  }

  if (!jobCompanyId) {
    console.error("[WorkingAppEditJob] updateWorkingJob early redirect: missing job company context", {
      jobId,
      jobCompanyId,
    });
    redirect(`/app/jobs/${jobId}/edit?error=Missing+job+company+context.`);
  }

  try {
    await updateJobCoreFieldsServer(jobId, jobCompanyId, {
      name,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      job_type: jobType,
      job_address: jobAddress,
      next_action: nextAction,
    });
  } catch (error) {
    console.error("[WorkingAppEditJob] core update failed", error);
    const message = error instanceof Error ? error.message : "Failed to update job.";
    redirect(`/app/jobs/${jobId}/edit?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({
      status,
    })
    .eq("id", jobId)
    .eq("company_id", jobCompanyId)
    .select("id");

  if (error) {
    console.error("[WorkingAppEditJob] status update failed", error);
    redirect(`/app/jobs/${jobId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/app/jobs/${jobId}`);
}

export default async function WorkingAppEditJobPage({ params, searchParams }: EditJobPageProps) {
  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  const { id } = await params;
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
              <h1 className="mt-1 text-3xl font-black text-slate-950">Edit Job</h1>
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("company_id", context.companyId)
    .maybeSingle();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AppHeader />

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-bold text-orange-700">Working App</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">Job not found</h1>
              <p className="mt-2 text-sm text-slate-600">
                This job does not exist for your company, or the link is incorrect.
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
            <h1 className="mt-1 text-3xl font-black text-slate-950">Edit Job</h1>
            <p className="mt-2 text-sm text-slate-700">
              Company: {context.companyName || context.companyId}
            </p>

            {errorMessage ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {errorMessage}
              </p>
            ) : null}

            <form action={updateWorkingJob} className="mt-4 space-y-3">
              <input type="hidden" name="job_id" value={id} />
              <input type="hidden" name="job_company_id" value={data.company_id} />

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Job name</span>
                <Input name="name" defaultValue={data.name || ""} required />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Customer name</span>
                <Input name="customer_name" defaultValue={data.customer_name || ""} />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Customer phone</span>
                <Input name="customer_phone" defaultValue={data.customer_phone || ""} />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Customer email</span>
                <Input name="customer_email" type="email" defaultValue={data.customer_email || ""} />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Job type</span>
                <Input name="job_type" defaultValue={data.job_type || ""} />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Job address / location</span>
                <Input name="job_address" defaultValue={data.job_address || ""} />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Status</span>
                <select
                  name="status"
                  defaultValue={data.status || "active"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {ALLOWED_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {getStatusLabel(statusOption)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Next action</span>
                <Input name="next_action" defaultValue={data.next_action || ""} />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Save Job
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/app/jobs/${id}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
