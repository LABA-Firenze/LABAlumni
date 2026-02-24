'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Send, Mail, User, Building2, Search } from 'lucide-react'
import type { Message, Profile } from '@/types/database'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedUserId = searchParams.get('user')

  const [messages, setMessages] = useState<(Message & { sender: Profile; recipient: Profile })[]>([])
  const [conversations, setConversations] = useState<Map<string, any>>(new Map())
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<Profile[]>([])
  const [userRole, setUserRole] = useState<'student' | 'company' | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState({ recipient_id: '', subject: '', content: '' })
  const [conversationMessage, setConversationMessage] = useState({ subject: '', content: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      loadMessages()
      loadRecipients()
    }
  }, [user, authLoading, router])

  const loadMessages = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          recipient:profiles!messages_recipient_id_fkey(*)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1000)

      setMessages(data || [])

      // Group messages by conversation
      const convs = new Map()
      data?.forEach((msg: any) => {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender

        if (!convs.has(otherId)) {
          convs.set(otherId, {
            id: otherId,
            user: otherUser,
            messages: [],
            unread: 0,
            lastMessage: null,
          })
        }

        const conv = convs.get(otherId)
        conv.messages.push(msg)
        if (!msg.read && msg.recipient_id === user.id) {
          conv.unread++
        }
        if (!conv.lastMessage || new Date(msg.created_at) > new Date(conv.lastMessage.created_at)) {
          conv.lastMessage = msg
        }
      })

      setConversations(convs)

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('read', false)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecipients = async () => {
    if (!user) return

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (profile?.role || 'student') as 'student' | 'company'
      setUserRole(role)

      // Solo le aziende possono avviare nuove conversazioni; caricare solo studenti come destinatari
      if (role === 'company') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .eq('role', 'student')
        setRecipients(data || [])

        if (preselectedUserId) {
          setNewMessage((prev) => ({ ...prev, recipient_id: preselectedUserId }))
        }
      }
    } catch (error) {
      console.error('Error loading recipients:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSending(true)
    try {
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content,
        })

      setNewMessage({ recipient_id: '', subject: '', content: '' })
      loadMessages()
    } catch (error: any) {
      alert(error.message || 'Errore durante l\'invio')
    } finally {
      setSending(false)
    }
  }

  const handleSendConversationMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedConversation) return

    setSending(true)
    try {
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          subject: conversationMessage.subject,
          content: conversationMessage.content,
        })

      setConversationMessage({ subject: '', content: '' })
      loadMessages()
    } catch (error: any) {
      alert(error.message || 'Errore durante l\'invio')
    } finally {
      setSending(false)
    }
  }

  const selectedMessages = selectedConversation
    ? messages.filter(
        (m) =>
          (m.sender_id === selectedConversation && m.recipient_id === user?.id) ||
          (m.recipient_id === selectedConversation && m.sender_id === user?.id)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : []

  const conversationList = Array.from(conversations.values())
    .filter((conv) => {
      // Studenti: solo conversazioni con aziende
      if (userRole === 'student' && conv.user.role !== 'company') return false
      if (searchTerm === '') return true
      return (
        conv.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) =>
      new Date(b.lastMessage?.created_at || 0).getTime() -
      new Date(a.lastMessage?.created_at || 0).getTime()
    )

  if (showSkeleton || authLoading) {
    return (
      <div className="flex gap-6 min-h-[400px]">
        <div className="w-80 shrink-0 space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
        <div className="flex-1 rounded-2xl bg-white shadow-md border p-6">
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary-600" />
            Messaggi
          </h1>
          {userRole === 'student' && (
            <p className="text-gray-600 mt-1">
              Puoi rispondere qui quando un&apos;azienda ti contatta. Solo le aziende possono avviare nuove conversazioni.
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations list */}
          <div className="lg:col-span-1">
            <Card variant="elevated">
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Cerca conversazioni..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {conversationList.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">Nessuna conversazione</p>
                ) : (
                  conversationList.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {conv.user.role === 'company' ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          <span className="font-medium truncate">
                            {conv.user.full_name || conv.user.email}
                          </span>
                        </div>
                        {conv.unread > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            selectedConversation === conv.id
                              ? 'bg-white text-primary'
                              : 'bg-primary text-white'
                          }`}>
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className={`text-sm truncate ${
                          selectedConversation === conv.id ? 'text-white/80' : 'text-gray-600'
                        }`}>
                          {conv.lastMessage.subject}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Messages view */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card variant="elevated">
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">
                    {conversations.get(selectedConversation)?.user.full_name ||
                      conversations.get(selectedConversation)?.user.email}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {conversations.get(selectedConversation)?.user.email}
                  </p>
                </div>

                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                  {selectedMessages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nessun messaggio</p>
                  ) : (
                    selectedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="font-semibold mb-1">{msg.subject}</div>
                          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                          <div className={`text-xs mt-2 ${
                            msg.sender_id === user?.id ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {new Date(msg.created_at).toLocaleString('it-IT')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendConversationMessage} className="space-y-4">
                  <Input
                    placeholder="Oggetto"
                    value={conversationMessage.subject}
                    onChange={(e) => setConversationMessage({ ...conversationMessage, subject: e.target.value })}
                    required
                  />
                  <Textarea
                    rows={4}
                    placeholder="Scrivi un messaggio..."
                    value={conversationMessage.content}
                    onChange={(e) => setConversationMessage({ ...conversationMessage, content: e.target.value })}
                    required
                  />
                  <Button type="submit" variant="primary" disabled={sending}>
                    <Send className="w-4 h-4 shrink-0" />
                    {sending ? 'Invio...' : 'Invia'}
                  </Button>
                </form>
              </Card>
            ) : (
              <Card variant="elevated" className="text-center py-16">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {userRole === 'student'
                    ? 'Le aziende interessate ai tuoi contenuti e portfolio possono contattarti qui. Quando riceverai un messaggio, potrai rispondere in questa sezione.'
                    : 'Seleziona una conversazione o invia un nuovo messaggio a uno studente'}
                </p>
              </Card>
            )}

            {/* Nuovo messaggio: solo per aziende */}
            {!selectedConversation && userRole === 'company' && (
              <Card variant="elevated" className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Nuovo Messaggio</h2>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <Select
                    label="Destinatario"
                    value={newMessage.recipient_id}
                    onChange={(e) => setNewMessage({ ...newMessage, recipient_id: e.target.value })}
                    required
                  >
                    <option value="">Seleziona un destinatario</option>
                    {recipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.full_name || recipient.email} ({recipient.role === 'student' ? 'Studente' : 'Azienda'})
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Oggetto"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    required
                  />

                  <Textarea
                    label="Messaggio"
                    rows={6}
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    required
                  />

                  <Button type="submit" variant="primary" disabled={sending}>
                    <Send className="w-4 h-4 shrink-0" />
                    {sending ? 'Invio...' : 'Invia Messaggio'}
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>
  )
}

