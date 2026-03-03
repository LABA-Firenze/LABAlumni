'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface ProfileChecklistProps {
  profile: { full_name?: string | null; avatar_url?: string | null }
  student?: { bio?: string | null; portfolio_url?: string | null }
  portfolioCount?: number
  connectionsCount?: number
  compact?: boolean
}

const ITEMS = [
  { key: 'name', label: 'Nome completo', check: (p: any) => !!p?.full_name?.trim(), href: '/profilo', linkText: 'Completa profilo' },
  { key: 'avatar', label: 'Foto profilo', check: (p: any) => !!p?.avatar_url, href: '/profilo', linkText: 'Aggiungi foto' },
  { key: 'bio', label: 'Bio / descrizione', check: (s: any) => !!s?.bio?.trim(), href: '/profilo', linkText: 'Scrivi bio' },
  { key: 'portfolio', label: 'Almeno 1 lavoro nel portfolio', check: (_: any, count?: number) => (count ?? 0) >= 1, href: '/portfolio', linkText: 'Aggiungi lavoro' },
  { key: 'connections', label: 'Almeno 1 connessione', check: (_: any, _c?: number, conn?: number) => (conn ?? 0) >= 1, href: '/rete', linkText: 'Connettiti' },
]

export function ProfileChecklist({ profile, student, portfolioCount = 0, connectionsCount = 0, compact }: ProfileChecklistProps) {
  const { completed, total, percentage } = useMemo(() => {
    const checks = ITEMS.map((item) => {
      if (item.key === 'portfolio') return item.check(null, portfolioCount)
      if (item.key === 'connections') return item.check(null, 0, connectionsCount)
      if (item.key === 'bio') return item.check(student)
      return item.check(profile)
    })
    const completed = checks.filter(Boolean).length
    return { completed, total: ITEMS.length, percentage: Math.round((completed / ITEMS.length) * 100) }
  }, [profile, student, portfolioCount, connectionsCount])

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Profilo {percentage}%
        </span>
      </div>
    )
  }

  const firstIncompleteIdx = ITEMS.findIndex((item) => {
    if (item.key === 'portfolio') return !item.check(null, portfolioCount)
    if (item.key === 'connections') return !item.check(null, 0, connectionsCount)
    if (item.key === 'bio') return !item.check(student)
    return !item.check(profile)
  })
  const first = ITEMS[firstIncompleteIdx]
  const firstHref = first?.href ?? '/profilo'
  const firstLinkText = first?.linkText ?? 'Completa'

  return (
    <Card variant="elevated" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Completa il tuo profilo</h3>
        <span className="text-sm text-gray-600">{completed}/{total}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ul className="space-y-2 mb-4">
        {ITEMS.map((item, i) => {
          const done = item.key === 'portfolio' ? item.check(null, portfolioCount)
            : item.key === 'connections' ? item.check(null, 0, connectionsCount)
            : item.key === 'bio' ? item.check(student)
            : item.check(profile)
          return (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
              )}
              <span className={done ? 'text-gray-600' : 'text-gray-900'}>{item.label}</span>
            </li>
          )
        })}
      </ul>
      {percentage < 100 && (
        <Link href={firstHref}>
          <Button variant="outline" size="sm" className="w-full">
            {firstLinkText}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      )}
    </Card>
  )
}
