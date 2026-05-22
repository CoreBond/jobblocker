import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/app/app/sign-out-button";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { getStatusLabel } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/types/jobblocker";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-black text-slate-950">{value}</div>
        <div className="text-xs font-bold text-slate-600">{label}</div>
      </CardContent>
    </Card>
  );
}

export default async function WorkingAppLandingPage() {
  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data } = context.companyId
    ? await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", context.companyId)
        .order("created_at", { ascending: false })
    : { data: [] as Job[] };

  const jobs = (data ?? []) as Job[];
  const totalJobs = jobs.length;
  const needsAttention = jobs.filter((job) => job.status === "needs_attention").length;
  const waitingApproval = jobs.filter((job) => job.status === "waiting_approval").length;
  const inspectionPhase = jobs.filter((job) => job.status === "inspection_phase").length;
  const readyToMove = jobs.filter((job) => job.status === "ready_to_move").length;
  const recentJobs = jobs.slice(0, 5);
  const nextActionJobs = jobs.filter((job) => Boolean(job.next_action?.trim())).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-700">
              Logged in as: {context.email || "unknown user"}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Company: {context.companyName || context.companyId || "Not configured yet"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Live company job flow overview.
            </p>
            {context.missingContext ? (
              <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Company setup is needed before real job data can be connected.
              </p>
            ) : null}

            <div className="mt-4">
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/app/jobs">View Jobs</Link>
              </Button>
            </div>

            {!context.missingContext ? (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  <StatCard label="Total Jobs" value={totalJobs} />
                  <StatCard label="Needs Attention" value={needsAttention} />
                  <StatCard label="Waiting Approval" value={waitingApproval} />
                  <StatCard label="Inspection Phase" value={inspectionPhase} />
                  <StatCard label="Ready to Move" value={readyToMove} />
                </div>

                <section>
                  <h2 className="text-lg font-black text-slate-950">Recent Jobs</h2>
                  <div className="mt-3 space-y-2">
                    {recentJobs.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                        No jobs yet.
                      </p>
                    ) : (
                      recentJobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/app/jobs/${job.id}`}
                          className="block rounded-xl border border-slate-200 bg-white p-3 text-sm transition hover:shadow-sm"
                        >
                          <p className="font-black text-slate-900">{job.customer_name || job.name}</p>
                          <p className="text-slate-700">Job: {job.name}</p>
                          <p className="text-slate-600">Status: {getStatusLabel(job.status)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-black text-slate-950">Next Actions</h2>
                  <div className="mt-3 space-y-2">
                    {nextActionJobs.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                        No next actions queued.
                      </p>
                    ) : (
                      nextActionJobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/app/jobs/${job.id}`}
                          className="block rounded-xl border border-slate-200 bg-white p-3 text-sm transition hover:shadow-sm"
                        >
                          <p className="font-black text-slate-900">{job.customer_name || job.name}</p>
                          <p className="text-slate-700">{job.next_action}</p>
                          <p className="text-slate-600">Status: {getStatusLabel(job.status)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </section>
              </div>
            ) : null}

            <div className="mt-4">
              <SignOutButton />
            </div>

            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/">Back to Demo Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
