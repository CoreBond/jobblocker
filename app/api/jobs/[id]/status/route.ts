import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateStoredNextActionForJob } from "@/lib/job-next-action";
import { canMoveToStatus } from "@/lib/job-status";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const demoCompanyId = process.env.NEXT_PUBLIC_DEMO_COMPANY_ID;
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const newStatus = body.status;

    if (!id || !newStatus) {
      return NextResponse.json(
        { error: "Missing job id or status." },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      return NextResponse.json(
        { error: "Demo mode is read-only." },
        { status: 403 }
      );
    }

    if (!demoCompanyId) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_DEMO_COMPANY_ID in .env.local." },
        { status: 500 }
      );
    }

    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("id, company_id, status")
      .eq("id", id)
      .eq("company_id", demoCompanyId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    const currentStatus = existingJob.status;

    if (newStatus !== currentStatus && !canMoveToStatus(currentStatus, newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status move from ${formatStatus(currentStatus)} to ${formatStatus(newStatus)}.`,
        },
        { status: 400 }
      );
    }

    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("company_id", demoCompanyId);

    if (jobError) {
      return NextResponse.json(
        { error: jobError.message },
        { status: 500 }
      );
    }

    await updateStoredNextActionForJob(supabase, id);

    const { error: activityError } = await supabase
      .from("activity_log")
      .insert({
        company_id: existingJob.company_id,
        job_id: id,
        action: "job_status_changed",
        entity_type: "job",
        entity_id: id,
        message: `Job status changed from ${formatStatus(currentStatus || "unknown")} to ${formatStatus(newStatus)}`,
      });

    if (activityError) {
      return NextResponse.json(
        { error: activityError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update job status.",
      },
      { status: 500 }
    );
  }
}
