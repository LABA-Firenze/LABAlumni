'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { resetTour } from '@/components/GuidedTour'

export default function ImpostazioniPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [prefs, setPrefs] = useState({
    notify_messages: true,
    notify_applications: true,
    notify_connections: true,
    notify_comments: true,
    profile_visibility: 'all' as 'all' | 'connections' | 'students',
    show_email: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/accedi')
      return
    }
    loadPrefs()
  }, [user, router])

  const loadPrefs = async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setPrefs({
        notify_messages: data.notify_messages ?? true,
        notify_applications: data.notify_applications ?? true,
        notify_connections: data.notify_connections ?? true,
        notify_comments: data.notify_comments ?? true,
        profile_visibility: data.profile_visibility || 'all',
        show_email: data.show_email ?? false,
      })
    }
    setLoading(false)
  }

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('user_preferences').upsert(
        { user_id: user.id, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      alert('Impostazioni salvate')
    } catch (e: any) {
      alert(e.message || 'Errore')
    } finally {
      setSaving(false)
    }
  }

  const handleResetTour = () => {
    resetTour()
    alert('Tour resettato. Ricarica la pagina per vederlo di nuovo.')
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Cog6ToothIcon className="w-8 h-8 text-primary-600" />
          Impostazioni
        </h1>
        <p className="text-gray-600 mt-2">Preferenze notifiche e privacy</p>
      </Card>

      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notifiche</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.notify_messages}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_messages: e.target.checked }))}
              className="rounded"
            />
            Nuovi messaggi
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.notify_applications}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_applications: e.target.checked }))}
              className="rounded"
            />
            Aggiornamenti candidature
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.notify_connections}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_connections: e.target.checked }))}
              className="rounded"
            />
            Richieste di connessione
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.notify_comments}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_comments: e.target.checked }))}
              className="rounded"
            />
            Commenti sui post
          </label>
        </div>
      </Card>

      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold mb-4">Privacy</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilità profilo</label>
            <select
              value={prefs.profile_visibility}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  profile_visibility: e.target.value as 'all' | 'connections' | 'students',
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="all">Tutti</option>
              <option value="connections">Solo connessioni</option>
              <option value="students">Solo studenti LABA</option>
            </select>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.show_email}
              onChange={(e) => setPrefs((p) => ({ ...p, show_email: e.target.checked }))}
              className="rounded"
            />
            Mostra email sul profilo
          </label>
        </div>
      </Card>

      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold mb-4">Altro</h2>
        <Button variant="outline" onClick={handleResetTour}>
          Ripeti tour guidato
        </Button>
      </Card>

      <Button variant="primary" onClick={save} disabled={saving}>
        {saving ? 'Salvataggio...' : 'Salva impostazioni'}
      </Button>
    </div>
  )
}
