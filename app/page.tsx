"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Job } from "@/types/jobblocker";
import { fetchJobs } from "@/lib/db/jobs";
import { AppHeader } from "@/components/layout/app-header";
import { JobStatusChip } from "@/components/job/job-status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusCardClass(status: string) {
  if (status === "needs_attention") {
    return "border-red-300 bg-red-50";
  }

  if (status === "waiting_approval") {
    return "border-orange-300 bg-orange-50";
  }

  if (status === "inspection_phase") {
    return "border-blue-300 bg-blue-50";
  }

  if (status === "ready_to_move") {
    return "border-green-300 bg-green-50";
  }

  if (status === "ready_to_close") {
    return "border-emerald-300 bg-emerald-50";
  }

  if (status === "closed") {
    return "border-slate-200 bg-slate-50 opacity-75";
  }

  return "border-slate-200 bg-white";
}

function getStatusMessage(status: string) {
  if (status === "needs_attention") {
    return "Something is blocking this job. Open it and deal with the fire.";
  }

  if (status === "waiting_approval") {
    return "Waiting on approval, paperwork, or somebody else's timeline.";
  }

  if (status === "inspection_phase") {
    return "Inspection work is active.";
  }

  if (status === "ready_to_move") {
    return "Ready for the next field step.";
  }

  if (status === "ready_to_close") {
    return "Ready to close out.";
  }

  if (status === "closed") {
    return "Job finished.";
  }

  return "Active job.";
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "red" | "orange" | "blue" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-300 bg-red-50"
      : tone === "orange"
        ? "border-orange-300 bg-orange-50"
        : tone === "blue"
          ? "border-blue-300 bg-blue-50"
          : tone === "green"
            ? "border-green-300 bg-green-50"
            : "";

  return (
    <Card className={toneClass}>
      <CardContent className="p-4">
        <div className="text-2xl font-black text-slate-950">{value}</div>
        <div className="text-xs font-bold text-slate-600">{label}</div>
      </CardContent>
    </Card>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-4 text-sm text-slate-600">{message}</CardContent>
    </Card>
  );
}

function DashboardJobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} aria-label={`Open job ${job.name}`} className="block">
      <Card className={`transition hover:-translate-y-0.5 hover:shadow-md ${getStatusCardClass(job.status)}`}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-950">{job.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                Customer: {job.customer_name || "No customer set"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {job.job_type || "No job type set"}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{getStatusMessage(job.status)}</p>
            </div>

            <JobStatusChip status={job.status} />
          </div>

          <div className="mt-4 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm text-slate-800">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Next action
            </span>
            <span className="font-semibold">{job.next_action || "Open job to review blockers"}</span>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500">Status: {formatStatus(job.status)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const companyId = process.env.NEXT_PUBLIC_DEMO_COMPANY_ID;
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError("");

        if (!companyId) {
          setError("Missing NEXT_PUBLIC_DEMO_COMPANY_ID in .env.local.");
          return;
        }

        const rows = await fetchJobs(companyId);
        setJobs(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [companyId]);

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const waitingApproval = jobs.filter((job) => job.status === "waiting_approval").length;
    const inspectionPhase = jobs.filter((job) => job.status === "inspection_phase").length;
    const readyToMove = jobs.filter((job) => job.status === "ready_to_move").length;
    const readyToClose = jobs.filter((job) => job.status === "ready_to_close").length;

    return { totalJobs, waitingApproval, inspectionPhase, readyToMove, readyToClose };
  }, [jobs]);

  const lastUpdatedLabel = useMemo(() => {
    if (!jobs.length) {
      return new Date().toLocaleString();
    }

    const latestUpdatedAt = jobs
      .map((job) => job.updated_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return latestUpdatedAt ? new Date(latestUpdatedAt).toLocaleString() : new Date().toLocaleString();
  }, [jobs]);

  const needsAttentionJobs = jobs.filter((job) => job.status === "needs_attention");
  const waitingApprovalJobs = jobs.filter((job) => job.status === "waiting_approval");
  const inspectionJobs = jobs.filter((job) => job.status === "inspection_phase");
  const readyToMoveJobs = jobs.filter((job) => job.status === "ready_to_move");
  const readyToCloseJobs = jobs.filter((job) => job.status === "ready_to_close");
  const recentJobs = jobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-orange-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-950">Today&apos;s Job Flow</h1>
            <p className="mt-1 text-sm text-slate-600">
              What is blocked, waiting, coming up, and ready to move.
            </p>
          </div>

          {!isDemoMode ? (
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/jobs/new">Add Job</Link>
            </Button>
          ) : null}
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">Loading dashboard...</CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-sm text-red-800">{error}</CardContent>
          </Card>
        ) : null}

        {!loading && !error ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-bold text-slate-800">
                  JobBlocker helps small contractors see what is blocked, what is waiting, what is coming up, and what is ready to move.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Track jobs, permits, inspections, notes, and next actions without turning your business into a software project.
                </p>
                <p className="mt-2 text-sm font-semibold text-orange-700">Demo Mode - sample data only.</p>
                <div className="mt-3">
                  <Button asChild variant="outline">
                    <Link href="/app">Go to Working App (coming soon)</Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">Last updated: {lastUpdatedLabel}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Total Jobs" value={stats.totalJobs} />
              <StatCard label="Waiting Approval" value={stats.waitingApproval} tone={stats.waitingApproval > 0 ? "orange" : "default"} />
              <StatCard label="Inspection Phase" value={stats.inspectionPhase} tone={stats.inspectionPhase > 0 ? "blue" : "default"} />
              <StatCard label="Ready to Move" value={stats.readyToMove} tone={stats.readyToMove > 0 ? "green" : "default"} />
              <StatCard label="Ready to Close" value={stats.readyToClose} tone={stats.readyToClose > 0 ? "green" : "default"} />
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-950">Needs Attention</h2>

                <Button asChild variant="outline">
                  <Link href="/jobs">View All Jobs</Link>
                </Button>
              </div>

              <div className="space-y-3">
                {needsAttentionJobs.length ? (
                  needsAttentionJobs.map((job) => <DashboardJobCard key={job.id} job={job} />)
                ) : (
                  <EmptySection message="No jobs marked needs attention. Either you are organized, or the chaos has not checked in yet." />
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-slate-950">Waiting Approval</h2>

              <div className="space-y-3">
                {waitingApprovalJobs.length ? (
                  waitingApprovalJobs.map((job) => <DashboardJobCard key={job.id} job={job} />)
                ) : (
                  <EmptySection message="No jobs waiting approval right now." />
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-slate-950">Inspection Phase</h2>

              <div className="space-y-3">
                {inspectionJobs.length ? (
                  inspectionJobs.map((job) => <DashboardJobCard key={job.id} job={job} />)
                ) : (
                  <EmptySection message="No jobs in inspection phase yet." />
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-slate-950">Ready to Move</h2>

              <div className="space-y-3">
                {readyToMoveJobs.length ? (
                  readyToMoveJobs.map((job) => <DashboardJobCard key={job.id} job={job} />)
                ) : (
                  <EmptySection message="No jobs ready to move yet." />
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-slate-950">Ready to Close</h2>

              <div className="space-y-3">
                {readyToCloseJobs.length ? (
                  readyToCloseJobs.map((job) => <DashboardJobCard key={job.id} job={job} />)
                ) : (
                  <EmptySection message="No jobs ready to close yet." />
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-slate-950">Recently Added</h2>

              <div className="space-y-3">
                {recentJobs.length ? (
                  recentJobs.map((job) => <DashboardJobCard key={job.id} job={job} />)
                ) : (
                  <Card>
                    <CardContent className="p-5 text-center">
                      <h2 className="font-black text-slate-950">No jobs yet.</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Add the first job and JobBlocker starts becoming useful.
                      </p>

                      {!isDemoMode ? (
                        <Button asChild className="mt-3 bg-orange-600 hover:bg-orange-700">
                          <Link href="/jobs/new">Add Job</Link>
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
              <p>JobBlocker™ © 2026. All rights reserved.</p>
              <p className="mt-1">Demo Mode - sample data only.</p>
            </footer>
          </div>
        ) : null}
      </main>
    </div>
  );
}

