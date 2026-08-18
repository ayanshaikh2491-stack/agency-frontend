'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Agent roster (mirrors backend DEFAULT_AGENTS + CEO) ──────────────────────
const AGENTS = [
  { id: 'sba', name: 'SBA', role: 'Leads & Sales', color: '#2563eb' },
  { id: 'seo', name: 'SEO', role: 'Search & Audit', color: '#6bcf7f' },
  { id: 'website', name: 'Website', role: 'Build & Host', color: '#4ecdc4' },
  { id: 'ads', name: 'Ads', role: 'Paid Media', color: '#ff6b6b' },
  { id: 'social', name: 'Social', role: 'Organic Social', color: '#ffd93d' },
  { id: 'content', name: 'Content', role: 'Visual Exec', color: '#b197fc' },
  { id: 'analytics', name: 'Analytics', role: 'Reporting', color: '#ffa07a' },
  { id: 'analyzing', name: 'Analyzing', role: 'Insights', color: '#9b7ede' },
  { id: 'memory', name: 'Memory', role: 'Workspace KV', color: '#a899b5' },
]

function uid() {
  return 'm' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
}
function ts() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

function renderMD(text) {
  let h = (text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_, __, code) => {
    const esc = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return '<pre class="bg-black/40 border border-white/10 rounded p-3 my-2 text-[12px] leading-relaxed text-emerald-300/90 font-mono overflow-x-auto">' + esc + '</pre>'
  })
  h = h.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[12px] font-mono">$1</code>')
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  h = h.replace(/\n/g, '<br>')
  return h
}

// ── Floor avatar ─────────────────────────────────────────────────────────────
function Avatar({ agent, status }) {
  const dim = status === 'idle'
  return (
    <div className="flex flex-col items-center gap-2 w-[112px]" style={{ opacity: dim ? 0.55 : 1 }}>
      <div
        className="relative h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300"
        style={{
          background: agent.color + '22',
          border: `2px solid ${agent.color}`,
          boxShadow: status === 'working' ? `0 0 18px ${agent.color}66` : 'none',
        }}
      >
        {agent.name.slice(0, 2).toUpperCase()}
        {status === 'working' && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
        )}
        {status === 'thinking' && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400" />
        )}
      </div>
      <div className="text-center">
        <div className="text-[13px] font-semibold text-white leading-none">{agent.name}</div>
        <div className="text-[10px] text-white/50 mt-0.5 leading-none">{agent.role}</div>
        <div className="text-[9px] text-white/40 mt-1 lowercase leading-none">{status}</div>
      </div>
    </div>
  )
}

export default function CEOPage() {
  const [workspaces, setWorkspaces] = useState([])
  const [wsId, setWsId] = useState('')
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [statuses, setStatuses] = useState({})
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)

  const convId = useRef(null)

  // Load workspaces (multi-workspace support)
  useEffect(() => {
    fetch('/api/chat/workspace')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : []
        setWorkspaces(list)
        if (!wsId && list[0]) setWsId(list[0].id)
      })
      .catch(() => setWorkspaces([]))
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs, statuses])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    const mine = { id: uid(), role: 'user', text, ts: ts() }
    setMsgs((m) => [...m, mine])
    setStatuses((s) => ({ ...s, ceo: 'thinking' }))

    // Mark expected agents as working so the floor feels alive
    const pending = ['sba', 'seo', 'website', 'ads', 'social', 'content', 'analytics', 'analyzing', 'memory']
    setStatuses((s) => Object.fromEntries(pending.map((a) => [a, s[a] === 'working' ? 'working' : s[a]])))

    try {
      const res = await fetch('/api/ceo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: convId.current,
          workspace_id: wsId || null,
        }),
      })
      const data = await res.json()
      convId.current = data.conversation_id || convId.current

      setMsgs((m) => [
        ...m,
        { id: uid(), role: 'ceo', text: data.response || '(no response)', ts: ts() },
      ])

      // Drive the floor from the CEO's thinking_phases (delegation trace)
      const phases = data.thinking_phases || []
      const touched = new Set()
      phases.forEach((p) => {
        const t = (p.phase || '').toLowerCase()
        AGENTS.forEach((a) => {
          if (t.includes(a.id) || t.includes(a.name.toLowerCase())) touched.add(a.id)
        })
      })
      const now = {}
      AGENTS.forEach((a) => {
        now[a.id] = touched.has(a.id) ? 'working' : 'idle'
      })
      setStatuses(now)
    } catch (e) {
      setMsgs((m) => [...m, { id: uid(), role: 'ceo', text: 'CEO reached out but hit a snag: ' + e.message, ts: ts() }])
      setStatuses({})
    } finally {
      setSending(false)
      setTimeout(() => setStatuses((s) => ({ ...s, ceo: 'idle' })), 600)
    }
  }, [input, sending, wsId])

  return (
    <main className="h-screen w-screen bg-[#0c0d10] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#2563eb] flex items-center justify-center font-bold text-sm">CEO</div>
          <div>
            <div className="text-sm font-semibold leading-none">TAGS Agency — CEO Control Room</div>
            <div className="text-[10px] text-white/40 mt-0.5 leading-none">Boss talks to CEO · CEO runs the floor</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-white/50">Workspace</label>
          <select
            value={wsId}
            onChange={(e) => setWsId(e.target.value)}
            className="bg-white/10 border border-white/15 rounded-md text-xs px-2 py-1.5 outline-none"
          >
            {workspaces.length === 0 && <option value="">(none)</option>}
            {workspaces.map((w) => (
              <option key={w.id} value={w.id} className="bg-[#1a1b1d]">
                {w.name} · {w.client_name || w.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[1fr_380px] min-h-0">
        {/* Floor */}
        <section className="p-6 overflow-y-auto">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-4">The Floor — agents at work</div>
          <div className="flex flex-wrap gap-6">
            {AGENTS.map((a) => (
              <Avatar key={a.id} agent={a} status={statuses[a.id] || 'idle'} />
            ))}
          </div>

          {/* Activity log */}
          <div className="mt-8 text-[11px] uppercase tracking-widest text-white/30 mb-2">Activity</div>
          <div className="space-y-1.5">
            {msgs.length === 0 && (
              <div className="text-white/30 text-xs">Boss, bol do — CEO samajh lega aur floor chalayega.</div>
            )}
            {msgs.map((m) =>
              m.role === 'user' ? null : (
                <div key={m.id} className="text-xs text-white/60">
                  <span className="text-white/30 mr-2">{m.ts}</span>
                  {m.text.slice(0, 160)}
                  {m.text.length > 160 && '…'}
                </div>
              )
            )}
          </div>
        </section>

        {/* Chat with CEO */}
        <aside className="border-l border-white/10 bg-black/30 flex flex-col min-h-0">
          <div className="px-4 h-11 flex items-center border-b border-white/10 text-sm font-semibold">
            Chat with CEO
            {statuses.ceo === 'thinking' && <span className="ml-2 text-[10px] text-amber-300">thinking…</span>}
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.length === 0 && (
              <div className="text-white/40 text-sm">
                Namaste Boss. Main CEO hoon. Jo bhi karwana hai bolo — main agents ko bol dunga.
                <br />
                <br />
                Example: <span className="text-white/60">"Client ke liye website banao aur SEO start karo"</span>
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={
                    'max-w-[88%] px-3 py-2 text-sm rounded-2xl ' +
                    (m.role === 'user'
                      ? 'bg-[#2563eb] text-white rounded-br-sm'
                      : 'bg-white/10 text-white rounded-bl-sm')
                  }
                >
                  <div
                    className="text-[13px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMD(m.text) }}
                  />
                  <div className="text-[9px] text-white/30 mt-1 text-right">{m.ts}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
              placeholder="Boss → CEO…"
              className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
            />
            <button
              onClick={send}
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-medium disabled:opacity-50"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
