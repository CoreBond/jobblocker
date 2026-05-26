import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <header className="sticky top-0 z-30 border-b bg-slate-950 px-4 py-3 text-white shadow-sm">
      {isDemoMode ? (
        <div className="mx-auto mb-3 max-w-5xl rounded-lg border border-orange-300/40 bg-orange-500/20 px-3 py-2 text-sm font-semibold text-orange-100">
          Demo Mode - sample data only.{" "}
          <a
            href="mailto:jobblocker@corebond.io?subject=JobBlocker Early Access Request"
            className="underline underline-offset-2 hover:text-white"
          >
            Request access
          </a>{" "}
          to try JobBlocker with your own jobs.
        </div>
      ) : null}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" aria-label="Go to dashboard home" className="flex items-center gap-3 text-left">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/40 bg-slate-900 shadow-sm">
            <span className="absolute left-2 top-2 h-2.5 w-5 rounded-sm bg-orange-500" />
            <span className="absolute bottom-2 right-2 h-2.5 w-5 rounded-sm bg-slate-300" />
            <span className="absolute left-3 top-5 h-1 w-5 rotate-[-25deg] rounded-full bg-white" />
          </span>

          <span>
            <span className="block font-black leading-tight tracking-wide">JobBlocker</span>
            <span className="block text-xs text-slate-300">
              Block it out. Track it clean. Keep it moving.
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-white hover:bg-slate-800">
            <Link href="/app">Open App</Link>
          </Button>
          <Button asChild variant="ghost" className="text-white hover:bg-slate-800">
            <Link href="/jobs">Jobs</Link>
          </Button>
          {!isDemoMode ? (
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/jobs/new">Add Job</Link>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
