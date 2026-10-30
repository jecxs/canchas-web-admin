export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      auditoria_administrativa: {
        Row: {
          accion: string
          actor_id: string | null
          actor_rol: Database["public"]["Enums"]["rol_usuario"] | null
          created_at: string
          entidad_id: string | null
          entidad_tipo: string
          estado_anterior: Json | null
          estado_nuevo: Json | null
          id: string
          local_id: string | null
          metadata: Json
        }
        Insert: {
          accion: string
          actor_id?: string | null
          actor_rol?: Database["public"]["Enums"]["rol_usuario"] | null
          created_at?: string
          entidad_id?: string | null
          entidad_tipo: string
          estado_anterior?: Json | null
          estado_nuevo?: Json | null
          id?: string
          local_id?: string | null
          metadata?: Json
        }
        Update: {
          accion?: string
          actor_id?: string | null
          actor_rol?: Database["public"]["Enums"]["rol_usuario"] | null
          created_at?: string
          entidad_id?: string | null
          entidad_tipo?: string
          estado_anterior?: Json | null
          estado_nuevo?: Json | null
          id?: string
          local_id?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_administrativa_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_administrativa_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficios_catalogo: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          icon_key: string
          id: string
          nombre: string
          orden: number
          slug: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          created_at?: string
          icon_key: string
          id?: string
          nombre: string
          orden: number
          slug: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          icon_key?: string
          id?: string
          nombre?: string
          orden?: number
          slug?: string
        }
        Relationships: []
      }
      billing_preapprovals_archivo: {
        Row: {
          archivado_at: string
          motivo: string
          preapproval_id: string
          suscripcion_id: string
        }
        Insert: {
          archivado_at?: string
          motivo: string
          preapproval_id: string
          suscripcion_id: string
        }
        Update: {
          archivado_at?: string
          motivo?: string
          preapproval_id?: string
          suscripcion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_preapprovals_archivo_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_trials_empresa: {
        Row: {
          dueno_id: string
          otorgado_at: string
          primer_local_id: string
          termina_at: string
        }
        Insert: {
          dueno_id: string
          otorgado_at?: string
          primer_local_id: string
          termina_at: string
        }
        Update: {
          dueno_id?: string
          otorgado_at?: string
          primer_local_id?: string
          termina_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_trials_empresa_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_trials_empresa_primer_local_id_fkey"
            columns: ["primer_local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueos_mantenimiento: {
        Row: {
          cancha_id: string
          created_at: string
          id: string
          motivo: string | null
          rango: unknown
        }
        Insert: {
          cancha_id: string
          created_at?: string
          id?: string
          motivo?: string | null
          rango: unknown
        }
        Update: {
          cancha_id?: string
          created_at?: string
          id?: string
          motivo?: string | null
          rango?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_mantenimiento_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
        ]
      }
      cambios_sedes_suscripcion: {
        Row: {
          created_at: string
          detalle_error: string | null
          efectivo_desde: string
          estado: string
          id: string
          idempotency_key: string
          monto_actual: number
          monto_objetivo: number
          sedes_extra_actuales: number
          sedes_extra_objetivo: number
          suscripcion_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detalle_error?: string | null
          efectivo_desde: string
          estado?: string
          id?: string
          idempotency_key: string
          monto_actual: number
          monto_objetivo: number
          sedes_extra_actuales: number
          sedes_extra_objetivo: number
          suscripcion_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detalle_error?: string | null
          efectivo_desde?: string
          estado?: string
          id?: string
          idempotency_key?: string
          monto_actual?: number
          monto_objetivo?: number
          sedes_extra_actuales?: number
          sedes_extra_objetivo?: number
          suscripcion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cambios_sedes_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cancha_deportes: {
        Row: {
          cancha_id: string
          deporte_id: string
          precio_por_hora: number | null
          tipo_soporte: Database["public"]["Enums"]["tipo_soporte_deporte"]
        }
        Insert: {
          cancha_id: string
          deporte_id: string
          precio_por_hora?: number | null
          tipo_soporte?: Database["public"]["Enums"]["tipo_soporte_deporte"]
        }
        Update: {
          cancha_id?: string
          deporte_id?: string
          precio_por_hora?: number | null
          tipo_soporte?: Database["public"]["Enums"]["tipo_soporte_deporte"]
        }
        Relationships: [
          {
            foreignKeyName: "cancha_deportes_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancha_deportes_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
        ]
      }
      canchas: {
        Row: {
          activa: boolean
          ancho_metros: number | null
          created_at: string
          descripcion: string | null
          id: string
          largo_metros: number | null
          local_id: string
          nombre: string
          superficie: string | null
        }
        Insert: {
          activa?: boolean
          ancho_metros?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          largo_metros?: number | null
          local_id: string
          nombre: string
          superficie?: string | null
        }
        Update: {
          activa?: boolean
          ancho_metros?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          largo_metros?: number | null
          local_id?: string
          nombre?: string
          superficie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canchas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      deportes: {
        Row: {
          icono: string | null
          id: string
          nombre: string
        }
        Insert: {
          icono?: string | null
          id?: string
          nombre: string
        }
        Update: {
          icono?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      entitlements_suscripcion: {
        Row: {
          dueno_id: string
          max_sedes: number
          panel_habilitado: boolean
          reservas_habilitadas: boolean
          suscripcion_id: string | null
          updated_at: string
          vigente_hasta: string | null
          visibilidad_app_habilitada: boolean
        }
        Insert: {
          dueno_id: string
          max_sedes?: number
          panel_habilitado?: boolean
          reservas_habilitadas?: boolean
          suscripcion_id?: string | null
          updated_at?: string
          vigente_hasta?: string | null
          visibilidad_app_habilitada?: boolean
        }
        Update: {
          dueno_id?: string
          max_sedes?: number
          panel_habilitado?: boolean
          reservas_habilitadas?: boolean
          suscripcion_id?: string | null
          updated_at?: string
          vigente_hasta?: string | null
          visibilidad_app_habilitada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_suscripcion_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_intento_pago_reserva: {
        Row: {
          evento_externo_id: string | null
          fuente: string
          id: string
          intento_id: string
          ocurrido_en: string | null
          payload: Json
          recibido_at: string
          tipo_evento: string
        }
        Insert: {
          evento_externo_id?: string | null
          fuente: string
          id?: string
          intento_id: string
          ocurrido_en?: string | null
          payload?: Json
          recibido_at?: string
          tipo_evento: string
        }
        Update: {
          evento_externo_id?: string | null
          fuente?: string
          id?: string
          intento_id?: string
          ocurrido_en?: string | null
          payload?: Json
          recibido_at?: string
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_intento_pago_reserva_intento_id_fkey"
            columns: ["intento_id"]
            isOneToOne: false
            referencedRelation: "intentos_pago_reserva"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_webhook_suscripcion: {
        Row: {
          error: string | null
          id: string
          intentos: number
          payload: Json
          procesado_at: string | null
          proveedor: string
          proveedor_evento_id: string
          recibido_at: string
          resultado: string | null
          tipo: string
          ultimo_intento_at: string | null
        }
        Insert: {
          error?: string | null
          id?: string
          intentos?: number
          payload: Json
          procesado_at?: string | null
          proveedor?: string
          proveedor_evento_id: string
          recibido_at?: string
          resultado?: string | null
          tipo: string
          ultimo_intento_at?: string | null
        }
        Update: {
          error?: string | null
          id?: string
          intentos?: number
          payload?: Json
          procesado_at?: string | null
          proveedor?: string
          proveedor_evento_id?: string
          recibido_at?: string
          resultado?: string | null
          tipo?: string
          ultimo_intento_at?: string | null
        }
        Relationships: []
      }
      facturas_suscripcion: {
        Row: {
          created_at: string
          estado: string
          external_reference: string
          id: string
          metadata: Json
          moneda: string
          monto: number
          pagada_at: string | null
          periodo_fin: string
          periodo_inicio: string
          proveedor: string
          proveedor_invoice_id: string | null
          proveedor_payment_id: string | null
          suscripcion_id: string
          updated_at: string
          vence_at: string | null
        }
        Insert: {
          created_at?: string
          estado: string
          external_reference: string
          id?: string
          metadata?: Json
          moneda?: string
          monto: number
          pagada_at?: string | null
          periodo_fin: string
          periodo_inicio: string
          proveedor?: string
          proveedor_invoice_id?: string | null
          proveedor_payment_id?: string | null
          suscripcion_id: string
          updated_at?: string
          vence_at?: string | null
        }
        Update: {
          created_at?: string
          estado?: string
          external_reference?: string
          id?: string
          metadata?: Json
          moneda?: string
          monto?: number
          pagada_at?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          proveedor?: string
          proveedor_invoice_id?: string | null
          proveedor_payment_id?: string | null
          suscripcion_id?: string
          updated_at?: string
          vence_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos_locales: {
        Row: {
          created_at: string
          local_id: string
          perfil_id: string
        }
        Insert: {
          created_at?: string
          local_id: string
          perfil_id: string
        }
        Update: {
          created_at?: string
          local_id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_locales_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_locales_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          cancha_id: string | null
          created_at: string
          id: string
          local_id: string
          oculta: boolean
          orden: number
          storage_path: string
          subida_por: string
        }
        Insert: {
          cancha_id?: string | null
          created_at?: string
          id?: string
          local_id: string
          oculta?: boolean
          orden?: number
          storage_path: string
          subida_por: string
        }
        Update: {
          cancha_id?: string | null
          created_at?: string
          id?: string
          local_id?: string
          oculta?: boolean
          orden?: number
          storage_path?: string
          subida_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_subida_por_fkey"
            columns: ["subida_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_atencion: {
        Row: {
          dia_semana: number
          hora_apertura: string
          hora_cierre: string
          id: string
          local_id: string
        }
        Insert: {
          dia_semana: number
          hora_apertura: string
          hora_cierre: string
          id?: string
          local_id: string
        }
        Update: {
          dia_semana?: number
          hora_apertura?: string
          hora_cierre?: string
          id?: string
          local_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_atencion_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      intentos_checkout_suscripcion: {
        Row: {
          checkout_url: string | null
          created_at: string
          detalle_error: string | null
          estado: string
          external_reference: string
          id: string
          idempotency_key: string
          preapproval_id: string | null
          suscripcion_id: string
          updated_at: string
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          detalle_error?: string | null
          estado?: string
          external_reference: string
          id?: string
          idempotency_key: string
          preapproval_id?: string | null
          suscripcion_id: string
          updated_at?: string
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          detalle_error?: string | null
          estado?: string
          external_reference?: string
          id?: string
          idempotency_key?: string
          preapproval_id?: string | null
          suscripcion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intentos_checkout_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      intentos_pago_reserva: {
        Row: {
          ambiente: string
          canal: string
          checkout_expira_en: string | null
          comision_proveedor: number | null
          created_at: string
          dueno_id: string
          estado: string
          external_reference: string
          id: string
          idempotency_key: string
          local_id: string
          marketplace_fee: number
          metadatos_proveedor: Json
          moneda: string
          monto_bruto: number
          monto_neto_recibido: number | null
          payment_externo_id: string | null
          preferencia_externa_id: string | null
          procesando_at: string | null
          proveedor: string
          reintentos: number
          reserva_id: string
          resuelto_at: string | null
          ultimo_detalle_proveedor: string | null
          ultimo_estado_proveedor: string | null
          ultimo_evento_proveedor_en: string | null
          updated_at: string
          vendedor_mp_id: string
        }
        Insert: {
          ambiente: string
          canal: string
          checkout_expira_en?: string | null
          comision_proveedor?: number | null
          created_at?: string
          dueno_id: string
          estado?: string
          external_reference: string
          id?: string
          idempotency_key: string
          local_id: string
          marketplace_fee?: number
          metadatos_proveedor?: Json
          moneda?: string
          monto_bruto: number
          monto_neto_recibido?: number | null
          payment_externo_id?: string | null
          preferencia_externa_id?: string | null
          procesando_at?: string | null
          proveedor: string
          reintentos?: number
          reserva_id: string
          resuelto_at?: string | null
          ultimo_detalle_proveedor?: string | null
          ultimo_estado_proveedor?: string | null
          ultimo_evento_proveedor_en?: string | null
          updated_at?: string
          vendedor_mp_id: string
        }
        Update: {
          ambiente?: string
          canal?: string
          checkout_expira_en?: string | null
          comision_proveedor?: number | null
          created_at?: string
          dueno_id?: string
          estado?: string
          external_reference?: string
          id?: string
          idempotency_key?: string
          local_id?: string
          marketplace_fee?: number
          metadatos_proveedor?: Json
          moneda?: string
          monto_bruto?: number
          monto_neto_recibido?: number | null
          payment_externo_id?: string | null
          preferencia_externa_id?: string | null
          procesando_at?: string | null
          proveedor?: string
          reintentos?: number
          reserva_id?: string
          resuelto_at?: string | null
          ultimo_detalle_proveedor?: string | null
          ultimo_estado_proveedor?: string | null
          ultimo_evento_proveedor_en?: string | null
          updated_at?: string
          vendedor_mp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intentos_pago_reserva_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intentos_pago_reserva_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intentos_pago_reserva_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      items_suscripcion: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          monto_total: number | null
          precio_unitario: number
          precio_version_id: string | null
          suscripcion_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          monto_total?: number | null
          precio_unitario: number
          precio_version_id?: string | null
          suscripcion_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          monto_total?: number | null
          precio_unitario?: number
          precio_version_id?: string | null
          suscripcion_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_suscripcion_precio_version_id_fkey"
            columns: ["precio_version_id"]
            isOneToOne: false
            referencedRelation: "precios_suscripcion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      local_beneficios: {
        Row: {
          beneficio_catalogo_id: string | null
          created_at: string
          id: string
          local_id: string
          nombre_personalizado: string | null
        }
        Insert: {
          beneficio_catalogo_id?: string | null
          created_at?: string
          id?: string
          local_id: string
          nombre_personalizado?: string | null
        }
        Update: {
          beneficio_catalogo_id?: string | null
          created_at?: string
          id?: string
          local_id?: string
          nombre_personalizado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_beneficios_beneficio_catalogo_id_fkey"
            columns: ["beneficio_catalogo_id"]
            isOneToOne: false
            referencedRelation: "beneficios_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_beneficios_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      local_medios_pago: {
        Row: {
          activo: boolean
          banco: string | null
          cci: string | null
          created_at: string
          id: string
          local_id: string
          nombre_visible: string
          numero_cuenta: string | null
          qr_storage_path: string | null
          telefono: string | null
          tipo: string
          titular: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          banco?: string | null
          cci?: string | null
          created_at?: string
          id?: string
          local_id: string
          nombre_visible: string
          numero_cuenta?: string | null
          qr_storage_path?: string | null
          telefono?: string | null
          tipo: string
          titular?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          banco?: string | null
          cci?: string | null
          created_at?: string
          id?: string
          local_id?: string
          nombre_visible?: string
          numero_cuenta?: string | null
          qr_storage_path?: string | null
          telefono?: string | null
          tipo?: string
          titular?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_medios_pago_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          aprobado_por: string | null
          created_at: string
          descripcion: string | null
          direccion: string
          dueno_id: string
          duracion_minima_minutos: number
          estado: Database["public"]["Enums"]["estado_local"]
          fecha_aprobacion: string | null
          fecha_fin_trial: string | null
          granularidad_minutos: number
          id: string
          latitud: number | null
          logo: string | null
          longitud: number | null
          medios_pago_adelanto: Json
          motivo_rechazo: string | null
          nombre: string
          politica_reembolso: string
          porcentaje_adelanto: number | null
          publicado: boolean
          publicado_at: string | null
          ruc: string | null
          suspendido_por_facturacion: boolean
          telefono_contacto_principal: string
          telefono_contacto_secundario: string | null
          updated_at: string
        }
        Insert: {
          aprobado_por?: string | null
          created_at?: string
          descripcion?: string | null
          direccion: string
          dueno_id: string
          duracion_minima_minutos?: number
          estado?: Database["public"]["Enums"]["estado_local"]
          fecha_aprobacion?: string | null
          fecha_fin_trial?: string | null
          granularidad_minutos?: number
          id?: string
          latitud?: number | null
          logo?: string | null
          longitud?: number | null
          medios_pago_adelanto?: Json
          motivo_rechazo?: string | null
          nombre: string
          politica_reembolso?: string
          porcentaje_adelanto?: number | null
          publicado?: boolean
          publicado_at?: string | null
          ruc?: string | null
          suspendido_por_facturacion?: boolean
          telefono_contacto_principal: string
          telefono_contacto_secundario?: string | null
          updated_at?: string
        }
        Update: {
          aprobado_por?: string | null
          created_at?: string
          descripcion?: string | null
          direccion?: string
          dueno_id?: string
          duracion_minima_minutos?: number
          estado?: Database["public"]["Enums"]["estado_local"]
          fecha_aprobacion?: string | null
          fecha_fin_trial?: string | null
          granularidad_minutos?: number
          id?: string
          latitud?: number | null
          logo?: string | null
          longitud?: number | null
          medios_pago_adelanto?: Json
          motivo_rechazo?: string | null
          nombre?: string
          politica_reembolso?: string
          porcentaje_adelanto?: number | null
          publicado?: boolean
          publicado_at?: string | null
          ruc?: string | null
          suspendido_por_facturacion?: boolean
          telefono_contacto_principal?: string
          telefono_contacto_secundario?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locales_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locales_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mercadopago_locales: {
        Row: {
          actualizada_at: string
          habilitado: boolean
          local_id: string
        }
        Insert: {
          actualizada_at?: string
          habilitado?: boolean
          local_id: string
        }
        Update: {
          actualizada_at?: string
          habilitado?: boolean
          local_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mercadopago_locales_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: true
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      mercadopago_oauth_intentos: {
        Row: {
          ambiente: string
          code_verifier: string
          creado_at: string
          dueno_id: string
          expira_en: string
          state_hash: string
        }
        Insert: {
          ambiente: string
          code_verifier: string
          creado_at?: string
          dueno_id: string
          expira_en: string
          state_hash: string
        }
        Update: {
          ambiente?: string
          code_verifier?: string
          creado_at?: string
          dueno_id?: string
          expira_en?: string
          state_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "mercadopago_oauth_intentos_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mercadopago_vinculaciones: {
        Row: {
          access_token_vault_id: string | null
          actualizada_at: string
          ambiente: string
          dueno_id: string
          estado: string
          refresh_token_vault_id: string | null
          token_expira_en: string | null
          vendedor_mp_id: string | null
          vinculada_at: string | null
        }
        Insert: {
          access_token_vault_id?: string | null
          actualizada_at?: string
          ambiente: string
          dueno_id: string
          estado?: string
          refresh_token_vault_id?: string | null
          token_expira_en?: string | null
          vendedor_mp_id?: string | null
          vinculada_at?: string | null
        }
        Update: {
          access_token_vault_id?: string | null
          actualizada_at?: string
          ambiente?: string
          dueno_id?: string
          estado?: string
          refresh_token_vault_id?: string | null
          token_expira_en?: string | null
          vendedor_mp_id?: string | null
          vinculada_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mercadopago_vinculaciones_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderaciones_locales: {
        Row: {
          creada_at: string
          creada_por: string
          estado: string
          id: string
          levantada_at: string | null
          levantada_por: string | null
          local_id: string
          motivo: string
          motivo_levantamiento: string | null
          notas_internas: string | null
          tipo: string
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          creada_at?: string
          creada_por: string
          estado?: string
          id?: string
          levantada_at?: string | null
          levantada_por?: string | null
          local_id: string
          motivo: string
          motivo_levantamiento?: string | null
          notas_internas?: string | null
          tipo: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          creada_at?: string
          creada_por?: string
          estado?: string
          id?: string
          levantada_at?: string | null
          levantada_por?: string | null
          local_id?: string
          motivo?: string
          motivo_levantamiento?: string | null
          notas_internas?: string | null
          tipo?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderaciones_locales_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderaciones_locales_levantada_por_fkey"
            columns: ["levantada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderaciones_locales_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_pago_reserva: {
        Row: {
          created_at: string
          id: string
          medio: string | null
          medio_nombre_snapshot: string | null
          medio_pago_id: string | null
          medio_tipo_snapshot: string | null
          medio_titular_snapshot: string | null
          monto: number
          notas: string | null
          referencia: string | null
          registrado_por: string
          reserva_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          medio?: string | null
          medio_nombre_snapshot?: string | null
          medio_pago_id?: string | null
          medio_tipo_snapshot?: string | null
          medio_titular_snapshot?: string | null
          monto: number
          notas?: string | null
          referencia?: string | null
          registrado_por: string
          reserva_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          medio?: string | null
          medio_nombre_snapshot?: string | null
          medio_pago_id?: string | null
          medio_tipo_snapshot?: string | null
          medio_titular_snapshot?: string | null
          monto?: number
          notas?: string | null
          referencia?: string | null
          registrado_por?: string
          reserva_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_pago_reserva_medio_pago_id_fkey"
            columns: ["medio_pago_id"]
            isOneToOne: false
            referencedRelation: "local_medios_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_pago_reserva_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_pago_reserva_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacion_push_entregas: {
        Row: {
          actualizado_at: string
          bloqueada_hasta: string | null
          creado_at: string
          destinatario_id: string
          estado: string
          id: string
          intentos: number
          notificacion_id: string
          proximo_intento_at: string
          recibo_intentos: number
          ticket_id: string | null
          token: string
          ultimo_error: string | null
        }
        Insert: {
          actualizado_at?: string
          bloqueada_hasta?: string | null
          creado_at?: string
          destinatario_id: string
          estado?: string
          id?: string
          intentos?: number
          notificacion_id: string
          proximo_intento_at?: string
          recibo_intentos?: number
          ticket_id?: string | null
          token: string
          ultimo_error?: string | null
        }
        Update: {
          actualizado_at?: string
          bloqueada_hasta?: string | null
          creado_at?: string
          destinatario_id?: string
          estado?: string
          id?: string
          intentos?: number
          notificacion_id?: string
          proximo_intento_at?: string
          recibo_intentos?: number
          ticket_id?: string | null
          token?: string
          ultimo_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacion_push_entregas_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacion_push_entregas_notificacion_id_fkey"
            columns: ["notificacion_id"]
            isOneToOne: false
            referencedRelation: "notificaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          datos: Json
          destinatario_id: string
          href: string | null
          id: string
          leida_at: string | null
          local_id: string | null
          mensaje: string
          reserva_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          datos?: Json
          destinatario_id: string
          href?: string | null
          id?: string
          leida_at?: string | null
          local_id?: string | null
          mensaje: string
          reserva_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          datos?: Json
          destinatario_id?: string
          href?: string | null
          id?: string
          leida_at?: string | null
          local_id?: string | null
          mensaje?: string
          reserva_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_suscripcion: {
        Row: {
          estado: string
          fecha_pago: string
          id: string
          mercadopago_payment_id: string | null
          monto: number
          suscripcion_id: string
        }
        Insert: {
          estado: string
          fecha_pago?: string
          id?: string
          mercadopago_payment_id?: string | null
          monto: number
          suscripcion_id: string
        }
        Update: {
          estado?: string
          fecha_pago?: string
          id?: string
          mercadopago_payment_id?: string | null
          monto?: number
          suscripcion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_globales: {
        Row: {
          clave: string
          descripcion: string | null
          valor: Json
        }
        Insert: {
          clave: string
          descripcion?: string | null
          valor: Json
        }
        Update: {
          clave?: string
          descripcion?: string | null
          valor?: Json
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dni: string | null
          email: string | null
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          id: string
          nombre_completo: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      precios_suscripcion: {
        Row: {
          codigo: string
          created_at: string
          dias_gracia: number
          id: string
          moneda: string
          monto_base: number
          monto_sede_extra: number
          sedes_incluidas: number
          version: number
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          codigo: string
          created_at?: string
          dias_gracia?: number
          id?: string
          moneda?: string
          monto_base: number
          monto_sede_extra: number
          sedes_incluidas?: number
          version: number
          vigente_desde: string
          vigente_hasta?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string
          dias_gracia?: number
          id?: string
          moneda?: string
          monto_base?: number
          monto_sede_extra?: number
          sedes_incluidas?: number
          version?: number
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          token: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          token: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          token?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regla_tarifa_objetivos: {
        Row: {
          cancha_id: string
          created_at: string
          deporte_id: string
          regla_id: string
        }
        Insert: {
          cancha_id: string
          created_at?: string
          deporte_id: string
          regla_id: string
        }
        Update: {
          cancha_id?: string
          created_at?: string
          deporte_id?: string
          regla_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regla_tarifa_objetivos_cancha_id_deporte_id_fkey"
            columns: ["cancha_id", "deporte_id"]
            isOneToOne: false
            referencedRelation: "cancha_deportes"
            referencedColumns: ["cancha_id", "deporte_id"]
          },
          {
            foreignKeyName: "regla_tarifa_objetivos_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "reglas_tarifarias"
            referencedColumns: ["id"]
          },
        ]
      }
      reglas_tarifarias: {
        Row: {
          activo: boolean
          created_at: string
          descuento_porcentaje: number | null
          dias_semana: number[]
          fecha_fin: string | null
          fecha_inicio: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          local_id: string
          nombre: string
          precio_por_hora: number | null
          tipo: Database["public"]["Enums"]["tipo_regla_tarifa"]
          tipo_ajuste: Database["public"]["Enums"]["tipo_ajuste_tarifa"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descuento_porcentaje?: number | null
          dias_semana: number[]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          local_id: string
          nombre: string
          precio_por_hora?: number | null
          tipo: Database["public"]["Enums"]["tipo_regla_tarifa"]
          tipo_ajuste: Database["public"]["Enums"]["tipo_ajuste_tarifa"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descuento_porcentaje?: number | null
          dias_semana?: number[]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          local_id?: string
          nombre?: string
          precio_por_hora?: number | null
          tipo?: Database["public"]["Enums"]["tipo_regla_tarifa"]
          tipo_ajuste?: Database["public"]["Enums"]["tipo_ajuste_tarifa"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reglas_tarifarias_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes: {
        Row: {
          created_at: string
          entidad_id: string
          id: string
          motivo: string | null
          reportado_por: string
          revisado: boolean
          tipo_entidad: Database["public"]["Enums"]["tipo_entidad_reporte"]
        }
        Insert: {
          created_at?: string
          entidad_id: string
          id?: string
          motivo?: string | null
          reportado_por: string
          revisado?: boolean
          tipo_entidad: Database["public"]["Enums"]["tipo_entidad_reporte"]
        }
        Update: {
          created_at?: string
          entidad_id?: string
          id?: string
          motivo?: string | null
          reportado_por?: string
          revisado?: boolean
          tipo_entidad?: Database["public"]["Enums"]["tipo_entidad_reporte"]
        }
        Relationships: [
          {
            foreignKeyName: "reportes_reportado_por_fkey"
            columns: ["reportado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resenas: {
        Row: {
          calificacion: number
          cliente_id: string
          comentario: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_resena"]
          id: string
          local_id: string
          reserva_id: string
          respuesta_dueno: string | null
        }
        Insert: {
          calificacion: number
          cliente_id: string
          comentario?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_resena"]
          id?: string
          local_id: string
          reserva_id: string
          respuesta_dueno?: string | null
        }
        Update: {
          calificacion?: number
          cliente_id?: string
          comentario?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_resena"]
          id?: string
          local_id?: string
          reserva_id?: string
          respuesta_dueno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resenas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: true
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_detalles_tarifa: {
        Row: {
          created_at: string
          id: string
          precio_base_por_hora: number
          precio_por_hora_aplicado: number
          promocion_id: string | null
          promocion_nombre: string | null
          rango: unknown
          regla_recurrente_id: string | null
          regla_recurrente_nombre: string | null
          reserva_id: string
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          precio_base_por_hora: number
          precio_por_hora_aplicado: number
          promocion_id?: string | null
          promocion_nombre?: string | null
          rango: unknown
          regla_recurrente_id?: string | null
          regla_recurrente_nombre?: string | null
          reserva_id: string
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          precio_base_por_hora?: number
          precio_por_hora_aplicado?: number
          promocion_id?: string | null
          promocion_nombre?: string | null
          rango?: unknown
          regla_recurrente_id?: string | null
          regla_recurrente_nombre?: string | null
          reserva_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "reserva_detalles_tarifa_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "reglas_tarifarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_detalles_tarifa_regla_recurrente_id_fkey"
            columns: ["regla_recurrente_id"]
            isOneToOne: false
            referencedRelation: "reglas_tarifarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_detalles_tarifa_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_extensiones: {
        Row: {
          adelanto_adicional_requerido: number
          autorizado_por: string
          created_at: string
          estado_cobro: string
          id: string
          medio_cobro: string | null
          medio_nombre_snapshot: string | null
          medio_pago_id: string | null
          medio_tipo_snapshot: string | null
          monto_adicional: number
          notas: string | null
          rango_extension: unknown
          reserva_id: string
        }
        Insert: {
          adelanto_adicional_requerido: number
          autorizado_por: string
          created_at?: string
          estado_cobro?: string
          id?: string
          medio_cobro?: string | null
          medio_nombre_snapshot?: string | null
          medio_pago_id?: string | null
          medio_tipo_snapshot?: string | null
          monto_adicional: number
          notas?: string | null
          rango_extension: unknown
          reserva_id: string
        }
        Update: {
          adelanto_adicional_requerido?: number
          autorizado_por?: string
          created_at?: string
          estado_cobro?: string
          id?: string
          medio_cobro?: string | null
          medio_nombre_snapshot?: string | null
          medio_pago_id?: string | null
          medio_tipo_snapshot?: string | null
          monto_adicional?: number
          notas?: string | null
          rango_extension?: unknown
          reserva_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserva_extensiones_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_extensiones_medio_pago_id_fkey"
            columns: ["medio_pago_id"]
            isOneToOne: false
            referencedRelation: "local_medios_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_extensiones_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          canal_origen: Database["public"]["Enums"]["canal_origen_reserva"]
          cancelada_at: string | null
          cancelada_por: string | null
          cancha_id: string
          cliente_id: string | null
          cliente_sin_cuenta_nombre: string | null
          cliente_sin_cuenta_telefono: string | null
          comentario_rechazo_pago: string | null
          comprobante_subido_at: string | null
          comprobante_url: string | null
          confirmada_por: string | null
          created_at: string
          deporte_id: string
          es_excepcion_horaria: boolean
          estado: Database["public"]["Enums"]["estado_reserva"]
          id: string
          medio_pago_adelanto_id: string | null
          monto_adelanto_requerido: number
          monto_total: number
          motivo_cancelacion: string | null
          motivo_rechazo_pago:
            | Database["public"]["Enums"]["motivo_rechazo_pago"]
            | null
          notas: string | null
          pago_expira_en: string | null
          precio_por_hora_aplicado: number | null
          rango: unknown
          rechazada_at: string | null
          rechazada_por: string | null
          reembolso_resultado: Database["public"]["Enums"]["resultado_reembolso"]
          updated_at: string
        }
        Insert: {
          canal_origen?: Database["public"]["Enums"]["canal_origen_reserva"]
          cancelada_at?: string | null
          cancelada_por?: string | null
          cancha_id: string
          cliente_id?: string | null
          cliente_sin_cuenta_nombre?: string | null
          cliente_sin_cuenta_telefono?: string | null
          comentario_rechazo_pago?: string | null
          comprobante_subido_at?: string | null
          comprobante_url?: string | null
          confirmada_por?: string | null
          created_at?: string
          deporte_id: string
          es_excepcion_horaria?: boolean
          estado?: Database["public"]["Enums"]["estado_reserva"]
          id?: string
          medio_pago_adelanto_id?: string | null
          monto_adelanto_requerido: number
          monto_total: number
          motivo_cancelacion?: string | null
          motivo_rechazo_pago?:
            | Database["public"]["Enums"]["motivo_rechazo_pago"]
            | null
          notas?: string | null
          pago_expira_en?: string | null
          precio_por_hora_aplicado?: number | null
          rango: unknown
          rechazada_at?: string | null
          rechazada_por?: string | null
          reembolso_resultado?: Database["public"]["Enums"]["resultado_reembolso"]
          updated_at?: string
        }
        Update: {
          canal_origen?: Database["public"]["Enums"]["canal_origen_reserva"]
          cancelada_at?: string | null
          cancelada_por?: string | null
          cancha_id?: string
          cliente_id?: string | null
          cliente_sin_cuenta_nombre?: string | null
          cliente_sin_cuenta_telefono?: string | null
          comentario_rechazo_pago?: string | null
          comprobante_subido_at?: string | null
          comprobante_url?: string | null
          confirmada_por?: string | null
          created_at?: string
          deporte_id?: string
          es_excepcion_horaria?: boolean
          estado?: Database["public"]["Enums"]["estado_reserva"]
          id?: string
          medio_pago_adelanto_id?: string | null
          monto_adelanto_requerido?: number
          monto_total?: number
          motivo_cancelacion?: string | null
          motivo_rechazo_pago?:
            | Database["public"]["Enums"]["motivo_rechazo_pago"]
            | null
          notas?: string | null
          pago_expira_en?: string | null
          precio_por_hora_aplicado?: number | null
          rango?: unknown
          rechazada_at?: string | null
          rechazada_por?: string | null
          reembolso_resultado?: Database["public"]["Enums"]["resultado_reembolso"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_cancelada_por_fkey"
            columns: ["cancelada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_confirmada_por_fkey"
            columns: ["confirmada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_medio_pago_adelanto_id_fkey"
            columns: ["medio_pago_adelanto_id"]
            isOneToOne: false
            referencedRelation: "local_medios_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_rechazada_por_fkey"
            columns: ["rechazada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          billing_ultima_conciliacion_at: string | null
          cancelacion_efectiva_at: string | null
          created_at: string
          dias_gracia_contratada: number
          dias_gracia_override: number | null
          dueno_id: string
          estado: Database["public"]["Enums"]["estado_suscripcion"]
          estado_facturacion: string
          fecha_proximo_cobro: string | null
          gracia_hasta: string | null
          id: string
          mercadopago_preapproval_id: string | null
          metodo_pago_codigo: string | null
          moneda: string
          monto: number
          periodo_actual_fin: string | null
          periodo_actual_inicio: string | null
          precio_version_id: string | null
          proveedor: string
          proximo_cobro_at: string | null
          sedes_extra_contratadas: number
          updated_at: string
        }
        Insert: {
          billing_ultima_conciliacion_at?: string | null
          cancelacion_efectiva_at?: string | null
          created_at?: string
          dias_gracia_contratada?: number
          dias_gracia_override?: number | null
          dueno_id: string
          estado?: Database["public"]["Enums"]["estado_suscripcion"]
          estado_facturacion?: string
          fecha_proximo_cobro?: string | null
          gracia_hasta?: string | null
          id?: string
          mercadopago_preapproval_id?: string | null
          metodo_pago_codigo?: string | null
          moneda?: string
          monto?: number
          periodo_actual_fin?: string | null
          periodo_actual_inicio?: string | null
          precio_version_id?: string | null
          proveedor?: string
          proximo_cobro_at?: string | null
          sedes_extra_contratadas?: number
          updated_at?: string
        }
        Update: {
          billing_ultima_conciliacion_at?: string | null
          cancelacion_efectiva_at?: string | null
          created_at?: string
          dias_gracia_contratada?: number
          dias_gracia_override?: number | null
          dueno_id?: string
          estado?: Database["public"]["Enums"]["estado_suscripcion"]
          estado_facturacion?: string
          fecha_proximo_cobro?: string | null
          gracia_hasta?: string | null
          id?: string
          mercadopago_preapproval_id?: string | null
          metodo_pago_codigo?: string | null
          moneda?: string
          monto?: number
          periodo_actual_fin?: string | null
          periodo_actual_inicio?: string | null
          precio_version_id?: string | null
          proveedor?: string
          proximo_cobro_at?: string | null
          sedes_extra_contratadas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_precio_version_id_fkey"
            columns: ["precio_version_id"]
            isOneToOne: false
            referencedRelation: "precios_suscripcion"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_datos_generales_local: {
        Args: {
          p_descripcion: string
          p_direccion: string
          p_latitud: number
          p_local_id: string
          p_longitud: number
          p_nombre: string
          p_ruc: string
          p_telefono_principal: string
          p_telefono_secundario: string
        }
        Returns: undefined
      }
      actualizar_logo_local: {
        Args: { p_local_id: string; p_storage_path: string }
        Returns: string
      }
      actualizar_parametro_plataforma: {
        Args: { p_clave: string; p_forzar?: boolean; p_valor: Json }
        Returns: {
          clave_actualizada: string
          locales_por_debajo: number
          valor_anterior: Json
          valor_nuevo: Json
        }[]
      }
      actualizar_reglas_comerciales_local: {
        Args: {
          p_local_id: string
          p_medios_pago: Json
          p_politica_reembolso: string
          p_porcentaje_adelanto: number
        }
        Returns: undefined
      }
      actualizar_reglas_comerciales_local_v2: {
        Args: {
          p_local_id: string
          p_medios_pago: Json
          p_politica_reembolso: string
          p_porcentaje_adelanto: number
        }
        Returns: undefined
      }
      aprobar_solicitud_local: {
        Args: { p_local_id: string }
        Returns: Database["public"]["Enums"]["estado_local"]
      }
      autorizar_push_cron: { Args: { p_secret: string }; Returns: boolean }
      billing_activar_cron_conciliacion: { Args: never; Returns: undefined }
      billing_activar_local_configurado: {
        Args: { p_local_id: string }
        Returns: boolean
      }
      billing_aplicar_preapproval: {
        Args: {
          p_estado_remoto: string
          p_payload: Json
          p_preapproval_id: string
          p_proximo_cobro_at: string
        }
        Returns: boolean
      }
      billing_cerrar_rechazos_checkout_deterministas: {
        Args: { p_dueno_id: string }
        Returns: number
      }
      billing_confirmar_cambio_sedes: {
        Args: { p_cambio_id: string }
        Returns: boolean
      }
      billing_confirmar_cancelacion_cambio_sedes: {
        Args: { p_cambio_id: string }
        Returns: boolean
      }
      billing_entitlement_vigente: {
        Args: { p_dueno_id: string }
        Returns: boolean
      }
      billing_establecer_gracia_propietario: {
        Args: { p_dias_gracia?: number; p_dueno_id: string }
        Returns: undefined
      }
      billing_eventos_pendientes: {
        Args: { p_limite?: number }
        Returns: {
          evento_id: string
          recurso_id: string
          tipo: string
        }[]
      }
      billing_expirar_gracias: { Args: never; Returns: number }
      billing_finalizar_evento_webhook: {
        Args: { p_error?: string; p_evento_id: string; p_resultado: string }
        Returns: undefined
      }
      billing_local_operativo: {
        Args: { p_local_id: string }
        Returns: boolean
      }
      billing_local_vigente: { Args: { p_local_id: string }; Returns: boolean }
      billing_marcar_cambio_sedes_revision: {
        Args: { p_cambio_id: string; p_detalle: string }
        Returns: undefined
      }
      billing_marcar_checkout_revision: {
        Args: { p_detalle: string; p_intento_id: string }
        Returns: undefined
      }
      billing_obtener_oferta_checkout: {
        Args: never
        Returns: {
          moneda: string
          monto_base: number
          monto_minimo: number
          monto_sede_extra: number
          precio_version_id: string
          sedes_extra_minimas: number
          sedes_incluidas: number
        }[]
      }
      billing_obtener_plan_propio: {
        Args: never
        Returns: {
          cambio_estado: string
          efectivo_desde: string
          monto_base: number
          monto_sede_extra: number
          sedes_extra_actuales: number
          sedes_extra_minimas: number
          sedes_extra_pendientes: number
          sedes_incluidas: number
        }[]
      }
      billing_obtener_resumen_sedes: {
        Args: never
        Returns: {
          asientos_disponibles: number
          max_sedes: number
          puede_crear_sede: boolean
          sedes_extra_contratadas: number
          sedes_incluidas: number
          sedes_usadas: number
        }[]
      }
      billing_obtener_precios_suscripcion_admin: {
        Args: never
        Returns: {
          codigo: string
          dias_gracia: number
          es_vigente: boolean
          id: string
          moneda: string
          monto_base: number
          monto_sede_extra: number
          sedes_incluidas: number
          version: number
          vigente_desde: string
          vigente_hasta: string
        }[]
      }
      billing_preparar_cambio_sedes: {
        Args: {
          p_dueno_id: string
          p_idempotency_key: string
          p_sedes_extra: number
        }
        Returns: {
          cambio_id: string
          estado: string
          moneda: string
          monto_objetivo: number
          preapproval_id: string
        }[]
      }
      billing_preparar_cancelacion_cambio_sedes: {
        Args: { p_dueno_id: string }
        Returns: {
          cambio_id: string
          moneda: string
          monto_restaurar: number
          preapproval_id: string
        }[]
      }
      billing_preparar_checkout: {
        Args: {
          p_dueno_id: string
          p_idempotency_key: string
          p_sedes_extra: number
        }
        Returns: {
          checkout_url: string
          estado: string
          external_reference: string
          intento_id: string
          moneda: string
          monto: number
          preapproval_id: string
          sedes_extra: number
          sedes_incluidas: number
          suscripcion_id: string
        }[]
      }
      billing_publicar_precio_suscripcion: {
        Args: {
          p_dias_gracia?: number
          p_monto_base: number
          p_monto_sede_extra: number
          p_sedes_incluidas?: number
        }
        Returns: {
          codigo: string
          dias_gracia: number
          id: string
          moneda: string
          monto_base: number
          monto_sede_extra: number
          sedes_incluidas: number
          version: number
          vigente_desde: string
        }[]
      }
      billing_reactivar_local_con_trial: {
        Args: { p_dias?: number; p_local_id: string }
        Returns: {
          estado: Database["public"]["Enums"]["estado_local"]
          fecha_fin_trial: string
        }[]
      }
      billing_registrar_evento_webhook: {
        Args: { p_evento_id: string; p_payload: Json; p_tipo: string }
        Returns: boolean
      }
      billing_registrar_pago_recurrente: {
        Args: {
          p_estado_remoto: string
          p_fecha: string
          p_monto: number
          p_payload: Json
          p_payment_id: string
          p_preapproval_id: string
        }
        Returns: boolean
      }
      billing_registrar_preapproval_checkout: {
        Args: {
          p_checkout_url: string
          p_intento_id: string
          p_preapproval_id: string
        }
        Returns: undefined
      }
      billing_sincronizar_locales_entitlement: {
        Args: { p_dueno_id: string; p_habilitado: boolean }
        Returns: undefined
      }
      buscar_clientes_para_dueno: {
        Args: { p_busqueda: string; p_limite?: number }
        Returns: {
          avatar_url: string | null
          dni: string
          email: string
          nombre_completo: string
          perfil_id: string
          telefono: string
        }[]
      }
      buscar_locales_publicos: {
        Args: {
          p_busqueda?: string
          p_calificacion_minima?: number
          p_deporte_id?: string
          p_fecha?: string
          p_hora_fin?: string
          p_hora_inicio?: string
          p_latitud?: number
          p_limite?: number
          p_longitud?: number
          p_orden?: string
        }
        Returns: {
          direccion: string
          distancia_metros: number
          id: string
          logo: string
          nombre: string
          portada_storage_path: string
          promedio: number
          total_resenas: number
        }[]
      }
      buscar_perfil_por_telefono_dueno: {
        Args: { p_telefono: string }
        Returns: {
          avatar_url: string | null
          nombre_completo: string
          perfil_id: string
          telefono: string
        }[]
      }
      cambiar_estado_cancha_local: {
        Args: { p_activa: boolean; p_cancha_id: string; p_local_id: string }
        Returns: boolean
      }
      cambiar_publicacion_local: {
        Args: { p_local_id: string; p_publicado: boolean }
        Returns: boolean
      }
      cancelar_reserva_cliente: {
        Args: { p_reserva_id: string }
        Returns: undefined
      }
      cancelar_reserva_dueno: {
        Args: {
          p_estado: Database["public"]["Enums"]["estado_reserva"]
          p_motivo?: string
          p_reembolso?: Database["public"]["Enums"]["resultado_reembolso"]
          p_reserva_id: string
        }
        Returns: undefined
      }
      confirmar_reserva: { Args: { p_reserva_id: string }; Returns: undefined }
      cotizar_reserva_manual_detallada_dueno: {
        Args: {
          p_cancha_id: string
          p_deporte_id: string
          p_duracion_minutos: number
          p_inicio: string
          p_local_id: string
        }
        Returns: {
          detalle_tarifario: Json
          monto_adelanto_sugerido: number
          monto_total: number
        }[]
      }
      cotizar_reserva_manual_dueno: {
        Args: {
          p_cancha_id: string
          p_deporte_id: string
          p_duracion_minutos: number
          p_inicio: string
          p_local_id: string
        }
        Returns: {
          monto_adelanto_sugerido: number
          monto_total: number
        }[]
      }
      crear_reserva: {
        Args: {
          p_cancha_id: string
          p_deporte_id: string
          p_fin: string
          p_inicio: string
          p_notas?: string
        }
        Returns: string
      }
      crear_reserva_en_cancha: {
        Args: {
          p_bloques: number
          p_cancha_id: string
          p_deporte_id: string
          p_inicio: string
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_reserva_en_local: {
        Args: {
          p_bloques: number
          p_deporte_id: string
          p_inicio: string
          p_local_id: string
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_reserva_manual_confirmada_dueno: {
        Args: {
          p_bloques: number
          p_canal?: Database["public"]["Enums"]["canal_origen_reserva"]
          p_cancha_id: string
          p_cliente_id?: string
          p_cliente_nombre?: string
          p_cliente_telefono?: string
          p_deporte_id: string
          p_inicio: string
          p_local_id: string
          p_monto_adelanto?: number
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          cliente_id: string
          cliente_sin_cuenta_nombre: string
          cliente_sin_cuenta_telefono: string
          estado: Database["public"]["Enums"]["estado_reserva"]
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_reserva_manual_confirmada_dueno_v2: {
        Args: {
          p_bloques: number
          p_canal?: Database["public"]["Enums"]["canal_origen_reserva"]
          p_cancha_id: string
          p_cliente_id?: string
          p_cliente_nombre?: string
          p_cliente_telefono?: string
          p_deporte_id: string
          p_inicio: string
          p_local_id: string
          p_medio_pago_id: string
          p_monto_adelanto?: number
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          cliente_id: string
          cliente_sin_cuenta_nombre: string
          cliente_sin_cuenta_telefono: string
          estado: Database["public"]["Enums"]["estado_reserva"]
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_reserva_manual_dueno: {
        Args: {
          p_bloques?: number
          p_canal?: Database["public"]["Enums"]["canal_origen_reserva"]
          p_cancha_id?: string
          p_cliente_id?: string
          p_cliente_nombre?: string
          p_cliente_telefono?: string
          p_deporte_id: string
          p_estado?: Database["public"]["Enums"]["estado_reserva"]
          p_inicio: string
          p_local_id: string
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          cliente_id: string
          cliente_sin_cuenta_nombre: string
          cliente_sin_cuenta_telefono: string
          estado: Database["public"]["Enums"]["estado_reserva"]
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_reserva_manual_encajada: {
        Args: {
          p_canal?: Database["public"]["Enums"]["canal_origen_reserva"]
          p_cliente_id?: string
          p_cliente_nombre?: string
          p_cliente_telefono?: string
          p_deporte_id: string
          p_estado?: Database["public"]["Enums"]["estado_reserva"]
          p_inicio: string
          p_local_id: string
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_reserva_manual_encajada_confirmada_dueno: {
        Args: {
          p_canal?: Database["public"]["Enums"]["canal_origen_reserva"]
          p_cancha_id: string
          p_cliente_id?: string
          p_cliente_nombre?: string
          p_cliente_telefono?: string
          p_deporte_id: string
          p_inicio: string
          p_local_id: string
          p_monto_adelanto?: number
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_reserva_manual_encajada_confirmada_dueno_v2: {
        Args: {
          p_canal?: Database["public"]["Enums"]["canal_origen_reserva"]
          p_cancha_id: string
          p_cliente_id?: string
          p_cliente_nombre?: string
          p_cliente_telefono?: string
          p_deporte_id: string
          p_inicio: string
          p_local_id: string
          p_medio_pago_id: string
          p_monto_adelanto?: number
          p_notas?: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      crear_sede_adicional: {
        Args: {
          p_descripcion: string
          p_direccion: string
          p_latitud: number
          p_longitud: number
          p_nombre: string
          p_ruc: string
          p_telefono_principal: string
          p_telefono_secundario: string
        }
        Returns: {
          estado: Database["public"]["Enums"]["estado_local"]
          local_id: string
        }[]
      }
      desregistrar_push_token_cliente: {
        Args: { p_token: string }
        Returns: undefined
      }
      eliminar_foto_local: {
        Args: { p_foto_id: string; p_local_id: string }
        Returns: string
      }
      eliminar_regla_tarifaria: {
        Args: { p_regla_id: string }
        Returns: undefined
      }
      explorar_locales_mapa_decisiones_publicos: {
        Args: {
          p_busqueda?: string
          p_calificacion_minima?: number
          p_deporte_id?: string
          p_duracion_horas?: number
          p_este: number
          p_fecha?: string
          p_hora_desde?: string
          p_hora_hasta?: string
          p_hora_inicio?: string
          p_latitud?: number
          p_limite?: number
          p_longitud?: number
          p_norte: number
          p_oeste: number
          p_orden?: string
          p_precio_total_max?: number
          p_radio_metros?: number
          p_solo_disponibles?: boolean
          p_sur: number
        }
        Returns: {
          atiende_fecha: boolean
          direccion: string
          distancia_metros: number
          duracion_minima_minutos: number
          id: string
          latitud: number
          logo: string
          longitud: number
          nombre: string
          opciones_disponibles: number
          portada_storage_path: string
          precio_base_desde: number
          promedio: number
          promocion_reservable: boolean
          proximo_cancha_id: string
          proximo_deporte_id: string
          proximo_es_promocion: boolean
          proximo_inicio: string
          proximo_precio_por_hora: number
          proximo_precio_total: number
          total_locales: number
          total_resenas: number
        }[]
      }
      explorar_locales_mapa_publicos: {
        Args: {
          p_busqueda?: string
          p_calificacion_minima?: number
          p_deporte_id?: string
          p_duracion_horas?: number
          p_este: number
          p_fecha?: string
          p_hora_inicio?: string
          p_latitud?: number
          p_limite?: number
          p_longitud?: number
          p_norte: number
          p_oeste: number
          p_orden?: string
          p_radio_metros?: number
          p_sur: number
        }
        Returns: {
          atiende_fecha: boolean
          direccion: string
          distancia_metros: number
          duracion_minima_minutos: number
          id: string
          latitud: number
          logo: string
          longitud: number
          nombre: string
          opciones_disponibles: number
          portada_storage_path: string
          precio_base_desde: number
          promedio: number
          proximo_cancha_id: string
          proximo_deporte_id: string
          proximo_es_promocion: boolean
          proximo_inicio: string
          proximo_precio_por_hora: number
          proximo_precio_total: number
          total_locales: number
          total_resenas: number
        }[]
      }
      explorar_locales_publicos: {
        Args: {
          p_busqueda?: string
          p_calificacion_minima?: number
          p_deporte_id?: string
          p_fecha?: string
          p_hora_fin?: string
          p_hora_inicio?: string
          p_latitud?: number
          p_limite?: number
          p_longitud?: number
          p_orden?: string
        }
        Returns: {
          direccion: string
          distancia_metros: number
          id: string
          latitud: number
          logo: string
          longitud: number
          nombre: string
          portada_storage_path: string
          promedio: number
          total_resenas: number
        }[]
      }
      extender_reserva_30_min: {
        Args: {
          p_estado_cobro?: string
          p_medio_cobro?: string
          p_notas?: string
          p_reserva_id: string
        }
        Returns: string
      }
      extender_reserva_30_min_v2: {
        Args: {
          p_estado_cobro?: string
          p_medio_pago_id?: string
          p_notas?: string
          p_reserva_id: string
        }
        Returns: string
      }
      fn_bloques_disponibles_local: {
        Args: {
          p_bloques?: number
          p_deporte_id: string
          p_fecha: string
          p_local_id: string
        }
        Returns: {
          cantidad_canchas_disponibles: number
          fin: string
          inicio: string
        }[]
      }
      fn_calcular_lineas_tarifa: {
        Args: {
          p_cancha_id: string
          p_deporte_id: string
          p_fin: string
          p_inicio: string
        }
        Returns: {
          fin: string
          inicio: string
          minutos: number
          precio_base_por_hora: number
          precio_por_hora_aplicado: number
          promocion_id: string
          promocion_nombre: string
          regla_recurrente_id: string
          regla_recurrente_nombre: string
          subtotal: number
        }[]
      }
      fn_completar_reservas_finalizadas: { Args: never; Returns: undefined }
      fn_cupo_locales: { Args: { p_dueno_id: string }; Returns: number }
      fn_dias_semana_tarifa_validos: {
        Args: { p_dias: number[] }
        Returns: boolean
      }
      fn_expirar_reservas_pendientes: { Args: never; Returns: undefined }
      fn_finalizar_trials_vencidos: { Args: never; Returns: undefined }
      fn_huecos_libres_cancha: {
        Args: { p_cancha_id: string; p_fecha: string }
        Returns: {
          fin: string
          inicio: string
        }[]
      }
      fn_huecos_libres_local: {
        Args: { p_deporte_id?: string; p_fecha: string; p_local_id: string }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          fin: string
          inicio: string
        }[]
      }
      fn_normalizar_telefono: { Args: { p_telefono: string }; Returns: string }
      fn_ocupacion_tablero_local: {
        Args: { p_deporte_id?: string; p_fecha: string; p_local_id: string }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          es_excepcion_horaria: boolean
          fin: string
          inicio: string
          tipo: string
        }[]
      }
      fn_primer_nombre_visible: { Args: { p_nombre: string }; Returns: string }
      fn_puede_configurar_local: {
        Args: { p_actor_id: string; p_local_id: string }
        Returns: boolean
      }
      fn_reserva_ocupa_horario: {
        Args: {
          p_estado: Database["public"]["Enums"]["estado_reserva"]
          p_pago_expira_en: string
        }
        Returns: boolean
      }
      fn_rol_actual: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      guardar_cancha_local: {
        Args: {
          p_ancho_metros?: number
          p_cancha_id: string
          p_deportes: Json
          p_descripcion?: string
          p_largo_metros?: number
          p_local_id: string
          p_nombre: string
          p_superficie: string
        }
        Returns: string
      }
      guardar_regla_tarifaria: {
        Args: {
          p_activo?: boolean
          p_descuento_porcentaje?: number
          p_dias_semana?: number[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_hora_fin?: string
          p_hora_inicio?: string
          p_local_id?: string
          p_nombre?: string
          p_objetivos?: Json
          p_precio_por_hora?: number
          p_regla_id?: string
          p_tipo?: Database["public"]["Enums"]["tipo_regla_tarifa"]
          p_tipo_ajuste?: Database["public"]["Enums"]["tipo_ajuste_tarifa"]
        }
        Returns: string
      }
      marcar_notificaciones_leidas_cliente: {
        Args: { p_notificacion_id?: string }
        Returns: number
      }
      marcar_notificaciones_leidas_dueno: {
        Args: { p_notificacion_id?: string }
        Returns: number
      }
      marcar_notificaciones_leidas_dueno_local: {
        Args: { p_local_id: string }
        Returns: number
      }
      marcar_reserva_no_show_dueno: {
        Args: { p_motivo?: string; p_reserva_id: string }
        Returns: undefined
      }
      mercadopago_autorizar_conciliador_cron: {
        Args: { p_secret: string }
        Returns: boolean
      }
      mercadopago_cambiar_a_comprobante_prueba: {
        Args: {
          p_cliente_id: string
          p_medio_pago_id: string
          p_reserva_id: string
        }
        Returns: {
          pago_expira_en: string
          reserva_id: string
        }[]
      }
      mercadopago_cerrar_checkout_vencido_prueba: {
        Args: { p_intento_id: string; p_origen?: string }
        Returns: {
          cerrado: boolean
          reserva_id: string
        }[]
      }
      mercadopago_conciliar_pago_reserva_prueba: {
        Args: {
          p_comision_proveedor: number
          p_detalle_proveedor: string
          p_estado_proveedor: string
          p_evento_externo_id?: string
          p_fuente?: string
          p_intento_id: string
          p_neto_recibido: number
          p_payload: Json
          p_payment_id: string
        }
        Returns: {
          estado_intento: string
          estado_reserva: Database["public"]["Enums"]["estado_reserva"]
          reserva_id: string
        }[]
      }
      mercadopago_consumir_oauth_intento: {
        Args: { p_state_hash: string }
        Returns: {
          ambiente: string
          code_verifier: string
          dueno_id: string
        }[]
      }
      mercadopago_credencial_prueba: {
        Args: { p_dueno_id: string }
        Returns: {
          access_token: string
          dueno_id: string
          refresh_token: string
          token_expira_en: string
          vendedor_mp_id: string
        }[]
      }
      mercadopago_guardar_vinculacion: {
        Args: {
          p_access_token: string
          p_ambiente: string
          p_dueno_id: string
          p_expires_in: number
          p_refresh_token: string
          p_vendedor_mp_id: string
        }
        Returns: undefined
      }
      mercadopago_marcar_intento_revision_prueba: {
        Args: { p_detalle: string; p_intento_id: string }
        Returns: undefined
      }
      mercadopago_preparar_checkout_reserva_prueba: {
        Args: {
          p_bloques: number
          p_cancha_id: string
          p_cliente_id: string
          p_deporte_id: string
          p_idempotency_key: string
          p_inicio: string
          p_reserva_id?: string
        }
        Returns: {
          cancha_nombre: string
          checkout_expira_en: string
          dueno_id: string
          external_reference: string
          fin: string
          idempotency_key: string
          inicio: string
          intento_id: string
          monto_bruto: number
          preferencia_externa_id: string
          reserva_id: string
          vendedor_mp_id: string
        }[]
      }
      mercadopago_registrar_preferencia_reserva_prueba: {
        Args: { p_intento_id: string; p_preferencia_id: string }
        Returns: undefined
      }
      mercadopago_reservas_disponible_para_local: {
        Args: { p_local_id: string }
        Returns: boolean
      }
      mercadopago_solicitar_cancelacion_checkout_prueba: {
        Args: { p_expira_en: string; p_intento_id: string }
        Returns: {
          expira_en: string
          reserva_id: string
        }[]
      }
      moderacion_aplicar_medida: {
        Args: {
          p_local_id: string
          p_motivo: string
          p_notas_internas?: string
          p_tipo: string
          p_vigente_hasta?: string
        }
        Returns: string
      }
      moderacion_bloquea_operacion: {
        Args: { p_local_id: string }
        Returns: boolean
      }
      moderacion_bloquea_reservas: {
        Args: { p_local_id: string }
        Returns: boolean
      }
      moderacion_levantar_medida: {
        Args: { p_local_id: string; p_motivo?: string }
        Returns: boolean
      }
      moderacion_listar_activas_propietario: {
        Args: never
        Returns: {
          creada_at: string
          id: string
          local_id: string
          motivo: string
          tipo: string
          vigente_desde: string
          vigente_hasta: string
        }[]
      }
      moderacion_obtener_activa: {
        Args: { p_local_id: string }
        Returns: {
          creada_at: string
          id: string
          motivo: string
          tipo: string
          vigente_desde: string
          vigente_hasta: string
        }[]
      }
      obtener_beneficios_publicos_local: {
        Args: { p_local_id: string }
        Returns: {
          beneficio_catalogo_id: string
          categoria: string
          es_personalizado: boolean
          icon_key: string
          id: string
          nombre: string
          orden: number
          slug: string
        }[]
      }
      obtener_caja_local: {
        Args: { p_desde: string; p_hasta: string; p_local_id: string }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          cliente: string
          created_at: string
          fecha: string
          medio_tipo: string
          monto: number
          movimiento_id: string
          notas: string
          referencia: string
          reserva_id: string
          tipo: string
        }[]
      }
      obtener_canchas_local: {
        Args: { p_local_id: string }
        Returns: {
          ancho_metros: number
          cancha_id: string
          cancha_nombre: string
          deporte_icono: string
          deporte_id: string
          deporte_nombre: string
          descripcion: string
          largo_metros: number
          precio_por_hora: number
          superficie: string
          tipo_soporte: Database["public"]["Enums"]["tipo_soporte_deporte"]
        }[]
      }
      obtener_checklist_publicacion_local: {
        Args: { p_local_id: string }
        Returns: {
          acceso_operativo: boolean
          adelanto: boolean
          canchas_y_tarifas: boolean
          datos_generales: boolean
          galeria: boolean
          horarios: boolean
          listo_para_publicar: boolean
          logo: boolean
          medios_pago: boolean
          politica_reembolso: boolean
          ubicacion: boolean
        }[]
      }
      obtener_clientes_local_dueno: {
        Args: {
          p_busqueda?: string
          p_cancha_ids?: string[]
          p_limite?: number
          p_local_id: string
          p_offset?: number
        }
        Returns: {
          avatar_url: string | null
          canceladas: number
          cliente_id: string
          completadas: number
          confirmadas: number
          es_cuenta: boolean
          inasistencias: number
          monto_total: number
          nombre: string
          por_validar: number
          primera_reserva: string
          proxima_reserva: string
          rechazadas_pago: number
          telefono: string
          total_count: number
          total_reservas: number
          ultima_reserva: string
        }[]
      }
      obtener_clientes_reservas_dueno: {
        Args: { p_local_id: string; p_reserva_ids: string[] }
        Returns: {
          cliente_avatar_url: string | null
          cliente_nombre: string
          cliente_telefono: string
          reserva_id: string
        }[]
      }
      obtener_cobros_reporte_local: {
        Args: { p_desde: string; p_hasta: string; p_local_id: string }
        Returns: {
          cancha_id: string
          created_at: string
          deporte_id: string
          fecha: string
          medio: string
          monto: number
          movimiento_id: string
          notas: string
          reserva_id: string
          tipo: string
        }[]
      }
      obtener_cotizacion_publica_cancha: {
        Args: {
          p_bloques: number
          p_cancha_id: string
          p_deporte_id: string
          p_inicio: string
        }
        Returns: {
          fin: string
          inicio: string
          minutos: number
          precio_base_por_hora: number
          precio_por_hora_aplicado: number
          promocion_nombre: string
          regla_recurrente_nombre: string
          subtotal: number
        }[]
      }
      obtener_descuentos_publicos: {
        Args: { p_horizonte_dias?: number; p_limite?: number }
        Returns: {
          direccion: string
          fecha_fin: string
          fecha_inicio: string
          local_id: string
          local_nombre: string
          logo: string
          portada_storage_path: string
          precio_base_por_hora: number
          precio_descuento_por_hora: number
          regla_id: string
        }[]
      }
      obtener_detalle_publico_local: {
        Args: { p_local_id: string }
        Returns: {
          descripcion: string
          direccion: string
          id: string
          latitud: number
          logo: string
          longitud: number
          nombre: string
          portada_storage_path: string
          promedio: number
          telefono_contacto_principal: string
          telefono_contacto_secundario: string
          total_resenas: number
        }[]
      }
      obtener_disponibilidad_cancha_publica: {
        Args: { p_cancha_id: string; p_deporte_id: string; p_fecha: string }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          deporte_id: string
          deporte_reserva_nombre: string
          es_excepcion_horaria: boolean
          estado: string
          fin: string
          inicio: string
          ocupacion_fin: string
          ocupacion_inicio: string
          precio_por_hora: number
          primer_nombre_reservante: string
          promocion_nombre: string
          regla_recurrente_nombre: string
          reservable: boolean
        }[]
      }
      obtener_disponibilidad_inmediata_publica: {
        Args: { p_fecha?: string; p_limite?: number }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          deporte_id: string
          deporte_nombre: string
          direccion: string
          local_id: string
          local_nombre: string
          portada_storage_path: string
          superficie: string
          turnos: Json
          turnos_disponibles: number
        }[]
      }
      obtener_entitlement_suscripcion_propio: {
        Args: never
        Returns: {
          estado_facturacion: string
          max_sedes: number
          panel_habilitado: boolean
          reservas_habilitadas: boolean
          suscripcion_id: string
          vigente_hasta: string
          visibilidad_app_habilitada: boolean
        }[]
      }
      obtener_horarios_local: {
        Args: { p_local_id: string }
        Returns: {
          dia_semana: number
          hora_apertura: string
          hora_cierre: string
        }[]
      }
      obtener_locales_cercanos: {
        Args: {
          p_latitud: number
          p_limite?: number
          p_longitud: number
          p_radio_metros?: number
        }
        Returns: {
          direccion: string
          distancia_metros: number
          id: string
          logo: string
          nombre: string
          portada_storage_path: string
          promedio: number
          total_resenas: number
        }[]
      }
      obtener_locales_populares: {
        Args: { p_dias?: number; p_limite?: number }
        Returns: {
          direccion: string
          id: string
          logo: string
          nombre: string
          portada_storage_path: string
          promedio: number
          total_resenas: number
          total_reservas: number
        }[]
      }
      obtener_medios_pago_local: {
        Args: { p_local_id: string }
        Returns: {
          detalle: string
          tipo: string
        }[]
      }
      obtener_medios_pago_local_v2: {
        Args: { p_local_id: string }
        Returns: {
          banco: string
          cci: string
          id: string
          nombre_visible: string
          numero_cuenta: string
          qr_storage_path: string
          telefono: string
          tipo: string
          titular: string
        }[]
      }
      obtener_minimo_adelanto_global: { Args: never; Returns: number }
      obtener_minutos_expiracion_pago: { Args: never; Returns: number }
      obtener_parametros_plataforma: {
        Args: never
        Returns: {
          clave: string
          descripcion: string
          valor: Json
        }[]
      }
      obtener_proximos_turnos_locales_publicos: {
        Args: {
          p_fecha?: string
          p_limite_turnos?: number
          p_local_ids: string[]
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          deporte_id: string
          deporte_nombre: string
          local_id: string
          turnos: Json
        }[]
      }
      obtener_reglas_tarifarias_dueno: {
        Args: { p_local_id: string }
        Returns: {
          activo: boolean
          created_at: string
          descuento_porcentaje: number
          dias_semana: number[]
          fecha_fin: string
          fecha_inicio: string
          hora_fin: string
          hora_inicio: string
          id: string
          nombre: string
          objetivos: Json
          precio_por_hora: number
          tipo: Database["public"]["Enums"]["tipo_regla_tarifa"]
          tipo_ajuste: Database["public"]["Enums"]["tipo_ajuste_tarifa"]
          updated_at: string
        }[]
      }
      obtener_reservas_agenda_dueno: {
        Args: { p_fecha: string; p_local_id: string }
        Returns: {
          canal_origen: Database["public"]["Enums"]["canal_origen_reserva"]
          cancha_id: string
          cliente_nombre: string
          cliente_telefono: string
          comprobante_subido_at: string
          comprobante_url: string
          deporte_id: string
          es_excepcion_horaria: boolean
          estado: Database["public"]["Enums"]["estado_reserva"]
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_cobrado: number
          monto_reembolsado: number
          monto_total: number
          notas: string
          reserva_id: string
          saldo_pendiente: number
        }[]
      }
      obtener_reservas_cliente_local_dueno: {
        Args: {
          p_cliente_id?: string
          p_limite?: number
          p_local_id: string
          p_telefono?: string
        }
        Returns: {
          canal_origen: Database["public"]["Enums"]["canal_origen_reserva"]
          cancha_id: string
          cancha_nombre: string
          created_at: string
          deporte_id: string
          deporte_nombre: string
          es_excepcion_horaria: boolean
          estado: Database["public"]["Enums"]["estado_reserva"]
          fin: string
          inicio: string
          monto_adelanto_requerido: number
          monto_total: number
          reserva_id: string
        }[]
      }
      obtener_reservas_export_dueno: {
        Args: { p_desde?: string; p_hasta?: string; p_local_id: string }
        Returns: {
          canal: string
          cancelada_at: string
          cancha: string
          cliente: string
          created_at: string
          deporte: string
          estado: string
          extension_monto: number
          fin: string
          inicio: string
          monto_adelanto: number
          monto_cobrado: number
          monto_reembolsado: number
          monto_total: number
          motivo_cancelacion: string
          motivo_rechazo: string
          notas: string
          reembolso_resultado: string
          reserva_id: string
          saldo_pendiente: number
          telefono: string
          tiene_comprobante: boolean
        }[]
      }
      obtener_reservas_local: {
        Args: {
          p_deporte_id?: string
          p_desde: string
          p_hasta: string
          p_local_id: string
        }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          deporte_id: string
          deporte_nombre: string
          estado: string
          fin: string
          inicio: string
          reserver_nombre: string
          tipo: string
        }[]
      }
      obtener_resumen_pagos_reservas_dueno: {
        Args: { p_local_id: string; p_reserva_ids: string[] }
        Returns: {
          monto_cobrado: number
          monto_reembolsado: number
          movimientos: Json
          reserva_id: string
          saldo_pendiente: number
        }[]
      }
      obtener_resumen_tarjetas_locales_publicas: {
        Args: { p_local_ids: string[] }
        Returns: {
          beneficios: Json
          deportes: string[]
          local_id: string
          precio_desde: number
          tiene_descuento_hoy: boolean
        }[]
      }
      obtener_senales_mapa_publicas: {
        Args: {
          p_deporte_id?: string
          p_fecha?: string
          p_hora_fin?: string
          p_hora_inicio?: string
          p_local_ids: string[]
        }
        Returns: {
          deporte_nombre: string
          local_id: string
          precio_actual_desde: number
          precio_base_desde: number
          proxima_promocion_fecha: string
          proxima_promocion_precio: number
          proximo_turno: string
          tiene_descuento: boolean
          turnos_disponibles: number
        }[]
      }
      obtener_tarjetas_locales: {
        Args: { p_local_ids: string[] }
        Returns: {
          direccion: string
          id: string
          logo: string
          nombre: string
          portada_storage_path: string
          promedio: number
          total_resenas: number
        }[]
      }
      obtener_top_locales: {
        Args: never
        Returns: {
          direccion: string
          id: string
          logo: string
          nombre: string
          portada_storage_path: string
          promedio: number
          total_resenas: number
        }[]
      }
      otorgar_trial_local: {
        Args: { p_dias?: number; p_local_id: string }
        Returns: {
          estado: Database["public"]["Enums"]["estado_local"]
          fecha_fin_trial: string
        }[]
      }
      rechazar_reserva_pendiente_validacion: {
        Args: {
          p_comentario?: string
          p_motivo: Database["public"]["Enums"]["motivo_rechazo_pago"]
          p_reserva_id: string
        }
        Returns: undefined
      }
      rechazar_solicitud_local: {
        Args: { p_local_id: string; p_motivo: string }
        Returns: Database["public"]["Enums"]["estado_local"]
      }
      reclamar_push_pendientes: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          mensaje: string
          notificacion_id: string
          reserva_id: string
          titulo: string
          token: string
        }[]
      }
      reclamar_push_recibos: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          recibo_intentos: number
          ticket_id: string
          token: string
        }[]
      }
      reemplazar_beneficios_local: {
        Args: {
          p_beneficio_catalogo_ids: string[]
          p_beneficios_personalizados: string[]
          p_local_id: string
        }
        Returns: undefined
      }
      reemplazar_horarios_local: {
        Args: { p_horarios: Json; p_local_id: string }
        Returns: undefined
      }
      registrar_comprobante_reserva: {
        Args: { p_reserva_id: string; p_storage_path: string }
        Returns: undefined
      }
      registrar_foto_local: {
        Args: { p_local_id: string; p_storage_path: string }
        Returns: string
      }
      registrar_foto_cancha_local: {
        Args: { p_cancha_id: string; p_local_id: string; p_storage_path: string }
        Returns: string
      }
      registrar_movimiento_pago_reserva_dueno: {
        Args: {
          p_medio?: string
          p_monto: number
          p_notas?: string
          p_reserva_id: string
          p_tipo: string
        }
        Returns: undefined
      }
      registrar_movimiento_pago_reserva_dueno_v2: {
        Args: {
          p_medio_pago_id: string
          p_monto: number
          p_notas?: string
          p_referencia?: string
          p_reserva_id: string
        }
        Returns: undefined
      }
      registrar_push_token_cliente: {
        Args: { p_token: string }
        Returns: undefined
      }
      registrar_solicitud_propietario: {
        Args: {
          p_direccion: string
          p_dni: string
          p_latitud?: number
          p_longitud?: number
          p_nombre_local: string
          p_ruc: string
          p_telefono: string
        }
        Returns: {
          estado: Database["public"]["Enums"]["estado_local"]
          local_id: string
        }[]
      }
      reordenar_fotos_local: {
        Args: { p_foto_ids: string[]; p_local_id: string }
        Returns: undefined
      }
      reprogramar_reserva_dueno: {
        Args: { p_cancha_id: string; p_inicio: string; p_reserva_id: string }
        Returns: undefined
      }
      seleccionar_medio_pago_reserva_cliente: {
        Args: { p_medio_pago_id: string; p_reserva_id: string }
        Returns: undefined
      }
    }
    Enums: {
      canal_origen_reserva: "app" | "whatsapp" | "presencial"
      estado_local:
        | "pendiente_aprobacion"
        | "aprobado_pendiente_pago"
        | "trial"
        | "activo"
        | "en_gracia"
        | "suspendido"
        | "rechazado"
      estado_resena: "pendiente_aprobacion" | "aprobada" | "rechazada"
      estado_reserva:
        | "pendiente_pago"
        | "checkout_online"
        | "pago_en_proceso"
        | "pendiente_validacion"
        | "rechazada_pago"
        | "confirmada"
        | "completada"
        | "no_show"
        | "cancelada_cliente"
        | "cancelada_local"
        | "expirada"
      estado_suscripcion:
        | "sin_metodo_pago"
        | "activa"
        | "pago_fallido"
        | "cancelada"
      motivo_rechazo_pago:
        | "pago_no_recibido"
        | "monto_incorrecto"
        | "comprobante_ilegible"
        | "datos_no_coinciden"
        | "otro"
      resultado_reembolso: "no_aplica" | "solicitado" | "aprobado" | "rechazado"
      rol_usuario: "cliente" | "dueno" | "super_admin"
      tipo_ajuste_tarifa: "precio_fijo" | "descuento_porcentaje"
      tipo_entidad_reporte: "resena" | "foto"
      tipo_regla_tarifa: "recurrente" | "promocion"
      tipo_soporte_deporte: "dedicada" | "adaptada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      canal_origen_reserva: ["app", "whatsapp", "presencial"],
      estado_local: [
        "pendiente_aprobacion",
        "aprobado_pendiente_pago",
        "trial",
        "activo",
        "en_gracia",
        "suspendido",
        "rechazado",
      ],
      estado_resena: ["pendiente_aprobacion", "aprobada", "rechazada"],
      estado_reserva: [
        "pendiente_pago",
        "checkout_online",
        "pago_en_proceso",
        "pendiente_validacion",
        "rechazada_pago",
        "confirmada",
        "completada",
        "no_show",
        "cancelada_cliente",
        "cancelada_local",
        "expirada",
      ],
      estado_suscripcion: [
        "sin_metodo_pago",
        "activa",
        "pago_fallido",
        "cancelada",
      ],
      motivo_rechazo_pago: [
        "pago_no_recibido",
        "monto_incorrecto",
        "comprobante_ilegible",
        "datos_no_coinciden",
        "otro",
      ],
      resultado_reembolso: ["no_aplica", "solicitado", "aprobado", "rechazado"],
      rol_usuario: ["cliente", "dueno", "super_admin"],
      tipo_ajuste_tarifa: ["precio_fijo", "descuento_porcentaje"],
      tipo_entidad_reporte: ["resena", "foto"],
      tipo_regla_tarifa: ["recurrente", "promocion"],
      tipo_soporte_deporte: ["dedicada", "adaptada"],
    },
  },
} as const
