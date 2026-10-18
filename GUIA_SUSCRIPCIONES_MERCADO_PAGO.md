# Guía de suscripciones de propietarios con Mercado Pago

## Decisión

Para el lanzamiento de Grassly en Perú se utilizará **Mercado Pago Suscripciones**
(`preapproval`) como proveedor de cobro recurrente de la plataforma.

El dueño de una empresa paga una mensualidad a Grassly para habilitar la operación
de sus sedes en el panel web y su visibilidad en la app móvil. No es el mismo flujo
que el cobro de una reserva de un cliente hacia un local.

La experiencia de alta recomendada es un checkout alojado por Mercado Pago. En la
interfaz puede presentarse como un enlace o botón de pago, pero debe crear una
suscripción recurrente real, no un enlace de pago único.

No se usará Stripe Link para este producto. Link es una experiencia de checkout de
Stripe, no un motor de suscripciones independiente, y Stripe no ofrece procesamiento
de pagos local para un negocio peruano. Introducir una entidad extranjera solo para
el MVP añadiría obligaciones operativas, tributarias y cambiarias que Grassly no
necesita.

Referencias oficiales:

- [Mercado Pago: Suscripciones en Perú](https://www.mercadopago.com.pe/developers/es/docs/subscriptions/overview)
- [Mercado Pago: crear una suscripción (`preapproval`)](https://www.mercadopago.com.pe/developers/es/reference/online-payments/subscriptions/create-preapproval/post)
- [Mercado Pago: actualizar una suscripción](https://www.mercadopago.com.pe/developers/es/reference/online-payments/subscriptions/update-preapproval/put)
- [Mercado Pago: credenciales](https://www.mercadopago.com.pe/developers/es/docs/your-integrations/credentials)

## Dos dominios de pago que nunca se deben mezclar

| Dominio | Quién paga | Quién cobra | Credencial usada | Propósito |
| --- | --- | --- | --- | --- |
| Reserva | Cliente final | El dueño/local | Token OAuth del dueño vendedor | Cobrar el adelanto de una reserva. |
| Suscripción SaaS | Dueño de empresa | Grassly | Token de producción de Grassly | Cobrar el uso mensual del producto. |

El código existente en `supabase/functions/mercadopago-oauth-*` está orientado al
primer dominio: obtiene y renueva tokens OAuth de propietarios para que reciban sus
propios pagos de reserva. Esos tokens **no** deben emplearse para cobrarles la
suscripción a Grassly.

Las Edge Functions de suscripciones deben utilizar un secreto distinto, en esta
implementación `MP_BILLING_ACCESS_TOKEN`, almacenado únicamente en Supabase Edge
Function Secrets.
Jamás debe estar en Expo, Next.js del cliente, variables `NEXT_PUBLIC_*`, URLs,
registros o la base de datos.

## Cuenta y aplicación de Mercado Pago

### Producción

Grassly necesita una cuenta de Mercado Pago de producción, titular de los cobros de
suscripción. Esa cuenta debe ser de la empresa o de su representante legal y completar
la activación de credenciales de producción, datos de negocio, sitio web y requisitos
de Mercado Pago.

Se recomienda crear una **aplicación de Mercado Pago independiente para
`Grassly Billing`**, aunque técnicamente una misma aplicación puede tener credenciales
para más de una integración. La separación no es por una limitación de API; es una
decisión de seguridad y operación:

- Aísla credenciales, URLs de webhook, permisos y métricas del marketplace de reservas.
- Hace más sencilla una rotación de secretos sin afectar los pagos de reservas.
- Evita que un cambio de la integración OAuth de vendedores interrumpa el cobro SaaS.
- Facilita auditar qué cuenta recaudó cada tipo de dinero.

La aplicación `Grassly Billing` debe usar el `Access Token` de la cuenta de Grassly
en producción para crear y consultar `preapproval`. El dinero de las mensualidades
llega a esa cuenta recaudadora, no a las cuentas conectadas de los dueños.

### Pruebas

Usar otra aplicación o, como mínimo, credenciales de prueba separadas para Billing.
No reutilizar usuarios, tokens ni datos de prueba del marketplace para probar el
contrato de suscripción. Las pruebas deben representar, como mínimo:

- cuenta recaudadora de prueba de Grassly;
- dueño pagador de prueba;
- alta inicial, renovación, pago rechazado, cancelación y reactivación;
- webhook repetido y webhook recibido fuera de orden.

### OAuth de los dueños

La aplicación de marketplace mantiene `Client ID`, `Client Secret`, URLs de retorno y
el flujo OAuth para que cada dueño autorice el uso de su cuenta de Mercado Pago. Es
un acceso de terceros. En cambio, Billing cobra en nombre propio de Grassly y no
requiere pedir OAuth al dueño para efectuar el cargo de la mensualidad.

Mercado Pago diferencia expresamente el acceso OAuth en nombre de terceros del flujo
`client_credentials`, que permite acceder a recursos propios sin interacción de un
vendedor. Ver [OAuth: obtener Access Token](https://www.mercadopago.com.pe/developers/es/docs/security/oauth/creation).

## Contrato comercial recomendado

### Unidad de cobro

Una suscripción pertenece a una **empresa propietaria**, no a una sede individual.
Por ahora, mientras el modelo de datos siga identificando a la empresa mediante
`dueno_id`, habrá una suscripción por dueño. Si en el futuro un mismo grupo empresarial
necesita varios administradores, debe introducirse una entidad `empresas` y migrar la
suscripción a esa entidad; no duplicar suscripciones por usuario.

```text
monto_mensual = precio_base + (cantidad_sedes_extra × precio_sede_extra)
cupo_sedes = sedes_incluidas_en_plan + cantidad_sedes_extra
```

Para el MVP se recomienda:

- `sedes_incluidas_en_plan = 1`;
- cobro mensual en PEN;
- un único plan base;
- sedes extra como cantidad dentro del mismo contrato recurrente.

No crear una suscripción independiente por cada sede extra. Si el pago base falla,
la empresa entera pierde el entitlement al concluir la gracia y no puede conservar
solamente los add-ons.

### Decisiones que deben cerrarse antes de programar

| Decisión | Recomendación inicial |
| --- | --- |
| Sedes incluidas | 1. |
| Trial | Uno por empresa, no por sede. |
| Duración del trial | Parámetro comercial explícito, por ejemplo 14 días. |
| Gracia por cobro fallido | 5 días por defecto, configurable por versión de plan y con excepción individual de 0 a 30 días. |
| Cambio al aumentar sedes | Cobro único prorrateado y habilitación tras aprobación; alternativa MVP: aplicar en la siguiente renovación. |
| Cambio al reducir sedes | Programar al fin del periodo. El dueño debe elegir qué sedes dejar activas. |
| Suspensión | Sin operaciones de panel ni visibilidad/reservas públicas; conservar datos y permitir acceso a Facturación. |

## Hallazgos en la implementación actual

La base actual es un buen inicio, pero todavía es una preparación de esquema y no una
integración de cobro lista para producción.

1. `suscripciones` ya tiene una relación uno-a-uno con `dueno_id`, estado, monto,
   próximo cobro, `mercadopago_preapproval_id` y cantidad de extras.
2. `pagos_suscripcion` existe, pero no modela de forma suficiente una factura, intento,
   evento remoto ni procesamiento idempotente.
3. La pantalla `/panel/suscripcion` declara explícitamente que el cobro está pendiente
   de configurar la cuenta recaudadora de Grassly.
4. Existe una contradicción comercial: el panel administrativo describe el monto base
   como la primera sede, pero `fn_cupo_locales` devuelve actualmente `2 + extras`.
   Antes de activar cobros se debe migrar la función a una fuente de verdad que otorgue
   una sola sede incluida, o aprobar formalmente que el plan base incluya dos.
5. El trial actual se aplica por local. Esto permite a una misma empresa obtener varios
   trials y no representa el contrato SaaS recomendado.
6. `en_gracia` sigue siendo un estado operativo y público. Es válido solo durante una
   gracia acotada; no puede ser el estado final de una suscripción impaga.
7. El acceso actual se decide principalmente por estado del local. Debe pasar a depender
   de un entitlement central de la empresa, aplicado en servidor y base de datos.

## Modelo de datos objetivo

Se puede evolucionar la tabla actual en lugar de borrarla. La propuesta mínima es:

```text
suscripciones
  id, empresa_o_dueno_id, proveedor, proveedor_preapproval_id,
  estado, moneda, periodo_actual_inicio, periodo_actual_fin,
  proximo_cobro_at, gracia_hasta, cancelacion_efectiva_at,
  precio_version_id, created_at, updated_at

suscripcion_items
  id, suscripcion_id, tipo (base | sede_extra), cantidad,
  precio_unitario, monto_total, precio_version_id

facturas_suscripcion
  id, suscripcion_id, periodo_inicio, periodo_fin, monto,
  moneda, estado, proveedor_payment_id, proveedor_invoice_id,
  vencimiento_at, pagado_at

eventos_webhook_proveedor
  id, proveedor, proveedor_event_id UNIQUE, tipo, payload,
  recibido_at, procesado_at, resultado, error

entitlements_empresa
  empresa_o_dueno_id UNIQUE, max_sedes, panel_habilitado,
  visibilidad_app_habilitada, reservas_habilitadas,
  vigente_hasta, origen_suscripcion_id
```

Los precios deben tener versiones o snapshots. No se debe recalcular una factura
histórica usando el parámetro global actual, porque un cambio de precio modificaría el
significado de cobros ya emitidos.

`parametros_globales` puede conservar valores comerciales por defecto, pero no debe
ser el historial contractual de un dueño.

## Máquina de estados

Estados internos recomendados:

```text
pendiente_alta
  └─ pago inicial aprobado → activa

activa
  ├─ renovación aprobada → activa
  ├─ cobro fallido → en_gracia
  └─ cancelación solicitada → cancelacion_programada

en_gracia
  ├─ pago recuperado → activa
  └─ gracia vencida → suspendida

cancelacion_programada
  └─ termina periodo vigente → cancelada

suspendida / cancelada
  └─ nueva alta o pago recuperado → activa
```

El estado de Mercado Pago y el estado de negocio de Grassly no deben confundirse. El
webhook informa hechos externos; una transacción de backend valida el hecho, actualiza
la factura, recalcula el entitlement y finalmente actualiza los locales afectados.

## Reglas de acceso y visibilidad

La única fuente de verdad para habilitar a una empresa debe ser su entitlement vigente.
La UI puede mostrar el estado, pero no debe otorgar permisos por sí misma.

| Estado | Panel operativo | Facturación | Visible en app | Nuevas reservas |
| --- | --- | --- | --- | --- |
| Trial vigente | Sí | Sí | Sí | Sí |
| Activa | Sí | Sí | Sí | Sí |
| En gracia | Sí, con aviso | Sí | Sí | Sí |
| Suspendida | No | Sí | No | No |
| Cancelada | No | Sí | No | No |

La autorización debe comprobar esta condición en tres lugares:

1. RPCs y políticas de la base para mutaciones sensibles.
2. Server Actions y Edge Functions.
3. Consultas de catálogo/disponibilidad que alimentan la app móvil.

No basta con redirigir rutas de Next.js. Un usuario no debe poder invocar directamente
una RPC para publicar, editar horarios o confirmar reservas si su empresa está
suspendida.

## Flujo técnico

### Alta

1. El dueño elige base y número de sedes extra.
2. Backend calcula el precio desde una versión de precios y crea una suscripción local
   `pendiente_alta` con una referencia externa opaca.
3. Una Edge Function de Billing crea el `preapproval` con el token de Grassly.
4. El frontend redirige al checkout alojado de Mercado Pago.
5. El webhook recibe la notificación; el backend consulta el recurso remoto antes de
   confiar en él.
6. Tras la aprobación se registra factura/pago, se activa el entitlement y se habilitan
   las sedes hasta el cupo contratado.

### Renovación y fallo de cobro

1. Mercado Pago notifica eventos de suscripción o pago autorizado.
2. El webhook verifica firma cuando corresponda, guarda el evento una sola vez y
   recupera el objeto remoto usando el token de Grassly.
3. Si el cobro es aprobado, cierra la factura y extiende el periodo.
4. Si falla, crea/actualiza el intento y establece `gracia_hasta`.
5. Un cron cada 15 minutos suspende las empresas cuya gracia venció y retira visibilidad de sus
   sedes.
6. Un proceso de conciliación periódico consulta suscripciones recientes para recuperar
   webhooks perdidos o retrasados.

El endpoint de webhook debe responder rápido. El procesamiento debe ser idempotente:
el mismo evento recibido dos veces no puede extender dos periodos ni habilitar dos
sedes. Mercado Pago documenta eventos de suscripción y de pagos autorizados en su
[guía de Webhooks](https://www.mercadopago.com.pe/developers/es/docs/links-and-debts/additional-content/your-integrations/notifications/webhooks).

### Cambios de cantidad de sedes

**Aumentar:** no incrementar el cupo al pulsar el botón. Para un MVP simple, programar
el nuevo importe para la siguiente renovación. Si el negocio requiere activación
inmediata, crear un cobro único prorrateado; solo tras su aprobación aumentar el
entitlement y actualizar el importe recurrente en Mercado Pago.

**Reducir:** nunca deshabilitar sedes arbitrariamente en mitad de un periodo pagado.
Programar la reducción al próximo ciclo y obligar al dueño a seleccionar o despublicar
las sedes que excedan el nuevo cupo.

## Seguridad y operación

- Usar una aplicación, secretos y endpoint webhook exclusivos para `Grassly Billing`.
- Guardar `Access Token`, `Client Secret` y secreto de webhook solo como secretos de
  Edge Functions.
- Mandar el Access Token únicamente por el header `Authorization`; Mercado Pago indica
  que no debe exponerse en frontend ni parámetros. Ver
  [buenas prácticas de credenciales](https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/best-practices/credentials-best-practices/secure-credentials).
- No registrar payloads que contengan secretos o datos innecesarios del pagador.
- Usar `external_reference` opaca, vinculada al ID local de suscripción/factura.
- Aplicar claves de idempotencia a las llamadas de creación y actualización remotas.
- Mantener auditoría de las acciones administrativas: suspensión manual, excepción de
  cupo, descuento, cambio de plan y reactivación.
- Nunca permitir que navegador o app móvil escriban directamente estados de
  `suscripciones`, facturas, pagos o entitlements.

## Plan de implementación por etapas

1. **Decisión comercial:** cerrar sede incluida, trial por empresa, gracia, política de
   aumento/reducción y efecto de suspensión.
2. **Migración de modelo:** crear items, facturas, eventos y entitlements; migrar la
   regla actual de cupos; regenerar `database.types.ts`.
3. **Autorización:** sustituir los checks de estado local por una función/RPC de
   entitlement en las operaciones y en la publicación móvil.
4. **Proveedor:** crear la aplicación `Grassly Billing`, activar sus credenciales de
   producción y almacenar secretos separados.
5. **Edge Functions:** alta, cambio de plan, webhook, conciliación y cron de gracia.
6. **Interfaz:** página de Facturación para estado, importe, próximas renovaciones,
   facturas y gestión de método de pago; mantener acceso a ella incluso suspendido.
7. **Pruebas:** casos de doble webhook, fallo, recuperación, eliminación de sede,
   downgrade, conciliación y permisos directos a RPC.
8. **Piloto:** activar para pocos locales de Ayacucho antes de hacer obligatoria la
   suscripción para todos.

## Estado de implementación

Las migraciones de Billing ya aplicadas en el proyecto remoto son:

- `20261021000100_billing_suscripciones_foundation.sql`;
- `20261021000200_billing_checkout_and_webhook_contract.sql`;
- `20261021000300_billing_entitlements_and_owner_activation.sql`;
- `20261021000400_billing_pricing_and_grace_policy.sql`.

La versión inicial publicada es: **S/ 80.00 mensuales**, una sede incluida,
**S/ 20.00 por cada sede extra** y **5 días de gracia**. Está en
`precios_suscripcion` como una versión contractual. El panel de
superadministración publica una nueva versión en vez de editarla: los contratos y
preapprovals existentes no cambian por esa acción.

El fallo de una renovación pasa la suscripción a `en_gracia`, conserva el
entitlement hasta `gracia_hasta` y no extiende la gracia ante nuevos rechazos. El
job `billing-expirar-gracias-v1` ejecuta `billing_expirar_gracias()` cada 15
minutos. Un pago aprobado antes o después de la suspensión restaura el
entitlement; el cron y `vigente_hasta` garantizan que la autorización no dependa
solo del scheduler.

El superadministrador también puede asignar una excepción individual mediante
`billing_establecer_gracia_propietario(dueno_id, dias)`. La interfaz específica de
esa excepción debe vivir en el detalle de propietario/facturación; no se debe
modificar la tabla directamente.

### Pendiente de configuración externa y activación

1. Desplegar `mercadopago-billing-checkout` y
   `mercadopago-billing-webhook`.
2. En los secretos de Edge Functions configurar `MP_BILLING_ACCESS_TOKEN`,
   `MP_BILLING_WEBHOOK_SECRET`,
   `MP_BILLING_RETURN_URL=https://canchas-web-admin.vercel.app/panel/suscripcion`
   y, al finalizar pruebas, `MP_BILLING_ENABLED=true`.
3. Configurar en la aplicación **Grassly Billing** los eventos
   `subscription_preapproval`, `subscription_authorized_payment` y `payment` para
   `https://wezvongujgnnwuxasdbz.supabase.co/functions/v1/mercadopago-billing-webhook`.
4. Antes de activar cobros reales, ejecutar el guion de pruebas de alta,
   renovación aprobada, rechazo, recuperación, evento duplicado y evento fuera de
   orden. Mantener `MP_BILLING_ENABLED=false` hasta terminarlo.

## Criterios de aceptación

- Un dueño no puede usar ni publicar ninguna sede después de vencer su gracia.
- Una sede extra nunca queda activa si la suscripción base no está vigente.
- Un pago aprobado no activa dos veces el mismo periodo ni duplica cupos.
- El historial muestra el importe y condiciones vigentes al momento de cada factura.
- Un dueño suspendido puede iniciar sesión y resolver su pago, pero no operar el
  negocio.
- Los pagos de reservas siguen fluyendo hacia la cuenta Mercado Pago del dueño y los
  pagos SaaS hacia la cuenta de Grassly, sin compartir tokens.
