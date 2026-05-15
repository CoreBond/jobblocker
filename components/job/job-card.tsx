import Link from "next/link";
import type { Job } from "@/types/jobblocker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobStatusChip } from "@/components/job/job-status-chip";

export function JobCard({ job }: { job: Job }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-950">{job.name}</h3>
            <p className="text-sm text-slate-600">
              {job.job_type || "Job"} · {job.customer_name || "No customer set"}
            </p>
          </div>
          <JobStatusChip status={job.status} />
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <b>Next action:</b> {job.next_action || "No next action set"}
        </div>

        <div className="mt-3">
          <Button asChild variant="outline">
            <Link href={`/jobs/${job.id}`}>View Job</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
