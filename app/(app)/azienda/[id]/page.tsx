'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase, MapPin, Clock, Building2, Globe, ArrowLeft } from 'lucide-react'
import { SkeletonJobCard } from '@/components/ui/Skeleton'
import type { Company } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

export default function AziendaPage() {
  const params = useParams()
  const { user } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompany()
  }, [params.id])

  const loadCompany = async () => {
    if (!params.id || typeof params.id !== 'string') return

    setLoading(true)
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!companyData) {
        setCompany(null)
        setJobs([])
        return
      }

      setCompany(companyData)

      const { data: jobsData } = await supabase
        .from('job_posts')
        .select('*')
        .eq('company_id', params.id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error loading company:', error)
      setCompany(null)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonJobCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Azienda non trovata</h2>
        <Link href="/annunci">
          <Button variant="primary">Torna agli annunci</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/annunci"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Torna agli annunci
      </Link>

      <Card variant="elevated" className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-20 h-20 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
            {company.logo_url ? (
              <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-10 h-10 text-primary-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
            {company.industry && (
              <p className="text-primary-600 font-medium mt-0.5">{company.industry}</p>
            )}
            {company.description && (
              <p className="text-gray-600 mt-3">{company.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              {company.website_url && (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Sito web
                </a>
              )}
              {company.city && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {company.city}
                  {company.province && ` (${company.province})`}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Annunci attivi</h2>
        {jobs.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Nessun annuncio attivo al momento</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} variant="elevated" className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-4 text-gray-600 text-sm mt-2">
                      <span className="px-3 py-1 bg-primary-50 text-primary text-sm rounded-full font-medium">
                        {job.type}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      )}
                      {job.remote && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Remoto
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-3 line-clamp-2">{job.description}</p>
                    {job.courses?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.courses.map((course: string) => (
                          <span
                            key={course}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {COURSE_CONFIG[course as keyof typeof COURSE_CONFIG]?.name || course}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link href={`/annunci/${job.id}`} className="inline-block mt-4">
                      <Button variant="primary" size="sm">
                        Vedi dettagli
                      </Button>
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
