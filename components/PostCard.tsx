'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Heart, MessageCircle, Share2, Send } from 'lucide-react'
import type { Post, PostComment } from '@/types/social'
import { COURSE_CONFIG, type CourseType } from '@/types/database'

interface PostCardProps {
  post: Post
  onUpdate?: () => void
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [showComments, post.id])

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:profiles!post_comments_user_id_fkey(id, full_name, avatar_url, role)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    if (!user) return

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
          })

        if (error) throw error
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }

      onUpdate?.()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      loadComments()
      onUpdate?.()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'ora'
    if (diffMins < 60) return `${diffMins}m fa`
    if (diffHours < 24) return `${diffHours}h fa`
    if (diffDays < 7) return `${diffDays}g fa`
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {post.user?.full_name?.[0]?.toUpperCase() || post.user?.id?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {post.user?.full_name || 'Utente'}
              </p>
              <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {/* Collaboration Request Badge */}
        {post.type === 'collaboration_request' && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {post.request_type === 'tirocinio' && '🎯 Tirocinio'}
              {post.request_type === 'stage' && '💼 Stage'}
              {post.request_type === 'collaborazione' && '🤝 Collaborazione'}
              {post.request_type === 'lavoro' && '💼 Lavoro'}
              {post.request_type === 'tesi' && '📚 Tesi'}
            </div>
            {post.request_courses && post.request_courses.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {post.request_courses.slice(0, 3).map((course, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    {COURSE_CONFIG[course as CourseType]?.name || course}
                  </span>
                ))}
                {post.request_courses.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-500 text-xs">
                    +{post.request_courses.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>
        
        {/* Images (only for company posts) */}
        {post.type !== 'collaboration_request' && post.images && post.images.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            post.images.length === 1 
              ? 'grid-cols-1' 
              : post.images.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2'
          }`}>
            {post.images.slice(0, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Post image ${idx + 1}`}
                className={`w-full object-cover rounded-lg ${
                  post.images!.length === 1 ? 'h-96' : 'h-48'
                }`}
              />
            ))}
          </div>
        )}

        {/* Video (only for company posts) */}
        {post.type !== 'collaboration_request' && post.video_url && (
          <div className="mb-4">
            <video src={post.video_url} controls className="w-full rounded-lg"></video>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments_count || 0}</span>
          </button>

          <div className="flex-1"></div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Comments List */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {loadingComments ? (
              <div className="text-center py-4 text-gray-500 text-sm">Caricamento commenti...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">Nessun commento ancora</div>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {comment.user?.full_name?.[0]?.toUpperCase() || comment.user?.id?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-semibold text-sm text-gray-900">
                        {comment.user?.full_name || 'Utente'}
                      </p>
                      <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-3">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          {user && (
            <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() || user?.id?.[0]?.toUpperCase() || 'U'}
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Scrivi un commento..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  disabled={submittingComment}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={!newComment.trim() || submittingComment}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Card>
  )
}
