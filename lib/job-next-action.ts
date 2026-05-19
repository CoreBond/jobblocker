import type { Inspection, Job, Permit } from "@/types/jobblocker";
import { getSmartNextAction } from "@/lib/job-next-action-rules";

export { getSmartNextAction } from "@/lib/job-next-action-rules";

type SupabaseLike = {
  from: (table: string) => any;
};

export function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export async function updateStoredNextActionForJob(supabase: SupabaseLike, jobId: string) {
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError) {
    throw new Error(jobError.message);
  }

  const { data: permits, error: permitsError } = await supabase
    .from("permits")
    .select("*")
    .eq("job_id", jobId);

  if (permitsError) {
    throw new Error(permitsError.message);
  }

  const { data: inspections, error: inspectionsError } = await supabase
    .from("inspections")
    .select("*")
    .eq("job_id", jobId);

  if (inspectionsError) {
    throw new Error(inspectionsError.message);
  }

  const nextAction = getSmartNextAction(
    (job as Job).status,
    (permits ?? []) as Permit[],
    (inspections ?? []) as Inspection[]
  );

  const { error: updateError } = await supabase
    .from("jobs")
    .update({ next_action: nextAction })
    .eq("id", jobId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return nextAction;
}
