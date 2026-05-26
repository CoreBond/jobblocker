export type JobStatus =
  | "active"
  | "needs_attention"
  | "waiting_approval"
  | "inspection_phase"
  | "ready_to_move"
  | "ready_to_close"
  | "closed";

export type Job = {
  id: string;
  company_id: string;
  jurisdiction_id: string | null;
  name: string;
  job_type: string | null;
  job_address: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: JobStatus;
  next_action: string | null;
  start_date: string | null;
  target_close_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type NewJobInput = {
  company_id: string;
  name: string;
  job_type?: string;
  job_address?: string;
  customer_name?: string;
  next_action?: string;
};