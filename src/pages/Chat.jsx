import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Megaphone, Send, Lock } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatChatTimestamp, getInitials } from '../lib/format'

export default function Chat() {
  const { user } = useAuth()
  const { channels, role, myAccount } = useData()
  const isAdmin = role === 'admin'

  const [currentChannelId, setCurrentChannelId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const subRef = useRef(null)

  // Pick the first channel by default
  useEffect(() => {
    if (!currentChannelId && channels.length > 0) {
      setCurrentChannelId(channels[0].id)
    }
  }, [channels, currentChannelId])

  // Load messages whenever channel changes
  useEffect(() => {
    if (!currentChannelId) return
    let cancelled = false
    setLoading(true)
    setMessages([])

    supabase
      .from('messages')
      .select('*')
      .eq('channel_id', currentChannelId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error(error)
        setMessages(data || [])
        setLoading(false)
      })

    if (subRef.current) {
      supabase.removeChannel(subRef.current)
    }

    subRef.current = supabase
      .channel(`messages:${currentChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${currentChannelId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // de-duplicate (insert may already be in our optimistic state)
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      if (subRef.current) {
        supabase.removeChannel(subRef.current)
        subRef.current = null
      }
    }
  }, [currentChannelId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentChannel = channels.find((c) => c.id === currentChannelId)
  const canPost = currentChannel
    ? currentChannel.admin_only_post
      ? isAdmin
      : true
    : false

  const handleSend = async (e) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !currentChannelId) return
    setSending(true)
    setDraft('')
    const { error } = await supabase.from('messages').insert({
      channel_id: currentChannelId,
      user_id: user.id,
      user_name: myAccount?.name || user.email,
      user_avatar: myAccount?.profile_picture_url || null,
      content,
    })
    if (error) {
      console.error(error)
      window.alert('Failed to send message.')
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Chat
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time conversation across fund channels.
        </p>
      </div>

      <div className="vcf-card overflow-hidden flex flex-col md:flex-row h-[calc(100vh-220px)] min-h-[480px]">
        {/* Channel sidebar (desktop) */}
        <aside className="hidden md:flex md:w-56 flex-col border-r border-slate-200/60 bg-slate-50/60">
          <div className="px-4 py-3 border-b border-slate-200/60">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
              Channels
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {channels.map((ch) => {
              const active = ch.id === currentChannelId
              const Icon = ch.admin_only_post ? Megaphone : Hash
              return (
                <button
                  key={ch.id}
                  onClick={() => setCurrentChannelId(ch.id)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-vcf-700 text-white font-medium'
                      : 'text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon size={14} />
                  <span className="truncate">{ch.name}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Mobile selector */}
        <div className="md:hidden p-3 border-b border-slate-200/60 bg-slate-50/60">
          <select
            className="vcf-input"
            value={currentChannelId || ''}
            onChange={(e) => setCurrentChannelId(e.target.value)}
          >
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.admin_only_post ? '📢 ' : '# '}
                {ch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Main chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentChannel && (
            <div className="hidden md:block px-5 py-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                {currentChannel.admin_only_post ? (
                  <Megaphone size={16} />
                ) : (
                  <Hash size={16} />
                )}
                {currentChannel.name}
              </div>
              {currentChannel.description && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {currentChannel.description}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
            {loading ? (
              <div className="text-center text-sm text-slate-400 py-12">
                Loading messages…
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-12">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <MessageList messages={messages} />
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200/60 p-3 bg-white">
            {canPost ? (
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${
                    currentChannel?.name ? '#' + currentChannel.name : ''
                  }`}
                  className="vcf-input rounded-full"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="vcf-btn-primary !rounded-full !px-4"
                  aria-label="Send"
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div className="text-center text-sm text-slate-400 py-2 inline-flex items-center justify-center gap-1.5 w-full">
                <Lock size={14} />
                Only admins can post in this channel.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageList({ messages }) {
  let lastUserId = null
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const newGroup = msg.user_id !== lastUserId
          lastUserId = msg.user_id
          return (
            <motion.div
              key={msg.id || `${msg.created_at}-${msg.user_id}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={newGroup ? 'mb-1.5' : ''}
            >
              {newGroup ? (
                <div className="flex gap-3">
                  <div className="shrink-0 w-9">
                    {msg.user_avatar ? (
                      <img
                        src={msg.user_avatar}
                        alt={msg.user_name}
                        className="rounded-full w-8 h-8 object-cover"
                      />
                    ) : (
                      <div className="rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br from-vcf-500 to-vcf-700">
                        {getInitials(msg.user_name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {msg.user_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatChatTimestamp(msg.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-snug">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ml-12 text-sm text-slate-700 whitespace-pre-wrap break-words leading-snug">
                  {msg.content}
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
