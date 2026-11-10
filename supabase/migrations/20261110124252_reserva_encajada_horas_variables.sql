-- Reserva de la media hora liberada más una, dos o tres horas completas.
CREATE OR REPLACE FUNCTION public.cotizar_reserva_manual_dueno(p_local_id uuid, p_cancha_id uuid, p_deporte_id uuid, p_inicio timestamp with time zone, p_duracion_minutos integer)
 RETURNS TABLE(monto_total numeric, monto_adelanto_sugerido numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_fin timestamptz;
  v_porcentaje_adelanto numeric(5,2);
  v_total numeric(10,2);
begin
  if v_actor_id is null then
    raise exception 'Debes iniciar sesión para cotizar una reserva manual.' using errcode = '42501';
  end if;
  if p_inicio is null or p_inicio <= now() then
    raise exception 'La reserva manual debe ser para un horario futuro.';
  end if;
  if p_duracion_minutos is null or p_duracion_minutos not in (60, 90, 120, 150, 180, 210, 240) then
    raise exception 'La duración debe ser de una a cuatro horas completas, o una media hora seguida de una, dos o tres horas.';
  end if;
  if p_duracion_minutos in (90, 150, 210) and extract(minute from p_inicio at time zone 'America/Lima') <> 30 then
    raise exception 'La reserva encajada debe iniciar a los 30 minutos de la hora.';
  end if;

  select l.porcentaje_adelanto
  into v_porcentaje_adelanto
  from public.canchas c
  join public.locales l on l.id = c.local_id
  join public.cancha_deportes cd on cd.cancha_id = c.id and cd.deporte_id = p_deporte_id and cd.precio_por_hora > 0
  where c.id = p_cancha_id
    and c.local_id = p_local_id
    and c.activa
    and l.estado in ('trial'::public.estado_local, 'activo'::public.estado_local, 'en_gracia'::public.estado_local)
    and (l.dueno_id = v_actor_id or public.fn_rol_actual() = 'super_admin'::public.rol_usuario);

  if not found then
    raise exception 'No puedes cotizar esta cancha o deporte.' using errcode = '42501';
  end if;

  v_fin := p_inicio + make_interval(mins => p_duracion_minutos);
  select round(coalesce(sum(linea.subtotal), 0), 2)
  into v_total
  from public.fn_calcular_lineas_tarifa(p_cancha_id, p_deporte_id, p_inicio, v_fin) linea;

  if v_total <= 0 then
    raise exception 'No fue posible calcular la tarifa de la reserva.';
  end if;

  return query select v_total, round(v_total * v_porcentaje_adelanto / 100.0, 2);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.crear_reserva_manual_encajada_variable(p_local_id uuid, p_cancha_id uuid, p_deporte_id uuid, p_inicio timestamp with time zone, p_bloques integer, p_cliente_id uuid DEFAULT NULL::uuid, p_cliente_nombre text DEFAULT NULL::text, p_cliente_telefono text DEFAULT NULL::text, p_estado estado_reserva DEFAULT 'pendiente_pago'::estado_reserva, p_canal canal_origen_reserva DEFAULT 'whatsapp'::canal_origen_reserva, p_notas text DEFAULT NULL::text)
 RETURNS TABLE(reserva_id uuid, cancha_id uuid, cancha_nombre text, inicio timestamp with time zone, fin timestamp with time zone, monto_total numeric, monto_adelanto_requerido numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inicio_local timestamp;
  v_fin timestamptz;
  v_fecha date;
  v_apertura timestamptz;
  v_cierre timestamptz;
  v_porcentaje_adelanto numeric;
  v_cancha_id uuid;
  v_cancha_nombre text;
  v_precio_por_hora numeric(10,2);
  v_rango tstzrange;
  v_monto_total numeric(10,2);
  v_monto_adelanto numeric(10,2);
  v_reserva_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión para registrar una reserva manual.';
  end if;

  if p_cliente_id is null and nullif(trim(coalesce(p_cliente_telefono, '')), '') is null then
    raise exception 'Una reserva manual requiere un cliente registrado o su teléfono.';
  end if;

  if p_estado not in ('pendiente_pago', 'confirmada') then
    raise exception 'La reserva manual solo puede iniciar pendiente de pago o confirmada.';
  end if;

  if p_canal not in ('whatsapp', 'presencial') then
    raise exception 'La reserva encajada debe registrarse como WhatsApp o presencial.';
  end if;

  v_inicio_local := p_inicio at time zone 'America/Lima';
  if extract(minute from v_inicio_local) <> 30
    or extract(second from v_inicio_local) <> 0 then
    raise exception 'La reserva encajada debe iniciar exactamente a los 30 minutos de una hora.';
  end if;

  if p_bloques is null or p_bloques not between 1 and 3 then
    raise exception 'Elige de una a tres horas después de la media hora libre.';
  end if;
  v_fin := p_inicio + make_interval(mins => p_bloques * 60 + 30);
  v_fecha := v_inicio_local::date;
  if (v_fin at time zone 'America/Lima')::date <> v_fecha
    or extract(minute from (v_fin at time zone 'America/Lima')) <> 0 then
    raise exception 'La reserva encajada debe terminar en una hora exacta del mismo día.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_local_id::text, 0));

  select
    (v_fecha + h.hora_apertura) at time zone 'America/Lima',
    (v_fecha + h.hora_cierre) at time zone 'America/Lima',
    l.porcentaje_adelanto
  into v_apertura, v_cierre, v_porcentaje_adelanto
  from public.locales l
  join public.horarios_atencion h
    on h.local_id = l.id
   and h.dia_semana = extract(dow from v_fecha)::integer
  where l.id = p_local_id
    and l.estado in ('trial', 'activo', 'en_gracia')
    and (
      l.dueno_id = (select auth.uid())
      or public.fn_rol_actual() = 'super_admin'::public.rol_usuario
    );

  if not found then
    raise exception 'No puedes registrar una reserva para este local o no atiende esa fecha.';
  end if;

  if v_porcentaje_adelanto is null then
    raise exception 'El local aún no configuró el porcentaje de adelanto.';
  end if;

  v_rango := tstzrange(p_inicio, v_fin, '[)');
  if not (v_rango <@ tstzrange(v_apertura, v_cierre, '[)')) then
    raise exception 'La reserva encajada queda fuera del horario de atención.';
  end if;

  select c.id, c.nombre, cd.precio_por_hora
  into v_cancha_id, v_cancha_nombre, v_precio_por_hora
  from public.canchas c
  join public.cancha_deportes cd
    on cd.cancha_id = c.id
   and cd.deporte_id = p_deporte_id
  where c.local_id = p_local_id
    and c.id = p_cancha_id
    and c.activa
    and cd.precio_por_hora is not null
    and cd.precio_por_hora > 0
    and exists (
      select 1
      from public.reserva_extensiones e
      join public.reservas r on r.id = e.reserva_id
      where r.cancha_id = c.id
        and r.estado in ('confirmada', 'completada')
        and upper(e.rango_extension) = p_inicio
    )
    and not exists (
      select 1
      from public.reservas r
      where r.cancha_id = c.id
        and r.estado in ('pendiente_pago', 'confirmada', 'completada')
        and r.rango && v_rango
    )
    and not exists (
      select 1
      from public.bloqueos_mantenimiento b
      where b.cancha_id = c.id
        and b.rango && v_rango
    )
  order by c.nombre, c.id
  limit 1
  for update of c;

  if not found then
    raise exception 'La media hora liberada o las horas siguientes ya no están disponibles en esta cancha.';
  end if;

  select round(coalesce(sum(linea.subtotal), 0), 2) into v_monto_total
  from public.fn_calcular_lineas_tarifa(v_cancha_id, p_deporte_id, p_inicio, v_fin) linea;
  if v_monto_total <= 0 then
    raise exception 'No se pudo calcular el precio de esta reserva.';
  end if;
  v_monto_adelanto := round(v_monto_total * v_porcentaje_adelanto / 100.0, 2);

  insert into public.reservas (
    cancha_id,
    cliente_id,
    cliente_sin_cuenta_nombre,
    cliente_sin_cuenta_telefono,
    deporte_id,
    estado,
    rango,
    monto_total,
    monto_adelanto_requerido,
    precio_por_hora_aplicado,
    es_excepcion_horaria,
    confirmada_por,
    notas,
    canal_origen,
    reembolso_resultado
  ) values (
    v_cancha_id,
    p_cliente_id,
    case when p_cliente_id is null then nullif(trim(p_cliente_nombre), '') else null end,
    case when p_cliente_id is null then nullif(trim(p_cliente_telefono), '') else null end,
    p_deporte_id,
    p_estado,
    v_rango,
    v_monto_total,
    v_monto_adelanto,
    v_precio_por_hora,
    true,
    case when p_estado = 'confirmada' then (select auth.uid()) else null end,
    p_notas,
    p_canal,
    'no_aplica'
  ) returning id into v_reserva_id;

  return query
  select v_reserva_id, v_cancha_id, v_cancha_nombre, p_inicio, v_fin,
         v_monto_total, v_monto_adelanto;
end;
$function$
;

create or replace function public.crear_reserva_manual_encajada_bloques_dueno(
  p_local_id uuid, p_cancha_id uuid, p_deporte_id uuid, p_inicio timestamptz,
  p_bloques integer, p_medio_pago_id uuid, p_cliente_id uuid default null,
  p_cliente_nombre text default null, p_cliente_telefono text default null,
  p_monto_adelanto numeric default null,
  p_canal public.canal_origen_reserva default 'whatsapp',
  p_notas text default null, p_nombre_publico text default null
)
returns table (
  reserva_id uuid, cancha_id uuid, cancha_nombre text, inicio timestamptz,
  fin timestamptz, monto_total numeric, monto_adelanto_requerido numeric
)
language plpgsql security definer set search_path to ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_reserva record;
  v_medio public.local_medios_pago%rowtype;
  v_adelanto numeric(10,2) := round(p_monto_adelanto, 2);
  v_total numeric(10,2);
begin
  if v_actor_id is null then
    raise exception 'Debes iniciar sesión para registrar una reserva.' using errcode = '42501';
  end if;
  if v_adelanto is null or v_adelanto < 0 then
    raise exception 'El adelanto no puede ser negativo.' using errcode = '23514';
  end if;
  if v_adelanto = 0 and p_medio_pago_id is not null then
    raise exception 'Una reserva sin adelanto no debe tener medio de pago inicial.' using errcode = '23514';
  end if;
  if v_adelanto > 0 then
    select * into v_medio from public.local_medios_pago m
    where m.id = p_medio_pago_id and m.local_id = p_local_id and m.activo;
    if not found then
      raise exception 'Selecciona un medio de pago activo del local.' using errcode = '23514';
    end if;
  end if;

  select * into v_reserva from public.crear_reserva_manual_encajada_variable(
    p_local_id, p_cancha_id, p_deporte_id, p_inicio, p_bloques,
    p_cliente_id, p_cliente_nombre, p_cliente_telefono,
    'confirmada'::public.estado_reserva, p_canal, p_notas
  );
  select r.monto_total into v_total from public.reservas r where r.id = v_reserva.reserva_id;
  if v_adelanto > v_total then
    raise exception 'El adelanto no puede superar el total de la reserva.' using errcode = '23514';
  end if;
  update public.reservas r set
    monto_adelanto_requerido = v_adelanto,
    confirmada_por = v_actor_id,
    medio_pago_adelanto_id = case when v_adelanto > 0 then v_medio.id else null end
  where r.id = v_reserva.reserva_id;

  if v_adelanto > 0 then
    insert into public.movimientos_pago_reserva (
      reserva_id, tipo, monto, medio, notas, registrado_por,
      medio_pago_id, medio_tipo_snapshot, medio_nombre_snapshot, medio_titular_snapshot
    ) values (
      v_reserva.reserva_id, 'adelanto', v_adelanto, v_medio.nombre_visible,
      'Adelanto recibido al registrar la reserva encajada.', v_actor_id,
      v_medio.id, v_medio.tipo, v_medio.nombre_visible, v_medio.titular
    );
  end if;
  if p_nombre_publico is not null and btrim(p_nombre_publico) <> '' then
    perform public.actualizar_nombre_publico_reserva(v_reserva.reserva_id, p_nombre_publico, false);
  end if;
  return query select v_reserva.reserva_id, v_reserva.cancha_id, v_reserva.cancha_nombre,
    v_reserva.inicio, v_reserva.fin, v_total, v_adelanto;
end;
$function$;

revoke all on function public.crear_reserva_manual_encajada_variable(uuid, uuid, uuid, timestamptz, integer, uuid, text, text, public.estado_reserva, public.canal_origen_reserva, text) from public, anon;
grant execute on function public.crear_reserva_manual_encajada_variable(uuid, uuid, uuid, timestamptz, integer, uuid, text, text, public.estado_reserva, public.canal_origen_reserva, text) to authenticated;
revoke all on function public.crear_reserva_manual_encajada_bloques_dueno(uuid, uuid, uuid, timestamptz, integer, uuid, uuid, text, text, numeric, public.canal_origen_reserva, text, text) from public, anon;
grant execute on function public.crear_reserva_manual_encajada_bloques_dueno(uuid, uuid, uuid, timestamptz, integer, uuid, uuid, text, text, numeric, public.canal_origen_reserva, text, text) to authenticated;
