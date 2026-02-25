'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import {
  User,
  Building2,
  GraduationCap,
  Link as LinkIcon,
  Briefcase,
  FolderOpen,
  Plus,
  Users,
  BookOpen,
  Sparkles,
  Edit3,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import type { Student, Company, Docente, Profile, CourseType } from '@/types/database'
import type { PortfolioItem } from '@/types/social'
import { COURSE_CONFIG, getProfileGradient } from '@/types/database'
import { ProfilePill } from '@/components/ProfilePill'
import { SkeletonProfileSidebar, SkeletonCard, SkeletonPortfolioItem } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

const COURSES = Object.entries(COURSE_CONFIG).map(([value, config]) => ({
  value: value as CourseType,
  label: config.name,
  type: config.type,
}))

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [docente, setDocente] = useState<Docente | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [portfolioCount, setPortfolioCount] = useState(0)
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [course, setCourse] = useState<CourseType>('graphic-design-multimedia')
  const [year, setYear] = useState('')
  const [phone, setPhone] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [partitaIva, setPartitaIva] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [cap, setCap] = useState('')
  const [province, setProvince] = useState('')
  const [country, setCountry] = useState('Italia')
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }
    if (user) loadProfile()
  }, [user, authLoading, router])

  const loadProfile = async () => {
    if (!user) return
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setFullName(profileData?.full_name || '')

      if (profileData?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()

        setStudent(studentData)
        if (studentData) {
          setBio(studentData.bio || '')
          setCourse(studentData.course)
          setYear(studentData.year?.toString() || '')
          setPhone(studentData.phone || '')
          setPortfolioUrl(studentData.portfolio_url || '')
          setTwitterUrl(studentData.twitter_url || '')
          setLinkedinUrl(studentData.linkedin_url || '')
          setWebsiteUrl(studentData.website_url || '')
        }

        const { data: portfolioData } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('student_id', user.id)
          .order('year', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6)
        setPortfolioItems(portfolioData || [])

        const { count } = await supabase
          .from('portfolio_items')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
        setPortfolioCount(count || 0)

        const { count: connCount } = await supabase
          .from('student_connections')
          .select('*', { count: 'exact', head: true })
          .or(`student1_id.eq.${user.id},student2_id.eq.${user.id}`)
          .eq('status', 'accepted')
        setConnectionsCount(connCount || 0)

        const { data: appData } = await supabase
          .from('applications')
          .select(`*, job_post:job_posts(title)`)
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)
        setApplications(appData || [])
      } else if (profileData?.role === 'docente') {
        const { data: docenteData } = await supabase
          .from('docenti')
          .select('*')
          .eq('id', user.id)
          .single()
        setDocente(docenteData)
      } else {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', user.id)
          .single()

        setCompany(companyData)
        if (companyData) {
          setCompanyName(companyData.company_name || '')
          setPartitaIva(companyData.partita_iva || '')
          setCompanyDescription(companyData.description || '')
          setIndustry(companyData.industry || '')
          setWebsiteUrl(companyData.website_url || '')
          setAddress(companyData.address || '')
          setCity(companyData.city || '')
          setCap(companyData.cap || '')
          setProvince(companyData.province || '')
          setCountry(companyData.country || 'Italia')
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !profile) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)

      if (profile.role === 'student') {
        await supabase
          .from('students')
          .update({
            bio: bio || null,
            course,
            year: year ? parseInt(year) : null,
            phone: phone || null,
            portfolio_url: portfolioUrl || null,
            twitter_url: twitterUrl || null,
            linkedin_url: linkedinUrl || null,
            website_url: websiteUrl || null,
          })
          .eq('id', user.id)
      } else {
        await supabase
          .from('companies')
          .update({
            company_name: companyName,
            partita_iva: partitaIva || null,
            description: companyDescription || null,
            industry: industry || null,
            website_url: websiteUrl || null,
            address: address || null,
            city: city || null,
            cap: cap || null,
            province: province || null,
            country: country || null,
          })
          .eq('id', user.id)
      }
      setEditMode(false)
      loadProfile()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (showSkeleton || authLoading) {
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
            <aside className="lg:col-span-3 space-y-6">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={4} />
            </aside>
          </div>
        </div>
      </div>
    )
  }

  // === PROFILO STUDENTE (layout social) ===
  if (profile?.role === 'student') {
    return (
      <div className="min-h-screen bg-gray-100/80">

        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Sidebar sinistra (come dashboard) */}
            <aside className="lg:col-span-3 space-y-6">
              <Card variant="elevated" className="sticky top-24">
                <div className="text-center mb-4">
                  <div className={`w-20 h-20 bg-gradient-to-br ${getProfileGradient('student', student?.course).circle} rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold`}>
                    {fullName?.[0]?.toUpperCase() || (student ? 'S' : '?')}
                  </div>
                  <h3 className="font-semibold text-lg">{fullName || user?.email?.split('@')[0]}</h3>
                  <div className="mt-1.5 flex justify-center">
                    <ProfilePill role={profile?.role} />
                  </div>
                  {student && (
                    <p className="text-sm text-gray-600 mt-1">{COURSE_CONFIG[student.course]?.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    {editMode ? 'Annulla' : 'Modifica profilo'}
                  </Button>
                  <Link href="/portfolio" className="block">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <FolderOpen className="w-4 h-4 shrink-0" />
                      Il Mio Portfolio
                    </Button>
                  </Link>
                  <Link href="/portfolio/nuovo" className="block">
                    <Button variant="primary" className="w-full justify-start" size="sm">
                      <Plus className="w-4 h-4 shrink-0" />
                      Aggiungi Lavoro
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Connessioni</span>
                    <span className="font-semibold">{connectionsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lavori</span>
                    <span className="font-semibold">{portfolioCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Candidature</span>
                    <span className="font-semibold">{applications.length}</span>
                  </div>
                </div>
              </Card>
            </aside>

            {/* Contenuto principale - profilo stile social */}
            <main className="lg:col-span-6 space-y-4">
              {/* Cover + Avatar (stile Facebook) */}
              <Card variant="elevated" padding={false} className="overflow-hidden">
                <div className={`h-32 sm:h-40 bg-gradient-to-r ${getProfileGradient('student', student?.course).cover}`} />
                <div className="px-6 pb-6 -mt-12 relative">
                  <div className={`w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br ${getProfileGradient('student', student?.course).circle} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                    {fullName?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mt-4">{fullName || 'Studente'}</h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    {student && COURSE_CONFIG[student.course]?.name} • {year}° anno
                  </p>
                  {bio && (
                    <p className="text-gray-700 mt-3 leading-relaxed">{bio}</p>
                  )}
                  {(portfolioUrl || linkedinUrl || twitterUrl || websiteUrl) && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-sm">
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          Portfolio
                        </a>
                      )}
                      {linkedinUrl && (
                        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-sm">
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          LinkedIn
                        </a>
                      )}
                      {websiteUrl && (
                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-sm">
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          Sito
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Form modifica (visibile in editMode) */}
              {editMode && (
                <Card variant="elevated">
                  <h2 className="text-lg font-semibold mb-4">Modifica informazioni</h2>
                  <div className="space-y-4">
                    <Input label="Nome e Cognome" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    <Input label="Telefono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 123 456 7890" />
                    <Select label="Corso" value={course} onChange={(e) => setCourse(e.target.value as CourseType)}>
                      {COURSES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label} ({c.type === 'triennio' ? 'Triennio' : 'Biennio'})</option>
                      ))}
                    </Select>
                    <Textarea label="Bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Racconta qualcosa di te..." />
                    <Input label="Portfolio URL" type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
                    <Input label="LinkedIn" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                    <Input label="Sito personale" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                    <div className="flex gap-3 pt-2">
                      <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvataggio...' : 'Salva'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>Annulla</Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Anteprima Lavori */}
              <Card variant="elevated">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 shrink-0 text-primary-600" />
                    I miei lavori
                  </h2>
                  <Link href="/portfolio">
                    <Button variant="ghost" size="sm">Vedi tutti</Button>
                  </Link>
                </div>
                {portfolioItems.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">Nessun lavoro pubblicato. <Link href="/portfolio/nuovo" className="text-primary-600 hover:underline">Aggiungi il primo</Link></p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolioItems.slice(0, 6).map((item) => (
                      <Link key={item.id} href={`/portfolio/${item.id}`}>
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Briefcase className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{item.title}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </main>

            {/* Sidebar destra */}
            <aside className="lg:col-span-3 space-y-6">
              <Card variant="elevated">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-semibold flex-1 min-w-0">Le Tue Candidature</h3>
                  <Link href="/candidature" className="shrink-0">
                    <Button variant="ghost" size="sm" className="whitespace-nowrap">Vedi tutte</Button>
                  </Link>
                </div>
                {applications.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">Nessuna candidatura</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <Link key={app.id} href="/candidature">
                        <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <p className="font-medium text-sm line-clamp-1">{app.job_post?.title}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Scopri */}
              <Card variant="elevated">
                <h3 className="font-semibold mb-4 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 text-primary-600" />
                  Scopri
                </h3>
                <div className="space-y-2">
                  <Link href="/rete" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                    <Users className="w-5 h-5 shrink-0" />
                    <span>Network</span>
                    {connectionsCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                        {connectionsCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/tesi" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                    <BookOpen className="w-5 h-5 shrink-0" />
                    <span>Proposte Tesi</span>
                  </Link>
                  <Link href="/annunci" className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors py-2">
                    <Briefcase className="w-5 h-5 shrink-0" />
                    <span>Tirocini e Stage</span>
                  </Link>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  // === PROFILO DOCENTE ===
  if (profile?.role === 'docente') {
    return (
      <div className="min-h-screen bg-gray-100/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card variant="elevated" className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {fullName?.[0]?.toUpperCase() || 'D'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{fullName || user?.email}</h1>
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
                    {COURSE_CONFIG[c as CourseType]?.name || c}
                  </span>
                ))}
              </div>
            )}
          </Card>
          <Link href="/tesi">
            <Button variant="primary">Proposte Tesi</Button>
          </Link>
        </div>
      </div>
    )
  }

  // === PROFILO AZIENDA (layout attuale) ===
  return (
    <div className="min-h-screen bg-gray-100/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profilo Azienda</h1>
          <ProfilePill role="company" />
        </div>
        <p className="text-gray-600 -mt-6 mb-8">Gestisci i dati della tua azienda</p>

        <Card variant="elevated" className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Building2 className="w-5 h-5 shrink-0 text-primary-600" />
            Dati azienda
          </h2>
          <div className="space-y-4">
            <Input label="Nome Azienda" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            <Input label="Partita IVA" value={partitaIva} onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="11 cifre" />
            <Textarea label="Descrizione" rows={4} value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} placeholder="Descrivi la tua azienda..." />
            <Input label="Settore" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Es: Design, Marketing..." />
            <Input label="Sito Web" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
          </div>
        </Card>

        <Card variant="elevated" className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">Sede legale</h2>
          <div className="space-y-4">
            <Input label="Indirizzo" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Via Roma 1" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="CAP" value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="50100" />
              <Input label="Città" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Firenze" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Provincia" value={province} onChange={(e) => setProvince(e.target.value.toUpperCase().slice(0, 2))} placeholder="FI" />
              <Select label="Stato" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="Italia">Italia</option>
                <option value="Altro">Altro</option>
              </Select>
            </div>
          </div>
        </Card>

        <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Salvataggio...' : 'Salva profilo'}
        </Button>
      </div>
    </div>
  )
}
