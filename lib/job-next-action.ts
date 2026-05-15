import type { Inspection, Job, Permit } from "@/types/jobblocker";

type SupabaseLike = {
  from: (table: string) => any;
};

export function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function getSmartNextAction(jobStatus: string, permits: Permit[], inspections: Inspection[]) {
  if (jobStatus === "closed") {
    return "Job closed";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredPermit = permits.find((permit) => {
    if (!permit.expiration_date) return false;

    const expirationDate = new Date(permit.expiration_date);
    expirationDate.setHours(0, 0, 0, 0);

    return expirationDate < today;
  });

  if (expiredPermit) {
    return `Renew or verify expired ${expiredPermit.permit_type}`;
  }

  const expiresTodayPermit = permits.find((permit) => {
    if (!permit.expiration_date) return false;

    const expirationDate = new Date(permit.expiration_date);
    expirationDate.setHours(0, 0, 0, 0);

    return expirationDate.getTime() === today.getTime();
  });

  if (expiresTodayPermit) {
    return `Verify ${expiresTodayPermit.permit_type} expires today`;
  }

  const neededPermit = permits.find((permit) => permit.status === "needed");

  if (neededPermit) {
    return `Submit ${neededPermit.permit_type}`;
  }

  const failedInspection = inspections.find((inspection) => inspection.status === "failed");

  if (failedInspection) {
    return `Schedule reinspection for ${failedInspection.inspection_type}`;
  }

  const neededInspection = inspections.find((inspection) => inspection.status === "needed");

  if (neededInspection) {
    return `Schedule ${neededInspection.inspection_type}`;
  }

  const scheduledInspection = inspections.find((inspection) => inspection.status === "scheduled");

  if (scheduledInspection) {
    return `Await ${scheduledInspection.inspection_type}`;
  }

  const allInspectionsPassed =
    inspections.length > 0 && inspections.every((inspection) => inspection.status === "passed");

  if (allInspectionsPassed) {
    return "Ready for next phase";
  }

  if (jobStatus === "ready_to_close") {
    return "Close job";
  }

  return "Review job status";
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