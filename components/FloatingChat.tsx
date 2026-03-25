'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { MessageCircle, X, Send, User, Building2, Search, Paperclip, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import type { Message, Profile } from '@/types/database'
import { isStaffEmail } from '@/lib/staff-labels'
import { useMessagesRealtime } from '@/hooks/useMessagesRealtime'

const OPEN_CHAT_EVENT = 'floating-chat-open'

export function openFloatingChat() {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT))
}

export function FloatingChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [conversations, setConversations] = useState<Map<string, any>>(new Map())
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<(Message & { sender: Profile; recipient: Profile })[]>([])
  const [recipients, setRecipients] = useState<Profile[]>([])
  const [userRole, setUserRole] = useState<'student' | 'company' | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({ recipient_id: '', content: '' })
  const [conversationMessage, setConversationMessage] = useState({ content: '' })
  const [showConversationDetails, setShowConversationDetails] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recipientPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(OPEN_CHAT_EVENT, handler)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler)
  }, [])

  useEffect(() => {
    if (open && user) {
      loadData()
    }
  }, [open, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedConversation])

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

  const loadData = async () => {
    if (!user) return
    setLoading(true)
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

      const convs = new Map()
      data?.forEach((msg: any) => {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender
        if (!convs.has(otherId)) {
          convs.set(otherId, { id: otherId, user: otherUser, messages: [], unread: 0, lastMessage: null })
        }
        const conv = convs.get(otherId)
        conv.messages.push(msg)
        if (!msg.read && msg.recipient_id === user.id) conv.unread++
        if (!conv.lastMessage || new Date(msg.created_at) > new Date(conv.lastMessage.created_at)) {
          conv.lastMessage = msg
        }
      })
      setConversations(convs)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = (profile?.role || 'student') as 'student' | 'company'
      setUserRole(role)

      // Aziende e staff (Simone, Alessia, Matteo) possono avviare nuove conversazioni
      const canMessageAnyone = role === 'company' || isStaffEmail(user.email)
      if (canMessageAnyone) {
        const { data: recs } = role === 'company'
          ? await supabase.from('profiles').select('*').neq('id', user.id).eq('role', 'student')
          : await supabase.from('profiles').select('*').neq('id', user.id)
        setRecipients(recs || [])
      }

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('read', false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useMessagesRealtime(open ? user?.id : undefined, loadData)

  const canMessageAnyone = userRole === 'company' || isStaffEmail(user?.email)
  const conversationList = Array.from(conversations.values())
    .filter((conv) => {
      // Studenti: vedono conversazioni con aziende E con staff (Simone, Alessia, Matteo)
      if (!canMessageAnyone && userRole === 'student') {
        const otherIsCompany = conv.user?.role === 'company'
        const otherIsStaff = isStaffEmail(conv.user?.email)
        if (!otherIsCompany && !otherIsStaff) return false
      }
      if (!searchTerm) return true
      return (
        conv.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessage?.created_at || 0).getTime() -
        new Date(a.lastMessage?.created_at || 0).getTime()
    )

  const selectedMessages = selectedConversation
    ? messages
        .filter(
          (m) =>
            (m.sender_id === selectedConversation && m.recipient_id === user?.id) ||
            (m.recipient_id === selectedConversation && m.sender_id === user?.id)
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : []

  const handleSendConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedConversation) return
    setSending(true)
    try {
      const replySubject = selectedMessages[0]?.subject || 'Messaggio'
      await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: selectedConversation,
        subject: replySubject,
        content: conversationMessage.content,
      })
      setConversationMessage({ content: '' })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Errore invio')
    } finally {
      setSending(false)
    }
  }

  const handleSendNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!newMessage.recipient_id) {
      alert('Seleziona un destinatario dalla lista.')
      return
    }
    setSending(true)
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: newMessage.recipient_id,
        subject: 'Messaggio',
        content: newMessage.content,
      })
      setNewMessage({ recipient_id: '', content: '' })
      setRecipientQuery('')
      setRecipientPickerOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Errore invio')
    } finally {
      setSending(false)
    }
  }

  const selectConv = (id: string) => {
    setSelectedConversation(id)
    setView('chat')
  }

  const backToList = () => {
    setSelectedConversation(null)
    setView('list')
    setShowConversationDetails(false)
  }

  if (!user) return null

  const filteredRecipients = recipients
    .filter((r) => {
      const q = recipientQuery.trim().toLowerCase()
      if (!q) return true
      return (
        (r.full_name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
      )
    })
    .slice(0, 8)

  const selectedRecipient = newMessage.recipient_id
    ? recipients.find((r) => r.id === newMessage.recipient_id) || null
    : null

  const selectedConversationUser = selectedConversation
    ? conversations.get(selectedConversation)?.user || null
    : null

  const conversationAttachments = useMemo(() => {
    if (!selectedMessages.length) return []
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    const items = selectedMessages.flatMap((msg) =>
      Array.from(msg.content.matchAll(urlRegex)).map((match, index) => ({
        id: `${msg.id}-${index}`,
        messageId: msg.id,
        url: match[0],
        createdAt: msg.created_at,
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
      backToList()
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione chat')
    } finally {
      setSending(false)
    }
  }

  const content = (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ right: '1.5rem', bottom: '1.5rem', left: 'auto', top: 'auto' }}
        aria-label="Messaggi"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {open && (
        <div
          className="fixed z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[650px] max-h-[calc(100vh-7.5rem)]"
          style={{ right: '1.5rem', bottom: '6rem', left: 'auto', top: 'auto' }}
        >
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <h3 className="font-semibold">Messaggi</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {view === 'list' ? (
            <>
              <div className="p-2 border-b border-gray-100 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Cerca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                  <div className="p-8 text-center text-gray-500 text-sm">Caricamento...</div>
                ) : conversationList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    {!canMessageAnyone && userRole === 'student'
                      ? 'Le aziende possono contattarti qui'
                      : 'Nessuna conversazione'}
                  </div>
                ) : (
                  <div className="py-1">
                    {conversationList.map((conv) => (
                      <div
                        key={conv.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectConv(conv.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            selectConv(conv.id)
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedConversation(conv.id)
                            setView('chat')
                            setShowConversationDetails(true)
                          }}
                          className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 hover:bg-primary-200"
                          aria-label="Apri dettagli chat"
                        >
                          {conv.user.role === 'company' ? (
                            <Building2 className="w-5 h-5 text-primary-600" />
                          ) : (
                            <User className="w-5 h-5 text-primary-600" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedConversation(conv.id)
                              setView('chat')
                              setShowConversationDetails(true)
                            }}
                            className="font-medium truncate hover:underline"
                          >
                            {conv.user.full_name || conv.user.email}
                          </button>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500 truncate">
                              {conv.lastMessage.subject}
                            </p>
                          )}
                        </div>
                        {conv.unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {canMessageAnyone && (
                <div className="p-3 border-t border-gray-100 shrink-0">
                  <form onSubmit={handleSendNew} className="space-y-2">
                    <div className="relative" ref={recipientPickerRef}>
                      <input
                        placeholder="Nuovo messaggio a..."
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
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
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
                              <div className="font-medium text-gray-900 truncate">{r.full_name || r.email}</div>
                              {r.full_name && r.email && (
                                <div className="text-xs text-gray-500 truncate">{r.email}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      placeholder="Messaggio..."
                      value={newMessage.content}
                      onChange={(e) =>
                        setNewMessage((prev) => ({ ...prev, content: e.target.value }))
                      }
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
                      required
                    />
                    <Button type="submit" size="sm" variant="primary" disabled={sending} className="w-full">
                      <Send className="w-4 h-4 shrink-0" />
                      Invia
                    </Button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 shrink-0">
                <button
                  onClick={backToList}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  ← Indietro
                </button>
                <button
                  type="button"
                  onClick={() => setShowConversationDetails(true)}
                  className="font-medium truncate text-left hover:text-primary-600"
                >
                  {selectedConversationUser?.full_name || selectedConversationUser?.email}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {selectedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        msg.sender_id === user.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_id === user.id ? 'text-white/80' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form
                onSubmit={handleSendConversation}
                className="p-3 border-t border-gray-100 shrink-0 space-y-2"
              >
                <textarea
                  placeholder="Scrivi un messaggio..."
                  value={conversationMessage.content}
                  onChange={(e) =>
                    setConversationMessage((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
                  required
                />
                <Button type="submit" size="sm" variant="primary" disabled={sending} className="w-full">
                  <Send className="w-4 h-4 shrink-0" />
                  Invia
                </Button>
              </form>
            </>
          )}
        </div>
      )}
      {open && showConversationDetails && selectedConversationUser && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-semibold">Dettagli chat</h4>
              <button
                type="button"
                onClick={() => setShowConversationDetails(false)}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Chiudi dettagli chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <button
                type="button"
                onClick={() => setShowConversationDetails(false)}
                className="w-full flex items-center gap-3 text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
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
              </button>

              <div>
                <div className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Allegati
                </div>
                {conversationAttachments.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessun allegato trovato nella conversazione.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-2">
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
                disabled={sending}
                onClick={handleDeleteConversation}
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Elimina conversazione
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }
  return content
}
