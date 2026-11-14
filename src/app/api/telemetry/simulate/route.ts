
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: memberships, error: membershipError } =
    await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

  if (membershipError) {
    return NextResponse.json(
      { error: "Unable to verify organization" },
      { status: 500 },
    );
  }

  const organizationId = memberships?.[0]?.organization_id;

  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization setup required" },
      { status: 403 },
    );
  }

  const [sitesResult, tanksResult] = await Promise.all([
    supabase
      .from("sites")
      .select("*")
      .eq("organization_id", organizationId),

    supabase
      .from("tanks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  ]);

  if (sitesResult.error || tanksResult.error) {
    return NextResponse.json(
      { error: "Unable to load organization assets" },
      { status: 500 },
    );
  }

  const siteRows = (sitesResult.data ?? []) as unknown as Row[];
  const tankRows = (tanksResult.data ?? []) as unknown as Row[];

  const sites = siteRows.map((site) => ({
    id: String(site.id),
    name: String(site.name ?? "Unnamed site"),
    location: String(
      site.location ?? site.address ?? "Location not configured",
    ),
    status:
      String(site.status ?? "").toLowerCase() === "maintenance"
        ? "Maintenance" as const
        : "Operational" as const,
    tankIds: tankRows
      .filter((tank) => tank.site_id === site.id)
      .map((tank) => String(tank.id)),
  }));

  const { data: latestRows, error: latestError } =
    await supabase
      .from("telemetry_latest")
      .select("tank_id,metric,value")
      .eq("organization_id", organizationId);

  if (latestError) {
    return NextResponse.json(
      { error: "Unable to load latest telemetry" },
      { status: 500 },
    );
  }

  const previous = new Map(
    (latestRows ?? []).map((row) => [
      `${row.tank_id}:${row.metric}`,
      row.value,
    ]),
  );

  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{
    error: { message: string } | null;
  }>;

  const readings = [];

  for (const tank of tankRows) {
    const tankId = String(tank.id);
    const siteId = String(tank.site_id);
    const tankCode = String(tank.tank_code ?? tankId.slice(0, 8));
    const capacityUnit = String(tank.capacity_unit ?? "L");

    const priorLevel = previous.get(`${tankId}:level`);
    const priorTemp = previous.get(`${tankId}:temperature`);
    const priorFlow = previous.get(`${tankId}:flow_rate`);

    const level = Math.max(
      5,
      Math.min(
        95,
        Number(priorLevel ?? (35 + Math.random() * 40)) +
          (Math.random() - 0.5) * 1.2,
      ),
    );

    const temperature = Math.max(
      -50,
      Math.min(
        200,
        Number(priorTemp ?? (24 + Math.random() * 8)) +
          (Math.random() - 0.5) * 0.6,
      ),
    );

    const flowRate = Math.max(
      0,
      Number(priorFlow ?? (5 + Math.random() * 15)) +
        (Math.random() - 0.5) * 1.5,
    );

    const capacity = Number(tank.capacity ?? 10000);
    const volume = Math.max(0, (capacity * level) / 100);

    const { error } = await rpc(
      "record_simulated_tank_telemetry",
      {
        p_organization_id: organizationId,
        p_site_id: siteId,
        p_tank_id: tankId,
        p_level: Number(level.toFixed(2)),
        p_temperature: Number(temperature.toFixed(2)),
        p_flow_rate: Number(flowRate.toFixed(2)),
        p_totalized_volume: Number(volume.toFixed(2)),
        p_volume_unit: capacityUnit,
      },
    );

    if (error) {
      return NextResponse.json(
        { error: "Telemetry write failed" },
        { status: 500 },
      );
    }

    const site = siteRows.find((item) => item.id === siteId);

    const status =
      level >= 90 || level <= 10
        ? "Critical"
        : level >= 82 || level <= 18
          ? "Warning"
          : "Normal";

    readings.push({
      id: tankId,
      tankCode,
      siteId,
      siteName: String(site?.name ?? "Unknown site"),
      name: String(tank.name ?? tankCode),
      product: String(tank.product ?? "Unspecified"),
      capacity,
      capacityUnit,
      level: Number(level.toFixed(2)),
      temperature: Number(temperature.toFixed(2)),
      pressure: null,
      flow: Number(flowRate.toFixed(2)),
      flowUnit: "L/min",
      status,
      gateway: tank.gateway_id
        ? "Assigned — connectivity unverified"
        : "Not configured",
      gatewayConfigured: Boolean(tank.gateway_id),
      sensors: [
        {
          id: `LT-${tankCode}`,
          type: "Level Sensor",
          unit: "%",
        },
        {
          id: `TT-${tankCode}`,
          type: "Temperature Sensor",
          unit: "°C",
        },
        {
          id: `FT-${tankCode}`,
          type: "Flow Sensor",
          unit: "L/min",
        },
      ],
      mode: "SIMULATED",
    });
  }

  const recordedAt = new Date().toISOString();

  return NextResponse.json({
    mode: "SIMULATED",
    sites,
    tanks: readings,
    recorded_at: recordedAt,
  });
}
