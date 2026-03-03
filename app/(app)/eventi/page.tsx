'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/solid'

interface Event {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string | null
  location: string | null
  max_participants: number | null
  image_url: string | null
  published: boolean
}

export default function EventiPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<(Event & { registered?: boolean; count?: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [user])

  const loadEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('published', true)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })

      const evts = data || []
      if (user && evts.length > 0) {
        const { data: regs } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id)
        const registeredIds = new Set((regs || []).map((r: { event_id: string }) => r.event_id))
        const counts = await Promise.all(
          evts.map(async (e) => {
            const { count } = await supabase
              .from('event_registrations')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', e.id)
            return { id: e.id, count: count || 0 }
          })
        )
        const countMap = Object.fromEntries(counts.map((c) => [c.id, c.count]))
        setEvents(
          evts.map((e) => ({
            ...e,
            registered: registeredIds.has(e.id),
            count: countMap[e.id] || 0,
          }))
        )
      } else {
        setEvents(evts)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    if (!user) return
    try {
      await supabase.from('event_registrations').insert({ event_id: eventId, user_id: user.id })
      loadEvents()
    } catch (e: any) {
      alert(e.message || 'Errore iscrizione')
    }
  }

  const handleUnregister = async (eventId: string) => {
    if (!user) return
    try {
      await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('user_id', user.id)
      loadEvents()
    } catch (e: any) {
      alert(e.message || 'Errore')
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-primary-600" />
          Eventi
        </h1>
        <p className="text-gray-600 mt-2">Open day, workshop e incontri con le aziende LABA</p>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card variant="elevated" className="text-center py-16">
          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nessun evento in programma</h3>
          <p className="text-gray-600">Controlla più tardi per nuovi workshop e open day</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card key={event.id} variant="elevated" className="overflow-hidden">
              {event.image_url && (
                <div className="aspect-video bg-gray-100">
                  <img src={event.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                {event.description && (
                  <p className="text-gray-600 mt-2 text-sm line-clamp-3">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(event.start_at).toLocaleString('it-IT')}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {event.location}
                    </span>
                  )}
                  {event.max_participants != null && (
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      {event.count ?? 0}/{event.max_participants}
                    </span>
                  )}
                </div>
                {user && (
                  <div className="mt-4">
                    {event.registered ? (
                      <Button variant="outline" onClick={() => handleUnregister(event.id)}>
                        Annulla iscrizione
                      </Button>
                    ) : (
                      <Button variant="primary" onClick={() => handleRegister(event.id)}>
                        Iscriviti
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
