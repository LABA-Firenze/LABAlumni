'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

const TOUR_KEY = 'labalumni-tour-v1'

interface Step {
  id: string
  target: string
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const DEFAULT_STEPS: Step[] = [
  { id: 'dashboard', target: '[data-tour="dashboard"]', title: 'La tua dashboard', body: 'Qui trovi riepiloghi e link rapidi. Visita spesso per restare aggiornato.', placement: 'bottom' },
  { id: 'portfolio', target: '[data-tour="portfolio"]', title: 'Portfolio', body: 'Aggiungi i tuoi migliori lavori: le aziende li cercano qui.', placement: 'bottom' },
  { id: 'annunci', target: '[data-tour="annunci"]', title: 'Tirocini e opportunità', body: 'Cerca tirocini e candidati alle offerte che ti interessano.', placement: 'bottom' },
  { id: 'rete', target: '[data-tour="rete"]', title: 'Rete', body: 'Connettiti con studenti, docenti e aziende LABA.', placement: 'bottom' },
  { id: 'messaggi', target: '[data-tour="messaggi"]', title: 'Messaggi', body: 'Le aziende possono contattarti qui. Rispondi sempre!', placement: 'left' },
]

interface GuidedTourProps {
  steps?: Step[]
  onComplete?: () => void
}

export function GuidedTour({ steps = DEFAULT_STEPS, onComplete }: GuidedTourProps) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(TOUR_KEY, '1')
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_KEY)) return
      setActive(true)
    } catch (_) {}
  }, [])

  const currentStep = steps[stepIndex]
  const targetEl = typeof document !== 'undefined' && currentStep
    ? document.querySelector(currentStep.target)
    : null

  useEffect(() => {
    if (!active || !currentStep || !targetEl) {
      setRect(null)
      return
    }
    const obs = new ResizeObserver(() => {
      setRect(targetEl.getBoundingClientRect())
    })
    obs.observe(targetEl)
    setRect(targetEl.getBoundingClientRect())
    return () => obs.disconnect()
  }, [active, stepIndex, currentStep?.id])

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      markCompleted()
      setActive(false)
      onComplete?.()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  const handleClose = () => {
    markCompleted()
    setActive(false)
    onComplete?.()
  }

  if (!active || !currentStep) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] pointer-events-none"
        aria-hidden="true"
      />
      {/* Highlight box (optional - around target) */}
      {rect && (
        <div
          className="fixed z-[101] rounded-lg pointer-events-none ring-2 ring-primary-500 ring-offset-2 bg-primary-500/5 transition-all"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}
      {/* Tooltip */}
      <div
        className="fixed z-[102] w-[320px] max-w-[calc(100vw-2rem)]"
        style={{
          left: rect ? rect.left + rect.width / 2 : '50%',
          top: rect ? (currentStep.placement === 'top' ? rect.top - 12 : rect.bottom + 12) : '50%',
          transform: rect
            ? `translate(-50%, ${currentStep.placement === 'top' ? '-100%' : '0'})`
            : 'translate(-50%, -50%)',
        }}
      >
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{currentStep.title}</h4>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">{currentStep.body}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {stepIndex + 1} / {steps.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Salta
              </button>
              <button
                onClick={handleNext}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {stepIndex >= steps.length - 1 ? 'Fine' : 'Avanti'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function resetTour() {
  try {
    localStorage.removeItem(TOUR_KEY)
  } catch (_) {}
}
