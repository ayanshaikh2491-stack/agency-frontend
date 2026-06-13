'use client'
import { useState } from 'react'
import {
  MessageCircle, Send, Clock, Users, Search, Filter,
  Activity, Zap, BarChart3, Globe, User, Bot,
  AlertCircle, CheckCircle, Calendar, ChevronRight,
  Sparkles, List, Plus, ArrowUpRight, X
} from 'lucide-react'

// ── Mock Data ──────────────────────────────────────────────────────
const AGENTS = [
  { id: 'ceo',    label: 'CEO',     emoji: '👑', color: 'text-yellow-400',  bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
  { id: 'social', label: 'Social',  emoji: '📱', color: 'text-blue-400',    bg: 'bg-blue-500/10',   dot: 'bg-blue-400' },
  { id: 'ads',    label: 'Ads',     emoji: '📢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
]

const EVENT_TYPES = [
  'Lead found', 'Campaign launched', 'Post scheduled', 'Report generated',
  'Budget alert', 'Account connected', 'Goal completed', 'Routine triggered',
  'Error alert', 'Ticket assigned',
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEvents(count) {
  const events = []
  const times = ['2m ago','5m ago','8m ago','12m ago','15m ago','18m ago','22m ago','30m ago','42m ago','55m ago','1h ago','1h ago','1.5h ago','2h ago','2.5h ago','3h ago','4h ago','5h ago','6h ago','8h ago','10h ago','Yesterday 4pm','Yesterday 2pm','Yesterday 11am','Yesterday 9am','Yesterday 8am','Mon 3pm','Mon 12pm','Mon 9am','Mon 7am']
  const descriptions = {
    'Lead found':        ['New lead from cold outreach','High-intent lead from LinkedIn','Referral lead captured','Lead from website form','Lead from ad campaign'],
    'Campaign launched': ['Facebook retargeting campaign live','Google Ads campaign started','LinkedIn sponsored content live','Email drip campaign sent'],
    'Post scheduled':    ['Instagram post queued','Twitter thread scheduled','LinkedIn article queued','Facebook post set for tomorrow'],
    'Report generated':  ['Weekly analytics report ready','Monthly performance report','Ad spend report generated','Email engagement report'],
    'Budget alert':      ['Daily ad spend exceeded limit','Monthly budget 80% used','Campaign budget depleted','Unusual spend spike detected'],
    'Account connected': ['Instagram account linked','Twitter profile connected','LinkedIn page authorized','Facebook page integrated'],
    'Goal completed':    ['Weekly lead target hit','Monthly revenue goal reached','Engagement milestone achieved','Conversion rate goal met'],
    'Routine triggered': ['Morning data sync completed','Evening backup routine','Health check routine passed','Cache refresh cycle done'],
    'Error alert':       ['API rate limit hit','Auth token expired','Webhook delivery failed','Database connection timeout'],
    'Ticket assigned':   ['Support ticket #3421 opened','Bug report #8912 filed','Feature request #567 queued','Client escalation #104 assigned'],
  }
  for (let i = 0; i < count; i++) {
    const agent = pickRandom(AGENTS)
    const type = pickRandom(EVENT_TYPES)
    const desc = pickRandom(descriptions[type])
    events.push({
      id: `evt-${i}-${Date.now()}`,
      agent,
      type,
      desc,
      time: times[i % times.length],
      isError: type === 'Error alert',
      isHighlight: type === 'Goal completed' || type === 'Lead found',
    })
  }
  return events
}

const ALL_EVENTS = generateEvents(18)

// ── Tab Headers ────────────────────────────────────────────────────
const TABS = [
  { id: 'feed',    label: 'Live Feed',   icon: Activity },
  { id: 'timeline',label: 'Timeline',    icon: Clock },
  { id: 'agent',   label: 'Per Agent',   icon: Users },
  { id: 'search',  label: 'Search',      icon: Search },
]

// ── Sub-components ─────────────────────────────────────────────────

function AgentBadge({ agent, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-10 h-10 text-lg' : 'w-8 h-8 text-sm'
  return (
    <div className={`flex items-center justify-center rounded-full ${agent.bg} ${sz} shrink-0`} title={agent.label}>
      <span className={agent.color}>{agent.emoji}</span>
    </div>
  )
}

function EventRow({ event }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-colors ${
      event.isError
        ? 'bg-red-500/5 border border-red-500/10'
        : 'hover:bg-white/[0.02]'
    }`}>
      <div className="relative shrink-0 mt-1">
        <AgentBadge agent={event.agent} />
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--background)] ${event.agent.dot}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${event.agent.color}`}>{event.agent.emoji} {event.agent.label}</span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-slate-200 text-sm font-medium">{event.type}</span>
          {event.isError && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">ERROR</span>}
          {event.isHighlight && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">HIGHLIGHT</span>}
        </div>
        <p className="text-slate-400 text-xs mt-0.5 truncate">{event.desc}</p>
      </div>
      <span className="text-slate-500 text-xs shrink-0 mt-1">{event.time}</span>
    </div>
  )
}

// ── Left: Chat Panel ───────────────────────────────────────────────
function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "👋 Hi! I'm your Activity Assistant. Ask me anything about what's happening in your agency." },
  ])
  const [input, setInput] = useState('')

  const suggestions = [
    { label: "Today's events", query: "What happened today?" },
    { label: 'Recent errors', query: "Show me recent errors" },
    { label: 'Agent activity', query: "What are my agents doing?" },
    { label: 'All activity', query: "Show all activity" },
  ]

  function handleSend(text) {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    // Mock AI response
    setTimeout(() => {
      const responses = {
        "What happened today?": "Here's a summary of today's activity:\n• 12 leads found by Intake Researcher\n• 3 campaigns launched by Ads Agent\n• 8 posts scheduled by Social Agent\n• 1 budget alert triggered",
        "Show me recent errors": "Recent issues detected:\n• API rate limit hit (5m ago)\n• Auth token expired (18m ago)\n• Database connection timeout (2h ago)\n\nAll errors have been automatically retried.",
        "What are my agents doing?": "**CEO Agent** — Reviewing weekly metrics & generating reports\n**Social Agent** — Scheduling 5 Instagram posts & monitoring engagement\n**Ads Agent** — A/B testing 2 ad creatives & optimizing budget allocation",
        "Show all activity": "Total events today: 47\n• CEO: 12 decisions & reports\n• Social: 18 posts & engagements\n• Ads: 17 campaigns & alerts\n\nNo critical issues pending.",
      }
      const reply = responses[text] || responses["Show all activity"]
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    }, 800)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--border)]">
        <MessageCircle className="w-5 h-5 text-purple-400" />
        <h2 className="text-slate-200 font-semibold text-base">Activity Assistant</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin max-h-[420px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
              m.role === 'user'
                ? 'bg-purple-600/20 border border-purple-500/20 text-slate-200'
                : 'bg-[var(--card)] border border-[var(--border)] text-slate-300'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {suggestions.map(s => (
          <button
            key={s.label}
            onClick={() => handleSend(s.query)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-slate-400 hover:border-purple-500/40 hover:text-purple-400 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 focus-within:border-purple-500/40 transition-colors">
          <input
            type="text"
            placeholder="Ask about activity..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(input) }}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="shrink-0 p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab 1: Live Feed ───────────────────────────────────────────────
function LiveFeed() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin space-y-1 pr-2">
      {ALL_EVENTS.map(evt => (
        <EventRow key={evt.id} event={evt} />
      ))}
    </div>
  )
}

// ── Tab 2: Timeline ────────────────────────────────────────────────
function TimelineView() {
  const groups = [
    {
      label: 'Today',
      events: ALL_EVENTS.filter(e => ['2m ago','5m ago','8m ago','12m ago','15m ago','18m ago','22m ago','30m ago','42m ago','55m ago','1h ago','1h ago','1.5h ago','2h ago','2.5h ago','3h ago','4h ago','5h ago','6h ago'].includes(e.time)),
    },
    {
      label: 'Yesterday',
      events: ALL_EVENTS.filter(e => e.time.startsWith('Yesterday')),
    },
    {
      label: 'This Week',
      events: ALL_EVENTS.filter(e => e.time.startsWith('Mon')),
    },
  ]

  // If groups have no events, redistribute
  if (groups[0].events.length < 5) {
    // Reuse all events - smarter split
    const half = Math.ceil(ALL_EVENTS.length / 2)
    groups[0].events = ALL_EVENTS.slice(0, half)
    groups[1].events = ALL_EVENTS.slice(half)
    groups[2].events = []
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin space-y-6 pr-2">
      {groups.filter(g => g.events.length > 0).map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[var(--background)] z-10 py-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-300">{group.label}</h3>
            <span className="text-xs text-slate-600">({group.events.length} events)</span>
          </div>
          <div className="relative pl-5 border-l border-[var(--border)] space-y-2 ml-2">
            {group.events.map(evt => (
              <div key={evt.id} className="relative">
                <span className={`absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full border-2 border-[var(--background)] ${evt.agent.dot}`} />
                <EventRow event={evt} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab 3: Per Agent ───────────────────────────────────────────────
function PerAgentView() {
  const sections = AGENTS.map(agent => ({
    ...agent,
    events: ALL_EVENTS.filter(e => e.agent.id === agent.id).slice(0, 5),
  }))

  return (
    <div className="h-full overflow-y-auto scrollbar-thin space-y-5 pr-2">
      {sections.map(section => (
        <div key={section.id}>
          <div className="flex items-center gap-2.5 mb-2 sticky top-0 bg-[var(--background)] z-10 py-2">
            <span className="text-lg">{section.emoji}</span>
            <h3 className={`text-sm font-semibold ${section.color}`}>{section.label} Agent</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500">{section.events.length} events</span>
          </div>
          <div className="space-y-1">
            {section.events.length === 0 && (
              <p className="text-xs text-slate-600 px-4 py-2">No recent events for this agent.</p>
            )}
            {section.events.map(evt => (
              <EventRow key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab 4: Search ──────────────────────────────────────────────────
function SearchView() {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  const filtered = ALL_EVENTS.filter(evt => {
    if (filter !== 'All' && evt.agent.id !== filter) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        evt.type.toLowerCase().includes(q) ||
        evt.desc.toLowerCase().includes(q) ||
        evt.agent.label.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search events..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-lg pl-9 pr-8 py-2 text-sm text-slate-200 outline-none focus:border-purple-500/40 transition-colors cursor-pointer"
          >
            <option value="All">All Agents</option>
            {AGENTS.map(a => (
              <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none rotate-90" />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 pt-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No events match your search</p>
            <p className="text-xs text-slate-600 mt-1">Try a different filter or search term</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            {filtered.map(evt => (
              <EventRow key={evt.id} event={evt} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('feed')

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Top bar */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
        <Activity className="w-5 h-5 text-purple-400" />
        <h1 className="text-slate-200 font-semibold text-lg">Activity Intelligence</h1>
        <span className="text-xs text-slate-500 ml-auto">Live · {ALL_EVENTS.length} events today</span>
      </div>

      {/* Body: Chat left, Dashboard right */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Column: Chat ── */}
        <div className="w-[35%] min-w-[320px] border-r border-[var(--border)] bg-[var(--background)] flex flex-col">
          <ChatPanel />
        </div>

        {/* ── Right Column: Tabs Dashboard ── */}
        <div className="flex-1 flex flex-col bg-[var(--background)] overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center border-b border-[var(--border)] bg-[var(--background)] shrink-0">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-purple-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden p-4 bg-[var(--background)]">
            {activeTab === 'feed' && <LiveFeed />}
            {activeTab === 'timeline' && <TimelineView />}
            {activeTab === 'agent' && <PerAgentView />}
            {activeTab === 'search' && <SearchView />}
          </div>
        </div>
      </div>
    </div>
  )
}
