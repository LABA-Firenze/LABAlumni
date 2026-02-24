'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/pannello')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Accedi
              </h1>
              <p className="text-gray-600">
                Benvenuto di nuovo
              </p>
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
                placeholder="tuo@email.com"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />

              <Button 
                type="submit" 
                className="w-full group flex items-center justify-center" 
                disabled={loading}
              >
                {loading ? (
                  'Accesso in corso...'
                ) : (
                  <>
                    <span>Accedi</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600 text-sm">
                Non hai un account?{' '}
                <Link href="/registrati" className="text-primary-600 font-medium hover:underline">Studente</Link>
                {' · '}
                <Link href="/registrazione/docente" className="text-primary-600 font-medium hover:underline">Docente</Link>
                {' · '}
                <Link href="/registrazione/azienda" className="text-primary-600 font-medium hover:underline">Azienda</Link>
              </p>
              <Link href="/" className="block text-gray-500 text-sm hover:text-primary-600 transition-colors">
                ← Torna alla home
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
