-- =========================================================
-- MULTI-TENANT MEMBERSHIP & SECURITY
-- =========================================================

create type public.organization_role as enum (
  'owner',
  'admin',
  'operator',
  'viewer'
);

-- =========================================================
-- ORGANIZATION MEMBERS
-- =========================================================

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role public.organization_role not null default 'viewer',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, user_id)
);

create index organization_members_organization_id_idx
  on public.organization_members(organization_id);

create index organization_members_user_id_idx
  on public.organization_members(user_id);

-- =========================================================
-- UPDATED_AT
-- =========================================================

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

-- =========================================================
-- HELPER FUNCTION
-- =========================================================

create or replace function public.is_organization_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$$;

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.organization_members
enable row level security;

-- =========================================================
-- ORGANIZATION MEMBERS POLICIES
-- =========================================================

create policy "members_can_view_memberships"
on public.organization_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_organization_member(organization_id)
);

-- =========================================================
-- ORGANIZATIONS
-- =========================================================

create policy "members_can_view_organizations"
on public.organizations
for select
to authenticated
using (
  public.is_organization_member(id)
);

-- =========================================================
-- SITES
-- =========================================================

create policy "members_can_view_sites"
on public.sites
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "admins_can_manage_sites"
on public.sites
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = sites.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = sites.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

-- =========================================================
-- GATEWAYS
-- =========================================================

create policy "members_can_view_gateways"
on public.gateways
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "admins_can_manage_gateways"
on public.gateways
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = gateways.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = gateways.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

-- =========================================================
-- TANKS
-- =========================================================

create policy "members_can_view_tanks"
on public.tanks
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "admins_can_manage_tanks"
on public.tanks
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = tanks.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = tanks.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

-- =========================================================
-- DEVICES
-- =========================================================

create policy "members_can_view_devices"
on public.devices
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "admins_can_manage_devices"
on public.devices
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = devices.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = devices.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

-- =========================================================
-- SENSORS
-- =========================================================

create policy "members_can_view_sensors"
on public.sensors
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "admins_can_manage_sensors"
on public.sensors
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = sensors.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = sensors.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

-- =========================================================
-- INTEGRATIONS
-- =========================================================

create policy "members_can_view_integrations"
on public.integrations
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "admins_can_manage_integrations"
on public.integrations
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_id = integrations.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_id = integrations.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

-- =========================================================
-- TELEMETRY
-- =========================================================

create policy "members_can_view_telemetry"
on public.telemetry
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

-- Telemetry ingestion will later use a controlled server-side
-- ingestion service rather than exposing unrestricted INSERT
-- access to browser clients.

-- =========================================================
-- ALERTS
-- =========================================================

create policy "members_can_view_alerts"
on public.alerts
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

-- =========================================================
-- INCIDENTS
-- =========================================================

create policy "members_can_view_incidents"
on public.incidents
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

-- =========================================================
-- AUDIT LOGS
-- =========================================================

create policy "members_can_view_audit_logs"
on public.audit_logs
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

