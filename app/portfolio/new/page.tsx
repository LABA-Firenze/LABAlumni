'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewPortfolioItemPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newFiles = files.slice(0, 10) // Max 10 images
    setImageFiles(newFiles)

    // Create preview URLs
    const previewUrls = newFiles.map(file => URL.createObjectURL(file))
    setImages(previewUrls)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImages(newImages)
    setImageFiles(newFiles)
  }

  const uploadImagesToSupabase = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []

    const uploadedUrls: string[] = []
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/portfolio/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `posts/${fileName}`

      try {
        const { data, error } = await supabase.storage
          .from('posts')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Error uploading image:', error)
          // Fallback to base64
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
            .from('posts')
            .getPublicUrl(filePath)
          uploadedUrls.push(publicUrl)
        }
      } catch (err) {
        console.error('Upload error:', err)
        // Fallback to base64
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

    setLoading(true)
    setError('')

    try {
      let uploadedImageUrls: string[] = []

      // Upload images
      if (images.length > 0 && imageFiles.length > 0) {
        uploadedImageUrls = await uploadImagesToSupabase()
      }

      // Parse tags
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Create portfolio item
      const { error: portfolioError } = await supabase
        .from('portfolio_items')
        .insert({
          student_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          images: uploadedImageUrls,
          video_url: videoUrl || null,
          category: category || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          year: year ? parseInt(year) : null,
        })

      if (portfolioError) throw portfolioError

      // Redirect to portfolio
      router.push('/portfolio')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating portfolio item:', err)
      setError(err.message || 'Errore durante la creazione del lavoro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Indietro
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Aggiungi Lavoro al Portfolio</h1>
          <p className="text-gray-600 mt-2">Condividi i tuoi progetti migliori</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <Input
              label="Titolo *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Logo Design per Brand X"
              required
            />

            {/* Description */}
            <Textarea
              label="Descrizione"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi il progetto, le tecniche usate, il concept..."
              rows={4}
            />

            {/* Category and Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Select
                label="Anno"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {years.map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </Select>
            </div>

            {/* Tags */}
            <Input
              label="Tag (separati da virgola)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Es. logo, branding, minimal, design"
            />

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
                        className="w-full h-48 object-cover rounded-lg"
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

            {/* Video URL */}
            {images.length === 0 && (
              <Input
                label="Link Video (opzionale)"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
              />
            )}

            {/* Upload Button */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loading || !!videoUrl}
                />
                <div className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  loading || videoUrl 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : 'border-primary-300 hover:border-primary-500 hover:bg-primary-50'
                }`}>
                  <Upload className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">
                    {images.length > 0 ? 'Aggiungi altre immagini' : 'Carica immagini (max 10)'}
                  </span>
                </div>
              </label>
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
                disabled={loading}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !title.trim() || (images.length === 0 && !videoUrl)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva Lavoro'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}


