'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, UserPlus, Check, X, Search } from 'lucide-react'
import { COURSE_CONFIG, type CourseType } from '@/types/database'
import type { Student, Profile } from '@/types/database'
import type { StudentConnection } from '@/types/social'

interface StudentWithProfile extends Student {
  profile: Profile
}

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<StudentWithProfile[]>([])
  const [connections, setConnections] = useState<StudentConnection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterCourse, setFilterCourse] = useState<string>('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadNetwork()
      loadConnections()
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            Network
          </h1>
          <p className="text-gray-600 mt-2">Connettiti con altri studenti LABA</p>
        </div>

        {/* Pending Connection Requests */}
        {pendingConnections.length > 0 && (
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
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
                        <Check className="w-4 h-4 mr-1" />
                        Accetta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(conn.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
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
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cerca per nome o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
          </div>
        </Card>

        {/* Students Grid */}
        {students.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nessuno studente trovato</h3>
            <p className="text-gray-600">Prova a modificare i filtri di ricerca</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => {
              const status = getConnectionStatus(student.id)
              return (
                <Card key={student.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {student.profile?.full_name?.[0]?.toUpperCase() || student.profile?.email?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {student.profile?.full_name || 'Studente'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {COURSE_CONFIG[student.course]?.name || student.course}
                        </p>
                      </div>
                    </div>

                    {student.year && (
                      <p className="text-sm text-gray-500 mb-4">
                        {student.year}° anno
                      </p>
                    )}

                    <div className="flex gap-2">
                      {status === 'none' && (
                        <Button
                          variant="primary"
                          className="flex-1"
                          size="sm"
                          onClick={() => handleConnect(student.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
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
                            <Check className="w-4 h-4 mr-1" />
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
                            <X className="w-4 h-4 mr-1" />
                            Rifiuta
                          </Button>
                        </div>
                      )}
                      {status === 'connected' && (
                        <Button variant="outline" className="flex-1" size="sm" disabled>
                          <Check className="w-4 h-4 mr-2" />
                          Connesso
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


