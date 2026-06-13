'use client'
import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  LayoutDashboard,
  Columns3,
  ListOrdered,
  Activity,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Crown,
  Smartphone,
  Megaphone,
  ChevronRight,
  Sparkles,
  FileText,
  Search,
  Zap,
  CalendarDays,
} from 'lucide-react'

/* ── Mock Data ─────────────────────────────────────────────── */

const TICKETS = [
  { id: 101, title: 'Research Miami real estate market', agent: 'Intake Researcher', status: 'open', priority: 'high', client: 'Ayan Agency', goal: 'Launch lead gen campaign' },
  { id: 102, title: 'Analyze competitor ad strategies', agent: 'Intake Researcher', status: 'in-progress', priority: 'high', client: 'Ayan Agency', goal: 'Launch lead gen campaign' },
  { id: 103, title: 'Draft ad creative & copy variants', agent: 'Content Creator', status: 'in-progress', priority: 'high', client: 'Ayan Agency', goal: 'Launch lead gen campaign' },
  { id: 104, title: 'Build lookalike audience segments', agent: 'Ads Runner', status: 'open', priority: 'medium', client: 'Ayan Agency', goal: 'Launch lead gen campaign' },
  { id: 105, title: 'Optimize landing page for conversion', agent: 'SEO Engine', status: 'open', priority: 'medium', client: 'Ayan Agency', goal: 'Launch lead gen campaign' },
  { id: 106, title: 'Set up conversion tracking & analytics', agent: 'Analytics Bot', status: 'open', priority: 'medium', client: 'Ayan Agency', goal: 'Launch lead gen campaign' },
  { id: 107, title: 'Research top 20 competitor ad copy', agent: 'Intake Researcher', status: 'completed', priority: 'high', client: 'Ayan Agency', goal: 'Scale content output' },
  { id: 108, title: 'Create 50 post briefs for writers', agent: 'Content Creator', status: 'in-progress', priority: 'medium', client: 'Ayan Agency', goal: 'Scale content output' },
  { id: 109, title: 'Set up programmatic SEO pages', agent: 'SEO Engine', status: 'open', priority: 'low', client: 'Ayan Agency', goal: 'Scale content output' },
  { id: 110, title: 'Build client NPS survey workflow', agent: 'Client Success', status: 'completed', priority: 'low', client: 'Ayan Agency', goal: 'Client satisfaction program' },
  { id: 111, title: 'Review ad compliance & brand safety', agent: 'Review & QC', status: 'in-progress', priority: 'high', client: 'Ayan Agency', goal: 'Launch lead gen campaign' },
  { id: 112, title: 'Generate weekly performance report', agent: 'Analytics Bot', status: 'completed', priority: 'medium', client: 'Ayan Agency', goal: 'Reporting automation' },
]

const AGENTS = [
  { name: 'CEO', icon: Crown, tickets: 3, color: 'var(--warning)' },
  { name: 'Social', icon: Smartphone, tickets: 5, color: 'var(--primary)' },
  { name: 'Ads', icon: Megaphone, tickets: 4, color: 'var(--error)' },
]

const ACTIVITY_FEED = [
  { id: 1, action: 'moved', ticket: '#103 Draft ad creative', from: 'Open', to: 'In Progress', agent: 'Content Creator', time: '2 min ago' },
  { id: 2, action: 'completed', ticket: '#107 Competitor ad copy research', from: 'In Progress', to: 'Completed', agent: 'Intake Researcher', time: '8 min ago' },
  { id: 3, action: 'created', ticket: '#113 New landing page variant', from: null, to: 'Open', agent: 'SEO Engine', time: '15 min ago' },
  { id: 4, action: 'commented', ticket: '#102 Competitor strategies', from: null, to: null, agent: 'Ads Runner', time: '22 min ago', comment: 'Need more data on Facebook spend' },
  { id: 5, action: 'moved', ticket: '#110 NPS survey workflow', from: 'In Progress', to: 'Completed', agent: 'Client Success', time: '34 min ago' },
  { id: 6, action: 'created', ticket: '#114 TikTok ad script', from: null, to: 'Open', agent: 'Content Creator', time: '1 hr ago' },
  { id: 7, action: 'moved', ticket: '#105 Landing page optimization', from: 'Open', to: 'In Progress', agent: 'SEO Engine', time: '1 hr ago' },
  { id: 8, action: 'commented', ticket: '#108 Post briefs for writers', from: null, to: null, agent: 'CEO', time: '1 hr ago', comment: 'Expand to 60 briefs by Friday' },
]

const SUGGESTIONS = [
  'Show open tickets',
  'What is the CEO working on?',
  'How many high priority tasks?',
  'Latest activity',
]

/* ── Helpers ───────────────────────────────────────────────── */

const statusIcon = (s) => {
  switch (s) {
    case 'completed': return CheckCircle2
    case 'in-progress': return Clock
    case 'open': return Circle
    default: return Circle
  }
}

const priorityLabel = (p) => {
  switch (p) {
    case 'high': return { color: 'var(--error)', bg: 'rgba(239,68,68,0.12)', label: 'High' }
    case 'medium': return { color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)', label: 'Medium' }
    case 'low': return { color: 'var(--muted-foreground)', bg: 'rgba(100,116,139,0.12)', label: 'Low' }
    default: return { color: 'var(--muted-foreground)', bg: 'rgba(100,116,139,0.12)', label: 'Low' }
  }
}

const KPI_CARDS = [
  { label: 'Total', value: 12, icon: LayoutDashboard, color: 'var(--primary)' },
  { label: 'Open', value: 5, icon: Circle, color: 'var(--warning)' },
  { label: 'In Progress', value: 4, icon: Clock, color: 'var(--primary)' },
  { label: 'Completed', value: 3, icon: CheckCircle2, color: 'var(--success)' },
]

/* ── Left Panel: Chat ──────────────────────────────────────── */

function ChatPanel({ onNavigateTab }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Hey! Ask me about tickets, agents, or activity.' },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const respond = (q) => {
    const lower = q.toLowerCase()
    let reply = ''

    if (lower.includes('open ticket')) {
      const open = TICKETS.filter(t => t.status === 'open')
      reply = `**${open.length} open tickets:**\n` + open.map(t => `• #${t.id} ${t.title} (_${t.priority} priority_)`).join('\n')
    } else if (lower.includes('ceo') || lower.includes('crown')) {
      const ceoTickets = TICKETS.filter(t => t.agent === 'CEO' || t.agent === 'Intake Researcher')
      const list = ceoTickets.slice(0, 3)
      reply = '👑 **CEO workload:**\n' + list.map(t => `• #${t.id} ${t.title} [${t.status}]`).join('\n')
    } else if (lower.includes('high priority') || lower.includes('high')) {
      const high = TICKETS.filter(t => t.priority === 'high')
      reply = `🔴 **${high.length} high-priority tickets:**\n` + high.map(t => `• #${t.id} ${t.title} (_${t.agent}_)`).join('\n')
    } else if (lower.includes('activity') || lower.includes('latest') || lower.includes('recent')) {
      const recent = ACTIVITY_FEED.slice(0, 4)
      reply = '📋 **Recent activity:**\n' + recent.map(a => `• ${a.ticket} → ${a.action} by ${a.agent} (${a.time})`).join('\n')
    } else if (lower.includes('overview') || lower.includes('kpi') || lower.includes('stats')) {
      reply = `📊 **Overview:** Total ${TICKETS.length} · Open ${TICKETS.filter(t => t.status === 'open').length} · In Progress ${TICKETS.filter(t => t.status === 'in-progress').length} · Completed ${TICKETS.filter(t => t.status === 'completed').length}`
    } else if (lower.includes('board') || lower.includes('kanban')) {
      reply = '📋 Switch to the **Board** tab to see the Kanban view.'
    } else if (lower.includes('queue') || lower.includes('agent') || lower.includes('workload')) {
      reply = '👥 **Agent workload:**\n' + AGENTS.map(a => `• ${a.icon === Crown ? '👑' : a.icon === Smartphone ? '📱' : '📢'} ${a.name}: ${a.tickets} tickets`).join('\n')
    } else if (lower.includes('help') || lower.includes('what can')) {
      reply = '💡 Try asking:\n• "Show open tickets"\n• "What is the CEO working on?"\n• "How many high priority tasks?"\n• "Latest activity"'
    } else {
      reply = '🤖 Not sure about that. Try one of the suggestions below, or ask about tickets, agents, or activity!'
    }
    return reply
  }

  const send = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim() }
    const botMsg = { role: 'assistant', text: respond(text.trim()) }
    setMessages(prev => [...prev, userMsg, botMsg])
    setInput('')
  }

  const handleSuggestion = (s) => {
    send(s)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--background)', borderRight: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={16} color="white" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>Ticket Assistant</div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Ask anything about tickets</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="text-sm max-w-[85%] rounded-xl px-4 py-2.5 leading-relaxed whitespace-pre-line"
              style={{
                background: m.role === 'user' ? 'var(--primary)' : 'var(--card)',
                color: m.role === 'user' ? '#fff' : '#CBD5E1',
                border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                fontSize: 13,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSuggestion(s)}
            className="text-xs px-3 py-1.5 rounded-full transition-colors hover:brightness-125"
            style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask about tickets..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#E2E8F0', '::placeholder': { color: 'var(--muted-foreground)' } }}
          />
          <button
            onClick={() => send(input)}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
            style={{ background: 'var(--primary)', color: 'white' }}
            disabled={!input.trim()}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Tab 1: Overview ────────────────────────────────────────── */

function OverviewTab() {
  const total = TICKETS.length
  const open = TICKETS.filter(t => t.status === 'open').length
  const inProg = TICKETS.filter(t => t.status === 'in-progress').length
  const completed = TICKETS.filter(t => t.status === 'completed').length

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  // Donut-like progress ring using conic gradient
  const ringStyle = {
    background: `conic-gradient(var(--success) ${progressPercent}%, var(--border) ${progressPercent}%)`,
  }

  return (
    <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div
              className="rounded-lg flex items-center justify-center"
              style={{ width: 40, height: 40, background: `${kpi.color}18` }}
            >
              <kpi.icon size={18} color={kpi.color} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{kpi.label}</div>
              <div className="text-2xl font-bold" style={{ color: '#E2E8F0' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress chart */}
      <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>Completion Progress</span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{completed}/{total} tickets done</span>
        </div>
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative" style={{ width: 80, height: 80 }}>
            <div className="absolute inset-0 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="absolute inset-0 rounded-full" style={ringStyle} />
            <div className="absolute inset-1 rounded-full flex items-center justify-center" style={{ background: 'var(--card)' }}>
              <span className="text-lg font-bold" style={{ color: '#E2E8F0' }}>{progressPercent}%</span>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--warning)' }} />
              <span style={{ color: 'var(--muted-foreground)' }}>Open — {open}</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary)' }} />
              <span style={{ color: 'var(--muted-foreground)' }}>In Progress — {inProg}</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--success)' }} />
              <span style={{ color: 'var(--muted-foreground)' }}>Completed — {completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>Priority Breakdown</span>
        <div className="mt-3 space-y-2">
          {[
            { label: 'High', count: TICKETS.filter(t => t.priority === 'high').length, color: 'var(--error)' },
            { label: 'Medium', count: TICKETS.filter(t => t.priority === 'medium').length, color: 'var(--warning)' },
            { label: 'Low', count: TICKETS.filter(t => t.priority === 'low').length, color: 'var(--muted-foreground)' },
          ].map((p) => (
            <div key={p.label} className="flex items-center gap-3">
              <span className="text-xs w-12" style={{ color: 'var(--muted-foreground)' }}>{p.label}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(p.count / TICKETS.length) * 100}%`, background: p.color }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: '#E2E8F0' }}>{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Tab 2: Board (Kanban) ──────────────────────────────────── */

function BoardTab() {
  const columns = [
    { key: 'open', label: 'Open', color: 'var(--warning)' },
    { key: 'in-progress', label: 'In Progress', color: 'var(--primary)' },
    { key: 'completed', label: 'Completed', color: 'var(--success)' },
  ]

  return (
    <div className="p-4 flex gap-3 overflow-x-auto" style={{ maxHeight: 'calc(100vh - 120px)', height: '100%' }}>
      {columns.map((col) => {
        const items = TICKETS.filter(t => t.status === col.key)
        return (
          <div
            key={col.key}
            className="flex-1 min-w-[240px] rounded-xl p-3 space-y-2 overflow-y-auto"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>{col.label}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${col.color}18`, color: col.color }}>
                {items.length}
              </span>
            </div>

            {/* Cards */}
            {items.map((ticket) => {
              const pri = priorityLabel(ticket.priority)
              const SIcon = statusIcon(ticket.status)
              return (
                <div
                  key={ticket.id}
                  className="rounded-xl p-3 space-y-2 cursor-pointer transition-colors hover:brightness-110"
                  style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
                >
                  {/* Priority bar */}
                  {ticket.priority === 'high' && (
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--error)', width: '40%' }} />
                  )}
                  {ticket.priority === 'medium' && (
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--warning)', width: '25%' }} />
                  )}

                  {/* Title & ID */}
                  <div className="text-sm font-medium leading-snug" style={{ color: '#E2E8F0' }}>
                    #{ticket.id} {ticket.title}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Agent icon */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="rounded-full flex items-center justify-center"
                        style={{ width: 20, height: 20, background: 'var(--border)' }}
                      >
                        <User size={10} color="var(--muted-foreground)" />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{ticket.agent}</span>
                    </div>
                    {/* Priority badge */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: pri.bg, color: pri.color }}
                    >
                      {pri.label}
                    </span>
                  </div>
                </div>
              )
            })}

            {items.length === 0 && (
              <div className="text-xs text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
                No tickets
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Tab 3: Queue ────────────────────────────────────────────── */

function QueueTab() {
  return (
    <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Agent</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Open</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>In Progress</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Completed</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((agent) => {
              const agentTickets = TICKETS.filter(t => t.agent.includes(agent.name) ||
                (agent.name === 'CEO' && t.agent === 'Intake Researcher'))
              const open = agentTickets.filter(t => t.status === 'open').length
              const inProg = agentTickets.filter(t => t.status === 'in-progress').length
              const completed = agentTickets.filter(t => t.status === 'completed').length
              const AgentIcon = agent.icon
              return (
                <tr key={agent.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg flex items-center justify-center" style={{ width: 28, height: 28, background: `${agent.color}18` }}>
                        <AgentIcon size={14} color={agent.color} />
                      </div>
                      <span className="font-medium" style={{ color: '#E2E8F0' }}>{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--warning)' }}>{open}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--primary)' }}>{inProg}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--success)' }}>{completed}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#E2E8F0' }}>{agent.tickets}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {AGENTS.map((agent) => {
          const AgentIcon = agent.icon
          return (
            <div
              key={agent.name}
              className="rounded-xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AgentIcon size={16} color={agent.color} />
                <span className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{agent.name}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: '#E2E8F0' }}>{agent.tickets}</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>assigned tickets</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Tab 4: Activity ────────────────────────────────────────── */

function ActivityTab() {
  const actionIcon = (action) => {
    switch (action) {
      case 'moved': return { icon: ChevronRight, color: 'var(--primary)' }
      case 'completed': return { icon: CheckCircle2, color: 'var(--success)' }
      case 'created': return { icon: Sparkles, color: 'var(--primary)' }
      case 'commented': return { icon: MessageSquare, color: 'var(--warning)' }
      default: return { icon: Circle, color: 'var(--muted-foreground)' }
    }
  }

  return (
    <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="space-y-1">
        {ACTIVITY_FEED.map((a) => {
          const { icon: AIcon, color } = actionIcon(a.action)
          return (
            <div
              key={a.id}
              className="rounded-xl px-4 py-3 flex items-start gap-3 transition-colors"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', marginBottom: 6 }}
            >
              <div
                className="rounded-full flex items-center justify-center mt-0.5 shrink-0"
                style={{ width: 28, height: 28, background: `${color}18` }}
              >
                <AIcon size={14} color={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-snug" style={{ color: '#CBD5E1' }}>
                  <span className="font-medium" style={{ color: '#E2E8F0' }}>{a.ticket}</span>
                  {' '}
                  <span style={{ color: color }}>
                    {a.action}
                  </span>
                  {a.from && a.to && (
                    <span> from <span style={{ color: 'var(--muted-foreground)' }}>{a.from}</span> to <span style={{ color }}>{a.to}</span></span>
                  )}
                  {a.action === 'created' && a.to && (
                    <span> in <span style={{ color }}>{a.to}</span></span>
                  )}
                </div>
                {a.comment && (
                  <div className="text-xs mt-1 italic" style={{ color: 'var(--muted-foreground)' }}>
                    "{a.comment}"
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{a.agent}</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{a.time}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Right Pane Tabs ────────────────────────────────────────── */

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'board', label: 'Board', icon: Columns3 },
  { key: 'queue', label: 'Queue', icon: ListOrdered },
  { key: 'activity', label: 'Activity', icon: Activity },
]

function RightPane({ activeTab, setActiveTab }) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--background)' }}>
      {/* Tab bar */}
      <div className="flex items-center px-4 pt-4 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key
          const TabIcon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative"
              style={{
                color: active ? '#E2E8F0' : 'var(--muted-foreground)',
                background: active ? 'var(--card)' : 'transparent',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                borderBottom: active ? '1px solid var(--card)' : '1px solid transparent',
                marginBottom: -1,
              }}
            >
              <TabIcon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'board' && <BoardTab />}
        {activeTab === 'queue' && <QueueTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="flex h-full w-full" style={{ background: 'var(--background)' }}>
      {/* Left: Chat (35%) */}
      <div className="shrink-0" style={{ width: '35%', minWidth: 320, maxWidth: 440 }}>
        <ChatPanel />
      </div>

      {/* Right: Dashboard (65%) */}
      <div className="flex-1">
        <RightPane activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}
