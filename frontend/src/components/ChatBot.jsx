import { useState, useRef, useEffect } from 'react'
import API from '../config'

const QUICK = [
  'Events today',
  'Any tech events?',
  'Most popular events',
  'Career opportunities',
  'Help me pick one',
]

export default function ChatBot({ forceOpen = false, onToggle }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm CampusBot. Ask me anything about events on campus!",
    },
  ])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const userId = localStorage.getItem('user_id')

  // Sync open state with gesture controller
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(forceOpen) }, [forceOpen])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const toggle = () => {
    setOpen(o => !o)
    onToggle?.()
  }

  // ── Send message with streaming ──────────────────────────────────────
  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    // Build history from current messages (skip the greeting)
    const history = messages
      .slice(1)
      .map(m => ({ role: m.role, content: m.content }))

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: msg }])

    // Add empty assistant message that we'll stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    setLoading(true)

    try {
      const response = await fetch(`${API}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: msg,
          history,
        }),
      })

      if (!response.ok) throw new Error('Stream failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            const token = parsed.token || ''
            if (token) {
              // Append token to the last (assistant) message
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + token,
                }
                return updated
              })
            }
          } catch (e) { console.error(e) }
        }
      }
    } catch (error) {
      console.error(error);
      // Replace empty assistant message with error
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '⚠️ Could not reach CampusBot. Is Ollama running? Open terminal and run: ollama serve',
        }
        return updated
      })
    }

    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // ════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Floating bubble ── */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600
          text-white rounded-full shadow-lg text-2xl flex items-center
          justify-center hover:bg-indigo-700 active:scale-95
          transition-all z-50 select-none"
        aria-label="Toggle chatbot">
        {open ? '✕' : '💬'}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 bg-white rounded-2xl
            shadow-2xl border border-gray-100 flex flex-col z-50
            animate-in"
          style={{ width: 320, height: 460 }}>

          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3
            rounded-t-2xl flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex
              items-center justify-center text-sm font-bold">
              🤖
            </div>
            <div>
              <div className="font-semibold text-sm">CampusBot</div>
              <div className="text-xs opacity-60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400
                  rounded-full inline-block" />
                Powered by Ollama · Free & offline
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i}
                className={`flex gap-2
                  ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {/* Bot avatar */}
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 bg-indigo-100 rounded-full
                    flex items-center justify-center text-xs flex-shrink-0
                    mt-0.5">
                    🤖
                  </div>
                )}

                <div className={`max-w-[78%] px-3 py-2 rounded-2xl
                  text-xs leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {m.content}

                  {/* Blinking cursor while streaming */}
                  {m.role === 'assistant' &&
                    loading &&
                    i === messages.length - 1 &&
                    m.content.length > 0 && (
                      <span className="inline-block w-1.5 h-3
                      bg-gray-500 ml-0.5 align-middle
                      animate-pulse" />
                    )}

                  {/* Loading dots for empty streaming message */}
                  {m.role === 'assistant' &&
                    loading &&
                    i === messages.length - 1 &&
                    m.content.length === 0 && (
                      <span className="flex gap-1 items-center h-3">
                        {[0, 1, 2].map(d => (
                          <span key={d}
                            className="w-1.5 h-1.5 bg-gray-400
                            rounded-full animate-bounce"
                            style={{
                              animationDelay: `${d * 0.15}s`
                            }} />
                        ))}
                      </span>
                    )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies — only show when not loading */}
          {!loading && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
              {QUICK.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-2.5 py-1 rounded-full border
                    border-indigo-200 text-indigo-600
                    hover:bg-indigo-50 transition whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="p-3 border-t border-gray-100 flex gap-2
            flex-shrink-0">
            <input
              ref={inputRef}
              className="flex-1 border border-gray-200 rounded-xl
                px-3 py-2 text-xs focus:outline-none
                focus:ring-2 focus:ring-indigo-400
                disabled:opacity-50"
              placeholder={loading ? 'CampusBot is typing…' : 'Ask anything…'}
              value={input}
              disabled={loading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white px-3 rounded-xl
                hover:bg-indigo-700 text-xs transition
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-95">
              {loading ? '⏳' : '→'}
            </button>
          </div>

        </div>
      )}
    </>
  )
}
