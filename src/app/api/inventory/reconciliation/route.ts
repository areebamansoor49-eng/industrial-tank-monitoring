import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) {
    return NextResponse.json({ error: "Unable to verify organization." }, { status: 500 });
  }

  const organizationId = memberships?.[0]?.organization_id;

  if (!organizationId) {
    return NextResponse.json({ error: "Organization setup required." }, { status: 403 });
  }

  const [tanksResult, sitesResult, telemetryResult] = await Promise.all([
    supabase
      .from("tanks")
      .select("id,name,tank_code,site_id,product,capacity,capacity_unit,status")
      .eq("organization_id", organizationId)
      .order("name"),

    supabase
      .from("sites")
      .select("id,name")
      .eq("organization_id", organizationId),

    supabase
      .from("telemetry_latest")
      .select("tank_id,metric,value,unit,quality,recorded_at,metadata")
      .eq("organization_id", organizationId)
      .not("tank_id", "is", null),
  ]);

  if (tanksResult.error || sitesResult.error || telemetryResult.error) {
    return NextResponse.json(
      { error: "Unable to load inventory reconciliation data." },
      { status: 500 },
    );
  }

  const sites = new Map(
    (sitesResult.data ?? []).map((site) => [site.id, site.name]),
  );

  const readings = new Map<string, Record<string, unknown>>();

  for (const row of telemetryResult.data ?? []) {
    if (!row.tank_id) continue;

    const current = readings.get(row.tank_id) ?? {};
    current[row.metric] = {
      value: Number(row.value),
      unit: row.unit,
      quality: row.quality,
      recordedAt: row.recorded_at,
      metadata: row.metadata,
    };
    readings.set(row.tank_id, current);
  }

  const tanks = (tanksResult.data ?? []).map((tank) => ({
    ...tank,
    site_name: sites.get(tank.site_id) ?? "Site not assigned",
    telemetry: readings.get(tank.id) ?? {},
  }));

  return NextResponse.json({
    tanks,
    generated_at: new Date().toISOString(),
  });
}
