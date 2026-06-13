'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, CircleDot, DollarSign, ShieldCheck, AlertTriangle, Sparkles, Activity as ActivityIcon, Clock } from 'lucide-react'
import { useCompany } from '@/lib/client-context'

/* ═══════════════════════════════════════════════
   Paperclip-Exact Dashboard
   Source: github.com/paperclipai/paperclip/ui/src/pages/Dashboard.tsx
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
function AgentRunCard({ agent, isActive, status }) {
  const statusColors = {
    running: '#3b82f6',
    idle: '#b4b4b4',
    paused: 'var(--error)',
    error: 'var(--error)',
    active: '#4ade80',
  }
  const color = statusColors[status] || '#b4b4b4'

  return (
    <Link
      href={agent?.route || '#'}
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
              <span className="text-[11px] font-medium text-foreground">{agent?.name || 'Agent'}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{isActive ? 'Live now' : 'Idle'}</span>
              <span>·</span>
              <span>{agent?.task || 'No active task'}</span>
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
    // Apply entrance animation on mount with stagger delay
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
  }

  return (
    <div
      ref={elRef}
      className="px-4 py-3 text-sm text-foreground/80 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xs shrink-0">{ICONS[event.type] || '📌'}</span>
        <div className="flex-1 min-w-0">
          <div className="truncate">{event.desc}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {event.agent} · {timeAgo(event.time)}
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
   MOCK DATA — will be replaced by API
   ═══════════════════════════════════════════════ */
const MOCK_METRICS = [
  {
    icon: Bot,
    label: 'Agents Enabled',
    value: '10',
    description: '6 running, 2 paused, 0 errors',
    href: '/admin/agents',
  },
  {
    icon: CircleDot,
    label: 'Tasks In Progress',
    value: '24',
    description: '18 open, 3 blocked',
    href: '/admin/dashboard/tickets',
  },
  {
    icon: DollarSign,
    label: 'Month Revenue',
    value: '$12.4k',
    description: '78% of $16k target',
    href: '/admin/costs',
  },
  {
    icon: ShieldCheck,
    label: 'Pending Approvals',
    value: '4',
    description: '2 budget overrides awaiting review',
    href: '/admin/approvals',
  },
]

const MOCK_AGENTS = [
  { name: 'CEO Console', status: 'running', tasks: 3, route: '/admin/agents/ceo-console', recentLog: ['→ Delegated research to Intake', '✓ Lead scoring complete', '→ Waiting for Content Creator'] },
  { name: 'Intake Researcher', status: 'running', tasks: 5, route: '/admin/agents/intake', recentLog: ['🔍 Searching for leads...', '✓ Found 12 new prospects', '→ Enriching contact data'] },
  { name: 'Content Creator', status: 'idle', tasks: 1, route: '/admin/agents/content', recentLog: ['✍️ Drafting blog post...', '✓ SEO optimization done', '→ Awaiting approval'] },
  { name: 'Sales Close', status: 'running', tasks: 2, route: '/admin/agents/sales', recentLog: ['📧 Sent follow-up to Acme Corp', '✓ Demo scheduled for Friday', '→ Preparing proposal'] },
  { name: 'Review QC', status: 'running', tasks: 4, route: '/admin/agents/qc', recentLog: ['✅ Content review passed', '✓ No issues found', '→ Moving to publish queue'] },
]

const MOCK_ACTIVITY = [
  { type: 'lead', desc: 'New lead captured from Google Ads', time: Date.now() - 2 * 60000, agent: 'Intake Researcher' },
  { type: 'content', desc: 'Blog post "AI in 2026" published', time: Date.now() - 8 * 60000, agent: 'Content Creator' },
  { type: 'task', desc: 'Sales outreach to Acme Corp completed', time: Date.now() - 15 * 60000, agent: 'Sales Close' },
  { type: 'alert', desc: 'SEO Optimizer paused — budget exceeded', time: Date.now() - 32 * 60000, agent: 'Ads Manager' },
  { type: 'lead', desc: 'New lead from LinkedIn campaign', time: Date.now() - 45 * 60000, agent: 'Intake Researcher' },
  { type: 'task', desc: 'Client Onboarding — DesignCo signed off', time: Date.now() - 60 * 60000, agent: 'Client Success' },
  { type: 'content', desc: 'SEO audit for blog completed', time: Date.now() - 120 * 60000, agent: 'Review QC' },
  { type: 'alert', desc: 'Analytics report generated', time: Date.now() - 180 * 60000, agent: 'Analytics Engine' },
]

const MOCK_TASKS = [
  { id: 'AA-1', title: 'Research top 10 real estate agencies in Dubai', agent: 'Intake Researcher', time: Date.now() - 2 * 3600000 },
  { id: 'AA-2', title: 'Draft cold email campaign for luxury real estate', agent: 'Content Creator', time: Date.now() - 4 * 3600000 },
  { id: 'AA-3', title: 'Follow up with Acme Corp for demo scheduling', agent: 'Sales Close', time: Date.now() - 5 * 3600000 },
  { id: 'AA-4', title: 'SEO audit for agency blog — keyword analysis', agent: 'Review QC', time: Date.now() - 8 * 3600000 },
  { id: 'AA-5', title: 'Budget review — Ads Manager paused due to limits', agent: 'CEO Console', time: Date.now() - 12 * 3600000 },
]

// ─── Simulated loading ───
function useSimulatedLoading(delay = 800) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return ready
}

/* ═══════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════ */
export default function Dashboard() {
  const { selectedCompany, loading: companyLoading } = useCompany()
  const loaded = useSimulatedLoading(600)
  const showSkeleton = companyLoading || !loaded

  // Budget banner state (simulated)
  const budgetAlert = {
    exceeded: true,
    agentName: 'Ads Manager',
    details: 'Monthly budget limit of $2,500 reached. Agent auto-paused at 100%.',
  }

  // Company prefix for task IDs
  const prefix = selectedCompany?.issuePrefix || 'AA'

  // Derive running count from mock agents
  const runningCount = MOCK_AGENTS.filter(a => a.status === 'running').length

  // Enhanced metrics with dynamic data
  const metrics = useMemo(() => [
    {
      ...MOCK_METRICS[0],
      description: `${runningCount} running, ${MOCK_AGENTS.filter(a => a.status === 'paused').length} paused, ${MOCK_AGENTS.filter(a => a.status === 'error').length} errors`,
    },
    MOCK_METRICS[1],
    MOCK_METRICS[2],
    MOCK_METRICS[3],
  ], [runningCount])

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
            : MOCK_AGENTS.map((agent) => (
                <AgentRunCard
                  key={agent.name}
                  agent={agent}
                  isActive={agent.status === 'running'}
                  status={agent.status}
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
            : metrics.map((m) => <MetricCard key={m.label} {...m} />)
          }
        </div>
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
              : MOCK_ACTIVITY.map((ev, i) => (
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
              : MOCK_TASKS.map((task) => (
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
