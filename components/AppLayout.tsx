'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from './Navbar'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import {
  User,
  FolderOpen,
  Plus,
  Briefcase,
  Users,
  BookOpen,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { COURSE_CONFIG } from '@/types/database'
import type { Student, Company } from '@/types/database'

interface AppLayoutProps {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

export function AppLayout({ children, rightSidebar }: AppLayoutProps) {
  const { user } = useAuth()
  const [profileName, setProfileName] = useState<string | null>(null)
  const [role, setRole] = useState<'student' | 'company' | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [portfolioCount, setPortfolioCount] = useState(0)
  const [applicationsCount, setApplicationsCount] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('role, full_name').eq('id', user.id).single().then(({ data }: any) => {
      setRole(data?.role || null)
      setProfileName(data?.full_name || null)
    })
  }, [user])

  useEffect(() => {
    if (!user || role !== 'student') return
    supabase.from('students').select('*').eq('id', user.id).single().then(({ data }) => setStudent(data))
    supabase.from('student_connections').select('*', { count: 'exact', head: true })
      .or(`student1_id.eq.${user.id},student2_id.eq.${user.id}`).eq('status', 'accepted')
      .then(({ count }) => setConnectionsCount(count || 0))
    supabase.from('portfolio_items').select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .then(({ count }) => setPortfolioCount(count || 0))
    supabase.from('applications').select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .then(({ count }) => setApplicationsCount(count || 0))
  }, [user, role])

  useEffect(() => {
    if (!user || role !== 'company') return
    supabase.from('companies').select('*').eq('id', user.id).single().then(({ data }) => setCompany(data))
    supabase.from('job_posts').select('id').eq('company_id', user.id).then(({ data: jobs }) => {
      const ids = jobs?.map((j: { id: string }) => j.id) || []
      if (ids.length === 0) return setApplicationsCount(0)
      supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_post_id', ids)
        .then(({ count }) => setApplicationsCount(count || 0))
    })
  }, [user, role])

  const hasSidebars = !!user

  return (
    <div className="min-h-screen bg-gray-100/80">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-6 ${hasSidebars ? 'lg:grid-cols-12' : ''}`}>
          {/* Left Sidebar - solo se loggato */}
          {hasSidebars && (
          <aside className="lg:col-span-3 space-y-6">
            <Card variant="glass" className="sticky top-24">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  {profileName?.[0]?.toUpperCase() || (student ? 'S' : company ? (company.company_name?.[0]?.toUpperCase() || 'A') : '?')}
                </div>
                <h3 className="font-semibold text-lg">{profileName || user?.email?.split('@')[0]}</h3>
                {student && (
                  <p className="text-sm text-gray-600">{COURSE_CONFIG[student.course]?.name || student.course}</p>
                )}
                {company && (
                  <p className="text-sm text-gray-600">{company.company_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Link href="/profilo" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <User className="w-4 h-4 shrink-0" />
                    Profilo
                  </Button>
                </Link>
                {role === 'student' && (
                  <>
                    <Link href="/portfolio" className="block">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        Portfolio
                      </Button>
                    </Link>
                    <Link href="/portfolio/nuovo" className="block">
                      <Button variant="primary" className="w-full justify-start" size="sm">
                        <Plus className="w-4 h-4 shrink-0" />
                        Aggiungi Lavoro
                      </Button>
                    </Link>
                  </>
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
          </aside>
          )}

          {/* Main Content */}
          <main className={hasSidebars ? 'lg:col-span-6' : 'max-w-4xl mx-auto'}>{children}</main>

          {/* Right Sidebar - solo se loggato */}
          {hasSidebars && (
          <aside className="lg:col-span-3 space-y-6">
            {rightSidebar ?? (
              <Card variant="elevated">
                <h3 className="font-semibold mb-4 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 text-primary-600" />
                  Scopri
                </h3>
                <div className="space-y-2">
                  {role === 'student' && (
                    <Link href="/rete" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                      <Users className="w-5 h-5 shrink-0" />
                      <span>Network</span>
                      {connectionsCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          {connectionsCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link href="/tesi" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                    <BookOpen className="w-5 h-5 shrink-0" />
                    <span>Proposte Tesi</span>
                  </Link>
                  <Link href={role === 'company' ? '/annunci/gestisci' : '/annunci'} className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                    <Briefcase className="w-5 h-5 shrink-0" />
                    <span>Tirocini e Stage</span>
                  </Link>
                  {role === 'student' && (
                    <Link href="/candidature" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                      <TrendingUp className="w-5 h-5 shrink-0" />
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
  )
}
