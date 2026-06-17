'use client'
import { useState } from 'react'
import { ShieldCheck, CheckCircle2, XCircle, Bot } from 'lucide-react'

const APPROVALS = []

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function StatusBadge({ status }) {
  const cfg = {
    pending: { bg: 'bg-[var(--warning)]/10', text: 'text-[var(--warning)]', label: 'Pending' },
    approved: { bg: 'bg-[var(--success)]/10', text: 'text-[var(--success)]', label: 'Approved' },
    rejected: { bg: 'bg-[var(--error)]/10', text: 'text-[var(--error)]', label: 'Rejected' },
  }
  const c = cfg[status] || cfg.pending
  return <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
}

function PriorityBadge({ priority }) {
  const cfg = { high: 'bg-[var(--error)]/10 text-[var(--error)]', medium: 'bg-[var(--warning)]/10 text-[var(--warning)]', low: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]' }
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg[priority]}`}>{priority}</span>
}

export default function ApprovalsPage() {
  const [filter, setFilter] = useState('pending')
  const [expandedId, setExpandedId] = useState(null)
  const filtered = APPROVALS.filter(a => filter === 'all' || a.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Approvals</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Review and approve agent requests</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-[var(--accent)] font-medium">{APPROVALS.filter(a => a.status === 'pending').length} pending</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] p-4">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-semibold text-[var(--warning)] mt-1">{APPROVALS.filter(a => a.status === 'pending').length}</p>
        </div>
        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] p-4">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-semibold text-[var(--success)] mt-1">{APPROVALS.filter(a => a.status === 'approved').length}</p>
        </div>
        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] p-4">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-semibold text-[var(--error)] mt-1">{APPROVALS.filter(a => a.status === 'rejected').length}</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${filter === f ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left">
              <span className="text-xs font-mono text-[var(--text-muted)] w-16">{a.id}</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Bot className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                <span className="text-sm text-[var(--text-primary)] truncate">{a.agent}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">{a.type}</span>
              <span className="text-sm font-medium tabular-nums text-[var(--text-primary)] w-16 text-right">{a.amount}</span>
              <PriorityBadge priority={a.priority} />
              <StatusBadge status={a.status} />
              <span className="text-[10px] text-[var(--text-muted)] w-16 text-right">{timeAgo(a.requested)}</span>
            </button>
            {expandedId === a.id && (
              <div className="border-t border-[var(--border)] px-4 py-4 bg-[var(--bg-elevated)]">
                <p className="text-sm text-[var(--text-secondary)] mb-3">{a.reason}</p>
                {a.status === 'pending' && (
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[var(--success)]/10 text-[var(--success)] rounded hover:bg-[var(--success)]/20 transition-colors"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[var(--error)]/10 text-[var(--error)] rounded hover:bg-[var(--error)]/20 transition-colors"><XCircle className="h-4 w-4" /> Reject</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] px-6 py-10 text-center">
            <ShieldCheck className="h-8 w-8 text-[var(--text-muted)]/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-primary)]">No approvals</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Nothing to review right now</p>
          </div>
        )}
      </div>
    </div>
  )
}
