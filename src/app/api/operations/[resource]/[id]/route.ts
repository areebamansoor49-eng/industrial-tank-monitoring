import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const adminRoles = ["owner", "admin"];

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

export async function PATCH(request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id } = await context.params;
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
    let table: string;
    let update: Record<string, unknown>;

    if (resource === "deliveries") {
      table = "deliveries";
      const allowed = ["scheduled", "in_transit", "completed", "cancelled"];
      if (typeof body.status !== "string" || !allowed.includes(body.status)) {
        return NextResponse.json({ error: "Invalid delivery status." }, { status: 400 });
      }

      update = { status: body.status };
      if (body.status === "in_transit") update.dispatched_at = new Date().toISOString();
      if (body.status === "completed") {
        const volume = Number(body.delivered_volume);
        if (!Number.isFinite(volume) || volume < 0) {
          return NextResponse.json({ error: "Enter a valid delivered volume." }, { status: 400 });
        }
        update.delivered_volume = volume;
        update.completed_at = new Date().toISOString();
      }
    } else if (resource === "alerts") {
      table = "alerts";
      if (!["acknowledged", "resolved"].includes(String(body.status))) {
        return NextResponse.json({ error: "Invalid alert status." }, { status: 400 });
      }
      update = { status: body.status };
      if (body.status === "acknowledged") update.acknowledged_at = new Date().toISOString();
      if (body.status === "resolved") update.resolved_at = new Date().toISOString();
    } else if (resource === "incidents") {
      table = "incidents";
      if (!["open", "investigating", "resolved", "closed"].includes(String(body.status))) {
        return NextResponse.json({ error: "Invalid incident status." }, { status: 400 });
      }
      update = { status: body.status };
      if (body.status === "resolved" || body.status === "closed") {
        update.resolved_at = new Date().toISOString();
      } else {
        update.resolved_at = null;
      }
      if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
      if (typeof body.description === "string") update.description = body.description.trim();
    } else {
      return NextResponse.json({ error: "Unknown operational resource." }, { status: 404 });
    }

    const { data, error } = await (supabase as any).from(table).update(update)
      .eq("id", id).eq("organization_id", organizationId).select("*").maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Record not found." }, { status: 404 });

    return NextResponse.json({ record: data });
  } catch (error) {
    console.error("Operations PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update this record." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id } = await context.params;
    if (resource !== "deliveries") {
      return NextResponse.json({ error: "Only delivery records can be deleted." }, { status: 405 });
    }

    const ctx = await getContext();
    if ("response" in ctx) return ctx.response;

    if (!ctx.canManage) {
      return NextResponse.json({ error: "Owner or admin permission required." }, { status: 403 });
    }

    const { error, count } = await ctx.supabase.from("deliveries").delete({ count: "exact" })
      .eq("id", id).eq("organization_id", ctx.organizationId);

    if (error) throw error;
    if (count === 0) return NextResponse.json({ error: "Delivery not found." }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Operations DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete this delivery." }, { status: 500 });
  }
}
