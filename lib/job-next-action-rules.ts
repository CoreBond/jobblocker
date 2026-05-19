import type { Inspection, Permit } from "@/types/jobblocker";

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
