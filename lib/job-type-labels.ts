/** Etichetta display per tipo job/request. 'stage' mostrato come Tirocinio. */
export function getJobTypeLabel(type: string | null | undefined): string {
  if (!type) return ''
  if (type === 'stage') return 'Tirocinio'
  const labels: Record<string, string> = {
    tirocinio: 'Tirocinio',
    collaborazione: 'Collaborazione',
    lavoro: 'Lavoro',
    tesi: 'Tesi',
  }
  return labels[type] || type
}
