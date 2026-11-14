import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const statuses = [
  "normal",
  "warning",
  "critical",
  "offline",
  "maintenance",
] as const;

const units = ["L", "KL", "M3", "GAL"] as const;

async function getContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const membership = memberships?.[0];

  if (!membership) {
    return {
      response: NextResponse.json(
        { error: "Organization membership required." },
        { status: 403 },
      ),
    };
  }

  return { supabase, membership };
}

export async function GET() {
  try {
    const context = await getContext();

    if ("response" in context) {
      return context.response;
    }

    const { supabase, membership } = context;
    const organizationId = membership.organization_id;

    const [tanksResult, sitesResult] = await Promise.all([
      supabase
        .from("tanks")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("sites")
        .select("id, name, code, location, status")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),
    ]);

    if (tanksResult.error) {
      throw new Error(tanksResult.error.message);
    }

    if (sitesResult.error) {
      throw new Error(sitesResult.error.message);
    }

    return NextResponse.json({
      tanks: tanksResult.data ?? [],
      sites: sitesResult.data ?? [],
      canManage: ["owner", "admin"].includes(membership.role),
    });
  } catch (error) {
    console.error("Tank inventory GET failed:", error);

    return NextResponse.json(
      { error: "Unable to load tank inventory." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getContext();

    if ("response" in context) {
      return context.response;
    }

    const { supabase, membership } = context;

    if (!["owner", "admin"].includes(membership.role)) {
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
        { error: "Tank name is required and must be 120 characters or fewer." },
        { status: 400 },
      );
    }

    if (
      typeof input.tank_code !== "string" ||
      !/^[A-Za-z0-9_-]{1,40}$/.test(input.tank_code.trim())
    ) {
      return NextResponse.json(
        { error: "Tank code must contain 1–40 letters, numbers, underscores or hyphens." },
        { status: 400 },
      );
    }

    if (typeof input.site_id !== "string" || !input.site_id.trim()) {
      return NextResponse.json(
        { error: "A valid site is required." },
        { status: 400 },
      );
    }

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("id", input.site_id)
      .eq("organization_id", membership.organization_id)
      .maybeSingle();

    if (siteError) {
      throw new Error(siteError.message);
    }

    if (!site) {
      return NextResponse.json(
        { error: "Site not found in your organization." },
        { status: 400 },
      );
    }

    let capacity: number | null = null;

    if (input.capacity !== undefined && input.capacity !== null && input.capacity !== "") {
      capacity = Number(input.capacity);

      if (
        !Number.isFinite(capacity) ||
        capacity <= 0 ||
        capacity > 1_000_000_000_000
      ) {
        return NextResponse.json(
          { error: "Capacity must be a positive valid number." },
          { status: 400 },
        );
      }
    }

    const rawUnit = input.capacity_unit ?? "L";

    if (
      typeof rawUnit !== "string" ||
      !units.includes(rawUnit.trim().toUpperCase() as (typeof units)[number])
    ) {
      return NextResponse.json(
        { error: "Capacity unit must be L, KL, M3 or GAL." },
        { status: 400 },
      );
    }

    const rawStatus = input.status ?? "normal";

    if (
      typeof rawStatus !== "string" ||
      !statuses.includes(rawStatus as (typeof statuses)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid tank status." },
        { status: 400 },
      );
    }

    for (const field of ["product", "description"] as const) {
      if (
        input[field] !== undefined &&
        input[field] !== null &&
        typeof input[field] !== "string"
      ) {
        return NextResponse.json(
          { error: `Invalid ${field}.` },
          { status: 400 },
        );
      }
    }

    const { data: tank, error: insertError } = await supabase
      .from("tanks")
      .insert({
        organization_id: membership.organization_id,
        site_id: site.id,
        name: input.name.trim(),
        tank_code: input.tank_code.trim().toUpperCase(),
        product:
          typeof input.product === "string"
            ? input.product.trim() || null
            : null,
        description:
          typeof input.description === "string"
            ? input.description.trim() || null
            : null,
        capacity,
        capacity_unit: rawUnit.trim().toUpperCase(),
        status: rawStatus as (typeof statuses)[number],
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Tank code already exists in your organization." },
          { status: 409 },
        );
      }

      if (insertError.code === "42501") {
        return NextResponse.json(
          { error: "Permission denied by database security policy." },
          { status: 403 },
        );
      }

      throw new Error(insertError.message);
    }

    return NextResponse.json({ tank }, { status: 201 });
  } catch (error) {
    console.error("Tank inventory POST failed:", error);

    return NextResponse.json(
      { error: "Unable to create tank." },
      { status: 500 },
    );
  }
}
