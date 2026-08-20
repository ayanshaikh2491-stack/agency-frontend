'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Agent roster (mirrors backend DEFAULT_AGENTS + CEO as god) ────────────────
const AGENTS = [
  { id: 'ceo', name: 'CEO', role: 'God Orchestrator', color: '#f59e0b', god: true },
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
const KIND_COLOR = { task: '#60a5fa', think: '#a78bfa', tool: '#34d399', msg: '#fbbf24', status: '#94a3b8' }

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

// ── Floor avatar (Sims-style, idle/working/thinking) ──────────────────────────
function Avatar({ agent, rec, selected, onClick }) {
  const status = rec?.status || 'idle'
  const dim = status === 'idle' && !selected
  return (
    <button
      onClick={onClick}
      className={'flex flex-col items-center gap-2 w-[124px] rounded-xl p-2 transition-all ' + (selected ? 'bg-white/10 ring-1 ring-white/30' : 'hover:bg-white/5')}
      style={{ opacity: dim ? 0.55 : 1 }}
    >
      <div
        className="relative h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300"
        style={{
          background: agent.color + '22',
          border: `2px solid ${agent.color}`,
          boxShadow: status === 'working' ? `0 0 18px ${agent.color}66` : (agent.god ? `0 0 14px ${agent.color}55` : 'none'),
        }}
      >
        {agent.god ? '★' : agent.name.slice(0, 2).toUpperCase()}
        {status === 'working' && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
        )}
        {status === 'thinking' && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400" />
        )}
      </div>
      <div className="text-center w-full">
        <div className="text-[13px] font-semibold text-white leading-none">{agent.name}{agent.god ? ' · BOSS' : ''}</div>
        <div className="text-[10px] text-white/50 mt-0.5 leading-none">{agent.role}</div>
        <div className="text-[9px] text-white/40 mt-1 lowercase leading-none">{status}</div>
        {rec?.task && (
          <div className="text-[9px] text-white/60 mt-1 leading-tight line-clamp-2 px-1">{rec.task}</div>
        )}
      </div>
    </button>
  )
}

// ── Live activity transcript (munder-difflin terminal equiv) ──────────────────
function ActivityPanel({ wsId, agent }) {
  const [lines, setLines] = useState([])
  const ref = useRef(null)
  useEffect(() => {
    let alive = true
    const tick = async () => {
      if (!alive || !wsId || !agent) return
      try {
        const q = `?workspace_id=${encodeURIComponent(wsId)}&agent_type=${agent.id}&limit=80`
        const r = await fetch('/api/ceo/agent-log' + q)
        const d = await r.json()
        if (alive) setLines(d.log || [])
      } catch (e) {}
    }
    tick()
    const iv = setInterval(tick, 1500)
    return () => { alive = false; clearInterval(iv) }
  }, [wsId, agent])
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])
  return (
    <div className="h-full flex flex-col min-h-0 bg-black/30 rounded-lg border border-white/10">
      <div className="px-3 h-8 flex items-center gap-2 border-b border-white/10 text-[11px] text-white/50">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        live · {agent ? agent.name : '—'} activity
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed space-y-0.5">
        {agent && lines.length === 0 && (
          <div className="text-white/30">{(agent.id === 'ceo' ? 'CEO' : agent.name)} idle — talk to it or let the CEO delegate.</div>
        )}
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-white/25 shrink-0">{new Date(l.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className="shrink-0 uppercase" style={{ color: KIND_COLOR[l.kind] || '#94a3b8' }}>{l.kind}</span>
            <span className="text-white/75">{l.text}</span>
          </div>
        ))}
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
  const [floor, setFloor] = useState({})      // agent_type -> {status, task}
  const [active, setActive] = useState(null)   // null = CEO mode, else agent id
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const convId = useRef(null)

  // Load workspaces
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

  // Live floor polling (2s)
  useEffect(() => {
    let alive = true
    const tick = async () => {
      if (!alive) return
      try {
        const q = wsId ? `?workspace_id=${wsId}` : ''
        const r = await fetch('/api/ceo/floor' + q)
        const d = await r.json()
        const map = {}
        ;(d.floor || []).forEach((rec) => { map[rec.agent_type] = rec })
        if (alive) setFloor(map)
      } catch (e) {}
    }
    tick()
    const iv = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(iv) }
  }, [wsId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    setMsgs((m) => [...m, { id: uid(), role: 'user', text, ts: ts() }])

    const isCeo = active === null
    const target = isCeo ? 'CEO' : (AGENTS.find((a) => a.id === active)?.name || active)

    try {
      let data
      if (isCeo) {
        const res = await fetch('/api/ceo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, conversation_id: convId.current, workspace_id: wsId || null }),
        })
        data = await res.json()
        convId.current = data.conversation_id || convId.current
      } else {
        // CEO delegates to the chosen floor agent inside the active workspace
        const res = await fetch(`/api/chat/workspace/${wsId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, agent_type: active }),
        })
        data = await res.json()
      }
      setMsgs((m) => [...m, { id: uid(), role: 'agent', name: target, text: data.response || '(no response)', ts: ts() }])
    } catch (e) {
      setMsgs((m) => [...m, { id: uid(), role: 'agent', name: target, text: 'Snag: ' + e.message, ts: ts() }])
    } finally {
      setSending(false)
    }
  }, [input, sending, wsId, active])

  const activeAgent = active === null ? null : AGENTS.find((a) => a.id === active)
  const activeName = active === null ? 'CEO' : (activeAgent?.name || active)

  return (
    <main className="h-screen w-screen bg-[#0c0d10] text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-5 h-14 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#f59e0b] flex items-center justify-center font-bold text-sm">★</div>
          <div>
            <div className="text-sm font-semibold leading-none">TAGS Agency — CEO Control Room</div>
            <div className="text-[10px] text-white/40 mt-0.5 leading-none">Live multi-agent floor · click an agent to watch its work</div>
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

      <div className="flex-1 grid grid-cols-[1fr_400px] min-h-0">
        {/* Floor + activity */}
        <section className="p-6 overflow-y-auto flex flex-col">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-4">The Floor — all agents, live</div>
          <div className="flex flex-wrap gap-4">
            {AGENTS.map((a) => (
              <Avatar
                key={a.id}
                agent={a}
                rec={a.id === 'ceo' ? floor['ceo'] : floor[a.id]}
                selected={active === a.id}
                onClick={() => setActive(active === a.id ? null : a.id)}
              />
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActive(null)}
              className={'px-3 py-1.5 rounded-lg text-xs ' + (active === null ? 'bg-[#f59e0b] text-black' : 'bg-white/10 text-white/60')}
            >
              CEO mode
            </button>
            <span className="text-[11px] text-white/40 self-center">
              {active === null ? 'Talking to CEO — god orchestrator delegates to the floor.' : `Watching ${activeName}'s live work.`}
            </span>
          </div>

          <div className="mt-6 flex-1 min-h-[200px]">
            <ActivityPanel wsId={wsId} agent={active !== null ? activeAgent : { id: 'ceo', name: 'CEO' }} />
          </div>
        </section>

        {/* Chat */}
        <aside className="border-l border-white/10 bg-black/30 flex flex-col min-h-0">
          <div className="px-4 h-11 flex items-center border-b border-white/10 text-sm font-semibold">
            {active === null ? 'Chat with CEO (God)' : `Direct line to ${activeName}`}
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.length === 0 && (
              <div className="text-white/40 text-sm">
                {active === null ? (
                  <>
                    Namaste Boss. Main CEO hoon — god orchestrator. Bolo jo karwana hai, main agents ko bol dunga.
                    <br /><br />
                    Example: <span className="text-white/60">"Client ke liye website banao aur SEO start karo"</span> — main sab agents ko ek saath delegate kar dunga, floor pe dekhte raho.
                  </>
                ) : (
                  <>
                    Direct line to <b>{activeName}</b>. Bol do — ye agent khud kaam karega.
                  </>
                )}
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
                  {m.name && m.role !== 'user' && (
                    <div className="text-[10px] text-white/40 mb-0.5">{m.name}</div>
                  )}
                  <div className="text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMD(m.text) }} />
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
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
              placeholder={active === null ? 'Boss → CEO…' : `${activeName} ko bolo…`}
              className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f59e0b]"
            />
            <button onClick={send} disabled={sending} className="px-4 py-2 rounded-lg bg-[#f59e0b] text-black text-sm font-medium disabled:opacity-50">
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
