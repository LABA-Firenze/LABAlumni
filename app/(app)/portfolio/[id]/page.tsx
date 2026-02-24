'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Calendar, Tag, Video, Image as ImageIcon, Edit, Trash2, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'
import Link from 'next/link'
import type { PortfolioItem } from '@/types/social'
import { SkeletonPortfolioItem } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

export default function PortfolioItemDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string
  const [item, setItem] = useState<PortfolioItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (itemId) {
      const loadItem = async () => {
        try {
          const { data, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('id', itemId)
            .single()
          if (error) throw error
          setItem(data)
        } catch (err) {
          console.error('Error loading portfolio item:', err)
        } finally {
          setLoading(false)
        }
      }
      loadItem()
    }
  }, [itemId])

  useEffect(() => {
    if (!carouselOpen) return
    const total = (item?.images?.length || 0) + (item?.video_url ? 1 : 0)
    if (total === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCarouselOpen(false)
      if (e.key === 'ArrowRight') setCarouselIndex((i) => (i + 1) % total)
      if (e.key === 'ArrowLeft') setCarouselIndex((i) => (i - 1 + total) % total)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [carouselOpen, item?.images?.length, item?.video_url])

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

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-24 rounded-lg bg-gray-200 animate-pulse" />
        <SkeletonPortfolioItem />
      </div>
    )
  }

  if (!item) {
    return (
      <Card variant="elevated" className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lavoro non trovato</h3>
            <p className="text-gray-600 mb-6">Il lavoro richiesto non esiste o è stato rimosso.</p>
        <Link href="/portfolio">
          <Button variant="primary">Torna al Portfolio</Button>
        </Link>
      </Card>
    )
  }

  const isOwner = user?.id === item.student_id
  const images = item.images && item.images.length > 0 ? item.images : []
  const totalSlides = images.length + (item.video_url ? 1 : 0)

  const openCarousel = (index: number) => {
    setCarouselIndex(index)
    setCarouselOpen(true)
  }

  const nextSlide = () => setCarouselIndex((i) => (i + 1) % totalSlides)
  const prevSlide = () => setCarouselIndex((i) => (i - 1 + totalSlides) % totalSlides)

  return (
    <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Indietro
        </button>

        <Card variant="elevated" className="overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Thumbnail / Anteprima (sinistra) */}
            <div className="lg:w-80 shrink-0 p-6 lg:border-r border-gray-200">
              {(images.length > 0 || item.video_url) ? (
                <button
                  onClick={() => openCarousel(0)}
                  className="block w-full aspect-square rounded-xl overflow-hidden bg-gray-100 group relative"
                >
                  {images[0] ? (
                    <img
                      src={images[0]}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : item.video_url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-16 h-16 text-gray-400" />
                    </div>
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </button>
              ) : (
                <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                </div>
              )}
              {totalSlides > 1 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Clicca per aprire carosello full screen ({totalSlides} elementi)
                </p>
              )}
            </div>

            {/* Dettagli (destra) */}
            <div className="flex-1 p-6 lg:p-8 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    {item.year && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {item.year}
                      </span>
                    )}
                    {item.category && (
                      <span className="flex items-center gap-1.5 capitalize">
                        <Tag className="w-4 h-4" />
                        {item.category}
                      </span>
                    )}
                    {images.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        {images.length} {images.length === 1 ? 'immagine' : 'immagini'}
                      </span>
                    )}
                    {item.video_url && (
                      <span className="flex items-center gap-1.5">
                        <Video className="w-4 h-4" />
                        Video
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/portfolio/${item.id}/modifica`}>
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

              {item.description && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Descrizione</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                </div>
              )}

              {item.tags && item.tags.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Tag</h2>
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
            </div>
          </div>
        </Card>

        {/* Full-screen Carousel */}
        {carouselOpen && totalSlides > 0 && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && setCarouselOpen(false)}
          >
            <button
              onClick={() => setCarouselOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
              aria-label="Chiudi"
            >
              <X className="w-6 h-6" />
            </button>

            {totalSlides > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevSlide() }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                  aria-label="Precedente"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextSlide() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                  aria-label="Successiva"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <div className="w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              {carouselIndex < images.length ? (
                <img
                  src={images[carouselIndex]}
                  alt={`${item.title} - ${carouselIndex + 1}`}
                  className="max-w-full max-h-[90vh] object-contain"
                  draggable={false}
                />
              ) : item.video_url ? (
                <video src={item.video_url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg" />
              ) : null}
            </div>

            {totalSlides > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {carouselIndex + 1} / {totalSlides}
              </div>
            )}
          </div>
        )}
    </div>
  )
}


