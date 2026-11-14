CREATE OR REPLACE FUNCTION public.billing_aplicar_preapproval(p_preapproval_id text, p_estado_remoto text, p_proximo_cobro_at timestamp with time zone, p_payload jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_sub public.suscripciones%rowtype;
  v_fin_pagado timestamptz;
  v_max_sedes integer;
begin
  select * into v_sub from public.suscripciones
  where mercadopago_preapproval_id = p_preapproval_id for update;
  if v_sub is null then
    return exists(select 1 from public.billing_preapprovals_archivo a
      where a.preapproval_id = p_preapproval_id);
  end if;

  if p_estado_remoto = 'authorized' then
    -- La autorización de una tarjeta no prueba que se haya cobrado la mensualidad.
    update public.suscripciones
    set proximo_cobro_at = coalesce(p_proximo_cobro_at, proximo_cobro_at),
        metodo_pago_codigo = coalesce(
          nullif(left(coalesce(p_payload ->> 'payment_method_id', ''), 50), ''),
          metodo_pago_codigo)
    where id = v_sub.id;
  elsif p_estado_remoto in ('cancelled', 'canceled', 'paused') then
    if p_estado_remoto in ('cancelled', 'canceled') then
      update public.intentos_checkout_suscripcion i set estado = 'cancelado'
      where i.suscripcion_id = v_sub.id and i.estado in ('preparado', 'preapproval_creado');
      update public.cambios_sedes_suscripcion c set estado = 'cancelado'
      where c.suscripcion_id = v_sub.id and c.estado in ('preparado', 'programado', 'requiere_revision');
    end if;
    select max(f.periodo_fin) into v_fin_pagado
    from public.facturas_suscripcion f
    where f.suscripcion_id = v_sub.id and f.estado = 'pagada'
      and f.periodo_inicio <= now() and f.periodo_fin > now();
    select p.sedes_incluidas + v_sub.sedes_extra_contratadas into v_max_sedes
    from public.precios_suscripcion p where p.id = v_sub.precio_version_id;
    update public.suscripciones
    set estado = case when p_estado_remoto = 'paused' then 'pago_fallido'::public.estado_suscripcion else 'cancelada'::public.estado_suscripcion end,
        estado_facturacion = case when p_estado_remoto = 'paused' then 'suspendida' else 'cancelada' end,
        cancelacion_efectiva_at = case when p_estado_remoto = 'paused' then cancelacion_efectiva_at else coalesce(v_fin_pagado, now()) end,
        proximo_cobro_at = null
    where id = v_sub.id;
    insert into public.entitlements_suscripcion
      (dueno_id, suscripcion_id, max_sedes, panel_habilitado, visibilidad_app_habilitada, reservas_habilitadas, vigente_hasta)
    values (v_sub.dueno_id, v_sub.id,
      case when p_estado_remoto <> 'paused' and v_fin_pagado is not null then v_max_sedes else 0 end,
      p_estado_remoto <> 'paused' and v_fin_pagado is not null,
      p_estado_remoto <> 'paused' and v_fin_pagado is not null,
      p_estado_remoto <> 'paused' and v_fin_pagado is not null,
      case when p_estado_remoto <> 'paused' then coalesce(v_fin_pagado, now()) else now() end)
    on conflict (dueno_id) do update set
      max_sedes = excluded.max_sedes,
      panel_habilitado = excluded.panel_habilitado,
      visibilidad_app_habilitada = excluded.visibilidad_app_habilitada,
      reservas_habilitadas = excluded.reservas_habilitadas,
      vigente_hasta = excluded.vigente_hasta;
  end if;
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.billing_expirar_gracias()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_afectadas integer;
  v_canceladas integer;
begin
  update public.entitlements_suscripcion e
  set max_sedes = 0, panel_habilitado = false,
      visibilidad_app_habilitada = false, reservas_habilitadas = false,
      vigente_hasta = now()
  from public.suscripciones s
  where s.id = e.suscripcion_id
    and s.estado_facturacion = 'en_gracia'
    and s.gracia_hasta is not null and s.gracia_hasta <= now()
    and (e.panel_habilitado or e.visibilidad_app_habilitada or e.reservas_habilitadas);
  get diagnostics v_afectadas = row_count;

  update public.suscripciones
  set estado = 'pago_fallido', estado_facturacion = 'suspendida'
  where estado_facturacion = 'en_gracia'
    and gracia_hasta is not null and gracia_hasta <= now();
  update public.entitlements_suscripcion e
  set max_sedes = 0, panel_habilitado = false,
      visibilidad_app_habilitada = false, reservas_habilitadas = false,
      vigente_hasta = now()
  from public.suscripciones s
  where s.id = e.suscripcion_id and s.estado = 'cancelada'
    and e.vigente_hasta <= now()
    and (e.panel_habilitado or e.visibilidad_app_habilitada or e.reservas_habilitadas);
  get diagnostics v_canceladas = row_count;
  return v_afectadas + v_canceladas;
end;
$function$
;

-- Restituir únicamente contratos cancelados que aún tienen una factura pagada vigente.
with periodos as (
  select s.id as suscripcion_id, s.dueno_id,
    max(f.periodo_fin) as fin_pagado,
    p.sedes_incluidas + s.sedes_extra_contratadas as max_sedes
  from public.suscripciones s
  join public.facturas_suscripcion f on f.suscripcion_id = s.id
  join public.precios_suscripcion p on p.id = s.precio_version_id
  where s.estado = 'cancelada' and f.estado = 'pagada'
    and f.periodo_inicio <= now() and f.periodo_fin > now()
  group by s.id, s.dueno_id, p.sedes_incluidas, s.sedes_extra_contratadas
)
update public.entitlements_suscripcion e
set max_sedes = periodos.max_sedes,
    panel_habilitado = true, visibilidad_app_habilitada = true,
    reservas_habilitadas = true, vigente_hasta = periodos.fin_pagado
from periodos where e.dueno_id = periodos.dueno_id and e.suscripcion_id = periodos.suscripcion_id;

update public.suscripciones s
set cancelacion_efectiva_at = e.vigente_hasta
from public.entitlements_suscripcion e
where e.suscripcion_id = s.id and s.estado = 'cancelada'
  and e.panel_habilitado and e.vigente_hasta > now();
