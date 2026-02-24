'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Briefcase, Users, MessageSquare, Newspaper, GraduationCap, ArrowRight, FileCheck, Send, Search, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }: any) => {
          if (data?.role === 'company') {
            router.replace('/pannello/azienda')
          } else {
            router.replace('/pannello/studente')
          }
        })
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100/90 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-100/90 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100/90">
      <Navbar />
      
      {/* Hero Section - Nuovo stile grafico */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 py-28 lg:py-36">
        {/* Pattern di sfondo raffinato */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M20 0v40M0 20h40' stroke='%23ffffff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/30 to-transparent" />
        
        {/* Elementi decorativi minimali */}
        <div className="absolute top-16 right-16 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-16 left-16 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
              <GraduationCap className="w-10 h-10 text-white/90" />
              <div className="text-left">
                <p className="text-white/90 text-sm font-medium tracking-wide">LABA Firenze</p>
                <p className="text-white/70 text-xs">Libera Accademia di Belle Arti</p>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 animate-slide-up leading-tight">
              La rete professionale di LABA Firenze
            </h1>
            
            <p className="text-xl text-white/95 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              La piattaforma ufficiale che connette studenti, diplomati e aziende.
            </p>
            
            <p className="text-lg text-white/85 mb-10 animate-slide-up max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.15s' }}>
              Accedi a opportunità di lavoro, stage e tirocini curriculari ed extracurriculari.
              Costruisci il tuo profilo professionale, entra in contatto con le aziende e sviluppa il tuo percorso nel mondo creativo.
            </p>

            <p className="text-white/80 italic text-base mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Dalla formazione al lavoro, in un unico spazio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/registrati">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-white/95 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <span>Crea il tuo profilo</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/accedi">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm">
                  Accedi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Per Studenti / Per Aziende - Distinzione visiva */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Una piattaforma, tre percorsi
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Per Studenti */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary-100 bg-gradient-to-br from-primary-50 to-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">Per Studenti</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Trova stage e tirocini</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Candidati alle offerte</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Costruisci il tuo network</span>
                  </li>
                </ul>
                <Link href="/registrati" className="inline-flex items-center gap-2 mt-6 text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Inizia come studente
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Per Aziende */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-accent-100 bg-gradient-to-br from-accent-50 to-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent-600 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-accent-800">Per Aziende</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Send className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Pubblica opportunità</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Scopri talenti LABA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Entra in contatto diretto</span>
                  </li>
                </ul>
                <Link href="/registrati" className="inline-flex items-center gap-2 mt-6 text-accent-600 font-semibold hover:text-accent-700 transition-colors">
                  Registra la tua azienda
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Per Docenti */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-800">Per Docenti</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Inizia conversazioni con aziende e studenti</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Proposte tesi e relatore</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Candidati come relatore o corelatore</span>
                  </li>
                </ul>
                <Link href="/registrazione/docente" className="inline-flex items-center gap-2 mt-6 text-amber-600 font-semibold hover:text-amber-700 transition-colors">
                  Registrati come docente
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-100/80 py-20">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Cosa puoi fare
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <Briefcase className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trova Opportunità</h3>
              <p className="text-gray-600">
                Tirocini e stage mirati per il tuo corso
              </p>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connetterti</h3>
              <p className="text-gray-600">
                Conosci aziende del settore creativo e altri studenti
              </p>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <MessageSquare className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Messaggistica</h3>
              <p className="text-gray-600">
                Comunica direttamente con chi ti interessa
              </p>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <Newspaper className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Bacheca</h3>
              <p className="text-gray-600">
                Resta aggiornato con news e articoli del settore
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works - Simplified */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Semplice e diretto</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Registrati</h3>
              <p className="text-gray-600">
                Crea il tuo profilo in pochi passi
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Esplora</h3>
              <p className="text-gray-600">
                Trova tirocini e stage e connettiti con le aziende
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Inizia</h3>
              <p className="text-gray-600">
                Candidati e costruisci la tua carriera
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto a iniziare?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Unisciti alla community oggi
          </p>
          <Link href="/registrati">
            <Button variant="secondary" size="lg">Registrati Gratis</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">LABAlumni</p>
            <p className="text-gray-400">Piattaforma di job placement per LABA Firenze</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
