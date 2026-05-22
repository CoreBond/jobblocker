"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card className="mx-auto max-w-md">
          <CardContent className="p-6">
            <p className="text-sm font-bold text-orange-700">Working App Login</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Sign in</h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to access the JobBlocker working app area.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Email</span>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Password</span>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                />
              </label>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
              ) : null}

              <Button type="submit" disabled={saving} className="w-full bg-slate-950">
                {saving ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 text-center">
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
