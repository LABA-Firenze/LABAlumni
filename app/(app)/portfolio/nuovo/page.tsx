'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
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

const visibilityLabels: Record<string, string> = {
  profile: 'Segui le impostazioni del profilo',
  public: 'Visibile a tutti',
  private: 'Solo per me (privato)',
}

const profileVisibilityLabels: Record<string, string> = {
  all: 'Tutti',
  connections: 'Solo connessioni',
  students: 'Solo studenti LABA',
}

const TOTAL_STEPS = 3

export default function NewPortfolioItemPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [visibility, setVisibility] = useState<'profile' | 'public' | 'private'>('profile')
  const [profileVisibility, setProfileVisibility] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  useEffect(() => {
    if (user) {
      supabase.from('user_preferences').select('profile_visibility').eq('user_id', user.id).single()
        .then(({ data }) => setProfileVisibility(data?.profile_visibility || 'all'))
    }
  }, [user])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newFiles = files.slice(0, 10)
    setImageFiles(newFiles)
    setImages(newFiles.map(file => URL.createObjectURL(file)))
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImagesToSupabase = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []
    const uploadedUrls: string[] = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const path = `posts/${user?.id}/portfolio/${Date.now()}_${Math.random().toString(36).slice(7)}.${ext}`
      const { error: err } = await supabase.storage.from('posts').upload(path, file, { cacheControl: '3600', upsert: false })
      if (!err) {
        const { data } = supabase.storage.from('posts').getPublicUrl(path)
        uploadedUrls.push(data.publicUrl)
      } else {
        const reader = new FileReader()
        await new Promise<void>((res, rej) => { reader.onload = () => { uploadedUrls.push(reader.result as string); res() }; reader.onerror = rej; reader.readAsDataURL(file) })
      }
    }
    return uploadedUrls
  }

  const validateStep = (step: number): boolean => {
    setError('')
    if (step === 1 && !title.trim()) { setError('Il titolo è obbligatorio'); return false }
    if (step === 2 && images.length === 0 && !videoUrl) { setError('Aggiungi almeno un\'immagine o un video'); return false }
    return true
  }

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(s => s + 1) }
  const handlePrev = () => { setCurrentStep(s => s - 1); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !validateStep(1) || !validateStep(2)) return
    setLoading(true)
    setError('')
    try {
      let uploadedUrls: string[] = []
      if (images.length > 0 && imageFiles.length > 0) uploadedUrls = await uploadImagesToSupabase()
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
      const { error: portfolioError } = await supabase.from('portfolio_items').insert({
        student_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        images: uploadedUrls,
        video_url: videoUrl || null,
        category: category || null,
        tags: tagsArray.length ? tagsArray : null,
        year: year ? parseInt(year) : null,
        visibility: visibility,
      })
      if (portfolioError) throw portfolioError
      router.push('/portfolio')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input label="Titolo *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Logo Design per Brand X" required />
            <Textarea label="Descrizione" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrivi il progetto, le tecniche usate, il concept..." rows={4} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Seleziona categoria</option>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Select label="Anno" value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
              </Select>
            </div>
            <Input label="Tag (separati da virgola)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Es. logo, branding, minimal, design" />
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            {images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Immagini ({images.length}/10)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-48 object-cover rounded-lg" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {images.length === 0 && (
              <Input label="Link Video (opzionale)" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
            )}
            <div>
              <label className="block">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={!!videoUrl} />
                <div className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${videoUrl ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-primary-300 hover:border-primary-500 hover:bg-primary-50'}`}>
                  <Upload className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">{images.length ? 'Aggiungi altre immagini' : 'Carica immagini (max 10)'}</span>
                </div>
              </label>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Chi può vedere questo lavoro?</p>
              <div className="space-y-2">
                {(['profile', 'public', 'private'] as const).map((v) => (
                  <label key={v} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${visibility === v ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => setVisibility(v)} className="text-primary-600" />
                    <span className="font-medium">{visibilityLabels[v]}</span>
                    {v === 'profile' && <span className="text-sm text-gray-500">(attualmente: {profileVisibilityLabels[profileVisibility]})</span>}
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <p className="font-medium mb-1">Riepilogo</p>
              <p><strong>{title || '—'}</strong></p>
              {category && <p>Categoria: {categories.find(c => c.value === category)?.label}</p>}
              <p>Media: {images.length ? `${images.length} immagini` : videoUrl ? 'Video' : '—'}</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const isLastStep = currentStep === TOTAL_STEPS

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2">← Indietro</button>
          <h1 className="text-3xl font-bold text-gray-900">Aggiungi Lavoro al Portfolio</h1>
          <p className="text-gray-600 mt-2">Condividi i tuoi progetti migliori</p>
        </div>

        <Card variant="elevated" className="p-6">
          <p className="text-center text-gray-500 text-sm mb-4">Step {currentStep} di {TOTAL_STEPS}</p>
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${s <= currentStep ? 'bg-primary-600' : 'bg-gray-200'}`} />)}
          </div>

          <form onSubmit={isLastStep ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            {renderStep()}
            {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 1 || loading}>← Indietro</Button>
              {!isLastStep ? (
                <Button type="submit" variant="primary" disabled={(currentStep === 1 && !title.trim()) || (currentStep === 2 && images.length === 0 && !videoUrl)}>Avanti →</Button>
              ) : (
                <Button type="submit" variant="primary" disabled={loading || !title.trim() || (images.length === 0 && !videoUrl)}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvataggio...</> : 'Salva Lavoro'}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
