export type PaymentMethodType = 'yape' | 'plin' | 'transferencia' | 'efectivo' | 'otro'

export type LocalPaymentMethod = {
  id: string
  type: PaymentMethodType
  name: string
  holder: string | null
  phone: string | null
  bank: string | null
  accountNumber: string | null
  cci: string | null
  active: boolean
}

export const paymentMethodLabels: Record<PaymentMethodType, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo',
  otro: 'Otro',
}

export function paymentMethodOptionLabel(method: LocalPaymentMethod) {
  const detail = method.type === 'transferencia'
    ? method.bank
    : method.type === 'yape' || method.type === 'plin'
      ? method.holder
      : null
  return detail ? `${method.name} · ${detail}` : method.name
}
