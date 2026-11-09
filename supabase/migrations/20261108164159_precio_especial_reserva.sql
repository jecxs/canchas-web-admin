-- Precio especial fijo por reserva. El total público ya incluye promociones de tarifa.
alter table public.reservas
  add column if not exists precio_tarifa_base numeric(10,2),
  add column if not exists descuento_especial_monto numeric(10,2) not null default 0,
  add column if not exists descuento_especial_motivo text;

update public.reservas
set precio_tarifa_base = monto_total
where precio_tarifa_base is null;

alter table public.reservas
  alter column precio_tarifa_base set not null,
  add constraint reservas_descuento_especial_valido check (
    precio_tarifa_base > 0
    and descuento_especial_monto >= 0
    and descuento_especial_monto < precio_tarifa_base
    and monto_total = precio_tarifa_base - descuento_especial_monto
    and ((descuento_especial_monto = 0 and descuento_especial_motivo is null)
      or (descuento_especial_monto > 0 and char_length(btrim(descuento_especial_motivo)) between 3 and 300))
  );

create table public.reserva_descuentos_historial (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas(id),
  precio_tarifa_base numeric(10,2) not null,
  descuento_anterior numeric(10,2) not null,
  descuento_nuevo numeric(10,2) not null,
  total_anterior numeric(10,2) not null,
  total_nuevo numeric(10,2) not null,
  motivo text not null,
  registrado_por uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index reserva_descuentos_historial_reserva_fecha_idx
  on public.reserva_descuentos_historial (reserva_id, created_at desc);

alter table public.reserva_descuentos_historial enable row level security;
create policy reserva_descuentos_historial_dueno_lectura
  on public.reserva_descuentos_historial for select to authenticated
  using (exists (
    select 1 from public.reservas r
    join public.canchas c on c.id = r.cancha_id
    join public.locales l on l.id = c.local_id
    where r.id = reserva_id and l.dueno_id = (select auth.uid())
  ));
grant select on public.reserva_descuentos_historial to authenticated;

create or replace function public.fn_calcular_precio_reserva()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_total numeric(10,2);
  v_final numeric(10,2);
  v_horas numeric;
  v_porcentaje_adelanto numeric;
  v_cobrado numeric(10,2);
begin
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

create function public.aplicar_precio_especial_reserva_dueno(
  p_reserva_id uuid, p_monto_final numeric, p_motivo text, p_total_esperado numeric default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_reserva public.reservas%rowtype;
  v_final numeric(10,2);
  v_cobrado numeric(10,2);
  v_motivo text := nullif(btrim(p_motivo), '');
  v_horas numeric;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;

  select r.* into v_reserva
  from public.reservas r
  join public.canchas c on c.id = r.cancha_id
  join public.locales l on l.id = c.local_id
  where r.id = p_reserva_id and l.dueno_id = (select auth.uid())
  for update of r;
  if not found then raise exception 'Reserva no disponible para este local.' using errcode = '42501'; end if;
  if v_reserva.estado not in ('confirmada'::public.estado_reserva, 'completada'::public.estado_reserva) then
    raise exception 'Solo puedes ajustar el precio de una reserva confirmada o completada.' using errcode = 'P0001';
  end if;
  if p_total_esperado is not null and v_reserva.monto_total <> round(p_total_esperado, 2) then
    raise exception 'El precio de la reserva cambió. Actualiza la página y vuelve a revisar.' using errcode = 'P0001';
  end if;
  if v_motivo is null or char_length(v_motivo) not between 3 and 300 then
    raise exception 'Escribe un motivo privado de entre 3 y 300 caracteres.' using errcode = 'P0001';
  end if;
  if p_monto_final is null or p_monto_final <> round(p_monto_final, 2) then
    raise exception 'Escribe un monto final válido con hasta dos decimales.' using errcode = 'P0001';
  end if;
  v_final := p_monto_final;
  select coalesce(sum(mp.monto) filter (where mp.tipo in ('adelanto', 'saldo')), 0)
  into v_cobrado from public.movimientos_pago_reserva mp where mp.reserva_id = p_reserva_id;
  if v_final < greatest(v_cobrado, v_reserva.monto_adelanto_requerido) then
    raise exception 'El precio final no puede ser menor que el adelanto acordado ni que lo ya cobrado.' using errcode = 'P0001';
  end if;
  if v_final <= 0 or v_final > v_reserva.precio_tarifa_base then
    raise exception 'El precio final debe ser mayor que cero y no superar la tarifa de la reserva.' using errcode = 'P0001';
  end if;
  if v_final = v_reserva.monto_total then
    raise exception 'El precio final ya es el actual.' using errcode = 'P0001';
  end if;

  v_horas := extract(epoch from upper(v_reserva.rango) - lower(v_reserva.rango)) / 3600.0;
  update public.reservas set
    descuento_especial_monto = v_reserva.precio_tarifa_base - v_final,
    descuento_especial_motivo = case when v_final < v_reserva.precio_tarifa_base then v_motivo else null end,
    monto_total = v_final,
    precio_por_hora_aplicado = round(v_final / v_horas, 2)
  where id = p_reserva_id;

  insert into public.reserva_descuentos_historial (
    reserva_id, precio_tarifa_base, descuento_anterior, descuento_nuevo,
    total_anterior, total_nuevo, motivo, registrado_por
  ) values (
    p_reserva_id, v_reserva.precio_tarifa_base, v_reserva.descuento_especial_monto,
    v_reserva.precio_tarifa_base - v_final, v_reserva.monto_total, v_final,
    v_motivo, (select auth.uid())
  );
end;
$$;

revoke all on function public.aplicar_precio_especial_reserva_dueno(uuid,numeric,text,numeric) from public, anon;
grant execute on function public.aplicar_precio_especial_reserva_dueno(uuid,numeric,text,numeric) to authenticated;

create function public.crear_reserva_manual_confirmada_dueno_con_descuento(
  p_local_id uuid, p_cancha_id uuid, p_deporte_id uuid, p_inicio timestamptz,
  p_bloques integer, p_medio_pago_id uuid, p_cliente_id uuid, p_cliente_nombre text,
  p_cliente_telefono text, p_monto_adelanto numeric, p_canal public.canal_origen_reserva,
  p_notas text, p_nombre_publico text, p_monto_final numeric, p_motivo_descuento text,
  p_total_cotizado numeric
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_reserva record;
begin
  select * into v_reserva from public.crear_reserva_manual_confirmada_dueno_con_nombre(
    p_local_id, p_cancha_id, p_deporte_id, p_inicio, p_bloques, p_medio_pago_id,
    p_cliente_id, p_cliente_nombre, p_cliente_telefono, p_monto_adelanto,
    p_canal, p_notas, p_nombre_publico
  );
  if p_total_cotizado is null or v_reserva.monto_total <> round(p_total_cotizado, 2) then
    raise exception 'La tarifa cambió. Actualiza la cotización antes de registrar la reserva.' using errcode = 'P0001';
  end if;
  perform public.aplicar_precio_especial_reserva_dueno(
    v_reserva.reserva_id, p_monto_final, p_motivo_descuento, v_reserva.monto_total
  );
  return v_reserva.reserva_id;
end;
$$;

revoke all on function public.crear_reserva_manual_confirmada_dueno_con_descuento(
  uuid,uuid,uuid,timestamptz,integer,uuid,uuid,text,text,numeric,public.canal_origen_reserva,text,text,numeric,text,numeric
) from public, anon;
grant execute on function public.crear_reserva_manual_confirmada_dueno_con_descuento(
  uuid,uuid,uuid,timestamptz,integer,uuid,uuid,text,text,numeric,public.canal_origen_reserva,text,text,numeric,text,numeric
) to authenticated;
