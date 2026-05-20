import { createActivity } from "@/lib/db/activity";
import { createClient } from "@/lib/supabase/client";
import type { Job, NewJobInput } from "@/types/jobblocker";

export async function fetchJobs(companyId: string): Promise<Job[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchJobById(jobId: string, companyId: string): Promise<Job | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createJob(input: NewJobInput): Promise<Job> {
  const supabase = createClient();
  const nextAction = input.next_action?.trim() || "Review job status";

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      company_id: input.company_id,
      name: input.name,
      job_type: input.job_type || null,
      customer_name: input.customer_name?.trim() || null,
      next_action: nextAction,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await createActivity({
    company_id: data.company_id,
    job_id: data.id,
    action: "job_created",
    entity_type: "job",
    entity_id: data.id,
    message: `Job created: ${data.name}`,
  });

  return data;
}
