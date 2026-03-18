'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AvatarUpload } from '@/components/AvatarUpload'
import {
  BellIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { resetTour } from '@/components/GuidedTour'

const PRIVACY_POLICY_URL = 'https://www.laba.biz/privacy-policy'

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
  const [exporting, setExporting] = useState(false)
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
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/user/export-data')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Export non riuscito')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="(.+)"/)
      const filename = match ? match[1] : `labalumni-dati-${new Date().toISOString().slice(0, 10)}.json`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore durante il download')
    } finally {
      setExporting(false)
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
        alert(data.error || "Errore durante l'eliminazione")
        setDeleting(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore')
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

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-600 mt-1">
          Gestisci account, notifiche, privacy e i tuoi dati personali (GDPR).
        </p>
      </header>

      {/* 1. Account – Foto profilo */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Account
        </h2>
        <Card variant="elevated" className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
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
              <p className="font-medium text-gray-900">
                {fullName || user?.email?.split('@')[0] || 'Utente'}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-2">
                Clicca sulla foto per cambiarla. JPG, PNG, WebP o GIF. Max 5MB.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* 2. Notifiche */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Notifiche
        </h2>
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-gray-700 font-medium">Cosa vuoi ricevere</span>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.notify_messages}
                onChange={(e) => setPrefs((p) => ({ ...p, notify_messages: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Nuovi messaggi</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.notify_applications}
                onChange={(e) => setPrefs((p) => ({ ...p, notify_applications: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Aggiornamenti candidature</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.notify_connections}
                onChange={(e) => setPrefs((p) => ({ ...p, notify_connections: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Richieste di connessione</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
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
      </section>

      {/* 3. Privacy e dati (visibilità + policy + export) */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Privacy e dati
        </h2>
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-900 font-medium">Visibilità e trattamento dati</span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi può vedere il tuo profilo
              </label>
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

            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.show_email}
                onChange={(e) => setPrefs((p) => ({ ...p, show_email: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Mostra email sul profilo</span>
            </label>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-3">
                Informativa sul trattamento dei dati personali e cookie.
              </p>
              <Link
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <DocumentTextIcon className="w-5 h-5" />
                Privacy e Cookie Policy
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-3">
                Puoi scaricare una copia di tutti i dati che abbiamo su di te (diritto di portabilità, art. 20 GDPR). Verrà generato un file JSON.
              </p>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={exporting}
                className="inline-flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                {exporting ? 'Preparazione...' : 'Scarica i miei dati'}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Altro */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Altro
        </h2>
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-gray-900 font-medium">Tour guidato</span>
          </div>
          <Button variant="outline" onClick={handleResetTour} className="rounded-xl">
            Ripeti tour guidato
          </Button>
        </Card>
      </section>

      {/* 5. Elimina account */}
      {userRole && userRole !== 'admin' && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Zona pericolosa
          </h2>
          <Card variant="elevated" className="p-6 border-red-100 bg-red-50/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-gray-900 font-medium">Elimina account</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Eliminando il tuo account verranno rimossi in modo permanente profilo, messaggi,
              lavori nel portfolio e tutti i dati associati. Questa azione non può essere annullata.
            </p>
            {userRole === 'student' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Studenti LABA:</strong> se accedi con le credenziali Logos (email e password LABA),
                  eliminando l&apos;account sarai rimosso dalla piattaforma. Accedendo di nuovo con le stesse
                  credenziali verrai registrato automaticamente.
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder='Scrivi "elimina" per confermare'
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
        </section>
      )}

      {/* Salva impostazioni */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          variant="primary"
          onClick={save}
          disabled={saving}
          className="rounded-xl font-medium shadow-lg"
        >
          {saving ? 'Salvataggio...' : 'Salva impostazioni'}
        </Button>
      </div>
    </div>
  )
}
