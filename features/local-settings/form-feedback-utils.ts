const fieldLabels: Record<string, string> = {
  name: 'Nombre comercial',
  ruc: 'RUC',
  description: 'Descripción',
  primaryPhone: 'Celular principal',
  secondaryPhone: 'Celular secundario',
  address: 'Dirección',
  latitude: 'Latitud',
  longitude: 'Longitud',
  advancePercentage: 'Porcentaje de adelanto',
  paymentMethods: 'Medios de pago',
  refundPolicy: 'Política de cancelación y reembolso',
  schedules: 'Horarios de atención',
  catalogIds: 'Beneficios estándar',
  customBenefits: 'Beneficios personalizados',
}

type ValidationFeedback = {
  title: string
  description: string
}

export function getSettingsValidationFeedback(
  fieldErrors: Record<string, string[] | undefined> | undefined,
): ValidationFeedback | null {
  const issues = Object.entries(fieldErrors ?? {})
    .flatMap(([field, messages]) => messages?.map((message) => ({
      field: fieldLabels[field] ?? 'Campo por corregir',
      message,
    })) ?? [])

  if (issues.length === 0) return null

  const visibleIssues = issues.slice(0, 3)
  const remainingIssues = issues.length - visibleIssues.length
  const description = visibleIssues
    .map(({ field, message }) => `${field}: ${message}`)
    .join(' · ')
    .concat(remainingIssues > 0 ? ` · y ${remainingIssues} ${remainingIssues === 1 ? 'error más' : 'errores más'}.` : '')

  return {
    title: issues.length === 1 ? 'Corrige este campo' : `Corrige ${issues.length} campos`,
    description,
  }
}
