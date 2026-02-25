'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from './Navbar'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import {
  UserCircleIcon,
  FolderOpenIcon,
  PlusIcon,
  BriefcaseIcon,
  UsersIcon,
  BookOpenIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import { COURSE_CONFIG, getProfileGradient } from '@/types/database'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import { SkeletonProfileSidebar, SkeletonScopriSidebar } from './ui/Skeleton'
import type { Student, Company, Docente } from '@/types/database'
import { ProfilePill } from './ProfilePill'

interface AppLayoutProps {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

export function AppLayout({ children, rightSidebar }: AppLayoutProps) {
  const { user } = useAuth()
  const [profileName, setProfileName] = useState<string | null>(null)
  const [role, setRole] = useState<'student' | 'company' | 'docente' | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [docente, setDocente] = useState<Docente | null>(null)
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [portfolioCount, setPortfolioCount] = useState(0)
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [sidebarReady, setSidebarReady] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadSidebarData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      const r = profileData?.role || null
      const pn = profileData?.full_name || null
      setRole(r)
      setProfileName(pn)

      if (r === 'student') {
        const [studentRes, connRes, portRes, appRes] = await Promise.all([
          supabase.from('students').select('*').eq('id', user.id).single(),
          supabase.from('student_connections').select('*', { count: 'exact', head: true }).or(`student1_id.eq.${user.id},student2_id.eq.${user.id}`).eq('status', 'accepted'),
          supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('student_id', user.id),
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', user.id),
        ])
        setStudent(studentRes.data)
        setConnectionsCount(connRes.count || 0)
        setPortfolioCount(portRes.count || 0)
        setApplicationsCount(appRes.count || 0)
      } else if (r === 'company') {
        const [companyRes, jobsRes] = await Promise.all([
          supabase.from('companies').select('*').eq('id', user.id).single(),
          supabase.from('job_posts').select('id').eq('company_id', user.id),
        ])
        setCompany(companyRes.data)
        const ids = (jobsRes.data || []).map((j: { id: string }) => j.id)
        if (ids.length > 0) {
          const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_post_id', ids)
          setApplicationsCount(count || 0)
        }
      } else if (r === 'docente') {
        const { data: docData } = await supabase.from('docenti').select('*').eq('id', user.id).single()
        setDocente(docData)
      }
      setSidebarReady(true)
    }

    loadSidebarData()
  }, [user])

  const hasSidebars = !!user
  const sidebarLoadingRaw = !!user && !sidebarReady
  const sidebarLoading = useMinimumLoading(sidebarLoadingRaw)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="bg-gray-100/90 rounded-b-2xl min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-6 ${hasSidebars ? 'lg:grid-cols-12' : ''}`}>
          {/* Left Sidebar - solo se loggato */}
          {hasSidebars && (
          <aside className="lg:col-span-3 space-y-6">
            {sidebarLoading ? (
              <div className="sticky top-24">
                <SkeletonProfileSidebar />
              </div>
            ) : (
            <Card variant="glass" className="sticky top-24">
              <div className="text-center mb-4">
                <div className={`w-20 h-20 bg-gradient-to-br ${getProfileGradient(role!, student?.course).circle} rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold`}>
                  {profileName?.[0]?.toUpperCase() || (student ? 'S' : company ? (company.company_name?.[0]?.toUpperCase() || 'A') : docente ? 'D' : '?')}
                </div>
                <h3 className="font-semibold text-lg uppercase">{profileName || user?.email?.split('@')[0]}</h3>
                <div className="mt-1.5 flex justify-center">
                  <ProfilePill role={role} />
                </div>
                {student && (
                  <p className="text-sm text-gray-600 mt-1">
                    {COURSE_CONFIG[student.course]?.name || student.course}
                    {student.academic_year && ` • ${student.academic_year}`}
                  </p>
                )}
                {company && (
                  <p className="text-sm text-gray-600 mt-1">{company.company_name}</p>
                )}
                {docente && (
                  <p className="text-sm text-gray-600 mt-1">Relatore · Corelatore</p>
                )}
              </div>
              <div className="space-y-2">
                <Link href="/profilo" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <UserCircleIcon className="w-4 h-4 shrink-0" />
                    Profilo
                  </Button>
                </Link>
                {role === 'student' && (
                  <>
                    <Link href="/portfolio" className="block">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <FolderOpenIcon className="w-4 h-4 shrink-0" />
                        Portfolio
                      </Button>
                    </Link>
                    <Link href="/portfolio/nuovo" className="block">
                      <Button variant="primary" className="w-full justify-start" size="sm">
                        <PlusIcon className="w-4 h-4 shrink-0" />
                        Aggiungi Lavoro
                      </Button>
                    </Link>
                  </>
                )}
                {role === 'docente' && (
                  <Link href="/tesi" className="block">
                    <Button variant="primary" className="w-full justify-start" size="sm">
                      <BookOpenIcon className="w-4 h-4 shrink-0" />
                      Proposte Tesi
                    </Button>
                  </Link>
                )}
              </div>
              {(role === 'student' || role === 'company') && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {role === 'student' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Connessioni</span>
                        <span className="font-semibold">{connectionsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Lavori</span>
                        <span className="font-semibold">{portfolioCount}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Candidature</span>
                    <span className="font-semibold">{applicationsCount}</span>
                  </div>
                </div>
              )}
            </Card>
            )}
          </aside>
          )}

          {/* Main Content */}
          <main className={hasSidebars ? 'lg:col-span-6' : 'max-w-4xl mx-auto'}>{children}</main>

          {/* Right Sidebar - solo se loggato */}
          {hasSidebars && (
          <aside className="lg:col-span-3 space-y-6">
            {sidebarLoading ? (
              <SkeletonScopriSidebar />
            ) : rightSidebar ?? (
              <Card variant="elevated">
                <h3 className="font-semibold mb-4 flex items-center gap-3">
                  <SparklesIcon className="w-5 h-5 shrink-0 text-primary-600" />
                  Scopri
                </h3>
                <div className="space-y-2">
                  {role === 'student' && (
                    <Link href="/rete" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                      <UsersIcon className="w-5 h-5 shrink-0" />
                      <span>Network</span>
                      {connectionsCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          {connectionsCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {role !== 'company' && (
                  <Link href="/tesi" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                    <BookOpenIcon className="w-5 h-5 shrink-0" />
                    <span>Proposte Tesi</span>
                  </Link>
                  )}
                  <Link href={role === 'company' ? '/annunci/gestisci' : '/annunci'} className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                    <BriefcaseIcon className="w-5 h-5 shrink-0" />
                    <span>Tirocini e Stage</span>
                  </Link>
                  {role === 'student' && (
                    <Link href="/candidature" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                      <ArrowTrendingUpIcon className="w-5 h-5 shrink-0" />
                      <span>Le Tue Candidature</span>
                    </Link>
                  )}
                </div>
              </Card>
            )}
          </aside>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
