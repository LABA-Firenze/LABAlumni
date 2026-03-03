'use client'

import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

/**
 * Gli studenti non possono registrarsi: accedono solo con le credenziali LABA.
 */
export default function RegistratiPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh] px-4 py-16">
        <div className="w-full max-w-md">
          <Card className="shadow-xl text-center p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-3">Registrazione studenti</h1>
            <p className="text-gray-600 mb-6">
              Gli studenti non hanno bisogno di registrarsi. Accedi con le stesse credenziali che utilizzi per l&apos;applicazione LABA.
            </p>
            <Link href="/accedi">
              <Button className="w-full">Vai ad Accedi</Button>
              </Link>
            <p className="text-gray-500 text-sm mt-6">
              Sei un <Link href="/registrazione/docente" className="text-primary-600 hover:underline">docente</Link>
              {' o un'}{' '}
              <Link href="/registrazione/azienda" className="text-primary-600 hover:underline">azienda</Link>? Registrati dal link in pagina Accedi.
            </p>
            <Link href="/" className="block text-gray-500 text-sm hover:text-primary-600 transition-colors mt-4">
              ← Torna alla home
            </Link>
          </Card>
          </div>
      </div>
    </div>
  )
}
