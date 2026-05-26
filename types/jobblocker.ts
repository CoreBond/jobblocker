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

export type PermitStatus =
  | "needed"
  | "submitted"
  | "waiting_approval"
  | "approved"
  | "rejected"
  | "expiring_soon"
  | "expired"
  | "closed";

export type Permit = {
  id: string;
  job_id: string;
  permit_type: string;
  permit_number: string | null;
  status: PermitStatus;
  submitted_date: string | null;
  approved_date: string | null;
  expiration_date: string | null;
  portal_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NewPermitInput = {
  job_id: string;
  permit_type: string;
  permit_number?: string;
  status?: PermitStatus;
  expiration_date?: string;
  notes?: string;
};

export type InspectionStatus =
  | "needed"
  | "scheduled"
  | "passed"
  | "failed"
  | "rescheduled"
  | "cancelled";

export type Inspection = {
  id: string;
  job_id: string;
  inspection_type: string;
  status: InspectionStatus;
  scheduled_date: string | null;
  time_window: string | null;
  inspector_name: string | null;
  result_date: string | null;
  correction_notes: string | null;
  reinspection_required: boolean;
  created_at: string;
  updated_at: string;
};

export type NewInspectionInput = {
  job_id: string;
  inspection_type: string;
  status?: InspectionStatus;
  scheduled_date?: string;
  time_window?: string;
  inspector_name?: string;
};

export type NoteVisibility = "internal" | "customer_visible" | "private";

export type JobNote = {
  id: string;
  job_id: string;
  user_id: string | null;
  note: string;
  visibility: NoteVisibility;
  created_at: string;
};

export type NewNoteInput = {
  job_id: string;
  note: string;
  visibility?: NoteVisibility;
};

export type ActivityLog = {
  id: string;
  company_id: string;
  job_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string | null;
  created_at: string;
};

export type NewActivityInput = {
  company_id: string;
  job_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  message?: string;
};
