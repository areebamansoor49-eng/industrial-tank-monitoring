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

type RouteContext = {
  params: Promise<{ id: string }>;
};

function optionalText(value: unknown, field: string, max = 160) {
  if (value === undefined || value === null || value === "") {
    return { value: null, error: null };
  }

  if (typeof value !== "string" || value.trim().length > max) {
    return { value: null, error: `Invalid ${field}. Maximum ${max} characters.` };
  }

  return { value: value.trim() || null, error: null };
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

    const { id } = await params;

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
    const updates: Record<string, string | null> = {};

    if (Object.hasOwn(input, "name")) {
      if (
        typeof input.name !== "string" ||
        !input.name.trim() ||
        input.name.trim().length > 120
      ) {
        return NextResponse.json(
          { error: "Site name is required (maximum 120 characters)." },
          { status: 400 },
        );
      }

      updates.name = input.name.trim();
    }

    if (Object.hasOwn(input, "code")) {
      if (
        typeof input.code !== "string" ||
        !/^[A-Za-z0-9_-]{1,40}$/.test(input.code.trim())
      ) {
        return NextResponse.json(
          { error: "Invalid site code." },
          { status: 400 },
        );
      }

      updates.code = input.code.trim().toUpperCase();
    }

    for (const [field, max] of [
      ["location", 160],
      ["timezone", 80],
      ["description", 1000],
    ] as const) {
      if (Object.hasOwn(input, field)) {
        const result = optionalText(input[field], field, max);

        if (result.error) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 },
          );
        }

        updates[field] = result.value;
      }
    }

    if (Object.hasOwn(input, "status")) {
      if (
        typeof input.status !== "string" ||
        !statuses.includes(input.status as (typeof statuses)[number])
      ) {
        return NextResponse.json(
          { error: "Invalid site status." },
          { status: 400 },
        );
      }

      updates.status = input.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid site fields were provided." },
        { status: 400 },
      );
    }

    const { data: site, error } = await supabase
      .from("sites")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", membership.organization_id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A site with this code already exists in your organization." },
          { status: 409 },
        );
      }

      throw error;
    }

    if (!site) {
      return NextResponse.json(
        { error: "Site not found in your organization." },
        { status: 404 },
      );
    }

    return NextResponse.json({ site });
  } catch (error) {
    console.error("Sites PATCH failed:", error);
    return NextResponse.json(
      { error: "Unable to update site." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
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

    const { id } = await params;

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("id", id)
      .eq("organization_id", membership.organization_id)
      .maybeSingle();

    if (siteError) throw siteError;

    if (!site) {
      return NextResponse.json(
        { error: "Site not found in your organization." },
        { status: 404 },
      );
    }

    const [tanksResult, gatewaysResult] = await Promise.all([
      supabase
        .from("tanks")
        .select("id", { count: "exact", head: true })
        .eq("site_id", id)
        .eq("organization_id", membership.organization_id),

      supabase
        .from("gateways")
        .select("id", { count: "exact", head: true })
        .eq("site_id", id)
        .eq("organization_id", membership.organization_id),
    ]);

    if (tanksResult.error) throw tanksResult.error;
    if (gatewaysResult.error) throw gatewaysResult.error;

    const tankCount = tanksResult.count ?? 0;
    const gatewayCount = gatewaysResult.count ?? 0;

    if (tankCount > 0 || gatewayCount > 0) {
      return NextResponse.json(
        {
          error: `This site cannot be deleted because it has ${tankCount} tank(s) and ${gatewayCount} gateway(s) assigned. Reassign or remove those assets first.`,
        },
        { status: 409 },
      );
    }

    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", id)
      .eq("organization_id", membership.organization_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sites DELETE failed:", error);
    return NextResponse.json(
      { error: "Unable to delete site." },
      { status: 500 },
    );
  }
}
