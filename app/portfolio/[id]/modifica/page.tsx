'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { X, Upload, Loader2 } from 'lucide-react'

const categories = [
  { value: 'grafica', label: 'Grafica' },
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'video', label: 'Video' },
  { value: 'design', label: 'Design' },
  { value: 'illustrazione', label: 'Illustrazione' },
  { value: 'web', label: 'Web Design' },
  { value: 'branding', label: 'Branding' },
  { value: 'altro', label: 'Altro' },
]

export default function EditPortfolioItemPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [year, setYear] = useState('')
  const [tags, setTags] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

      if (data.student_id !== user?.id) {
        router.push('/portfolio')
        return
      }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setCategory(data.category || '')
      setYear(data.year?.toString() || '')
      setTags(data.tags?.join(', ') || '')
      setVideoUrl(data.video_url || '')
      setImages(data.images || [])
    } catch (error) {
      console.error('Error loading portfolio item:', error)
      router.push('/portfolio')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newFiles = files.slice(0, 10 - images.length)
    setImageFiles(prev => [...prev, ...newFiles])

    const previewUrls = newFiles.map(file => URL.createObjectURL(file))
    setImages(prev => [...prev, ...previewUrls])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i < images.length - newImages.length || i >= index - (images.length - newImages.length))
    setImages(newImages)
    setImageFiles(newFiles)
  }

  const uploadImagesToSupabase = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []

    const uploadedUrls: string[] = []
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/portfolio/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `portfolio/${fileName}`

      try {
        const { data, error } = await supabase.storage
          .from('portfolio')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.warn('Storage bucket not configured, using base64:', error)
          const reader = new FileReader()
          await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
              uploadedUrls.push(reader.result as string)
              resolve()
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('portfolio')
            .getPublicUrl(filePath)
          uploadedUrls.push(publicUrl)
        }
      } catch (err) {
        console.error('Upload error:', err)
        const reader = new FileReader()
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            uploadedUrls.push(reader.result as string)
            resolve()
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!title.trim()) {
      setError('Il titolo è obbligatorio')
      return
    }

    if (images.length === 0 && !videoUrl) {
      setError('Aggiungi almeno un\'immagine o un video')
      return
    }

    setSaving(true)
    setError('')

    try {
      let uploadedImageUrls: string[] = []

      // Upload new images
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImagesToSupabase()
      }

      // Combine existing images (those that weren't removed) with new uploaded ones
      const existingImages = images.filter(img => !img.startsWith('blob:'))
      const finalImages = [...existingImages, ...uploadedImageUrls]

      // Parse tags
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Update portfolio item
      const { error: updateError } = await supabase
        .from('portfolio_items')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          images: finalImages,
          video_url: videoUrl || null,
          category: category || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          year: year ? parseInt(year) : null,
        })
        .eq('id', itemId)

      if (updateError) throw updateError

      router.push(`/portfolio/${itemId}`)
      router.refresh()
    } catch (err: any) {
      console.error('Error updating portfolio item:', err)
      setError(err.message || 'Errore durante l\'aggiornamento del lavoro')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Indietro
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Modifica Lavoro</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Input
                label="Titolo *"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Textarea
                label="Descrizione"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
            </div>

            {/* Images Preview */}
            {images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immagini ({images.length}/10)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aggiungi Immagini
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <Upload className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-600">
                  {images.length >= 10 ? 'Massimo 10 immagini' : `Aggiungi immagini (${images.length}/10)`}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={images.length >= 10 || saving}
                />
              </label>
            </div>

            {/* Video URL */}
            <div>
              <Input
                label="Link Video (opzionale)"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Category & Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Categoria"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Seleziona categoria</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Input
                  label="Anno"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  min="2000"
                  max="2100"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Input
                label="Tag (separati da virgola)"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="design, grafica, branding"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || !title.trim() || (images.length === 0 && !videoUrl)}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva Modifiche'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}


