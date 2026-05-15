import { createActivity } from "@/lib/db/activity";
import { createClient } from "@/lib/supabase/client";
import type { JobNote, NewNoteInput } from "@/types/jobblocker";

async function fetchJobCompanyId(jobId: string): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("id", jobId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.company_id;
}

export async function fetchNotes(jobId: string): Promise<JobNote[]> {
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

export async function createNote(input: NewNoteInput): Promise<JobNote> {
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

  const companyId = await fetchJobCompanyId(input.job_id);

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
