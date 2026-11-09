-- Un usuario con otro rol también puede reservar como cliente de un local.
create or replace function public.obtener_cumpleanos_clientes_local_dueno(p_local_id uuid)
returns table(cliente_id uuid, nombre text, cumpleanos_mes smallint, cumpleanos_dia smallint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.locales l
    where l.id = p_local_id and l.dueno_id = (select auth.uid())
  ) then
    raise exception 'No tienes permisos para consultar estos cumpleaños.' using errcode = '42501';
  end if;

  return query
  select distinct p.id, p.nombre_completo, p.cumpleanos_mes, p.cumpleanos_dia
  from public.reservas r
  join public.canchas c on c.id = r.cancha_id
  join public.perfiles p on p.id = r.cliente_id
  where c.local_id = p_local_id
    and p.cumpleanos_mes is not null
    and p.cumpleanos_dia is not null;
end;
$$;
