'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BriefcaseIcon, UsersIcon, ArrowRightIcon, BuildingOffice2Icon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import type { Student, JobPost, Application } from '@/types/database'
import { getStudentDisplayLabel } from '@/lib/staff-labels'
import type { Post } from '@/types/social'
import { PostCard } from '@/components/PostCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import { OnboardingWizard } from '@/components/OnboardingWizard'

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
  const [myRequest, setMyRequest] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [postLoading, setPostLoading] = useState(true)
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      loadStudentData()
      loadMyRequest()
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

  const handleOnboardingComplete = async () => {
    if (!user) return
    await supabase
      .from('students')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
    const { data } = await supabase.from('students').select('onboarding_completed').eq('id', user.id).single()
    if (data) setStudent((s) => (s ? { ...s, onboarding_completed: true } : s))
  }

  const loadMyRequest = async () => {
    if (!user) return
    try {
      let data: Post | null = null
      const res = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role),
          portfolio_item:portfolio_items!posts_portfolio_item_id_fkey(id, title, images)
        `)
        .eq('user_id', user.id)
        .eq('type', 'collaboration_request')
        .eq('request_from', 'student')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (res.error) {
        const fallback = await supabase
          .from('posts')
          .select(`*, user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role)`)
          .eq('user_id', user.id)
          .eq('type', 'collaboration_request')
          .eq('request_from', 'student')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!fallback.error && fallback.data) {
          const row = fallback.data as Post & { portfolio_item_id?: string }
          if (row.portfolio_item_id) {
            const { data: pi } = await supabase.from('portfolio_items').select('id, title, images').eq('id', row.portfolio_item_id).single()
            data = { ...row, portfolio_item: pi || undefined } as Post
          } else {
            data = row as Post
          }
        }
      } else {
        data = res.data as Post | null
      }
      if (data) {
        const { data: studentData } = await supabase
          .from('students')
          .select('course, display_label')
          .eq('id', user.id)
          .single()
        setMyRequest({
          ...data,
          student_course: studentData ? getStudentDisplayLabel(studentData) : undefined,
        } as Post)
      } else {
        setMyRequest(null)
      }
    } catch {
      setMyRequest(null)
    }
  }

  const loadFeedPosts = async () => {
    if (!user) return

    try {
      type PostWithRelations = (Post & { user?: Post['user']; portfolio_item?: Post['portfolio_item'] })[]
      let postsData: PostWithRelations | null = null
      let error: unknown = null

      const fullSelect = `
          *,
          user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role),
          portfolio_item:portfolio_items!posts_portfolio_item_id_fkey(id, title, images)
        `
      const result = await supabase
        .from('posts')
        .select(fullSelect)
        .order('created_at', { ascending: false })
        .limit(20)

      if (result.error) {
        error = result.error
        // Fallback senza embed portfolio_item (evita 400 se la relazione non è riconosciuta)
        const fallback = await supabase
            .from('posts')
            .select(`
              *,
              user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role)
            `)
            .order('created_at', { ascending: false })
            .limit(20)
          if (!fallback.error) {
            postsData = fallback.data as unknown as PostWithRelations
            const portfolioIds = [...new Set((postsData || []).map(p => p.portfolio_item_id).filter(Boolean) as string[])]
            if (portfolioIds.length > 0) {
              const { data: portfolioItems } = await supabase
                .from('portfolio_items')
                .select('id, title, images')
                .in('id', portfolioIds)
              const portfolioMap = Object.fromEntries((portfolioItems || []).map((pi: { id: string; title: string; images: string[] }) => [pi.id, pi]))
              postsData = (postsData || []).map(p => ({
                ...p,
                portfolio_item: p.portfolio_item_id ? (portfolioMap[p.portfolio_item_id] as Post['portfolio_item']) : undefined,
              })) as PostWithRelations
            }
          }
      } else {
        postsData = result.data as unknown as PostWithRelations
      }

      if (error && !postsData) throw error

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
        const studentUserIds = [...new Set(
          postsData
            .filter(p => p.type === 'collaboration_request' && p.request_from !== 'company')
            .map(p => p.user_id)
        )]
        let studentCourses: Record<string, string> = {}
        if (studentUserIds.length > 0) {
          const { data: studentsData } = await supabase
            .from('students')
            .select('id, course, display_label')
            .in('id', studentUserIds)
          studentsData?.forEach((s: { id: string; course?: string; display_label?: string | null }) => {
            studentCourses[s.id] = getStudentDisplayLabel(s)
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
    } catch (err) {
      console.error('Error loading feed:', err)
    } finally {
      setPostLoading(false)
    }
  }


  if (showSkeleton || authLoading) {
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

  const showOnboarding = student && !student.onboarding_completed

  return (
    <div className="space-y-4">
            {showOnboarding && (
              <OnboardingWizard onComplete={handleOnboardingComplete} />
            )}
            {/* Hero / Pubblicazione - CTA diretta */}
            {student && student.year !== null && student.year >= 2 ? (
            <Card variant="elevated" className="p-5 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pubblica una richiesta di tirocinio o collaborazione
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Scopri le opportunità attive e fatti trovare dalle aziende
                  </p>
                </div>
                <Link href="/richieste/nuova" className="shrink-0">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    <BriefcaseIcon className="w-5 h-5 mr-2" />
                    Pubblica richiesta
                  </Button>
                </Link>
              </div>
            </Card>
            ) : student && student.year === 1 ? (
            <Card variant="elevated" className="p-5 border border-amber-100 bg-amber-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Le richieste di tirocinio sono disponibili dal 2° anno
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Al momento puoi esplorare le opportunità e completare il tuo profilo
                  </p>
                </div>
              </div>
            </Card>
            ) : null}

            {/* La tua richiesta in vetrina */}
            {myRequest && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">La tua richiesta in vetrina</h4>
                <PostCard post={myRequest} onUpdate={() => { loadMyRequest(); loadFeedPosts() }} />
              </div>
            )}

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
                <Card variant="elevated" className="p-10 text-center bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <UsersIcon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Qui iniziano le tue opportunità.</h3>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto whitespace-nowrap">
                    Segui aziende e studenti per scoprire tirocini, collaborazioni e progetti.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center sm:items-stretch">
                    <Link href="/annunci" className="flex-1 sm:min-w-[200px]">
                      <Button variant="primary" size="lg" className="w-full h-12">Scopri opportunità</Button>
                    </Link>
                    <Link href="/profilo" className="flex-1 sm:min-w-[200px]">
                      <Button variant="outline" size="lg" className="w-full h-12">Completa il tuo profilo</Button>
                    </Link>
                  </div>
                </Card>

                {/* Tirocini suggeriti / in evidenza */}
                {suggestedJobs.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Opportunità in evidenza</h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {suggestedJobs.map((job) => (
                        <Link key={job.id} href={`/annunci/${job.id}`}>
                          <Card variant="elevated" className="p-4 hover:shadow-lg transition-shadow h-full">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-100 flex items-center justify-center">
                                <BuildingOffice2Icon className="w-5 h-5 text-primary-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{job.title}</p>
                                <p className="text-sm text-gray-500 truncate">{job.company?.company_name}</p>
                                <span className="inline-block mt-2 text-xs text-primary-600 font-medium">
                                  Vedi dettagli <ArrowRightIcon className="w-3 h-3 inline" />
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
