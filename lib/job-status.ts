import type { Job } from "@/types/jobblocker";

export const JOB_STATUSES = [
  "active",
  "needs_attention",
  "waiting_approval",
  "inspection_phase",
  "ready_to_move",
  "ready_to_close",
  "closed",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Active",
  needs_attention: "Needs Attention",
  waiting_approval: "Waiting Approval",
  inspection_phase: "Inspection Phase",
  ready_to_move: "Ready to Move",
  ready_to_close: "Ready to Close",
  closed: "Closed",
};

export const ALLOWED_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  active: ["needs_attention", "waiting_approval", "inspection_phase"],
  needs_attention: ["active", "waiting_approval", "inspection_phase"],
  waiting_approval: ["active", "inspection_phase"],
  inspection_phase: ["needs_attention", "ready_to_move"],
  ready_to_move: ["ready_to_close"],
  ready_to_close: ["closed"],
  closed: ["active"],
};

export function isJobStatus(status: string): status is JobStatus {
  return JOB_STATUSES.includes(status as JobStatus);
}

export function getStatusLabel(status: string) {
  return isJobStatus(status) ? JOB_STATUS_LABELS[status] : status.replaceAll("_", " ");
}

export function getStatusOptions(currentStatus: Job["status"] | string) {
  if (!isJobStatus(currentStatus)) {
    return [currentStatus].filter(Boolean);
  }

  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

  return [currentStatus, ...allowedNextStatuses].filter(
    (status, index, statuses) => status && statuses.indexOf(status) === index
  );
}

export function canMoveToStatus(currentStatus: string, nextStatus: string) {
  if (!isJobStatus(currentStatus) || !isJobStatus(nextStatus)) {
    return false;
  }

  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}
