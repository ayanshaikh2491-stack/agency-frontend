'use client'
import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, PauseCircle, BarChart3, CheckCircle2 } from 'lucide-react'

const BUDGET_DATA = {
  monthSpendCents: 247500,
  monthBudgetCents: 300000,
  monthUtilizationPercent: 82,
  daySpendCents: 82500,
  dayBudgetCents: 100000,
  activeIncidents: 2,
  pausedAgents: 1,
  pausedProjects: 0,
  pendingApprovals: 3,
  agents: [
    { name: 'Intake Researcher', spendCents: 52000, budgetCents: 60000, status: 'running', trend: 'up' },
    { name: 'Content Creator', spendCents: 38000, budgetCents: 50000, status: 'running', trend: 'stable' },
    { name: 'SEO Engine', spendCents: 29000, budgetCents: 40000, status: 'running', trend: 'down' },
    { name: 'Ads Runner', spendCents: 71000, budgetCents: 70000, status: 'paused', trend: 'up' },
    { name: 'Analytics Bot', spendCents: 18000, budgetCents: 30000, status: 'running', trend: 'stable' },
    { name: 'Sales Closer', spendCents: 22000, budgetCents: 35000, status: 'running', trend: 'up' },
    { name: 'Client Success', spendCents: 11000, budgetCents: 15000, status: 'running', trend: 'stable' },
    { name: 'Review QC', spendCents: 6500, budgetCents: 20000, status: 'idle', trend: 'down' },
  ],
  incidents: [
    { agent: 'Ads Runner', type: 'budget_exceeded', message: 'Monthly budget exceeded (101%). Agent auto-paused.', time: Date.now() - 7200000 },
    { agent: 'Content Creator', type: 'approval_pending', message: 'Budget override request awaiting review.', time: Date.now() - 18000000 },
  ],
}

const PENDING_APPROVALS = []

function formatCents(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function BudgetSummaryCard({ icon: Icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  )
}

function AgentBudgetRow({ agent }) {
  const pct = Math.round((agent.spendCents / agent.budgetCents) * 100)
  const over = pct > 100
  const near = pct > 80 && !over

  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors ${agent.status === 'paused' ? 'opacity-60' : ''}`}>
      <span className={`inline-flex h-2 w-2 rounded-full shrink-0 ${agent.status === 'running' ? 'bg-[var(--success)]' : agent.status === 'paused' ? 'bg-[var(--error)]' : 'bg-[var(--text-muted)]'}`} />
      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{agent.name}</span>
      <div className="w-32 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-[var(--error)]' : near ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs tabular-nums w-24 text-right ${over ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>{formatCents(agent.spendCents)} / {formatCents(agent.budgetCents)}</span>
      <span className={`text-xs font-medium w-10 text-right tabular-nums ${over ? 'text-[var(--error)]' : near ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>{pct}%</span>
      <span className="w-6 text-center">{agent.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5 text-[var(--error)] inline" /> : agent.trend === 'down' ? <TrendingDown className="h-3.5 w-3.5 text-[var(--success)] inline" /> : <span className="text-[var(--text-muted)]">—</span>}</span>
    </div>
  )
}

function IncidentBanner({ incident }) {
  return (
    <div className="border border-[var(--error)]/30 bg-[var(--error)]/5 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 text-[var(--error)] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{incident.agent} — {incident.type.replace('_', ' ')}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{incident.message}</p>
      </div>
      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{timeAgo(incident.time)}</span>
    </div>
  )
}

function ApprovalRow({ approval }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors">
      <span className="text-xs font-mono text-[var(--text-muted)] w-16">{approval.id}</span>
      <span className="flex-1 text-sm text-[var(--text-primary)]">{approval.agent}</span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">{approval.type.replace('_', ' ')}</span>
      <span className="text-sm font-medium tabular-nums text-[var(--text-primary)] w-16 text-right">{approval.amount}</span>
      <span className="text-[10px] text-[var(--text-muted)] w-16 text-right">{timeAgo(approval.requested)}</span>
      <div className="flex gap-1">
        <button className="px-2 py-1 text-[10px] font-medium bg-[var(--success)]/10 text-[var(--success)] rounded hover:bg-[var(--success)]/20 transition-colors">Approve</button>
        <button className="px-2 py-1 text-[10px] font-medium bg-[var(--error)]/10 text-[var(--error)] rounded hover:bg-[var(--error)]/20 transition-colors">Reject</button>
      </div>
    </div>
  )
}

export default function CostsPage() {
  const [activeTab, setActiveTab] = useState('budgets')
  const d = BUDGET_DATA

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Budgets & Costs</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Track spending across agents and projects</p>
        </div>
      </div>

      {d.activeIncidents > 0 && (
        <div className="space-y-2">{d.incidents.map((inc, i) => <IncidentBanner key={i} incident={inc} />)}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BudgetSummaryCard icon={DollarSign} label="Month Spend" value={formatCents(d.monthSpendCents)} sub={`${d.monthUtilizationPercent}% of ${formatCents(d.monthBudgetCents)} budget`} color={d.monthUtilizationPercent > 90 ? 'var(--error)' : 'var(--accent)'} />
        <BudgetSummaryCard icon={BarChart3} label="Daily Spend" value={formatCents(d.daySpendCents)} sub={`of ${formatCents(d.dayBudgetCents)} daily limit`} />
        <BudgetSummaryCard icon={PauseCircle} label="Paused Agents" value={d.pausedAgents} sub={`${d.pausedProjects} projects paused`} color="var(--error)" />
        <BudgetSummaryCard icon={CheckCircle2} label="Pending Approvals" value={d.pendingApprovals} sub="Awaiting board review" color="var(--warning)" />
      </div>

      <div className="flex gap-1.5 border-b border-[var(--border)]">
        {[{ id: 'budgets', label: 'Agent Budgets' }, { id: 'approvals', label: `Approvals (${PENDING_APPROVALS.length})` }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-[var(--accent)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'budgets' && (
        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            <span className="w-2" /><span className="flex-1">Agent</span><span className="w-32">Budget</span><span className="w-24 text-right">Spend</span><span className="w-10 text-right">%</span><span className="w-6 text-center">Trend</span>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">{d.agents.map(agent => <AgentBudgetRow key={agent.name} agent={agent} />)}</div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            <span className="w-16">ID</span><span className="flex-1">Agent</span><span className="w-28">Type</span><span className="w-16 text-right">Amount</span><span className="w-16 text-right">Time</span><span className="w-28">Actions</span>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">{PENDING_APPROVALS.map(a => <ApprovalRow key={a.id} approval={a} />)}</div>
          {PENDING_APPROVALS.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No pending approvals</div>}
        </div>
      )}
    </div>
  )
}
