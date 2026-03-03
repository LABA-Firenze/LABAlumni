'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
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
        .then((res) => {
          const role = res.data?.role
          if (role === 'admin') router.replace('/pannello/admin')
          else if (role === 'company') router.replace('/pannello/azienda')
          else if (role === 'docente') router.replace('/tesi')
          else router.replace('/pannello/studente')
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
      
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-24 lg:py-32">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23fff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")` }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/10 rounded-full blur-[80px] -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/80 text-sm font-medium uppercase tracking-widest mb-6">
            LABA Firenze · Libera Accademia di Belle Arti
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
            La rete professionale di LABA Firenze
          </h1>
          <p className="text-xl text-white/95 mb-4">
            La piattaforma ufficiale che connette studenti, diplomati e aziende.
          </p>
          <p className="text-white/85 mb-10 leading-relaxed">
            Accedi a opportunità di lavoro e tirocini curriculari ed extracurriculari. Costruisci il tuo profilo professionale, entra in contatto con le aziende e sviluppa il tuo percorso nel mondo creativo.
          </p>
          <p className="text-white/70 text-sm italic mb-10">
            Dalla formazione al lavoro, in un unico spazio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/accedi">
              <span className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-primary-600 font-medium hover:bg-white/95 transition-colors cursor-pointer shadow-lg">
                Accedi
              </span>
            </Link>
            <Link href="/registrati">
              <span className="inline-flex items-center justify-center h-12 px-8 rounded-full border-2 border-white/80 text-white font-medium hover:bg-white/10 transition-colors cursor-pointer">
                Registrati (Docenti e Aziende)
              </span>
            </Link>
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
                    <span className="text-gray-700">Trova tirocini</span>
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
                <Link href="/registrazione/azienda" className="inline-flex items-center gap-2 mt-6 text-accent-600 font-semibold hover:text-accent-700 transition-colors">
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
                    <span className="text-gray-700">Tesi di laurea e relatore</span>
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

      {/* Cosa puoi fare */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            Cosa puoi fare
          </h2>
          <p className="text-center text-gray-600 mb-14 max-w-xl mx-auto">
            Tutto ciò di cui hai bisogno per il tuo percorso professionale
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trova Opportunità</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tirocini mirati per il tuo corso
              </p>
            </div>
            <div className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connetterti</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Conosci aziende del settore creativo e altri studenti
              </p>
            </div>
            <div className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Messaggistica</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Comunica direttamente con chi ti interessa
              </p>
            </div>
            <div className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bacheca</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Resta aggiornato con news e articoli del settore
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Semplice e diretto */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            Semplice e diretto
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-md mx-auto">
            Tre passi per entrare nella rete professionale LABA
          </p>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-200 to-transparent -translate-y-1/2" />
            <div className="grid md:grid-cols-3 gap-10 md:gap-8 relative">
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-primary-500/30 z-10">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">Registrati</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-[200px]">
                  Crea il tuo profilo in pochi passi
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-primary-500/30 z-10">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">Esplora</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-[200px]">
                  Trova tirocini e connettiti con le aziende
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-primary-500/30 z-10">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">Inizia</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-[200px]">
                  Candidati e costruisci la tua carriera
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/30 via-transparent to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Pronto a iniziare?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Unisciti alla community oggi
          </p>
          <Link href="/registrati">
            <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:bg-white/95 transition-all duration-200">
              Registrati Gratis
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-lg font-semibold tracking-tight">LABAlumni</p>
              <p className="text-slate-400 text-sm mt-1">Piattaforma di job placement per LABA Firenze</p>
            </div>
            <div className="flex gap-8 text-sm text-slate-400">
              <Link href="/accedi" className="hover:text-white transition-colors">Accedi</Link>
              <Link href="/registrati" className="hover:text-white transition-colors">Registrati</Link>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-700/50">
            <p className="text-slate-500 text-xs text-center">
              © {new Date().getFullYear()} LABAlumni · LABA Firenze
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
