import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateStoredNextActionForJob } from "@/lib/job-next-action";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    const oldStatus = body.oldStatus;

    if (!id || !newStatus) {
      return NextResponse.json(
        { error: "Missing job id or status." },
        { status: 400 }
      );
    }

    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("id, company_id, status")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", id);

    if (jobError) {
      return NextResponse.json(
        { error: jobError.message },
        { status: 500 }
      );
    }

    const { error: activityError } = await supabase
      .from("activity_log")
      .insert({
        company_id: existingJob.company_id,
        job_id: id,
        action: "job_status_changed",
        entity_type: "job",
        entity_id: id,
        message: `Job status changed from ${formatStatus(oldStatus || existingJob.status || "unknown")} to ${formatStatus(newStatus)}`,
      });

    if (activityError) {
      return NextResponse.json(
        { error: activityError.message },
        { status: 500 }
      );
    }

    await updateStoredNextActionForJob(supabase, id);

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