import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const statuses = [
  "normal",
  "warning",
  "critical",
  "offline",
  "maintenance",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("organization_members")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (membershipError) throw new Error(membershipError.message);

    const membership = memberships?.[0];

    if (!membership) {
      return NextResponse.json(
        { error: "Organization membership required." },
        { status: 403 },
      );
    }

    if (!["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Owner or admin permission required." },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;
    const update: {
      name?: string;
      tank_code?: string;
      site_id?: string;
      product?: string | null;
      description?: string | null;
      capacity?: number | null;
      capacity_unit?: string;
      status?: (typeof statuses)[number];
    } = {};

    if ("name" in input) {
      if (
        typeof input.name !== "string" ||
        !input.name.trim() ||
        input.name.trim().length > 120
      ) {
        return NextResponse.json(
          { error: "Invalid tank name." },
          { status: 400 },
        );
      }
      update.name = input.name.trim();
    }

    if ("tank_code" in input) {
      if (
        typeof input.tank_code !== "string" ||
        !input.tank_code.trim() ||
        input.tank_code.trim().length > 40
      ) {
        return NextResponse.json(
          { error: "Invalid tank code." },
          { status: 400 },
        );
      }
      update.tank_code = input.tank_code.trim().toUpperCase();
    }

    if ("site_id" in input) {
      if (typeof input.site_id !== "string" || !input.site_id) {
        return NextResponse.json(
          { error: "Invalid site." },
          { status: 400 },
        );
      }

      const { data: site, error } = await supabase
        .from("sites")
        .select("id")
        .eq("id", input.site_id)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (!site) {
        return NextResponse.json(
          { error: "Site not found." },
          { status: 400 },
        );
      }

      update.site_id = site.id;
    }

    for (const field of ["product", "description"] as const) {
      if (field in input) {
        if (
          input[field] !== null &&
          typeof input[field] !== "string"
        ) {
          return NextResponse.json(
            { error: `Invalid ${field}.` },
            { status: 400 },
          );
        }

        const value = input[field];
        update[field] =
          typeof value === "string" ? value.trim() || null : null;
      }
    }

    if ("capacity" in input) {
      const capacity =
        input.capacity === "" || input.capacity == null
          ? null
          : Number(input.capacity);

      if (
        capacity !== null &&
        (!Number.isFinite(capacity) ||
          capacity <= 0 ||
          capacity > 1_000_000_000_000)
      ) {
        return NextResponse.json(
          { error: "Invalid capacity." },
          { status: 400 },
        );
      }

      update.capacity = capacity;
    }

    if ("capacity_unit" in input) {
      if (typeof input.capacity_unit !== "string") {
        return NextResponse.json(
          { error: "Invalid capacity unit." },
          { status: 400 },
        );
      }

      const unit = input.capacity_unit.trim().toUpperCase();

      if (!["L", "KL", "M3", "GAL"].includes(unit)) {
        return NextResponse.json(
          { error: "Invalid capacity unit." },
          { status: 400 },
        );
      }

      update.capacity_unit = unit;
    }

    if ("status" in input) {
      if (
        typeof input.status !== "string" ||
        !statuses.includes(input.status as (typeof statuses)[number])
      ) {
        return NextResponse.json(
          { error: "Invalid tank status." },
          { status: 400 },
        );
      }

      update.status = input.status as (typeof statuses)[number];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No changes supplied." },
        { status: 400 },
      );
    }

    const { data: tank, error } = await supabase
      .from("tanks")
      .update(update)
      .eq("id", id)
      .eq("organization_id", membership.organization_id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Tank code already exists." },
          { status: 409 },
        );
      }

      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Permission denied." },
          { status: 403 },
        );
      }

      throw new Error(error.message);
    }

    if (!tank) {
      return NextResponse.json(
        { error: "Tank not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ tank });
  } catch (error) {
    console.error("Tank inventory PATCH failed:", error);

    return NextResponse.json(
      { error: "Unable to update tank." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (membershipError) throw membershipError;

    const membership = memberships?.[0];

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Owner or admin permission required." }, { status: 403 });
    }

    const orgId = membership.organization_id;

    const [devices, sensors] = await Promise.all([
      supabase.from("devices").select("id", { count: "exact", head: true })
        .eq("tank_id", id).eq("organization_id", orgId),
      supabase.from("sensors").select("id", { count: "exact", head: true })
        .eq("tank_id", id).eq("organization_id", orgId),
    ]);

    if (devices.error) throw devices.error;
    if (sensors.error) throw sensors.error;

    if ((devices.count ?? 0) > 0 || (sensors.count ?? 0) > 0) {
      return NextResponse.json({
        error: `Tank has ${devices.count ?? 0} linked device(s) and ${sensors.count ?? 0} linked sensor(s). Reassign them first.`,
      }, { status: 409 });
    }

    const { data: tank, error } = await supabase
      .from("tanks")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "42501") {
        return NextResponse.json({ error: "Permission denied." }, { status: 403 });
      }
      throw error;
    }

    if (!tank) {
      return NextResponse.json({ error: "Tank not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tank DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete tank." }, { status: 500 });
  }
}
