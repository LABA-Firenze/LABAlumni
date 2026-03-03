'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { MessageCircle, X, Send, User, Building2, Search } from 'lucide-react'
import { Button } from './ui/Button'
import type { Message, Profile } from '@/types/database'
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
  const [newMessage, setNewMessage] = useState({ recipient_id: '', subject: '', content: '' })
  const [conversationMessage, setConversationMessage] = useState({ subject: '', content: '' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      setUserRole((profile?.role || 'student') as 'student' | 'company')

      if (profile?.role === 'company') {
        const { data: recs } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .eq('role', 'student')
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

  const conversationList = Array.from(conversations.values())
    .filter((conv) => {
      if (userRole === 'student' && conv.user.role !== 'company') return false
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
      await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: selectedConversation,
        subject: conversationMessage.subject,
        content: conversationMessage.content,
      })
      setConversationMessage({ subject: '', content: '' })
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
    setSending(true)
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: newMessage.recipient_id,
        subject: newMessage.subject,
        content: newMessage.content,
      })
      setNewMessage({ recipient_id: '', subject: '', content: '' })
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
  }

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Messaggi"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[520px]">
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
                    {userRole === 'student'
                      ? 'Le aziende possono contattarti qui'
                      : 'Nessuna conversazione'}
                  </div>
                ) : (
                  <div className="py-1">
                    {conversationList.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => selectConv(conv.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          {conv.user.role === 'company' ? (
                            <Building2 className="w-5 h-5 text-primary-600" />
                          ) : (
                            <User className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {conv.user.full_name || conv.user.email}
                          </p>
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
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {userRole === 'company' && (
                <div className="p-3 border-t border-gray-100 shrink-0">
                  <form onSubmit={handleSendNew} className="space-y-2">
                    <select
                      value={newMessage.recipient_id}
                      onChange={(e) =>
                        setNewMessage((prev) => ({ ...prev, recipient_id: e.target.value }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Nuovo messaggio a...</option>
                      {recipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.full_name || r.email}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Oggetto"
                      value={newMessage.subject}
                      onChange={(e) =>
                        setNewMessage((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                      required
                    />
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
                <span className="font-medium truncate">
                  {conversations.get(selectedConversation!)?.user?.full_name ||
                    conversations.get(selectedConversation!)?.user?.email}
                </span>
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
                      <p className="text-xs font-medium opacity-90">{msg.subject}</p>
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
                <input
                  placeholder="Oggetto"
                  value={conversationMessage.subject}
                  onChange={(e) =>
                    setConversationMessage((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                  required
                />
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
    </>
  )
}
