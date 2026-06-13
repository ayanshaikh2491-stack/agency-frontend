'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  RefreshCw, Calendar, History, BarChart3, Play, CheckCircle2, XCircle,
  Clock, Activity, AlertTriangle, Zap, ChevronRight, Power,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

function uid() { return 'r' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) }
function ts() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }

const PAPERCLIP_BUBBLE = 'min-w-0 max-w-[85%] break-words px-3 py-2 text-sm overflow-x-auto overflow-y-visible'

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className={PAPERCLIP_BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'}>
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  )
}

function renderMD(text) {
  var h = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function(_, lang, code) {
    var esc = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return '<pre class="bg-[var(--background)] border border-[var(--border)]/50 rounded p-3 my-2 text-[12px] leading-relaxed text-emerald-400/90 font-mono overflow-x-auto">' + esc + '</pre>'
  })
  h = h.replace(/`([^`]+)`/g, '<code class="bg-[var(--background)]/80 text-[var(--muted-foreground)] px-1.5 py-0.5 rounded text-[12px] font-mono border border-[var(--border)]/40">$1</code>')
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  h = h.replace(/\n/g, '<br>')
  return h
}

function AgentBubbleHeader({ emoji, name }) {
  return (
    <div className="mb-1 flex items-center gap-1.5 pl-1">
      <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none">{emoji}</div>
      <span className="text-sm font-medium text-[var(--foreground)]">{name}</span>
    </div>
  )
}

/* ─── MOCK ROUTINES DATA ─── */

const ROUTINES = [
  { id: 'speed-to-lead', name: 'Speed-to-Lead', schedule: 'Every 5 min', lastRun: '2 min ago', nextRun: '3 min', enabled: true, emoji: '⚡' },
  { id: 'social-auto-post', name: 'Social Auto-Post', schedule: 'Daily 9AM, 12PM, 6PM', lastRun: '1h ago', nextRun: 'Tomorrow 9AM', enabled: true, emoji: '📱' },
  { id: 'ad-perf-check', name: 'Ad Perf Check', schedule: 'Every 30 min', lastRun: '12 min ago', nextRun: '18 min', enabled: true, emoji: '📊' },
  { id: 'weekly-seo-audit', name: 'Weekly SEO Audit', schedule: 'Every Mon 8AM', lastRun: '2 days ago', nextRun: 'Mon 8AM', enabled: true, emoji: '🔍' },
  { id: 'daily-lead-enrich', name: 'Daily Lead Enrichment', schedule: 'Daily 7AM', lastRun: '19h ago', nextRun: 'Tomorrow 7AM', enabled: true, emoji: '🧠' },
  { id: 'content-publish', name: 'Content Publishing', schedule: 'Daily 10AM, 3PM', lastRun: '6h ago', nextRun: 'Tomorrow 10AM', enabled: false, emoji: '✍️' },
]

const HISTORY_RUNS = [
  { id: 'h1', routine: 'Speed-to-Lead', status: 'ok', ts: '2026-06-13 14:02:00', duration: '12s' },
  { id: 'h2', routine: 'Ad Perf Check', status: 'ok', ts: '2026-06-13 13:58:00', duration: '8s' },
  { id: 'h3', routine: 'Social Auto-Post', status: 'ok', ts: '2026-06-13 13:45:00', duration: '1m 23s' },
  { id: 'h4', routine: 'Speed-to-Lead', status: 'fail', ts: '2026-06-13 13:40:00', duration: '30s' },
  { id: 'h5', routine: 'Daily Lead Enrichment', status: 'ok', ts: '2026-06-13 13:30:00', duration: '2m 10s' },
  { id: 'h6', routine: 'Ad Perf Check', status: 'ok', ts: '2026-06-13 13:28:00', duration: '9s' },
  { id: 'h7', routine: 'Speed-to-Lead', status: 'ok', ts: '2026-06-13 13:22:00', duration: '11s' },
  { id: 'h8', routine: 'Content Publishing', status: 'fail', ts: '2026-06-13 13:15:00', duration: '45s' },
  { id: 'h9', routine: 'Social Auto-Post', status: 'ok', ts: '2026-06-13 13:00:00', duration: '1m 05s' },
  { id: 'h10', routine: 'Ad Perf Check', status: 'ok', ts: '2026-06-13 12:58:00', duration: '7s' },
  { id: 'h11', routine: 'Speed-to-Lead', status: 'ok', ts: '2026-06-13 12:52:00', duration: '13s' },
  { id: 'h12', routine: 'Weekly SEO Audit', status: 'ok', ts: '2026-06-13 12:30:00', duration: '4m 20s' },
  { id: 'h13', routine: 'Daily Lead Enrichment', status: 'ok', ts: '2026-06-13 12:25:00', duration: '1m 55s' },
  { id: 'h14', routine: 'Speed-to-Lead', status: 'ok', ts: '2026-06-13 12:22:00', duration: '10s' },
  { id: 'h15', routine: 'Ad Perf Check', status: 'fail', ts: '2026-06-13 12:20:00', duration: '15s' },
]

const PERF_DATA = [
  { day: 'Mon', success: 94, duration: 2.1 },
  { day: 'Tue', success: 97, duration: 1.8 },
  { day: 'Wed', success: 91, duration: 2.7 },
  { day: 'Thu', success: 96, duration: 2.0 },
  { day: 'Fri', success: 93, duration: 2.4 },
  { day: 'Sat', success: 88, duration: 3.1 },
  { day: 'Sun', success: 85, duration: 3.5 },
]

const FAILURE_BREAKDOWN = [
  { name: 'API Timeout', value: 42, color: 'var(--error)' },
  { name: 'Rate Limited', value: 28, color: 'oklch(0.75 0.18 40)' },
  { name: 'Auth Expired', value: 18, color: '#eab308' },
  { name: 'Data Error', value: 12, color: '#a855f7' },
]

function formatNum(n) { if (!n) return '0'; if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(1) + 'K'; return n.toLocaleString() }

const SUGGESTIONS = [
  { label: '▶ Run all routines', prompt: 'Run all routines now' },
  { label: '📅 Check schedule', prompt: 'Show me the routine schedule' },
  { label: '📋 View history', prompt: 'Show recent run history' },
  { label: '⏸ Pause failed', prompt: 'Pause routines that failed recently' },
]

/* ─── TAB COMPONENT: Overview ─── */
function TabOverview({ routines, historyRuns }) {
  const active = routines.filter(r => r.enabled).length
  const completedToday = historyRuns.filter(h => {
    const today = new Date().toISOString().slice(0, 10)
    return h.ts.startsWith(today) && h.status === 'ok'
  }).length
  const avgDuration = '2.4m'
  const successRuns = historyRuns.filter(h => h.status === 'ok').length
  const successRate = historyRuns.length ? Math.round((successRuns / historyRuns.length) * 100) : 0

  const cards = [
    { label: 'Active Routines', value: active, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Completed Today', value: completedToday, icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Avg Duration', value: avgDuration, icon: Clock, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
    { label: 'Success Rate', value: successRate + '%', icon: BarChart3, color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
  ]

  return (
    <div className="space-y-3">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map(m => (
          <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider">{m.label}</span>
              <div className={'rounded-full p-1.5 ' + m.bg}>
                <m.icon className={'h-3 w-3 ' + m.color} />
              </div>
            </div>
            <p className={'text-lg font-bold ' + m.color}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar — Overall health */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">System Health</span>
          <span className="text-[10px] text-emerald-400">{successRate}% success rate</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: successRate + '%' }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[9px] text-[var(--muted-foreground)]">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Routine health mini-list */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-2 block">Routine Health</span>
        <div className="space-y-1.5">
          {routines.map(r => {
            const lastStatus = historyRuns.find(h => h.routine === r.name)
            const isHealthy = lastStatus?.status === 'ok' || !lastStatus
            return (
              <div key={r.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${r.enabled ? (isHealthy ? 'bg-emerald-500' : 'bg-red-500') : 'bg-[var(--muted-foreground)]'}`} />
                  <span className="text-[11px] text-[var(--foreground)]">{r.emoji} {r.name}</span>
                </div>
                <span className="text-[9px] text-[var(--muted-foreground)]">{r.schedule}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── TAB COMPONENT: Scheduler ─── */
function TabScheduler({ routines, onToggle }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
              <th className="text-left px-3 py-2.5 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">Routine</th>
              <th className="text-left px-3 py-2.5 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">Schedule</th>
              <th className="text-left px-3 py-2.5 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">Last Run</th>
              <th className="text-left px-3 py-2.5 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">Next Run</th>
              <th className="text-center px-3 py-2.5 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {routines.map(r => {
              const lastHistory = HISTORY_RUNS.find(h => h.routine === r.name)
              const lastOk = lastHistory?.status === 'ok'
              return (
                <tr key={r.id} className="hover:bg-[var(--background)]/30 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{r.emoji}</span>
                      <span className="text-[var(--foreground)] font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[var(--muted-foreground)]">{r.schedule}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      {lastHistory && (
                        <span className={`h-1.5 w-1.5 rounded-full ${lastOk ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      )}
                      <span className="text-[var(--muted-foreground)]">{r.lastRun}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[var(--muted-foreground)]">{r.nextRun}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggle(r.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                        r.enabled ? 'bg-emerald-500' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                          r.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── TAB COMPONENT: History ─── */
function TabHistory({ historyRuns }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Run Log — Last 15 Runs</span>
        <span className="text-[9px] text-[var(--muted-foreground)]">{historyRuns.length} entries</span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {historyRuns.map((h, i) => (
          <div key={h.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--background)]/30 transition-colors">
            {h.status === 'ok' ? (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              </div>
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400/10">
                <XCircle className="h-3 w-3 text-red-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--foreground)] font-medium">{h.routine}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  h.status === 'ok' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                }`}>
                  {h.status === 'ok' ? 'OK' : 'FAIL'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[var(--muted-foreground)]">{h.ts}</span>
                <span className="text-[9px] text-[var(--muted-foreground)]">·</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">{h.duration}</span>
              </div>
            </div>
            <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── TAB COMPONENT: Performance ─── */
function TabPerformance() {
  return (
    <div className="space-y-3">
      {/* Success Rate Chart */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-2 block">Success Rate (7 days)</span>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PERF_DATA}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Line type="monotone" dataKey="success" stroke="#4ade80" strokeWidth={2} dot={{ r: 3, fill: '#4ade80' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Avg Duration Chart */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-2 block">Avg Duration by Day (min)</span>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PERF_DATA}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Bar dataKey="duration" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Failure Breakdown */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-2 block">Failure Breakdown</span>
        <div className="flex items-center gap-6">
          <div className="h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={FAILURE_BREAKDOWN}
                  cx="50%" cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {FAILURE_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {FAILURE_BREAKDOWN.map(f => (
              <div key={f.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: f.color }} />
                <span className="text-[11px] text-[var(--muted-foreground)] flex-1">{f.name}</span>
                <span className="text-[11px] text-[var(--foreground)] font-mono">{f.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN ROUTINES PAGE ─── */
export default function RoutinesPage() {
  var [msgs, setMsgs] = useState([])
  var [input, setInput] = useState('')
  var [sending, setSending] = useState(false)
  var [welcomeRevealed, setWelcomeRevealed] = useState(false)
  var [chipsRevealed, setChipsRevealed] = useState(false)
  var [selectedTab, setSelectedTab] = useState('overview')
  var [routines, setRoutines] = useState(ROUTINES)
  var bottomRef = useRef(null)
  var inputRef = useRef(null)
  var scrollRef = useRef(null)
  var keepScrolled = useRef(true)

  var safeScroll = useCallback(function () {
    if (!keepScrolled.current || !bottomRef.current) return
    bottomRef.current.scrollIntoView({ block: 'end' })
  }, [])

  useEffect(function () { safeScroll() }, [msgs.length])

  useEffect(function () {
    var el = scrollRef.current
    if (!el) return
    var onScroll = function () {
      keepScrolled.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 40
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return function () { el.removeEventListener('scroll', onScroll) }
  }, [])

  useEffect(function () {
    if (welcomeRevealed) return
    var t1 = setTimeout(function () { setWelcomeRevealed(true) }, 1500)
    return function () { clearTimeout(t1) }
  }, [welcomeRevealed])

  useEffect(function () {
    if (!welcomeRevealed || chipsRevealed) return
    var t2 = setTimeout(function () { setChipsRevealed(true) }, 500)
    return function () { clearTimeout(t2) }
  }, [welcomeRevealed, chipsRevealed])

  function toggleRoutine(id) {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  async function callAgent(text) {
    try {
      var l = text.toLowerCase()

      if (l.includes('run all') || l.includes('all routine')) {
        var enabled = routines.filter(r => r.enabled)
        return '**▶ Running All Routines**\n\n' +
          enabled.map(r => '• ' + r.emoji + ' **' + r.name + '** — triggered').join('\n') +
          '\n\n' + enabled.length + ' routines dispatched. Check back shortly for results.'
      }

      if (l.includes('schedule') || l.includes('when') || l.includes('next run')) {
        return '**📅 Routine Schedule**\n\n' +
          routines.map(r =>
            '• ' + r.emoji + ' **' + r.name + '**\n  Schedule: ' + r.schedule + '\n  Next run: ' + r.nextRun + (r.enabled ? '' : ' ⏸️ Paused')
          ).join('\n\n')
      }

      if (l.includes('history') || l.includes('recent') || l.includes('log')) {
        var recent = HISTORY_RUNS.slice(0, 8)
        return '**📋 Recent Run History (last 8)**\n\n' +
          recent.map(h =>
            '• ' + (h.status === 'ok' ? '✅' : '❌') + ' **' + h.routine + '** — ' + h.ts + ' (' + h.duration + ')'
          ).join('\n') +
          '\n\n*Showing ' + recent.length + ' of ' + HISTORY_RUNS.length + ' total runs*'
      }

      if (l.includes('pause') || l.includes('failed')) {
        var failed = routines.filter(r => {
          var last = HISTORY_RUNS.find(h => h.routine === r.name)
          return last?.status === 'fail' && r.enabled
        })
        if (failed.length === 0) return '✅ No failed routines currently running. All good!'
        setRoutines(prev => prev.map(r => failed.find(f => f.id === r.id) ? { ...r, enabled: false } : r))
        return '**⏸ Paused Failed Routines**\n\n' +
          failed.map(r => '• ' + r.emoji + ' **' + r.name + '** — paused').join('\n') +
          '\n\n' + failed.length + ' routine(s) paused due to recent failures.'
      }

      // Generic response
      var active = routines.filter(r => r.enabled).length
      return '**⟳ Routines Manager**\n\n' +
        'Currently **' + active + '/' + routines.length + '** routines active.\n\n' +
        '**What can I do?**\n' +
        '▶ **Run all routines** — Trigger every active routine now\n' +
        '📅 **Check schedule** — View all routine schedules\n' +
        '📋 **View history** — See recent run logs\n' +
        '⏸ **Pause failed** — Auto-pause routines with failures'
    } catch (e) {
      return 'Checking routines for you... ⟳'
    }
  }

  var send = useCallback(async function (override) {
    var text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')

    var userMsg = { id: uid(), role: 'user', content: text, time: ts() }
    setMsgs(function (p) { return p.concat([userMsg]) })
    setSending(true)
    setWelcomeRevealed(true)
    setChipsRevealed(true)

    var reply = await callAgent(text)

    await new Promise(function (r) { setTimeout(r, 400 + Math.random() * 500) })
    setSending(false)
    setMsgs(function (p) { return p.concat([{ id: uid(), role: 'assistant', content: reply, time: ts() }]) })
  }, [input, sending, routines])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  var welcomeBody = 'Hey! I\'m your **Routines Manager** ⟳\n\nI oversee all recurring automation tasks — lead handling, content publishing, ad checks, SEO audits, and more.\n\n**What do you need?**\n▶ **Run all routines** — Trigger every active routine right now\n📅 **Check schedule** — View when routines are scheduled\n📋 **View history** — See recent run logs and statuses\n⏸ **Pause failed** — Auto-pause routines that are failing'

  var activeCount = routines.filter(r => r.enabled).length
  var totalCount = routines.length
  var recentFails = HISTORY_RUNS.filter(h => h.status === 'fail').length

  const TABS = [
    { id: 'overview', label: '🕵️ Overview' },
    { id: 'scheduler', label: '📅 Scheduler' },
    { id: 'history', label: '📋 History' },
    { id: 'performance', label: '📈 Performance' },
  ]

  return (
    <div className="flex h-[calc(100%+2rem)] flex-col -m-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* ─── LEFT: Chat ─── */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-[45%] shrink-0 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                <span className="text-sm">⟳</span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Routines</h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">● Live</span>
                </div>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{activeCount} active · {totalCount} total · {recentFails} recent fails</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="relative min-h-0 min-w-0 flex-1">
            <div ref={scrollRef} className="scrollbar-auto-hide absolute inset-0 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col gap-3 px-6 pt-3 pb-32">
                {!welcomeRevealed && <TypingBubble />}

                {welcomeRevealed && (
                  <>
                    <div className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="⟳" name="Routines Manager" />
                      <div className={PAPERCLIP_BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'}>
                        <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMD(welcomeBody) }} />
                      </div>
                    </div>
                    {chipsRevealed && (
                      <div className="flex flex-wrap gap-2 pl-1">
                        {SUGGESTIONS.map(function (chip) {
                          return (
                            <button key={chip.label} type="button" onClick={function () { setInput(chip.prompt); if (inputRef.current) inputRef.current.focus() }}
                              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors duration-150 hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]">
                              {chip.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {msgs.map(function (m) {
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="flex flex-col items-end gap-1">
                        <div className={PAPERCLIP_BUBBLE + ' bg-primary text-white [border-radius:14px_14px_4px_14px]'}>{m.content}</div>
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="⟳" name="Routines Manager" />
                      <div className={PAPERCLIP_BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'}>
                        <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMD(m.content) }} />
                      </div>
                    </div>
                  )
                })}

                {sending && <TypingBubble />}

                <div ref={bottomRef} />
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/95 to-[var(--card)]/0 px-6 pt-6 pb-5">
            <div className="pointer-events-auto relative rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 pb-2 pt-3 shadow-lg transition-colors focus-within:border-[var(--muted-foreground)]/60">
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={function (e) { setInput(e.target.value) }} onKeyDown={handleKeyDown}
                  placeholder="Ask your Routines Manager..." rows={1}
                  className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none scrollbar-none" disabled={sending} />
                <div className="flex shrink-0 items-center gap-1 pb-0.5">
                  <button type="button" onClick={function () { send() }} disabled={!input.trim() || sending}
                    className="rounded-lg bg-primary p-1.5 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div role="separator" aria-orientation="vertical"
          className="group relative hidden w-3 shrink-0 cursor-col-resize bg-[var(--card)] md:flex">
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-[var(--border)] transition-colors group-hover:bg-[var(--muted-foreground)]/30" aria-hidden />
        </div>

        {/* ─── RIGHT: Routines Intelligence Dashboard ─── */}
        <div className="hidden md:flex md:min-h-0 md:min-w-0 md:flex-1 flex-col bg-[var(--background)]">
          {/* Header */}
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">⟳ Routines Intelligence</h4>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 text-[var(--muted-foreground)]" />
                  <span className="text-[10px] text-[var(--muted-foreground)]">Auto-refresh</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">Live</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="shrink-0 px-4 py-2 flex gap-1.5 border-b border-[var(--border)] bg-[var(--card)]">
            {TABS.map(function (tab) {
              return (
                <button key={tab.id} type="button" onClick={function () { setSelectedTab(tab.id) }}
                  className={'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ' + (selectedTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-[var(--muted-foreground)] border border-transparent hover:text-[var(--foreground)]')}>
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-auto-hide">
            {/* ─── TAB: Overview ─── */}
            {selectedTab === 'overview' && (
              <TabOverview routines={routines} historyRuns={HISTORY_RUNS} />
            )}

            {/* ─── TAB: Scheduler ─── */}
            {selectedTab === 'scheduler' && (
              <TabScheduler routines={routines} onToggle={toggleRoutine} />
            )}

            {/* ─── TAB: History ─── */}
            {selectedTab === 'history' && (
              <TabHistory historyRuns={HISTORY_RUNS} />
            )}

            {/* ─── TAB: Performance ─── */}
            {selectedTab === 'performance' && (
              <TabPerformance />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
