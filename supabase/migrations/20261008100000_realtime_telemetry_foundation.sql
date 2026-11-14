-- =========================================================
-- REALTIME TELEMETRY FOUNDATION
-- Industrial Tank Monitoring & Inventory Control System
-- =========================================================

-- ---------------------------------------------------------
-- LATEST TELEMETRY STATE
-- ---------------------------------------------------------
-- One row represents the latest known reading for a sensor
-- and metric combination.
--
-- Raw historical readings remain in public.telemetry.
-- This table exists for efficient operational dashboards.
-- ---------------------------------------------------------

create table public.telemetry_latest (
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

  gateway_id uuid
    references public.gateways(id)
    on delete set null,

  device_id uuid
    references public.devices(id)
    on delete set null,

  sensor_id uuid
    references public.sensors(id)
    on delete set null,

  metric text not null,
  value numeric(20,8) not null,
  unit text,

  quality text not null default 'good',

  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),

  metadata jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now(),

  constraint telemetry_latest_sensor_metric_unique
    unique (sensor_id, metric)
);

-- ---------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------

create index telemetry_latest_organization_idx
  on public.telemetry_latest(organization_id);

create index telemetry_latest_site_idx
  on public.telemetry_latest(site_id);

create index telemetry_latest_tank_idx
  on public.telemetry_latest(tank_id);

create index telemetry_latest_gateway_idx
  on public.telemetry_latest(gateway_id);

create index telemetry_latest_device_idx
  on public.telemetry_latest(device_id);

create index telemetry_latest_sensor_idx
  on public.telemetry_latest(sensor_id);

create index telemetry_latest_recorded_idx
  on public.telemetry_latest(recorded_at desc);

-- ---------------------------------------------------------
-- UPDATED_AT TRIGGER
-- ---------------------------------------------------------

create trigger set_telemetry_latest_updated_at
before update on public.telemetry_latest
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------

alter table public.telemetry_latest enable row level security;

-- ---------------------------------------------------------
-- READ ACCESS
-- ---------------------------------------------------------
-- Organization members can only see latest telemetry belonging
-- to organizations they belong to.
-- ---------------------------------------------------------

create policy "members_can_view_telemetry_latest"
on public.telemetry_latest
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

-- ---------------------------------------------------------
-- IMPORTANT SECURITY DESIGN
-- ---------------------------------------------------------
-- There is intentionally NO authenticated INSERT/UPDATE policy.
--
-- Browser clients must never directly write industrial
-- telemetry.
--
-- Future ingestion service will write telemetry using a
-- controlled server-side path.
-- ---------------------------------------------------------

-- =========================================================
-- REALTIME
-- =========================================================
-- Add latest telemetry to Supabase Realtime publication.
-- This allows the operations dashboard to receive changes
-- without polling the database.
-- =========================================================

alter publication supabase_realtime
add table public.telemetry_latest;

-- =========================================================
-- FLOW-METER / SENSOR CONTRACT
-- =========================================================
-- Sensor types remain TEXT intentionally so the platform can
-- support future industrial instrumentation without database
-- enum migrations.
--
-- Standard values used by the application:
--
-- sensor_type:
--   level
--   temperature
--   flow_meter
--
-- measurement:
--   level
--   temperature
--   flow_rate
--   totalized_volume
--
-- telemetry.metric:
--   level
--   temperature
--   flow_rate
--   totalized_volume
--
-- Common units:
--   %
--   °C
--   L/min
--   L
--
-- These are application-level contracts, not restrictive
-- database enums, allowing future instruments to be added
-- safely.
-- =========================================================
