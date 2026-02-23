'use client'

type RoleType = 'student' | 'company' | 'docente'

const ROLE_CONFIG: Record<RoleType, { label: string; className: string }> = {
  student: { label: 'Studente', className: 'bg-primary-100 text-primary-700 border-primary-200' },
  docente: { label: 'Docente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  company: { label: 'Azienda', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

interface ProfilePillProps {
  role: RoleType | string | null
  className?: string
}

export function ProfilePill({ role, className = '' }: ProfilePillProps) {
  const r = role as RoleType
  if (!r || !ROLE_CONFIG[r]) return null

  const config = ROLE_CONFIG[r]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
