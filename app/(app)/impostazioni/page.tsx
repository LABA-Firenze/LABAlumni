'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AvatarUpload } from '@/components/AvatarUpload'
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  UserCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { resetTour } from '@/components/GuidedTour'

export default function ImpostazioniPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
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
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/accedi')
      return
    }
    loadPrefs()
  }, [user, router])

  const loadPrefs = async () => {
    if (!user) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, full_name, role')
      .eq('id', user.id)
      .single()
    setAvatarUrl(profile?.avatar_url ?? null)
    setFullName(profile?.full_name ?? '')
    setUserRole(profile?.role ?? null)
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

  const handleDeleteAccount = async () => {
    if (!user) return
    if (deleteConfirm.toLowerCase().trim() !== 'elimina') {
      alert('Scrivi "elimina" per confermare')
      return
    }
    if (!confirm('Sei sicuro? Questa azione non può essere annullata.')) return

    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: deleteConfirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Errore durante l\'eliminazione')
        setDeleting(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (e: any) {
      alert(e.message || 'Errore')
    } finally {
      setDeleting(false)
    }
  }

  const handleAvatarUpdate = async (url: string | null) => {
    if (!user) return
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    if (!error) setAvatarUrl(url)
    else alert(error.message || 'Errore aggiornamento foto')
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <Card variant="elevated" className="p-8 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
            <Cog6ToothIcon className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
            <p className="text-gray-600 mt-0.5">Preferenze notifiche e privacy</p>
          </div>
        </div>
      </Card>

      {/* Foto profilo */}
      <Card variant="elevated" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <UserCircleIcon className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Foto profilo</h2>
        </div>
        <div className="flex items-center gap-6">
          {user && (
            <AvatarUpload
              userId={user.id}
              avatarUrl={avatarUrl}
              fullName={fullName || user.email?.split('@')[0] || 'Utente'}
              onUpdate={handleAvatarUpdate}
              size="lg"
            />
          )}
          <div>
            <p className="text-sm text-gray-600">Clicca sull&apos;immagine per cambiare la tua foto profilo.</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP o GIF. Max 5MB.</p>
          </div>
        </div>
      </Card>

      {/* Notifiche + Privacy su due colonne */}
      <div className="grid md:grid-cols-2 gap-6">
      {/* Notifiche */}
      <Card variant="elevated" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Notifiche</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={prefs.notify_messages}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_messages: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Nuovi messaggi</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={prefs.notify_applications}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_applications: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Aggiornamenti candidature</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={prefs.notify_connections}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_connections: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Richieste di connessione</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={prefs.notify_comments}
              onChange={(e) => setPrefs((p) => ({ ...p, notify_comments: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Commenti sui post</span>
          </label>
        </div>
      </Card>

      {/* Privacy */}
      <Card variant="elevated" className="p-6 h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibilità profilo</label>
            <select
              value={prefs.profile_visibility}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  profile_visibility: e.target.value as 'all' | 'connections' | 'students',
                }))
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Tutti</option>
              <option value="connections">Solo connessioni</option>
              <option value="students">Solo studenti LABA</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={prefs.show_email}
              onChange={(e) => setPrefs((p) => ({ ...p, show_email: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Mostra email sul profilo</span>
          </label>
        </div>
      </Card>
      </div>

      {/* Altro */}
      <Card variant="elevated" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Altro</h2>
        </div>
        <Button variant="outline" onClick={handleResetTour} className="rounded-xl">
          Ripeti tour guidato
        </Button>
      </Card>

      {/* Elimina account - non per admin */}
      {userRole && userRole !== 'admin' && (
        <Card variant="elevated" className="p-6 border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrashIcon className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Elimina account</h2>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            Eliminando il tuo account verranno rimossi in modo permanente profilo, messaggi, lavori nel portfolio e tutti i dati associati.
          </p>
          {userRole === 'student' && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Attenzione studenti LABA:</strong> se accedi con le credenziali Logos (email e password LABA), eliminando l&apos;account sarai rimosso dalla piattaforma. Se farai nuovamente l&apos;accesso con le stesse credenziali, verrai registrato automaticamente di nuovo.
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder='Scrivi "elimina" per confermare'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={deleting}
            />
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm.toLowerCase().trim() !== 'elimina'}
              className="border-red-300 text-red-600 hover:bg-red-50 shrink-0"
            >
              {deleting ? 'Eliminazione...' : 'Elimina account'}
            </Button>
          </div>
        </Card>
      )}

      {/* Salva */}
      <Button variant="primary" onClick={save} disabled={saving} className="w-full py-3 rounded-xl font-medium">
        {saving ? 'Salvataggio...' : 'Salva impostazioni'}
      </Button>
    </div>
  )
}
