import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/types/jobblocker";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

export default async function WorkingAppJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  if (!context.companyId) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AppHeader />

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-bold text-orange-700">Working App</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">Job Detail</h1>
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

  const { id } = await params;
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

  const job = data as Job;

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">
              {job.customer_name || job.name}
            </h1>
            <p className="mt-2 text-sm text-slate-700">Job: {job.name}</p>
            <p className="mt-1 text-sm text-slate-700">Job type: {job.job_type || "Not set"}</p>
            <p className="mt-1 text-sm text-slate-700">Status: {job.status || "Not set"}</p>
            <p className="mt-1 text-sm text-slate-700">
              Next action: {job.next_action || "Not set"}
            </p>
            <p className="mt-1 text-sm text-slate-700">Created: {formatDateTime(job.created_at)}</p>
            <p className="mt-1 text-sm text-slate-700">Updated: {formatDateTime(job.updated_at)}</p>

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
