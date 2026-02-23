'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { User, Building2, GraduationCap, Link as LinkIcon } from 'lucide-react'
import type { Student, Company, Profile, CourseType } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      alert('Profilo aggiornato con successo!')
      loadProfile()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profile?.role === 'student' ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profilo Studente</h1>
            <p className="text-gray-600 mb-8">
              Gestisci i tuoi dati personali e il tuo percorso LABA
            </p>

            <Card className="mb-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <User className="w-5 h-5 text-primary-600 shrink-0" />
                Dati anagrafici
              </h2>
              <div className="space-y-4">
                <Input
                  label="Nome e Cognome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mario Rossi"
                />
                <Input
                  label="Telefono"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 123 456 7890"
                />
              </div>
            </Card>

            <Card className="mb-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <GraduationCap className="w-5 h-5 text-primary-600 shrink-0" />
                Corso di studio
              </h2>
              <div className="space-y-4">
                <Select
                  label="Corso di Appartenenza"
                  value={course}
                  onChange={(e) => setCourse(e.target.value as CourseType)}
                >
                  {COURSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({c.type === 'triennio' ? 'Triennio' : 'Biennio'})
                    </option>
                  ))}
                </Select>
                <div>
                  <Input
                    label="Anno di Corso"
                    type="number"
                    value={year}
                    onChange={() => {}}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    L&apos;anno viene aggiornato automaticamente ogni 1 ottobre
                  </p>
                </div>
              </div>
            </Card>

            <Card className="mb-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <LinkIcon className="w-5 h-5 text-primary-600 shrink-0" />
                Bio e Link
              </h2>
              <div className="space-y-4">
                <Textarea
                  label="Bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Racconta qualcosa di te, i tuoi interessi e obiettivi..."
                />
                <Input
                  label="Portfolio"
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                />
                <Input
                  label="LinkedIn"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
                <Input
                  label="Twitter / X"
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/..."
                />
                <Input
                  label="Sito personale"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </Card>

            <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Salvataggio...' : 'Salva profilo'}
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profilo Azienda</h1>
            <p className="text-gray-600 mb-8">
              Gestisci i dati della tua azienda
            </p>

            <Card className="mb-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Building2 className="w-5 h-5 text-primary-600 shrink-0" />
                Dati azienda
              </h2>
              <div className="space-y-4">
                <Input
                  label="Nome Azienda"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                <Input
                  label="Partita IVA"
                  value={partitaIva}
                  onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="11 cifre"
                />
                <Textarea
                  label="Descrizione"
                  rows={4}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Descrivi la tua azienda..."
                />
                <Input
                  label="Settore"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Es: Design, Marketing, Tecnologia..."
                />
                <Input
                  label="Sito Web"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </Card>

            <Card className="mb-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                Sede legale
              </h2>
              <div className="space-y-4">
                <Input
                  label="Indirizzo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Via Roma 1"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="CAP"
                    value={cap}
                    onChange={(e) => setCap(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="50100"
                  />
                  <Input
                    label="Città"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Firenze"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Provincia"
                    value={province}
                    onChange={(e) => setProvince(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="FI"
                  />
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
          </>
        )}
      </div>
    </div>
  )
}
