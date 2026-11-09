-- Solo las reservas de origen manual pueden acordarse sin adelanto.
alter table public.reservas drop constraint chk_monto_adelanto_valido;
alter table public.reservas add constraint chk_monto_adelanto_valido check (
  monto_adelanto_requerido <= monto_total
  and (
    monto_adelanto_requerido > 0
    or (monto_adelanto_requerido = 0 and canal_origen in ('whatsapp', 'presencial'))
  )
);

create or replace function public.crear_reserva_manual_confirmada_dueno_con_nombre(
  p_local_id uuid, p_cancha_id uuid, p_deporte_id uuid, p_inicio timestamptz,
  p_bloques integer, p_medio_pago_id uuid, p_cliente_id uuid default null,
  p_cliente_nombre text default null, p_cliente_telefono text default null,
  p_monto_adelanto numeric default null,
  p_canal public.canal_origen_reserva default 'whatsapp',
  p_notas text default null, p_nombre_publico text default null
)
returns table (
  reserva_id uuid, cliente_id uuid, cliente_sin_cuenta_nombre text,
  cliente_sin_cuenta_telefono text, cancha_id uuid, cancha_nombre text,
  inicio timestamptz, fin timestamptz, estado public.estado_reserva,
  monto_total numeric, monto_adelanto_requerido numeric
)
language plpgsql security definer set search_path to ''
as $function$
declare
  v_reserva record;
  v_adelanto numeric(10,2) := round(p_monto_adelanto, 2);
begin
  if v_adelanto is null or v_adelanto < 0 then
    raise exception 'El adelanto no puede ser negativo.' using errcode = '23514';
  end if;

  if v_adelanto = 0 then
    if p_medio_pago_id is not null then
      raise exception 'Una reserva sin adelanto no debe tener medio de pago inicial.' using errcode = '23514';
    end if;
    select * into v_reserva from public.crear_reserva_manual_dueno(
      p_local_id, p_deporte_id, p_inicio, p_bloques, p_cancha_id,
      p_cliente_id, p_cliente_nombre, p_cliente_telefono,
      'confirmada'::public.estado_reserva, p_canal, p_notas
    );
    update public.reservas
    set monto_adelanto_requerido = 0
    where id = v_reserva.reserva_id;
  else
    select * into v_reserva from public.crear_reserva_manual_confirmada_dueno_v2(
      p_local_id, p_deporte_id, p_inicio, p_bloques, p_cancha_id,
      p_medio_pago_id, p_cliente_id, p_cliente_nombre, p_cliente_telefono,
      v_adelanto, p_canal, p_notas
    );
  end if;

  if p_nombre_publico is not null and btrim(p_nombre_publico) <> '' then
    perform public.actualizar_nombre_publico_reserva(v_reserva.reserva_id, p_nombre_publico, false);
  end if;
  return query select v_reserva.reserva_id, v_reserva.cliente_id,
    v_reserva.cliente_sin_cuenta_nombre, v_reserva.cliente_sin_cuenta_telefono,
    v_reserva.cancha_id, v_reserva.cancha_nombre, v_reserva.inicio, v_reserva.fin,
    v_reserva.estado, v_reserva.monto_total, v_adelanto;
end;
$function$;

create or replace function public.crear_reserva_manual_encajada_confirmada_dueno_con_nombre(
  p_local_id uuid, p_cancha_id uuid, p_deporte_id uuid, p_inicio timestamptz,
  p_medio_pago_id uuid, p_cliente_id uuid default null,
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
  v_reserva record;
  v_adelanto numeric(10,2) := round(p_monto_adelanto, 2);
begin
  if v_adelanto is null or v_adelanto < 0 then
    raise exception 'El adelanto no puede ser negativo.' using errcode = '23514';
  end if;

  if v_adelanto = 0 then
    if p_medio_pago_id is not null then
      raise exception 'Una reserva sin adelanto no debe tener medio de pago inicial.' using errcode = '23514';
    end if;
    select * into v_reserva from public.crear_reserva_manual_encajada(
      p_local_id, p_deporte_id, p_inicio, p_cliente_id,
      p_cliente_nombre, p_cliente_telefono,
      'confirmada'::public.estado_reserva, p_canal, p_notas
    );
    if v_reserva.cancha_id <> p_cancha_id then
      raise exception 'El horario encajado cambió de cancha. Actualiza la agenda e inténtalo nuevamente.';
    end if;
    update public.reservas
    set monto_adelanto_requerido = 0
    where id = v_reserva.reserva_id;
  else
    select * into v_reserva from public.crear_reserva_manual_encajada_confirmada_dueno_v2(
      p_local_id, p_cancha_id, p_deporte_id, p_inicio, p_medio_pago_id,
      p_cliente_id, p_cliente_nombre, p_cliente_telefono,
      v_adelanto, p_canal, p_notas
    );
  end if;

  if p_nombre_publico is not null and btrim(p_nombre_publico) <> '' then
    perform public.actualizar_nombre_publico_reserva(v_reserva.reserva_id, p_nombre_publico, false);
  end if;
  return query select v_reserva.reserva_id, v_reserva.cancha_id,
    v_reserva.cancha_nombre, v_reserva.inicio, v_reserva.fin,
    v_reserva.monto_total, v_adelanto;
end;
$function$;
