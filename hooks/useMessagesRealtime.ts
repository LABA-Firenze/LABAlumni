'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Sottoscrizione Realtime alla tabella messages.
 * Chiama onRefresh quando arriva un INSERT o UPDATE che coinvolge l'utente.
 */
export function useMessagesRealtime(userId: string | undefined, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: { new: { sender_id: string; recipient_id: string } }) => {
          const { sender_id, recipient_id } = payload.new
          if (sender_id === userId || recipient_id === userId) {
            onRefreshRef.current()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload: { new: { sender_id: string; recipient_id: string } }) => {
          const { sender_id, recipient_id } = payload.new
          if (sender_id === userId || recipient_id === userId) {
            onRefreshRef.current()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
