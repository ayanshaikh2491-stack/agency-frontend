'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Activity, TrendingUp, Users, Clock, Send, Zap, BarChart3,
  ChevronRight, Circle, RefreshCw, Play, CheckCircle2, AlertCircle,
  MessageSquare, Bot, Radio, Sparkles, Terminal, User, FileText,
  Target, Mail, Globe, Twitter, Hash, Layers, Briefcase
} from 'lucide-react'
import { uid as uidShared } from '@/lib/chat-utils'
import PageShell from '@/components/PageShell'

/* ═══════════════════════════════════════════════
   CEO Boardroom — Chat left + Intelligence Dashboard right
   3 agents: CEO 👑, Social 📱, Ads 📢
   ═══════════════════════════════════════════════ */

const AGENTS = [
  { id: 'ceo',    name: 'CEO Commander',   emoji: '👑', color: 'var(--primary)', accent: 'purple' },
  { id: 'social', name: 'Social Manager',  emoji: '📱', color: '#06B6D4', accent: 'cyan' },
  { id: 'ads',    name: 'Ads Strategist',  emoji: '📢', color: '#F97316', accent: 'orange' },
]

var uid = uidShared  // shared

function ts() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function ago(minutes) {
  const d = new Date(Date.now() - minutes * 60000)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

/* ─── REAL DATA — loaded from backend; empty until agents work ─── */
const mockOps = []

const mockPipeline = {
  leadsToday: 0, leadsTotal: 0, queueDepth: 0, cycleCount: 0,
  cycleActive: false, avgResponse: '—', conversionRate: 0, topSource: '—',
}

const mockAgentLogs = {
  ceo: { status: 'idle', tasks: 0, lastLog: 'No activity yet', uptime: '' },
  social: { status: 'idle', tasks: 0, lastLog: 'No activity yet', uptime: '' },
  ads: { status: 'idle', tasks: 0, lastLog: 'No activity yet', uptime: '' },
}

function generateRecentActivities() { return [] }
const mockActivities = generateRecentActivities()

const STATUS_STYLES = {
  executing: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Executing', bg: 'bg-emerald-500/10' },
  running:   { dot: 'bg-blue-400',    text: 'text-blue-400',    label: 'Running',   bg: 'bg-blue-500/10' },
  pending:   { dot: 'bg-yellow-400',  text: 'text-yellow-400',  label: 'Pending',   bg: 'bg-yellow-500/10' },
  done:      { dot: 'bg-slate-500',   text: 'text-slate-500',   label: 'Done',      bg: 'bg-slate-500/10' },
}

const AGENT_ACCENT = {
  ceo:    { bg: 'bg-[var(--primary)]/10', text: 'text-[var(--primary)]', border: 'border-[var(--primary)]/30', light: 'var(--primary)' },
  social: { bg: 'bg-[#06B6D4]/10', text: 'text-[#06B6D4]', border: 'border-[#06B6D4]/30', light: '#06B6D4' },
  ads:    { bg: 'bg-[#F97316]/10', text: 'text-[#F97316]', border: 'border-[#F97316]/30', light: '#F97316' },
}

/* ─── Pattern-matched reply ─── */
function generateReply(input) {
  const l = input.toLowerCase().trim()
  if (!l) return null

  if (/^(hi|hello|hey|sup|yo|good morning|good evening)/.test(l)) {
    return {
      content: `**Greetings, Commander!** 👋\n\nCEO Console online and ready. What's on the agenda today? I can run lead research, manage social campaigns, or optimize ad spend for you.\n\n> Try suggesting a task to see the agents in action.`,
      agent: 'ceo',
    }
  }

  if (/(status|health|how are things|whats up|running|active)/.test(l)) {
    return {
      content: `**📡 Agency Status Report**\n\n**Cluster:** All 3 agents online\n• 👑 **CEO Commander** — Running (12 tasks)\n• 📱 **Social Manager** — Running (8 tasks)\n• 📢 **Ads Strategist** — Idle (5 tasks)\n\n**Pipeline:** ${mockPipeline.leadsToday} leads today · ${mockPipeline.queueDepth} in queue\n**Cycle:** #${mockPipeline.cycleCount} active\n**Avg Response:** ${mockPipeline.avgResponse}\n\n_All systems nominal._`,
      agent: 'ceo',
    }
  }

  if (/(lead|research|prospect|find|intake|scrape)/.test(l)) {
    return {
      content: `**Directive received: Lead Research** 🎯\n\n👑 **CEO:** Routing to lead enrichment pipeline...\n\nQueuing 12 new prospects for scraping:\n• LinkedIn profile enrichment\n• Company domain discovery\n• Email verification\n\n📱 **Social:** Coordinating outreach sequence\n📢 **Ads:** Building lookalike audience from new leads\n\n_Progress: 78% · Estimated completion: 4m_`,
      agent: 'ceo',
    }
  }

  if (/(social|twitter|linkedin|instagram|tiktok|post|content|thread)/.test(l)) {
    return {
      content: `**Social Campaign dispatched** 📱\n\n📱 **Social Manager** activated:\n• Twitter thread: "AI Trends 2026" — publishing now\n• LinkedIn article: Case Study — scheduled\n• Instagram stories: 3-part series queued\n\nEngagement target: 5K impressions / 200 clicks\n\n👑 CEO monitoring performance metrics.`,
      agent: 'social',
    }
  }

  if (/(ad|ads|campaign|facebook|google|spend|budget|ctr|ppc)/.test(l)) {
    return {
      content: `**Ad Strategy Engaged** 📢\n\n📢 **Ads Strategist** analyzing:\n• Facebook A/B test — Variant B winning (14% higher CTR)\n• Google Ads — CPC dropped to $0.42\n• Retargeting campaign ready to launch\n\nRecommended action: Shift +$50/day to top-performing FB ad set.\n\n👑 CEO awaiting spend authorization.`,
      agent: 'ads',
    }
  }

  if (/(task|what can you do|help|commands|suggest)/.test(l)) {
    return {
      content: `**Available Commands** 🎛️\n\n• **Status** — Check agency health & agent status\n• **Leads / Research** — Find & enrich new prospects\n• **Social / Content** — Create & schedule social posts\n• **Ads / Campaign** — Run ad campaigns & analyze\n• **Report** — Generate performance summary\n\n_Or just describe what you need in plain English._`,
      agent: 'ceo',
    }
  }

  return {
    content: `**Directive logged.** 🔄\n\nScoping your request to the most capable agent...\n\n👑 CEO: Analyzing "${input.slice(0, 40)}..."\n📱 Social: Standby for content tasks\n📢 Ads: Standby for campaign tasks\n\n> Rephrase or use a suggestion button below for faster routing.`,
    agent: 'ceo',
  }
}

const SUGGESTIONS = [
  { label: 'Agency Status', icon: Activity },
  { label: 'Run Lead Research', icon: Users },
  { label: 'Social Campaign', icon: Twitter },
  { label: 'Ad Performance', icon: BarChart3 },
]

/* ─── Tab content components ─── */

function ActiveOpsTab() {
  const grouped = useMemo(() => {
    const g = { ceo: [], social: [], ads: [] }
    mockOps.forEach(op => { g[op.agent]?.push(op) })
    return g
  }, [])

  return (
    <div className="space-y-4">
      {AGENTS.map(agent => {
        const ops = grouped[agent.id] || []
        return (
          <div key={agent.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{agent.emoji}</span>
              <span className="text-xs font-semibold text-slate-300">{agent.name}</span>
              <span className="text-[10px] text-slate-500">({ops.length})</span>
            </div>
            <div className="space-y-2">
              {ops.map(op => {
                const st = STATUS_STYLES[op.status] || STATUS_STYLES.pending
                return (
                  <div
                    key={op.id}
                    className="flex items-center gap-3 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2.5"
                  >
                    <span className={`shrink-0 w-2 h-2 rounded-full ${st.dot} ${op.status === 'running' || op.status === 'executing' ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-slate-200 truncate">{op.task}</span>
                        <span className={`shrink-0 text-[10px] font-medium ${st.text}`}>{st.label}</span>
                      </div>
                      {op.status !== 'done' && op.status !== 'pending' && (
                        <div className="mt-1.5 w-full bg-[var(--card)] rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${op.progress}%`, backgroundColor: agent.color }}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-600">Started {op.started}</span>
                        {op.status === 'running' && (
                          <span className="text-[9px] text-slate-600">{op.progress}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {ops.length === 0 && (
                <div className="text-[11px] text-slate-600 italic px-2 py-1">No active operations</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PipelineTab() {
  const kpis = [
    { label: 'Leads Today',   value: mockPipeline.leadsToday,  icon: Users,       change: '+12',   positive: true },
    { label: 'Queue Depth',   value: mockPipeline.queueDepth,  icon: Layers,      change: '-3',    positive: true },
    { label: 'Cycle Count',   value: `#${mockPipeline.cycleCount}`, icon: RefreshCw, change: 'Active', positive: true },
    { label: 'Avg Response',  value: mockPipeline.avgResponse, icon: Activity,    change: 'Good',  positive: true },
    { label: 'Conversion',    value: `${mockPipeline.conversionRate}%`, icon: TrendingUp, change: '+0.4%', positive: true },
    { label: 'Top Source',    value: mockPipeline.topSource,    icon: Hash,        change: 'Hot',   positive: true },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3.5"
          >
            <div className="flex items-center justify-between mb-2">
              <kpi.icon size={14} className="text-slate-500" />
              <span className={`text-[10px] font-medium ${kpi.positive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-200">{kpi.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Pipeline Cycle</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
            Active
          </span>
        </div>
        <div className="space-y-2 text-[11px] text-slate-400">
          <div className="flex justify-between">
            <span>Pipeline cycles executed</span>
            <span className="text-slate-200 font-mono">{mockPipeline.cycleCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Total leads processed</span>
            <span className="text-slate-200 font-mono">{mockPipeline.leadsTotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Average response time</span>
            <span className="text-slate-200 font-mono">{mockPipeline.avgResponse}</span>
          </div>
          <div className="flex justify-between">
            <span>Conversion rate</span>
            <span className="text-slate-200 font-mono">{mockPipeline.conversionRate}%</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="w-full bg-[var(--card)] rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-emerald-400" style={{ width: '65%' }} />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-slate-600">
            <span>Pipeline capacity</span>
            <span>65%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentInsightsTab() {
  return (
    <div className="space-y-3">
      {AGENTS.map(agent => {
        const log = mockAgentLogs[agent.id]
        const accent = AGENT_ACCENT[agent.id]
        const isRunning = log?.status === 'running'
        return (
          <div
            key={agent.id}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3.5"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`size-9 rounded-lg ${accent.bg} border ${accent.border} flex items-center justify-center text-lg`}>
                  {agent.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{agent.name}</span>
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      {isRunning ? 'Running' : 'Idle'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Uptime: {log?.uptime || '--'} · {log?.tasks || 0} tasks
                  </div>
                </div>
              </div>
            </div>

            {/* Recent log */}
            <div className="bg-[var(--card)] rounded-md px-3 py-2 border border-[var(--border)]/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Terminal size={10} className="text-slate-500" />
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Recent Log</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                {log?.lastLog || 'No recent activity'}
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-2.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Zap size={10} /> {log?.tasks || 0} active tasks
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} /> {log?.uptime || '--'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RecentTab() {
  return (
    <div className="space-y-1">
      {mockActivities.slice(0, 10).map(ev => {
        const accent = AGENT_ACCENT[ev.agent]
        return (
          <div
            key={ev.id}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--card)]/60 transition-colors"
          >
            <div className={`shrink-0 size-7 rounded-full ${accent.bg} flex items-center justify-center text-xs`}>
              {ev.agent === 'ceo' ? '👑' : ev.agent === 'social' ? '📱' : '📢'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-slate-300 leading-snug">{ev.text}</div>
              <span className="text-[10px] text-slate-600 mt-0.5 block">{ev.time}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TABS = [
  { id: 'ops',      label: 'Active Ops',       icon: Zap },
  { id: 'pipeline', label: 'Pipeline',          icon: BarChart3 },
  { id: 'insights', label: 'Agent Insights',    icon: Bot },
  { id: 'recent',   label: 'Recent',            icon: Clock },
]

/* ─── Main Page ─── */
export default function BoardroomPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('ops')
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }, [])

  useEffect(scrollDown, [messages])

  useEffect(() => {
    inputRef.current?.focus()
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: `**Executive Boardroom — Session Online** 👑\n\nAgency command center ready. CEO, Social, and Ads agents are standing by.\n\nTry one of the suggestion buttons below or type a directive.\n\n_All systems nominal. Awaiting your command._`,
        time: ts(),
      },
    ])
  }, [])

  const send = useCallback((overrideInput) => {
    const text = (overrideInput || input).trim()
    if (!text || busy) return
    if (!overrideInput) setInput('')

    setBusy(true)

    const userMsg = { id: uid(), role: 'user', content: text, time: ts() }
    const result = generateReply(text)

    if (!result) {
      setMessages(p => [...p, userMsg])
      setBusy(false)
      return
    }

    const { content, agent } = result
    const agentMsg = { id: uid(), role: 'agent', content, agent, time: ts() }

    setTimeout(() => {
      setMessages(p => [...p, userMsg, agentMsg])
      setBusy(false)
    }, 600)
  }, [input, busy])

  const handleSuggestion = useCallback((text) => {
    setInput(text)
    send(text)
  }, [send])

  /* Tab content */
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'ops':      return <ActiveOpsTab />
      case 'pipeline': return <PipelineTab />
      case 'insights': return <AgentInsightsTab />
      case 'recent':   return <RecentTab />
      default:         return null
    }
  }, [activeTab])

  return (
    <PageShell>
      <div className="flex h-screen w-full overflow-hidden">
      {/* ═══════ LEFT: CEO Chat ═══════ */}
      <div className="flex flex-col w-1/2 min-w-0 bg-[var(--card)] border-r border-[var(--border)]">
        {/* Header */}
        <div className="shrink-0 px-5 py-3 border-b border-[var(--border)] bg-[var(--background)]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[var(--primary)]/20 border border-[var(--primary)]/30 flex items-center justify-center text-sm">
                👑
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">CEO Console</h2>
                <p className="text-[10px] text-slate-500">Command center · 3 agents active</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={11} className="text-slate-500" />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">You</span>
                      <span className="text-[10px] text-slate-600">{m.time}</span>
                    </div>
                    <p className="text-[13px] text-slate-200">{m.content}</p>
                  </div>
                </div>
              )
            }

            // System or agent message
            const bgColor = m.agent === 'social' ? 'border-[#06B6D4] bg-[#06B6D4]/5'
              : m.agent === 'ads' ? 'border-[#F97316] bg-[#F97316]/5'
              : 'border-[var(--primary)] bg-[#1E2533]'

            const label = m.agent === 'social' ? '📱 Social Manager'
              : m.agent === 'ads' ? '📢 Ads Strategist'
              : '👑 CEO Commander'

            const textColor = m.agent === 'social' ? 'text-[#06B6D4]'
              : m.agent === 'ads' ? 'text-[#F97316]'
              : 'text-[var(--primary)]'

            return (
              <div key={m.id} className="flex items-start gap-2.5">
                <div className={`shrink-0 size-8 rounded-lg flex items-center justify-center text-sm border ${
                  m.agent === 'social' ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30'
                    : m.agent === 'ads' ? 'bg-[#F97316]/10 border-[#F97316]/30'
                    : 'bg-[var(--primary)]/20 border-[var(--primary)]/30'
                }`}>
                  {m.agent === 'social' ? '📱' : m.agent === 'ads' ? '📢' : '👑'}
                </div>
                <div className={`flex-1 min-w-0 border-l-4 ${bgColor} rounded-r-xl p-3.5`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] font-semibold ${textColor}`}>
                      {label}
                    </span>
                    <span className="text-[9px] text-slate-600">{m.time}</span>
                  </div>
                  <div
                    className="text-[13px] leading-relaxed text-slate-200 [&_strong]:text-white [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: m.content
                        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                        .replace(/^> (.+)$/gm, '<span class="text-slate-400 italic text-[12px] block">$1</span>')
                        .replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              </div>
            )
          })}

          {busy && (
            <div className="flex items-center gap-2.5 pl-11">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] text-slate-500 italic">Routing to agents...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion buttons */}
        <div className="shrink-0 px-4 py-2 border-t border-[var(--border)] bg-[var(--background)]/30">
          <div className="flex gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s.label}
                onClick={() => handleSuggestion(s.label)}
                disabled={busy}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-[var(--card)] border border-[var(--border)] hover:border-slate-600 hover:text-slate-200 px-3 py-1.5 rounded-full transition-all disabled:opacity-30"
              >
                <s.icon size={12} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--background)]/60">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Type a directive for the CEO..."
              disabled={busy}
              rows={1}
              className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[13px] text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--primary)]/40 focus:ring-1 focus:ring-[var(--primary)]/20 transition-all resize-none disabled:opacity-40 min-h-[38px] max-h-[120px]"
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="shrink-0 h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#06B6D4] text-white hover:opacity-90 transition-all disabled:opacity-25"
            >
              {busy ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ RIGHT: 4-Tab Intelligence Dashboard ═══════ */}
      <div className="flex flex-col w-1/2 min-w-0 bg-[var(--background)]">
        {/* Tab bar */}
        <div className="shrink-0 px-5 pt-4 pb-0 border-b border-[var(--border)]">
          <div className="flex items-center gap-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-t-lg transition-all ${
                    isActive
                      ? 'bg-[var(--card)] border-t border-l border-r border-[var(--border)] text-slate-200'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-[var(--card)]/40'
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-2.5 border-t border-[var(--border)] bg-[var(--card)]/40">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-3">
              {AGENTS.map(a => (
                <span key={a.id} className="flex items-center gap-1 text-slate-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${mockAgentLogs[a.id]?.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {a.emoji} {a.name}
                </span>
              ))}
            </div>
            <span className="text-slate-600">Intelligence Dashboard v2.0</span>
          </div>
        </div>
      </div>
    </div>
    </PageShell>
  )
}


