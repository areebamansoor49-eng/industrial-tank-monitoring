import { NextResponse } from "next/server";
import {
  getOrganizationApiContext,
  isOrganizationAdmin,
} from "@/lib/organization-api";

const statuses = [
  "operational",
  "maintenance",
  "offline",
  "archived",
] as const;

function optionalText(value: unknown, field: string, max = 160) {
  if (value === undefined || value === null || value === "") {
    return { value: null, error: null };
  }

  if (typeof value !== "string" || value.trim().length > max) {
    return { value: null, error: `Invalid ${field}. Maximum ${max} characters.` };
  }

  return { value: value.trim() || null, error: null };
}

function validName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 120
  );
}

function validCode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9_-]{1,40}$/.test(value.trim())
  );
}

export async function GET() {
  try {
    const context = await getOrganizationApiContext();

    if ("response" in context) return context.response;

    const { supabase, membership } = context;

    const { data: sites, error } = await supabase
      .from("sites")
      .select("*")
      .eq("organization_id", membership.organization_id)
      .order("name");

    if (error) throw error;

    return NextResponse.json({
      sites: sites ?? [],
      canManage: isOrganizationAdmin(membership.role),
    });
  } catch (error) {
    console.error("Sites GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load sites." },
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

    if (!validName(input.name)) {
      return NextResponse.json(
        { error: "Site name is required (maximum 120 characters)." },
        { status: 400 },
      );
    }

    if (!validCode(input.code)) {
      return NextResponse.json(
        { error: "Site code must contain 1–40 letters, numbers, underscores or hyphens." },
        { status: 400 },
      );
    }

    const location = optionalText(input.location, "location");
    const timezone = optionalText(input.timezone, "timezone", 80);
    const description = optionalText(input.description, "description", 1000);

    for (const result of [location, timezone, description]) {
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 },
        );
      }
    }

    const status = input.status ?? "operational";

    if (
      typeof status !== "string" ||
      !statuses.includes(status as (typeof statuses)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid site status." },
        { status: 400 },
      );
    }

    const { data: site, error } = await supabase
      .from("sites")
      .insert({
        organization_id: membership.organization_id,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        location: location.value,
        timezone: timezone.value,
        description: description.value,
        status: status as (typeof statuses)[number],
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A site with this code already exists in your organization." },
          { status: 409 },
        );
      }

      throw error;
    }

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error("Sites POST failed:", error);
    return NextResponse.json(
      { error: "Unable to create site." },
      { status: 500 },
    );
  }
}
