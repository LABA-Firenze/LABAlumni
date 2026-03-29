'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Student, Profile } from '@/types/database'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid'

type Props = {
  profile: Profile | null
  student: Student | null
  portfolioCount: number
}

export function ProfileReadinessCard({ profile, student, portfolioCount }: Props) {
  if (!profile || profile.role !== 'student') return null

  const items: { ok: boolean; label: string; hint?: string; href?: string; cta?: string }[] = [
    {
      ok: !!(profile.full_name && profile.full_name.trim().length > 1),
      label: 'Nome e cognome',
      hint: 'Completa il nome visibile agli altri utenti',
      href: '/profilo',
      cta: 'Profilo',
    },
    {
      ok: !!profile.avatar_url,
      label: 'Foto profilo',
      hint: 'Aggiungi una foto per farti riconoscere',
      href: '/profilo',
      cta: 'Carica foto',
    },
    {
      ok: !!(student?.bio && student.bio.trim().length > 20),
      label: 'Bio / presentazione',
      hint: 'Almeno 2–3 frasi su di te e su cosa cerchi',
      href: '/profilo',
      cta: 'Modifica bio',
    },
    {
      ok: portfolioCount > 0,
      label: 'Almeno un lavoro in portfolio',
      hint: 'Mostra progetti concreti alle aziende',
      href: '/portfolio/nuovo',
      cta: 'Aggiungi lavoro',
    },
    {
      ok: !!(student?.linkedin_url || student?.website_url || student?.portfolio_url),
      label: 'Link professionali',
      hint: 'LinkedIn, sito o portfolio esterno',
      href: '/profilo',
      cta: 'Aggiungi link',
    },
  ]

  const done = items.filter((i) => i.ok).length
  const pct = Math.round((done / items.length) * 100)

  return (
    <Card variant="elevated" className="p-6 mb-6 border-primary-100/80 bg-gradient-to-br from-primary-50/50 to-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Profilo pronto per tirocini e candidature</h2>
          <p className="text-sm text-gray-600 mt-1">Completa i punti per aumentare le possibilità di risposta dalle aziende</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold text-primary-700">{pct}%</p>
          <p className="text-xs text-gray-500">completamento</p>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-3 text-sm">
            {it.ok ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span className={it.ok ? 'text-gray-600 line-through' : 'font-medium text-gray-900'}>{it.label}</span>
              {!it.ok && it.hint && <p className="text-gray-500 text-xs mt-0.5">{it.hint}</p>}
            </div>
            {!it.ok && it.href && (
              <Link href={it.href}>
                <Button variant="outline" size="sm">
                  {it.cta}
                </Button>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
