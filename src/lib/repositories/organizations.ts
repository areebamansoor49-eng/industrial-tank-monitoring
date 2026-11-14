import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export async function getOrganizationById(
  organizationId: string,
): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  return data;
}