'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from './ui/Button'
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  EllipsisHorizontalIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  NewspaperIcon,
  BriefcaseIcon,
  BookOpenIcon,
  UsersIcon,
} from '@heroicons/react/24/solid'
import { openFloatingChat } from './FloatingChat'
import { HeaderSearch } from './HeaderSearch'

export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dashboardHref = userRole === 'admin' ? '/pannello/admin' : userRole === 'company' ? '/pannello/azienda' : userRole === 'docente' ? '/tesi' : '/pannello/studente'
  const annunciHref = userRole === 'company' ? '/annunci/gestisci' : '/annunci'

  const isActive = (href: string) => {
    if (href === '/pannello/studente' || href === '/pannello/azienda') {
      return pathname?.startsWith('/pannello')
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm rounded-b-2xl">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 gap-4">
          <Link href={user ? dashboardHref : '/'} className="flex items-center shrink-0">
            <img src="/logoSito.svg" alt="LABA" className="h-8 w-auto" />
          </Link>

          {!loading && user && <HeaderSearch />}

          {!loading && user && (
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <Link
                href={dashboardHref}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(dashboardHref)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5 shrink-0" />
                Dashboard
              </Link>
              <Link
                href="/bacheca"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/bacheca'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <NewspaperIcon className="w-5 h-5 shrink-0" />
                Bacheca
              </Link>
              <Link
                href={annunciHref}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname?.startsWith('/annunci')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BriefcaseIcon className="w-5 h-5 shrink-0" />
                Tirocini
              </Link>
              {userRole !== 'company' && (
              <Link
                href="/tesi"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname?.startsWith('/tesi')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BookOpenIcon className="w-5 h-5 shrink-0" />
                Tesi di laurea
              </Link>
              )}
              <div className="flex items-center gap-0.5 pl-1">
            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label="Menu"
                    >
                      <EllipsisHorizontalIcon className="w-6 h-6" />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                        <Link
                          href="/profilo"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                        >
                          <UserCircleIcon className="w-5 h-5 shrink-0 text-gray-500" />
                          <span>Profilo</span>
                        </Link>
                        <Link
                          href="/rete"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                        >
                          <UsersIcon className="w-5 h-5 shrink-0 text-gray-500" />
                          <span>Rete</span>
                        </Link>
                        <button
                          onClick={() => {
                            setMenuOpen(false)
                            openFloatingChat()
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
                        >
                          <ChatBubbleLeftRightIcon className="w-5 h-5 shrink-0 text-gray-500" />
                          <span>Messaggi</span>
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => {
                            setMenuOpen(false)
                            signOut()
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50"
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
                          <span>Esci</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/accedi">
                      <Button variant="ghost" size="sm">Accedi</Button>
                    </Link>
                    <Link href="/registrati">
                      <Button variant="primary" size="sm">Registrati</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
