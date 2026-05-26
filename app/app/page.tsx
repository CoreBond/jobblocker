import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/app/app/sign-out-button";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { getStatusLabel } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import type { Inspection, InspectionStatus, Job, Permit, PermitStatus } from "@/types/jobblocker";

function getStatusToneClass(status: Job["status"]) {
  if (status === "needs_attention") return "border-rose-200 bg-rose-50";
  if (status === "waiting_approval") return "border-amber-200 bg-amber-50";
  if (status === "inspection_phase") return "border-indigo-200 bg-indigo-50";
  if (status === "ready_to_move") return "border-emerald-200 bg-emerald-50";
  if (status === "ready_to_close") return "border-teal-200 bg-teal-50";
  if (status === "closed") return "border-slate-300 bg-slate-50";
  return "border-sky-200 bg-sky-50";
}

const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  needed: "Needed",
  submitted: "Submitted",
  waiting_approval: "Waiting Approval",
  approved: "Approved",
  rejected: "Rejected",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  closed: "Closed",
};

const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  needed: "Needed",
  scheduled: "Scheduled",
  passed: "Passed",
  failed: "Failed",
  rescheduled: "Reinspection Needed",
  cancelled: "Cancelled",
};

function getPermitStatusLabel(status: PermitStatus) {
  return PERMIT_STATUS_LABELS[status];
}

function getInspectionStatusLabel(status: InspectionStatus) {
  return INSPECTION_STATUS_LABELS[status];
}

function getJobContextLine(jobId: string, permits: Permit[], inspections: Inspection[]) {
  const jobPermits = permits.filter((permit) => permit.job_id === jobId);
  const jobInspections = inspections.filter((inspection) => inspection.job_id === jobId);

  const failedInspection = jobInspections.find((inspection) => inspection.status === "failed");
  if (failedInspection) {
    return `${failedInspection.inspection_type}: ${getInspectionStatusLabel(failedInspection.status)}`;
  }

  const reinspectionNeeded = jobInspections.find((inspection) => inspection.status === "rescheduled");
  if (reinspectionNeeded) {
    return `${reinspectionNeeded.inspection_type}: ${getInspectionStatusLabel(reinspectionNeeded.status)}`;
  }

  const rejectedPermit = jobPermits.find((permit) => permit.status === "rejected");
  if (rejectedPermit) {
    return `${rejectedPermit.permit_type}: ${getPermitStatusLabel(rejectedPermit.status)}`;
  }

  const expiredPermit = jobPermits.find((permit) => permit.status === "expired");
  if (expiredPermit) {
    return `${expiredPermit.permit_type}: ${getPermitStatusLabel(expiredPermit.status)}`;
  }

  const waitingApprovalPermit = jobPermits.find((permit) => permit.status === "waiting_approval");
  if (waitingApprovalPermit) {
    return `${waitingApprovalPermit.permit_type}: ${getPermitStatusLabel(waitingApprovalPermit.status)}`;
  }

  const submittedPermit = jobPermits.find((permit) => permit.status === "submitted");
  if (submittedPermit) {
    return `${submittedPermit.permit_type}: ${getPermitStatusLabel(submittedPermit.status)}`;
  }

  const scheduledInspection = jobInspections.find((inspection) => inspection.status === "scheduled");
  if (scheduledInspection) {
    return `${scheduledInspection.inspection_type}: ${getInspectionStatusLabel(scheduledInspection.status)}`;
  }

  return null;
}

function getLatestPermit(jobId: string, permits: Permit[]) {
  const jobPermits = permits.filter((permit) => permit.job_id === jobId);
  if (jobPermits.length === 0) {
    return null;
  }

  return [...jobPermits].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    return bTime - aTime;
  })[0];
}

function getLatestInspection(jobId: string, inspections: Inspection[]) {
  const jobInspections = inspections.filter((inspection) => inspection.job_id === jobId);
  if (jobInspections.length === 0) {
    return null;
  }

  return [...jobInspections].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    return bTime - aTime;
  })[0];
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "warning" | "inspection" | "success" | "muted";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-200 bg-rose-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : tone === "inspection"
          ? "border-indigo-200 bg-indigo-50"
          : tone === "success"
            ? "border-emerald-200 bg-emerald-50"
            : tone === "muted"
              ? "border-slate-300 bg-slate-50"
              : "border-sky-200 bg-sky-50";

  return (
    <Card>
      <CardContent className="p-4">
        <div className={`rounded-xl border px-3 py-3 ${toneClass}`}>
          <div className="text-2xl font-black text-slate-950">{value}</div>
          <div className="text-xs font-bold text-slate-600">{label}</div>
        </div>
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
  const jobIds = jobs.map((job) => job.id);
  const { data: permitsData } = jobIds.length
    ? await supabase
        .from("permits")
        .select("job_id, permit_type, status, created_at, updated_at")
        .in("job_id", jobIds)
    : { data: [] as Permit[] };
  const { data: inspectionsData } = jobIds.length
    ? await supabase
        .from("inspections")
        .select("job_id, inspection_type, status, created_at, updated_at")
        .in("job_id", jobIds)
    : { data: [] as Inspection[] };
  const permits = (permitsData ?? []) as Permit[];
  const inspections = (inspectionsData ?? []) as Inspection[];
  const totalJobs = jobs.length;
  const needsAttention = jobs.filter((job) => job.status === "needs_attention").length;
  const waitingApproval = jobs.filter((job) => job.status === "waiting_approval").length;
  const inspectionPhase = jobs.filter((job) => job.status === "inspection_phase").length;
  const readyToMove = jobs.filter((job) => job.status === "ready_to_move").length;
  const closedJobs = jobs.filter((job) => job.status === "closed").length;
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
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  <StatCard label="Total Jobs" value={totalJobs} tone="neutral" />
                  <StatCard label="Needs Attention" value={needsAttention} tone="danger" />
                  <StatCard label="Waiting Approval" value={waitingApproval} tone="warning" />
                  <StatCard label="Inspection Phase" value={inspectionPhase} tone="inspection" />
                  <StatCard label="Ready to Move" value={readyToMove} tone="success" />
                  <StatCard label="Closed Jobs" value={closedJobs} tone="muted" />
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
                          className={`block rounded-xl border p-3 text-sm transition hover:shadow-sm ${getStatusToneClass(job.status)}`}
                        >
                          {(() => {
                            const latestPermit = getLatestPermit(job.id, permits);
                            const latestInspection = getLatestInspection(job.id, inspections);
                            return (
                              <>
                                <p className="font-black text-slate-900">{job.customer_name || job.name}</p>
                                <p className="text-slate-700">Job: {job.name}</p>
                                {job.job_address ? <p className="text-xs text-slate-600">{job.job_address}</p> : null}
                                {latestPermit ? (
                                  <p className="text-slate-600">
                                    Permit: {latestPermit.permit_type}, {getPermitStatusLabel(latestPermit.status)}
                                  </p>
                                ) : null}
                                {latestInspection ? (
                                  <p className="text-slate-600">
                                    Inspection: {latestInspection.inspection_type},{" "}
                                    {getInspectionStatusLabel(latestInspection.status)}
                                  </p>
                                ) : null}
                                {job.next_action ? <p className="text-slate-700">Reminder: {job.next_action}</p> : null}
                              </>
                            );
                          })()}
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
                          className={`block rounded-xl border p-3 text-sm transition hover:shadow-sm ${getStatusToneClass(job.status)}`}
                        >
                          {(() => {
                            const latestPermit = getLatestPermit(job.id, permits);
                            const latestInspection = getLatestInspection(job.id, inspections);
                            return (
                              <>
                                <p className="font-black text-slate-900">{job.customer_name || job.name}</p>
                                <p className="text-slate-700">Job: {job.name}</p>
                                {job.job_address ? <p className="text-xs text-slate-600">{job.job_address}</p> : null}
                                {latestPermit ? (
                                  <p className="text-slate-600">
                                    Permit: {latestPermit.permit_type}, {getPermitStatusLabel(latestPermit.status)}
                                  </p>
                                ) : null}
                                {latestInspection ? (
                                  <p className="text-slate-600">
                                    Inspection: {latestInspection.inspection_type},{" "}
                                    {getInspectionStatusLabel(latestInspection.status)}
                                  </p>
                                ) : null}
                                {job.next_action ? <p className="text-slate-700">Reminder: {job.next_action}</p> : null}
                              </>
                            );
                          })()}
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
