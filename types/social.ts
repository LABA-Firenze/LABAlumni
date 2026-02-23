// Social Network Types

export interface Post {
  id: string
  user_id: string
  type: 'text' | 'image' | 'video' | 'job' | 'portfolio' | 'thesis' | 'collaboration_request'
  content: string
  images: string[] | null
  video_url: string | null
  job_post_id: string | null
  portfolio_item_id: string | null
  thesis_proposal_id: string | null
  request_type?: 'tirocinio' | 'stage' | 'collaborazione' | 'lavoro' | 'tesi' | null
  request_courses?: string[] | null
  request_from?: 'student' | 'company' | null
  available_days?: string | null
  available_hours_total?: number | null
  work_hours?: number | null
  interested_days?: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at: string
  // Extended fields (from joins)
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: 'student' | 'company'
  }
  job_post?: any
  portfolio_item?: PortfolioItem
  student_course?: string
  thesis_proposal?: ThesisProposal
  is_liked?: boolean
  comments?: PostComment[]
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface StudentConnection {
  id: string
  student1_id: string
  student2_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  // Extended fields
  student1?: any
  student2?: any
}

export interface PortfolioItem {
  id: string
  student_id: string
  title: string
  description: string | null
  images: string[]
  video_url: string | null
  category: string | null
  tags: string[] | null
  year: number | null
  created_at: string
  updated_at: string
  // Extended fields
  student?: any
}

export interface ThesisProposal {
  id: string
  student_id: string
  title: string
  description: string
  objectives: string | null
  methodology: string | null
  documents: string[] | null
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  // Extended fields
  student?: any
}

export interface CompanyFollow {
  id: string
  student_id: string
  company_id: string
  created_at: string
  // Extended fields
  company?: any
}

