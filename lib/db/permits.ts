import { createActivity } from "@/lib/db/activity";
import { updateStoredNextActionForJob } from "@/lib/job-next-action";
import { createClient } from "@/lib/supabase/client";
import type { NewPermitInput, Permit } from "@/types/jobblocker";

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

export async function fetchPermits(jobId: string, companyId: string): Promise<Permit[]> {
  await assertJobBelongsToCompany(jobId, companyId);

  const supabase = createClient();

  const { data, error } = await supabase
    .from("permits")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createPermit(input: NewPermitInput, companyId: string): Promise<Permit> {
  await assertJobBelongsToCompany(input.job_id, companyId);

  const supabase = createClient();

  const { data, error } = await supabase
    .from("permits")
    .insert({
      job_id: input.job_id,
      permit_type: input.permit_type,
      permit_number: input.permit_number || null,
      status: input.status || "needed",
      expiration_date: input.expiration_date || null,
      notes: input.notes || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await createActivity({
    company_id: companyId,
    job_id: input.job_id,
    action: "permit_added",
    entity_type: "permit",
    entity_id: data.id,
    message: `Permit added: ${data.permit_type}`,
  });

  await updateStoredNextActionForJob(supabase, input.job_id);

  return data;
}
