
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getOrganizationApiContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const membership = memberships?.[0];

  if (!membership) {
    return {
      response: NextResponse.json(
        { error: "Organization membership required." },
        { status: 403 },
      ),
    };
  }

  return { supabase, membership };
}

export function isOrganizationAdmin(role: string) {
  return role === "owner" || role === "admin";
}
