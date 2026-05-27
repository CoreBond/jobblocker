import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/types/jobblocker";

function assertNotDemoMode() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    throw new Error("Demo mode is read-only.");
  }
}

export async function updateJobCoreFieldsServer(
  jobId: string,
  companyId: string,
  input: {
    name: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    job_type: string;
    job_address?: string;
    next_action: string;
  }
): Promise<Job> {
  assertNotDemoMode();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .update({
      name: input.name.trim(),
      customer_name: input.customer_name.trim() || null,
      customer_phone: input.customer_phone?.trim() || null,
      customer_email: input.customer_email?.trim() || null,
      job_type: input.job_type.trim() || null,
      job_address: input.job_address?.trim() || null,
      next_action: input.next_action.trim() || null,
    })
    .eq("id", jobId)
    .eq("company_id", companyId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to update job: no matching job found for this company.");
  }

  return data;
}
