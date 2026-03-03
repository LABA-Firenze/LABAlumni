'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ArrowRight, ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function CompanyRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [companyName, setCompanyName] = useState('')
  const [partitaIva, setPartitaIva] = useState('')
  const [referentName, setReferentName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [cap, setCap] = useState('')
  const [province, setProvince] = useState('')
  const [country, setCountry] = useState('Italia')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateStep = (step: number): boolean => {
    setError('')

    if (step === 1) {
      if (!companyName?.trim() || !referentName?.trim()) {
        setError('Nome azienda e referente obbligatori')
        return false
      }
      if (partitaIva.replace(/\s/g, '').length !== 11) {
        setError('La Partita IVA deve essere di 11 cifre')
        return false
      }
    }

    if (step === 2) {
      if (!email?.trim() || !password || !confirmPassword) {
        setError('Email e password obbligatori')
        return false
      }
      if (password.length < 6) {
        setError('La password deve essere di almeno 6 caratteri')
        return false
      }
      if (password !== confirmPassword) {
        setError('Le password non corrispondono')
        return false
      }
    }

    if (step === 3) {
      if (!address || !city || !cap) {
        setError('Compila indirizzo, città e CAP')
        return false
      }
      if (!/^\d{5}$/.test(cap.replace(/\s/g, ''))) {
        setError('Il CAP deve essere di 5 cifre')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return

    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'company',
            full_name: referentName,
            company_name: companyName,
          },
        },
      })

      if (authError) {
        if (authError.message?.includes('24 seconds') || authError.message?.includes('request this after')) {
          setError('Troppi tentativi. Attendi qualche secondo prima di riprovare.')
        } else if (authError.message?.includes('already registered')) {
          setError('Questa email è già registrata. Prova ad accedere.')
        } else {
          setError(authError.message || 'Errore durante la registrazione')
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError("Errore nella creazione dell'utente")
        setLoading(false)
        return
      }

      // Update profile (including avatar if uploaded)
      let avatarUrl: string | null = null
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${authData.user.id}/avatar_${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('image_profilo').upload(path, avatarFile, { cacheControl: '3600', upsert: true })
        if (!uploadErr) {
          const { data } = supabase.storage.from('image_profilo').getPublicUrl(path)
          avatarUrl = data.publicUrl
        }
      }
      await supabase
        .from('profiles')
        .update({
          full_name: referentName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id)

      // Insert company record
      const { error: companyError } = await supabase.from('companies').insert({
        id: authData.user.id,
        company_name: companyName,
        partita_iva: partitaIva.replace(/\s/g, ''),
        address: address || null,
        city: city || null,
        cap: cap.replace(/\s/g, '') || null,
        province: province || null,
        country: country || 'Italia',
        description: description || null,
        industry: industry || null,
        website_url: websiteUrl || null,
      })

      if (companyError) {
        if (companyError.code === '23505') {
          setError('Questa Partita IVA è già registrata')
        } else {
          setError(companyError.message || 'Errore nella creazione del profilo aziendale')
        }
        setLoading(false)
        return
      }

      router.push('/pannello/azienda')
      router.refresh()
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Errore durante la registrazione'
      setError(errMessage)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              label="Nome Azienda"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Es: Studio Design Srl"
            />

            <Input
              label="Partita IVA"
              value={partitaIva}
              onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, '').slice(0, 11))}
              required
              placeholder="11 cifre, es: 12345678901"
            />

            <Input
              label="Nome Referente"
              value={referentName}
              onChange={(e) => setReferentName(e.target.value)}
              required
              placeholder="Nome e cognome della persona di riferimento"
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Input
              label="Email Aziendale"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
              placeholder="contatti@azienda.it"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimo 6 caratteri"
              minLength={6}
            />

            <Input
              label="Conferma Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Ripeti la password"
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <Input
              label="Indirizzo / Via"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Via Roma 1"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CAP"
                value={cap}
                onChange={(e) => setCap(e.target.value.replace(/\D/g, '').slice(0, 5))}
                required
                placeholder="50100"
              />
              <Input
                label="Città"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
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
              <Select
                label="Stato"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="Italia">Italia</option>
                <option value="Altro">Altro</option>
              </Select>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <Textarea
              label="Descrizione Azienda"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione dell'attività aziendale..."
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
              placeholder="https://www.azienda.it"
            />

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Logo / Foto profilo (opzionale)</p>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-primary-400 cursor-pointer overflow-hidden bg-gray-50 shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-400">+</span>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f && f.size <= 5 * 1024 * 1024) {
                        setAvatarFile(f)
                        setAvatarPreview(URL.createObjectURL(f))
                      } else if (f) alert('File max 5MB')
                    }}
                  />
                </label>
                <div>
                  <p className="text-sm text-gray-600">Clicca per caricare un logo o foto</p>
                  {avatarFile && (
                    <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null) }} className="text-sm text-primary-600 hover:underline mt-1">
                      Rimuovi
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              I campi di questo step sono opzionali. Potrai completarli successivamente dal tuo profilo.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="w-8 h-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-center text-gray-900">
                Registrazione Azienda
              </h1>
            </div>
            <p className="text-center text-gray-600">
              Step {currentStep} di 4
            </p>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${s <= currentStep ? 'bg-primary-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={
              currentStep === 4
                ? handleSubmit
                : (e) => {
                    e.preventDefault()
                    handleNext()
                  }
            }
          >
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Indietro
              </Button>

              {currentStep < 4 ? (
                <Button type="submit" variant="primary" className="flex items-center gap-2">
                  Avanti
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? 'Registrazione...' : 'Registra Azienda'}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              Hai già un account?{' '}
              <Link href="/accedi" className="text-primary-600 font-medium hover:underline">
                Accedi
              </Link>
            </p>
            <p className="text-gray-500 text-xs">
              Sei studente? <Link href="/registrati" className="text-primary-600 hover:underline">Registrati</Link>
              {' · '}
              Sei un docente? <Link href="/registrazione/docente" className="text-primary-600 hover:underline">Registrati come docente</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
