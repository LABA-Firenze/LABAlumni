'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  User,
  Building2,
  GraduationCap,
  Briefcase,
  FolderOpen,
  Users,
  ExternalLink,
  ArrowLeft,
  FileImage,
} from 'lucide-react'
import type { Profile, Student, Company, Docente } from '@/types/database'
import type { PortfolioItem } from '@/types/social'
import { getInitials } from '@/lib/avatar'
import { COURSE_CONFIG, getProfileGradient } from '@/types/database'
import { getStudentDisplayLabel, getProfileDisplayLabel } from '@/lib/staff-labels'
import { ProfilePill } from '@/components/ProfilePill'
import { PostCard } from '@/components/PostCard'
import { SkeletonProfileSidebar, SkeletonCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const profileId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [docente, setDocente] = useState<Docente | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'connected' | 'pending' | 'sent'>('none')
  const [isCurrentUserStudent, setIsCurrentUserStudent] = useState(false)
  const isOwnProfile = user?.id === profileId
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        setIsCurrentUserStudent(data?.role === 'student')
      })
    } else {
      setIsCurrentUserStudent(false)
    }
  }, [user])

  useEffect(() => {
    if (profileId) loadProfile()
  }, [profileId])

  useEffect(() => {
    if (user && profileId && profileId !== user.id && profile?.role === 'student') {
      checkConnection()
    }
  }, [user, profileId, profile?.role])

  const loadProfile = async () => {
    if (!profileId) return

    setLoading(true)
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (!profileData) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Company: redirect to /azienda/[id]
      if (profileData.role === 'company') {
        router.replace(`/azienda/${profileId}`)
        return
      }

      if (profileData.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', profileId)
          .single()
        setStudent(studentData || null)

        const { data: portfolioData } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('student_id', profileId)
          .order('year', { ascending: false })
          .order('created_at', { ascending: false })
        setPortfolioItems(portfolioData || [])

        const { count } = await supabase
          .from('student_connections')
          .select('*', { count: 'exact', head: true })
          .or(`student1_id.eq.${profileId},student2_id.eq.${profileId}`)
          .eq('status', 'accepted')
        setConnectionsCount(count || 0)

        // Load posts (query base senza portfolio_item per evitare 400)
        const { data: postsData } = await supabase
          .from('posts')
          .select(`*, user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role)`)
          .eq('user_id', profileId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (postsData?.length) {
          const portfolioIds = [...new Set(postsData.map((p: any) => p.portfolio_item_id).filter(Boolean) as string[])]
          let portfolioMap: Record<string, { id: string; title: string; images: string[] }> = {}
          if (portfolioIds.length > 0) {
            const { data: pi } = await supabase.from('portfolio_items').select('id, title, images').in('id', portfolioIds)
            portfolioMap = Object.fromEntries((pi || []).map((x: any) => [x.id, x]))
          }
          const { data: studentCourses } = await supabase
            .from('students')
            .select('id, course, display_label')
            .eq('id', profileId)
          const courseMap = Object.fromEntries((studentCourses || []).map((s: any) => [s.id, getStudentDisplayLabel(s)]))
          const likedIds = user
            ? (await supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postsData.map((p: any) => p.id)))
            : { data: [] }
          const likedSet = new Set((likedIds.data || []).map((l: any) => l.post_id))
          setPosts(
            postsData.map((p: any) => ({
              ...p,
              portfolio_item: p.portfolio_item_id ? portfolioMap[p.portfolio_item_id] : undefined,
              student_course: courseMap[p.user_id],
              is_liked: likedSet.has(p.id),
            }))
          )
        } else {
          setPosts([])
        }
      } else if (profileData.role === 'docente') {
        const { data: docenteData } = await supabase
          .from('docenti')
          .select('*')
          .eq('id', profileId)
          .single()
        setDocente(docenteData || null)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const checkConnection = async () => {
    if (!user || profileId === user.id) return

    const { data } = await supabase
      .from('student_connections')
      .select('*')
      .or(`and(student1_id.eq.${user.id},student2_id.eq.${profileId}),and(student1_id.eq.${profileId},student2_id.eq.${user.id})`)
      .maybeSingle()

    if (!data) setConnectionStatus('none')
    else if (data.status === 'accepted') setConnectionStatus('connected')
    else if (data.student1_id === user.id) setConnectionStatus('sent')
    else setConnectionStatus('pending')
  }

  const handleConnect = async () => {
    if (!user || profileId === user.id || profile?.role !== 'student') return

    try {
      await supabase.from('student_connections').insert({
        student1_id: user.id,
        student2_id: profileId,
        status: 'pending',
      })
      setConnectionStatus('sent')
    } catch (err: any) {
      if (err.code !== '23505') console.error(err)
    }
  }

  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-gray-100/80">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-3">
              <SkeletonProfileSidebar />
            </aside>
            <main className="lg:col-span-6 space-y-4">
              <SkeletonCard lines={4} />
              <SkeletonCard lines={2} />
            </main>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Profilo non trovato</h2>
        <Link href="/rete">
          <Button variant="primary">Torna alla rete</Button>
        </Link>
      </div>
    )
  }

  // STUDENT PROFILE (public view)
  if (profile.role === 'student' && student) {
    const fullName = profile.full_name || profile.email?.split('@')[0] || 'Studente'
    const year = student.year

    return (
      <div className="min-h-screen bg-gray-100/80">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/rete"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla rete
          </Link>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-3 space-y-6">
              <Card variant="elevated" className="sticky top-24">
                <div className="text-center mb-4">
                  <div className={`w-20 h-20 bg-gradient-to-br ${getProfileGradient(profile.role, student?.course).circle} rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold overflow-hidden`}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span>{getInitials(fullName)}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{fullName}</h3>
                  <div className="mt-1.5 flex justify-center">
                    <ProfilePill role={profile.role} displayLabel={getProfileDisplayLabel(student, profile?.email)} />
                  </div>
                  {!student?.display_label && (
                    <p className="text-sm text-gray-600 mt-1">{getStudentDisplayLabel(student)}</p>
                  )}
                </div>

                {!isOwnProfile && user && isCurrentUserStudent && (
                  <div className="space-y-2">
                    {connectionStatus === 'none' && (
                      <Button variant="primary" className="w-full" size="sm" onClick={handleConnect}>
                        <Users className="w-4 h-4 mr-2" />
                        Connetti
                      </Button>
                    )}
                    {connectionStatus === 'sent' && (
                      <Button variant="outline" className="w-full" size="sm" disabled>
                        Richiesta inviata
                      </Button>
                    )}
                    {connectionStatus === 'connected' && (
                      <Button variant="outline" className="w-full" size="sm" disabled>
                        Connesso
                      </Button>
                    )}
                    {connectionStatus === 'pending' && (
                      <p className="text-sm text-gray-500 text-center">Richiesta in attesa</p>
                    )}
                  </div>
                )}

                {isOwnProfile && (
                  <Link href="/profilo">
                    <Button variant="outline" className="w-full" size="sm">
                      Modifica profilo
                    </Button>
                  </Link>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Connessioni</span>
                    <span className="font-semibold">{connectionsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lavori</span>
                    <span className="font-semibold">{portfolioItems.length}</span>
                  </div>
                </div>
              </Card>
            </aside>

            {/* Main content */}
            <main className="lg:col-span-6 space-y-4">
              <Card variant="elevated" padding={false} className="overflow-hidden">
                <div className={`h-32 sm:h-40 bg-gradient-to-r ${getProfileGradient(profile.role, student?.course).cover}`} />
                <div className="px-6 pb-6 -mt-12 relative">
                  <div className={`w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br ${getProfileGradient(profile.role, student?.course).circle} flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden`}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span>{getInitials(fullName)}</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mt-4">{fullName}</h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    {getStudentDisplayLabel(student)}
                    {!student.display_label && student.academic_year && ` • ${student.academic_year}`}
                    {!student.display_label && year && ` • ${year}° anno`}
                  </p>
                  {student.bio && <p className="text-gray-700 mt-3 leading-relaxed">{student.bio}</p>}
                  {(student.portfolio_url || student.linkedin_url || student.website_url) && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {student.portfolio_url && (
                        <a href={student.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-sm">
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          Portfolio
                        </a>
                      )}
                      {student.linkedin_url && (
                        <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-sm">
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          LinkedIn
                        </a>
                      )}
                      {student.website_url && (
                        <a href={student.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-sm">
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          Sito
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Portfolio */}
              <Card variant="elevated">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 shrink-0 text-primary-600" />
                    Portfolio
                  </h2>
                  {portfolioItems.length > 0 && (
                    <span className="text-sm text-gray-500">{portfolioItems.length} lavori</span>
                  )}
                </div>
                {portfolioItems.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">Nessun lavoro pubblicato</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolioItems.map((item) => (
                      <Link key={item.id} href={`/portfolio/${item.id}`}>
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FileImage className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{item.title}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Feed / Post */}
              {posts.length > 0 && (
                <Card variant="elevated">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary-600" />
                    Attività
                  </h2>
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} onUpdate={loadProfile} />
                    ))}
                  </div>
                </Card>
              )}
            </main>
          </div>
        </div>
      </div>
    )
  }

  // DOCENTE PROFILE (public view) - mostra anche se docente row manca (solo profile)
  if (profile.role === 'docente') {
    const fullName = profile.full_name || profile.email || 'Docente'

    return (
      <div className="min-h-screen bg-gray-100/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/tesi"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alle tesi di laurea
          </Link>

          <Card variant="elevated" className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span>{getInitials(fullName)}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                <ProfilePill role="docente" />
                {docente && (
                  <p className="text-sm text-gray-600 mt-1">
                    {docente.can_relatore && 'Relatore'}
                    {docente.can_relatore && docente.can_corelatore && ' · '}
                    {docente.can_corelatore && 'Corelatore'}
                  </p>
                )}
              </div>
            </div>
            {docente?.bio && <p className="text-gray-700">{docente.bio}</p>}
            {docente?.courses && docente.courses.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {docente.courses.map((c: string) => (
                  <span key={c} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-sm">
                    {COURSE_CONFIG[c as keyof typeof COURSE_CONFIG]?.name || c}
                  </span>
                ))}
              </div>
            )}
            {!docente && (
              <p className="text-gray-500 text-sm">Profilo docente. Contattabile dalla piattaforma per tesi di laurea.</p>
            )}
          </Card>
          <Link href="/tesi">
            <Button variant="primary">Vedi tesi di laurea</Button>
          </Link>
        </div>
      </div>
    )
  }

  return null
}
