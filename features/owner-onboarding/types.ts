export type ActionState<TFields extends object> = {
  success: boolean
  message?: string
  fieldErrors?: Partial<Record<keyof TFields, string[]>>
  values?: Partial<TFields>
}

export type OwnerApplicationFields = {
  nombreLocal: string
  telefono: string
  dni: string
  direccion: string
  ruc: string
}

export type OwnerApplicationActionState = ActionState<OwnerApplicationFields>

export const initialOwnerApplicationState: OwnerApplicationActionState = {
  success: false,
}
