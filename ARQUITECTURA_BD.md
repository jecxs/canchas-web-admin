# Guía de arquitectura de datos

## Reservas deportivas · Grassly / Cancha App

**Estado documentado:** migraciones hasta `20260903000200`

**Backend:** Supabase + PostgreSQL 17

**Clientes:** Expo (app público) y Next.js (panel de dueños y superadministración)

**Zona horaria de negocio:** `America/Lima`
**Fuente de verdad canónica:** `C:\canchas-app\app-reservas-canchas\supabase\migrations\`

El contrato tipado de la app vive en `types/supabase.ts`. El cliente de Expo se
crea como `createClient<Database>(...)` en `lib/supabase.ts`; regenerar ese tipo
en UTF-8 es obligatorio cuando cambie el esquema o la firma de un RPC. Ningún
cliente mantiene una segunda copia de las migraciones.

Este documento explica qué decisiones pertenecen a la base de datos, qué debe hacer el código de Expo o Next.js y cuál es el contrato esperado entre ambos. Está escrito para desarrolladores y agentes de IA que necesiten entender la intención del proyecto antes de modificarlo.

---

## 1. Idea central del sistema

La aplicación permite explorar locales deportivos sin cuenta y solicitar reservas cuando el usuario decide jugar.

Un local puede tener varias canchas físicas. Una cancha puede ofrecer uno o más deportes: por ejemplo, la misma cancha de grass puede aparecer para fútbol y voley si tiene una relación en `cancha_deportes` para ambos deportes.

La regla comercial principal es:

> Los clientes reservan bloques completos de una hora, en horas punto. Las excepciones de 30 minutos solo las puede autorizar el dueño y nunca se ofrecen como una opción pública libre.

La base de datos es la autoridad para:

- Disponibilidad real.
- Solapamientos.
- Cancha y deporte compatibles.
- Horarios y zona horaria.
- Precio y adelanto.
- Estados de reserva.
- Permisos de cliente, dueño y superadministrador.
- Expiración de reservas provisionales.

Expo y Next.js son responsables de:

- Navegación y presentación.
- Formularios y mensajes.
- Estado de carga y errores.
- Selección visual de bloques.
- Autenticación de usuario.
- Subida de archivos a Storage.
- Invocar los RPC correctos.

El frontend **no debe recalcular ni decidir por su cuenta** si un horario está libre, cuánto cuesta una reserva o si una reserva puede pasar a confirmada.

---

## 2. Arquitectura general

```text
┌──────────────────────┐
│ App pública Expo     │
│ - explora sin cuenta │
│ - reserva autenticado│
└──────────┬───────────┘
           │ Supabase Auth + Data API + RPC
           ▼
┌────────────────────────────────────────────┐
│ Supabase                                    │
│                                            │
│ PostgreSQL                                  │
│ - tablas y relaciones                        │
│ - RLS                                        │
│ - triggers                                   │
│ - funciones/RPC                             │
│ - pg_cron                                    │
│                                            │
│ Storage                                     │
│ - fotos de locales                           │
│ - comprobantes de pago                       │
└──────────┬─────────────────────────────────┘
           │ Supabase Auth + Data API + RPC
           ▼
┌──────────────────────┐
│ Panel Next.js futuro  │
│ - configuración local │
│ - reservas manuales   │
│ - validación pagos    │
│ - reportes            │
└──────────────────────┘
```

### Regla de seguridad de los clientes

Nunca colocar una `service_role key` en Expo ni en el navegador del panel Next.js. El cliente web/móvil usa la clave pública (`anon`/publishable) y la sesión autenticada. Las operaciones privilegiadas pasan por RLS o por RPCs `SECURITY DEFINER` con autorización explícita.

---

## 3. Migraciones y estado efectivo

Las migraciones son acumulativas. El baseline contiene objetos antiguos que luego son reemplazados o eliminados por migraciones posteriores. Para conocer el estado real hay que aplicar **todas** en orden, no leer únicamente el baseline.

Orden actual:

| Migración | Propósito |
|---|---|
| `20260820000000_baseline_remote_schema.sql` | Snapshot inicial de tablas, enums, funciones, triggers y RLS. |
| `20260820235900_security_and_booking_hardening.sql` | Protege roles, estados de locales, precios, reservas y disponibilidad. |
| `20260821000100_revoke_legacy_client_grants.sql` | Retira permisos heredados peligrosos. |
| `20260821000200_remove_obsolete_reservation_write_policies.sql` | Elimina escrituras directas sobre reservas. |
| `20260821000300_fixed_hour_grid_and_owner_exceptions.sql` | Cambia el negocio a bloques de 60 minutos y agrega extensiones del dueño. |
| `20260821000400_add_pending_validation_reservation_state.sql` | Agrega el estado posterior a la subida del comprobante. |
| `20260821000500_payment_validation_lifecycle_and_cron.sql` | Ventana de pago, ciclo de comprobantes y tareas automáticas. |
| `20260821000600_fix_historic_reservation_link_trigger.sql` | Corrección intermedia del vínculo histórico. Queda supersedida. |
| `20260821000700_remove_automatic_historic_reservation_link.sql` | Elimina el vínculo automático de reservas al completar perfil. |
| `20260821000800_owner_panel_client_search_and_manual_bookings.sql` | RPCs del panel para buscar clientes y crear reservas manuales. |
| `20260821000900_scope_owner_search_to_clients.sql` | Restringe la búsqueda del panel a perfiles con rol `cliente`. |
| `20260821001000_add_missing_local_logo.sql` | Repara instalaciones limpias creando la columna histórica `locales.logo`; es idempotente en remoto. |
| `20260827000100_public_home_locales.sql` | Contrato inicial de los catálogos públicos de Home: valoración, popularidad y cercanía. |
| `20260827000200_favoritos_locales.sql` | Tabla, clave compuesta e RLS de favoritos privados por cliente. |
| `20260831000100_buscar_locales_publicos.sql` | Búsqueda y filtros públicos de Home, incluida disponibilidad por rango horario. |
| `20260901000300_add_owner_approval_state.sql` | Agrega `aprobado_pendiente_pago` al ciclo del local. |
| `20260901000400_phase0_owner_onboarding_security.sql` | Versiona onboarding, RPC administrativas, RLS, Storage, auditoría y transiciones exactas. |
| `20260901000500_harden_trigger_search_paths.sql` | Hace deterministas los triggers heredados llamados desde RPC seguras. |
| `20260901000600_make_local_media_private.sql` | Convierte fotos y logos en privados para que la lectura pase realmente por RLS. |
| `20260901000700_make_local_media_public.sql` | Hace públicos fotos y logos: solo se suben tras aprobar el local y son contenido del catálogo. |
| `20260902000100_ordenar_galeria_locales.sql` | Añade orden estable a la galería, portada derivada y RPC atómica de reordenamiento. |
| `20260902000200_fotos_orden_default.sql` | Mantiene el contrato de inserción simple: el trigger asigna el orden y el default es compatible. |
| `20260902000300_agregar_portada_a_catalogos_publicos.sql` | Versiona los catálogos de Home para devolver una sola portada y agrega búsqueda/tarjetas con ese contrato. |
| `20260902000400_detalle_publico_local.sql` | Crea los RPC públicos de detalle del local, canchas y horarios. |
| `20260902000500_reservas_locales_publico.sql` | Expone la ocupación del calendario público con cancha, deporte y nombre visible del reservador. |
| `20260903000100_add_payment_rejection_enums.sql` | Agrega `rechazada_pago` y los motivos estructurados de rechazo. |
| `20260903000200_reject_pending_payment_validation.sql` | Añade la auditoría de rechazo y la RPC atómica para liberar el horario. |

El historial remoto fue sincronizado hasta `20260903000200`. Los datos de ejemplo
viven en `supabase/seed.sql` y sus recursos en `supabase/seed-assets/`; no forman
parte del historial productivo.

Comandos útiles:

```bash
npx supabase migration list --linked
npx supabase db diff --linked --schema public
npx supabase db lint --linked --schema public
npx supabase db push
```

No se deben editar migraciones ya aplicadas. Cualquier cambio nuevo debe ser otra migración con timestamp posterior.

### 3.1 Estado actual: implementado frente a pendiente

| Área | Ya es responsabilidad de la BD | Pendiente deliberado |
|---|---|---|
| Home público | Ranking, popularidad, cercanía, búsqueda, filtros por deporte/calificación/hora y portada única. | Ajustes de producto o nuevos filtros, no recalcular disponibilidad en el cliente. |
| Favoritos | Tabla, unicidad, RLS por cliente y consumo actual desde Expo. | Historial o recomendaciones basadas en favoritos, si el producto lo requiere. |
| Galería | Orden cero-basado, portada derivada, inserción al final y reordenamiento autorizado. | Panel web con drag-and-drop que invoque la RPC. |
| Detalle de local | RPC de detalle, canchas y horarios; galería visible ordenada por `orden`. | Tablero y flujo completo de reserva en la UI. |
| Pago manual | Reserva provisional, carga privada de comprobante, validación positiva, rechazo con motivo y expiración sin comprobante. | UI de validación/rechazo en el panel y presentación del resultado en el app. |
| Historial de reservas | Estados, RLS de lectura y datos base. | Pantallas de “Mis reservas”, notificaciones y cancelación/reembolso. |

---

## 4. Roles del sistema

El rol se guarda en `perfiles.rol` y pertenece al enum `rol_usuario`:

| Rol | Qué puede hacer |
|---|---|
| `cliente` | Explorar, crear sus reservas mediante RPC, subir comprobantes y ver su historial. |
| `dueno` | Gestionar sus locales, canchas, horarios, precios y mantenimiento; leer reservas propias, crear reservas manuales y confirmar comprobantes mediante RPC. El rechazo/cancelación aún no está implementado. |
| `super_admin` | Moderar locales, gestionar estados administrativos y operar sobre todos los locales. |

Un usuario no puede cambiar su propio rol. El trigger `trg_perfiles_proteger_rol` impide que un cliente se eleve a dueño o superadministrador.

El solicitante conserva el rol `cliente` mientras el local está pendiente. La RPC
administrativa `aprobar_solicitud_local()` lo promueve a `dueno`; ningún frontend
debe hacerlo mediante un `update` directo.

---

## 5. Modelo de tablas

### 5.1 `perfiles`

Extiende `auth.users` con los datos de negocio.

Campos importantes:

| Campo | Uso |
|---|---|
| `id` | Mismo UUID que `auth.users.id`. |
| `rol` | `cliente`, `dueno` o `super_admin`. |
| `nombre_completo` | Nombre mostrado y usado para identificar al cliente. |
| `telefono` | Normalizado a formato peruano `+51XXXXXXXXX`. |
| `dni` | Identidad del cliente; tiene índice único parcial. |
| `email` | Correo recibido o completado por el usuario. |

Privacidad:

- Un usuario puede leer su propio perfil.
- Un superadministrador puede leer perfiles.
- Un dueño no consulta perfiles directamente; usa `buscar_clientes_para_dueno()`.
- La aplicación no debe ampliar la política pública de lectura de perfiles.

Cuando se crea un usuario de Google, `handle_new_user` crea un perfil mínimo. La pantalla de completar perfil actualiza sus datos, pero **no busca ni adopta reservas antiguas**. Esa asociación automática fue retirada deliberadamente en la migración `20260821000700`.

### 5.2 `locales`

Representa el negocio o sede deportiva.

Campos de negocio:

| Campo | Uso |
|---|---|
| `dueno_id` | Perfil dueño del local. |
| `nombre`, `descripcion` | Información pública. |
| `ruc` | Opcional por decisión de negocio. |
| `telefono_contacto_principal` | Contacto del local. |
| `telefono_contacto_secundario` | Contacto público opcional para negocios que atienden con dos números. |
| `direccion`, `latitud`, `longitud` | Ubicación. |
| `estado` | Publicación y operación del local. |
| `porcentaje_adelanto` | Porcentaje requerido para una reserva. |
| `politica_reembolso` | Texto mostrado al cliente. |
| `medios_pago_adelanto` | JSONB con medios aceptados por el local. |
| `granularidad_minutos` | Se conserva por compatibilidad, pero el estado efectivo es 60. |
| `duracion_minima_minutos` | Se conserva por compatibilidad, pero el estado efectivo es 60. |

Estados de local:

```text
pendiente_aprobacion ──► aprobado_pendiente_pago ──► trial / activo
          │                         │
          ├──► trial                └──► rechazado
          └──► rechazado ──► pendiente_aprobacion

trial ──► activo / en_gracia / suspendido
activo ──► en_gracia / suspendido
en_gracia ──► activo / suspendido
suspendido ──► activo / en_gracia / aprobado_pendiente_pago
```

El trigger `trg_locales_proteger_estado` impide que un dueño publique o apruebe su propio local. Las transiciones permitidas se validan con `trg_locales_validar_transicion_estado`.

La app pública solo debe mostrar locales `trial`, `activo` o `en_gracia`.

Aunque RLS decide qué filas son visibles, una lectura directa de una tabla no oculta columnas. El frontend debe seleccionar únicamente los campos públicos necesarios; para una separación más fuerte conviene crear posteriormente una vista o RPC de perfil público que no incluya metadatos administrativos.

### 5.3 `horarios_atencion`

Un registro por día de semana y local.

| Campo | Uso |
|---|---|
| `local_id` | Local al que pertenece. |
| `dia_semana` | PostgreSQL: domingo `0` hasta sábado `6`. |
| `hora_apertura` | Hora punto de apertura. |
| `hora_cierre` | Hora punto de cierre. |

Un día sin registro se interpreta como cerrado. La base exige que el cierre sea posterior a la apertura.

### 5.4 `canchas`

Representa la cancha física reservable.

| Campo | Uso |
|---|---|
| `local_id` | Local propietario. |
| `nombre` | Ejemplo: `Cancha 1`, `Grass Principal`. |
| `superficie` | Información descriptiva. |
| `activa` | Si aparece como cancha operativa. |

Una cancha desactivada no aparece en disponibilidad pública. El trigger `trg_bloquear_desactivacion` evita desactivaciones peligrosas cuando existen reservas que lo impiden.

### 5.5 `deportes`

Catálogo de deportes.

| Campo | Uso |
|---|---|
| `nombre` | Único. |
| `icono` | Referencia visual para Expo/Next.js. |

La tabla es de lectura pública.

### 5.6 `cancha_deportes`

Tabla puente N:M entre cancha y deporte.

| Campo | Uso |
|---|---|
| `cancha_id` | Cancha física. |
| `deporte_id` | Deporte ofrecido. |
| `tipo_soporte` | `dedicada` o `adaptada`. |
| `precio_por_hora` | Precio por bloque de 60 minutos para esa combinación. |

Ejemplo:

```text
Cancha 1 ─ fútbol ─ precio S/ 80
Cancha 1 ─ voley  ─ precio S/ 70 ─ adaptada
```

Una reserva de voley en `Cancha 1` ocupa la cancha física. Por ello, el tablero de fútbol también debe mostrar ese rango como ocupado.

### 5.7 `reservas`

Es la entidad central del sistema.

Campos importantes:

| Campo | Uso |
|---|---|
| `cancha_id` | Cancha física asignada. |
| `cliente_id` | Perfil asociado, si el cliente tiene cuenta. |
| `cliente_sin_cuenta_nombre` | Nombre de un cliente externo. |
| `cliente_sin_cuenta_telefono` | Teléfono externo normalizado. |
| `rango` | `tstzrange` `[inicio, fin)` de la reserva. |
| `deporte_id` | Deporte elegido. |
| `estado` | Estado de negocio. |
| `canal_origen` | `app`, `whatsapp` o `presencial`. |
| `monto_total` | Total calculado. |
| `monto_adelanto_requerido` | Adelanto calculado. |
| `precio_por_hora_aplicado` | Foto histórica del precio usado. |
| `comprobante_url` | Ruta del comprobante en Storage. |
| `pago_expira_en` | Límite de la ventana provisional sin comprobante. |
| `comprobante_subido_at` | Momento en que pasó a validación del dueño. |
| `confirmada_por` | Perfil que validó. |
| `motivo_rechazo_pago` | Motivo estructurado de un comprobante rechazado. |
| `comentario_rechazo_pago` | Explicación opcional del local, visible para el cliente y limitada a 500 caracteres. |
| `rechazada_por`, `rechazada_at` | Actor autorizado y momento exacto del rechazo. |
| `es_excepcion_horaria` | `true` solo para una excepción autorizada por dueño. |

Reglas importantes:

- Debe existir `cliente_id` o teléfono externo.
- El adelanto debe ser mayor que cero y no superar el total.
- El rango no puede estar vacío.
- La cancha debe soportar el deporte.
- No puede solaparse con una reserva que ocupe horario.
- El precio queda congelado en `precio_por_hora_aplicado`; cambiar la tarifa futura no modifica reservas antiguas.

La escritura directa está revocada para clientes y dueños. Se usan RPCs.

### 5.8 `bloqueos_mantenimiento`

Bloquea una cancha durante un rango por mantenimiento, evento o cierre puntual.

Los bloqueos se consideran ocupación en disponibilidad y tablero. Un dueño solo puede gestionarlos para sus propias canchas.

### 5.9 `reserva_extensiones`

Audita extensiones excepcionales de 30 minutos.

| Campo | Uso |
|---|---|
| `reserva_id` | Reserva que origina la extensión. |
| `rango_extension` | Exactamente 30 minutos. |
| `monto_adicional` | Cobro extra. |
| `adelanto_adicional_requerido` | Adelanto extra. |
| `estado_cobro` | `pendiente` o `cobrado`. |
| `medio_cobro` | Yape, efectivo, transferencia, etc. |
| `autorizado_por` | Dueño que permitió la extensión. |

Una extensión no convierte el horario de 30 minutos en una opción pública general. Solo habilita el caso especial de reserva encajada del dueño.

### 5.10 `fotos`

Catálogo de rutas de fotos almacenadas en Supabase Storage.

| Campo | Uso |
|---|---|
| `local_id` | Local propietario. |
| `cancha_id` | Opcional, si la foto corresponde a una cancha. |
| `storage_path` | Ruta dentro del bucket. |
| `oculta` | Oculta la foto del público. |
| `orden` | Posición cero-basada y estable dentro de la galería del local. |
| `subida_por` | Perfil que la subió. |

Reglas de galería:

- `orden` no puede ser negativo y es único por `local_id`.
- `trg_fotos_asignar_orden` inserta cada nueva foto al final; el cliente no elige la posición durante la carga.
- La foto visible (`oculta = false`) con menor `orden` es la **portada**. Si la foto de posición `0` está oculta, la portada es la siguiente visible; no se promociona una foto oculta.
- La RPC `reordenar_fotos_local(p_local_id, p_foto_ids)` recibe la galería completa, incluidas fotos ocultas, exactamente una vez y la reordena de forma atómica. Solo el dueño del local o un superadministrador puede ejecutarla.
- La primera foto no sustituye al logo: el logo continúa siendo identidad opcional del negocio, pero las cards y el banner público usan la portada.

El frontend recibe una ruta, no una imagen binaria desde PostgreSQL. `fotos-locales`
es público para contenido de catálogo aprobado; Expo/Next generan la URL con
`getPublicUrl(storage_path)`. Las pantallas que muestran la galería completa la
leen ordenada por `orden ASC`; las cards y encabezados no descargan la galería,
sino solo `portada_storage_path`.

El panel no debe actualizar `orden` directamente: el permiso de `UPDATE` sobre
esa columna fue retirado a propósito para obligar a usar la RPC.

### 5.11 `resenas`

Reseñas de clientes sobre locales.

Relaciones:

- `local_id` → `locales`.
- `cliente_id` → `perfiles`.
- `reserva_id` → `reservas`, único por reseña.

La base valida calificación de 1 a 5 y comentario de máximo 500 caracteres. `trg_moderar_resena_automaticamente` puede aprobar o dejar pendiente según palabras configuradas.

Pendiente de una futura RPC: asegurar que solo se reseñen reservas completadas, pertenecientes al cliente y al local indicado.

### 5.12 `favoritos_locales`

Guarda los locales marcados por un cliente.

| Campo | Uso |
|---|---|
| `perfil_id` | Cliente propietario del favorito. |
| `local_id` | Local guardado. |
| `created_at` | Momento en que el cliente lo guardó. |

La clave primaria compuesta impide favoritos duplicados. RLS permite leer, crear y
eliminar solamente favoritos del perfil autenticado con rol `cliente`. Tampoco se
puede guardar un local no publicado.

### 5.13 `reportes`

Reportes enviados por usuarios sobre entidades. Los usuarios crean reportes propios; superadministradores los moderan.

### 5.14 `push_tokens`

Tokens de notificaciones asociados a un perfil. Un usuario puede tener varios tokens por dispositivo.

### 5.15 `parametros_globales`

Configuración editable sin despliegue.

Ejemplos:

```text
porcentaje_adelanto_minimo
minutos_expiracion_pendiente_pago = 10
duracion_trial
periodo_gracia
cupo_base_locales
```

Los valores son JSONB. Las funciones deben validar tipo y rango antes de utilizarlos.

### 5.16 `suscripciones` y `pagos_suscripcion`

Preparan la suscripción de dueños y la integración futura con Mercado Pago.

- `suscripciones`: una suscripción por dueño, plan y sedes adicionales.
- `pagos_suscripcion`: pagos recibidos y su estado.

El trigger calcula el monto de suscripción. La sincronización real con Mercado Pago debe ocurrir desde una Edge Function o backend seguro, no desde Expo ni desde el navegador.

Transiciones permitidas:

```text
sin_metodo_pago ──► activa / cancelada
activa ──► pago_fallido / cancelada
pago_fallido ──► activa / cancelada
cancelada ──► sin_metodo_pago
```

El dueño solo puede leer su suscripción. Las escrituras requieren `service_role` o
un flujo de backend controlado.

### 5.17 `auditoria_administrativa`

Registro inmutable de acciones privilegiadas. Guarda actor, rol, acción, entidad,
local, estado anterior, estado nuevo, metadatos y fecha. Solo un `super_admin`
puede consultarlo desde un cliente autenticado; los navegadores no pueden insertar,
actualizar ni eliminar filas.

---

## 6. Relaciones principales

```text
auth.users
   │ 1:1
   ▼
perfiles ───────────────┐
   │                    │
   │ 1:N                │ 1:N
   ▼                    ▼
locales              reservas.cliente_id
   │
   ├── 1:N horarios_atencion
   ├── 1:N canchas
   ├── 1:N fotos
   └── 1:N reseñas
          │
          ▼
       canchas
          │
          ├── N:M cancha_deportes ── deportes
          ├── 1:N reservas
          └── 1:N bloqueos_mantenimiento

reservas ── 1:N reserva_extensiones
reservas ── 1:1 resenas
perfiles ── 1:1 suscripciones ── 1:N pagos_suscripcion
```

La relación de deporte con cancha es N:M. La ocupación siempre se evalúa sobre `cancha_id`, no solo sobre `deporte_id`.

---

## 7. Estados de reserva y ciclo de pago

### Estados disponibles

```text
pendiente_pago
pendiente_validacion
rechazada_pago
confirmada
completada
no_show
cancelada_cliente
cancelada_local
expirada
```

### Flujo público de reserva

```text
Cliente selecciona bloques
          │
          ▼
crear_reserva_en_local()
          │
          ▼
pendiente_pago
          │  ventana corta, por defecto 10 min
          │
          ├── sin comprobante ──► expirada
          │
          └── comprobante ─────► pendiente_validacion
                                      │
                                      ├── dueño valida ───► confirmada
                                      │                       │
                                      │                       ▼
                                      │                   completada
                                      │
                                      └── dueño rechaza ──► rechazada_pago
                                                              libera horario
```

Reglas:

- `pendiente_pago` ocupa la cancha solo mientras `pago_expira_en > now()`.
- `pendiente_validacion` ocupa la cancha hasta que el dueño confirme o rechace el pago.
- `rechazada_pago` es terminal para ese intento y libera el horario inmediatamente.
- Una reserva con comprobante no puede permanecer en `pendiente_pago`.
- Rechazar conserva `comprobante_url` y `comprobante_subido_at` como evidencia privada.
- El motivo estructurado, el actor y la fecha son obligatorios; el comentario es opcional y admite hasta 500 caracteres.
- El cron expira las reservas sin comprobante.
- El cron completa reservas confirmadas cuyo fin ya pasó.
- `cancelada_local` no sustituye a `rechazada_pago`: la primera corresponde a una reserva ya aceptada; la segunda indica que el pago nunca fue validado.

### Canales

| Canal | Quién lo crea | Reglas |
|---|---|---|
| `app` | Cliente | Solo bloques de una hora, hora punto, sin excepciones. |
| `whatsapp` | Dueño | Reserva manual externa o encajada. |
| `presencial` | Dueño | Reserva manual externa o encajada. |

---

## 8. RPCs: contrato entre frontend y base

### 8.1 Disponibilidad pública

#### Catálogo de Home

Las secciones del Home son lecturas públicas y no exponen propietario, teléfonos,
medios de pago, información administrativa ni detalle de reservas. Todas devuelven
solamente el identificador y campos de tarjeta del local.

| RPC | Métrica y orden |
|---|---|
| `obtener_top_locales()` | Promedio de reseñas aprobadas, mínimo 3 reseñas; desempata por cantidad de reseñas. Devuelve `portada_storage_path`. |
| `obtener_locales_populares(p_dias = 30, p_limite = 10)` | Reservas creadas en la ventana solicitada en estados `pendiente_validacion`, `confirmada`, `completada` y `no_show`. Excluye pendientes de comprobante, canceladas y expiradas. Devuelve `portada_storage_path`. |
| `obtener_locales_cercanos(p_latitud, p_longitud, p_limite = 10)` | Distancia Haversine en metros desde una ubicación puntual; no guarda la ubicación del cliente y devuelve `portada_storage_path`. |
| `buscar_locales_publicos(...)` | Búsqueda por nombre y filtros de deporte, fecha, rango horario, calificación, ubicación y orden. Cuando recibe horas, solo devuelve locales con una cancha compatible libre durante todo el rango. |
| `obtener_tarjetas_locales(p_local_ids)` | Datos de card para IDs públicos, conserva el orden solicitado; se usa para favoritas sin consultar una foto por cada card. |

Todos los RPC de catálogo muestran exclusivamente locales con estado `trial`,
`activo` o `en_gracia`. El Home debe ocultar la sección de populares o mostrar un estado vacío
honesto cuando la función no devuelve filas; no debe inventar popularidad.

Todos los RPC de card retornan únicamente datos públicos: `id`, nombre,
dirección, logo opcional, `portada_storage_path`, promedio, total de reseñas y,
cuando aplica, distancia o total de reservas. No devuelven propietario, medios
de pago, teléfonos ni filas de reservas. La ubicación del dispositivo se usa
solo como argumento de la consulta de cercanía/filtros; no se persiste.

#### Detalle público de local

| RPC | Contrato actual |
|---|---|
| `obtener_detalle_publico_local(p_local_id)` | Información pública del local: descripción, coordenadas, ambos teléfonos de contacto, logo opcional, portada, promedio y total de reseñas. |
| `obtener_canchas_local(p_local_id)` | Canchas activas, deportes habilitados, tipo de soporte y precio por hora. |
| `obtener_horarios_local(p_local_id)` | Horarios de atención por día en formato `HH24:MI`. |

Para la galería completa, la app consulta `fotos` visibles del local ordenadas por
`orden ASC`. El banner superior del detalle usa el mismo
`portada_storage_path` del RPC de detalle; no debe descargar toda la galería
solo para mostrar una imagen.

`obtener_detalle_publico_local()` sí exige que el local sea público y operativo.
Por decisión actual, `obtener_canchas_local()` y `obtener_horarios_local()` no
repiten esa condición; la UI debe invocarlos como complemento de un detalle
público que ya fue encontrado. No exponen pagos, dueño ni datos personales.

#### `fn_bloques_disponibles_local(p_local_id, p_fecha, p_deporte_id, p_bloques)`

Devuelve bloques completos de una hora y cuántas canchas compatibles están libres.

Usar en la pantalla de reserva. No leer todas las reservas desde Expo para calcular disponibilidad.

```ts
const { data, error } = await supabase.rpc(
  "fn_bloques_disponibles_local",
  {
    p_local_id: localId,
    p_fecha: "2026-08-25",
    p_deporte_id: deporteId,
    p_bloques: 1,
  }
);
```

#### `fn_ocupacion_tablero_local(p_local_id, p_fecha, p_deporte_id)`

Devuelve rangos ocupados sin datos personales:

```text
cancha_id
cancha_nombre
inicio
fin
tipo                 // reserva | mantenimiento
es_excepcion_horaria
```

El frontend pinta la celda completa o media celda según el rango. La base entrega ocupación; Expo/Next decide colores, etiquetas y animaciones.

### 8.2 Cliente autenticado

#### `crear_reserva_en_local(p_local_id, p_deporte_id, p_inicio, p_bloques, p_notas)`

Es el único camino público para crear una reserva desde la app.

La función:

1. Comprueba sesión.
2. Exige hora futura y hora punto.
3. Convierte usando `America/Lima`.
4. Verifica local, horario, deporte, cancha, precio y mantenimiento.
5. Elige una cancha física compatible.
6. Calcula total y adelanto.
7. Inserta en `pendiente_pago`.
8. Aplica el bloqueo de concurrencia.

El cliente no envía `monto_total`, `monto_adelanto_requerido`, `cancha_id` ni `estado` como autoridad de negocio.

#### `registrar_comprobante_reserva(p_reserva_id, p_storage_path)`

Se llama después de subir el archivo a Storage. Verifica que:

- La reserva pertenezca al usuario.
- La ruta comience con el UUID de la reserva.
- El objeto exista en el bucket esperado.
- La reserva siga dentro de la ventana provisional.

Después cambia a `pendiente_validacion`.

#### `confirmar_reserva(p_reserva_id)`

Solo puede ejecutarlo el dueño del local o un superadministrador. Confirma una reserva con comprobante y guarda `confirmada_por`.

#### `rechazar_reserva_pendiente_validacion(p_reserva_id, p_motivo, p_comentario)`

Solo puede ejecutarlo el dueño del local o un superadministrador y únicamente
sobre una reserva en `pendiente_validacion`. Los motivos admitidos son
`pago_no_recibido`, `monto_incorrecto`, `comprobante_ilegible`,
`datos_no_coinciden` y `otro`. En una sola transacción cambia el estado a
`rechazada_pago`, registra motivo, comentario opcional, actor y fecha, conserva
la ruta privada del comprobante y libera el rango para nuevas reservas.

### 8.3 Panel de dueños

#### `buscar_clientes_para_dueno(p_busqueda, p_limite)`

Busca perfiles cliente para asociar una reserva externa.

```ts
const { data, error } = await supabase.rpc(
  "buscar_clientes_para_dueno",
  {
    p_busqueda: "61514826",
    p_limite: 20,
  }
);
```

#### `crear_reserva_manual_dueno(...)`

Crea una reserva normal de bloques fijos desde WhatsApp o presencial.

Ejemplo asociando una cuenta existente:

```ts
const { data, error } = await supabase.rpc(
  "crear_reserva_manual_dueno",
  {
    p_local_id: localId,
    p_deporte_id: deporteId,
    p_inicio: "2026-08-25T19:00:00-05:00",
    p_bloques: 2,
    p_cancha_id: canchaId,       // opcional
    p_cliente_id: perfilId,      // cuenta ya existente
    p_estado: "confirmada",
    p_canal: "whatsapp",
    p_notas: "Reserva coordinada por llamada",
  }
);
```

Ejemplo para un cliente sin cuenta:

```ts
{
  p_local_id: localId,
  p_deporte_id: deporteId,
  p_inicio: "2026-08-25T12:00:00-05:00",
  p_bloques: 1,
  p_cliente_nombre: "Luis Quispe",
  p_cliente_telefono: "987654321",
  p_estado: "confirmada",
  p_canal: "presencial"
}
```

Comportamiento:

- `p_cliente_id` tiene prioridad como identificación.
- Si no hay `p_cliente_id`, son obligatorios nombre y teléfono.
- El teléfono se normaliza con `fn_normalizar_telefono`.
- El estado por defecto es `confirmada`, porque el dueño registra una reserva externa ya aceptada.
- Se puede usar `pendiente_pago`, pero heredará la ventana provisional de 10 minutos.
- El dueño puede indicar una cancha concreta o dejar que la base elija una disponible.
- No permite crear huecos arbitrarios de 30 o 45 minutos.

#### `extender_reserva_30_min(...)`

Registra una extensión autorizada por el dueño, con monto y medio de cobro. No es una reserva pública.

#### `crear_reserva_manual_encajada(...)`

Permite el caso especial de 90 minutos que empieza a los 30 minutos de una hora y termina en hora punto, siempre que exista una extensión autorizada y la siguiente hora esté libre.

#### `reordenar_fotos_local(p_local_id, p_foto_ids)`

Es el único camino para cambiar la secuencia de la galería desde el panel. El
drag-and-drop del panel debe enviar el arreglo completo de IDs en el orden final,
incluidas fotos ocultas. La base verifica propiedad, pertenencia, duplicados y
cantidad antes de asignar las posiciones `0..n-1` en una sola transacción.

Agregar una foto no necesita esta RPC: la carga normal la coloca al final. Si el
dueño quiere que una foto nueva sea portada, la sube y luego llama la RPC con esa
foto en la primera posición visible.

### 8.4 Funciones de sistema

| Función | Uso |
|---|---|
| `fn_expirar_reservas_pendientes()` | Marca como `expirada` la reserva sin comprobante cuyo plazo terminó. |
| `fn_completar_reservas_finalizadas()` | Marca como `completada` la reserva confirmada cuyo fin pasó. |
| `fn_finalizar_trials_vencidos()` | Pasa locales trial vencidos a `activo` o `en_gracia`. |
| `fn_reserva_ocupa_horario(estado, pago_expira_en)` | Define una única regla de ocupación. |
| `fn_rol_actual()` | Obtiene el rol de la sesión actual de forma segura. |
| `fn_normalizar_telefono(text)` | Convierte teléfonos peruanos al formato canónico. |
| `fn_asignar_orden_foto()` | Asigna el siguiente orden libre de forma serializada al insertar una foto. |

Las funciones de sistema no son endpoints públicos. Las tareas automáticas tienen permisos de `service_role`.

---

## 9. Triggers y automatismos

### Perfiles

| Trigger | Responsabilidad |
|---|---|
| `trg_perfiles_updated_at` | Actualiza `updated_at`. |
| `trg_normalizar_telefono_perfiles` | Normaliza teléfono antes de insertar/actualizar. |
| `trg_perfiles_proteger_rol` | Impide autoelevar el rol. |

`trg_vincular_reservas_historicas` ya no existe en el estado final.

### Usuarios de Auth

El trigger de Auth configurado en Supabase ejecuta `handle_new_user()` y crea el perfil mínimo correspondiente. Si la creación del perfil falla, la función evita bloquear el alta de Auth y deja el caso para recuperación controlada.

### Locales

| Trigger | Responsabilidad |
|---|---|
| `trg_locales_updated_at` | Actualiza fecha de modificación. |
| `trg_validar_adelanto` | Verifica el porcentaje mínimo global. |
| `trg_locales_proteger_estado` | Evita que un dueño cambie el estado administrativo. |
| `trg_locales_validar_transicion_estado` | Impide saltos de estado no permitidos. |

### Canchas y mantenimiento

| Trigger | Responsabilidad |
|---|---|
| `trg_bloquear_desactivacion` | Protege desactivaciones incompatibles con reservas. |
| `trg_validar_bloqueo_sin_reservas` | Evita crear mantenimiento sobre reservas ocupadas. |

### Reservas

| Trigger | Responsabilidad |
|---|---|
| `trg_reservas_updated_at` | Actualiza `updated_at`. |
| `trg_normalizar_telefono_reservas` | Normaliza teléfono externo. |
| `trg_validar_reserva_integridad` | Comprueba deporte/cancha, mantenimiento y reglas de canal. |
| `trg_reservas_preparar_ciclo_pago` | Calcula expiración provisional y transiciones del comprobante. |

### Galería

| Trigger / restricción | Responsabilidad |
|---|---|
| `trg_fotos_asignar_orden` | Asigna la siguiente posición al insertar una foto. |
| `fotos_local_id_orden_key` | Impide dos fotos en la misma posición del mismo local. |
| `fotos_orden_no_negativo` | Impide posiciones negativas. |
| `idx_fotos_local_visibles_orden` | Acelera portada y galería pública visible por orden. |

Además, `reservas_cancha_id_rango_excl` es una exclusión GiST que impide solapamientos en la misma cancha física.

### Reseñas y suscripciones

| Trigger | Responsabilidad |
|---|---|
| `trg_moderar_resena_automaticamente` | Modera automáticamente según reglas configuradas. |
| `trg_calcular_monto_suscripcion` | Calcula el monto de suscripción. |
| `trg_suscripciones_updated_at` | Actualiza `updated_at`. |

---

## 10. RLS y permisos

### Lectura pública

La app pública puede leer información operacional de:

- Locales publicados.
- Canchas activas.
- Horarios de locales operativos.
- Deportes.
- Relaciones cancha/deporte de canchas operativas.
- Fotos visibles y logos de locales operativos, publicados desde buckets de catálogo.
- Disponibilidad mediante RPC.
- Ocupación de tablero mediante RPC sin datos personales.

### Lectura privada

- `perfiles`: propio o superadministrador.
- `reservas`: cliente propio o dueño del local.
- `favoritos_locales`: solamente el perfil cliente propietario.
- `pagos_suscripcion`: dueño correspondiente o superadministrador.
- `reportes`: autor o superadministrador.

### Escrituras sensibles

Las escrituras de reservas no se realizan directamente aunque el usuario tenga sesión. Se revocaron los grants y las políticas antiguas.

El dueño sí puede gestionar mediante RLS sus locales, canchas, horarios, precios, fotos y bloqueos de mantenimiento, pero las operaciones de alto riesgo deben preferir RPCs transaccionales.

En particular, el dueño no puede modificar directamente `fotos.orden`; debe usar
`reordenar_fotos_local()`. Esto evita que una actualización parcial deje dos
portadas, posiciones duplicadas o una galería de otro local alterada.

---

## 11. Extensiones y configuración PostgreSQL

Extensiones presentes en el baseline:

| Extensión | Uso |
|---|---|
| `pg_cron` | Expiración, completado de reservas y trials. |
| `btree_gist` | Exclusión GiST de rangos por cancha. |
| `pgcrypto` | UUIDs y funciones criptográficas de PostgreSQL. |
| `uuid-ossp` | Compatibilidad con UUIDs. |
| `pg_stat_statements` | Estadísticas de consultas. |
| `supabase_vault` | Secretos de Supabase. |

PostgreSQL opera en UTC. Las funciones de negocio convierten explícitamente horarios a `America/Lima`. El frontend debe enviar timestamps con zona o ISO completo y no asumir que el servidor está en hora peruana.

### pg_cron

Trabajos actuales:

| Job | Frecuencia | Responsabilidad |
|---|---|---|
| `expirar-reservas-sin-comprobante-v1` | Cada minuto | Expira reservas provisionales sin comprobante. |
| `completar-reservas-finalizadas-v1` | Cada 10 minutos | Completa reservas confirmadas terminadas. |
| `finalizar-trials-vencidos-v1` | 05:10 UTC | Procesa trials vencidos; equivale a 00:10 en Lima. |

El frontend no debe depender de que cron haya actualizado inmediatamente el estado visible: la disponibilidad también evalúa el vencimiento en tiempo real.

---

## 12. Storage

Los buckets y sus límites están declarados en migraciones:

| Bucket | Visibilidad | Límite | MIME |
|---|---|---:|---|
| `comprobantes-pago` | Privado | 10 MB | JPEG, PNG, WebP, PDF |
| `fotos-locales` | Público | 10 MB | JPEG, PNG, WebP, AVIF |
| `logos-locales` | Público | 5 MB | JPEG, PNG, WebP, AVIF |

La función de comprobantes comprueba que el objeto exista y que la ruta empiece con el UUID de la reserva.

Responsabilidad del frontend:

1. Obtener la sesión.
2. Crear la ruta segura de la reserva.
3. Subir el archivo al bucket.
4. Invocar `registrar_comprobante_reserva()`.
5. Mostrar que quedó pendiente de validación.

Las políticas impiden leer comprobantes ajenos y exigen rutas encabezadas por la
reserva. Las fotos y logos usan rutas encabezadas por el UUID del local. Los
archivos del catálogo son públicos porque el dueño solo puede subirlos después de
que su local fue aprobado; las políticas RLS siguen protegiendo la subida,
actualización y eliminación. Los clientes pueden usar `getPublicUrl()` a partir de
la ruta almacenada y no deben persistir una segunda copia de la URL completa. La
portada no se guarda como otra imagen: se deriva de la foto visible con menor
`orden`.

---

## 13. Qué corresponde a cada aplicación

| Responsabilidad | PostgreSQL/Supabase | Expo | Next.js dueño |
|---|:---:|:---:|:---:|
| Login Google y sesión | Auth | Consumir sesión | Consumir sesión |
| Permitir explorar sin cuenta | RLS/lecturas públicas | Navegación | Puede reutilizar contrato |
| Mostrar locales | Datos y permisos | UI/listas/filtros | UI administrativa |
| Convertir `storage_path` a URL pública | Storage público | `getPublicUrl()` | `getPublicUrl()` |
| Ordenar galería | Restricciones + RPC | Mostrar orden público | Drag-and-drop e invocar RPC |
| Calcular disponibilidad | RPC | Renderizar | Renderizar |
| Elegir cancha compatible | RPC | Mostrar resultado | Mostrar/permitir elegir cancha |
| Calcular precio | RPC | Mostrar total devuelto | Mostrar total devuelto |
| Crear reserva pública | RPC | Invocar | No aplica o supervisión |
| Crear reserva externa | RPC | No aplica | Invocar RPC manual |
| Confirmar comprobante | RPC | Mostrar estado | Invocar desde panel |
| Rechazar comprobante | Estado, auditoría y RPC atómica | Mostrar estado/motivo | Invocar RPC desde la UI de validación |
| Pintar media celda | Devuelve rango | Colores/layout | Colores/layout |
| Validar solapamiento | Restricción + trigger | No decidir | No decidir |
| Expirar/completar reservas | Trigger + cron | Refrescar | Refrescar |
| Solicitar local | RPC transaccional | No aplica | `registrar_solicitud_propietario()` |
| Aprobar/rechazar/trial | RPC administrativa | No aplica | Panel superadministrador |
| Cambiar rol | RPC administrativa | No | No hacer UPDATE directo |
| Subir comprobante | Storage + políticas | Selector/subida | Visualización segura |

---

## 14. Reglas que ningún frontend debe romper

1. No crear reservas con `insert` directo a `reservas`.
2. No aceptar una reserva pública que empiece a `19:30`.
3. No ofrecer 30 o 45 minutos como duración pública.
4. No calcular el precio final en JavaScript como fuente de verdad.
5. No asumir que una cancha de fútbol y una de voley son físicamente distintas.
6. No leer reservas ajenas para calcular disponibilidad.
7. No mostrar datos personales dentro del tablero público.
8. No cambiar estados administrativos desde el frontend mediante `update` libre.
9. No dejar que un cliente modifique `rol`, `confirmada_por`, montos o cancha.
10. No asociar automáticamente reservas antiguas al completar el perfil.
11. No usar `service_role` en Expo ni en código ejecutado en el navegador.
12. No usar hora local del dispositivo como autoridad: la base trabaja con Lima.
13. No actualizar `fotos.orden` desde la tabla ni asumir que el logo es la portada.
14. No marcar una captura como válida desde Expo: solo el dueño autorizado puede confirmar el pago.

---

## 15. Errores esperables y cómo mostrarlos

Los RPCs lanzan errores de negocio en texto claro. La interfaz debe traducirlos a mensajes accionables, no mostrar todo el stack técnico.

| Error conceptual | Mensaje recomendado |
|---|---|
| Precio no configurado | `Este local todavía no configuró el precio para ese deporte.` |
| Adelanto no configurado | `El local aún no configuró su porcentaje de adelanto.` |
| Bloque ocupado | `Ese horario acaba de ser reservado. Elige otro bloque.` |
| Fuera de horario | `El bloque está fuera del horario de atención.` |
| Comprobante vencido | `El tiempo para subir el comprobante terminó.` |
| Comprobante aún en revisión | `Tu pago está pendiente de validación por el local.` |
| Pago rechazado | `No pudimos validar tu pago: {motivo}.` Mostrar el comentario opcional y una opción para contactar al local. |
| Sin permiso de dueño | `No tienes permisos para gestionar este local.` |
| Teléfono inválido | `Ingresa un teléfono peruano válido de 9 dígitos.` |
| Cliente no encontrado | `No se encontró una cuenta cliente con esos datos.` |

La app puede reconsultar disponibilidad después de un error de concurrencia.

---

## 16. Flujos de ejemplo

### 16.1 Cliente reserva desde Expo

```text
1. Usuario explora locales sin sesión.
2. Expo consulta locales, canchas, horarios y deportes públicos.
3. Expo llama fn_bloques_disponibles_local().
4. Usuario selecciona uno o varios bloques.
5. Si no hay sesión, Expo abre Google Auth.
6. Expo llama crear_reserva_en_local().
7. La base devuelve cancha, total, adelanto y reserva_id.
8. Expo sube comprobante a Storage.
9. Expo llama registrar_comprobante_reserva().
10. La reserva queda pendiente_validacion.
11. El panel del dueño valida el pago.
12. El cliente ve confirmada y luego completada.
```

En el paso 11 el dueño puede confirmar o invocar
`rechazar_reserva_pendiente_validacion()`. Expo y Next.js deben reconsultar la
reserva después de la acción; nunca deben simular el cambio con un `update`
directo.

### 16.2 Dueño registra una reserva de WhatsApp

```text
1. Next.js verifica sesión y local del dueño.
2. Busca al cliente con buscar_clientes_para_dueno().
3. Si existe, obtiene perfil_id.
4. Si no existe, conserva nombre y teléfono externo.
5. Next.js llama crear_reserva_manual_dueno().
6. La base valida cancha, horario, deporte, precio y solapamiento.
7. La reserva queda confirmada o pendiente_pago según el estado elegido.
8. El cliente verá la reserva vinculada cuando entre con su cuenta.
```

Este es el vínculo inverso permitido en la versión 1: el dueño asocia la reserva a una cuenta existente. Completar el perfil del cliente no adopta reservas antiguas automáticamente.

---

## 17. Checklist para desarrollar una nueva funcionalidad

Antes de escribir código:

- ¿La regla es una invariancia de datos? Entonces debe validarse en PostgreSQL.
- ¿La operación involucra dinero, estado o disponibilidad? Preferir RPC transaccional.
- ¿La lectura contiene datos personales? Revisar RLS y si debe ser RPC privado.
- ¿La operación es solo visual? Mantenerla en Expo/Next.
- ¿El cambio modifica schema? Crear una migración nueva.
- ¿El cambio depende de Storage o Auth? Documentar también la configuración externa.

Después de escribir una migración:

```bash
npx supabase db lint --linked --schema public
npx supabase db push
npx supabase migration list --linked
npx supabase db diff --linked --schema public
```

Actualizar este documento cuando cambien:

- Tablas o relaciones.
- Estados.
- RPCs.
- Triggers.
- Permisos RLS.
- Jobs de cron.
- Buckets o políticas de Storage.

### 17.1 Contrato de configuración operativa del panel

La configuración posterior a la aprobación se realiza mediante RPCs autenticadas:

- `actualizar_datos_generales_local()`: identidad comercial, teléfonos, dirección y coordenadas.
- `actualizar_reglas_comerciales_local()`: porcentaje de adelanto, medios de pago y política de reembolso.
- `reemplazar_horarios_local()`: reemplaza atómicamente el horario semanal y exige horas punto.
- `guardar_cancha_local()`: crea o edita el espacio físico junto con deportes, tipo de soporte y tarifa.
- `cambiar_estado_cancha_local()`: impide desactivar una cancha con reservas futuras vigentes.
- `actualizar_logo_local()`, `registrar_foto_local()` y `eliminar_foto_local()`: validan propiedad, bucket y ruta antes de asociar archivos públicos.

Los `INSERT`, `UPDATE` y `DELETE` directos sobre horarios, canchas y sus deportes
se retiraron del rol `authenticated`. Las políticas públicas de estas tablas exigen
ahora que el local esté operativo **y** publicado. El propietario y el
superadministrador conservan lectura privada para poder configurar y supervisar.

Los buckets `logos-locales` y `fotos-locales` siguen siendo públicos por decisión
de producto. La escritura permanece limitada por carpeta de local mediante las
políticas de Storage; subir un objeto no lo incorpora al catálogo hasta que la RPC
correspondiente registra su ruta en la base.

---

## 18. Pendientes conocidos

La base está lista para continuar con el app público y la operación del panel,
incluida la configuración de locales, horarios, medios y canchas. Quedan temas
deliberadamente fuera de esta fase:

1. Crear UI de rechazo de comprobante en el panel y estado/motivo en Expo.
2. Crear flujo de cancelación y reembolso, separado del rechazo de pago.
3. Crear RPC de reseñas que exija una reserva completada válida.
4. Crear integración segura con Mercado Pago para suscripciones.

Estos pendientes no deben resolverse ampliando permisos directos en las tablas. La dirección recomendada sigue siendo: RLS para el aislamiento básico y RPCs transaccionales para reglas de negocio.
