import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type Site = Database["public"]["Tables"]["sites"]["Row"];

export async function getSitesByOrganization(
  organizationId: string,
): Promise<Site[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load sites: ${error.message}`);
  }

  return data ?? [];
}