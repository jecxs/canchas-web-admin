export type PublicationChecklist = {
  access: boolean
  generalData: boolean
  location: boolean
  logo: boolean
  gallery: boolean
  schedules: boolean
  courtsAndRates: boolean
  advance: boolean
  paymentMethods: boolean
  refundPolicy: boolean
  ready: boolean
}

export type PublicationActionState = {
  success: boolean
  message?: string
}

export const initialPublicationActionState: PublicationActionState = {
  success: false,
}
