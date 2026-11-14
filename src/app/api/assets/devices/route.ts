
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
    const organizationId = membership.organization_id;

    const [devicesResult, sitesResult, gatewaysResult, tanksResult] =
      await Promise.all([
        supabase
          .from("devices")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),

        supabase
          .from("sites")
          .select("id, name, code")
          .eq("organization_id", organizationId)
          .order("name"),

        supabase
          .from("gateways")
          .select("id, name, gateway_code")
          .eq("organization_id", organizationId)
          .order("name"),

        supabase
          .from("tanks")
          .select("id, name, tank_code")
          .eq("organization_id", organizationId)
          .order("name"),
      ]);

    if (devicesResult.error) throw devicesResult.error;
    if (sitesResult.error) throw sitesResult.error;
    if (gatewaysResult.error) throw gatewaysResult.error;
    if (tanksResult.error) throw tanksResult.error;

    return NextResponse.json({
      devices: devicesResult.data ?? [],
      sites: sitesResult.data ?? [],
      gateways: gatewaysResult.data ?? [],
      tanks: tanksResult.data ?? [],
      canManage: isOrganizationAdmin(membership.role),
    });
  } catch (error) {
    console.error("Device GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load devices." },
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

    for (const field of ["name", "device_code", "device_type"] as const) {
      if (
        typeof input[field] !== "string" ||
        !input[field].trim() ||
        input[field].trim().length > 120
      ) {
        return NextResponse.json(
          { error: `${field} is required and must be 120 characters or fewer.` },
          { status: 400 },
        );
      }
    }

    if (!/^[A-Za-z0-9_-]{1,40}$/.test((input.device_code as string).trim())) {
      return NextResponse.json(
        { error: "Device code must contain 1–40 letters, numbers, underscores or hyphens." },
        { status: 400 },
      );
    }

    const references = [
      { field: "site_id", table: "sites" as const },
      { field: "gateway_id", table: "gateways" as const },
      { field: "tank_id", table: "tanks" as const },
    ];

    const ids: Record<string, string | null> = {};

    for (const reference of references) {
      const raw = input[reference.field];

      if (raw !== undefined && raw !== null && raw !== "" && typeof raw !== "string") {
        return NextResponse.json(
          { error: `Invalid ${reference.field}.` },
          { status: 400 },
        );
      }

      const id = typeof raw === "string" && raw.trim() ? raw.trim() : null;
      ids[reference.field] = id;

      if (id) {
        const { data, error } = await supabase
          .from(reference.table)
          .select("id")
          .eq("id", id)
          .eq("organization_id", membership.organization_id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          return NextResponse.json(
            { error: `Selected ${reference.field.replace("_id", "")} does not belong to your organization.` },
            { status: 400 },
          );
        }
      }
    }

    const rawStatus = input.status ?? "offline";

    if (
      typeof rawStatus !== "string" ||
      !statuses.includes(rawStatus as (typeof statuses)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid device status." },
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

    const { data: device, error } = await supabase
      .from("devices")
      .insert({
        organization_id: membership.organization_id,
        site_id: ids.site_id,
        gateway_id: ids.gateway_id,
        tank_id: ids.tank_id,
        name: (input.name as string).trim(),
        device_code: (input.device_code as string).trim().toUpperCase(),
        device_type: (input.device_type as string).trim(),
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
          { error: "Device code already exists in your organization." },
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

    return NextResponse.json({ device }, { status: 201 });
  } catch (error) {
    console.error("Device POST failed:", error);
    return NextResponse.json(
      { error: "Unable to create device." },
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
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const body = input as Record<string, unknown>;
    const id = body.id;

    if (
      typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json({ error: "Valid device ID is required." }, { status: 400 });
    }

    for (const field of ["name", "device_code", "device_type"] as const) {
      if (
        typeof body[field] !== "string" ||
        !body[field].trim() ||
        body[field].trim().length > 120
      ) {
        return NextResponse.json(
          { error: `${field} is required and must be 120 characters or fewer.` },
          { status: 400 },
        );
      }
    }

    const deviceCode = (body.device_code as string).trim().toUpperCase();

    if (!/^[A-Z0-9_-]{1,40}$/.test(deviceCode)) {
      return NextResponse.json(
        { error: "Invalid device code." },
        { status: 400 },
      );
    }

    const references = [
      { field: "site_id", table: "sites" as const },
      { field: "gateway_id", table: "gateways" as const },
      { field: "tank_id", table: "tanks" as const },
    ];

    const ids: Record<string, string | null> = {};

    for (const reference of references) {
      const raw = body[reference.field];

      if (raw !== undefined && raw !== null && raw !== "" && typeof raw !== "string") {
        return NextResponse.json(
          { error: `Invalid ${reference.field}.` },
          { status: 400 },
        );
      }

      const value = typeof raw === "string" && raw.trim() ? raw.trim() : null;
      ids[reference.field] = value;

      if (value) {
        const { data, error } = await supabase
          .from(reference.table)
          .select("id")
          .eq("id", value)
          .eq("organization_id", membership.organization_id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          return NextResponse.json(
            { error: `Selected ${reference.field.replace("_id", "")} does not belong to your organization.` },
            { status: 400 },
          );
        }
      }
    }

    const rawStatus = body.status ?? "offline";

    if (
      typeof rawStatus !== "string" ||
      !statuses.includes(rawStatus as (typeof statuses)[number])
    ) {
      return NextResponse.json({ error: "Invalid device status." }, { status: 400 });
    }

    const optional: Record<string, string | null> = {};

    for (const field of ["manufacturer", "model", "serial_number", "firmware_version"] as const) {
      const result = optionalText(body[field], field);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      optional[field] = result.value;
    }

    const { data: device, error } = await supabase
      .from("devices")
      .update({
        site_id: ids.site_id,
        gateway_id: ids.gateway_id,
        tank_id: ids.tank_id,
        name: (body.name as string).trim(),
        device_code: deviceCode,
        device_type: (body.device_type as string).trim(),
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
        return NextResponse.json({ error: "Device code already exists in your organization." }, { status: 409 });
      }
      if (error.code === "42501") {
        return NextResponse.json({ error: "Permission denied by database security policy." }, { status: 403 });
      }
      throw error;
    }

    if (!device) {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }

    return NextResponse.json({ device });
  } catch (error) {
    console.error("Device PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update device." }, { status: 500 });
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
      return NextResponse.json({ error: "Valid device ID is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("devices")
      .delete()
      .eq("id", id)
      .eq("organization_id", membership.organization_id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "42501") {
        return NextResponse.json({ error: "Permission denied by database security policy." }, { status: 403 });
      }
      if (error.code === "23503") {
        return NextResponse.json({ error: "This device is linked to other records and cannot be deleted." }, { status: 409 });
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Device DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete device." }, { status: 500 });
  }
}
