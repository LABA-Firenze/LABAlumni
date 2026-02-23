// Export social types
export * from './social'

export type UserRole = 'student' | 'company' | 'docente'
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
  course: CourseType
  bio: string | null
  portfolio_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  website_url: string | null
  year: number | null
  phone: string | null
  matricola: string | null
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
