'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Image as ImageIcon, Calendar, Tag, ExternalLink, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { PortfolioItem } from '@/types/social'

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadPortfolio()
    }
  }, [user, authLoading, router])

  const loadPortfolio = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('student_id', user.id)
        .order('year', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setPortfolioItems(data || [])
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo lavoro?')) return

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadPortfolio()
    } catch (error) {
      console.error('Error deleting portfolio item:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Il Mio Portfolio</h1>
            <p className="text-gray-600 mt-2">Mostra i tuoi migliori lavori e progetti</p>
          </div>
          <Link href="/portfolio/new">
            <Button variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Aggiungi Lavoro
            </Button>
          </Link>
        </div>

        {/* Portfolio Grid */}
        {portfolioItems.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Il tuo portfolio è vuoto</h3>
            <p className="text-gray-600 mb-6">Inizia a condividere i tuoi lavori e progetti!</p>
            <Link href="/portfolio/new">
              <Button variant="primary">Aggiungi il Primo Lavoro</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                {/* Image */}
                {item.images && item.images.length > 0 && (
                  <div className="relative aspect-video bg-gray-200 overflow-hidden">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/portfolio/${item.id}/edit`}>
                        <button className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50">
                          <Edit className="w-4 h-4 text-gray-700" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-white p-2 rounded-full shadow-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  )}
                  
                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    {item.year && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{item.year}</span>
                      </div>
                    )}
                    {item.category && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{item.category}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-500 text-xs">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <Link href={`/portfolio/${item.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visualizza
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


