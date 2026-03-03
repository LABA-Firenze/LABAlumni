'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Quote, GraduationCap } from 'lucide-react'

interface SuccessStory {
  id: string
  title: string
  content: string
  author_name: string
  author_role: string | null
  author_course: string | null
  company_name: string | null
  image_url: string | null
  sort_order: number
}

export default function StoriePage() {
  const [stories, setStories] = useState<SuccessStory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('success_stories')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      setStories(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <Card variant="elevated" className="p-6 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary-600" />
          Storie di successo
        </h1>
        <p className="text-gray-600 mt-2">Alumni LABA che ce l&apos;hanno fatta nel mondo del lavoro</p>
      </Card>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <Card variant="elevated" className="text-center py-16">
          <Quote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Prossimamente</h3>
          <p className="text-gray-600">Le testimonianze degli alumni saranno pubblicate qui</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {stories.map((s) => (
            <Card key={s.id} variant="elevated" className="p-8">
              <blockquote className="text-lg text-gray-700 leading-relaxed">
                &ldquo;{s.content}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt={s.author_name}
                    className="w-16 h-16 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-600">
                      {s.author_name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{s.author_name}</p>
                  {s.author_course && (
                    <p className="text-sm text-gray-600">{s.author_course}</p>
                  )}
                  {s.company_name && (
                    <p className="text-sm text-primary-600">{s.company_name}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
