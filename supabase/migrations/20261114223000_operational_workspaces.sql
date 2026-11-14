-- =========================================================
-- OPERATIONAL WORKSPACES
-- Logistics, Alerts and Incidents management
-- =========================================================

-- =========================================================
-- DELIVERY ENUM + TABLE
-- =========================================================

create type public.delivery_status as enum (
  'scheduled',
  'in_transit',
  'completed',
  'cancelled'
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  site_id uuid
    references public.sites(id)
    on delete set null,

  tank_id uuid
    references public.tanks(id)
    on delete set null,

  reference_number text not null,

  supplier text,
  product text,

  planned_volume numeric(20,2),
  delivered_volume numeric(20,2),

  volume_unit text not null default 'L',

  status public.delivery_status not null default 'scheduled',

  scheduled_at timestamptz,
  dispatched_at timestamptz,
  completed_at timestamptz,

  notes text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, reference_number)
);

create index deliveries_organization_status_idx
  on public.deliveries(organization_id, status);

create index deliveries_site_idx
  on public.deliveries(site_id);

create index deliveries_tank_idx
  on public.deliveries(tank_id);

create index deliveries_scheduled_idx
  on public.deliveries(scheduled_at desc);

create trigger deliveries_set_updated_at
before update on public.deliveries
for each row execute function public.set_updated_at();


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.deliveries enable row level security;

create policy "members_can_view_deliveries"
on public.deliveries
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "admins_can_manage_deliveries"
on public.deliveries
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = deliveries.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = deliveries.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);


-- =========================================================
-- ALERT MANAGEMENT
-- =========================================================

create policy "admins_can_manage_alerts"
on public.alerts
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = alerts.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = alerts.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);


-- =========================================================
-- INCIDENT MANAGEMENT
-- =========================================================

create policy "admins_can_manage_incidents"
on public.incidents
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = incidents.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = incidents.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);
