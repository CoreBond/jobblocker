"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { ActivityLog, Inspection, Job, JobNote, Permit } from "@/types/jobblocker";
import { fetchJobById } from "@/lib/db/jobs";
import { createPermit, fetchPermits } from "@/lib/db/permits";
import { createInspection, fetchInspections, updateInspectionStatus } from "@/lib/db/inspections";
import { createNote, fetchNotes } from "@/lib/db/notes";
import { fetchActivity } from "@/lib/db/activity";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JobStatusChip } from "@/components/job/job-status-chip";
import { canMoveToStatus, getStatusLabel, getStatusOptions } from "@/lib/job-status";

function formatStatus(status: string) {
  return getStatusLabel(status);
}

function getSmartNextAction(jobStatus: string, permits: Permit[], inspections: Inspection[]) {
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
    return `${permit.permit_type} expires today. Do not let this become tomorrow’s problem.`;
  }

  return "";
}

function getInspectionCardClass(status: string) {
  if (status === "failed") {
    return "rounded-xl border border-red-300 bg-red-50 p-3 text-sm";
  }

  if (status === "scheduled") {
    return "rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm";
  }

  if (status === "passed") {
    return "rounded-xl border border-green-300 bg-green-50 p-3 text-sm";
  }

  if (status === "needed") {
    return "rounded-xl border border-orange-300 bg-orange-50 p-3 text-sm";
  }

  return "rounded-xl bg-slate-50 p-3 text-sm";
}

function getInspectionStatusMessage(inspection: Inspection) {
  if (inspection.status === "failed") {
    return `${inspection.inspection_type} failed. Schedule reinspection.`;
  }

  if (inspection.status === "scheduled") {
    return `${inspection.inspection_type} is scheduled.`;
  }

  if (inspection.status === "passed") {
    return `${inspection.inspection_type} passed.`;
  }

  if (inspection.status === "needed") {
    return `${inspection.inspection_type} needs scheduling.`;
  }

  return "";
}


function formatTitle(text: string) {
  return text
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActivityTitle(item: ActivityLog) {
  if (item.message) {
    return item.message;
  }

  return formatTitle(item.action);
}

function getActivityBadgeClass(action: string) {
  if (action.includes("status")) {
    return "bg-blue-100 text-blue-800";
  }

  if (action.includes("permit")) {
    return "bg-orange-100 text-orange-800";
  }

  if (action.includes("inspection")) {
    return "bg-green-100 text-green-800";
  }

  if (action.includes("note")) {
    return "bg-purple-100 text-purple-800";
  }

  return "bg-slate-200 text-slate-800";
}

function getActivityBorderClass(action: string) {
  if (action.includes("status")) {
    return "border-blue-200";
  }

  if (action.includes("permit")) {
    return "border-orange-200";
  }

  if (action.includes("inspection")) {
    return "border-green-200";
  }

  if (action.includes("note")) {
    return "border-purple-200";
  }

  return "border-slate-200";
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-slate-800">{children}</span>;
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
      <p className="font-black text-slate-800">{title}</p>
      <p className="mt-1 text-slate-600">{children}</p>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFullActivity, setShowFullActivity] = useState(false);

  const [permitType, setPermitType] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [permitExpiration, setPermitExpiration] = useState("");

  const [inspectionType, setInspectionType] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionWindow, setInspectionWindow] = useState("");
  const [inspectorName, setInspectorName] = useState("");

  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadEverything() {
    if (!jobId) return;

    try {
      setLoading(true);
      setError("");

      const [jobRow, permitRows, inspectionRows, noteRows, activityRows] = await Promise.all([
        fetchJobById(jobId),
        fetchPermits(jobId),
        fetchInspections(jobId),
        fetchNotes(jobId),
        fetchActivity(jobId),
      ]);

      setJob(jobRow);
      setPermits(permitRows);
      setInspections(inspectionRows);
      setNotes(noteRows);
      setActivity(activityRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job record.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function handleAddPermit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jobId || !permitType.trim()) return;

    try {
      setSaving(true);
      await createPermit({
        job_id: jobId,
        permit_type: permitType.trim(),
        permit_number: permitNumber.trim(),
        expiration_date: permitExpiration || undefined,
        status: "needed",
      });
      setPermitType("");
      setPermitNumber("");
      setPermitExpiration("");
      await loadEverything();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add permit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddInspection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jobId || !inspectionType.trim()) return;

    try {
      setSaving(true);
      await createInspection({
        job_id: jobId,
        inspection_type: inspectionType.trim(),
        scheduled_date: inspectionDate || undefined,
        time_window: inspectionWindow.trim(),
        inspector_name: inspectorName.trim(),
        status: inspectionDate ? "scheduled" : "needed",
      });
      setInspectionType("");
      setInspectionDate("");
      setInspectionWindow("");
      setInspectorName("");
      await loadEverything();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add inspection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jobId || !noteText.trim()) return;

    try {
      setSaving(true);
      await createNote({
        job_id: jobId,
        note: noteText.trim(),
        visibility: "internal",
      });
      setNoteText("");
      await loadEverything();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInspectionStatus(id: string, status: "passed" | "failed") {
    const inspection = inspections.find((item) => item.id === id);

    if (!inspection || inspection.status === status) return;

    try {
      setSaving(true);

      await updateInspectionStatus(
        id,
        status,
        status === "failed" ? "Correction required. Add details before reinspection." : undefined
      );

      await loadEverything();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update inspection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleJobStatusChange(newStatus: string) {
    if (!job || newStatus === job.status) return;

    if (!canMoveToStatus(job.status, newStatus)) {
      setError(`Invalid status move from ${formatStatus(job.status)} to ${formatStatus(newStatus)}.`);
      return;
    }

    try {
      setSaving(true);

      const oldStatus = job.status;

      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          oldStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job status.");
      }

      await loadEverything();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job status.");
    } finally {
      setSaving(false);
    }
  }

  const sortedActivity = [...activity].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const visibleActivity = showFullActivity ? sortedActivity : sortedActivity.slice(0, 10);
  const hiddenActivityCount = Math.max(sortedActivity.length - visibleActivity.length, 0);
  const statusOptions = job ? getStatusOptions(job.status) : [];

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href="/jobs">Back to Jobs</Link>
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">Loading job record...</CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-5 text-sm text-red-800">{error}</CardContent>
          </Card>
        ) : null}

        {job ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-950">{job.name}</h1>
                    <p className="mt-1 text-sm text-slate-600">{job.job_type || "No job type set"}</p>
                  </div>
                  <JobStatusChip status={job.status} />
                </div>

                <div className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-slate-800">
                  <b>Next action:</b> {getSmartNextAction(job.status, permits, inspections)}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-black text-slate-950">Permits</h2>
                  <p className="mt-1 text-sm text-slate-600">Track permits, numbers, status, and expiration dates.</p>

                  <form onSubmit={handleAddPermit} className="mt-4 space-y-3">
                    <label className="block">
                      <SmallLabel>Permit type</SmallLabel>
                      <Input value={permitType} onChange={(event) => setPermitType(event.target.value)} placeholder="Building Permit" />
                    </label>

                    <label className="block">
                      <SmallLabel>Permit number</SmallLabel>
                      <Input value={permitNumber} onChange={(event) => setPermitNumber(event.target.value)} placeholder="BP-2026-1048" />
                    </label>

                    <label className="block">
                      <SmallLabel>Expiration date</SmallLabel>
                      <Input type="date" value={permitExpiration} onChange={(event) => setPermitExpiration(event.target.value)} />
                    </label>

                    <Button type="submit" disabled={saving || !permitType.trim()} className="bg-slate-950">
                      Add Permit
                    </Button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {permits.length ? (
                      permits.map((permit) => {
                        const urgency = getPermitUrgency(permit);
                        const urgencyMessage = getPermitUrgencyMessage(permit, urgency);

                        return (
                          <div key={permit.id} className={getPermitCardClass(urgency)}>
                            <b>{permit.permit_type}</b>

                            <p className="text-slate-600">
                              {permit.permit_number || "No permit number"} · {formatStatus(permit.status)}
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
                    ) : (
                      <EmptyState title="No permits added yet">
                        Add permits here so numbers, expiration dates, and blockers do not end up scattered across texts and sticky notes.
                      </EmptyState>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-black text-slate-950">Inspections</h2>
                  <p className="mt-1 text-sm text-slate-600">Track scheduled, passed, failed, and reinspection work.</p>

                  <form onSubmit={handleAddInspection} className="mt-4 space-y-3">
                    <label className="block">
                      <SmallLabel>Inspection type</SmallLabel>
                      <Input value={inspectionType} onChange={(event) => setInspectionType(event.target.value)} placeholder="Electrical Rough-In" />
                    </label>

                    <label className="block">
                      <SmallLabel>Scheduled date</SmallLabel>
                      <Input type="date" value={inspectionDate} onChange={(event) => setInspectionDate(event.target.value)} />
                    </label>

                    <label className="block">
                      <SmallLabel>Time window</SmallLabel>
                      <Input value={inspectionWindow} onChange={(event) => setInspectionWindow(event.target.value)} placeholder="8 AM to noon" />
                    </label>

                    <label className="block">
                      <SmallLabel>Inspector</SmallLabel>
                      <Input value={inspectorName} onChange={(event) => setInspectorName(event.target.value)} placeholder="Mike R." />
                    </label>

                    <Button type="submit" disabled={saving || !inspectionType.trim()} className="bg-slate-950">
                      Add Inspection
                    </Button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {inspections.length ? (
                      inspections.map((inspection) => {
                        const inspectionMessage = getInspectionStatusMessage(inspection);

                        return (
                          <div key={inspection.id} className={getInspectionCardClass(inspection.status)}>
                            <b>{inspection.inspection_type}</b>

                            <p className="text-slate-600">
                              {inspection.scheduled_date || "No date"} · {inspection.time_window || "No window"}
                            </p>

                            <p className="text-xs text-slate-500">
                              Inspector: {inspection.inspector_name || "Not set"} · Status: {formatStatus(inspection.status)}
                            </p>

                            {inspectionMessage ? (
                              <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs font-semibold text-slate-800">
                                {inspectionMessage}
                              </p>
                            ) : null}

                            {inspection.correction_notes ? (
                              <p className="mt-2 rounded-lg bg-red-100 p-2 text-xs text-red-800">{inspection.correction_notes}</p>
                            ) : null}

                            <div className="mt-2 flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={saving || inspection.status === "passed"}
                                onClick={() => handleInspectionStatus(inspection.id, "passed")}
                              >
                                Mark Passed
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                disabled={saving || inspection.status === "failed"}
                                onClick={() => handleInspectionStatus(inspection.id, "failed")}
                              >
                                Mark Failed
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <EmptyState title="No inspections scheduled yet">
                        Add inspections here so passed, failed, and waiting items stay tied to the job instead of somebody’s memory.
                      </EmptyState>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-black text-slate-950">Notes</h2>
                  <p className="mt-1 text-sm text-slate-600">Internal job notes. Customer-safe visibility comes later.</p>

                  <form onSubmit={handleAddNote} className="mt-4 space-y-3">
                    <textarea
                      value={noteText}
                      onChange={(event) => setNoteText(event.target.value)}
                      className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-orange-500"
                      placeholder="Called permit office. Waiting on review."
                    />

                    <Button type="submit" disabled={saving || !noteText.trim()} className="bg-slate-950">
                      Add Note
                    </Button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {notes.length ? (
                      notes.map((note) => (
                        <div key={note.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                          <p>{note.note}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {note.visibility} · {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No notes yet">
                        Add internal notes here so future-you does not have to reconstruct the job from vibes and regret.
                      </EmptyState>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-black text-slate-950">Job Record</h2>

                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>Customer:</b> {job.customer_name || "Not set"}
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <label className="mb-1 block font-bold">Status:</label>
                      <select
                        value={job.status}
                        disabled={saving}
                        onChange={(event) => handleJobStatusChange(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status === job.status ? `${getStatusLabel(status)} (current)` : getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      Only valid next statuses are shown. This keeps the workflow from wandering into nonsense.
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>Permits:</b> {permits.length}
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>Inspections:</b> {inspections.length}
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>Notes:</b> {notes.length}
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>Activity events:</b> {activity.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Activity Timeline</h2>
                    <p className="mt-1 text-sm text-slate-600">Newest job events first. No mystery meat log soup.</p>
                  </div>

                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                    {activity.length} total
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {visibleActivity.length ? (
                    visibleActivity.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border bg-white p-3 text-sm shadow-sm ${getActivityBorderClass(item.action)}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${getActivityBadgeClass(
                              item.action
                            )}`}
                          >
                            {formatTitle(item.action)}
                          </span>

                          <span className="text-xs font-medium text-slate-500">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>

                        <p className="mt-2 font-semibold text-slate-900">{getActivityTitle(item)}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No activity recorded yet">
                      New status changes, permits, inspections, and notes will show up here as the job moves.
                    </EmptyState>
                  )}
                </div>

                {sortedActivity.length > 10 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
                    <p className="text-xs font-medium text-slate-500">
                      {showFullActivity
                        ? `Showing all ${sortedActivity.length} events.`
                        : `Showing ${visibleActivity.length} of ${sortedActivity.length} events. ${hiddenActivityCount} older event${
                            hiddenActivityCount === 1 ? "" : "s"
                          } hidden.`}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setShowFullActivity((current) => !current)}
                    >
                      {showFullActivity ? "Show Recent Only" : "Show Full History"}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}


        {!loading && !job ? (
          <Card>
            <CardContent className="p-5">
              <h1 className="text-xl font-black text-slate-950">Job not found</h1>
              <p className="mt-2 text-sm text-slate-600">
                This job record could not be loaded. It may have been deleted, moved, or the link is wrong.
              </p>

              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/jobs">Back to Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
