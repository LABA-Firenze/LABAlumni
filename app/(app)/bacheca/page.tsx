'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Plus, Building2, Newspaper } from 'lucide-react'
import Link from 'next/link'
import type { CommunityPost } from '@/types/database'

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<(CommunityPost & { company: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isCompany, setIsCompany] = useState(false)

  useEffect(() => {
    loadPosts()
    checkIfCompany()
  }, [user])

  const checkIfCompany = async () => {
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setIsCompany(data?.role === 'company')
  }

  const loadPosts = async () => {
    try {
      const { data } = await supabase
        .from('community_posts')
        .select(`
          *,
          company:companies(id, company_name, logo_url)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })

      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      await supabase
        .from('community_posts')
        .insert({
          company_id: user.id,
          title,
          content,
          published: true,
        })

      setTitle('')
      setContent('')
      setShowForm(false)
      loadPosts()
    } catch (error: any) {
      alert(error.message || 'Errore durante la pubblicazione')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-primary-600" />
              Bacheca Comunitaria
            </h1>
            <p className="text-gray-600 mt-2">Notizie e aggiornamenti dalle aziende</p>
          </div>
          {isCompany && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Nuovo Post
            </Button>
          )}
        </div>

        {isCompany && showForm && (
          <Card variant="elevated" className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Pubblica un Articolo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Titolo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Titolo dell'articolo..."
              />

              <Textarea
                label="Contenuto"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Scrivi il tuo articolo..."
              />

              <div className="flex gap-3">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Pubblicazione...' : 'Pubblica'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setTitle('')
                    setContent('')
                  }}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card variant="elevated" className="text-center py-16">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nessun post pubblicato ancora</h3>
            <p className="text-gray-600">Le aziende potranno condividere notizie e aggiornamenti qui</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} variant="elevated">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{post.company.company_name}</h3>
                      <span className="text-gray-500 text-sm">
                        • {new Date(post.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
  )
}



