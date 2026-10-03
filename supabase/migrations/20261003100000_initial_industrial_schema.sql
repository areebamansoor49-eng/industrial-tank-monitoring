-- Industrial Tank Monitoring & Inventory Control System
-- Initial production domain schema
-- Multi-tenant foundation

create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================

create type public.organization_status as enum (
  'active',
  'suspended',
  'archived'
);

create type public.site_status as enum (
  'operational',
  'maintenance',
  'offline',
  'archived'
);

create type public.tank_status as enum (
  'normal',
  'warning',
  'critical',
  'offline',
  'maintenance'
);

create type public.device_status as enum (
  'online',
  'offline',
  'warning',
  'maintenance'
);

create type public.integration_type as enum (
  'mqtt',
  'modbus',
  'opcua',
  'rest_api',
  'simulator'
);

create type public.integration_status as enum (
  'configured',
  'connected',
  'disconnected',
  'error',
  'disabled'
);

create type public.sensor_status as enum (
  'active',
  'inactive',
  'fault'
);

create type public.alert_severity as enum (
  'info',
  'warning',
  'critical'
);

create type public.alert_status as enum (
  'open',
  'acknowledged',
  'resolved'
);

create type public.incident_status as enum (
  'open',
  'investigating',
  'resolved',
  'closed'
);

-- =========================================================
-- ORGANIZATIONS
-- =========================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.organization_status not null default 'active',
  timezone text not null default 'UTC',
  country text,
  industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- SITES
-- =========================================================

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  location text,
  timezone text,
  status public.site_status not null default 'operational',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, code)
);

create index sites_organization_id_idx
  on public.sites(organization_id);

-- =========================================================
-- GATEWAYS
-- =========================================================

create table public.gateways (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,

  name text not null,
  gateway_code text not null,
  manufacturer text,
  model text,
  serial_number text,
  firmware_version text,

  status public.device_status not null default 'offline',
  last_seen_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, gateway_code)
);

create index gateways_organization_id_idx
  on public.gateways(organization_id);

create index gateways_site_id_idx
  on public.gateways(site_id);

-- =========================================================
-- TANKS
-- =========================================================

create table public.tanks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  gateway_id uuid references public.gateways(id) on delete set null,

  name text not null,
  tank_code text not null,
  product text,
  capacity numeric(14,2),
  capacity_unit text not null default 'L',

  status public.tank_status not null default 'normal',

  description text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, tank_code)
);

create index tanks_organization_id_idx
  on public.tanks(organization_id);

create index tanks_site_id_idx
  on public.tanks(site_id);

create index tanks_gateway_id_idx
  on public.tanks(gateway_id);

-- =========================================================
-- DEVICES
-- =========================================================

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  gateway_id uuid references public.gateways(id) on delete set null,
  tank_id uuid references public.tanks(id) on delete set null,

  name text not null,
  device_code text not null,
  device_type text not null,

  manufacturer text,
  model text,
  serial_number text,
  firmware_version text,

  status public.device_status not null default 'offline',
  last_seen_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, device_code)
);

create index devices_organization_id_idx
  on public.devices(organization_id);

create index devices_site_id_idx
  on public.devices(site_id);

create index devices_gateway_id_idx
  on public.devices(gateway_id);

create index devices_tank_id_idx
  on public.devices(tank_id);

-- =========================================================
-- SENSORS
-- =========================================================

create table public.sensors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  tank_id uuid references public.tanks(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  gateway_id uuid references public.gateways(id) on delete set null,

  name text not null,
  sensor_code text not null,
  sensor_type text not null,

  measurement text not null,
  unit text not null,

  status public.sensor_status not null default 'active',

  min_value numeric(18,6),
  max_value numeric(18,6),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, sensor_code)
);

create index sensors_organization_id_idx
  on public.sensors(organization_id);

create index sensors_tank_id_idx
  on public.sensors(tank_id);

create index sensors_device_id_idx
  on public.sensors(device_id);

-- =========================================================
-- INTEGRATIONS
-- =========================================================

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  gateway_id uuid references public.gateways(id) on delete set null,

  name text not null,
  integration_type public.integration_type not null,
  status public.integration_status not null default 'configured',

  endpoint text,
  configuration jsonb not null default '{}'::jsonb,

  last_connected_at timestamptz,
  last_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index integrations_organization_id_idx
  on public.integrations(organization_id);

create index integrations_site_id_idx
  on public.integrations(site_id);

-- =========================================================
-- TELEMETRY
-- =========================================================

create table public.telemetry (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  tank_id uuid references public.tanks(id) on delete set null,
  gateway_id uuid references public.gateways(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  sensor_id uuid references public.sensors(id) on delete set null,

  metric text not null,
  value numeric(20,8) not null,
  unit text,

  quality text not null default 'good',

  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),

  metadata jsonb not null default '{}'::jsonb
);

create index telemetry_organization_recorded_idx
  on public.telemetry(organization_id, recorded_at desc);

create index telemetry_tank_recorded_idx
  on public.telemetry(tank_id, recorded_at desc);

create index telemetry_sensor_recorded_idx
  on public.telemetry(sensor_id, recorded_at desc);

-- =========================================================
-- ALERTS
-- =========================================================

create table public.alerts (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  tank_id uuid references public.tanks(id) on delete set null,
  sensor_id uuid references public.sensors(id) on delete set null,

  severity public.alert_severity not null,
  status public.alert_status not null default 'open',

  title text not null,
  message text not null,

  triggered_value numeric(20,8),
  threshold_value numeric(20,8),

  triggered_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,

  metadata jsonb not null default '{}'::jsonb
);

create index alerts_organization_status_idx
  on public.alerts(organization_id, status);

create index alerts_tank_idx
  on public.alerts(tank_id);

-- =========================================================
-- INCIDENTS
-- =========================================================

create table public.incidents (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  tank_id uuid references public.tanks(id) on delete set null,

  status public.incident_status not null default 'open',

  title text not null,
  description text,

  opened_at timestamptz not null default now(),
  resolved_at timestamptz,

  metadata jsonb not null default '{}'::jsonb
);

create index incidents_organization_status_idx
  on public.incidents(organization_id, status);

-- =========================================================
-- AUDIT LOGS
-- =========================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null references public.organizations(id) on delete cascade,

  actor_user_id uuid references auth.users(id) on delete set null,

  action text not null,
  entity_type text not null,
  entity_id uuid,

  old_values jsonb,
  new_values jsonb,

  created_at timestamptz not null default now()
);

create index audit_logs_organization_created_idx
  on public.audit_logs(organization_id, created_at desc);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger sites_set_updated_at
before update on public.sites
for each row execute function public.set_updated_at();

create trigger gateways_set_updated_at
before update on public.gateways
for each row execute function public.set_updated_at();

create trigger tanks_set_updated_at
before update on public.tanks
for each row execute function public.set_updated_at();

create trigger devices_set_updated_at
before update on public.devices
for each row execute function public.set_updated_at();

create trigger sensors_set_updated_at
before update on public.sensors
for each row execute function public.set_updated_at();

create trigger integrations_set_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

-- =========================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table public.organizations enable row level security;
alter table public.sites enable row level security;
alter table public.gateways enable row level security;
alter table public.tanks enable row level security;
alter table public.devices enable row level security;
alter table public.sensors enable row level security;
alter table public.integrations enable row level security;
alter table public.telemetry enable row level security;
alter table public.alerts enable row level security;
alter table public.incidents enable row level security;
alter table public.audit_logs enable row level security;
