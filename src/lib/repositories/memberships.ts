import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type OrganizationMembership =
  Database["public"]["Tables"]["organization_members"]["Row"];

export async function getCurrentUserMemberships(): Promise<
  OrganizationMembership[]
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Failed to get authenticated user: ${userError.message}`);
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load organization memberships: ${error.message}`,
    );
  }

  return data ?? [];
}