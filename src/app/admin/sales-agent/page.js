'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Bot, MessageSquare, Send, Sparkles, Zap, CheckCircle2,
  Activity, BarChart3, Users, Clock, DollarSign, TrendingUp,
  PieChart, AlertCircle, Loader2, RefreshCw, ChevronDown,
  Plus, Search, Filter, Download, ExternalLink,
  Columns3, Calendar, Mail, Phone, Globe, Target,
  Play, Pause, GripVertical, UserPlus, ArrowUpRight,
  Briefcase, Percent,
} from 'lucide-react'
import PageShell from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/* ─── API Base ─── */
const API = '/api/sales-agent'

/* ─── Stage Config ─── */
const STAGE_CONFIG = {
  lead: { label: 'Lead', color: 'text-purple-500', bg: 'bg-purple-500/10', dot: 'bg-purple-500', border: 'border-purple-500/30' },
  contacted: { label: 'Contacted', color: 'text-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  meeting: { label: 'Meeting', color: 'text-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  proposal: { label: 'Proposal', color: 'text-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', border: 'border-orange-500/30' },
  negotiation: { label: 'Negotiation', color: 'text-red-500', bg: 'bg-red-500/10', dot: 'bg-red-500', border: 'border-red-500/30' },
  closed: { label: 'Closed Won', color: 'text-emerald-500', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
}

/* ─── Tabs ─── */
const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pipeline', label: 'Pipeline', icon: Columns3 },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'outbound', label: 'Outbound', icon: Mail },
]

/* ─── Suggestions ─── */
const SUGGESTIONS = [
  { label: '🔍 Generate 5 leads', prompt: 'Generate 5 new leads in SaaS industry in India' },
  { label: '📊 Show pipeline', prompt: 'Show me my pipeline' },
  { label: '📅 Schedule a meeting', prompt: 'Schedule a meeting for tomorrow' },
  { label: '💰 Revenue forecast', prompt: 'What is my revenue forecast?' },
  { label: '📧 Launch campaign', prompt: 'Launch a cold email campaign' },
]

/* ═══════════════════════════════════════════════
   Sales Agent Command Center
   ═══════════════════════════════════════════════ */
export default function SalesAgentPage() {
  const [activeTab, setActiveTab] = useState('chat')
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState(null)
  const [pipelineData, setPipelineData] = useState(null)
  const [leadsList, setLeadsList] = useState([])
  const [meetingsList, setMeetingsList] = useState([])
  const [financeData, setFinanceData] = useState(null)
  const [campaignsList, setCampaignsList] = useState([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  /* ─── Fetch stats on mount ─── */
  useEffect(() => {
    fetch(`${API}/stats`)
      .then(r => r.json())
      .then(d => setStats(d?.data))
      .catch(() => {})
  }, [])

  /* ─── Fetch tab data on switch ─── */
  useEffect(() => {
    setLoading(true)
    if (activeTab === 'overview') {
      fetch(`${API}/stats`).then(r => r.json()).then(d => setStats(d?.data)).catch(() => {}).finally(() => setLoading(false))
    } else if (activeTab === 'pipeline') {
      fetch(`${API}/pipeline`).then(r => r.json()).then(d => setPipelineData(d?.data)).catch(() => {}).finally(() => setLoading(false))
    } else if (activeTab === 'leads') {
      fetch(`${API}/leads`).then(r => r.json()).then(d => setLeadsList(d?.data?.leads || [])).catch(() => {}).finally(() => setLoading(false))
    } else if (activeTab === 'meetings') {
      fetch(`${API}/meetings`).then(r => r.json()).then(d => setMeetingsList(d?.data?.meetings || [])).catch(() => {}).finally(() => setLoading(false))
    } else if (activeTab === 'finance') {
      fetch(`${API}/finance`).then(r => r.json()).then(d => setFinanceData(d?.data)).catch(() => {}).finally(() => setLoading(false))
    } else if (activeTab === 'outbound') {
      fetch(`${API}/outbound`).then(r => r.json()).then(d => setCampaignsList(d?.data?.campaigns || [])).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  /* ─── Send chat ─── */
  const send = useCallback(async (override) => {
    const text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')
    setMsgs(c => [...c, { role: 'user', content: text }])
    setSending(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const d = await res.json()
      const reply = d?.data?.content || d?.data?.response || JSON.stringify(d)
      setMsgs(c => [...c, { role: 'assistant', content: reply }])
    } catch (e) {
      setMsgs(c => [...c, { role: 'assistant', content: `❌ Error: ${e.message}` }])
    }
    setSending(false)
  }, [input, sending])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  /* ─── Generate leads ─── */
  async function generateLeads() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/leads/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5, industry: 'saas', location: 'India' }),
      })
      const d = await res.json()
      if (d?.success) {
        setMsgs(c => [...c, { role: 'system', content: `✅ ${d?.data?.generated || 5} new leads generated!` }])
        // Refresh leads and pipeline
        fetch(`${API}/leads`).then(r => r.json()).then(d => setLeadsList(d?.data?.leads || []))
        fetch(`${API}/stats`).then(r => r.json()).then(d => setStats(d?.data))
      }
    } catch (e) {
      setMsgs(c => [...c, { role: 'system', content: `❌ Error: ${e.message}` }])
    }
    setLoading(false)
  }

  /* ─── Pipeline stage counts ─── */
  const totalLeads = stats?.total_leads || 0
  const pipelineCounts = stats?.pipeline_counts || {}
  const totalMeetings = stats?.total_meetings || 0
  const pipelineValue = stats?.pipeline_value || 0
  const activeCampaigns = stats?.active_campaigns || 0

  /* ═══════════════════════════════════════════════
     Chat Tab
     ═══════════════════════════════════════════════ */
  const renderChat = () => (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center py-12">
            <div className="size-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="size-7 text-accent" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">Sales Agent</p>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
              Lead generation, pipeline management, meetings, and outbound campaigns.
            </p>
            <div className="max-w-lg mx-auto grid grid-cols-1 gap-1.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s.prompt); inputRef.current?.focus() }}
                  className="text-left text-[12px] text-muted-foreground px-3 py-2 border border-border/60 rounded-md hover:border-accent/30 hover:bg-accent/5 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((c, i) => (
          <div key={i} className={`flex gap-2.5 ${c.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {c.role === 'assistant' && (
              <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="size-3.5 text-accent" />
              </div>
            )}
            {c.role === 'system' && (
              <div className="size-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              </div>
            )}
            <div className={
              c.role === 'user'
                ? 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground whitespace-pre-wrap'
                : c.role === 'system'
                  ? 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-foreground whitespace-pre-wrap'
                  : 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground whitespace-pre-wrap'
            }>
              {c.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3 animate-pulse" />
            Sales Agent is thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions bar */}
      <div className="border-t border-border/60 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <button
          onClick={generateLeads}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded transition-colors"
        >
          <UserPlus className="size-3.5" /> Generate Leads
        </button>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sales Agent to do something..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
          />
          <Button
            onClick={() => send()}
            disabled={sending || !input.trim()}
            size="sm"
          >
            {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            <span className="ml-1.5">{sending ? '' : 'Send'}</span>
          </Button>
        </div>
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════
     Overview Tab
     ═══════════════════════════════════════════════ */
  const renderOverview = () => (
    <div className="flex-1 overflow-y-auto space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: String(totalLeads), icon: Users, color: '#533afd', desc: 'in pipeline' },
          { label: 'Pipeline Value', value: `₹${(pipelineValue || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981', desc: 'total deals' },
          { label: 'Meetings', value: String(totalMeetings), icon: Calendar, color: '#f59e0b', desc: 'scheduled/held' },
          { label: 'Active Campaigns', value: String(activeCampaigns), icon: Mail, color: '#3b82f6', desc: 'outbound running' },
        ].map((m) => (
          <div key={m.label} className="border border-border bg-card px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
                <m.icon className="size-4.5" style={{ color: m.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-2">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Pipeline counts */}
      <div className="border border-border bg-card">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline by Stage</h3>
        </div>
        <div className="divide-y divide-border/60">
          {Object.entries(STAGE_CONFIG).map(([key, sc]) => {
            const count = pipelineCounts[key] || 0
            const total = Object.values(pipelineCounts).reduce((a, b) => a + b, 0) || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={key} className="px-4 py-3 flex items-center gap-3">
                <span className={`inline-block w-2 h-2 rounded-full ${sc.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{sc.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${sc.dot.replace('bg-', 'bg-').replace('500', '500/70')}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent leads */}
      <div className="border border-border bg-card">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Activity</h3>
          <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => setActiveTab('leads')}>
            View All <ArrowUpRight className="size-3 ml-1" />
          </Button>
        </div>
        <div className="text-center py-8 text-xs text-muted-foreground">
          {totalLeads > 0 ? `${totalLeads} leads in pipeline. Switch to tabs to manage.` : 'No leads yet. Generate some from the Chat tab!'}
        </div>
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════
     Pipeline Tab — Kanban
     ═══════════════════════════════════════════════ */
  const renderPipeline = () => {
    if (loading) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading pipeline...
      </div>
    )

    const pipeline = pipelineData?.pipeline || {}
    const stages = pipelineData?.stages || Object.keys(STAGE_CONFIG)

    return (
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full min-w-0" style={{ minWidth: stages.length * 260 }}>
          {stages.map(stage => {
            const items = pipeline[stage] || []
            const sc = STAGE_CONFIG[stage] || { dot: 'bg-gray-500', border: 'border-gray-500/30', label: stage }
            return (
              <div key={stage} className="flex-1 min-w-[230px] max-w-[300px] flex flex-col border border-border rounded-lg bg-card/50">
                <div className={`px-3 py-2.5 border-b ${sc.border} flex items-center gap-2`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${sc.dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{sc.label}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto bg-muted/30 px-1.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {items.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/40 text-center py-8">Empty</p>
                  ) : items.map((item, i) => (
                    <div key={item.id || i} className="px-3 py-2.5 text-xs border border-border/60 rounded bg-card cursor-pointer hover:border-accent/30 transition-colors group">
                      <div className="font-medium text-foreground">{item.business_name || item.name || item.lead_name || 'Unknown'}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.email || item.industry || ''}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        {item.score && (
                          <span className="text-[10px] text-muted-foreground/60">Score: {item.score}</span>
                        )}
                        {item.amount && (
                          <span className="text-[10px] font-semibold tabular-nums text-emerald-500">₹{item.amount?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Leads Tab
     ═══════════════════════════════════════════════ */
  const renderLeads = () => {
    if (loading) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading leads...
      </div>
    )

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              All Leads ({leadsList.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-[11px] h-7" onClick={generateLeads} disabled={loading}>
                <UserPlus className="size-3 mr-1" /> Generate
              </Button>
              <Button size="sm" variant="outline" className="text-[11px] h-7">
                <Filter className="size-3 mr-1" /> Filter
              </Button>
            </div>
          </div>
          {leadsList.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Users className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p>No leads yet</p>
              <p className="text-xs mt-1">Generate leads from the Chat tab or click Generate above</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {leadsList.map((l, i) => (
                <div key={l.id || i} className="px-4 py-3 flex items-center gap-3 hover:bg-accent/5 transition-colors">
                  <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Users className="size-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{l.business_name}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{l.source}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                      {l.email && <span>{l.email}</span>}
                      {l.industry && <span>· {l.industry}</span>}
                      {l.location && <span>· {l.location}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums text-foreground">{l.score}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">{l.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Meetings Tab
     ═══════════════════════════════════════════════ */
  const renderMeetings = () => {
    if (loading) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading meetings...
      </div>
    )

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              All Meetings ({meetingsList.length})
            </h3>
            <Button size="sm" variant="outline" className="text-[11px] h-7">
              <Plus className="size-3 mr-1" /> Schedule
            </Button>
          </div>
          {meetingsList.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Calendar className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p>No meetings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {meetingsList.map((m, i) => (
                <div key={m.id || i} className="px-4 py-3 flex items-center gap-3.5 hover:bg-accent/5 transition-colors">
                  <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="size-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.date} at {m.time}
                      {m.lead_name ? ` · ${m.lead_name}` : ''}
                      {m.duration_minutes ? ` · ${m.duration_minutes}min` : ''}
                    </div>
                  </div>
                  <Badge variant={m.status === 'scheduled' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Finance Tab
     ═══════════════════════════════════════════════ */
  const renderFinance = () => {
    if (loading) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading finance...
      </div>
    )

    const fd = financeData || {}
    const deals = fd.deals || []
    const forecast = fd.revenue_forecast || []
    const val = fd.pipeline_value || 0

    return (
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Pipeline Value', value: `₹${(val || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
            { label: 'Closed Deals', value: String(deals.length || 0), icon: CheckCircle2, color: '#3b82f6' },
            { label: 'Avg Deal Size', value: deals.length ? `₹${Math.round(val / deals.length).toLocaleString()}` : '₹0', icon: TrendingUp, color: '#f59e0b' },
            { label: '6-Mo Forecast', value: forecast.length ? `₹${(forecast.reduce((a, f) => a + f.projected, 0)).toLocaleString()}` : '₹0', icon: PieChart, color: '#533afd' },
          ].map((m) => (
            <div key={m.label} className="border border-border bg-card px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
                  <m.icon className="size-4.5" style={{ color: m.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closed Deals */}
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closed Deals</h3>
          </div>
          {deals.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No deals closed yet</div>
          ) : (
            <div className="divide-y divide-border/60">
              {deals.map((d, i) => (
                <div key={d.id || i} className="px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{d.lead_name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.date?.slice(0, 10)}</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">₹{d.amount?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue Forecast</h3>
          </div>
          {forecast.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Forecast generating...</div>
          ) : (
            <div className="divide-y divide-border/60">
              {forecast.map((f, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{f.month}</div>
                    <div className="text-[10px] text-muted-foreground">Confidence: {f.confidence}%</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-500">₹{f.projected?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Outbound Tab
     ═══════════════════════════════════════════════ */
  const renderOutbound = () => {
    if (loading) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading campaigns...
      </div>
    )

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Outbound Campaigns ({campaignsList.length})
            </h3>
            <Button size="sm" variant="outline" className="text-[11px] h-7">
              <Plus className="size-3 mr-1" /> New Campaign
            </Button>
          </div>
          {campaignsList.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Mail className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p>No campaigns yet</p>
              <p className="text-xs mt-1">Create an outbound campaign to start reaching prospects</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {campaignsList.map((c, i) => (
                <div key={c.id || i} className="px-4 py-3 flex items-center gap-3 hover:bg-accent/5 transition-colors">
                  <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Mail className="size-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <Badge variant={c.status === 'running' ? 'default' : 'secondary'} className="text-[9px]">{c.status}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.type} · {c.target_industry || 'All industries'} · {c.sent_count || 0} sent
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={c.status === 'running' ? 'outline' : 'default'}
                    className="text-[11px] h-7"
                    disabled={c.status === 'running'}
                  >
                    {c.status === 'running' ? <Pause className="size-3 mr-1" /> : <Play className="size-3 mr-1" />}
                    {c.status === 'running' ? 'Running' : 'Launch'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */
  return (
    <PageShell>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2">
            <Briefcase className="size-5" />
            Sales Agent
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Active
          </Badge>
        </div>
        <div className="topbar-actions">
          <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => setActiveTab('overview')}>
            <RefreshCw className="size-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="flex items-stretch gap-px bg-border/50">
        {[
          { label: 'Total Leads', value: String(totalLeads), icon: Users, color: '#533afd' },
          { label: 'Pipeline Value', value: `₹${(pipelineValue || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
          { label: 'Meetings', value: String(totalMeetings), icon: Calendar, color: '#f59e0b' },
          { label: 'Active', value: String(activeCampaigns), icon: Mail, color: '#3b82f6' },
        ].map((m) => (
          <div key={m.label} className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-canvas min-w-0">
            <div className="size-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
              <m.icon className="size-3.5" style={{ color: m.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-border/60 overflow-x-auto">
        {TABS.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px shrink-0 ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <TabIcon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'pipeline' && renderPipeline()}
        {activeTab === 'leads' && renderLeads()}
        {activeTab === 'meetings' && renderMeetings()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'outbound' && renderOutbound()}
      </div>
    </PageShell>
  )
}
