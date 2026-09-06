import type { ReactNode } from 'react'
import {
  Clock01Icon,
  CreditCardNotFoundIcon,
  LockKeyIcon,
  UnavailableIcon,
} from '@hugeicons/core-free-icons'
import { StatePanel } from './state-panel'

type BusinessStateProps = {
  children?: ReactNode
  className?: string
}

export function AccessDeniedState({ children, className }: BusinessStateProps) {
  return (
    <StatePanel
      icon={LockKeyIcon}
      eyebrow="Acceso restringido"
      title="No tienes acceso a este espacio"
      description="Tu cuenta no cuenta con los permisos necesarios para ver o modificar esta información."
      tone="danger"
      className={className}
    >
      {children}
    </StatePanel>
  )
}

export function SuspendedLocalState({
  localName,
  children,
  className,
}: BusinessStateProps & { localName?: string }) {
  return (
    <StatePanel
      icon={UnavailableIcon}
      eyebrow="Local suspendido"
      title="El panel operativo está restringido"
      description={`${localName ? `${localName} está` : 'Este local está'} suspendido temporalmente. Comunícate con el equipo de Grassly para conocer el motivo y regularizar el acceso.`}
      tone="danger"
      className={className}
    >
      {children}
    </StatePanel>
  )
}

export function PendingApprovalState({
  children,
  className,
}: BusinessStateProps) {
  return (
    <StatePanel
      icon={Clock01Icon}
      eyebrow="Pendiente de aprobación"
      title="Solicitud recibida"
      description="El equipo de Grassly revisará los datos de tu local antes de habilitar el panel. Te avisaremos cuando la evaluación termine."
      tone="info"
      className={className}
    >
      {children}
    </StatePanel>
  )
}

export function RejectedApplicationState({
  children,
  className,
}: BusinessStateProps) {
  return (
    <StatePanel
      icon={UnavailableIcon}
      eyebrow="Requiere corrección"
      title="Tu solicitud tiene una observación"
      description="Revisa el detalle indicado por el equipo de Grassly y envía nuevamente la información corregida."
      tone="danger"
      className={className}
    >
      {children}
    </StatePanel>
  )
}

export function SubscriptionRequiredState({
  localName,
  children,
  className,
}: BusinessStateProps & { localName?: string }) {
  return (
    <StatePanel
      icon={CreditCardNotFoundIcon}
      eyebrow="Local aprobado"
      title="Falta activar la suscripción"
      description={`${localName ? `${localName} ya fue aprobado.` : 'Tu local ya fue aprobado.'} Activa el plan de Grassly para acceder a las herramientas operativas.`}
      tone="warning"
      className={className}
    >
      {children}
    </StatePanel>
  )
}
