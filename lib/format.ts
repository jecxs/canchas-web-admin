const MONEY = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Moneda peruana canónica para toda la app: "S/ 40.00". */
export function formatMoney(value: number) {
  return MONEY.format(value)
}

/** Moneda compacta para espacios reducidos: "S/ 40" cuando no hay centavos. */
export function formatMoneyShort(value: number) {
  return MONEY.format(value).replace(/\.00$/, '')
}
