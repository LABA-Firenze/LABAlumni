'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import type { Company, JobPost, Application } from '@/types/database'
import type { Post } from '@/types/social'
import { PostCard } from '@/components/PostCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function CompanyDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [applications, setApplications] = useState<(Application & { student: any; job_post: JobPost })[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postLoading, setPostLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      loadCompanyData()
      loadCompanyPosts()
    }
  }, [user, authLoading, router])

  const loadCompanyData = async () => {
    if (!user) return

    try {
      // Get company profile
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .single()

      setCompany(companyData)

      // Get job posts
      const { data: jobsData } = await supabase
        .from('job_posts')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setJobPosts(jobsData || [])

      // Get recent applications
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          job_post:job_posts(*),
          student:students(id, course)
        `)
        .in('job_post_id', jobsData?.map((j: any) => j.id) || [])
        .order('created_at', { ascending: false })
        .limit(5)

      setApplications(applicationsData || [])
    } catch (error) {
      console.error('Error loading company data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyPosts = async () => {
    if (!user) return

    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role),
          portfolio_item:portfolio_items(id, title, images)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (postsData) {
        const studentUserIds = [...new Set(
          postsData
            .filter(p => p.type === 'collaboration_request' && p.request_from !== 'company')
            .map(p => p.user_id)
        )]
        let studentCourses: Record<string, string> = {}
        if (studentUserIds.length > 0) {
          const { data: studentsData } = await supabase
            .from('students')
            .select('id, course')
            .in('id', studentUserIds)
          studentsData?.forEach((s: { id: string; course: string }) => {
            studentCourses[s.id] = s.course
          })
        }

        const { data: likedPosts } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id))
        const likedPostIds = new Set(likedPosts?.map(l => l.post_id) || [])

        setPosts(postsData.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
          student_course: studentCourses[post.user_id],
        })) || [])
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setPostLoading(false)
    }
  }

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)

    if (!error) {
      loadCompanyData()
    }
  }

  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
            {/* Create Post Card */}
            <Card variant="interactive" padding={false} className="p-4 bg-gradient-to-r from-primary-50 via-primary-50/80 to-primary-100/90 border-primary-200/60 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white">
                  <Briefcase className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1">
                  <Link href="/post/azienda/nuovo">
                    <input
                      type="text"
                      placeholder="Pubblica un annuncio, progetto o novità aziendale..."
                      className="w-full px-4 py-2 border border-primary-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer bg-white"
                      readOnly
                    />
                  </Link>
                  <p className="text-xs text-gray-600 mt-1 ml-4">
                    Solo aziende: condividi contenuti con la community
                  </p>
                </div>
              </div>
            </Card>

            {/* Feed Posts */}
            {postLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card variant="elevated" className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nessun post ancora</h3>
                <p className="text-gray-600 mb-6">Inizia a condividere contenuti con la community!</p>
                <Link href="/post/azienda/nuovo">
                  <Button variant="primary">Pubblica il Primo Post</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onUpdate={loadCompanyPosts}
                  />
                ))}
              </div>
            )}
    </div>
  )
}
