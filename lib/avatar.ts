/** Iniziali per avatar: prima lettera nome + prima lettera cognome. Es. "Vittoria Ricceri" -> "VR" */
export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0][0] || '?').toUpperCase()
  const first = (parts[0][0] || '').toUpperCase()
  const last = (parts[parts.length - 1][0] || '').toUpperCase()
  return (first + last) || '?'
}
