import { getCurrentUserMemberships } from "@/lib/repositories/memberships";
import { getOrganizationById } from "@/lib/repositories/organizations";

export async function getCurrentOrganizationContext() {
  const memberships = await getCurrentUserMemberships();

  if (memberships.length === 0) {
    return {
      organization: null,
      memberships: [],
    };
  }

  const organization = await getOrganizationById(
    memberships[0].organization_id,
  );

  return {
    organization,
    memberships,
  };
}