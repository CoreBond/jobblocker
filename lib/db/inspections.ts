import { createActivity } from "@/lib/db/activity";
import { updateStoredNextActionForJob } from "@/lib/job-next-action";
import { createClient } from "@/lib/supabase/client";
import type { Inspection, InspectionStatus, NewInspectionInput } from "@/types/jobblocker";

function assertNotDemoMode() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    throw new Error("Demo mode is read-only.");
  }
}

async function assertJobBelongsToCompany(jobId: string, companyId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Job not found for this company.");
  }
}

async function fetchInspectionJobAndCompany(
  inspectionId: string,
  companyId: string
): Promise<{ jobId: string; companyId: string }> {
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
  if (!job || job.company_id !== companyId) {
    throw new Error("Inspection not found for this company.");
  }

  return {
    jobId: data.job_id,
    companyId: job.company_id,
  };
}

export async function fetchInspections(jobId: string, companyId: string): Promise<Inspection[]> {
  await assertJobBelongsToCompany(jobId, companyId);

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

export async function createInspection(input: NewInspectionInput, companyId: string): Promise<Inspection> {
  assertNotDemoMode();
  await assertJobBelongsToCompany(input.job_id, companyId);

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
  companyId: string,
  status: InspectionStatus,
  correctionNotes?: string
): Promise<Inspection> {
  assertNotDemoMode();
  const { jobId } = await fetchInspectionJobAndCompany(inspectionId, companyId);
  await assertJobBelongsToCompany(jobId, companyId);

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
