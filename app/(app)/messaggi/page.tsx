'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Send, Mail, User, Building2, Search, Paperclip, Trash2, X } from 'lucide-react'
import { getInitials } from '@/lib/avatar'
import { getProfileGradient } from '@/types/database'
import type { Message, Profile } from '@/types/database'
import { isStaffEmail } from '@/lib/staff-labels'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import { useMessagesRealtime } from '@/hooks/useMessagesRealtime'

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
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({ recipient_id: '', content: '' })
  const [conversationMessage, setConversationMessage] = useState({ content: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showConversationDetails, setShowConversationDetails] = useState(false)
  const recipientPickerRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!recipientPickerRef.current) return
      if (!recipientPickerRef.current.contains(event.target as Node)) {
        setRecipientPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

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
        .limit(200)

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

      // Aziende e staff (Simone, Alessia, Matteo) possono avviare nuove conversazioni con chiunque
      const canMessageAnyone = role === 'company' || isStaffEmail(user.email)
      if (canMessageAnyone) {
        const { data } = role === 'company'
          ? await supabase.from('profiles').select('*').neq('id', user.id).eq('role', 'student')
          : await supabase.from('profiles').select('*').neq('id', user.id)
        setRecipients(data || [])

        if (preselectedUserId) {
          setNewMessage((prev) => ({ ...prev, recipient_id: preselectedUserId }))
        }
      }
    } catch (error) {
      console.error('Error loading recipients:', error)
    }
  }

  useMessagesRealtime(user?.id, loadMessages)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!newMessage.recipient_id) {
      alert('Seleziona un destinatario dalla lista.')
      return
    }

    setSending(true)
    try {
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: newMessage.recipient_id,
          subject: 'Messaggio',
          content: newMessage.content,
        })

      setNewMessage({ recipient_id: '', content: '' })
      setRecipientQuery('')
      setRecipientPickerOpen(false)
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
      const replySubject = selectedMessages[0]?.subject || 'Messaggio'
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          subject: replySubject,
          content: conversationMessage.content,
        })

      setConversationMessage({ content: '' })
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

  const selectedConversationUser = selectedConversation
    ? conversations.get(selectedConversation)?.user || null
    : null

  const conversationAttachments = useMemo(() => {
    if (!selectedMessages.length) return []
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    const items = selectedMessages.flatMap((msg) =>
      Array.from(msg.content.matchAll(urlRegex)).map((match, index) => ({
        id: `${msg.id}-${index}`,
        url: match[0],
      }))
    )
    return items
  }, [selectedMessages])

  const handleDeleteConversation = async () => {
    if (!user || !selectedConversation) return
    const ok = window.confirm('Eliminare questa conversazione? L\'azione non si puo annullare.')
    if (!ok) return
    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},recipient_id.eq.${user.id})`
        )
      if (error) throw error
      setShowConversationDetails(false)
      setSelectedConversation(null)
      await loadMessages()
    } catch (error: any) {
      alert(error.message || 'Errore durante eliminazione conversazione')
    } finally {
      setSending(false)
    }
  }

  const canMessageAnyone = userRole === 'company' || isStaffEmail(user?.email)
  const conversationList = Array.from(conversations.values())
    .filter((conv) => {
      // Studenti: vedono conversazioni con aziende E con staff (Simone, Alessia, Matteo)
      if (!canMessageAnyone && userRole === 'student') {
        const otherIsCompany = conv.user?.role === 'company'
        const otherIsStaff = isStaffEmail(conv.user?.email)
        if (!otherIsCompany && !otherIsStaff) return false
      }
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

  const filteredRecipients = recipients
    .filter((r) => {
      const q = recipientQuery.trim().toLowerCase()
      if (!q) return true
      return (
        (r.full_name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
      )
    })
    .slice(0, 12)

  const selectedRecipient = newMessage.recipient_id
    ? recipients.find((r) => r.id === newMessage.recipient_id) || null
    : null

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary-600" />
            Messaggi
          </h1>
          {userRole === 'student' && !isStaffEmail(user?.email) && (
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
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedConversation(conv.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedConversation(conv.id)
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
                        selectedConversation === conv.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedConversation(conv.id)
                              setShowConversationDetails(true)
                            }}
                            className="inline-flex items-center gap-2 hover:opacity-80"
                            aria-label="Apri dettagli chat"
                          >
                            {conv.user.role === 'company' ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedConversation(conv.id)
                              setShowConversationDetails(true)
                            }}
                            className="font-medium truncate hover:underline"
                          >
                            {conv.user.full_name || conv.user.email}
                          </button>
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
                    </div>
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
                  <button
                    type="button"
                    onClick={() => setShowConversationDetails(true)}
                    className="text-left hover:text-primary-700"
                  >
                    <h2 className="text-xl font-semibold">
                      {conversations.get(selectedConversation)?.user.full_name ||
                        conversations.get(selectedConversation)?.user.email}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {conversations.get(selectedConversation)?.user.email}
                    </p>
                  </button>
                </div>

                <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
                  {selectedMessages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nessun messaggio</p>
                  ) : (
                    selectedMessages.map((msg) => {
                      const isMe = msg.sender_id === user?.id
                      const sender = msg.sender as Profile
                      const gradient = getProfileGradient(sender?.role || 'student')
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 items-end ${isMe ? 'justify-end flex-row-reverse' : 'justify-start'}`}
                        >
                          <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden bg-gradient-to-br ${gradient.circle}`}>
                            {sender?.avatar_url ? (
                              <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(sender?.full_name || sender?.email)
                            )}
                          </div>
                          <div
                            className={`max-w-[75%] rounded-lg p-4 ${
                              isMe ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {selectedMessages[0]?.id === msg.id && (
                              <div className="font-semibold mb-1">{msg.subject}</div>
                            )}
                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            <div className={`text-xs mt-2 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                              {new Date(msg.created_at).toLocaleString('it-IT')}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <form onSubmit={handleSendConversationMessage} className="space-y-4">
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
                  {!canMessageAnyone && userRole === 'student'
                    ? 'Le aziende interessate ai tuoi contenuti e portfolio possono contattarti qui. Quando riceverai un messaggio, potrai rispondere in questa sezione.'
                    : 'Seleziona una conversazione o invia un nuovo messaggio.'}
                </p>
              </Card>
            )}

            {/* Nuovo messaggio: aziende e staff (Simone, Alessia, Matteo) */}
            {!selectedConversation && canMessageAnyone && (
              <Card variant="elevated" className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Nuovo Messaggio</h2>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="relative" ref={recipientPickerRef}>
                    <Input
                      label="Destinatario"
                      placeholder="Cerca nome o email..."
                      value={recipientQuery}
                      onChange={(e) => {
                        if (newMessage.recipient_id) {
                          setNewMessage((prev) => ({ ...prev, recipient_id: '' }))
                        }
                        setRecipientQuery(e.target.value)
                        setRecipientPickerOpen(true)
                      }}
                      onFocus={() => setRecipientPickerOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setRecipientPickerOpen(false), 120)
                      }}
                      required={!selectedRecipient}
                    />
                    {selectedRecipient && (
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-primary-50 border border-primary-100 px-2 py-1">
                        <div className="text-xs text-primary-800 truncate">
                          Destinatario: <span className="font-semibold">{selectedRecipient.full_name || selectedRecipient.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewMessage((prev) => ({ ...prev, recipient_id: '' }))
                            setRecipientQuery('')
                            setRecipientPickerOpen(true)
                          }}
                          className="ml-2 text-primary-700 hover:text-primary-900"
                          aria-label="Rimuovi destinatario"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {recipientPickerOpen && !selectedRecipient && filteredRecipients.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                        {filteredRecipients.map((r) => (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => {
                              setNewMessage((prev) => ({ ...prev, recipient_id: r.id }))
                              setRecipientQuery('')
                              setRecipientPickerOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            <div className="font-medium text-gray-900 truncate">
                              {r.full_name || r.email}{' '}
                              <span className="text-xs text-gray-500">
                                ({r.role === 'student' ? 'Studente' : r.role === 'company' ? 'Azienda' : r.role === 'docente' ? 'Docente' : r.role || 'Utente'})
                              </span>
                            </div>
                            {r.full_name && r.email && (
                              <div className="text-xs text-gray-500 truncate">{r.email}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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
      {selectedConversation && showConversationDetails && selectedConversationUser && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Dettagli conversazione</h3>
              <button
                type="button"
                onClick={() => setShowConversationDetails(false)}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Chiudi dettagli"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  {selectedConversationUser.role === 'company' ? (
                    <Building2 className="w-5 h-5 text-primary-600" />
                  ) : (
                    <User className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{selectedConversationUser.full_name || selectedConversationUser.email}</div>
                  <div className="text-xs text-gray-500 truncate">{selectedConversationUser.email}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Allegati
                </div>
                {conversationAttachments.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessun allegato trovato nella conversazione.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {conversationAttachments.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-primary-700 hover:text-primary-800 truncate"
                      >
                        {item.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                disabled={sending}
                onClick={handleDeleteConversation}
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Elimina conversazione
              </Button>
            </div>
          </div>
        </div>
      )}
      
  )
}

