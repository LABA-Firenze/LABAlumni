'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Student, JobPost, Application } from '@/types/database'
import type { Post } from '@/types/social'
import { PostCard } from '@/components/PostCard'

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profileName, setProfileName] = useState<string | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [applications, setApplications] = useState<(Application & { job_post: JobPost })[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [portfolioCount, setPortfolioCount] = useState(0)
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [postLoading, setPostLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      loadStudentData()
      loadFeedPosts()
    }
  }, [user, authLoading, router])

  const loadStudentData = async () => {
    if (!user) return

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setProfileName(profileData?.full_name || null)

      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single()

      setStudent(studentData)

      // Get applications
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          job_post:job_posts(*)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setApplications(applicationsData || [])

      // Get portfolio count
      const { count: portfolioCountData } = await supabase
        .from('portfolio_items')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)

      setPortfolioCount(portfolioCountData || 0)

      // Get connections count
      const { count: connectionsCountData } = await supabase
        .from('student_connections')
        .select('*', { count: 'exact', head: true })
        .or(`student1_id.eq.${user.id},student2_id.eq.${user.id}`)
        .eq('status', 'accepted')

      setConnectionsCount(connectionsCountData || 0)
    } catch (error) {
      console.error('Error loading student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFeedPosts = async () => {
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
        // Per collaboration_request da studenti, carica il corso
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
      console.error('Error loading feed:', error)
    } finally {
      setPostLoading(false)
    }
  }


  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
            {/* Create Collaboration Request Card - blu per interattività */}
            <Card variant="interactive" padding={false} className="p-4 bg-gradient-to-r from-primary-50 via-primary-50/80 to-primary-100/90 border-primary-200/60 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white">
                  <Briefcase className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1">
                  <Link href="/richieste/nuova">
                    <input
                      type="text"
                      placeholder="Pubblica una richiesta di collaborazione, tirocinio o stage..."
                      className="w-full px-4 py-3 border border-primary-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 cursor-pointer bg-white shadow-sm"
                      readOnly
                    />
                  </Link>
                  <p className="text-xs text-gray-600 mt-1 ml-4">
                    Solo studenti: pubblica richieste di opportunità lavorative
                  </p>
                </div>
              </div>
            </Card>

            {/* Feed Posts */}
            {postLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} variant="elevated" className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-48 bg-gray-200 rounded"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card variant="elevated" className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Il tuo feed è vuoto</h3>
                <p className="text-gray-600 mb-6">Inizia a seguire aziende e studenti per vedere i loro post!</p>
                <Link href="/annunci">
                  <Button variant="primary">Esplora Tirocini e Stage</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onUpdate={loadFeedPosts}
                  />
                ))}
              </div>
            )}
    </div>
  )
}
