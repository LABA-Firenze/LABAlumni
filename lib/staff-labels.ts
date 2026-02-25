import { COURSE_CONFIG } from '@/types/database'
import type { CourseType } from '@/types/database'

/** Email → etichetta display per membri staff (non mostrare corso/anno da LOGOS) */
export const STAFF_EMAIL_LABELS: Record<string, string> = {
  'matteo.coppola@labafirenze.com': 'Resp. ORIENTAMENTO e PLACEMENT',
  'alessia.pasqui@labafirenze.com': 'ORIENTAMENTO',
  'simone.azzinelli@labafirenze.com': 'RESPONSABILE IT',
}

export function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() in STAFF_EMAIL_LABELS
}

export function getStaffLabel(email: string | null | undefined): string | null {
  if (!email) return null
  return STAFF_EMAIL_LABELS[email.toLowerCase()] ?? null
}

/** Etichetta da mostrare per uno studente: display_label (staff) o corso */
export function getStudentDisplayLabel(student: {
  display_label?: string | null
  course?: string | null
}): string {
  if (student?.display_label) return student.display_label
  const course = student?.course
  if (course) return COURSE_CONFIG[course as CourseType]?.name || (course as string)
  return ''
}
