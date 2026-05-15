import { createActivity } from "@/lib/db/activity";
import { updateStoredNextActionForJob } from "@/lib/job-next-action";
import { createClient } from "@/lib/supabase/client";
import type { Inspection, InspectionStatus, NewInspectionInput } from "@/types/jobblocker";

async function fetchJobCompanyId(jobId: string): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("id", jobId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.company_id;
}

async function fetchInspectionJobAndCompany(inspectionId: string): Promise<{ jobId: string; companyId: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inspections")
    .select("job_id, jobs(company_id)")
    .eq("id", inspectionId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const job = Array.isArray(data.jobs) ? data.jobs[0] : data.jobs;

  return {
    jobId: data.job_id,
    companyId: job.company_id,
  };
}

export async function fetchInspections(jobId: string): Promise<Inspection[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("job_id", jobId)
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createInspection(input: NewInspectionInput): Promise<Inspection> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inspections")
    .insert({
      job_id: input.job_id,
      inspection_type: input.inspection_type,
      status: input.status || "needed",
      scheduled_date: input.scheduled_date || null,
      time_window: input.time_window || null,
      inspector_name: input.inspector_name || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const companyId = await fetchJobCompanyId(input.job_id);

  await createActivity({
    company_id: companyId,
    job_id: input.job_id,
    action: "inspection_added",
    entity_type: "inspection",
    entity_id: data.id,
    message: `Inspection added: ${data.inspection_type}`,
  });

  await updateStoredNextActionForJob(supabase, input.job_id);

  return data;
}

export async function updateInspectionStatus(
  inspectionId: string,
  status: InspectionStatus,
  correctionNotes?: string
): Promise<Inspection> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inspections")
    .update({
      status,
      result_date: status === "passed" || status === "failed" ? new Date().toISOString().slice(0, 10) : null,
      correction_notes: correctionNotes || null,
      reinspection_required: status === "failed",
    })
    .eq("id", inspectionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { jobId, companyId } = await fetchInspectionJobAndCompany(inspectionId);

  await createActivity({
    company_id: companyId,
    job_id: jobId,
    action: status === "passed" ? "inspection_passed" : status === "failed" ? "inspection_failed" : "inspection_updated",
    entity_type: "inspection",
    entity_id: data.id,
    message: `Inspection marked ${status}: ${data.inspection_type}`,
  });

  await updateStoredNextActionForJob(supabase, jobId);

  return data;
}