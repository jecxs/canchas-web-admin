-- Solo día y mes: el año de nacimiento no es necesario para estos avisos.
alter table public.perfiles
  add column cumpleanos_mes smallint,
  add column cumpleanos_dia smallint,
  add constraint perfiles_cumpleanos_valido check (
    (cumpleanos_mes is null and cumpleanos_dia is null)
    or (
      cumpleanos_mes between 1 and 12
      and cumpleanos_dia between 1 and case
        when cumpleanos_mes = 2 then 29
        when cumpleanos_mes in (4, 6, 9, 11) then 30
        else 31
      end
    )
  );

alter table public.locales
  add column avisos_cumpleanos_activos boolean not null default false;

-- La RLS de perfiles solo permite al cliente leer su perfil. Este RPC expone
-- exclusivamente día y mes al dueño de un local donde el cliente reservó.
create function public.obtener_cumpleanos_clientes_local_dueno(p_local_id uuid)
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
    and p.rol = 'cliente'::public.rol_usuario
    and p.cumpleanos_mes is not null
    and p.cumpleanos_dia is not null;
end;
$$;

revoke all on function public.obtener_cumpleanos_clientes_local_dueno(uuid) from public, anon;
grant execute on function public.obtener_cumpleanos_clientes_local_dueno(uuid) to authenticated;
