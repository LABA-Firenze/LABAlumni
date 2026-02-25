'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { UsersIcon, UserPlusIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, BuildingOffice2Icon, AcademicCapIcon } from '@heroicons/react/24/solid'
import { getInitials } from '@/lib/avatar'
import { COURSE_CONFIG, getProfileGradient, type CourseType } from '@/types/database'
import type { Student, Profile } from '@/types/database'
import type { StudentConnection } from '@/types/social'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

interface StudentWithProfile extends Student {
  profile: Profile
}

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const qFromUrl = searchParams.get('q') || ''
  const [students, setStudents] = useState<StudentWithProfile[]>([])
  const [connections, setConnections] = useState<StudentConnection[]>([])
  const [searchQuery, setSearchQuery] = useState(qFromUrl)
  const [loading, setLoading] = useState(true)
  const [filterCourse, setFilterCourse] = useState<string>('')
  const [tab, setTab] = useState<'studenti' | 'aziende' | 'docenti'>('studenti')
  const [companies, setCompanies] = useState<{ id: string; company_name: string; logo_url: string | null; industry: string | null }[]>([])
  const [docenti, setDocenti] = useState<{ id: string; full_name: string | null; avatar_url: string | null; courses?: string[] }[]>([])
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    setSearchQuery(qFromUrl)
  }, [qFromUrl])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      loadNetwork()
      loadConnections()
      loadCompanies()
      loadDocenti()
    }
  }, [user, authLoading, router])

  const loadNetwork = async () => {
    if (!user) return

    try {
      // Get all students except current user
      let query = supabase
        .from('students')
        .select(`
          *,
          profile:profiles!students_id_fkey(id, full_name, email, avatar_url)
        `)
        .neq('id', user.id)

      if (filterCourse) {
        query = query.eq('course', filterCourse)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Filter by search query if provided
      let filteredData = data || []
      if (searchQuery) {
        filteredData = filteredData.filter((s: any) => 
          s.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      setStudents(filteredData)
    } catch (error) {
      console.error('Error loading network:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDocenti = async () => {
    try {
      const { data: docData } = await supabase.from('docenti').select('id').or('can_relatore.eq.true,can_corelatore.eq.true')
      if (!docData?.length) {
        setDocenti([])
        return
      }
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', docData.map((d: { id: string }) => d.id))
      const { data: docFull } = await supabase.from('docenti').select('id, courses').in('id', docData.map((d: { id: string }) => d.id))
      const docMap = new Map((docFull || []).map((d: any) => [d.id, d]))
      setDocenti((profData || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        courses: docMap.get(p.id)?.courses,
      })))
    } catch (err) {
      console.error('Error loading docenti:', err)
    }
  }

  const loadCompanies = async () => {
    try {
      const { data } = await supabase
        .from('companies')
        .select('id, company_name, logo_url, industry')
        .order('company_name')
      setCompanies(data || [])
    } catch (err) {
      console.error('Error loading companies:', err)
    }
  }

  const loadConnections = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('student_connections')
        .select('*')
        .or(`student1_id.eq.${user.id},student2_id.eq.${user.id}`)

      if (error) throw error
      setConnections(data || [])
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }

  const getConnectionStatus = (studentId: string): 'connected' | 'pending' | 'sent' | 'none' => {
    const connection = connections.find(c => 
      (c.student1_id === user?.id && c.student2_id === studentId) ||
      (c.student1_id === studentId && c.student2_id === user?.id)
    )

    if (!connection) return 'none'
    if (connection.status === 'accepted') return 'connected'
    if (connection.student1_id === user?.id) return 'sent'
    return 'pending'
  }

  const handleConnect = async (studentId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('student_connections')
        .insert({
          student1_id: user.id,
          student2_id: studentId,
          status: 'pending',
        })

      if (error) throw error
      loadConnections()
    } catch (error: any) {
      console.error('Error sending connection request:', error)
      if (error.code !== '23505') { // Ignore duplicate error
        alert('Errore durante l\'invio della richiesta')
      }
    }
  }

  const handleAccept = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('student_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId)

      if (error) throw error
      loadConnections()
    } catch (error) {
      console.error('Error accepting connection:', error)
    }
  }

  const handleReject = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('student_connections')
        .delete()
        .eq('id', connectionId)

      if (error) throw error
      loadConnections()
    } catch (error) {
      console.error('Error rejecting connection:', error)
    }
  }

  useEffect(() => {
    loadNetwork()
  }, [searchQuery, filterCourse, user])

  if (showSkeleton || authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-48 rounded-lg bg-gray-200 animate-pulse mb-2" />
          <div className="h-5 w-72 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      </div>
    )
  }

  const courses = Object.entries(COURSE_CONFIG).map(([value, config]) => ({
    value: value as CourseType,
    label: config.name,
  }))

  const pendingConnections = connections.filter(c => 
    c.student2_id === user?.id && c.status === 'pending'
  )

  const filteredCompanies = companies.filter((c) =>
    !searchQuery || c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDocenti = docenti.filter((d) =>
    !searchQuery || d.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
      <div className="space-y-6">
        <Card variant="elevated" className="p-6 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-primary-600" />
              Network
            </h1>
            <p className="text-gray-600 mt-2">Connettiti con studenti e scopri le aziende</p>
            <div className="flex gap-2 mt-4">
            <button
              onClick={() => setTab('studenti')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'studenti' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Studenti
            </button>
            <button
              onClick={() => setTab('aziende')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'aziende' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aziende
            </button>
            <button
              onClick={() => setTab('docenti')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'docenti' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Docenti
            </button>
          </div>
          </div>
        </Card>

        {/* Pending Connection Requests */}
        {pendingConnections.length > 0 && (
          <Card variant="elevated" className="mb-6 p-4 bg-blue-50/80 border-blue-200/60">
            <h3 className="font-semibold mb-3">Richieste di Connessione in Attesa</h3>
            <div className="space-y-2">
              {pendingConnections.map((conn) => {
                const student = students.find(s => s.id === conn.student1_id)
                if (!student) return null
                return (
                  <div key={conn.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{student.profile?.full_name || 'Studente'}</p>
                      <p className="text-sm text-gray-600">
                        {COURSE_CONFIG[student.course]?.name || student.course}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAccept(conn.id)}
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Accetta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(conn.id)}
                      >
                        <XMarkIcon className="w-4 h-4 mr-1" />
                        Rifiuta
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card variant="elevated" className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={tab === 'studenti' ? 'Cerca per nome o email...' : tab === 'aziende' ? 'Cerca aziende...' : 'Cerca docenti...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {tab === 'studenti' && (
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tutti i corsi</option>
                {courses.map(course => (
                  <option key={course.value} value={course.value}>{course.label}</option>
                ))}
              </select>
            )}
          </div>
        </Card>

        {/* Companies Grid */}
        {tab === 'aziende' && (
          filteredCompanies.length === 0 ? (
            <Card variant="elevated" className="p-12 text-center bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
              <BuildingOffice2Icon className="w-12 h-12 text-primary-600" />
            </div>
              <h3 className="text-xl font-semibold mb-2">Nessuna azienda trovata</h3>
              <p className="text-gray-600">Prova a modificare la ricerca</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <Link key={company.id} href={`/azienda/${company.id}`} className="block group">
                  <Card variant="elevated" className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 overflow-hidden">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BuildingOffice2Icon className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary-600 transition-colors">
                            {company.company_name}
                          </h3>
                          {company.industry && (
                            <p className="text-sm text-gray-600 truncate">{company.industry}</p>
                          )}
                          <span className="text-xs text-primary-600 mt-1 inline-block">Vedi profilo e annunci →</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Docenti Grid */}
        {tab === 'docenti' && (
          filteredDocenti.length === 0 ? (
            <Card variant="elevated" className="p-12 text-center bg-gradient-to-br from-amber-50/60 to-white border-amber-100/60">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
              <AcademicCapIcon className="w-12 h-12 text-amber-600" />
            </div>
              <h3 className="text-xl font-semibold mb-2">Nessun docente trovato</h3>
              <p className="text-gray-600">Prova a modificare la ricerca</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocenti.map((doc) => (
                <Link key={doc.id} href={`/profilo/${doc.id}`} className="block group">
                  <Card variant="elevated" className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getProfileGradient('docente').circle} flex items-center justify-center shrink-0 overflow-hidden text-white`}>
                          {doc.avatar_url ? (
                            <img src={doc.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <AcademicCapIcon className="w-7 h-7" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary-600 transition-colors truncate">
                            {doc.full_name || 'Docente'}
                          </h3>
                          {doc.courses?.length ? (
                            <p className="text-sm text-gray-600 truncate">
                              {doc.courses.map((c) => COURSE_CONFIG[c as CourseType]?.name || c).join(', ')}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Docente</p>
                          )}
                          <span className="text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">Vedi profilo →</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Students Grid */}
        {tab === 'studenti' && (
          students.length === 0 ? (
            <Card variant="elevated" className="p-12 text-center bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
              <UsersIcon className="w-12 h-12 text-primary-600" />
            </div>
              <h3 className="text-xl font-semibold mb-2">Nessuno studente trovato</h3>
              <p className="text-gray-600">Prova a modificare i filtri di ricerca</p>
            </Card>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => {
              const status = getConnectionStatus(student.id)
              return (
                <Card key={student.id} variant="elevated" className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <Link href={`/profilo/${student.id}`} className="block group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${getProfileGradient('student', student.course).circle} rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden`}>
                          {getInitials(student.profile?.full_name || student.profile?.email) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg group-hover:text-primary-600 transition-colors">
                            {student.profile?.full_name || 'Studente'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {COURSE_CONFIG[student.course]?.name || student.course}
                          </p>
                          <span className="text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">
                            Vedi profilo e portfolio →
                          </span>
                        </div>
                      </div>

                      {student.year && (
                        <p className="text-sm text-gray-500 mb-4">
                          {student.year}° anno
                        </p>
                      )}
                    </Link>

                    <div className="flex gap-2">
                      {status === 'none' && (
                        <Button
                          variant="primary"
                          className="flex-1"
                          size="sm"
                          onClick={() => handleConnect(student.id)}
                        >
                          <UserPlusIcon className="w-4 h-4 mr-2" />
                          Connetti
                        </Button>
                      )}
                      {status === 'sent' && (
                        <Button variant="outline" className="flex-1" size="sm" disabled>
                          Richiesta Inviata
                        </Button>
                      )}
                      {status === 'pending' && (
                        <div className="flex gap-2 flex-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const conn = connections.find(c => 
                                c.student1_id === student.id && c.student2_id === user?.id
                              )
                              if (conn) handleAccept(conn.id)
                            }}
                          >
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Accetta
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const conn = connections.find(c => 
                                c.student1_id === student.id && c.student2_id === user?.id
                              )
                              if (conn) handleReject(conn.id)
                            }}
                          >
                            <XMarkIcon className="w-4 h-4 mr-1" />
                            Rifiuta
                          </Button>
                        </div>
                      )}
                      {status === 'connected' && (
                        <Button variant="outline" className="flex-1" size="sm" disabled>
                          <CheckIcon className="w-4 h-4 mr-2" />
                          Connesso
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          )
        )}
      </div>
  )
}


