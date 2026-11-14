create or replace function public.record_simulated_tank_telemetry(
  p_organization_id uuid,
  p_site_id uuid,
  p_tank_id uuid,
  p_level numeric,
  p_temperature numeric,
  p_flow_rate numeric,
  p_totalized_volume numeric,
  p_volume_unit text default 'L'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_time timestamptz := now();
  v_metric text;
  v_value numeric;
  v_unit text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and organization_id = p_organization_id
  ) then
    raise exception 'Unauthorized organization access';
  end if;

  if not exists (
    select 1 from public.tanks
    where id = p_tank_id
      and organization_id = p_organization_id
      and site_id = p_site_id
  ) then
    raise exception 'Tank does not belong to this organization and site';
  end if;

  if p_level < 0 or p_level > 100
     or p_temperature < -50 or p_temperature > 200
     or p_flow_rate < 0 or p_totalized_volume < 0 then
    raise exception 'Telemetry value out of range';
  end if;

  for v_metric, v_value, v_unit in
    select r.metric, r.value, r.unit
    from (values
      ('level', p_level, '%'),
      ('temperature', p_temperature, '°C'),
      ('flow_rate', p_flow_rate, 'L/min'),
      ('totalized_volume', p_totalized_volume, coalesce(nullif(p_volume_unit, ''), 'L'))
    ) as r(metric, value, unit)
  loop
    insert into public.telemetry (
      organization_id, site_id, tank_id, metric, value, unit,
      quality, recorded_at, metadata
    ) values (
      p_organization_id, p_site_id, p_tank_id, v_metric, v_value, v_unit,
      'simulated', v_time, '{"source":"simulator","mode":"SIMULATED"}'::jsonb
    );

    delete from public.telemetry_latest
    where organization_id = p_organization_id
      and tank_id = p_tank_id
      and metric = v_metric
      and sensor_id is null;

    insert into public.telemetry_latest (
      organization_id, site_id, tank_id, metric, value, unit,
      quality, recorded_at, metadata
    ) values (
      p_organization_id, p_site_id, p_tank_id, v_metric, v_value, v_unit,
      'simulated', v_time, '{"source":"simulator","mode":"SIMULATED"}'::jsonb
    );
  end loop;

  return jsonb_build_object('success', true, 'tank_id', p_tank_id, 'recorded_at', v_time);
end;
$$;

revoke all on function public.record_simulated_tank_telemetry(
  uuid, uuid, uuid, numeric, numeric, numeric, numeric, text
) from public, anon;

grant execute on function public.record_simulated_tank_telemetry(
  uuid, uuid, uuid, numeric, numeric, numeric, numeric, text
) to authenticated;
