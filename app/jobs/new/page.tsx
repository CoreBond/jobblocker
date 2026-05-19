"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/db/jobs";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewJobPage() {
  const router = useRouter();
  const companyId = process.env.NEXT_PUBLIC_DEMO_COMPANY_ID;

  const [name, setName] = useState("");
  const [jobType, setJobType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!companyId) {
      setError("Missing NEXT_PUBLIC_DEMO_COMPANY_ID in .env.local.");
      return;
    }

    if (!name.trim()) {
      setError("Job name is required.");
      return;
    }

    try {
      setSaving(true);
      await createJob({
        company_id: companyId,
        name: name.trim(),
        job_type: jobType.trim(),
        customer_name: customerName.trim(),
        next_action: nextAction.trim(),
      });

      router.push("/jobs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-black text-slate-950">Add Job</h1>
        <p className="mt-1 text-sm text-slate-600">Start with the basics. Fancy can wait.</p>

        <Card className="mt-4">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Job name or address</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="144 Maple Street" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Job type</span>
                <Input value={jobType} onChange={(event) => setJobType(event.target.value)} placeholder="Bathroom Remodel" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Customer name</span>
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Jordan Smith" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Next action</span>
                <Input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Submit building permit" />
              </label>

              {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push("/jobs")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                  {saving ? "Saving..." : "Create Job"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
