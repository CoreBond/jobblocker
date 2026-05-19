import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-slate-950 px-4 py-3 text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 text-left">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/40 bg-slate-900 shadow-sm">
            <span className="absolute left-2 top-2 h-2.5 w-5 rounded-sm bg-orange-500" />
            <span className="absolute bottom-2 right-2 h-2.5 w-5 rounded-sm bg-slate-500" />
            <span className="absolute h-1 w-6 rotate-[-35deg] rounded-full bg-white" />
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
            <Link href="/jobs">Jobs</Link>
          </Button>
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/jobs/new">Add Job</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
