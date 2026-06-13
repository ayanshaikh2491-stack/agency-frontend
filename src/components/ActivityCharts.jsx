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

/* ─── 1. Run Activity Chart (Paperclip AreaChart) ─── */
export function RunActivityChart({ data }) {
  const now = Date.now()
  const chartData = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    chartData.push({
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      runs: Math.floor(Math.random() * 50) + 10,
    })
  }

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

/* ─── 2. Priority Chart (Bar) ─── */
export function PriorityChart() {
  const data = [
    { name: 'Urgent', value: 3 },
    { name: 'High', value: 7 },
    { name: 'Medium', value: 12 },
    { name: 'Low', value: 5 },
  ]

  return (
    <ChartShell title="Tasks by Priority" subtitle="Current">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={['var(--error)', 'var(--warning)', 'var(--accent)', 'var(--text-muted)'][i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

/* ─── 3. Issue Status Chart (Pie) ─── */
export function IssueStatusChart() {
  const data = [
    { name: 'Open', value: 8 },
    { name: 'In Progress', value: 5 },
    { name: 'Done', value: 12 },
    { name: 'Blocked', value: 2 },
  ]

  return (
    <ChartShell title="Tasks by Status" subtitle="Current">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
            {data.map((_, i) => (
              <Cell key={i} fill={['var(--accent)', 'var(--info)', 'var(--success)', 'var(--warning)'][i]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

/* ─── 4. Success Rate Chart (Area) ─── */
export function SuccessRateChart() {
  const now = Date.now()
  const data = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const rate = 70 + Math.random() * 25
    data.push({
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      rate: Math.round(rate),
    })
  }

  return (
    <ChartShell title="Success Rate" subtitle="Last 14 days">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[11px]">
                <p className="font-medium text-[var(--text-primary)]">{payload[0].payload.date}</p>
                <p style={{ color: 'var(--success)' }}>Success: {payload[0].value}%</p>
              </div>
            )
          }} />
          <Area type="monotone" dataKey="rate" stroke="var(--success)" strokeWidth={2} fill="url(#gradSuccess)" name="Rate" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}
