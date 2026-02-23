import { Clock, CheckCircle, XCircle, LucideIcon } from 'lucide-react'

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export const APPLICATION_STATUS_CONFIG: Record<
  ApplicationStatus,
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'In attesa' },
  accepted: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Accettata' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rifiutata' },
}
