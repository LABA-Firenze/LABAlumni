'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  PencilIcon,
  KeyIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import Link from 'next/link'

type ManagedUser = {
  id: string
  role: 'docente' | 'company'
  email?: string
  full_name?: string | null
  company_name?: string
  bio?: string | null
  description?: string | null
}

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [docenti, setDocenti] = useState<ManagedUser[]>([])
  const [companies, setCompanies] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [resetId, setResetId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) loadUsers()
  }, [user])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Errore caricamento')
      const data = await res.json()
      setDocenti(data.docenti || [])
      setCompanies(data.companies || [])
    } catch {
      setMessage({ type: 'err', text: 'Errore nel caricamento degli utenti' })
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async () => {
    if (!editId || !editName.trim()) return
    setActionLoading('rename-' + editId)
    try {
      const res = await fetch('/api/admin/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editId, fullName: editName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Errore')
      setMessage({ type: 'ok', text: 'Nome aggiornato' })
      setEditId(null)
      setEditName('')
      loadUsers()
    } catch (e: any) {
      setMessage({ type: 'err', text: e.message || 'Errore nel rinomina' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async () => {
    if (!resetId || !newPassword.trim() || newPassword.length < 6) {
      setMessage({ type: 'err', text: 'La password deve essere di almeno 6 caratteri' })
      return
    }
    setActionLoading('reset-' + resetId)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetId, newPassword: newPassword.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Errore')
      setMessage({ type: 'ok', text: 'Password reimpostata' })
      setResetId(null)
      setNewPassword('')
    } catch (e: any) {
      setMessage({ type: 'err', text: e.message || 'Errore nel reset password' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (u: ManagedUser) => {
    if (!confirm(`Eliminare definitivamente ${u.full_name || u.company_name || u.email}? Questa azione non può essere annullata.`)) return
    setActionLoading('delete-' + u.id)
    try {
      const res = await fetch(`/api/admin/user?userId=${encodeURIComponent(u.id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Errore')
      setMessage({ type: 'ok', text: 'Utente eliminato' })
      setEditId(null)
      setResetId(null)
      loadUsers()
    } catch (e: any) {
      setMessage({ type: 'err', text: e.message || 'Errore nell\'eliminazione' })
    } finally {
      setActionLoading(null)
    }
  }

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg bg-gray-200 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const UserRow = ({ u, label }: { u: ManagedUser; label: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-white">
      <div>
        <p className="font-medium text-gray-900">{u.full_name || u.company_name || u.email || '—'}</p>
        <p className="text-sm text-gray-500">{u.email}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {editId === u.id ? (
          <>
            <div className="w-40">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nuovo nome" />
            </div>
            <Button size="sm" onClick={handleRename} disabled={!!actionLoading}>
              Salva
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditId(null); setEditName(''); }}>
              Annulla
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => { setEditId(u.id); setEditName(u.full_name || u.company_name || ''); setResetId(null); }}>
            <PencilIcon className="w-4 h-4 mr-1" />
            Rinomina
          </Button>
        )}
        {resetId === u.id ? (
          <>
            <div className="w-40">
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nuova password" />
            </div>
            <Button size="sm" onClick={handleResetPassword} disabled={!!actionLoading || newPassword.length < 6}>
              Imposta
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setResetId(null); setNewPassword(''); }}>
              Annulla
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => { setResetId(u.id); setEditId(null); setNewPassword(''); }}>
            <KeyIcon className="w-4 h-4 mr-1" />
            Reset password
          </Button>
        )}
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(u)} disabled={!!actionLoading}>
          <TrashIcon className="w-4 h-4 mr-1" />
          Elimina
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100">
          <ShieldCheckIcon className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pannello Admin</h1>
          <p className="text-gray-600">Gestione docenti e aziende</p>
        </div>
        </div>
        <Link href="/pannello/admin/statistiche" className="text-primary-600 hover:underline text-sm font-medium">
          Statistiche →
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-2 underline">Chiudi</button>
        </div>
      )}

      <Card variant="elevated" className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <UserGroupIcon className="w-5 h-5 text-amber-600" />
          Docenti
        </h2>
        {docenti.length === 0 ? (
          <p className="text-gray-500">Nessun docente registrato</p>
        ) : (
          <div className="space-y-3">
            {docenti.map((d) => (
              <UserRow key={d.id} u={d} label="docente" />
            ))}
          </div>
        )}
      </Card>

      <Card variant="elevated" className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <BuildingOffice2Icon className="w-5 h-5 text-emerald-600" />
          Aziende
        </h2>
        {companies.length === 0 ? (
          <p className="text-gray-500">Nessuna azienda registrata</p>
        ) : (
          <div className="space-y-3">
            {companies.map((c) => (
              <UserRow key={c.id} u={c} label="company" />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
