// Export social types
export * from './social'

export type UserRole = 'student' | 'company' | 'docente' | 'admin'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type CourseType = 
  | 'graphic-design-multimedia'
  | 'regia-videomaking'
  | 'fotografia'
  | 'fashion-design'
  | 'pittura'
  | 'design'
  | 'interior-design'
  | 'cinema-audiovisivi'

export interface Profile {
  id: string
  role: UserRole
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  course: CourseType | null
  bio: string | null
  onboarding_completed?: boolean
  portfolio_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  website_url: string | null
  year: number | null
  academic_year: string | null
  phone: string | null
  matricola: string | null
  display_label: string | null
  last_year_update: string | null
  created_at: string
  updated_at: string
}

export interface Docente {
  id: string
  bio: string | null
  courses: CourseType[]
  can_relatore: boolean
  can_corelatore: boolean
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  company_name: string
  description: string | null
  website_url: string | null
  logo_url: string | null
  industry: string | null
  partita_iva: string | null
  address: string | null
  city: string | null
  cap: string | null
  province: string | null
  country: string | null
  created_at: string
  updated_at: string
}

export interface JobPost {
  id: string
  company_id: string
  title: string
  description: string
  type: string
  courses: CourseType[]
  location: string | null
  remote: boolean
  active: boolean
  /** Scadenza candidature (YYYY-MM-DD) */
  deadline?: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  job_post_id: string
  student_id: string
  status: ApplicationStatus
  message: string | null
  created_at: string
  updated_at: string
}

export interface CommunityPost {
  id: string
  company_id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  read: boolean
  created_at: string
}

// Helper types
export const COURSE_CONFIG: Record<CourseType, { name: string; type: 'triennio' | 'biennio'; maxYear: number }> = {
  'graphic-design-multimedia': { name: 'Graphic Design & Multimedia', type: 'triennio', maxYear: 3 },
  'regia-videomaking': { name: 'Regia e Videomaking', type: 'triennio', maxYear: 3 },
  'fotografia': { name: 'Fotografia', type: 'triennio', maxYear: 3 },
  'fashion-design': { name: 'Fashion Design', type: 'triennio', maxYear: 3 },
  'pittura': { name: 'Pittura', type: 'triennio', maxYear: 3 },
  'design': { name: 'Design', type: 'triennio', maxYear: 3 },
  'interior-design': { name: 'Interior Design', type: 'biennio', maxYear: 2 },
  'cinema-audiovisivi': { name: 'Cinema e Audiovisivi', type: 'biennio', maxYear: 2 },
}

/** Colori per corso (sfondi iniziali e cover profilo). Aziende = nero, Docenti = arancione; studenti per corso. */
export const COURSE_COLORS: Record<CourseType, { circle: string; cover: string }> = {
  'graphic-design-multimedia': { circle: 'from-violet-500 to-violet-700', cover: 'from-violet-500 via-violet-600 to-violet-700' },
  'regia-videomaking': { circle: 'from-emerald-500 to-emerald-700', cover: 'from-emerald-500 via-emerald-600 to-emerald-700' },
  'fotografia': { circle: 'from-sky-500 to-sky-700', cover: 'from-sky-500 via-sky-600 to-sky-700' },
  'fashion-design': { circle: 'from-pink-500 to-pink-700', cover: 'from-pink-500 via-pink-600 to-pink-700' },
  'pittura': { circle: 'from-rose-500 to-rose-700', cover: 'from-rose-500 via-rose-600 to-rose-700' },
  'design': { circle: 'from-indigo-500 to-indigo-700', cover: 'from-indigo-500 via-indigo-600 to-indigo-700' },
  'interior-design': { circle: 'from-teal-500 to-teal-700', cover: 'from-teal-500 via-teal-600 to-teal-700' },
  'cinema-audiovisivi': { circle: 'from-purple-500 to-purple-700', cover: 'from-purple-500 via-purple-600 to-purple-700' },
}

/** Gradient per cerchio iniziale e cover in base a ruolo (e corso se studente). Company = nero, Docente = arancione. */
export function getProfileGradient(role: UserRole, course?: CourseType | null): { circle: string; cover: string } {
  if (role === 'company') return { circle: 'from-gray-800 to-gray-900', cover: 'from-gray-800 via-gray-900 to-gray-950' }
  if (role === 'docente') return { circle: 'from-amber-500 to-amber-600', cover: 'from-amber-500 via-amber-600 to-amber-700' }
  const c = course && course in COURSE_COLORS ? COURSE_COLORS[course as CourseType] : COURSE_COLORS['graphic-design-multimedia']
  return c
}

export function getCourseInfo(course: CourseType) {
  return COURSE_CONFIG[course]
}

export function getValidYearsForCourse(course: CourseType): number[] {
  const config = COURSE_CONFIG[course]
  if (config.type === 'triennio') {
    return [2, 3] // Solo 2° e 3° anno per trienni (1° anno = auditor)
  } else {
    return [1, 2] // 1° e 2° anno per bienni
  }
}
