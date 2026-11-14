
import { NextResponse } from "next/server";
import {
  getOrganizationApiContext,
  isOrganizationAdmin,
} from "@/lib/organization-api";

const statuses = ["online", "offline", "warning", "maintenance"] as const;

function optionalText(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return { value: null as string | null, error: null };
  }

  if (typeof value !== "string" || value.trim().length > 120) {
    return {
      value: null,
      error: `${field} must be text with a maximum of 120 characters.`,
    };
  }

  return { value: value.trim(), error: null };
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
        { error: "Administrator permission required." },
        { status: 403 },
      );
    }

    const input: unknown = await request.json();

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const body = input as Record<string, unknown>;
    const name = body.name;
    const gatewayCode = body.gateway_code;
    const rawSiteId = body.site_id;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 120
    ) {
      return NextResponse.json(
        { error: "A valid gateway name is required (maximum 120 characters)." },
        { status: 400 },
      );
    }

    if (
      typeof gatewayCode !== "string" ||
      !/^[A-Za-z0-9_-]{1,40}$/.test(gatewayCode.trim())
    ) {
      return NextResponse.json(
        { error: "Gateway code must contain only letters, numbers, hyphens or underscores (maximum 40 characters)." },
        { status: 400 },
      );
    }

    let siteId: string | null = null;

    if (rawSiteId !== undefined && rawSiteId !== null && rawSiteId !== "") {
      if (typeof rawSiteId !== "string") {
        return NextResponse.json(
          { error: "Invalid site selection." },
          { status: 400 },
        );
      }

      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id")
        .eq("id", rawSiteId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

      if (siteError) throw siteError;

      if (!site) {
        return NextResponse.json(
          { error: "Selected site does not belong to your organization." },
          { status: 400 },
        );
      }

      siteId = site.id;
    }

    const optionalFields = [
      "manufacturer",
      "model",
      "serial_number",
      "firmware_version",
    ] as const;

    const optional: Record<string, string | null> = {};

    for (const field of optionalFields) {
      const result = optionalText(body[field], field);

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 },
        );
      }

      optional[field] = result.value;
    }

    const rawStatus = body.status ?? "offline";

    if (
      typeof rawStatus !== "string" ||
      !statuses.includes(rawStatus as (typeof statuses)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid gateway status." },
        { status: 400 },
      );
    }

    const { data: gateway, error } = await supabase
      .from("gateways")
      .insert({
        organization_id: membership.organization_id,
        site_id: siteId,
        name: name.trim(),
        gateway_code: gatewayCode.trim().toUpperCase(),
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
      { error: "Unable to register gateway." },
      { status: 500 },
    );
  }
}


export async function PATCH(request: Request) {
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

    const input: unknown = await request.json();

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const body = input as Record<string, unknown>;
    const id = body.id;

    if (
      typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json(
        { error: "Invalid gateway ID." },
        { status: 400 },
      );
    }

    const name = body.name;
    const gatewayCode = body.gateway_code;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 120
    ) {
      return NextResponse.json(
        { error: "A valid gateway name is required (maximum 120 characters)." },
        { status: 400 },
      );
    }

    if (
      typeof gatewayCode !== "string" ||
      !/^[A-Za-z0-9_-]{1,40}$/.test(gatewayCode.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid gateway code. Use letters, numbers, hyphens or underscores (maximum 40 characters)." },
        { status: 400 },
      );
    }

    let siteId: string | null = null;
    const rawSiteId = body.site_id;

    if (rawSiteId !== undefined && rawSiteId !== null && rawSiteId !== "") {
      if (typeof rawSiteId !== "string") {
        return NextResponse.json(
          { error: "Invalid site selection." },
          { status: 400 },
        );
      }

      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id")
        .eq("id", rawSiteId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

      if (siteError) throw siteError;

      if (!site) {
        return NextResponse.json(
          { error: "Selected site does not belong to your organization." },
          { status: 400 },
        );
      }

      siteId = site.id;
    }

    const optionalFields = [
      "manufacturer",
      "model",
      "serial_number",
      "firmware_version",
    ] as const;

    const optional: Record<string, string | null> = {};

    for (const field of optionalFields) {
      const result = optionalText(body[field], field);

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 },
        );
      }

      optional[field] = result.value;
    }

    const rawStatus = body.status ?? "offline";

    if (
      typeof rawStatus !== "string" ||
      !statuses.includes(rawStatus as (typeof statuses)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid gateway status." },
        { status: 400 },
      );
    }

    const { data: gateway, error } = await supabase
      .from("gateways")
      .update({
        site_id: siteId,
        name: name.trim(),
        gateway_code: gatewayCode.trim().toUpperCase(),
        manufacturer: optional.manufacturer,
        model: optional.model,
        serial_number: optional.serial_number,
        firmware_version: optional.firmware_version,
        status: rawStatus as (typeof statuses)[number],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", membership.organization_id)
      .select("*")
      .maybeSingle();

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

    if (!gateway) {
      return NextResponse.json(
        { error: "Gateway not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ gateway });
  } catch (error) {
    console.error("Gateway PATCH failed:", error);
    return NextResponse.json(
      { error: "Unable to update gateway." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
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

    const id = new URL(request.url).searchParams.get("id");

    if (
      !id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json(
        { error: "Invalid gateway ID." },
        { status: 400 },
      );
    }

    const { data: deletedGateway, error } = await supabase
      .from("gateways")
      .delete()
      .eq("id", id)
      .eq("organization_id", membership.organization_id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "This gateway cannot be deleted because devices or other records are linked to it." },
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

    if (!deletedGateway) {
      return NextResponse.json(
        { error: "Gateway not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      id: deletedGateway.id,
    });
  } catch (error) {
    console.error("Gateway DELETE failed:", error);
    return NextResponse.json(
      { error: "Unable to delete gateway." },
      { status: 500 },
    );
  }
}
