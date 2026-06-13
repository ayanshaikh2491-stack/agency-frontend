'use client'

const STATUS_CONFIG = {
  open:       { dot: 'bg-[var(--accent)]',    label: 'Open' },
  in_progress:{ dot: 'bg-[var(--info)]',       label: 'In Progress' },
  done:       { dot: 'bg-[var(--success)]',    label: 'Done' },
  blocked:    { dot: 'bg-[var(--error)]',      label: 'Blocked' },
  cancelled:  { dot: 'bg-[var(--text-muted)]', label: 'Cancelled' },
}

const BLOCKER = { attention: 'ring-2 ring-[var(--warning)] animate-pulse', critical: 'ring-2 ring-[var(--error)] animate-pulse', none: '' }

export function StatusIcon({ status = 'open', blockerAttention = 'none', size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open
  const blk = BLOCKER[blockerAttention] || BLOCKER.none
  const s = size === 'lg' ? 'h-3 w-3' : 'h-2 w-2'
  return (
    <span className={`relative inline-flex ${s} shrink-0`} title={`${cfg.label}${blk ? ' — attention' : ''}`}>
      {blk && <span className={`absolute inset-0 rounded-full ${blk.includes('error') ? 'bg-[var(--error)]' : 'bg-[var(--warning)]'} opacity-50`} />}
      <span className={`relative inline-flex ${s} rounded-full ${cfg.dot} ${blk}`} />
    </span>
  )
}
