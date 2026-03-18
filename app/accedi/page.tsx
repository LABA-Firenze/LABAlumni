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
        setError(data.error || 'Accesso non riuscito')
        setLoading(false)
        return
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      const from = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirectedFrom') : null
      const target = from && from.startsWith('/') ? from : '/pannello'
      window.location.href = target
      return
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'accesso')
    } finally {
      setLoading(false)
    }
  }

  /** Login docenti / aziende: solo Supabase. Gli studenti sono bloccati: devono usare il tab Studente. */
  const handleClassicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (!authData.user) throw new Error('Utente non trovato')
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single()
      const { data: studentRow } = await supabase.from('students').select('id').eq('id', authData.user.id).single()
      if (profile?.role === 'student' || studentRow) {
        await supabase.auth.signOut()
        setError('Gli studenti devono accedere con il tab Studente.')
        setLoading(false)
        return
      }
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
      <div className="flex justify-center items-start min-h-screen px-4 pt-24 pb-16">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Accedi</h1>
              <p className="text-gray-600">Benvenuto su LABAlumni</p>
            </div>

            <div role="tablist" aria-label="Tipo di account" className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
              <button
                type="button"
                role="tab"
                aria-selected={isStudentLogos}
                aria-controls="login-panel"
                id="tab-studente"
                onClick={() => { setIsStudentLogos(true); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${isStudentLogos ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <GraduationCap className="w-4 h-4" />
                Studente
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isStudentLogos}
                aria-controls="login-panel"
                id="tab-docente"
                onClick={() => { setIsStudentLogos(false); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${!isStudentLogos ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Docente / Azienda
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-slide-up" role="alert">
                {error}
              </div>
            )}

            <form id="login-panel" role="tabpanel" aria-labelledby={isStudentLogos ? 'tab-studente' : 'tab-docente'} onSubmit={handleSubmit} className="space-y-5">
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
              {isStudentLogos ? (
                <p className="text-xs text-gray-500 text-center -mt-1">
                  Accedi con le credenziali che usi per l&apos;applicazione LABA.
                </p>
              ) : (
                <p className="text-xs text-gray-500 text-center -mt-1">
                  Accedi con le credenziali del tuo account docente o azienda.
                </p>
              )}
              <Button type="submit" className="w-full group flex items-center justify-center" disabled={loading}>
                {loading ? 'Accesso in corso...' : (
                  <>
                    <span>Accedi</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="shadow-xl mt-4 text-center py-4">
            <p className="text-gray-600 text-sm">
              Non hai un account? Registrati come{' '}
              <Link href="/registrazione/docente" className="text-primary-600 font-medium hover:underline">Docente</Link>
              {' o '}
              <Link href="/registrazione/azienda" className="text-primary-600 font-medium hover:underline">Azienda</Link>.
            </p>
            <Link href="/" className="block text-gray-500 text-sm hover:text-primary-600 transition-colors mt-3">
              ← Torna alla home
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
