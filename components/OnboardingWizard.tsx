'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Building2,
  BookOpen,
  Image as ImageIcon,
  Upload,
  Tag,
  ArrowRight,
  X,
  Users,
  Briefcase,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const TOTAL_STEPS = 5

interface OnboardingWizardProps {
  onComplete: () => void
  onSkip?: () => void
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const focusables = el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const first = focusables[0]
    if (first) first.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip?.()
        onComplete()
      }
      if (e.key !== 'Tab') return
      const el = containerRef.current
      if (!el) return
      const focusables = Array.from(el.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')).filter((x) => !x.hasAttribute('disabled'))
      const idx = focusables.indexOf(document.activeElement as HTMLElement)
      if (idx === -1) return
      if (e.shiftKey) {
        if (idx === 0) {
          e.preventDefault()
          focusables[focusables.length - 1]?.focus()
        }
      } else {
        if (idx === focusables.length - 1) {
          e.preventDefault()
          focusables[0]?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onComplete, onSkip])

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onSkip?.()
    onComplete()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm animate-fade-in"
      aria-modal
      aria-labelledby="onboarding-title"
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 animate-slide-up"
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        {/* Skip */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Salta tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-12">
          {/* Progress */}
          <div className="flex gap-2 mb-10">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-primary-500' : 'bg-gray-200'
                }`}
                aria-hidden
              />
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[280px]">
            {step === 0 && (
              <Step1 />
            )}
            {step === 1 && (
              <Step2 />
            )}
            {step === 2 && (
              <Step3 />
            )}
            {step === 3 && (
              <Step4 />
            )}
            {step === 4 && (
              <Step5 />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Salta tutorial
            </button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              className="group"
            >
              {step < TOTAL_STEPS - 1 ? (
                <>
                  Avanti
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                'Inizia a esplorare'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step1() {
  return (
    <div className="animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/25">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h2 id="onboarding-title" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        Benvenuto su LABAlumni
      </h2>
      <p className="text-gray-600 text-lg leading-relaxed">
        LABAlumni è la piattaforma che connette studenti, docenti e aziende della Libera Accademia di Belle Arti.
        Qui puoi metterti in mostra, cercare tirocini, proporre tesi e costruire la tua rete professionale.
      </p>
    </div>
  )
}

function Step2() {
  const features = [
    { icon: Building2, title: 'Aziende', desc: 'Scopri tirocini e collaborazioni' },
    { icon: BookOpen, title: 'Tesi', desc: 'Proponi e candidati per tesi di laurea' },
    { icon: GraduationCap, title: 'Docenti', desc: 'Trova relatori e correlatori' },
    { icon: Briefcase, title: 'Richieste', desc: 'Pubblica la tua disponibilità' },
    { icon: Users, title: 'Rete', desc: 'Connettiti con studenti e professionisti' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/25">
        <Users className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Cosa puoi fare sulla piattaforma
      </h2>
      <p className="text-gray-600 mb-8">
        Esplora tutte le funzionalità pensate per accompagnarti nel percorso post-laurea:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-colors"
          >
            <div className="w-10 h-10 shrink-0 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step3() {
  return (
    <div className="animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
        <ImageIcon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        Il tuo portfolio
      </h2>
      <p className="text-gray-600 text-lg leading-relaxed mb-6">
        Il portfolio è il cuore del tuo profilo. È una raccolta delle tue opere migliori: progetti, fotografie,
        video, design. Le aziende e i docenti lo usano per scoprire il tuo lavoro e valutare collaborazioni.
      </p>
      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100">
        <p className="text-emerald-800 text-sm font-medium">
          💡 Consiglio: aggiungi progetti completati e ben descritti. Un portfolio curato aumenta le tue possibilità di essere notato.
        </p>
      </div>
    </div>
  )
}

function Step4() {
  return (
    <div className="animate-fade-in">
      <div className="flex gap-3 mb-6">
        <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
          <Upload className="w-7 h-7 text-primary-600" />
        </div>
        <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
          <Tag className="w-7 h-7 text-primary-600" />
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        Come caricare e catalogare le opere
      </h2>
      <ol className="space-y-4 text-gray-600">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center">1</span>
          <div>
            <strong className="text-gray-900">Vai al Portfolio</strong> dal menu e clicca su &quot;Aggiungi Lavoro&quot;
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center">2</span>
          <div>
            <strong className="text-gray-900">Carica le immagini</strong> del progetto (fino a 10 per opera)
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center">3</span>
          <div>
            <strong className="text-gray-900">Scegli la categoria</strong> (Grafica, Fotografia, Video, Design, ecc.) e aggiungi tag
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center">4</span>
          <div>
            <strong className="text-gray-900">Scrivi titolo e descrizione</strong> per dare contesto al progetto
          </div>
        </li>
      </ol>
    </div>
  )
}

function Step5() {
  return (
    <div className="animate-fade-in text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/30">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        Sei pronto!
      </h2>
      <p className="text-gray-600 text-lg max-w-md mx-auto mb-2">
        Ora conosci le basi di LABAlumni. Completa il tuo profilo, aggiungi le prime opere al portfolio e inizia a esplorare le opportunità.
      </p>
      <p className="text-primary-600 font-medium">
        Buon lavoro! 🚀
      </p>
    </div>
  )
}
