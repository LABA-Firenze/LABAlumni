import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100/90 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
          <FileQuestion className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagina non trovata</h1>
        <p className="text-gray-600 mb-8">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link href="/">
          <Button variant="primary">Torna alla home</Button>
        </Link>
      </div>
    </div>
  )
}
