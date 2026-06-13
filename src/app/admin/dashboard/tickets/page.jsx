'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, CircleDot, Plus, X, ChevronRight, Terminal as TerminalIcon, Send, AlertTriangle } from 'lucide-react'
import { useCompany } from '@/lib/client-context'

/* ═══════════════════════════════════════════════
   Ticket Hub — Paperclip 2-Column Issue View
   Source: github.com/paperclipai/paperclip/ui/src/pages/Issues.tsx
   ═══════════════════════════════════════════════ */

/* ─── Mock Data ─── */
const TICKETS = [
  { id: 101, title: 'Research Miami real estate market', agent: 'Intake Researcher', status: 'completed', priority: 'high', goal: 'Launch lead gen campaign', budget: { used: 4230, limit: 5000 }, messages: [
    { id: 1, sender: 'CEO Console', type: 'agent-ceo', msg: 'Assigned to Intake Researcher. Target: identify top 50 luxury real estate agencies in Miami.', time: '09:30' },
    { id: 2, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Checked out. Starting research phase.', time: '09:31', think: 'Querying Google Maps + LinkedIn for Miami luxury agencies with $1M+ transaction volume.' },
    { id: 3, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Found 247 listings. Filtering to >$1M volume...', time: '09:42' },
    { id: 4, sender: 'CTO Router', type: 'agent-cto', msg: 'Budget check: 4,230 tokens (84.6%). Within limit.', time: '09:45' },
    { id: 5, sender: 'Intake Researcher', type: 'agent-worker', msg: '✅ Done! Found 52 qualifying agencies with verified contacts.', time: '09:50' },
  ]},
  { id: 102, title: 'Analyze competitor ad strategies', agent: 'Intake Researcher', status: 'in-progress', priority: 'high', goal: 'Launch lead gen campaign', budget: { used: 2100, limit: 5000 }, messages: [
    { id: 1, sender: 'CEO Console', type: 'agent-ceo', msg: 'Research top 10 competitor Facebook ad libraries.', time: '10:00' },
    { id: 2, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Browsing Facebook Ad Library for competitor ad creatives.', time: '10:02' },
    { id: 3, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Downloading ad copy from 6 competitors for analysis.', time: '10:10', think: 'Looking at engagement metrics (likes, shares, comments) and CTAs used.' },
  ]},
  { id: 103, title: 'Draft ad creative & copy variants', agent: 'Content Creator', status: 'in-progress', priority: 'high', goal: 'Launch lead gen campaign', budget: { used: 3100, limit: 5000 }, messages: [
    { id: 1, sender: 'CEO Console', type: 'agent-ceo', msg: '8 ad variants needed: 4 headlines x 2 CTAs.', time: '10:30' },
    { id: 2, sender: 'Content Creator', type: 'agent-worker', msg: 'Generating headline variants using AIDA framework.', time: '10:32', think: 'Headline 1: Emotional appeal. Headline 2: Data-driven. Headline 3: FOMO. Headline 4: Curiosity gap.' },
  ]},
  { id: 104, title: 'Build lookalike audience segments', agent: 'Ads Manager', status: 'open', priority: 'medium', goal: 'Launch lead gen campaign', budget: { used: 0, limit: 4000 }, messages: [
    { id: 1, sender: 'CEO Console', type: 'agent-ceo', msg: 'When ads go live, create Meta lookalike audiences from our best leads.', time: '11:00' },
  ]},
  { id: 105, title: 'Set up SEO keyword clusters', agent: 'SEO Optimizer', status: 'open', priority: 'medium', goal: 'Organic growth Q3', budget: { used: 0, limit: 3000 }, messages: [
    { id: 1, sender: 'CEO Console', type: 'agent-ceo', msg: 'Build 5 keyword clusters for the Miami real estate blog.', time: '12:00' },
  ]},
  { id: 106, title: 'Weekly analytics report', agent: 'Analytics Engine', status: 'completed', priority: 'low', goal: 'Reporting', budget: { used: 890, limit: 2000 }, messages: [
    { id: 1, sender: 'CEO Console', type: 'agent-ceo', msg: 'Pull this week\'s metrics: leads, conversions, spend, ROI.', time: '08:00' },
    { id: 2, sender: 'Analytics Engine', type: 'agent-worker', msg: 'Report generated. 47 leads, 12 conversions, $2,340 spend, ROI 85%.', time: '08:15' },
  ]},
]

const PRIORITY_COLORS = { high: 'var(--error)', medium: 'var(--warning)', low: '#6B7280', critical: '#DC2626' }
const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Completed', 'Blocked']

const LOGS = [
  { ts: Date.now() - 180000, type: 'info', msg: '[TICKET-ENGINE] Initializing ticket queue...' },
  { ts: Date.now() - 179000, type: 'info', msg: '[CEO] Fetched 6 pending tickets for active workspace' },
  { ts: Date.now() - 178000, type: 'highlight', msg: '[CEO] Ticket #101 marked as completed' },
  { ts: Date.now() - 150000, type: 'info', msg: '[WORKER] Intake Researcher progress on #102: 45% complete' },
  { ts: Date.now() - 120000, type: 'info', msg: '[WORKER] Content Creator drafting ad variant 3/8 for #103' },
  { ts: Date.now() - 90000, type: 'warn', msg: '[BUDGET] Ticket #103 at 62% token budget' },
  { ts: Date.now() - 60000, type: 'info', msg: '[HEARTBEAT] Checking for new assignments...' },
  { ts: Date.now() - 30000, type: 'info', msg: '[TICKET-ENGINE] Queue healthy. 0 stalled tickets.' },
]

/* ─── Think Block (Paperclip Collapsible) ─── */
function ThinkBlock({ content }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 border border-border/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground hover:bg-accent/30 transition-colors bg-background/50"
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span>Chain of thought</span>
      </button>
      {open && (
        <div className="px-3 py-2 text-[12px] leading-relaxed font-mono text-muted-foreground bg-muted/30 border-t border-border/60">
          {content}
        </div>
      )}
    </div>
  )
}

/* ─── Status badge ─── */
function StatusBadge({ status }) {
  const colors = {
    completed: 'text-green-400 bg-green-500/10 border-green-500/20',
    'in-progress': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    open: 'text-muted-foreground bg-muted/30 border-border',
    blocked: 'text-red-400 bg-red-500/10 border-red-500/20',
  }
  const labels = { completed: 'Completed', 'in-progress': 'In Progress', open: 'Open', blocked: 'Blocked' }
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium border ${colors[status] || colors.open}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-green-400' : status === 'in-progress' ? 'bg-yellow-400' : status === 'blocked' ? 'bg-red-400' : 'bg-muted-foreground'}`} />
      {labels[status] || status}
    </span>
  )
}

/* ─── Budget Progress Bar ─── */
function BudgetBar({ used, limit }) {
  const pct = Math.min((used / limit) * 100, 100)
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1.5">
      <div className="flex-1 h-1.5 bg-muted/50 overflow-hidden">
        <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums shrink-0">{used}k/{limit}k</span>
    </div>
  )
}

/* ─── Ticket Row (left column) ─── */
function TicketRow({ ticket, isSelected, onClick }) {
  const msgCount = ticket.messages?.length || 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex gap-2.5 px-3 py-2.5 transition-colors border-l-2 ${
        isSelected
          ? 'bg-accent/30 border-l-blue-500'
          : 'border-l-transparent hover:bg-accent/20'
      }`}
    >
      {/* Priority bar */}
      <div className="w-0.5 shrink-0 rounded-full mt-0.5" style={{ background: PRIORITY_COLORS[ticket.priority] || '#6B7280' }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">#{ticket.id}</span>
          <span className="text-[13px] font-medium text-foreground truncate">{ticket.title}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <StatusBadge status={ticket.status} />
          <span>·</span>
          <span>{ticket.agent}</span>
          <span>·</span>
          <span>{msgCount} msg</span>
        </div>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════
   Main Ticket Hub Page
   ═══════════════════════════════════════════════ */
export default function TicketsHub() {
  const { selectedCompany } = useCompany()
  const [selectedTicket, setSelectedTicket] = useState(TICKETS[0])
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showTerminal, setShowTerminal] = useState(true)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const chatEndRef = useRef(null)
  const searchRef = useRef(null)

  // When ticket selected, load its messages
  useEffect(() => {
    if (selectedTicket) {
      setChat(selectedTicket.messages)
    }
  }, [selectedTicket])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return TICKETS.filter(t => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.agent.toLowerCase().includes(q) && !String(t.id).includes(q)) return false
      }
      // Status filter
      if (statusFilter !== 'All') {
        const map = { 'Open': 'open', 'In Progress': 'in-progress', 'Completed': 'completed', 'Blocked': 'blocked' }
        if (t.status !== map[statusFilter]) return false
      }
      return true
    })
  }, [searchQuery, statusFilter])

  // Count active
  const activeCount = TICKETS.filter(t => t.status === 'open' || t.status === 'in-progress').length
  const completedCount = TICKETS.filter(t => t.status === 'completed').length
  const prefix = selectedCompany?.issuePrefix || 'AA'

  const handleSend = () => {
    if (!input.trim() || !selectedTicket) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    setChat(prev => [...prev, {
      id: Date.now(),
      sender: 'You',
      type: 'user',
      msg: input.trim(),
      time: timeStr,
    }])
    setInput('')

    // Simulate agent reply
    setTimeout(() => {
      const replyTime = new Date()
      setChat(prev => [...prev, {
        id: Date.now() + 1,
        sender: selectedTicket.agent,
        type: 'agent-worker',
        msg: 'Acknowledged. Adding to ticket thread. Processing your request...',
        time: replyTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        think: `Context: user message in ticket #${selectedTicket.id}. Routing to relevant processing pipeline.`,
      }])
    }, 1200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Empty state ───
  if (TICKETS.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <CircleDot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No tickets yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first ticket to get started.</p>
          <button
            onClick={() => setShowNewTicket(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border hover:bg-accent/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Ticket
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* ─── LEFT: Ticket List ─── */}
      <div className="w-[380px] shrink-0 border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 h-12 shrink-0 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Tickets</h2>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5">{TICKETS.length}</span>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="inline-flex items-center justify-center size-7 hover:bg-accent/50 transition-colors"
            aria-label="New ticket"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full h-8 pl-8 pr-3 text-[12px] bg-background border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-1 overflow-x-auto scrollbar-auto-hide">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`shrink-0 px-2 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto scrollbar-auto-hide py-1">
          {filteredTickets.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">No tickets match your search</p>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('All') }}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredTickets.map(t => (
              <TicketRow
                key={t.id}
                ticket={t}
                isSelected={selectedTicket?.id === t.id}
                onClick={() => setSelectedTicket(t)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 h-8 shrink-0 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{activeCount} active</span>
          <span>{completedCount} completed</span>
        </div>
      </div>

      {/* ─── RIGHT: Chat Thread + Terminal ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <div className="px-4 h-12 shrink-0 border-b border-border flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground truncate">
                    <span className="text-muted-foreground font-normal">#{selectedTicket.id}</span> {selectedTicket.title}
                  </span>
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span>{selectedTicket.agent}</span>
                  <span>·</span>
                  <span>{selectedTicket.goal}</span>
                  <span>·</span>
                  <span className="tabular-nums">⚡ {selectedTicket.budget.used}k/{selectedTicket.budget.limit}k</span>
                </div>
              </div>
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium transition-colors border ${
                  showTerminal ? 'bg-accent text-foreground border-border' : 'text-muted-foreground border-border hover:bg-accent/30'
                }`}
              >
                <TerminalIcon className="h-3 w-3" />
                Log
              </button>
            </div>

            {/* Content area: Chat + Terminal side by side */}
            <div className="flex-1 flex overflow-hidden">
              {/* Chat Thread */}
              <div className="flex-[2] flex flex-col overflow-hidden min-w-0">
                <div className="flex-1 overflow-y-auto scrollbar-auto-hide px-4 py-3 space-y-3">
                  {chat.map((b) => {
                    const isUser = b.type === 'user'
                    const isCEO = b.type === 'agent-ceo'
                    const isCTO = b.type === 'agent-cto'

                    return (
                      <div
                        key={b.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} max-w-[85%] ${isUser ? 'ml-auto' : ''}`}
                      >
                        <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : isCEO
                              ? 'bg-purple-500/10 border border-purple-500/20 text-foreground'
                              : isCTO
                                ? 'bg-cyan-500/10 border border-cyan-500/20 text-foreground'
                                : 'bg-muted/30 border border-border text-foreground'
                        }`}>
                          {!isUser && (
                            <div className={`text-[10px] font-semibold mb-1 ${
                              isCEO ? 'text-purple-400' : isCTO ? 'text-cyan-400' : 'text-muted-foreground'
                            }`}>
                              {b.sender}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{b.msg}</div>
                          {b.think && <ThinkBlock content={b.think} />}
                          <div className={`text-[10px] mt-1.5 ${isUser ? 'text-blue-200' : 'text-muted-foreground/60'}`}>
                            {b.time}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="px-4 py-3 border-t border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${selectedTicket.agent}...`}
                      className="flex-1 h-9 px-3 text-[12px] bg-background border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`inline-flex items-center justify-center h-9 px-3 transition-colors ${
                        input.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-500'
                          : 'bg-muted/40 text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Terminal Panel */}
              {showTerminal && (
                <div className="w-[340px] shrink-0 border-l border-border flex flex-col bg-[var(--background)]">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-border/40 bg-[var(--background)]">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">Execution Log</span>
                      <span className="text-[9px] text-muted-foreground/50">— {LOGS.length} events</span>
                    </div>
                    <button
                      onClick={() => setShowTerminal(false)}
                      className="text-muted-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Terminal Content */}
                  <div className="flex-1 overflow-y-auto scrollbar-auto-hide p-3 space-y-1 font-mono text-[11px] leading-relaxed">
                    {LOGS.map((log, i) => (
                      <div
                        key={i}
                        className={`${
                          log.type === 'warn' ? 'text-yellow-400' :
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'highlight' ? 'text-purple-400' :
                          'text-green-400/80'
                        }`}
                      >
                        <span className="text-muted-foreground/50">[{new Date(log.ts).toLocaleTimeString('en-US', { hour12: false })}]</span>{' '}
                        {log.msg}
                      </div>
                    ))}
                  </div>

                  {/* Terminal Status */}
                  <div className="px-3 h-7 shrink-0 border-t border-border/40 bg-[var(--background)] flex items-center text-[10px] text-green-400/60 font-mono">
                    <span className="relative flex h-1.5 w-1.5 mr-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                    </span>
                    Running · Polling every 15s
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state — no ticket selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <CircleDot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Select a ticket</p>
              <p className="text-xs text-muted-foreground mt-1">Choose a ticket from the left to view its thread</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── New Ticket Dialog ─── */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50">
          <div className="w-[480px] bg-background border border-border shadow-xl">
            <div className="flex items-center justify-between px-4 h-12 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">New Ticket</h3>
              <button onClick={() => setShowNewTicket(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Title</label>
                <input
                  placeholder="What needs to be done?"
                  className="w-full h-9 px-3 text-[13px] bg-background border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring transition-colors"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Agent</label>
                  <select className="w-full h-9 px-3 text-[13px] bg-background border border-border text-foreground outline-none focus:border-ring">
                    <option>Intake Researcher</option>
                    <option>Content Creator</option>
                    <option>SEO Optimizer</option>
                    <option>Ads Manager</option>
                    <option>Analytics Engine</option>
                    <option>Sales Closer</option>
                    <option>Client Success</option>
                    <option>Review & QC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Priority</label>
                  <select className="w-full h-9 px-3 text-[13px] bg-background border border-border text-foreground outline-none focus:border-ring">
                    <option>Low</option>
                    <option selected>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the task..."
                  className="w-full px-3 py-2 text-[13px] bg-background border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 h-12 border-t border-border">
              <button
                onClick={() => setShowNewTicket(false)}
                className="px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewTicket(false)}
                className="px-4 py-1.5 text-[12px] font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
