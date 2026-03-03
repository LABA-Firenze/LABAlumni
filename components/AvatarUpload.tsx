'use client'

import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { getInitials } from '@/lib/avatar'

const BUCKET = 'image_profilo'
const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  fullName: string
  onUpdate: (url: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  gradientClass?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-12 h-12 text-lg',
  md: 'w-20 h-20 text-2xl',
  lg: 'w-24 h-24 text-3xl',
}

export function AvatarUpload({
  userId,
  avatarUrl,
  fullName,
  onUpdate,
  size = 'md',
  gradientClass = 'from-primary-400 to-primary-600',
  className = '',
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleClick = () => inputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(`Formato non supportato. Usa: JPG, PNG, WebP o GIF.`)
      e.target.value = ''
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File troppo grande. Massimo ${MAX_SIZE_MB}MB.`)
      e.target.value = ''
      return
    }

    setUploading(true)
    e.target.value = ''

    try {
      const { supabase } = await import('@/lib/supabase')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${userId}/avatar_${Date.now()}.${ext}`

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (error) throw error

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      onUpdate(data.publicUrl)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Errore durante il caricamento')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0 border-2 border-white shadow-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className={`bg-gradient-to-br ${gradientClass} w-full h-full flex items-center justify-center`}>
            {getInitials(fullName)}
          </span>
        )}
      </button>
      <div
        onClick={handleClick}
        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
      >
        {uploading ? (
          <span className="text-white text-xs font-medium">...</span>
        ) : (
          <Camera className="w-6 h-6 text-white" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
