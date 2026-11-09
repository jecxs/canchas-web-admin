-- La configuracion de locales se modifica mediante RPCs; authenticated no
-- tiene privilegio UPDATE directo sobre public.locales.
create function public.actualizar_avisos_cumpleanos_local_dueno(
  p_local_id uuid,
  p_activos boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_activos is null then
    raise exception 'La preferencia de cumpleaños es obligatoria.' using errcode = '23502';
  end if;

  update public.locales l
  set avisos_cumpleanos_activos = p_activos
  where l.id = p_local_id
    and l.dueno_id = (select auth.uid())
    and l.estado in ('trial', 'activo', 'en_gracia');

  if not found then
    raise exception 'No tienes permiso para configurar este local.' using errcode = '42501';
  end if;

  return p_activos;
end;
$$;

revoke all on function public.actualizar_avisos_cumpleanos_local_dueno(uuid, boolean) from public, anon, authenticated;
grant execute on function public.actualizar_avisos_cumpleanos_local_dueno(uuid, boolean) to authenticated, service_role;
