const percentageFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 2,
})

export function formatAdvancePercentage(value: number) {
  return percentageFormatter.format(value)
}

export function getMinimumAdvanceDescription(minimumAdvancePercentage: number) {
  return `Grassly exige un adelanto mínimo de ${formatAdvancePercentage(minimumAdvancePercentage)}%. Puedes configurar un porcentaje mayor para tu local.`
}

export function getMinimumAdvanceValidationMessage(minimumAdvancePercentage: number) {
  return `El adelanto debe ser de al menos ${formatAdvancePercentage(minimumAdvancePercentage)}%, según la política vigente de Grassly.`
}
