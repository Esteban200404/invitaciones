create extension if not exists pgcrypto;

do $$ begin
  create type public.rsvp_status as enum ('PENDING', 'CONFIRMED', 'DECLINED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gift_status as enum ('AVAILABLE', 'RESERVED');
exception when duplicate_object then null; end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  baby_name text,
  description text,
  event_date date not null,
  event_time time not null,
  timezone text not null default 'America/Bogota',
  location text,
  address text,
  extra_info text,
  parents_message text,
  accent_colors jsonb not null default '{"primary":"#985d5a","secondary":"#f8f4ee"}'::jsonb,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  invitation_code text not null unique check (invitation_code = upper(invitation_code) and char_length(invitation_code) between 4 and 16),
  is_active boolean not null default true,
  rsvp_status public.rsvp_status not null default 'PENDING',
  companions integer not null default 0 check (companions between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guests_event_rsvp_idx on public.guests(event_id, rsvp_status);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  image_url text,
  status public.gift_status not null default 'AVAILABLE',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name)
);
create index if not exists gifts_event_visibility_idx on public.gifts(event_id, is_active, status);

create table if not exists public.gift_reservations (
  gift_id uuid primary key references public.gifts(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists gift_reservations_guest_idx on public.gift_reservations(guest_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at before update on public.guests for each row execute function public.set_updated_at();
drop trigger if exists gifts_set_updated_at on public.gifts;
create trigger gifts_set_updated_at before update on public.gifts for each row execute function public.set_updated_at();

create or replace function public.release_gift_when_reservation_deleted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.gifts set status = 'AVAILABLE' where id = old.gift_id;
  return old;
end;
$$;
drop trigger if exists gift_reservation_release on public.gift_reservations;
create trigger gift_reservation_release after delete on public.gift_reservations for each row execute function public.release_gift_when_reservation_deleted();

create or replace function public.reserve_gift(p_gift_id uuid, p_guest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.gift_reservations (gift_id, guest_id)
  select gift.id, guest.id
  from public.gifts as gift
  join public.guests as guest on guest.event_id = gift.event_id
  where gift.id = p_gift_id
    and guest.id = p_guest_id
    and gift.status = 'AVAILABLE'
    and gift.is_active = true
    and guest.is_active = true
  on conflict (gift_id) do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    return false;
  end if;

  update public.gifts set status = 'RESERVED' where id = p_gift_id;
  return true;
end;
$$;
revoke all on function public.reserve_gift(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_gift(uuid, uuid) to service_role;

alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_reservations enable row level security;

revoke all on public.events, public.guests, public.gifts, public.gift_reservations from anon, authenticated;

insert into public.events (slug, name, event_date, event_time, timezone)
values ('baby-shower', 'Baby Shower', current_date + 30, '15:00', 'America/Bogota')
on conflict (slug) do nothing;
