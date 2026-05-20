import { createActivity } from "@/lib/db/activity";
import { createClient } from "@/lib/supabase/client";
import type { JobNote, NewNoteInput } from "@/types/jobblocker";

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

export async function fetchNotes(jobId: string, companyId: string): Promise<JobNote[]> {
  await assertJobBelongsToCompany(jobId, companyId);

  const supabase = createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createNote(input: NewNoteInput, companyId: string): Promise<JobNote> {
  await assertJobBelongsToCompany(input.job_id, companyId);

  const supabase = createClient();

  const { data, error } = await supabase
    .from("notes")
    .insert({
      job_id: input.job_id,
      note: input.note,
      visibility: input.visibility || "internal",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await createActivity({
    company_id: companyId,
    job_id: input.job_id,
    action: "note_added",
    entity_type: "note",
    entity_id: data.id,
    message: "Note added",
  });

  return data;
}
