-- El motivo interno solo vive en el historial protegido para el propietario.
alter table public.reservas drop constraint reservas_descuento_especial_valido;
alter table public.reservas drop column descuento_especial_motivo;
alter table public.reservas add constraint reservas_descuento_especial_valido check (
  precio_tarifa_base > 0
  and descuento_especial_monto >= 0
  and descuento_especial_monto < precio_tarifa_base
  and monto_total = precio_tarifa_base - descuento_especial_monto
);

create or replace function public.aplicar_precio_especial_reserva_dueno(
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
