'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Calendar, Tag, Video, Image as ImageIcon, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { PortfolioItem } from '@/types/social'

export default function PortfolioItemDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string
  const [item, setItem] = useState<PortfolioItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (itemId) {
      loadItem()
    }
  }, [itemId])

  const loadItem = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) throw error
      setItem(data)
    } catch (error) {
      console.error('Error loading portfolio item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo lavoro?')) return

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      router.push('/portfolio')
    } catch (error) {
      console.error('Error deleting portfolio item:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lavoro non trovato</h3>
            <p className="text-gray-600 mb-6">Il lavoro richiesto non esiste o è stato rimosso.</p>
            <Link href="/portfolio">
              <Button variant="primary">Torna al Portfolio</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === item.student_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Indietro
        </button>

        <Card className="overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
                <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                  {item.year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>{item.year}</span>
                    </div>
                  )}
                  {item.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      <span className="capitalize">{item.category}</span>
                    </div>
                  )}
                  {item.video_url && (
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      <span>Video incluso</span>
                    </div>
                  )}
                  {item.images && item.images.length > 0 && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      <span>{item.images.length} {item.images.length === 1 ? 'immagine' : 'immagini'}</span>
                    </div>
                  )}
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Link href={`/portfolio/${item.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifica
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Images Gallery */}
          {item.images && item.images.length > 0 && (
            <div className="p-8">
              <div className={`grid gap-4 ${
                item.images.length === 1 
                  ? 'grid-cols-1' 
                  : item.images.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2'
              }`}>
                {item.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`${item.title} - Immagine ${idx + 1}`}
                      className={`w-full rounded-lg object-cover ${
                        item.images!.length === 1 ? 'max-h-96' : 'h-64'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {item.video_url && (
            <div className="px-8 pb-8">
              <div className="rounded-lg overflow-hidden">
                <video src={item.video_url} controls className="w-full rounded-lg"></video>
              </div>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="px-8 pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descrizione</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="px-8 pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tag</h2>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


