
import { NextResponse } from "next/server";
import {
  getOrganizationApiContext,
  isOrganizationAdmin,
} from "@/lib/organization-api";

const statuses = ["online", "offline", "warning", "maintenance"] as const;

function optionalText(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return { value: null, error: null };
  }

  if (typeof value !== "string" || value.trim().length > 120) {
    return { value: null, error: `Invalid ${field}.` };
  }

  return { value: value.trim() || null, error: null };
}

export async function GET() {
  try {
    const context = await getOrganizationApiContext();

    if ("response" in context) return context.response;

    const { supabase, membership } = context;

    const [gatewaysResult, sitesResult] = await Promise.all([
      supabase
        .from("gateways")
        .select("*")
        .eq("organization_id", membership.organization_id)
        .order("created_at", { ascending: false }),

      supabase
        .from("sites")
        .select("id, name, code")
        .eq("organization_id", membership.organization_id)
        .order("name"),
    ]);

    if (gatewaysResult.error) throw gatewaysResult.error;
    if (sitesResult.error) throw sitesResult.error;

    return NextResponse.json({
      gateways: gatewaysResult.data ?? [],
      sites: sitesResult.data ?? [],
      canManage: isOrganizationAdmin(membership.role),
    });
  } catch (error) {
    console.error("Gateway GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load gateways." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOrganizationApiContext();

    if ("response" in context) return context.response;

    const { supabase, membership } = context;

    if (!isOrganizationAdmin(membership.role)) {
      return NextResponse.json(
        { error: "Owner or admin permission required." },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    if (
      typeof input.name !== "string" ||
      !input.name.trim() ||
      input.name.trim().length > 120
    ) {
      return NextResponse.json(
        { error: "Gateway name is required (maximum 120 characters)." },
        { status: 400 },
      );
    }

    if (
      typeof input.gateway_code !== "string" ||
      !/^[A-Za-z0-9_-]{1,40}$/.test(input.gateway_code.trim())
    ) {
      return NextResponse.json(
        { error: "Gateway code must contain 1–40 letters, numbers, underscores or hyphens." },
        { status: 400 },
      );
    }

    const siteId =
      typeof input.site_id === "string" && input.site_id.trim()
        ? input.site_id.trim()
        : null;

    if (siteId) {
      const { data: site, error } = await supabase
        .from("sites")
        .select("id")
        .eq("id", siteId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

      if (error) throw error;

      if (!site) {
        return NextResponse.json(
          { error: "Selected site does not belong to your organization." },
          { status: 400 },
        );
      }
    }

    const rawStatus = input.status ?? "offline";

    if (
      typeof rawStatus !== "string" ||
      !statuses.includes(rawStatus as (typeof statuses)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid gateway status." },
        { status: 400 },
      );
    }

    const fields = ["manufacturer", "model", "serial_number", "firmware_version"] as const;
    const optional: Record<string, string | null> = {};

    for (const field of fields) {
      const result = optionalText(input[field], field);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      optional[field] = result.value;
    }

    const { data: gateway, error } = await supabase
      .from("gateways")
      .insert({
        organization_id: membership.organization_id,
        site_id: siteId,
        name: input.name.trim(),
        gateway_code: input.gateway_code.trim().toUpperCase(),
        manufacturer: optional.manufacturer,
        model: optional.model,
        serial_number: optional.serial_number,
        firmware_version: optional.firmware_version,
        status: rawStatus as (typeof statuses)[number],
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Gateway code already exists in your organization." },
          { status: 409 },
        );
      }

      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Permission denied by database security policy." },
          { status: 403 },
        );
      }

      throw error;
    }

    return NextResponse.json({ gateway }, { status: 201 });
  } catch (error) {
    console.error("Gateway POST failed:", error);
    return NextResponse.json(
      { error: "Unable to create gateway." },
      { status: 500 },
    );
  }
}
