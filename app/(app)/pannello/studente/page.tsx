'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase, Users, ArrowRight, Building2 } from 'lucide-react'
import Link from 'next/link'
import type { Student, JobPost, Application } from '@/types/database'
import type { Post } from '@/types/social'
import { PostCard } from '@/components/PostCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profileName, setProfileName] = useState<string | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [applications, setApplications] = useState<(Application & { job_post: JobPost })[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [suggestedJobs, setSuggestedJobs] = useState<(JobPost & { company: { company_name: string } })[]>([])
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
        if (!postsData.length) {
          const { data: jobs } = await supabase
            .from('job_posts')
            .select(`*, company:companies(company_name)`)
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(3)
          setSuggestedJobs((jobs || []) as (JobPost & { company: { company_name: string } })[])
        } else {
          setSuggestedJobs([])
        }
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
      <div className="space-y-4">
        <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6 animate-pulse">
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
            {/* Hero / Pubblicazione - CTA diretta */}
            <Card variant="elevated" className="p-5 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cerchi uno stage o vuoi proporre una collaborazione?
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Pubblica una richiesta o scopri opportunità attive.
                  </p>
                </div>
                <Link href="/richieste/nuova" className="shrink-0">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Pubblica richiesta
                  </Button>
                </Link>
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
              <div className="space-y-6">
                {/* Stato vuoto motivazionale */}
                <Card variant="elevated" className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Qui iniziano le tue opportunità.</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Segui aziende e studenti per scoprire stage, collaborazioni e progetti.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/annunci">
                      <Button variant="primary" size="lg">Scopri opportunità</Button>
                    </Link>
                    <Link href="/profilo">
                      <Button variant="outline" size="lg">Completa il tuo profilo</Button>
                    </Link>
                  </div>
                </Card>

                {/* Stage suggeriti / in evidenza */}
                {suggestedJobs.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Opportunità in evidenza</h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {suggestedJobs.map((job) => (
                        <Link key={job.id} href={`/annunci/${job.id}`}>
                          <Card variant="elevated" className="p-4 hover:shadow-lg transition-shadow h-full">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{job.title}</p>
                                <p className="text-sm text-gray-500 truncate">{job.company?.company_name}</p>
                                <span className="inline-block mt-2 text-xs text-primary-600 font-medium">
                                  Vedi dettagli <ArrowRight className="w-3 h-3 inline" />
                                </span>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <Link href="/annunci" className="block mt-4 text-center text-primary-600 hover:underline font-medium text-sm">
                      Vedi tutte le opportunità →
                    </Link>
                  </div>
                )}
              </div>
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
