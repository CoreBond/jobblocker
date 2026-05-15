import { createActivity } from "@/lib/db/activity";
import { updateStoredNextActionForJob } from "@/lib/job-next-action";
import { createClient } from "@/lib/supabase/client";
import type { NewPermitInput, Permit } from "@/types/jobblocker";

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

export async function fetchPermits(jobId: string): Promise<Permit[]> {
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

export async function createPermit(input: NewPermitInput): Promise<Permit> {
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

  const companyId = await fetchJobCompanyId(input.job_id);

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