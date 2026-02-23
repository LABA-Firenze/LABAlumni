'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { X, Upload, Loader2, Image as ImageIcon, Video, Briefcase } from 'lucide-react'

export default function CompanyCreatePostPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [type, setType] = useState<'text' | 'image' | 'video'>('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const imageFiles = files.slice(0, 5) // Max 5 images
    setImageFiles(imageFiles)

    // Create preview URLs
    const previewUrls = imageFiles.map(file => URL.createObjectURL(file))
    setImages(previewUrls)
    setType('image')
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImages(newImages)
    setImageFiles(newFiles)
    if (newImages.length === 0 && !videoUrl) {
      setType('text')
    }
  }

  const uploadImagesToSupabase = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []

    const uploadedUrls: string[] = []
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/posts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `posts/${fileName}`

      try {
        const { data, error } = await supabase.storage
          .from('posts')
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
            .from('posts')
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

    if (!content.trim() && images.length === 0 && !videoUrl) {
      setError('Inserisci almeno un contenuto per il post')
      return
    }

    setLoading(true)
    setError('')

    try {
      let uploadedImageUrls: string[] = []

      // Upload images if any
      if (images.length > 0 && imageFiles.length > 0) {
        uploadedImageUrls = await uploadImagesToSupabase()
      }

      // Determine post type
      let postType: 'text' | 'image' | 'video' = 'text'
      if (videoUrl) {
        postType = 'video'
      } else if (uploadedImageUrls.length > 0) {
        postType = 'image'
      }

      // Create post (only companies can do this)
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: postType,
          content: content.trim(),
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
          video_url: videoUrl || null,
        })
        .select()
        .single()

      if (postError) throw postError

      // Redirect to dashboard
      router.push('/dashboard/company')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating post:', err)
      setError(err.message || 'Errore durante la creazione del post')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary-600" />
            Pubblica un Post
          </h1>
          <p className="text-gray-600 mt-2">Condividi annunci, progetti, novità con la community</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content */}
            <div>
              <Textarea
                label="Contenuto del Post *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Scrivi qui il contenuto del post... annunci, progetti, novità aziendali..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Images Preview */}
            {images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immagini ({images.length}/5)
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
            {!images.length && (
              <div>
                <Input
                  label="Link Video (YouTube, Vimeo, etc.)"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value)
                    if (e.target.value) setType('video')
                    else setType('text')
                  }}
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Upload Buttons */}
            <div className="flex gap-4">
              <label className="flex-1">
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
                  <ImageIcon className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">
                    Aggiungi Foto
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
                disabled={loading || (!content.trim() && images.length === 0 && !videoUrl)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Pubblicando...
                  </>
                ) : (
                  'Pubblica Post'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}


