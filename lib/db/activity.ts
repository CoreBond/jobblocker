import { createClient } from "@/lib/supabase/client";
import type { ActivityLog, NewActivityInput } from "@/types/jobblocker";

export async function fetchActivity(jobId: string): Promise<ActivityLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createActivity(input: NewActivityInput): Promise<ActivityLog> {
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
