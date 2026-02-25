'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isStudentLogos, setIsStudentLogos] = useState(true)
  const router = useRouter()

  /** Login studenti: prima sincronizza con LOGOS, poi accedi a Supabase */
  const handleStudentLogosSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/logos-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Accesso con LOGOS non riuscito')
        setLoading(false)
        return
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      router.push('/pannello')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'accesso')
    } finally {
      setLoading(false)
    }
  }

  /** Login docenti / aziende: solo Supabase */
  const handleClassicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/pannello')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = isStudentLogos ? handleStudentLogosSubmit : handleClassicSubmit

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Accedi</h1>
              <p className="text-gray-600">Benvenuto su LABAlumni</p>
            </div>

            <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
              <button
                type="button"
                onClick={() => { setIsStudentLogos(true); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${isStudentLogos ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <GraduationCap className="w-4 h-4" />
                Studente (LOGOS)
              </button>
              <button
                type="button"
                onClick={() => { setIsStudentLogos(false); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${!isStudentLogos ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Docente / Azienda
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-slide-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={isStudentLogos ? 'email @labafirenze.com' : 'tuo@email.com'}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <Button type="submit" className="w-full group flex items-center justify-center" disabled={loading}>
                {loading ? 'Accesso in corso...' : (
                  <>
                    <span>Accedi</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {isStudentLogos && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Usa le stesse credenziali del portale LABA (LOGOS). Il primo accesso crea il tuo profilo su LABAlumni.
              </p>
            )}

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600 text-sm">
                Non hai un account?{' '}
                <Link href="/registrazione/docente" className="text-primary-600 font-medium hover:underline">Docente</Link>
                {' · '}
                <Link href="/registrazione/azienda" className="text-primary-600 font-medium hover:underline">Azienda</Link>
              </p>
              <p className="text-gray-500 text-xs">
                Gli studenti accedono solo con credenziali LABA (LOGOS), senza registrazione.
              </p>
              <Link href="/" className="block text-gray-500 text-sm hover:text-primary-600 transition-colors mt-2">
                ← Torna alla home
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
