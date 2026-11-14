
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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

    const { data: memberships, error: membershipError } =
      await supabase
        .from("organization_members")
        .select("organization_id, role, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    const membership = memberships?.[0];

    if (!membership) {
      return NextResponse.json(
        { error: "Organization membership required." },
        { status: 403 },
      );
    }

    const [organizationResult, sitesResult, tanksResult] =
      await Promise.all([
        supabase
          .from("organizations")
          .select("id, name, timezone, status")
          .eq("id", membership.organization_id)
          .maybeSingle(),

        supabase
          .from("sites")
          .select("id, name, code, location, status")
          .eq("organization_id", membership.organization_id)
          .order("name", { ascending: true }),

        supabase
          .from("tanks")
          .select("id")
          .eq("organization_id", membership.organization_id),
      ]);

    if (organizationResult.error) {
      throw new Error(organizationResult.error.message);
    }

    if (sitesResult.error) {
      throw new Error(sitesResult.error.message);
    }

    if (tanksResult.error) {
      throw new Error(tanksResult.error.message);
    }

    return NextResponse.json({
      organization: organizationResult.data,
      sites: sitesResult.data ?? [],
      tankCount: tanksResult.data?.length ?? 0,
      role: membership.role,
    });
  } catch (error) {
    console.error("Organization context GET failed:", error);

    return NextResponse.json(
      { error: "Unable to load organization context." },
      { status: 500 },
    );
  }
}
