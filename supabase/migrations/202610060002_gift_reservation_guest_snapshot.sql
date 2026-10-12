alter table public.gift_reservations
  add column if not exists guest_name text;

update public.gift_reservations as reservation
set guest_name = guest.name
from public.guests as guest
where reservation.guest_id = guest.id
  and reservation.guest_name is null;

alter table public.gift_reservations
  alter column guest_id drop not null;

alter table public.gift_reservations
  drop constraint if exists gift_reservations_guest_id_fkey;

alter table public.gift_reservations
  add constraint gift_reservations_guest_id_fkey
  foreign key (guest_id) references public.guests(id) on delete set null;

create or replace function public.reserve_gift(p_gift_id uuid, p_guest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.gift_reservations (gift_id, guest_id, guest_name)
  select gift.id, guest.id, guest.name
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
