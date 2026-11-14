import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type Tank = Database["public"]["Tables"]["tanks"]["Row"];

export async function getTanksBySite(siteId: string): Promise<Tank[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tanks")
    .select("*")
    .eq("site_id", siteId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load tanks: ${error.message}`);
  }

  return data ?? [];
}

export async function getTanksByOrganization(
  organizationId: string,
): Promise<Tank[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tanks")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load tanks: ${error.message}`);
  }

  return data ?? [];
}