'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Mantiene lo skeleton/loader visibile per almeno minMs millisecondi,
 * evitando flash brevi che sembrano errori.
 */
export function useMinimumLoading(loading: boolean, minMs = 550): boolean {
  const [showLoader, setShowLoader] = useState(true)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (loading) {
      startRef.current = Date.now()
      setShowLoader(true)
    } else {
      if (startRef.current !== null) {
        const elapsed = Date.now() - startRef.current
        const remaining = Math.max(0, minMs - elapsed)
        const timer = setTimeout(() => {
          setShowLoader(false)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setShowLoader(false)
      }
    }
  }, [loading, minMs])

  return showLoader
}
