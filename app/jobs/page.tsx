"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job } from "@/types/jobblocker";
import { fetchJobs } from "@/lib/db/jobs";
import { AppHeader } from "@/components/layout/app-header";
import { JobStatusChip } from "@/components/job/job-status-chip";
import { getStatusLabel } from "@/lib/job-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getJobCardClass(status: string) {
  if (status === "needs_attention") {
    return "border-red-300 bg-red-50";
  }

  if (status === "waiting_approval") {
    return "border-orange-300 bg-orange-50";
  }

  if (status === "inspection_phase") {
    return "border-blue-300 bg-blue-50";
  }

  if (status === "ready_to_close") {
    return "border-green-300 bg-green-50";
  }

  if (status === "closed") {
    return "border-slate-200 bg-slate-50 opacity-75";
  }

  return "border-slate-200 bg-white";
}

function getJobStatusMessage(status: string) {
  if (status === "needs_attention") {
    return "Needs attention before this job moves cleanly.";
  }

  if (status === "waiting_approval") {
    return "Waiting on approval or paperwork.";
  }

  if (status === "inspection_phase") {
    return "Inspection phase active.";
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


const STATUS_PRIORITY: Record<string, number> = {
  needs_attention: 1,
  waiting_approval: 2,
  inspection_phase: 3,
  active: 4,
  ready_to_move: 5,
  ready_to_close: 6,
  closed: 7,
};

function sortJobsByPriority(jobs: Job[]) {
  return [...jobs].sort((a, b) => {
    const statusDifference = (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return a.name.localeCompare(b.name);
  });
}

const ATTENTION_QUEUE_STATUSES: Job["status"][] = [
  "needs_attention",
  "waiting_approval",
  "inspection_phase",
];

function buildAttentionQueue(jobs: Job[]) {
  return ATTENTION_QUEUE_STATUSES.map((status) => ({
    status,
    label: getStatusLabel(status),
    count: jobs.filter((job) => job.status === status).length,
  }));
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const companyId = process.env.NEXT_PUBLIC_DEMO_COMPANY_ID;
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  useEffect(() => {
    async function loadJobs() {
      try {
        if (!companyId) {
          setError("Missing NEXT_PUBLIC_DEMO_COMPANY_ID in .env.local.");
          return;
        }

        const rows = await fetchJobs(companyId);
        setJobs(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs.");
      }
    }

    loadJobs();
  }, [companyId]);

  const openJobs = jobs.filter((job) => job.status !== "closed").length;
  const attentionJobs = jobs.filter((job) => job.status === "needs_attention").length;
  const inspectionJobs = jobs.filter((job) => job.status === "inspection_phase").length;
  const readyToCloseJobs = jobs.filter((job) => job.status === "ready_to_close").length;
  const attentionQueue = buildAttentionQueue(jobs);
  const sortedJobs = sortJobsByPriority(jobs);

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Jobs</h1>
            <p className="text-sm text-slate-600">Active jobs and their next permit or inspection step.</p>
          </div>

          {!isDemoMode ? (
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/jobs/new">Add Job</Link>
            </Button>
          ) : null}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Open Jobs</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{openJobs}</p>
            </CardContent>
          </Card>

          <Card className={attentionJobs > 0 ? "border-red-300 bg-red-50" : ""}>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Needs Attention</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{attentionJobs}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Inspection Phase</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{inspectionJobs}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ready to Close</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{readyToCloseJobs}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4 border-orange-200 bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Attention Queue</p>
                <h2 className="text-lg font-black text-slate-950">What needs eyes first</h2>
              </div>
              <p className="text-xs font-semibold text-slate-500">Sorted by urgency below.</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {attentionQueue.map((item) => (
                <div
                  key={item.status}
                  className={`rounded-xl border p-3 ${
                    item.count > 0 ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-black text-slate-950">{item.label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{item.count}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.count === 1 ? "job" : "jobs"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
          </Card>
        ) : null}

        <div className="space-y-3">
          {sortedJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} aria-label={`Open job ${job.name}`} className="block">
              <Card className={`transition hover:-translate-y-0.5 hover:shadow-md ${getJobCardClass(job.status)}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{job.name}</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        Customer: {job.customer_name || "No customer set"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {job.job_type || "No job type set"}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{getJobStatusMessage(job.status)}</p>
                    </div>

                    <JobStatusChip status={job.status} />
                  </div>

                  <div className="mt-4 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm text-slate-800">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Next action
                    </span>
                    <span className="font-semibold">{job.next_action || "Open job to review blockers"}</span>
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Status: {getStatusLabel(job.status)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}

          {!error && jobs.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-center">
                <h2 className="font-black text-slate-950">No jobs yet.</h2>
                <p className="mt-1 text-sm text-slate-600">Create the first job and get the engine turning.</p>

                {!isDemoMode ? (
                  <Button asChild className="mt-3 bg-orange-600 hover:bg-orange-700">
                    <Link href="/jobs/new">Add Job</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}
