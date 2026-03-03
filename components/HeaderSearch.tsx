'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Building2, User, GraduationCap } from 'lucide-react'
import { getInitials } from '@/lib/avatar'
import { COURSE_CONFIG, getProfileGradient, type CourseType } from '@/types/database'
import { getStudentDisplayLabel } from '@/lib/staff-labels'

type SearchResult = 
  | { type: 'company'; id: string; company_name: string; logo_url: string | null }
  | { type: 'student'; id: string; full_name: string | null; avatar_url: string | null; course?: string; courseKey?: CourseType }
  | { type: 'docente'; id: string; full_name: string | null; avatar_url: string | null }

export function HeaderSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    const term = q.trim()
    if (term.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const pattern = `%${term}%`

      const [companiesRes, studentsRes, docentiRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, company_name, logo_url')
          .ilike('company_name', pattern)
          .limit(5),
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('role', 'student')
          .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
          .limit(5),
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('role', 'docente')
          .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
          .limit(5),
      ])

      const companies: SearchResult[] = (companiesRes.data || []).map((c: any) => ({
        type: 'company' as const,
        id: c.id,
        company_name: c.company_name,
        logo_url: c.logo_url,
      }))

      const studentIds = (studentsRes.data || []).map((p: any) => p.id)
      let studentCourses: Record<string, string> = {}
      let studentCourseKeys: Record<string, string> = {}
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, course, display_label')
          .in('id', studentIds)
        studentsData?.forEach((s: { id: string; course?: string; display_label?: string | null }) => {
          studentCourses[s.id] = getStudentDisplayLabel(s)
          studentCourseKeys[s.id] = s.course || 'design'
        })
      }

      const students: SearchResult[] = (studentsRes.data || []).map((p: any) => ({
        type: 'student' as const,
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        course: studentCourses[p.id] || undefined,
        courseKey: (studentCourseKeys[p.id] || 'design') as CourseType,
      }))

      const docenti: SearchResult[] = (docentiRes.data || []).map((p: any) => ({
        type: 'docente' as const,
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      }))

      setResults([...companies, ...students, ...docenti])
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (r: SearchResult) => {
    setOpen(false)
    setQuery('')
    setResults([])
    inputRef.current?.blur()

    if (r.type === 'company') {
      router.push(`/azienda/${r.id}`)
    } else if (r.type === 'student' || r.type === 'docente') {
      router.push(`/profilo/${r.id}`)
    } else {
      router.push('/tesi')
    }
  }

  const hasResults = results.length > 0
  const showDropdown = open && (query.length >= 2 || hasResults)

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md mx-4 hidden sm:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Cerca aziende, docenti, utenti..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50/80 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[60]">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Nessun risultato per &quot;{query}&quot;
            </div>
          ) : (
            <ul className="py-2 max-h-80 overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    {r.type === 'company' ? (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 overflow-hidden">
                          {r.logo_url ? (
                            <img src={r.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <Building2 className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{r.company_name}</p>
                          <p className="text-xs text-gray-500">Azienda</p>
                        </div>
                      </>
                    ) : r.type === 'student' ? (
                      <>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getProfileGradient('student', r.courseKey).circle} flex items-center justify-center shrink-0 overflow-hidden text-white`}>
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="font-semibold">
                              {getInitials(r.full_name)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {r.full_name || 'Utente'}
                          </p>
                          {r.course && (
                            <p className="text-xs text-gray-500 truncate">{r.course}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getProfileGradient('docente').circle} flex items-center justify-center shrink-0 overflow-hidden text-white`}>
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <GraduationCap className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {r.full_name || 'Docente'}
                          </p>
                          <p className="text-xs text-gray-500">Docente</p>
                        </div>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
