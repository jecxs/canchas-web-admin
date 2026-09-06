import { describe, expect, it } from 'vitest'
import {
  resolveActiveLocal,
  resolveLocalDestination,
  resolvePostLoginDestination,
  type AccessContext,
  type LocalState,
} from './access'

function context(
  role: AccessContext['profile']['rol'],
  states: LocalState[] = [],
): AccessContext {
  return {
    userId: 'user-1',
    avatarUrl: null,
    profile: {
      id: 'user-1',
      nombre_completo: 'Usuario de prueba',
      email: 'usuario@grassly.test',
      telefono: null,
      dni: null,
      rol: role,
    },
    locals: states.map((estado, index) => ({
      id: `local-${index}`,
      nombre: `Local ${index}`,
      direccion: 'Ayacucho',
      ruc: null,
      estado,
      fecha_fin_trial: null,
      motivo_rechazo: null,
      publicado: false,
      publicado_at: null,
      created_at: new Date(2026, 0, index + 1).toISOString(),
    })),
    subscription: null,
  }
}

describe('resolvePostLoginDestination', () => {
  it('envía al super administrador a su panel aunque no tenga locales', () => {
    expect(resolvePostLoginDestination(context('super_admin'))).toBe('/admin')
  })

  it.each(['trial', 'activo', 'en_gracia'] satisfies LocalState[])(
    'envía un local %s al panel del dueño',
    (state) => {
      expect(resolvePostLoginDestination(context('dueno', [state]))).toBe(
        '/panel',
      )
    },
  )

  it('prioriza un local operativo cuando el dueño tiene varios', () => {
    expect(
      resolvePostLoginDestination(
        context('dueno', ['suspendido', 'activo']),
      ),
    ).toBe('/panel')
  })

  it('envía al dueño aprobado sin pago al flujo de suscripción', () => {
    expect(
      resolvePostLoginDestination(
        context('dueno', ['aprobado_pendiente_pago']),
      ),
    ).toBe('/panel/suscripcion')
  })

  it('envía al dueño suspendido a su estado específico', () => {
    expect(
      resolvePostLoginDestination(context('dueno', ['suspendido'])),
    ).toBe('/panel/suspendido')
  })

  it('maneja una cuenta dueña heredada sin locales sin crear un bucle', () => {
    expect(resolvePostLoginDestination(context('dueno'))).toBe(
      '/panel/sin-local',
    )
  })

  it('envía una cuenta dueña heredada con solicitud pendiente a su estado', () => {
    expect(
      resolvePostLoginDestination(context('dueno', ['pendiente_aprobacion'])),
    ).toBe('/estado-solicitud')
  })

  it.each(['pendiente_aprobacion', 'rechazado'] satisfies LocalState[])(
    'envía una solicitud cliente %s a su pantalla de estado',
    (state) => {
      expect(resolvePostLoginDestination(context('cliente', [state]))).toBe(
        '/estado-solicitud',
      )
    },
  )

  it('envía un cliente sin solicitud a completar registro', () => {
    expect(resolvePostLoginDestination(context('cliente'))).toBe(
      '/completar-registro',
    )
  })
})

describe('resolveActiveLocal', () => {
  it('respeta un local solicitado cuando pertenece al dueño', () => {
    const access = context('dueno', ['activo', 'suspendido'])
    expect(resolveActiveLocal(access.locals, 'local-1')?.id).toBe('local-1')
  })

  it('ignora un id ajeno y prioriza un local operativo', () => {
    const access = context('dueno', ['suspendido', 'trial'])
    expect(resolveActiveLocal(access.locals, 'local-ajeno')?.id).toBe(
      'local-1',
    )
  })

  it('devuelve null cuando el dueño todavía no tiene locales', () => {
    expect(resolveActiveLocal([], 'local-ajeno')).toBeNull()
  })
})

describe('resolveLocalDestination', () => {
  it.each(['trial', 'activo', 'en_gracia'] satisfies LocalState[])(
    'lleva un local %s al panel operativo',
    (state) => expect(resolveLocalDestination(state)).toBe('/panel'),
  )

  it('separa pago, suspensión y solicitud', () => {
    expect(resolveLocalDestination('aprobado_pendiente_pago')).toBe(
      '/panel/suscripcion',
    )
    expect(resolveLocalDestination('suspendido')).toBe('/panel/suspendido')
    expect(resolveLocalDestination('rechazado')).toBe('/estado-solicitud')
  })
})
