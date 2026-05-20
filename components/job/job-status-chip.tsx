import { getStatusLabel } from "@/lib/job-status";

export function JobStatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();

  const tone =
    s.includes("attention") || s.includes("waiting")
      ? "bg-yellow-100 text-yellow-900 border-yellow-200"
      : s.includes("ready") || s.includes("approved") || s.includes("closed")
      ? "bg-green-100 text-green-800 border-green-200"
      : s.includes("inspection")
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      aria-label={`Status: ${getStatusLabel(status)}`}
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
