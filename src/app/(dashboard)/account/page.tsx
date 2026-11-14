import WorkspacePage from "@/components/workspaces/WorkspacePage";

export default function Page() {
  return <WorkspacePage
    title={'Account Profile'}
    description={'Review your account workspace and profile settings.'}
    metrics={['Profile', 'Organization membership', 'Access review']}
    links={[{'label': 'Tank Inventory', 'href': '/assets/tanks'}, {'label': 'Gateways', 'href': '/assets/gateways'}, {'label': 'Devices', 'href': '/assets/devices'}, {'label': 'Alerts', 'href': '/alerts'}, {'label': 'Inventory', 'href': '/inventory'}, {'label': 'Reports', 'href': '/reports'}]}
  />;
}
