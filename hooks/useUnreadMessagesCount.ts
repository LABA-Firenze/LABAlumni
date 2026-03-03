'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useMessagesRealtime } from './useMessagesRealtime'

/**
 * Restituisce il numero di messaggi non letti per l'utente.
 * Si aggiorna in tempo reale tramite subscription.
 */
export function useUnreadMessagesCount(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!userId) return
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false)
    setUnreadCount(count ?? 0)
  }, [userId])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  useMessagesRealtime(userId, refresh)

  return unreadCount
}
