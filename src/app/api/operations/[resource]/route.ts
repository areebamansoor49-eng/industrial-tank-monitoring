import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const adminRoles = ["owner", "admin"];
const deliveryStatuses = ["scheduled", "in_transit", "completed", "cancelled"];
const alertStatuses = ["open", "acknowledged", "resolved"];
const incidentStatuses = ["open", "investigating", "resolved", "closed"];

async function getContext() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const membership = memberships?.[0];

  if (!membership) {
    return { response: NextResponse.json({ error: "Organization membership required." }, { status: 403 }) };
  }

  return {
    supabase,
    organizationId: membership.organization_id,
    canManage: adminRoles.includes(membership.role),
  };
}

function fail(error: unknown, label: string) {
  console.error(`${label}:`, error);
  return NextResponse.json({ error: "The operation could not be completed." }, { status: 500 });
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params;
    const ctx = await getContext();
    if ("response" in ctx) return ctx.response;

    const { supabase, organizationId, canManage } = ctx;
    const url = new URL(request.url);

    if (resource === "deliveries") {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, sites(name), tanks(name, tank_code)")
        .eq("organization_id", organizationId)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ records: data ?? [], canManage });
    }

    if (resource === "alerts") {
      const { data, error } = await supabase
        .from("alerts")
        .select("*, sites(name), tanks(name, tank_code)")
        .eq("organization_id", organizationId)
        .order("triggered_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ records: data ?? [], canManage });
    }

    if (resource === "incidents") {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, sites(name), tanks(name, tank_code)")
        .eq("organization_id", organizationId)
        .order("opened_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ records: data ?? [], canManage });
    }

    if (resource === "reports") {
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");
      const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 86400000);
      const endDate = end ? new Date(`${end}T23:59:59.999`) : new Date();

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
        return NextResponse.json({ error: "Invalid report date range." }, { status: 400 });
      }

      const [tanks, sites, deliveries, alerts, incidents, telemetry] = await Promise.all([
        supabase.from("tanks").select("id, name, tank_code, product, capacity, capacity_unit, status, site_id").eq("organization_id", organizationId),
        supabase.from("sites").select("id, name, code, status").eq("organization_id", organizationId),
        supabase.from("deliveries").select("id, status, planned_volume, delivered_volume, volume_unit, scheduled_at, completed_at").eq("organization_id", organizationId).gte("scheduled_at", startDate.toISOString()).lte("scheduled_at", endDate.toISOString()),
        supabase.from("alerts").select("id, severity, status, triggered_at, resolved_at").eq("organization_id", organizationId).gte("triggered_at", startDate.toISOString()).lte("triggered_at", endDate.toISOString()),
        supabase.from("incidents").select("id, status, opened_at, resolved_at").eq("organization_id", organizationId).gte("opened_at", startDate.toISOString()).lte("opened_at", endDate.toISOString()),
        supabase.from("telemetry").select("id, tank_id, metric, value, unit, quality, recorded_at").eq("organization_id", organizationId).gte("recorded_at", startDate.toISOString()).lte("recorded_at", endDate.toISOString()).order("recorded_at", { ascending: true }).limit(2000),
      ]);

      for (const result of [tanks, sites, deliveries, alerts, incidents, telemetry]) {
        if (result.error) throw result.error;
      }

      return NextResponse.json({
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        tanks: tanks.data ?? [],
        sites: sites.data ?? [],
        deliveries: deliveries.data ?? [],
        alerts: alerts.data ?? [],
        incidents: incidents.data ?? [],
        telemetry: telemetry.data ?? [],
      });
    }

    return NextResponse.json({ error: "Unknown operational resource." }, { status: 404 });
  } catch (error) {
    return fail(error, "Operations GET failed");
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params;
    const ctx = await getContext();
    if ("response" in ctx) return ctx.response;

    if (!ctx.canManage) {
      return NextResponse.json({ error: "Owner or admin permission required." }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { supabase, organizationId } = ctx;

    if (resource === "deliveries") {
      const requiredText = ["reference_number", "supplier", "product"];
      for (const key of requiredText) {
        if (typeof body[key] !== "string" || !(body[key] as string).trim()) {
          return NextResponse.json({ error: `${key.replaceAll("_", " ")} is required.` }, { status: 400 });
        }
      }

      const planned = Number(body.planned_volume);
      if (!Number.isFinite(planned) || planned <= 0) {
        return NextResponse.json({ error: "Planned volume must be greater than zero." }, { status: 400 });
      }

      if (!["L", "KL", "M3", "GAL"].includes(String(body.volume_unit ?? "L").toUpperCase())) {
        return NextResponse.json({ error: "Invalid volume unit." }, { status: 400 });
      }

      if (typeof body.site_id !== "string" || typeof body.tank_id !== "string") {
        return NextResponse.json({ error: "Select a site and tank." }, { status: 400 });
      }

      const { data: tank, error: tankError } = await supabase
        .from("tanks")
        .select("id, site_id")
        .eq("id", body.tank_id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (tankError) throw tankError;
      if (!tank || tank.site_id !== body.site_id) {
        return NextResponse.json({ error: "Selected tank does not belong to the selected site." }, { status: 400 });
      }

      const scheduledAt = typeof body.scheduled_at === "string" ? new Date(body.scheduled_at) : null;
      if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
        return NextResponse.json({ error: "A valid scheduled date is required." }, { status: 400 });
      }

      const { data, error } = await supabase.from("deliveries").insert({
        organization_id: organizationId,
        site_id: body.site_id,
        tank_id: body.tank_id,
        reference_number: (body.reference_number as string).trim(),
        supplier: (body.supplier as string).trim(),
        product: (body.product as string).trim(),
        planned_volume: planned,
        delivered_volume: 0,
        volume_unit: String(body.volume_unit ?? "L").toUpperCase(),
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
        notes: typeof body.notes === "string" ? body.notes.trim() : null,
      }).select("*").single();

      if (error) throw error;
      return NextResponse.json({ record: data }, { status: 201 });
    }

    if (resource === "alerts") {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Alert title is required." }, { status: 400 });
      }

      if (typeof body.message !== "string" || !body.message.trim()) {
        return NextResponse.json({ error: "Alert message is required." }, { status: 400 });
      }

      const severityValue = String(body.severity ?? "");
      if (!["info", "warning", "critical"].includes(severityValue)) {
        return NextResponse.json({ error: "Select a valid alert severity." }, { status: 400 });
      }
      const severity = severityValue as "info" | "warning" | "critical";

      let siteId: string | null =
        typeof body.site_id === "string" && body.site_id.trim()
          ? body.site_id
          : null;

      let tankId: string | null =
        typeof body.tank_id === "string" && body.tank_id.trim()
          ? body.tank_id
          : null;

      if (siteId) {
        const { data: site, error: siteError } = await supabase
          .from("sites")
          .select("id")
          .eq("id", siteId)
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (siteError) throw siteError;
        if (!site) {
          return NextResponse.json({ error: "Invalid site selection." }, { status: 400 });
        }
      }

      if (tankId) {
        const { data: tank, error: tankError } = await supabase
          .from("tanks")
          .select("id, site_id")
          .eq("id", tankId)
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (tankError) throw tankError;
        if (!tank) {
          return NextResponse.json({ error: "Invalid tank selection." }, { status: 400 });
        }

        if (siteId && tank.site_id !== siteId) {
          return NextResponse.json(
            { error: "Selected tank does not belong to the selected site." },
            { status: 400 }
          );
        }

        siteId = tank.site_id;
      }

      const triggeredValue =
        body.triggered_value === "" || body.triggered_value == null
          ? null
          : Number(body.triggered_value);

      const thresholdValue =
        body.threshold_value === "" || body.threshold_value == null
          ? null
          : Number(body.threshold_value);

      if (
        (triggeredValue !== null && !Number.isFinite(triggeredValue)) ||
        (thresholdValue !== null && !Number.isFinite(thresholdValue))
      ) {
        return NextResponse.json(
          { error: "Triggered and threshold values must be valid numbers." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("alerts")
        .insert({
          organization_id: organizationId,
          site_id: siteId,
          tank_id: tankId,
          severity,
          status: "open",
          title: body.title.trim(),
          message: body.message.trim(),
          triggered_value: triggeredValue,
          threshold_value: thresholdValue,
        })
        .select("*")
        .single();

      if (error) throw error;

      return NextResponse.json({ record: data }, { status: 201 });
    }

    if (resource === "incidents") {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Incident title is required." }, { status: 400 });
      }

      let siteId: string | null = typeof body.site_id === "string" ? body.site_id : null;
      let tankId: string | null = typeof body.tank_id === "string" ? body.tank_id : null;

      if (tankId) {
        const { data: tank, error } = await supabase.from("tanks")
          .select("id, site_id").eq("id", tankId).eq("organization_id", organizationId).maybeSingle();
        if (error) throw error;
        if (!tank || (siteId && tank.site_id !== siteId)) {
          return NextResponse.json({ error: "Invalid tank or site selection." }, { status: 400 });
        }
        siteId = tank.site_id;
      }

      const { data, error } = await supabase.from("incidents").insert({
        organization_id: organizationId,
        site_id: siteId,
        tank_id: tankId,
        title: body.title.trim(),
        description: typeof body.description === "string" ? body.description.trim() : null,
        status: "open",
      }).select("*").single();

      if (error) throw error;
      return NextResponse.json({ record: data }, { status: 201 });
    }

    return NextResponse.json({ error: "This resource does not support creation." }, { status: 405 });
  } catch (error) {
    return fail(error, "Operations POST failed");
  }
}
