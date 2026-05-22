import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkingAppLandingPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App (coming soon)</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Real Job Workspace</h1>
            <p className="mt-2 text-sm text-slate-700">
              This area will be for logged-in users managing real jobs.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              The current dashboard remains in Demo Mode - sample data only.
            </p>

            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/">Back to Demo Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
