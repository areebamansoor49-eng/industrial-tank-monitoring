import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getCurrentOrganizationContext } from "@/lib/repositories/organization-context";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { organization } = await getCurrentOrganizationContext();
  if (!organization) redirect("/setup/organization");
  return <AppShell>{children}</AppShell>;
}
