import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { getStatusLabel } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import type { Job, Permit, PermitStatus } from "@/types/jobblocker";

const PERMIT_STATUSES: PermitStatus[] = [
  "needed",
  "submitted",
  "waiting_approval",
  "approved",
  "rejected",
  "expiring_soon",
  "expired",
  "closed",
];

const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  needed: "Needed",
  submitted: "Submitted",
  waiting_approval: "Waiting Approval",
  approved: "Approved",
  rejected: "Rejected",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  closed: "Closed",
};

function getPermitStatusLabel(status: PermitStatus) {
  return PERMIT_STATUS_LABELS[status];
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

function getPermitUrgency(permit: Permit) {
  if (!permit.expiration_date) {
    return "normal";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expirationDate = new Date(permit.expiration_date);
  expirationDate.setHours(0, 0, 0, 0);

  if (expirationDate < today) {
    return "expired";
  }

  if (expirationDate.getTime() === today.getTime()) {
    return "today";
  }

  return "normal";
}

function getPermitCardClass(urgency: string) {
  if (urgency === "expired") {
    return "rounded-xl border border-red-300 bg-red-50 p-3 text-sm";
  }

  if (urgency === "today") {
    return "rounded-xl border border-orange-300 bg-orange-50 p-3 text-sm";
  }

  return "rounded-xl bg-slate-50 p-3 text-sm";
}

function getPermitUrgencyMessage(permit: Permit, urgency: string) {
  if (urgency === "expired") {
    return `${permit.permit_type} is expired. Verify or renew it.`;
  }

  if (urgency === "today") {
    return `${permit.permit_type} expires today. Do not let this become tomorrow's problem.`;
  }

  return "";
}

export default async function WorkingAppJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ noteError?: string; permitError?: string }>;
}) {
  async function addJobPermit(formData: FormData) {
    "use server";

    const context = await getCurrentUserContext();

    if (!context.isAuthenticated) {
      redirect("/login");
    }

    if (!context.companyId) {
      redirect("/app/jobs?permitError=Company+setup+is+required+before+adding+permits.");
    }

    const jobId = String(formData.get("job_id") || "").trim();
    const permitType = String(formData.get("permit_type") || "").trim();
    const permitNumber = String(formData.get("permit_number") || "").trim();
    const statusRaw = String(formData.get("status") || "").trim() as PermitStatus;
    const status = PERMIT_STATUSES.includes(statusRaw) ? statusRaw : "needed";
    const expirationDate = String(formData.get("expiration_date") || "").trim();

    if (!jobId) {
      redirect("/app/jobs?permitError=Missing+job+id.");
    }

    if (!permitType) {
      redirect(`/app/jobs/${jobId}?permitError=Permit+type+is+required.`);
    }

    const supabase = await createClient();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("company_id", context.companyId)
      .maybeSingle();

    if (jobError || !jobRow) {
      redirect(`/app/jobs/${jobId}?permitError=Job+not+found+for+your+company.`);
    }

    const { error } = await supabase.from("permits").insert({
      job_id: jobId,
      permit_type: permitType,
      permit_number: permitNumber || null,
      status,
      expiration_date: expirationDate || null,
    });

    if (error) {
      redirect(`/app/jobs/${jobId}?permitError=${encodeURIComponent(error.message)}`);
    }

    redirect(`/app/jobs/${jobId}`);
  }

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
  const permitError = resolvedSearchParams?.permitError || "";
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
  const { data: permitsData } = await supabase
    .from("permits")
    .select("id, job_id, permit_type, permit_number, status, submitted_date, approved_date, expiration_date, portal_url, notes, created_at, updated_at")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false });

  const permits = (permitsData ?? []) as Permit[];
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
            <h2 className="text-xl font-black text-slate-950">Permits</h2>
            <p className="mt-1 text-sm text-slate-600">Track permits, numbers, status, and expiration dates.</p>

            {permitError ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {permitError}
              </p>
            ) : null}

            <form action={addJobPermit} className="mt-4 space-y-3">
              <input type="hidden" name="job_id" value={job.id} />

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Permit type</span>
                <input
                  name="permit_type"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                  placeholder="Building Permit"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Permit number</span>
                <input
                  name="permit_number"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                  placeholder="BP-2026-1048"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Status</span>
                <select
                  name="status"
                  defaultValue="needed"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {PERMIT_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {getPermitStatusLabel(statusOption)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Expiration date</span>
                <input
                  type="date"
                  name="expiration_date"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                />
              </label>

              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                Add Permit
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {permits.length === 0 ? (
                <p className="text-sm text-slate-600">No permits yet.</p>
              ) : (
                permits.map((permit) => {
                  const urgency = getPermitUrgency(permit);
                  const urgencyMessage = getPermitUrgencyMessage(permit, urgency);

                  return (
                    <div key={permit.id} className={getPermitCardClass(urgency)}>
                      <b>{permit.permit_type}</b>

                      <p className="text-slate-600">
                        {permit.permit_number || "No permit number"}  |  {getPermitStatusLabel(permit.status)}
                      </p>

                      <p className="text-xs text-slate-500">
                        Expires: {permit.expiration_date || "Not set"}
                      </p>

                      {urgencyMessage ? (
                        <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs font-semibold text-slate-800">
                          {urgencyMessage}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
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
