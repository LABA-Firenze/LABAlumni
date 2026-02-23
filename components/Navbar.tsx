'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from './ui/Button'
import { User, LogOut, Briefcase, Users, Newspaper } from 'lucide-react'

export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }: any) => {
          setUserRole(data?.role || null)
        })
    } else {
      setUserRole(null)
    }
  }, [user])

  const navLinks = user ? (
    <>
      {userRole === 'student' || !userRole ? (
        <>
          <Link href="/dashboard/student" className="flex items-center gap-2 hover:text-primary-600 transition-colors">
            <Briefcase className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </Link>
          <Link href="/jobs" className="flex items-center gap-2 hover:text-primary-600 transition-colors">
            <Briefcase className="w-5 h-5 shrink-0" />
            <span>Annunci</span>
          </Link>
        </>
      ) : (
        <>
          <Link href="/dashboard/company" className="flex items-center gap-2 hover:text-primary-600 transition-colors">
            <Users className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </Link>
          <Link href="/jobs/manage" className="flex items-center gap-2 hover:text-primary-600 transition-colors">
            <Briefcase className="w-5 h-5 shrink-0" />
            <span>Gestisci Annunci</span>
          </Link>
        </>
      )}
      <Link href="/community" className="flex items-center gap-2 hover:text-primary-600 transition-colors">
        <Newspaper className="w-5 h-5 shrink-0" />
        <span>Bacheca</span>
      </Link>
      <Link href="/messages" className="flex items-center gap-2 hover:text-primary-600 transition-colors">
        <User className="w-5 h-5 shrink-0" />
        <span>Messaggi</span>
      </Link>
    </>
  ) : null

  // Determine logo href based on auth status
  const logoHref = user 
    ? (userRole === 'company' ? '/dashboard/company' : '/dashboard/student')
    : '/'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={logoHref} className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">LABAlumni</span>
          </Link>

          <div className="flex items-center gap-6">
            {!loading && (
              <>
                {navLinks}
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link href="/profile" className="flex items-center gap-2 text-gray-700 hover:text-primary-600">
                      <User className="w-5 h-5 shrink-0" />
                      <span>Profilo</span>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="w-4 h-4 shrink-0" />
                      Esci
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login">
                      <Button variant="ghost" size="sm">Accedi</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary" size="sm">Registrati</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

