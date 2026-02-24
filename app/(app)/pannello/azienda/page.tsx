'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase, Users, User, Plus, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_CONFIG } from '@/lib/application-status'
import type { Company, JobPost, Application } from '@/types/database'
import type { Post } from '@/types/social'
import { PostCard } from '@/components/PostCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

export default function CompanyDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [applications, setApplications] = useState<(Application & { student: any; job_post: JobPost })[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postLoading, setPostLoading] = useState(true)
  const showSkeleton = useMinimumLoading(loading)

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
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .single()

      setCompany(companyData)

      const { data: jobsData } = await supabase
        .from('job_posts')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setJobPosts(jobsData || [])

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
          user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (postsData) {
        const { data: likedPosts } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id))

        const likedPostIds = new Set(likedPosts?.map(l => l.post_id) || [])

        setPosts(postsData.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id)
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

  if (showSkeleton || authLoading) {
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
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Left - Company info & quick links */}
      <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
        <Card variant="elevated" className="lg:sticky lg:top-24">
          <div className="text-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
              {company?.company_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <h3 className="font-semibold text-lg">{company?.company_name || 'Azienda'}</h3>
            {company?.industry && (
              <p className="text-sm text-gray-600">{company.industry}</p>
            )}
          </div>
          <div className="space-y-2">
            <Link href="/profilo" className="block">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <User className="w-4 h-4 shrink-0" />
                Visualizza Profilo
              </Button>
            </Link>
            <Link href="/annunci/gestisci" className="block">
              <Button variant="primary" className="w-full justify-start" size="sm">
                <Briefcase className="w-4 h-4 shrink-0" />
                Gestisci Annunci
              </Button>
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Annunci attivi</span>
              <span className="font-semibold">{jobPosts.filter(j => j.active).length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Post pubblicati</span>
              <span className="font-semibold">{posts.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Candidature</span>
              <span className="font-semibold">{applications.length}</span>
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <h3 className="font-semibold mb-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 shrink-0 text-primary-600" />
            Azioni Rapide
          </h3>
          <div className="space-y-2">
            <Link href="/post/azienda/nuovo" className="block">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="w-4 h-4 shrink-0" />
                Nuovo Post
              </Button>
            </Link>
            <Link href="/annunci/gestisci" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
              <Briefcase className="w-5 h-5 shrink-0" />
              <span>Gestisci Annunci</span>
            </Link>
            <Link href="/candidature/gestisci" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
              <Users className="w-5 h-5 shrink-0" />
              <span>Candidature</span>
            </Link>
          </div>
        </Card>
      </aside>

      {/* Center - Feed */}
      <main className="lg:col-span-6 space-y-4 order-1 lg:order-2">
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
      </main>

      {/* Right - Applications & Job posts */}
      <aside className="lg:col-span-3 space-y-6 order-3">
        <Card variant="elevated">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="font-semibold flex items-center gap-3 flex-1 min-w-0">
              <TrendingUp className="w-5 h-5 shrink-0 text-primary-600" />
              <span className="break-words">Candidature Recenti</span>
            </h3>
            <Link href="/candidature/gestisci" className="shrink-0">
              <Button variant="ghost" size="sm" className="whitespace-nowrap">Vedi tutte</Button>
            </Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nessuna candidatura</p>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => {
                const config = APPLICATION_STATUS_CONFIG[app.status as keyof typeof APPLICATION_STATUS_CONFIG]
                const StatusIcon = config.icon
                return (
                  <div key={app.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium text-sm mb-1 line-clamp-1">{app.job_post.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusIcon className={`w-4 h-4 shrink-0 ${config.color}`} />
                      <span className={`text-xs ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card variant="elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">I Tuoi Annunci</h3>
            <Link href="/annunci/gestisci">
              <Button variant="ghost" size="sm">Gestisci</Button>
            </Link>
          </div>
          {jobPosts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nessun annuncio</p>
          ) : (
            <div className="space-y-2">
              {jobPosts.slice(0, 3).map((job) => (
                <Link key={job.id} href={`/annunci/${job.id}`}>
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium text-sm mb-1 line-clamp-1">{job.title}</h4>
                    <p className="text-xs text-gray-500">{job.type}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </aside>
    </div>
  )
}
