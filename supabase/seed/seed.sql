do $$
declare
  event_uuid uuid;
begin
  insert into public.events (
    slug, name, baby_name, description, event_date, event_time, timezone,
    location, address, extra_info, parents_message, accent_colors
  ) values (
    'baby-shower', 'Baby Shower', 'Nuestro bebé',
    'Acompáñanos a celebrar la dulce espera de nuestro bebé.',
    '2027-06-15', '15:00', 'America/Bogota',
    'Jardín de la familia', 'Bogotá, Colombia',
    'Este evento de muestra se puede editar desde el panel administrativo.',
    'Gracias por acompañarnos en esta aventura llena de amor.',
    '{"primary":"#985d5a","secondary":"#f8f4ee"}'::jsonb
  ) on conflict (slug) do update set
    name = excluded.name,
    baby_name = excluded.baby_name,
    description = excluded.description,
    event_date = excluded.event_date,
    event_time = excluded.event_time,
    timezone = excluded.timezone,
    location = excluded.location,
    address = excluded.address,
    extra_info = excluded.extra_info,
    parents_message = excluded.parents_message,
    accent_colors = excluded.accent_colors
  returning id into event_uuid;

  insert into public.guests (event_id, name, invitation_code) values
    (event_uuid, 'María Gómez', 'MG4821'),
    (event_uuid, 'Carlos Rodríguez', 'CR7392'),
    (event_uuid, 'Laura Pérez', 'LP1845')
  on conflict (invitation_code) do update set event_id = excluded.event_id, name = excluded.name, is_active = true;

  insert into public.gifts (event_id, name, description) values
    (event_uuid, 'Coche para bebé', 'Un paseo cómodo para los primeros meses.'),
    (event_uuid, 'Bañera para bebé', 'Un baño tranquilo y seguro.'),
    (event_uuid, 'Monitor para bebé', 'Para acompañar sus dulces sueños.'),
    (event_uuid, 'Gimnasio para bebé', 'Un espacio para descubrir y jugar.'),
    (event_uuid, 'Pañalera', 'Todo lo necesario para salir en familia.')
  on conflict (event_id, name) do nothing;
end $$;
