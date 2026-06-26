'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useCompany } from '@/lib/client-context'
import {
  Bot, BarChart3, TrendingUp, DollarSign, Users, Target,
  Zap, CheckCircle, Clock, MessageSquare,
  Briefcase, PieChart, Activity, LayoutDashboard,
  FileText, Search, Crown, Megaphone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageShell from '@/components/PageShell'
import { RunActivityChart, PriorityChart, IssueStatusChart, SuccessRateChart } from '@/components/ActivityCharts'

/* ═══════════════════════════════════════════════
   Agency Data — represents the whole org
   ═══════════════════════════════════════════════ */

const AGENCY_METRICS = {
  clients: 7,
  projects: 12,
  totalTasks: 779,
  taskDaily: 43,
  revenueForecast: 147500,
  closedDeals: 12,
  pipelineValue: 289000,
  agentCount: 8,
  uptime: 99.7,
}

const WORKER_LABELS = [
  { slug: 'intake-researcher', label: 'Intake Researcher', emoji: '🔍', color: 'text-blue-500', bg: 'bg-blue-500/10', tasks: 5, status: 'active' },
  { slug: 'content-creator', label: 'Content Creator', emoji: '✍️', color: 'text-purple-500', bg: 'bg-purple-500/10', tasks: 3, status: 'active' },
  { slug: 'seo-engine', label: 'SEO Engine', emoji: '📈', color: 'text-emerald-500', bg: 'bg-emerald-500/10', tasks: 2, status: 'idle' },
  { slug: 'ads-runner', label: 'Ads Runner', emoji: '📢', color: 'text-orange-500', bg: 'bg-orange-500/10', tasks: 4, status: 'active' },
  { slug: 'analytics-bot', label: 'Analytics Bot', emoji: '📊', color: 'text-cyan-500', bg: 'bg-cyan-500/10', tasks: 1, status: 'active' },
  { slug: 'sales-closer', label: 'Sales Closer', emoji: '💼', color: 'text-rose-500', bg: 'bg-rose-500/10', tasks: 2, status: 'active' },
  { slug: 'client-success', label: 'Client Success', emoji: '🤝', color: 'text-teal-500', bg: 'bg-teal-500/10', tasks: 3, status: 'active' },
  { slug: 'review-qc', label: 'Review QC', emoji: '✅', color: 'text-amber-500', bg: 'bg-amber-500/10', tasks: 1, status: 'idle' },
]

const SERVICES = [
  { id: 'seo', label: 'SEO', icon: TrendingUp, color: 'text-emerald-500', desc: 'Rank higher, drive organic traffic' },
  { id: 'social', label: 'Social Media', icon: MessageSquare, color: 'text-blue-500', desc: 'Content, engage, grow audience' },
  { id: 'ads', label: 'Paid Ads', icon: Target, color: 'text-orange-500', desc: 'FB, Google, LinkedIn campaigns' },
  { id: 'content', label: 'Content', icon: FileText, color: 'text-purple-500', desc: 'Blogs, scripts, creatives' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-cyan-500', desc: 'Reports, dashboards, insights' },
  { id: 'sales', label: 'Sales', icon: DollarSign, color: 'text-rose-500', desc: 'Proposals, closing, pipelines' },
]

const RECENT_ACTIVITY = [
  { id: 1, agent: 'Intake Researcher', action: 'Research complete', detail: 'Miami market analysis done', time: '12m ago', icon: Search },
  { id: 2, agent: 'Content Creator', action: 'Draft ready', detail: 'Ad copy variant #3 approved', time: '28m ago', icon: FileText },
  { id: 3, agent: 'Ads Runner', action: 'Campaign live', detail: 'Facebook retargeting launched', time: '1h ago', icon: Megaphone },
  { id: 4, agent: 'SEO Engine', action: 'Ranking update', detail: '3 keywords now page 1', time: '2h ago', icon: TrendingUp },
  { id: 5, agent: 'Sales Closer', action: 'Deal closed', detail: 'New retainer signed — $5k/mo', time: '3h ago', icon: DollarSign },
]

const SUGGESTIONS = [
  { label: 'Research competitors', prompt: 'Research competitors for a roofing business in Texas' },
  { label: 'Write a blog post', prompt: 'Write a blog post about AI in marketing' },
  { label: 'LinkedIn strategy', prompt: 'Create a LinkedIn content strategy for a SaaS company' },
  { label: 'Facebook ad campaign', prompt: 'Set up Facebook ads for a local service business' },
  { label: 'SEO audit', prompt: 'Audit SEO for an e-commerce website' },
  { label: 'Agency status update', prompt: 'Give me a quick status update on everything' },
]

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
]

/* ─── Helpers ─── */

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function AgentStatusDot({ status }) {
  const colors = { active: 'bg-emerald-500', idle: 'bg-muted-foreground', paused: 'bg-red-500' }
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[status] || 'bg-muted-foreground'}`} />
}

/* ─── Overview Tab ─── */

function OverviewTab({ activeCompany }) {
  const totalTasks = AGENCY_METRICS.totalTasks
  const active = WORKER_LABELS.filter(a => a.status === 'active').length
  const onlineCount = active
  const agentCount = WORKER_LABELS.length

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      {/* Agency KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Active Clients" value={AGENCY_METRICS.clients} sub={`${AGENCY_METRICS.projects} active projects`} color="#8B5CF6" />
        <MetricCard icon={Target} label="Pipeline Value" value={`$${(AGENCY_METRICS.pipelineValue / 1000).toFixed(0)}K`} sub={`${AGENCY_METRICS.closedDeals} closed deals`} color="#3B82F6" />
        <MetricCard icon={DollarSign} label="Revenue Forecast" value={`$${(AGENCY_METRICS.revenueForecast / 1000).toFixed(0)}K`} sub="Next 30 days" color="#10B981" />
        <MetricCard icon={Activity} label="Tasks Today" value={AGENCY_METRICS.taskDaily} sub={`${AGENCY_METRICS.totalTasks} total in queue`} color="#F59E0B" />
      </div>

      {/* Middle Row: Charts + Agent Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Health Summary */}
        <Card className="border-border lg:col-span-1">
          <CardHeader className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agency Health</CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                {AGENCY_METRICS.uptime}% uptime
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Agents Online</span>
              <span className="text-sm font-semibold text-foreground">{onlineCount}/{agentCount}</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(onlineCount / agentCount) * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-semibold text-foreground">$12.4K</p>
                <p className="text-[10px] text-muted-foreground">Monthly Rev</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-semibold text-foreground">98%</p>
                <p className="text-[10px] text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="px-4 py-3 border-b border-border">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border p-2.5">
                <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Activity</h4>
                <RunActivityChart />
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Priority</h4>
                <PriorityChart />
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Issues</h4>
                <IssueStatusChart />
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Success Rate</h4>
                <SuccessRateChart />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {RECENT_ACTIVITY.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
              <div className="rounded-lg bg-muted p-1.5">
                <a.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{a.agent} — {a.action}</p>
                <p className="text-[10px] text-muted-foreground">{a.detail}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Agents Tab ─── */

function AgentsTab() {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Bot} label="Total Agents" value={WORKER_LABELS.length} sub="8 workers" color="#8B5CF6" />
        <MetricCard icon={Play} label="Active" value={WORKER_LABELS.filter(a => a.status === 'active').length} sub="Running tasks" color="#10B981" />
        <MetricCard icon={Zap} label="Total Tasks" value={WORKER_LABELS.reduce((s, a) => s + a.tasks, 0)} sub="Across all agents" color="#3B82F6" />
        <MetricCard icon={Clock} label="Idle" value={WORKER_LABELS.filter(a => a.status === 'idle').length} sub="Awaiting work" color="#F59E0B" />
      </div>

      <Card className="border-border">
        <CardHeader className="px-4 py-3 border-b border-border">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Worker Agents</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {WORKER_LABELS.map(a => (
            <div key={a.slug} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
              <span className="text-lg">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${a.color}`}>{a.label}</p>
                <p className="text-[10px] text-muted-foreground">{a.tasks} active tasks · {a.slug}</p>
              </div>
              <span className="text-xs tabular-nums text-foreground">{a.tasks} tasks</span>
              <AgentStatusDot status={a.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Services Tab ─── */

function ServicesTab() {
  return (
    <div className="p-5 space-y-4">
      <Card className="border-border">
        <CardHeader className="px-4 py-3 border-b border-border">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agency Service Offerings</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICES.map(s => {
              const Icon = s.icon
              return (
                <div key={s.id} className="rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Icon className={`h-5 w-5 ${s.color} shrink-0`} />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Chat Tab ─── */

function ChatTab({ activeCompany }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [routingInfo, setRoutingInfo] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])

  function detectIntent(text) {
    const l = text.toLowerCase()
    if (l.includes('lead') || l.includes('find') || l.includes('research') || l.includes('prospect')) return { agent: 'intake-researcher', label: 'Intake Researcher', emoji: '🔍' }
    if (l.includes('content') || l.includes('blog') || l.includes('write') || l.includes('draft')) return { agent: 'content-creator', label: 'Content Creator', emoji: '✍️' }
    if (l.includes('social') || l.includes('linkedin') || l.includes('instagram')) return { agent: 'social-manager', label: 'Social Manager', emoji: '📱' }
    if (l.includes('ads') || l.includes('campaign')) return { agent: 'ads-runner', label: 'Ads Runner', emoji: '📢' }
    if (l.includes('seo') || l.includes('keyword') || l.includes('ranking')) return { agent: 'seo-engine', label: 'SEO Engine', emoji: '📈' }
    if (l.includes('analytics') || l.includes('report') || l.includes('stats')) return { agent: 'analytics-bot', label: 'Analytics Bot', emoji: '📊' }
    if (l.includes('sales') || l.includes('proposal') || l.includes('close')) return { agent: 'sales-closer', label: 'Sales Closer', emoji: '💼' }
    if (l.includes('client') || l.includes('onboarding')) return { agent: 'client-success', label: 'Client Success', emoji: '🤝' }
    return null
  }

  const send = useCallback((override) => {
    const text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')

    const userMsgId = Date.now().toString()
    setMsgs(p => [...p, { id: userMsgId, role: 'user', content: text, time: new Date().toISOString() }])
    setSending(true)
    const intent = detectIntent(text)
    setRoutingInfo(intent)

    fetch('/api/ceo/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: 'web' })
    })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setMsgs(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || 'Kuch gadbad ho gayi', time: new Date().toISOString() }])
        } else {
          const errMsg = data.message || 'Kuch gadbad ho gayi, dobara try karo'
          setMsgs(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: `❌ ${errMsg}`, time: new Date().toISOString() }])
        }
        setRoutingInfo(null)
        setSending(false)
      })
      .catch(err => {
        setMsgs(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: `❌ Network error: ${err.message}`, time: new Date().toISOString() }])
        setRoutingInfo(null)
        setSending(false)
      })
  }, [input, sending])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }, [send])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-border bg-card">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">CEO Command</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600 bg-emerald-50">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
              Online
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{activeCompany?.name || 'Agency-wide'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-4">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
              <div className="text-center max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Hey, I'm your CEO! 👋</h2>
                <p className="text-sm text-muted-foreground">
                  I run the whole agency. Tell me what you need — leads, content, ads, or a status check.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map(s => (
                  <button key={s.label} onClick={() => { setInput(s.prompt); setTimeout(() => send(s.prompt), 100) }}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map(m => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {m.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">CEO</span>
                  <span className="text-[10px] text-muted-foreground">just now</span>
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted/50 text-foreground border border-border rounded-bl-md'
              }`}>
                {m.content}
              </div>
            </div>
          ))}

          {routingInfo && sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                <Activity className="h-3 w-3 text-amber-500 animate-pulse" />
                <span>Routing to <span className="font-medium text-foreground">{routingInfo.emoji} {routingInfo.label}</span></span>
              </div>
            </div>
          )}

          {sending && !routingInfo && (
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-primary mt-1.5" />
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 focus-within:border-primary/40 shadow-sm">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Message CEO..." disabled={sending}
            className="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none" />
          <button type="button" onClick={() => send()} disabled={!input.trim() || sending}
            className="rounded-lg bg-primary p-1.5 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Insights Tab ─── */

function InsightsTab() {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="px-4 py-3 border-b border-border">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <RunActivityChart />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="px-4 py-3 border-b border-border">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <IssueStatusChart />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="px-4 py-3 border-b border-border">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Priority</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <PriorityChart />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="px-4 py-3 border-b border-border">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Success Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <SuccessRateChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Main CEO Page
   ═══════════════════════════════════════════════ */

export default function CEOPage() {
  const ctx = useCompany()
  const activeCompany = ctx.activeCompany
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <PageShell>
      <div className="flex flex-col h-full">
        {/* Tab Bar */}
        <div className="shrink-0 bg-card border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-amber-500" />
              <h1 className="text-base font-semibold text-foreground">CEO Command Center</h1>
            </div>
            <p className="text-xs text-muted-foreground">{activeCompany?.name || 'Agency-wide'} · {AGENCY_METRICS.clients} clients · ${(AGENCY_METRICS.pipelineValue / 1000).toFixed(0)}K pipeline</p>
          </div>
          <div className="flex gap-1 px-4 pb-0 overflow-x-auto scrollbar-none">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium rounded-t-lg border-t border-l border-r transition-colors relative ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground border-border -mb-px'
                    : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground'
                }`}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {activeTab === 'overview' && <OverviewTab activeCompany={activeCompany} />}
          {activeTab === 'agents' && <AgentsTab />}
          {activeTab === 'services' && <ServicesTab />}
          {activeTab === 'chat' && <ChatTab activeCompany={activeCompany} />}
          {activeTab === 'insights' && <InsightsTab />}
        </div>
      </div>
    </PageShell>
  )
}
