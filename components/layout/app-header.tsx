import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-slate-950 px-4 py-3 text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="text-left">
          <div className="font-black leading-tight">⚒ JobBlocker</div>
          <div className="text-xs text-slate-300">Block it out. Track it clean. Keep it moving.</div>
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
