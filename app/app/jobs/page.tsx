import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/types/jobblocker";

export default async function WorkingAppJobsPage() {
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
              <h1 className="mt-1 text-3xl font-black text-slate-950">Jobs</h1>
              <p className="mt-2 text-sm text-slate-700">
                Logged in as: {context.email || "unknown user"}
              </p>
              <p className="mt-2 text-sm text-slate-700">Company: Not configured yet</p>
              <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Company setup is needed before real job data can be connected.
              </p>

              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/app">Back to Working App</Link>
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
    .eq("company_id", context.companyId)
    .order("created_at", { ascending: false });

  const jobs = (data ?? []) as Job[];

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Jobs</h1>
            <p className="mt-2 text-sm text-slate-700">
              Company: {context.companyName || context.companyId}
            </p>
            <div className="mt-4">
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/app/jobs/new">Create Job</Link>
              </Button>
            </div>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Failed to load jobs: {error.message}
              </p>
            ) : null}

            {!error && jobs.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="font-black text-slate-950">No real jobs yet.</p>
                <p className="mt-1 text-sm text-slate-600">Create job will come next.</p>
                <div className="mt-3">
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <Link href="/app/jobs/new">Create Job</Link>
                  </Button>
                </div>
              </div>
            ) : null}

            {!error && jobs.length > 0 ? (
              <div className="mt-4 space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-lg font-black text-slate-950">{job.name}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Customer: {job.customer_name || "Not set"}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">Status: {job.status || "Not set"}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Next action: {job.next_action || "Not set"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/app">Back to Working App</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
