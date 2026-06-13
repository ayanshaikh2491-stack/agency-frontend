'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Bot, CircleDot, DollarSign, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useCompany } from '@/lib/client-context'
import { RunActivityChart, PriorityChart, IssueStatusChart, SuccessRateChart } from '@/components/ActivityCharts'

/* ═══════════════════════════════════════════════
   Dashboard — Real Data (no mocks)
   ═══════════════════════════════════════════════ */

/* ─── MetricCard (Paperclip exact) ─── */
function MetricCard({ icon: Icon, label, value, description, href }) {
  const inner = (
    <div className="px-4 py-4 sm:px-5 sm:py-5 transition-colors hover:bg-accent/50 cursor-pointer h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
            {label}
          </p>
          {description && (
            <div className="text-xs text-muted-foreground/70 mt-1.5 hidden sm:block">
              {description}
            </div>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1.5" />
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="no-underline text-inherit h-full border border-border">{inner}</Link>
  }
  return <div className="h-full border border-border">{inner}</div>
}

/* ─── Skeleton variants for loading state ─── */
function MetricCardSkeleton() {
  return (
    <div className="h-full border border-border px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-8 w-20 bg-muted/60 animate-pulse" />
          <div className="h-4 w-28 bg-muted/40 animate-pulse" />
        </div>
        <div className="h-4 w-4 bg-muted/40 animate-pulse rounded shrink-0 mt-1.5" />
      </div>
    </div>
  )
}

function AgentRunCardSkeleton() {
  return (
    <div className="flex flex-col border border-border bg-background/70">
      <div className="border-b border-border/60 px-3 py-3 space-y-2">
        <div className="h-4 w-24 bg-muted/60 animate-pulse" />
        <div className="h-3 w-32 bg-muted/40 animate-pulse" />
      </div>
      <div className="p-3 space-y-1">
        <div className="h-3 w-full bg-muted/30 animate-pulse" />
        <div className="h-3 w-3/4 bg-muted/30 animate-pulse" />
      </div>
    </div>
  )
}

/* ─── Relative time helper ─── */
function timeAgo(dateOrStr) {
  if (!dateOrStr) return ''
  const now = Date.now()
  let then
  if (typeof dateOrStr === 'number') {
    then = dateOrStr
  } else if (typeof dateOrStr === 'string') {
    then = new Date(dateOrStr).getTime()
  } else if (dateOrStr instanceof Date) {
    then = dateOrStr.getTime()
  } else {
    return ''
  }
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ─── Agent Run Card (Paperclip ActiveAgentsPanel style) ─── */
function AgentRunCard({ agent, isActive }) {
  const statusColors = {
    running: '#3b82f6',
    idle: '#b4b4b4',
    paused: 'var(--error)',
    error: 'var(--error)',
    active: '#4ade80',
  }
  const color = statusColors[agent?.status] || '#b4b4b4'

  return (
    <Link
      href={agent?.route || agent?.id ? `/admin/agents/${agent.id}` : '#'}
      className={`flex flex-col overflow-hidden border ${
        isActive
          ? 'border-blue-500/25 bg-blue-500/[0.04]'
          : 'border-border bg-background/70'
      }`}
    >
      <div className="border-b border-border/60 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isActive ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ backgroundColor: color }} />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                </span>
              ) : (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
              )}
              <span className="text-[11px] font-medium text-foreground">{agent?.agentName || agent?.name || 'Agent'}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{isActive ? 'Live now' : 'Idle'}</span>
              <span>·</span>
              <span>{agent?.title || agent?.task || 'No active task'}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[10px] text-muted-foreground">
            {agent?.tasks || 0} tasks
          </span>
        </div>
      </div>
      {/* Mini log preview */}
      <div className="flex-1 p-3">
        <div className="font-mono text-[10px] leading-relaxed text-muted-foreground/60 space-y-0.5">
          {(agent?.recentLog?.length > 0)
            ? agent.recentLog.slice(0, 3).map((line, i) => (
                <div key={i} className="truncate">{line}</div>
              ))
            : <div className="text-muted-foreground/40 italic">No recent activity</div>
          }
        </div>
      </div>
    </Link>
  )
}

/* ─── Activity Row with Paperclip dashboard-activity-enter animation ─── */
function ActivityRow({ event, index }) {
  const elRef = useRef(null)

  useEffect(() => {
    const el = elRef.current
    if (el) {
      el.style.animation = `dashboard-activity-enter 0.4s ease-out both`
      el.style.animationDelay = `${index * 0.05}s`
    }
  }, [index])

  const ICONS = {
    lead: '📥',
    content: '✍️',
    task: '✅',
    alert: '⚠️',
    budget: '💰',
    deploy: '🚀',
    pipeline: '📊',
    'agent-running': '🟢',
    'agent-idle': '⚪',
    'agent-error': '🔴',
  }

  return (
    <div
      ref={elRef}
      className="px-4 py-3 text-sm text-foreground/80 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xs shrink-0">{ICONS[event.type] || event.icon || '📌'}</span>
        <div className="flex-1 min-w-0">
          <div className="truncate">{event.desc || event.summary}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {event.agent || event.agentName}{(event.agent || event.agentName) ? ' · ' : ''}{timeAgo(event.time || event.timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Budget Incident Banner (Paperclip exact style) ─── */
function BudgetBanner({ budget }) {
  if (!budget || !budget.exceeded) return null

  return (
    <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Budget exceeded — {budget.agentName} paused
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {budget.details || 'Monthly budget limit reached. Agent automatically paused.'}
        </p>
      </div>
      <Link
        href="/admin/settings"
        className="shrink-0 text-xs font-medium text-foreground hover:underline"
      >
        Review →
      </Link>
    </div>
  )
}

/* ─── Empty State ─── */
function EmptyState({ icon: Icon, title, description, action, actionHref }) {
  return (
    <div className="border border-border px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs mx-auto">{description}</p>
      )}
      {action && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border hover:bg-accent/50 transition-colors"
        >
          {action}
        </Link>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════ */
export default function Dashboard() {
  const {
    selectedCompany,
    loading: companyLoading,
    agentRuns,
    metrics,
    activity,
    agentsFull,
    pipelineStatus,
  } = useCompany()

  const [budgetAlert, setBudgetAlert] = useState(null)
  const [tasks, setTasks] = useState([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Fetch budget alerts and tasks when agents are loaded
  useEffect(() => {
    if (!companyLoading) {
      setDataLoaded(true)

      // Fetch tasks/workflows
      fetch('/api/workflows')
        .then(r => r.json())
        .then(data => {
          const list = data?.data || data?.tasks || data || []
          setTasks(Array.isArray(list) ? list.slice(0, 5) : [])
        })
        .catch(() => setTasks([]))

      // Check for budget alerts from agents with error/paused status
      const budgetIssues = agentsFull?.filter(a =>
        a.status === 'error' || a.status === 'paused'
      ) || []
      if (budgetIssues.length > 0) {
        setBudgetAlert({
          exceeded: true,
          agentName: budgetIssues[0].name || 'Agent',
          details: `${budgetIssues[0].name} is ${budgetIssues[0].status}. Check agent configuration.`,
        })
      }
    }
  }, [companyLoading, agentsFull])

  const showSkeleton = companyLoading || !dataLoaded

  // Company prefix for task IDs
  const prefix = selectedCompany?.issuePrefix || 'AA'

  // Build real metrics from context
  const realMetrics = useMemo(() => {
    const running = metrics?.runningAgents || 0
    const idle = metrics?.idleAgents || 0
    const error = metrics?.errorAgents || 0
    const total = metrics?.totalAgents || 0
    const activeClients = metrics?.activeClients || 0

    return [
      {
        icon: Bot,
        label: 'Agents Enabled',
        value: String(total),
        description: `${running} running, ${idle} idle, ${error} errors`,
        href: '/admin/agents',
      },
      {
        icon: CircleDot,
        label: 'Active Clients',
        value: String(activeClients),
        description: `${metrics?.totalClients || 0} total`,
        href: '/admin/crm',
      },
      {
        icon: DollarSign,
        label: 'Leads In Queue',
        value: String(metrics?.leadsInQueue || 0),
        description: 'Pipeline status',
        href: '/admin/crm',
      },
      {
        icon: ShieldCheck,
        label: 'Agents Online',
        value: String(metrics?.agentsOnline || 0),
        description: `${total > 0 ? Math.round((metrics?.agentsOnline || 0) / total * 100) : 0}% uptime`,
        href: '/admin/agents',
      },
    ]
  }, [metrics])

  // Map agentRuns to AgentRunCard format
  const agentsForDisplay = agentRuns || []

  // Map activity to ActivityRow format
  const activityForDisplay = (activity || []).slice(0, 8).map(a => ({
    type: a.type || 'task',
    desc: a.summary || '',
    time: a.timestamp || Date.now(),
    agent: a.agentName || '',
    icon: a.icon,
  }))

  // Map tasks to task rows
  const tasksForDisplay = (tasks || []).slice(0, 5).map((t, i) => ({
    id: `${prefix}-${i + 1}`,
    title: t.title || t.name || t.summary || 'Untitled task',
    agent: t.agent || t.assignee || t.assignedTo || 'System',
    time: t.time || t.createdAt || t.timestamp || Date.now(),
  }))

  // ─── Empty State: no company selected ───
  if (!companyLoading && !selectedCompany) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Bot}
          title="No workspace selected"
          description="Select or create a workspace to view the dashboard."
          action="Create Workspace"
          actionHref="/admin/settings"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Budget Incident Banner */}
      <BudgetBanner budget={budgetAlert} />

      {/* Active Agents Section (Paperclip ActiveAgentsPanel) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Active Agents
          </h3>
          <Link
            href="/admin/agents"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {showSkeleton
            ? Array.from({ length: 4 }).map((_, i) => <AgentRunCardSkeleton key={i} />)
            : agentsForDisplay.length === 0
              ? <EmptyState icon={Bot} title="No agents configured" description="Add agents to see them here." action="Add Agent" actionHref="/admin/agents" />
              : agentsForDisplay.map((agent) => (
                  <AgentRunCard
                    key={agent.id || agent.agentName}
                    agent={agent}
                    isActive={agent.status === 'running'}
                  />
                ))
          }
        </div>
      </div>

      {/* Metric Cards (Paperclip grid-cols-2 xl:grid-cols-4) */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Overview
        </h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-1 sm:gap-2">
          {showSkeleton
            ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : realMetrics.map((m) => <MetricCard key={m.label} {...m} />)
          }
        </div>
      </div>

      {/* 4 Chart Cards (Paperclip grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RunActivityChart activity={activity} metrics={metrics} />
        <PriorityChart agents={agentsFull} />
        <IssueStatusChart clients={[]} />
        <SuccessRateChart pipelineStatus={pipelineStatus} />
      </div>

      {/* Activity + Recent Tasks 2-column grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Recent Activity
          </h3>
          <div className="border border-border divide-y divide-border overflow-hidden">
            {showSkeleton
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-4 w-4 bg-muted/40 animate-pulse rounded shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-48 bg-muted/40 animate-pulse" />
                        <div className="h-3 w-24 bg-muted/30 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))
              : activityForDisplay.length === 0
                ? <div className="px-4 py-6 text-center text-xs text-muted-foreground/60 italic">No recent activity</div>
                : activityForDisplay.map((ev, i) => (
                    <ActivityRow key={i} event={ev} index={i} />
                  ))
            }
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent Tasks
            </h3>
            <Link
              href="/admin/dashboard/tickets"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="border border-border divide-y divide-border overflow-hidden">
            {showSkeleton
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-10 bg-muted/40 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-48 bg-muted/40 animate-pulse" />
                        <div className="h-3 w-32 bg-muted/30 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))
              : tasksForDisplay.length === 0
                ? <div className="px-4 py-6 text-center text-xs text-muted-foreground/60 italic">No recent tasks</div>
                : tasksForDisplay.map((task) => (
                    <Link
                      key={task.id}
                      href="/admin/dashboard/tickets"
                      className="px-4 py-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors no-underline text-inherit block"
                    >
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 flex items-center justify-center size-5 border border-border text-[10px] font-mono text-muted-foreground">{task.id}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{task.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-muted-foreground">{task.agent}</span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">{timeAgo(task.time)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
