import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!userId) {
      setRole(null)
      setLoading(false)
      return
    }

    ;(async () => {
      setLoading(true)
      try {
        const { data, error }: any = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (cancelled) return
        if (error) setRole(null)
        else setRole(data?.role || null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  return { role, loading }
}

