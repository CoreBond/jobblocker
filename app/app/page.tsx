import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/app/app/sign-out-button";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";

export default async function WorkingAppLandingPage() {
  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Working App</h1>
            <p className="mt-2 text-sm text-slate-700">
              Logged in as: {context.email || "unknown user"}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Company: {context.companyName || context.companyId || "Not configured yet"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Real job management will live here.
            </p>
            {context.missingContext ? (
              <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Company setup is needed before real job data can be connected.
              </p>
            ) : null}

            <div className="mt-4">
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/app/jobs">View Real Jobs</Link>
              </Button>
            </div>

            <div className="mt-4">
              <SignOutButton />
            </div>

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
