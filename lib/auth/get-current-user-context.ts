import { createClient } from "@/lib/supabase/server";

export type CurrentUserContext = {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  companyId: string | null;
  companyName: string | null;
  missingContext: boolean;
  missingContextReason: string | null;
};

type MembershipRow = {
  company_id: string | null;
  company_name?: string | null;
  companies?: { id?: string | null; name?: string | null } | null;
};

type ProfileRow = {
  company_id: string | null;
  company_name?: string | null;
};

function isMissingTableError(error: { code?: string } | null) {
  return Boolean(error && error.code === "42P01");
}

export async function getCurrentUserContext(): Promise<CurrentUserContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      userId: null,
      email: null,
      companyId: null,
      companyName: null,
      missingContext: true,
      missingContextReason: "not_authenticated",
    };
  }

  const membershipTableCandidates = ["company_memberships", "memberships"];

  for (const tableName of membershipTableCandidates) {
    const { data, error } = await supabase
      .from(tableName)
      .select("company_id, companies(id, name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle<MembershipRow>();

    if (error) {
      if (isMissingTableError(error)) {
        continue;
      }

      return {
        isAuthenticated: true,
        userId: user.id,
        email: user.email ?? null,
        companyId: null,
        companyName: null,
        missingContext: true,
        missingContextReason: `membership_lookup_failed:${tableName}`,
      };
    }

    if (data?.company_id || data?.companies?.id) {
      return {
        isAuthenticated: true,
        userId: user.id,
        email: user.email ?? null,
        companyId: data.company_id ?? data.companies?.id ?? null,
        companyName: data.companies?.name ?? data.company_name ?? null,
        missingContext: false,
        missingContextReason: null,
      };
    }
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle<ProfileRow>();

  if (profileError && !isMissingTableError(profileError)) {
    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email ?? null,
      companyId: null,
      companyName: null,
      missingContext: true,
      missingContextReason: "profile_lookup_failed",
    };
  }

  if (profileData?.company_id) {
    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email ?? null,
      companyId: profileData.company_id,
      companyName: profileData.company_name ?? null,
      missingContext: false,
      missingContextReason: null,
    };
  }

  return {
    isAuthenticated: true,
    userId: user.id,
    email: user.email ?? null,
    companyId: null,
    companyName: null,
    missingContext: true,
    missingContextReason: "company_membership_not_configured",
  };
}
