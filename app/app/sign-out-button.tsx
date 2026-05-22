"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSignOut() {
    try {
      setSaving(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button type="button" onClick={handleSignOut} disabled={saving} className="bg-slate-950">
      {saving ? "Signing out..." : "Sign out"}
    </Button>
  );
}
