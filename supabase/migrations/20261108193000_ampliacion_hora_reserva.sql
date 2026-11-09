-- Una hora adicional modifica la misma reserva y conserva el precio de las
-- horas ya acordadas. Los +30 minutos siguen siendo un contrato separado.
create table public.reserva_ampliaciones_hora (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas(id),
  rango_previo tstzrange not null,
  rango_nuevo tstzrange not null,
  monto_adicional numeric(10,2) not null check (monto_adicional > 0),
  autorizado_por uuid not null references public.perfiles(id),
  created_at timestamptz not null default now(),
  revertido_at timestamptz,
  revertido_por uuid references public.perfiles(id),
  constraint ampliacion_hora_rangos_validos check (
    lower(rango_previo) = lower(rango_nuevo)
    and upper(rango_nuevo) = upper(rango_previo) + interval '1 hour'
  ),
  constraint ampliacion_hora_reversion_consistente check ((revertido_at is null) = (revertido_por is null))
);
create index reserva_ampliaciones_hora_reserva_idx on public.reserva_ampliaciones_hora(reserva_id, created_at desc);
alter table public.reserva_ampliaciones_hora enable row level security;
revoke all on public.reserva_ampliaciones_hora from public, anon, authenticated;
grant select on public.reserva_ampliaciones_hora to authenticated;
create policy reserva_ampliaciones_hora_dueno_lectura on public.reserva_ampliaciones_hora
  for select to authenticated using (exists (
    select 1 from public.reservas r
    join public.canchas c on c.id = r.cancha_id
    join public.locales l on l.id = c.local_id
    where r.id = reserva_id and l.dueno_id = (select auth.uid())
  ));

create function public.cotizar_ampliacion_hora_reserva_dueno(p_reserva_id uuid)
returns table(fin_anterior timestamptz, fin_nuevo timestamptz, monto_adicional numeric, total_nuevo numeric, saldo_nuevo numeric)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_reserva public.reservas%rowtype;
  v_local_id uuid;
  v_fecha date;
  v_apertura timestamptz;
  v_cierre timestamptz;
  v_extra tstzrange;
  v_monto numeric(10,2);
  v_cobrado numeric(10,2);
begin
  select r.* into v_reserva
  from public.reservas r
  join public.canchas c on c.id = r.cancha_id
  join public.locales l on l.id = c.local_id
  where r.id = p_reserva_id and l.dueno_id = (select auth.uid())
    and l.estado in ('trial', 'activo', 'en_gracia');
  if not found then raise exception 'Reserva no disponible para este local.' using errcode = '42501'; end if;
  select c.local_id into v_local_id from public.canchas c where c.id = v_reserva.cancha_id;
  if v_reserva.estado <> 'confirmada'::public.estado_reserva or upper(v_reserva.rango) <= now() then
    raise exception 'Solo se puede ampliar una reserva confirmada que aún no termina.' using errcode = 'P0001';
  end if;
  if v_reserva.es_excepcion_horaria or exists (
    select 1 from public.reserva_extensiones e where e.reserva_id = p_reserva_id
  ) then
    raise exception 'Una reserva con +30 minutos no admite otra hora completa.' using errcode = 'P0001';
  end if;

  v_extra := tstzrange(upper(v_reserva.rango), upper(v_reserva.rango) + interval '1 hour', '[)');
  v_fecha := (lower(v_reserva.rango) at time zone 'America/Lima')::date;
  if (upper(v_extra) at time zone 'America/Lima')::date <> v_fecha then
    raise exception 'La ampliación no puede terminar al día siguiente.' using errcode = 'P0001';
  end if;
  select (v_fecha + h.hora_apertura) at time zone 'America/Lima',
         (v_fecha + h.hora_cierre) at time zone 'America/Lima'
  into v_apertura, v_cierre from public.horarios_atencion h
  where h.local_id = v_local_id and h.dia_semana = extract(dow from v_fecha)::integer;
  if not found or not (v_extra <@ tstzrange(v_apertura, v_cierre, '[)')) then
    raise exception 'La hora adicional queda fuera del horario de atención.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.bloqueos_mantenimiento b where b.cancha_id = v_reserva.cancha_id and b.rango && v_extra)
    or exists (select 1 from public.reservas r where r.cancha_id = v_reserva.cancha_id
      and r.id <> p_reserva_id and public.fn_reserva_ocupa_horario(r.estado, r.pago_expira_en)
      and r.rango && v_extra) then
    raise exception 'La hora adicional ya está ocupada o bloqueada.' using errcode = '23P01';
  end if;
  select round(coalesce(sum(linea.subtotal), 0), 2) into v_monto
  from public.fn_calcular_lineas_tarifa(v_reserva.cancha_id, v_reserva.deporte_id, lower(v_extra), upper(v_extra)) linea;
  if v_monto <= 0 then raise exception 'No se pudo cotizar la hora adicional.' using errcode = 'P0001'; end if;
  select coalesce(sum(m.monto) filter (where m.tipo in ('adelanto', 'saldo')), 0)
  into v_cobrado from public.movimientos_pago_reserva m where m.reserva_id = p_reserva_id;
  fin_anterior := upper(v_reserva.rango);
  fin_nuevo := upper(v_extra);
  monto_adicional := v_monto;
  total_nuevo := v_reserva.monto_total + v_monto;
  saldo_nuevo := greatest(total_nuevo - v_cobrado, 0);
  return next;
end;
$$;

-- El disparador habitual recalcula todo el rango. Para una ampliación
-- autorizada se suman o restan solo sus 60 minutos, sin cambiar el descuento.
create or replace function public.fn_calcular_precio_reserva()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_total numeric(10,2);
  v_final numeric(10,2);
  v_horas numeric;
  v_porcentaje_adelanto numeric;
  v_cobrado numeric(10,2);
  v_ampliacion numeric(10,2);
  v_signo integer;
begin
  if tg_op = 'UPDATE' then
    select e.monto_adicional,
      case when e.revertido_at is null then 1 else -1 end
    into v_ampliacion, v_signo
    from public.reserva_ampliaciones_hora e
    where e.reserva_id = new.id and (
      (e.revertido_at is null and e.rango_previo = old.rango and e.rango_nuevo = new.rango)
      or (e.revertido_at is not null and e.rango_nuevo = old.rango and e.rango_previo = new.rango)
    ) order by e.created_at desc limit 1;
    if found then
      new.precio_tarifa_base := old.precio_tarifa_base + v_signo * v_ampliacion;
      new.monto_total := new.precio_tarifa_base - old.descuento_especial_monto;
      new.monto_adelanto_requerido := old.monto_adelanto_requerido;
      v_horas := extract(epoch from upper(new.rango) - lower(new.rango)) / 3600.0;
      new.precio_por_hora_aplicado := round(new.monto_total / v_horas, 2);
      if new.monto_total < new.monto_adelanto_requerido then
        raise exception 'La ampliación no puede dejar el total bajo el adelanto acordado.' using errcode = 'P0001';
      end if;
      select coalesce(sum(m.monto) filter (where m.tipo in ('adelanto', 'saldo')), 0)
      into v_cobrado from public.movimientos_pago_reserva m where m.reserva_id = new.id;
      if new.monto_total < v_cobrado then
        raise exception 'Hay cobros que superan el total anterior. Registra la devolución antes de quitar la hora.' using errcode = 'P0001';
      end if;
      return new;
    end if;
  end if;

  select round(coalesce(sum(linea.subtotal), 0), 2), coalesce(sum(linea.minutos), 0)::numeric / 60.0
  into v_total, v_horas
  from public.fn_calcular_lineas_tarifa(new.cancha_id, new.deporte_id, lower(new.rango), upper(new.rango)) linea;
  select l.porcentaje_adelanto into v_porcentaje_adelanto
  from public.canchas c join public.locales l on l.id = c.local_id where c.id = new.cancha_id;
  if v_total <= 0 or v_horas <= 0 or v_porcentaje_adelanto is null then
    raise exception 'No fue posible calcular la tarifa de la reserva.' using errcode = '23514';
  end if;
  v_final := v_total - coalesce(new.descuento_especial_monto, 0);
  if v_final <= 0 then
    raise exception 'El descuento especial supera la nueva tarifa. Ajusta el precio antes de mover o extender la reserva.' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' then
    select coalesce(sum(mp.monto) filter (where mp.tipo in ('adelanto', 'saldo')), 0)
    into v_cobrado from public.movimientos_pago_reserva mp where mp.reserva_id = new.id;
    if v_final < v_cobrado then
      raise exception 'El nuevo total sería menor que lo ya cobrado. Ajusta el precio especial antes de mover o extender la reserva.' using errcode = 'P0001';
    end if;
  end if;
  new.precio_tarifa_base := v_total;
  new.monto_total := v_final;
  new.precio_por_hora_aplicado := round(v_final / v_horas, 2);
  if tg_op = 'UPDATE' and old.estado in ('confirmada'::public.estado_reserva, 'completada'::public.estado_reserva) then
    if old.monto_adelanto_requerido > v_final then
      raise exception 'El nuevo total sería menor que el adelanto acordado.' using errcode = 'P0001';
    end if;
    new.monto_adelanto_requerido := old.monto_adelanto_requerido;
  else
    new.monto_adelanto_requerido := round(v_final * v_porcentaje_adelanto / 100.0, 2);
  end if;
  return new;
end;
$$;

create or replace function public.fn_sincronizar_detalles_tarifa_reserva()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_porcentaje_adelanto numeric;
  v_signo integer;
begin
  if tg_op = 'UPDATE' then
    select case when e.revertido_at is null then 1 else -1 end into v_signo
    from public.reserva_ampliaciones_hora e
    where e.reserva_id = new.id and (
      (e.revertido_at is null and e.rango_previo = old.rango and e.rango_nuevo = new.rango)
      or (e.revertido_at is not null and e.rango_nuevo = old.rango and e.rango_previo = new.rango)
    ) order by e.created_at desc limit 1;
    if found then
      if v_signo = 1 then
        insert into public.reserva_detalles_tarifa (
          reserva_id, rango, precio_base_por_hora, regla_recurrente_id,
          regla_recurrente_nombre, promocion_id, promocion_nombre,
          precio_por_hora_aplicado, subtotal
        ) select new.id, tstzrange(linea.inicio, linea.fin, '[)'), linea.precio_base_por_hora,
          linea.regla_recurrente_id, linea.regla_recurrente_nombre,
          linea.promocion_id, linea.promocion_nombre, linea.precio_por_hora_aplicado, linea.subtotal
        from public.fn_calcular_lineas_tarifa(new.cancha_id, new.deporte_id, upper(old.rango), upper(new.rango)) linea;
      else
        delete from public.reserva_detalles_tarifa d
        where d.reserva_id = new.id and d.rango && tstzrange(upper(new.rango), upper(old.rango), '[)');
      end if;
      return null;
    end if;
  end if;

  delete from public.reserva_detalles_tarifa where reserva_id = new.id;
  insert into public.reserva_detalles_tarifa (
    reserva_id, rango, precio_base_por_hora, regla_recurrente_id,
    regla_recurrente_nombre, promocion_id, promocion_nombre,
    precio_por_hora_aplicado, subtotal
  ) select new.id, tstzrange(linea.inicio, linea.fin, '[)'), linea.precio_base_por_hora,
    linea.regla_recurrente_id, linea.regla_recurrente_nombre,
    linea.promocion_id, linea.promocion_nombre, linea.precio_por_hora_aplicado, linea.subtotal
  from public.fn_calcular_lineas_tarifa(new.cancha_id, new.deporte_id, lower(new.rango), upper(new.rango)) linea;
  select l.porcentaje_adelanto into v_porcentaje_adelanto
  from public.canchas c join public.locales l on l.id = c.local_id where c.id = new.cancha_id;
  update public.reserva_extensiones extension
  set monto_adicional = cotizacion.monto_adicional,
      adelanto_adicional_requerido = round(cotizacion.monto_adicional * v_porcentaje_adelanto / 100.0, 2)
  from lateral (select round(coalesce(sum(linea.subtotal), 0), 2) as monto_adicional
    from public.fn_calcular_lineas_tarifa(new.cancha_id, new.deporte_id,
      upper(new.rango) - interval '30 minutes', upper(new.rango)) linea) cotizacion
  where extension.reserva_id = new.id
    and extension.rango_extension = tstzrange(upper(new.rango) - interval '30 minutes', upper(new.rango), '[)');
  return null;
end;
$$;

create function public.ampliar_reserva_hora_dueno(
  p_reserva_id uuid, p_fin_esperado timestamptz, p_total_esperado numeric,
  p_medio_pago_id uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_reserva public.reservas%rowtype;
  v_local_id uuid;
  v_quote record;
  v_medio public.local_medios_pago%rowtype;
  v_id uuid;
begin
  select r.* into v_reserva
  from public.reservas r join public.canchas c on c.id = r.cancha_id
  join public.locales l on l.id = c.local_id
  where r.id = p_reserva_id and l.dueno_id = (select auth.uid()) for update of r;
  if not found then raise exception 'Reserva no disponible para este local.' using errcode = '42501'; end if;
  select c.local_id into v_local_id from public.canchas c where c.id = v_reserva.cancha_id;
  perform pg_advisory_xact_lock(hashtextextended(v_reserva.cancha_id::text, 0));
  select * into v_quote from public.cotizar_ampliacion_hora_reserva_dueno(p_reserva_id);
  if p_fin_esperado is distinct from v_quote.fin_anterior or p_total_esperado is distinct from v_reserva.monto_total then
    raise exception 'La reserva cambió. Actualiza el detalle y revisa el nuevo precio.' using errcode = 'P0001';
  end if;
  if p_medio_pago_id is not null then
    select * into v_medio from public.local_medios_pago m
    where m.id = p_medio_pago_id and m.local_id = v_local_id and m.activo;
    if not found then raise exception 'Selecciona un medio de pago activo del local.' using errcode = 'P0001'; end if;
  end if;
  insert into public.reserva_ampliaciones_hora(reserva_id,rango_previo,rango_nuevo,monto_adicional,autorizado_por)
  values (p_reserva_id, v_reserva.rango,
    tstzrange(lower(v_reserva.rango), v_quote.fin_nuevo, '[)'),
    v_quote.monto_adicional, (select auth.uid())) returning id into v_id;
  update public.reservas set rango = tstzrange(lower(v_reserva.rango), v_quote.fin_nuevo, '[)')
  where id = p_reserva_id;
  if p_medio_pago_id is not null then
    insert into public.movimientos_pago_reserva (
      reserva_id, tipo, monto, medio, medio_pago_id, medio_tipo_snapshot,
      medio_nombre_snapshot, medio_titular_snapshot, notas, registrado_por
    ) values (p_reserva_id, 'saldo', v_quote.monto_adicional,
      v_medio.nombre_visible, v_medio.id, v_medio.tipo, v_medio.nombre_visible,
      v_medio.titular, 'Hora adicional', (select auth.uid()));
  end if;
  return v_id;
exception when exclusion_violation then
  raise exception 'La hora adicional ya no está disponible.' using errcode = '23P01';
end;
$$;

create function public.revertir_ampliacion_hora_reserva_dueno(p_ampliacion_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_evento public.reserva_ampliaciones_hora%rowtype;
  v_reserva public.reservas%rowtype;
  v_cobrado numeric(10,2);
begin
  select e.* into v_evento from public.reserva_ampliaciones_hora e
  where e.id = p_ampliacion_id for update;
  if not found then raise exception 'La ampliación no existe.' using errcode = 'P0001'; end if;
  select r.* into v_reserva from public.reservas r
  join public.canchas c on c.id = r.cancha_id
  join public.locales l on l.id = c.local_id
  where r.id = v_evento.reserva_id and l.dueno_id = (select auth.uid()) for update of r;
  if not found then raise exception 'No puedes modificar esta reserva.' using errcode = '42501'; end if;
  if v_evento.revertido_at is not null or v_reserva.rango <> v_evento.rango_nuevo
    or v_reserva.estado <> 'confirmada'::public.estado_reserva
    or upper(v_evento.rango_previo) <= now()
    or exists (select 1 from public.reserva_extensiones e where e.reserva_id = v_reserva.id) then
    raise exception 'La hora adicional ya no se puede quitar: revisa el horario y las ampliaciones posteriores.' using errcode = 'P0001';
  end if;
  select coalesce(sum(m.monto) filter (where m.tipo in ('adelanto', 'saldo')), 0)
  into v_cobrado from public.movimientos_pago_reserva m where m.reserva_id = v_reserva.id;
  if v_reserva.monto_total - v_evento.monto_adicional < greatest(v_cobrado, v_reserva.monto_adelanto_requerido) then
    raise exception 'No se puede quitar la hora: lo cobrado supera el total anterior. Primero se debe resolver la devolución.' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_reserva.cancha_id::text, 0));
  update public.reserva_ampliaciones_hora set revertido_at = now(), revertido_por = (select auth.uid())
  where id = v_evento.id;
  update public.reservas set rango = v_evento.rango_previo where id = v_reserva.id;
end;
$$;

-- Evita mezclar la excepción de media hora con ampliaciones completas.
create function public.fn_no_mezclar_extensiones_reserva()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.reserva_ampliaciones_hora a
    where a.reserva_id = new.reserva_id and a.revertido_at is null) then
    raise exception 'Esta reserva ya tiene una hora adicional. No se puede añadir +30 minutos.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger trg_no_mezclar_extensiones_reserva before insert on public.reserva_extensiones
for each row execute function public.fn_no_mezclar_extensiones_reserva();

create function public.fn_no_reprogramar_ampliacion_hora()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.cancha_id <> old.cancha_id or lower(new.rango) <> lower(old.rango))
    and exists (select 1 from public.reserva_ampliaciones_hora a
      where a.reserva_id = new.id and a.revertido_at is null) then
    raise exception 'Quita primero la hora adicional para reprogramar la reserva.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger trg_no_reprogramar_ampliacion_hora before update of cancha_id,rango on public.reservas
for each row execute function public.fn_no_reprogramar_ampliacion_hora();

revoke all on function public.cotizar_ampliacion_hora_reserva_dueno(uuid) from public, anon, authenticated;
revoke all on function public.ampliar_reserva_hora_dueno(uuid,timestamptz,numeric,uuid) from public, anon, authenticated;
revoke all on function public.revertir_ampliacion_hora_reserva_dueno(uuid) from public, anon, authenticated;
grant execute on function public.cotizar_ampliacion_hora_reserva_dueno(uuid) to authenticated;
grant execute on function public.ampliar_reserva_hora_dueno(uuid,timestamptz,numeric,uuid) to authenticated;
grant execute on function public.revertir_ampliacion_hora_reserva_dueno(uuid) to authenticated;
