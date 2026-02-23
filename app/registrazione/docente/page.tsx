'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ArrowRight, ArrowLeft, GraduationCap } from 'lucide-react'
import { COURSE_CONFIG, type CourseType } from '@/types/database'
import Link from 'next/link'

const COURSES = Object.entries(COURSE_CONFIG).map(([value, config]) => ({
  value: value as CourseType,
  label: config.name,
}))

export default function DocenteRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [bio, setBio] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<CourseType[]>([])
  const [canRelatore, setCanRelatore] = useState(true)
  const [canCorelatore, setCanCorelatore] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleCourse = (c: CourseType) => {
    setSelectedCourses((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  const validateStep = (step: number): boolean => {
    setError('')
    if (step === 1) {
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Compila tutti i campi obbligatori')
        return false
      }
      if (!email.endsWith('@labafirenze.com')) {
        setError('L\'email deve essere del dominio @labafirenze.com')
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
    if (step === 2) {
      if (!canRelatore && !canCorelatore) {
        setError('Indica almeno una disponibilità (Relatore o Corelatore)')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(1) || !validateStep(2)) return

    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'docente',
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Registrazione fallita')

      const { error: docError } = await supabase.from('docenti').insert({
        id: authData.user.id,
        bio: bio || null,
        courses: selectedCourses,
        can_relatore: canRelatore,
        can_corelatore: canCorelatore,
      })

      if (docError) throw docError

      router.push('/tesi')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 flex items-center justify-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary-600" />
              Registrati come Docente
            </h1>
            <p className="text-center text-gray-600">
              Diventa Relatore o Corelatore per le tesi degli studenti LABA
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={currentStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <Input label="Nome e Cognome" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Mario Rossi" />
                <Input label="Email Accademica" type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} required placeholder="nome.cognome@labafirenze.com" />
                <p className="text-sm text-gray-500 -mt-2">Solo email del dominio @labafirenze.com</p>
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Minimo 6 caratteri" />
                <Input label="Conferma Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Ripeti la password" />
                <Textarea label="Bio (opzionale)" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Breve presentazione..." />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">Corsi di competenza (opzionale)</p>
                <div className="flex flex-wrap gap-2">
                  {COURSES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleCourse(c.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        selectedCourses.includes(c.value)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700">Disponibilità</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={canRelatore} onChange={(e) => setCanRelatore(e.target.checked)} className="rounded border-gray-300 text-primary-600" />
                    <span>Posso fare da Relatore</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={canCorelatore} onChange={(e) => setCanCorelatore(e.target.checked)} className="rounded border-gray-300 text-primary-600" />
                    <span>Posso fare da Corelatore</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Indietro
              </Button>
              {currentStep < 2 ? (
                <Button type="submit" variant="primary">
                  Avanti
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Registrazione...' : 'Registrati come Docente'}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600 text-sm">
              Hai già un account?{' '}
              <Link href="/accedi" className="text-primary-600 font-medium hover:underline">
                Accedi
              </Link>
            </p>
            <p className="text-gray-500 text-xs">
              Sei studente?{' '}
              <Link href="/registrati" className="text-primary-600 hover:underline">Registrati come studente</Link>
              {' · '}
              Sei un&apos;azienda?{' '}
              <Link href="/registrazione/azienda" className="text-primary-600 hover:underline">Registra azienda</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
