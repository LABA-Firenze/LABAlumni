'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Briefcase, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import type { JobPost, CourseType } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

const COURSES: { value: CourseType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tutti i corsi' },
  ...Object.entries(COURSE_CONFIG).map(([value, config]) => ({
    value: value as CourseType,
    label: config.name,
  }))
]

export default function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<(JobPost & { company: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<CourseType | 'all'>('all')
  const [studentCourse, setStudentCourse] = useState<CourseType | null>(null)

  useEffect(() => {
    if (user) {
      loadStudentCourse()
    }
    loadJobs()
  }, [user])

  const loadStudentCourse = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('students')
      .select('course')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setStudentCourse(data.course)
      setSelectedCourse(data.course)
    }
  }

  const loadJobs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('job_posts')
        .select(`
          *,
          company:companies(id, company_name, logo_url)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })

      // Filter by course if student and course selected
      if (selectedCourse !== 'all') {
        query = query.contains('courses', [selectedCourse])
      }

      const { data } = await query

      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [selectedCourse])

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Annunci di Lavoro</h1>
          <p className="text-gray-600 mt-2">Trova le opportunità giuste per te</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Cerca annunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value as CourseType | 'all')}
            >
              {COURSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Jobs list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nessun annuncio trovato</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{job.title}</h2>
                      <span className="px-3 py-1 bg-primary-50 text-primary text-sm rounded-full font-medium">
                        {job.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.company.company_name}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.remote && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Remoto
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(job.created_at).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-600">Corsi:</span>
                      {job.courses.map((course) => (
                        <span key={course} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                          {course}
                        </span>
                      ))}
                    </div>

                    <Link href={`/annunci/${job.id}`}>
                      <Button variant="primary">Dettagli</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

