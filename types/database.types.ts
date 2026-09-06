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
    PostgrestVersion: "14.5"
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
          created_at: string
          id: string
          local_id: string
          nombre: string
          superficie: string | null
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          local_id: string
          nombre: string
          superficie?: string | null
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
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
      reserva_extensiones: {
        Row: {
          adelanto_adicional_requerido: number
          autorizado_por: string
          created_at: string
          estado_cobro: string
          id: string
          medio_cobro: string | null
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
          monto_adelanto_requerido: number
          monto_total: number
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
          monto_adelanto_requerido: number
          monto_total: number
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
          monto_adelanto_requerido?: number
          monto_total?: number
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
          created_at: string
          dueno_id: string
          estado: Database["public"]["Enums"]["estado_suscripcion"]
          fecha_proximo_cobro: string | null
          id: string
          mercadopago_preapproval_id: string | null
          monto: number
          sedes_extra_contratadas: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dueno_id: string
          estado?: Database["public"]["Enums"]["estado_suscripcion"]
          fecha_proximo_cobro?: string | null
          id?: string
          mercadopago_preapproval_id?: string | null
          monto?: number
          sedes_extra_contratadas?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dueno_id?: string
          estado?: Database["public"]["Enums"]["estado_suscripcion"]
          fecha_proximo_cobro?: string | null
          id?: string
          mercadopago_preapproval_id?: string | null
          monto?: number
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
      actualizar_reglas_comerciales_local: {
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
      buscar_clientes_para_dueno: {
        Args: { p_busqueda: string; p_limite?: number }
        Returns: {
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
      cambiar_estado_cancha_local: {
        Args: { p_activa: boolean; p_cancha_id: string; p_local_id: string }
        Returns: boolean
      }
      cambiar_publicacion_local: {
        Args: { p_local_id: string; p_publicado: boolean }
        Returns: boolean
      }
      confirmar_reserva: { Args: { p_reserva_id: string }; Returns: undefined }
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
      eliminar_foto_local: {
        Args: { p_foto_id: string; p_local_id: string }
        Returns: string
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
      fn_completar_reservas_finalizadas: { Args: never; Returns: undefined }
      fn_cupo_locales: { Args: { p_dueno_id: string }; Returns: number }
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
          p_cancha_id: string
          p_deportes: Json
          p_local_id: string
          p_nombre: string
          p_superficie: string
        }
        Returns: string
      }
      obtener_canchas_local: {
        Args: { p_local_id: string }
        Returns: {
          cancha_id: string
          cancha_nombre: string
          deporte_icono: string
          deporte_id: string
          deporte_nombre: string
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
      obtener_horarios_local: {
        Args: { p_local_id: string }
        Returns: {
          dia_semana: number
          hora_apertura: string
          hora_cierre: string
        }[]
      }
      obtener_locales_cercanos: {
        Args: { p_latitud: number; p_limite?: number; p_longitud: number }
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
      tipo_entidad_reporte: "resena" | "foto"
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
      tipo_entidad_reporte: ["resena", "foto"],
      tipo_soporte_deporte: ["dedicada", "adaptada"],
    },
  },
} as const
