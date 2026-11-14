import WorkspacePage from "@/components/workspaces/WorkspacePage";

export default function Page() {
  return <WorkspacePage
    title={'System Settings'}
    description={'Review system configuration and organization preferences.'}
    metrics={['Organization', 'Monitoring preferences', 'Security settings']}
    links={[{'label': 'Tank Inventory', 'href': '/assets/tanks'}, {'label': 'Gateways', 'href': '/assets/gateways'}, {'label': 'Devices', 'href': '/assets/devices'}, {'label': 'Alerts', 'href': '/alerts'}, {'label': 'Inventory', 'href': '/inventory'}, {'label': 'Reports', 'href': '/reports'}]}
  />;
}
