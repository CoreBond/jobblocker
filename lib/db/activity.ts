import { createClient } from "@/lib/supabase/client";
import type { ActivityLog, NewActivityInput } from "@/types/jobblocker";

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

export async function fetchActivity(jobId: string, companyId: string): Promise<ActivityLog[]> {
  await assertJobBelongsToCompany(jobId, companyId);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("job_id", jobId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createActivity(input: NewActivityInput): Promise<ActivityLog> {
  assertNotDemoMode();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activity_log")
    .insert({
      company_id: input.company_id,
      job_id: input.job_id || null,
      action: input.action,
      entity_type: input.entity_type || null,
      entity_id: input.entity_id || null,
      message: input.message || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
