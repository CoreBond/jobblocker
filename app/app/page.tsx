import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/app/app/sign-out-button";

export default async function WorkingAppLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
              Logged in as: {user.email || "unknown user"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Real job management will live here.
            </p>

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
