'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Columns3, CheckCircle2, Clock, Circle,
  Activity, MessageSquare, TrendingUp, Zap, AlertCircle,
  CalendarDays, GitBranch, Target, Users, Bot, Crown,
  Smartphone, Megaphone, DollarSign, ShieldCheck,
  RefreshCw, Play, Pause, Server, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/* ═══════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════ */

const TICKETS = [
  { id: 101, title: 'Research Miami real estate market', agent: 'Intake Researcher', status: 'open', priority: 'high' },
  { id: 102, title: 'Analyze competitor ad strategies', agent: 'Intake Researcher', status: 'in-progress', priority: 'high' },
  { id: 103, title: 'Draft ad creative & copy variants', agent: 'Content Creator', status: 'in-progress', priority: 'high' },
  { id: 104, title: 'Build lookalike audience segments', agent: 'Ads Runner', status: 'open', priority: 'medium' },
  { id: 105, title: 'Optimize landing page for conversion', agent: 'SEO Engine', status: 'open', priority: 'medium' },
  { id: 106, title: 'Set up conversion tracking', agent: 'Analytics Bot', status: 'open', priority: 'medium' },
  { id: 107, title: 'Research top 20 competitor ad copy', agent: 'Intake Researcher', status: 'completed', priority: 'high' },
  { id: 108, title: 'Create 50 post briefs for writers', agent: 'Content Creator', status: 'in-progress', priority: 'medium' },
  { id: 109, title: 'Set up programmatic SEO pages', agent: 'SEO Engine', status: 'open', priority: 'low' },
  { id: 110, title: 'Build client NPS survey workflow', agent: 'Client Success', status: 'completed', priority: 'low' },
  { id: 111, title: 'Review ad compliance', agent: 'Review & QC', status: 'in-progress', priority: 'high' },
  { id: 112, title: 'Generate weekly performance report', agent: 'Analytics Bot', status: 'completed', priority: 'medium' },
]

const GOALS = [
  { id: 1, title: 'Launch lead gen campaign', status: 'in-progress', priority: 'high', done: 3, tickets: 6, progress: 50, start: '2026-06-01', deadline: '2026-07-15', agent: 'Intake Researcher' },
  { id: 2, title: 'Scale content output 3x', status: 'in-progress', priority: 'high', done: 1, tickets: 4, progress: 25, start: '2026-06-10', deadline: '2026-08-01', agent: 'Content Creator' },
  { id: 3, title: 'Client satisfaction program', status: 'in-progress', priority: 'medium', done: 2, tickets: 5, progress: 40, start: '2026-06-05', deadline: '2026-07-30', agent: 'Client Success' },
  { id: 4, title: 'Reporting automation', status: 'pending', priority: 'low', done: 0, tickets: 3, progress: 0, start: '2026-07-01', deadline: '2026-08-15', agent: 'Analytics Bot' },
]

const MILESTONES = [
  { id: 1, goalId: 1, title: 'Competitor research complete', date: '2026-06-10', done: true },
  { id: 2, goalId: 1, title: 'Ad copy variants ready', date: '2026-06-20', done: false },
  { id: 3, goalId: 1, title: 'Landing page live', date: '2026-07-01', done: false },
  { id: 4, goalId: 2, title: '100 briefs pipeline', date: '2026-06-25', done: false },
  { id: 5, goalId: 2, title: '10 writers onboarded', date: '2026-07-10', done: false },
]

const ROUTINES = [
  { id: 'data-sync', name: 'Data Sync', desc: 'Sync CRM & analytics data', status: 'running', lastRun: '2m ago', runs: 142, success: 98, cron: '*/15 * * * *' },
  { id: 'lead-scrape', name: 'Lead Scraper', desc: 'Scrape new leads from sources', status: 'running', lastRun: '5m ago', runs: 89, success: 95, cron: '0 */2 * * *' },
  { id: 'report-gen', name: 'Report Generator', desc: 'Generate daily performance report', status: 'idle', lastRun: '2h ago', runs: 65, success: 100, cron: '0 6 * * *' },
  { id: 'content-check', name: 'Content Checker', desc: 'Validate content quality', status: 'running', lastRun: '1m ago', runs: 200, success: 99, cron: '0 * * * *' },
  { id: 'budget-watch', name: 'Budget Watcher', desc: 'Monitor ad spend thresholds', status: 'running', lastRun: '3m ago', runs: 300, success: 100, cron: '*/5 * * * *' },
  { id: 'backup', name: 'Daily Backup', desc: 'Backup database & config', status: 'idle', lastRun: '8h ago', runs: 30, success: 100, cron: '0 2 * * *' },
]

const ACTIVE_AGENTS = [
  { name: 'Intake Researcher', emoji: '🔍', color: 'text-blue-500', tasks: 5, status: 'active' },
  { name: 'Content Creator', emoji: '✍️', color: 'text-purple-500', tasks: 3, status: 'active' },
  { name: 'SEO Engine', emoji: '📈', color: 'text-emerald-500', tasks: 2, status: 'idle' },
  { name: 'Ads Runner', emoji: '📢', color: 'text-orange-500', tasks: 4, status: 'active' },
  { name: 'Analytics Bot', emoji: '📊', color: 'text-cyan-500', tasks: 1, status: 'active' },
  { name: 'Sales Closer', emoji: '💼', color: 'text-rose-500', tasks: 0, status: 'idle' },
  { name: 'Client Success', emoji: '🤝', color: 'text-teal-500', tasks: 2, status: 'active' },
  { name: 'Review QC', emoji: '✅', color: 'text-amber-500', tasks: 1, status: 'idle' },
]

const ACTIVITIES = [
  { id: 1, agent: 'Intake Researcher', action: 'completed', item: '#107 Competitor ad copy research', time: '8m ago' },
  { id: 2, agent: 'Content Creator', action: 'moved', item: '#103 Draft ad creative', time: '12m ago' },
  { id: 3, agent: 'Ads Runner', action: 'created', item: '#114 TikTok ad script', time: '22m ago' },
  { id: 4, agent: 'Client Success', action: 'commented', item: '#110 NPS survey workflow', time: '34m ago' },
  { id: 5, agent: 'SEO Engine', action: 'moved', item: '#105 Landing page optimization', time: '1h ago' },
  { id: 6, agent: 'Analytics Bot', action: 'completed', item: '#112 Weekly performance report', time: '1.5h ago' },
  { id: 7, agent: 'Review QC', action: 'commented', item: '#111 Ad compliance review', time: '2h ago' },
  { id: 8, agent: 'Intake Researcher', action: 'created', item: '#115 New lead segment', time: '3h ago' },
]

const APPROVALS = []
const COST_AGENTS = [
  { name: 'Intake Researcher', spend: 520, budget: 600, status: 'running' },
  { name: 'Content Creator', spend: 380, budget: 500, status: 'running' },
  { name: 'SEO Engine', spend: 290, budget: 400, status: 'running' },
  { name: 'Ads Runner', spend: 710, budget: 700, status: 'paused' },
  { name: 'Analytics Bot', spend: 180, budget: 300, status: 'running' },
  { name: 'Sales Closer', spend: 220, budget: 350, status: 'running' },
  { name: 'Client Success', spend: 110, budget: 150, status: 'running' },
  { name: 'Review QC', spend: 65, budget: 200, status: 'idle' },
]

/* ═══════════════════════════════════════════════
   Helper Components
   ═══════════════════════════════════════════════ */

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4" style={{ color: color || 'var(--primary)' }} />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    'open': { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
    'in-progress': { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
    'completed': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
    'running': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
    'idle': { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
    'paused': { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
    'pending': { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  }
  const c = cfg[status] || cfg.pending
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  )
}

function PriorityChip({ priority }) {
  const cfg = { high: 'text-red-500 bg-red-500/10', medium: 'text-amber-500 bg-amber-500/10', low: 'text-muted-foreground bg-muted' }
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg[priority] || cfg.low}`}>{priority}</span>
}

/* ═══════════════════════════════════════════════
   Tabs
   ═══════════════════════════════════════════════ */

const TABS = [
  { id: 'boardroom', label: 'Boardroom', icon: MessageSquare, color: 'text-violet-500' },
  { id: 'tickets', label: 'Tickets', icon: Columns3, color: 'text-blue-500' },
  { id: 'routines', label: 'Routines', icon: RefreshCw, color: 'text-purple-500' },
  { id: 'goals', label: 'Goals', icon: Target, color: 'text-emerald-500' },
  { id: 'activity', label: 'Activity', icon: Activity, color: 'text-cyan-500' },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck, color: 'text-amber-500' },
  { id: 'costs', label: 'Costs', icon: DollarSign, color: 'text-rose-500' },
]

/* ═══════════════════════════════════════════════
   Boardroom Tab
   ═══════════════════════════════════════════════ */

function BoardroomTab() {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Agents Online" value={`${ACTIVE_AGENTS.filter(a => a.status === 'active').length}/${ACTIVE_AGENTS.length}`} color="#8B5CF6" />
        <KpiCard icon={Activity} label="Active Tasks" value={ACTIVE_AGENTS.reduce((s, a) => s + a.tasks, 0)} color="#06B6D4" />
        <KpiCard icon={CheckCircle2} label="Completed Today" value="7" color="#10B981" />
        <KpiCard icon={Zap} label="Throughput" value="1.2k/day" color="#F59E0B" />
      </div>

      <Card className="border-border">
        <CardHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Status</CardTitle>
            <Badge variant="outline" className="text-[10px]">All Systems Nominal</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="divide-y divide-border">
            {ACTIVE_AGENTS.map(a => (
              <div key={a.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                <span className="text-lg">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${a.color}`}>{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.tasks} active tasks</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Tickets Tab
   ═══════════════════════════════════════════════ */

function TicketsTab() {
  const [view, setView] = useState('board')
  const total = TICKETS.length
  const open = TICKETS.filter(t => t.status === 'open').length
  const inProg = TICKETS.filter(t => t.status === 'in-progress').length
  const done = TICKETS.filter(t => t.status === 'completed').length

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={LayoutDashboard} label="Total" value={total} color="var(--primary)" />
        <KpiCard icon={Circle} label="Open" value={open} color="#F59E0B" />
        <KpiCard icon={Clock} label="In Progress" value={inProg} color="#3B82F6" />
        <KpiCard icon={CheckCircle2} label="Completed" value={done} color="#10B981" />
      </div>

      <div className="flex gap-1.5">
        {[
          { id: 'board', label: 'Kanban', icon: Columns3 },
          { id: 'list', label: 'List', icon: LayoutDashboard },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
              view === t.id ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'open', label: 'Open', color: '#F59E0B' },
            { key: 'in-progress', label: 'In Progress', color: '#3B82F6' },
            { key: 'completed', label: 'Completed', color: '#10B981' },
          ].map(col => {
            const items = TICKETS.filter(t => t.status === col.key)
            return (
              <div key={col.key} className="border border-border rounded-xl bg-card p-3 space-y-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-semibold text-foreground">{col.label}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${col.color}18`, color: col.color }}>{items.length}</span>
                </div>
                {items.map(ticket => (
                  <div key={ticket.id} className="rounded-lg p-3 space-y-2 border border-border bg-background hover:bg-accent/30 transition-colors cursor-pointer">
                    {ticket.priority === 'high' && <div className="h-0.5 w-8 rounded bg-red-500" />}
                    {ticket.priority === 'medium' && <div className="h-0.5 w-5 rounded bg-amber-500" />}
                    <p className="text-xs font-medium text-foreground leading-snug">#{ticket.id} {ticket.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{ticket.agent}</span>
                      <PriorityChip priority={ticket.priority} />
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">No tickets</p>}
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="border-border">
          <div className="divide-y divide-border">
            {TICKETS.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors text-xs">
                <PriorityChip priority={t.priority} />
                <span className="font-medium text-foreground flex-1 truncate">#{t.id} {t.title}</span>
                <span className="text-muted-foreground">{t.agent}</span>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Routines Tab
   ═══════════════════════════════════════════════ */

function RoutinesTab() {
  const activeCount = ROUTINES.filter(r => r.status === 'running').length
  const avgSuccess = Math.round(ROUTINES.reduce((s, r) => s + r.success, 0) / ROUTINES.length)

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Server} label="Total Routines" value={ROUTINES.length} color="#8B5CF6" />
        <KpiCard icon={Play} label="Active" value={activeCount} color="#10B981" />
        <KpiCard icon={BarChart3} label="Avg Success" value={`${avgSuccess}%`} color="#3B82F6" />
        <KpiCard icon={Clock} label="Total Runs" value={ROUTINES.reduce((s, r) => s + r.runs, 0)} color="#F59E0B" />
      </div>

      <Card className="border-border">
        <CardHeader className="px-4 py-3 border-b border-border">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Routine Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {ROUTINES.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${r.status === 'running' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.desc} · {r.cron}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tabular-nums text-foreground">{r.success}%</p>
                  <p className="text-[10px] text-muted-foreground">{r.runs} runs</p>
                </div>
                <StatusBadge status={r.status} />
                <span className="text-[10px] text-muted-foreground w-16 text-right">{r.lastRun}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Goals Tab
   ═══════════════════════════════════════════════ */

function GoalsTab() {
  const [gtab, setGtab] = useState('overview')
  const completed = GOALS.filter(g => g.status === 'completed').length
  const inProgress = GOALS.filter(g => g.status === 'in-progress').length

  const pctOfRange = (start, deadline, date) => {
    const s = new Date(start).getTime()
    const d = new Date(deadline).getTime()
    const m = new Date(date).getTime()
    return d !== s ? Math.round(((m - s) / (d - s)) * 100) : 50
  }

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Target} label="Total Goals" value={GOALS.length} color="var(--primary)" />
        <KpiCard icon={Activity} label="In Progress" value={inProgress} color="#3B82F6" />
        <KpiCard icon={CheckCircle2} label="Completed" value={completed} color="#10B981" />
        <KpiCard icon={GitBranch} label="Milestones" value={MILESTONES.filter(m => !m.done).length + ' active'} color="#F59E0B" />
      </div>

      <div className="flex gap-1.5">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'timeline', label: 'Timeline' },
        ].map(t => (
          <button key={t.id} onClick={() => setGtab(t.id)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
              gtab === t.id ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}>{t.label}</button>
        ))}
      </div>

      {gtab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GOALS.map(g => (
            <Card key={g.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${g.priority === 'high' ? 'bg-red-500' : g.priority === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground'}`} />
                    <span className="text-sm font-medium text-foreground truncate">{g.title}</span>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${g.progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{g.done}/{g.tickets} tickets done</span>
                  <span>{g.progress}%</span>
                  <span>{g.agent}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardHeader className="px-4 py-3 border-b border-border">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goal Timeline — Gantt View</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {GOALS.map(g => {
              const totalDays = Math.max(1, Math.round((new Date(g.deadline).getTime() - new Date(g.start).getTime()) / 86400000))
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-foreground truncate flex-1">{g.title}</span>
                    <StatusBadge status={g.status} />
                  </div>
                  <div className="relative h-5 rounded bg-border overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 rounded ${g.status === 'completed' ? 'bg-emerald-500/60' : 'bg-amber-500/40'}`} style={{ width: `${g.progress}%` }} />
                    {MILESTONES.filter(m => m.goalId === g.id).map(m => (
                      <div key={m.id} className={`absolute top-0.5 bottom-0.5 w-[3px] rounded-full z-10 ${m.done ? 'bg-emerald-400' : 'bg-muted-foreground/60'}`} style={{ left: `${pctOfRange(g.start, g.deadline, m.date)}%` }} title={m.title} />
                    ))}
                    <div className="absolute inset-0 flex items-center px-1.5">
                      <span className="text-[8px] font-mono text-white/70">{g.done}/{g.tickets}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[8px] text-muted-foreground">{g.start}</span>
                    <span className="text-[8px] text-muted-foreground">{g.deadline}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Activity Tab
   ═══════════════════════════════════════════════ */

function ActivityTab() {
  const [agentFilter, setAgentFilter] = useState('all')
  const agents = [...new Set(ACTIVITIES.map(a => a.agent))]
  const filtered = agentFilter === 'all' ? ACTIVITIES : ACTIVITIES.filter(a => a.agent === agentFilter)

  const actionColor = (action) => {
    switch (action) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/10'
      case 'moved': return 'text-blue-500 bg-blue-500/10'
      case 'created': return 'text-violet-500 bg-violet-500/10'
      case 'commented': return 'text-amber-500 bg-amber-500/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setAgentFilter('all')}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${agentFilter === 'all' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
          All
        </button>
        {agents.map(a => (
          <button key={a} onClick={() => setAgentFilter(a)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${agentFilter === a ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {a}
          </button>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="p-0 divide-y divide-border">
          {filtered.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${actionColor(a.action)}`}>{a.action}</span>
              <span className="text-xs text-foreground flex-1 truncate">{a.item}</span>
              <span className="text-[10px] text-muted-foreground">{a.agent}</span>
              <span className="text-[10px] text-muted-foreground">{a.time}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No recent activity from this agent</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Approvals Tab
   ═══════════════════════════════════════════════ */

function ApprovalsTab() {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={ShieldCheck} label="Pending" value="0" color="#F59E0B" sub="Awaiting review" />
        <KpiCard icon={CheckCircle2} label="Approved" value="0" color="#10B981" sub="Approved requests" />
        <KpiCard icon={AlertCircle} label="Rejected" value="0" color="#EF4444" sub="Declined requests" />
      </div>

      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No pending approvals</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            When agents request budget overrides, content approvals, or access changes, they&apos;ll appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Costs Tab
   ═══════════════════════════════════════════════ */

function CostsTab() {
  const totalSpend = COST_AGENTS.reduce((s, a) => s + a.spend, 0)
  const totalBudget = COST_AGENTS.reduce((s, a) => s + a.budget, 0)
  const utilized = Math.round((totalSpend / totalBudget) * 100)

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="Total Spend" value={`$${totalSpend}`} color="#EF4444" />
        <KpiCard icon={TrendingUp} label="Budget" value={`$${totalBudget}`} color="#3B82F6" />
        <KpiCard icon={BarChart3} label="Utilized" value={`${utilized}%`} color={utilized > 80 ? '#F59E0B' : '#10B981'} />
        <KpiCard icon={Activity} label="Active Agents" value={`${COST_AGENTS.filter(a => a.status === 'running').length} running`} color="#8B5CF6" />
      </div>

      <Card className="border-border">
        <CardHeader className="px-4 py-3 border-b border-border">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Budget Utilization</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {COST_AGENTS.map(a => {
            const pct = Math.round((a.spend / a.budget) * 100)
            const over = pct > 100
            const near = pct > 80
            return (
              <div key={a.name} className={`flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors ${a.status === 'paused' ? 'opacity-60' : ''}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${a.status === 'running' ? 'bg-emerald-500' : a.status === 'paused' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
                <span className="flex-1 text-sm text-foreground truncate">{a.name}</span>
                <div className="w-32 h-2 rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <span className={`text-xs tabular-nums w-28 text-right ${over ? 'text-red-500' : 'text-muted-foreground'}`}>${a.spend} / ${a.budget}</span>
                <span className={`text-xs font-medium w-10 text-right tabular-nums ${over ? 'text-red-500' : near ? 'text-amber-500' : 'text-muted-foreground'}`}>{pct}%</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function WorkPage() {
  const [activeTab, setActiveTab] = useState('boardroom')

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="shrink-0 bg-background border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-base font-semibold text-foreground">Work Center</h1>
          </div>
          <p className="text-xs text-muted-foreground">Manage tasks, routines, goals and more</p>
        </div>
        <div className="flex gap-1 px-4 pb-0 overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium rounded-t-lg border-t border-l border-r transition-colors relative ${
                activeTab === tab.id
                  ? 'bg-card text-foreground border-border -mb-px'
                  : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${tab.color}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        {activeTab === 'boardroom' && <BoardroomTab />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'routines' && <RoutinesTab />}
        {activeTab === 'goals' && <GoalsTab />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'approvals' && <ApprovalsTab />}
        {activeTab === 'costs' && <CostsTab />}
      </div>
    </div>
  )
}
