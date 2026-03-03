'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { BriefcaseIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/solid'
import { getJobTypeLabel } from '@/lib/job-type-labels'
import Link from 'next/link'
import { SkeletonJobCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import type { JobPost, CourseType } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

const PAGE_SIZE = 20

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
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<CourseType | 'all'>('all')
  const [studentCourse, setStudentCourse] = useState<CourseType | null>(null)
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (user) loadStudentCourse()
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

  const loadJobs = async (append = false) => {
    if (!append) setLoading(true)
    try {
      const from = append ? page * PAGE_SIZE : 0
      let query = supabase
        .from('job_posts')
        .select(`*, company:companies(id, company_name, logo_url)`)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

      if (selectedCourse !== 'all') {
        query = query.contains('courses', [selectedCourse])
      }

      const { data } = await query
      const fetched = data || []

      if (append) {
        setJobs(prev => [...prev, ...fetched])
      } else {
        setJobs(fetched)
      }
      setHasMore(fetched.length === PAGE_SIZE)
      if (append) setPage(p => p + 1)
      else setPage(1)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => loadJobs(true)

  useEffect(() => {
    setPage(0)
    setHasMore(true)
    loadJobs(false)
  }, [selectedCourse])

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
        <Card variant="elevated" className="p-6 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BriefcaseIcon className="w-8 h-8 text-primary-600" />
            Tirocini
          </h1>
          <p className="text-gray-600 mt-2">Trova le opportunità giuste per te</p>
        </Card>

        {/* Filters */}
        <Card variant="elevated" className="mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Cerca tirocini..."
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
        {showSkeleton ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonJobCard key={i} />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card variant="elevated" className="text-center py-16 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
              <BriefcaseIcon className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nessun tirocinio trovato</h3>
            <p className="text-gray-600">Prova a modificare i filtri o controlla più tardi</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} variant="elevated" className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{job.title}</h2>
                      <span className="px-3 py-1 bg-primary-50 text-primary text-sm rounded-full font-medium">
                        {getJobTypeLabel(job.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span>{job.company.company_name}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.remote && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Remoto
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
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
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={loadMore} disabled={loading}>
                  Carica altri
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
  )
}

