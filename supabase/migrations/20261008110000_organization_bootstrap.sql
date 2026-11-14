-- =========================================================
-- ORGANIZATION BOOTSTRAP
-- Creates an organization and makes the authenticated user
-- its owner atomically.
-- =========================================================

create or replace function public.create_organization_for_current_user(
  organization_name text,
  organization_slug text,
  organization_timezone text default 'UTC',
  organization_country text default null,
  organization_industry text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  created_organization public.organizations;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if organization_name is null
     or length(trim(organization_name)) < 2 then
    raise exception 'Organization name must contain at least 2 characters';
  end if;

  if organization_slug is null
     or organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Organization slug must contain lowercase letters, numbers, and hyphens only';
  end if;

  if exists (
    select 1
    from public.organizations
    where slug = organization_slug
  ) then
    raise exception 'Organization slug already exists';
  end if;

  insert into public.organizations (
    name,
    slug,
    status,
    timezone,
    country,
    industry
  )
  values (
    trim(organization_name),
    organization_slug,
    'active',
    coalesce(nullif(trim(organization_timezone), ''), 'UTC'),
    nullif(trim(organization_country), ''),
    nullif(trim(organization_industry), '')
  )
  returning *
  into created_organization;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    created_organization.id,
    current_user_id,
    'owner'
  );

  return created_organization;
end;
$$;

revoke all
on function public.create_organization_for_current_user(
  text,
  text,
  text,
  text,
  text
)
from public;

grant execute
on function public.create_organization_for_current_user(
  text,
  text,
  text,
  text,
  text
)
to authenticated;

comment on function public.create_organization_for_current_user(
  text,
  text,
  text,
  text,
  text
)
is 'Atomically creates an organization and assigns the authenticated user as owner.';
