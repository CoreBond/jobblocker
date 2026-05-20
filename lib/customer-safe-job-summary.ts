import { getStatusLabel } from "@/lib/job-status";
import type { Job } from "@/types/jobblocker";

export type CustomerSafeJobSummary = {
  id: Job["id"];
  name: Job["name"];
  customer_name: Job["customer_name"];
  status: Job["status"];
  status_label: string;
  next_action: Job["next_action"];
  updated_at: Job["updated_at"];
};

export function buildCustomerSafeJobSummary(job: Job): CustomerSafeJobSummary {
  return {
    id: job.id,
    name: job.name,
    customer_name: job.customer_name,
    status: job.status,
    status_label: getStatusLabel(job.status),
    next_action: job.next_action,
    updated_at: job.updated_at,
  };
}
