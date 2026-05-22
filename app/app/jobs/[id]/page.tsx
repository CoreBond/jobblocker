import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { getStatusLabel } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/types/jobblocker";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

export default async function WorkingAppJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ noteError?: string }>;
}) {
  async function addJobNote(formData: FormData) {
    "use server";

    const context = await getCurrentUserContext();

    if (!context.isAuthenticated) {
      redirect("/login");
    }

    if (!context.companyId) {
      redirect("/app/jobs?noteError=Company+setup+is+required+before+adding+notes.");
    }

    const jobId = String(formData.get("job_id") || "").trim();
    const noteText = String(formData.get("note") || "").trim();

    if (!jobId) {
      redirect("/app/jobs?noteError=Missing+job+id.");
    }

    if (!noteText) {
      redirect(`/app/jobs/${jobId}?noteError=Note+text+is+required.`);
    }

    const supabase = await createClient();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("company_id", context.companyId)
      .maybeSingle();

    if (jobError || !jobRow) {
      redirect(`/app/jobs/${jobId}?noteError=Job+not+found+for+your+company.`);
    }

    const { error } = await supabase.from("notes").insert({
      job_id: jobId,
      note: noteText,
      visibility: "internal",
    });

    if (error) {
      redirect(`/app/jobs/${jobId}?noteError=${encodeURIComponent(error.message)}`);
    }

    redirect(`/app/jobs/${jobId}`);
  }

  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  if (!context.companyId) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AppHeader />

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-bold text-orange-700">Working App</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">Job Detail</h1>
              <p className="mt-2 text-sm text-slate-700">
                Logged in as: {context.email || "unknown user"}
              </p>
              <p className="mt-2 text-sm text-slate-700">Company: Not configured yet</p>
              <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Company setup is needed before real job data can be connected.
              </p>

              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/app/jobs">Back to Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const noteError = resolvedSearchParams?.noteError || "";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("company_id", context.companyId)
    .maybeSingle();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AppHeader />

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-bold text-orange-700">Working App</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">Job not found</h1>
              <p className="mt-2 text-sm text-slate-600">
                This job does not exist for your company, or the link is incorrect.
              </p>

              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/app/jobs">Back to Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const job = data as Job;
  const { data: notesData } = await supabase
    .from("notes")
    .select("id, note, visibility, created_at, user_id")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false });

  const notes = notesData ?? [];

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">
              {job.customer_name || job.name}
            </h1>
            <p className="mt-2 text-sm text-slate-700">Job: {job.name}</p>
            <p className="mt-1 text-sm text-slate-700">Job type: {job.job_type || "Not set"}</p>
            <p className="mt-1 text-sm text-slate-700">Status: {getStatusLabel(job.status) || "Not set"}</p>
            <p className="mt-1 text-sm text-slate-700">
              Next action: {job.next_action || "Not set"}
            </p>
            <p className="mt-1 text-sm text-slate-700">Created: {formatDateTime(job.created_at)}</p>
            <p className="mt-1 text-sm text-slate-700">Updated: {formatDateTime(job.updated_at)}</p>

            <div className="mt-4">
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href={`/app/jobs/${job.id}/edit`}>Edit Job</Link>
              </Button>
            </div>

            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/app/jobs">Back to Jobs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-6">
            <h2 className="text-xl font-black text-slate-950">Notes</h2>

            {noteError ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {noteError}
              </p>
            ) : null}

            <form action={addJobNote} className="mt-3 space-y-3">
              <input type="hidden" name="job_id" value={job.id} />
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Note</span>
                <textarea
                  name="note"
                  className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-orange-500"
                  placeholder="Add a note for this job."
                />
              </label>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                Add Note
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {notes.length === 0 ? (
                <p className="text-sm text-slate-600">No notes yet.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <p className="text-slate-900">{note.note}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(note.created_at)}  |  {note.visibility}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
