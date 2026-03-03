'use client'

import { useState, useEffect } from 'react'
import { BellIcon } from '@heroicons/react/24/solid'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export function NotificationsBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data || [])
      setUnreadCount((data || []).filter((n) => !n.read).length)
    }
    load()
  }, [user])

  const markAsRead = async (id?: string) => {
    if (!user) return
    if (id) {
      await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } else {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
    setUnreadCount(0)
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative"
        aria-label="Notifiche"
      >
        <BellIcon className={`w-6 h-6 ${unreadCount > 0 ? 'text-primary-600' : 'text-gray-600'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 flex justify-between items-center border-b border-gray-100">
              <span className="font-semibold">Notifiche</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Segna tutte come lette
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Nessuna notifica
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || '#'}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id)
                      setOpen(false)
                    }}
                    className={`block px-4 py-3 hover:bg-gray-50 ${!n.read ? 'bg-primary-50/30' : ''}`}
                  >
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.body && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
