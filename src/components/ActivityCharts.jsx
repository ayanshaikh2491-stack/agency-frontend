'use client'

import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/* ─── Chart wrapper (Paperclip style) ─── */
function ChartShell({ title, subtitle, children }) {
  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{title}</p>
        {subtitle && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/* ─── Shared tooltip ─── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[11px]">
      {payload.map((p, i) => (
        <p key={i} className="text-[var(--text-secondary)]" style={{ color: p.fill || p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

/* ─── Empty state ─── */
function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[200px] text-[11px] text-[var(--text-muted)] italic">
      No data yet — agents need to run tasks first
    </div>
  )
}

/* ─── 1. Run Activity Chart (Area) ─── */
export function RunActivityChart({ activity, metrics }) {
  if (!activity || activity.length === 0) {
    return (
      <ChartShell title="Run Activity" subtitle="Last 14 days">
        <EmptyChart />
      </ChartShell>
    )
  }
  const chartData = activity.slice(0, 14).map((a, i) => ({
    date: a.timestamp ? new Date(a.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : `Day ${14 - i}`,
    runs: a.count || 1,
  }))
  return (
    <ChartShell title="Run Activity" subtitle="Last 14 days">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradRuns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="runs" stroke="var(--accent)" strokeWidth={2} fill="url(#gradRuns)" name="Runs" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

/* ─── 2. Priority Chart (Bar) — uses real agent status ─── */
export function PriorityChart({ agents }) {
  const running = agents?.filter(a => a.status === 'active' || a.status === 'running').length || 0
  const idle = agents?.filter(a => a.status === 'idle').length || 0
  const error = agents?.filter(a => a.status === 'error').length || 0
  const total = agents?.length || 0
  if (total === 0) {
    return <ChartShell title="Agent Status" subtitle="Current"><EmptyChart /></ChartShell>
  }
  const data = [
    { name: 'Running', value: running },
    { name: 'Idle', value: idle },
    { name: 'Error', value: error },
  ]
  return (
    <ChartShell title="Agent Status" subtitle={`${total} total`}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={['var(--success)', 'var(--text-muted)', 'var(--error)'][i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

/* ─── 3. Issue Status Chart (Pie) — uses real client data ─── */
export function IssueStatusChart({ clients }) {
  const active = clients?.filter(c => c.status === 'active').length || 0
  const total = clients?.length || 0
  if (total === 0) {
    return <ChartShell title="Clients" subtitle="Current"><EmptyChart /></ChartShell>
  }
  const data = [
    { name: 'Active', value: active },
    { name: 'Other', value: total - active },
  ]
  return (
    <ChartShell title="Clients" subtitle={`${total} total`}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
            <Cell fill="var(--success)" />
            <Cell fill="var(--text-muted)" />
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

/* ─── 4. Success Rate Chart — uses pipeline status ─── */
export function SuccessRateChart({ pipelineStatus }) {
  if (!pipelineStatus) {
    return <ChartShell title="Pipeline Status" subtitle="Current"><EmptyChart /></ChartShell>
  }
  const queue = pipelineStatus.queue?.total || 0
  const processed = pipelineStatus.processed || 0
  return (
    <ChartShell title="Pipeline" subtitle="Current">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">Queue</span>
          <span className="font-mono">{queue}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">Processed</span>
          <span className="font-mono">{processed}</span>
        </div>
        {queue > 0 && (
          <div className="w-full bg-[var(--border)] rounded-full h-2 mt-2">
            <div className="h-2 rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.min(100, (processed / (queue + processed)) * 100)}%` }} />
          </div>
        )}
      </div>
    </ChartShell>
  )
}
