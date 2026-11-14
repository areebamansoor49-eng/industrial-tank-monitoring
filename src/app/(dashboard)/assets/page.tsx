import WorkspacePage from "@/components/workspaces/WorkspacePage";

export default function Page() {
  return (
    <WorkspacePage
      title="Asset Management"
      description="Manage sites, tank infrastructure, gateways and connected devices."
      metrics={["Sites", "Tanks", "Gateways", "Devices"]}
      links={[
        { label: "Sites", href: "/assets/sites" },
        { label: "Tank Inventory", href: "/assets/tanks" },
        { label: "Gateways", href: "/assets/gateways" },
        { label: "Devices", href: "/assets/devices" },
        { label: "Alerts", href: "/alerts" },
        { label: "Inventory", href: "/inventory" },
        { label: "Reports", href: "/reports" },
      ]}
    />
  );
}
