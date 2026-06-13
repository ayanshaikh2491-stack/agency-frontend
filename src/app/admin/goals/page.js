'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  ListChecks,
  BarChart3,
  GitBranch,
  CalendarDays,
  UserCheck,
  AlertCircle,
  ArrowUpRight,
  Hash,
  Layers,
} from 'lucide-react'

function uid() { return 'm' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) }
function ts() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) }

const PAPERCLIP_BUBBLE = 'min-w-0 max-w-[85%] break-words px-3 py-2 text-sm overflow-x-auto overflow-y-visible'

function AgentBubbleHeader({ emoji, name }) {
  return (
    <div className="mb-1 flex items-center gap-1.5 pl-1">
      <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none">{emoji}</div>
      <span className="text-sm font-medium text-slate-200">{name}</span>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className={PAPERCLIP_BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-slate-200 [border-radius:14px_14px_14px_4px]'}>
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '300ms' }} />
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
  h = h.replace(/`([^`]+)`/g, '<code class="bg-[var(--background)]/80 text-slate-400 px-1.5 py-0.5 rounded text-[12px] font-mono border border-[var(--border)]/40">$1</code>')
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  h = h.replace(/\n/g, '<br>')
  return h
}

function formatNum(n) { if (!n) return '0'; if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'; if (n >= 1000) return (n/1000).toFixed(1) + 'K'; return n.toLocaleString() }

// ─── MOCK GOALS DATA ───
var GOALS = [
  { id: 'g1', title: 'Launch lead gen campaign for Miami real estate', status: 'active', tickets: 8, done: 3, priority: 'high', start: '2026-06-01', deadline: '2026-07-15', agent: 'Ads Runner' },
  { id: 'g2', title: 'Scale content output to 50 posts/week', status: 'active', tickets: 5, done: 1, priority: 'medium', start: '2026-06-05', deadline: '2026-07-30', agent: 'Content Creator' },
  { id: 'g3', title: 'Optimize ad conversion funnel', status: 'pending', tickets: 4, done: 0, priority: 'medium', start: '2026-06-10', deadline: '2026-08-01', agent: 'Ads Runner' },
  { id: 'g4', title: 'Improve client retention program', status: 'completed', tickets: 6, done: 6, priority: 'low', start: '2026-05-01', deadline: '2026-06-10', agent: 'Client Success' },
]

var TOTALS = {
  active: 4,
  completed: 12,
  avgCompletion: '78%',
  onTrack: 3,
}

var MILESTONES = [
  { id: 'm1', goalId: 'g1', title: 'Market research complete', date: '2026-06-10', done: true },
  { id: 'm2', goalId: 'g1', title: 'Ad creative drafts ready', date: '2026-06-20', done: false },
  { id: 'm3', goalId: 'g1', title: 'Campaign launch', date: '2026-07-01', done: false },
  { id: 'm4', goalId: 'g2', title: 'Content calendar built', date: '2026-06-12', done: true },
  { id: 'm5', goalId: 'g2', title: '10 writers onboarded', date: '2026-06-25', done: false },
  { id: 'm6', goalId: 'g2', title: 'First 50 posts live', date: '2026-07-10', done: false },
  { id: 'm7', goalId: 'g3', title: 'Funnel audit complete', date: '2026-06-18', done: false },
  { id: 'm8', goalId: 'g3', title: 'A/B test running', date: '2026-07-05', done: false },
  { id: 'm9', goalId: 'g4', title: 'Client survey sent', date: '2026-05-15', done: true },
  { id: 'm10', goalId: 'g4', title: 'Retention playbook written', date: '2026-05-30', done: true },
]

var DECOMPOSITION_EXAMPLE = {
  goal: 'Launch lead gen campaign for Miami real estate',
  subtasks: [
    { id: 101, title: 'Research Miami real estate market', agent: 'Intake Researcher', status: 'completed' },
    { id: 102, title: 'Analyze competitor ad strategies', agent: 'Intake Researcher', status: 'in-progress' },
    { id: 103, title: 'Draft ad creative & copy variants', agent: 'Content Creator', status: 'in-progress' },
    { id: 104, title: 'Build lookalike audience segments', agent: 'Ads Runner', status: 'open' },
    { id: 105, title: 'Optimize landing page for conversion', agent: 'SEO Engine', status: 'open' },
    { id: 106, title: 'Set up conversion tracking & analytics', agent: 'Analytics Bot', status: 'open' },
  ],
}

var AGENT_PERFORMANCE = [
  { name: 'Intake Researcher', goals: 4, avgTime: '2.1d', completion: '92%' },
  { name: 'Content Creator', goals: 3, avgTime: '3.4d', completion: '78%' },
  { name: 'Ads Runner', goals: 2, avgTime: '4.2d', completion: '65%' },
  { name: 'SEO Engine', goals: 2, avgTime: '2.8d', completion: '81%' },
  { name: 'Analytics Bot', goals: 3, avgTime: '1.5d', completion: '95%' },
]

var SUGGESTIONS = [
  { label: '🚀 Launch lead gen', prompt: 'Decompose: Launch lead gen campaign for Miami real estate' },
  { label: '📝 Scale content', prompt: 'Decompose: Scale content output to 50 posts per week' },
  { label: '🎯 Optimize ads', prompt: 'Decompose: Optimize ad conversion funnel' },
  { label: '🤝 Improve retention', prompt: 'Decompose: Improve client retention program' },
]

function daysBetween(a, b) {
  return Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24))
}

function daysFromNow(d) {
  return daysBetween(new Date().toISOString().slice(0, 10), d)
}

function pctOfRange(start, end, current) {
  var total = daysBetween(start, end)
  var elapsed = daysBetween(start, current)
  if (total <= 0) return 100
  return Math.min(100, Math.round((elapsed / total) * 100))
}

function statusColor(status) {
  switch (status) {
    case 'completed': return 'text-emerald-400'
    case 'in-progress': return 'text-primary'
    case 'active': return 'text-emerald-400'
    case 'pending': return 'text-slate-500'
    default: return 'text-slate-500'
  }
}

function statusBg(status) {
  switch (status) {
    case 'completed': return 'bg-emerald-500/10'
    case 'in-progress': return 'bg-amber-500/10'
    case 'active': return 'bg-emerald-500/10'
    case 'pending': return 'bg-slate-500/10'
    default: return 'bg-slate-500/10'
  }
}

function priorityColor(p) {
  switch (p) {
    case 'high': return 'bg-rose-500'
    case 'medium': return 'bg-amber-500'
    case 'low': return 'bg-emerald-500'
    default: return 'bg-slate-500'
  }
}

function goalBarColor(g) {
  var pct = g.tickets > 0 ? Math.round((g.done / g.tickets) * 100) : 0
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

export default function GoalsPage() {
  var [msgs, setMsgs] = useState([])
  var [input, setInput] = useState('')
  var [sending, setSending] = useState(false)
  var [welcomeRevealed, setWelcomeRevealed] = useState(false)
  var [chipsRevealed, setChipsRevealed] = useState(false)
  var [selectedTab, setSelectedTab] = useState('overview')
  var bottomRef = useRef(null)
  var inputRef = useRef(null)
  var scrollRef = useRef(null)
  var keepScrolled = useRef(true)

  var safeScroll = useCallback(function() {
    if (!keepScrolled.current || !bottomRef.current) return
    bottomRef.current.scrollIntoView({ block: 'end' })
  }, [])

  useEffect(function() { safeScroll() }, [msgs.length])

  useEffect(function() {
    var el = scrollRef.current
    if (!el) return
    var onScroll = function() {
      keepScrolled.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 40
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return function() { el.removeEventListener('scroll', onScroll) }
  }, [])

  useEffect(function() {
    if (welcomeRevealed) return
    var t1 = setTimeout(function() { setWelcomeRevealed(true) }, 1500)
    return function() { clearTimeout(t1) }
  }, [welcomeRevealed])

  useEffect(function() {
    if (!welcomeRevealed || chipsRevealed) return
    var t2 = setTimeout(function() { setChipsRevealed(true) }, 500)
    return function() { clearTimeout(t2) }
  }, [welcomeRevealed, chipsRevealed])

  // ─── CEO Agent pattern-matched replies ───
  async function callAgent(text) {
    try {
      var l = text.toLowerCase()

      // Extract goal title from "Decompose: <goal>"
      var goalTitle = ''
      if (l.startsWith('decompose:')) {
        goalTitle = text.replace(/^Decompose:\s*/i, '').trim()
      } else if (l.includes('decompose')) {
        goalTitle = text.replace(/decompose/i, '').replace(/for/i, '').trim()
      }

      if (goalTitle) {
        return '**🧠 CEO Agent — Goal Decomposition Complete**\n\n' +
          'Goal: **' + goalTitle + '**\n\n' +
          'I\'ve broken this down into **6 sub-tasks** and assigned them to the agency team:\n\n' +
          '1. **Market & competitor research** → Intake Researcher (2d)\n' +
          '2. **Asset creation & copywriting** → Content Creator (3d)\n' +
          '3. **Campaign setup & audience building** → Ads Runner (2d)\n' +
          '4. **Landing page optimization** → SEO Engine (2d)\n' +
          '5. **Conversion tracking & analytics** → Analytics Bot (1d)\n' +
          '6. **Review & launch checklist** → CEO Agent (1d)\n\n' +
          '**Estimated time:** 11 days\n' +
          '**Priority:** Automatically set based on complexity\n\n' +
          'Check the **Decomposition** tab for the full breakdown.'
      }

      if (l.includes('lead gen') || l.includes('campaign')) {
        return '**🚀 Launch lead gen campaign — Status**\n\n' +
          '• Progress: 3/8 tickets complete\n' +
          '• On track: ✅\n' +
          '• Next milestone: Ad creative drafts ready (Jun 20)\n' +
          '• Assigned to: Ads Runner\n\n' +
          'Want me to decompose this goal into sub-tasks? Just type **\"Decompose: Launch lead gen campaign for Miami real estate\"**'
      }

      if (l.includes('content') || l.includes('scale')) {
        return '**📝 Scale content output — Status**\n\n' +
          '• Progress: 1/5 tickets complete\n' +
          '• On track: ⚠️ (behind schedule)\n' +
          '• Next milestone: 10 writers onboarded (Jun 25)\n' +
          '• Assigned to: Content Creator\n\n' +
          'Type **\"Decompose: Scale content output to 50 posts per week\"** to see the breakdown.'
      }

      if (l.includes('ads') || l.includes('funnel') || l.includes('conversion')) {
        return '**🎯 Optimize ad conversion funnel — Status**\n\n' +
          '• Progress: 0/4 tickets complete\n' +
          '• Status: Pending — not yet started\n' +
          '• Next milestone: Funnel audit complete (Jun 18)\n' +
          '• Assigned to: Ads Runner\n\n' +
          'Type **\"Decompose: Optimize ad conversion funnel\"** to kick off planning.'
      }

      if (l.includes('retention') || l.includes('client') || l.includes('customer')) {
        return '**🤝 Improve client retention — Status**\n\n' +
          '• Progress: 6/6 tickets complete ✅\n' +
          '• Status: Completed!\n' +
          '• Key achievements: Client survey sent, retention playbook written\n' +
          '• Assigned to: Client Success\n\n' +
          'This goal is fully complete. Want to start a new retention initiative?'
      }

      // Default: full overview
      var activeGoals = GOALS.filter(function(g) { return g.status === 'active' || g.status === 'pending' })
      return '**👑 CEO Agent — Goals Intelligence**\n\n' +
        '**📊 Overall Status**\n' +
        '• ' + TOTALS.active + ' active goals\n' +
        '• ' + TOTALS.completed + ' completed this quarter\n' +
        '• ' + TOTALS.onTrack + ' on track · ' + (GOALS.length - TOTALS.onTrack) + ' need attention\n' +
        '• Avg completion: ' + TOTALS.avgCompletion + '\n\n' +
        activeGoals.map(function(g) {
          var pct = g.tickets > 0 ? Math.round((g.done / g.tickets) * 100) : 0
          return '• **' + g.title + '** — ' + pct + '% (' + g.done + '/' + g.tickets + ') ' + (g.status === 'pending' ? '⏸️' : '▶️')
        }).join('\n') +
        '\n\n**💡 Tip:** Type a goal like \"Launch lead gen campaign\" to see its status, or start with **\"Decompose: <your goal>\"** to have me break it down into tickets.'
    } catch(e) {
      return 'Let me check the goals dashboard for you... 🎯'
    }
  }

  var send = useCallback(async function(override) {
    var text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')

    var userMsg = { id: uid(), role: 'user', content: text, time: ts() }
    setMsgs(function(p) { return p.concat([userMsg]) })
    setSending(true)
    setWelcomeRevealed(true)
    setChipsRevealed(true)

    var reply = await callAgent(text)

    await new Promise(function(r) { setTimeout(r, 400 + Math.random() * 500) })
    setSending(false)
    setMsgs(function(p) { return p.concat([{ id: uid(), role: 'assistant', content: reply, time: ts() }]) })
  }, [input, sending])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  var welcomeBody = 'Hey! I\'m your **CEO Agent** 👑\n\nI manage **all agency goals** — decomposition, execution tracking, and agent coordination.\n\n**What can I do?**\n🚀 Decompose goals into executable tickets\n📊 Track progress across all active goals\n🧠 Assign sub-tasks to the right agents\n📈 Forecast completion & flag risks\n\n**Try one of the suggestions below** or type **\"Decompose: <your goal>\"** to get started!'

  var activeGoals = GOALS.filter(function(g) { return g.status === 'active' || g.status === 'pending' })

  return (
    <div className="flex h-[calc(100%+2rem)] flex-col -m-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* ─── LEFT: Chat ─── */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-[45%] shrink-0 flex-col bg-[var(--background)]">
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Target className="h-4 w-4 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">CEO Console</h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">● Live</span>
                </div>
                <p className="truncate text-xs text-slate-500">{activeGoals.length} active · {TOTALS.completed} completed · {TOTALS.avgCompletion} avg</p>
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
                      <AgentBubbleHeader emoji="👑" name="CEO Agent" />
                      <div className={PAPERCLIP_BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-slate-200 [border-radius:14px_14px_14px_4px]'}>
                        <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMD(welcomeBody) }} />
                      </div>
                    </div>
                    {chipsRevealed && (
                      <div className="flex flex-wrap gap-2 pl-1">
                        {SUGGESTIONS.map(function(chip) {
                          return (
                            <button key={chip.label} type="button" onClick={function() { send(chip.prompt) }}
                              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-slate-400 transition-colors duration-150 hover:bg-[var(--border)]/50 hover:text-slate-200">
                              {chip.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {msgs.map(function(m) {
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="flex flex-col items-end gap-1">
                        <div className={PAPERCLIP_BUBBLE + ' bg-primary text-white [border-radius:14px_14px_4px_14px]'}>{m.content}</div>
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="👑" name="CEO Agent" />
                      <div className={PAPERCLIP_BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-slate-200 [border-radius:14px_14px_14px_4px]'}>
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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-[var(--background)]/0 px-6 pt-6 pb-5">
            <div className="pointer-events-auto relative rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 pb-2 pt-3 shadow-lg transition-colors focus-within:border-slate-500/60">
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value) }} onKeyDown={handleKeyDown}
                  placeholder="Ask your CEO Agent to decompose a goal..." rows={1}
                  className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none scrollbar-none" disabled={sending} />
                <div className="flex shrink-0 items-center gap-1 pb-0.5">
                  <button type="button" onClick={function() { send() }} disabled={!input.trim() || sending}
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
          className="group relative hidden w-3 shrink-0 cursor-col-resize bg-[var(--background)] md:flex">
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-[var(--border)] transition-colors group-hover:bg-slate-500/30" aria-hidden />
        </div>

        {/* ─── RIGHT: Goal Intelligence Dashboard ─── */}
        <div className="hidden md:flex md:min-h-0 md:min-w-0 md:flex-1 flex-col bg-[var(--background)]">
          {/* Header */}
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Goal Intelligence</h4>
              <span className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">Live</span>
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="shrink-0 px-4 py-2 flex gap-1.5 border-b border-[var(--border)]">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'timeline', label: '📅 Timeline' },
              { id: 'decomposition', label: '🧠 Decomposition' },
              { id: 'analytics', label: '📈 Analytics' },
            ].map(function(tab) {
              return (
                <button key={tab.id} type="button" onClick={function() { setSelectedTab(tab.id) }}
                  className={'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ' + (selectedTab === tab.id
                    ? 'bg-primary/20 text-primary border border-amber-500/30'
                    : 'text-slate-500 border border-transparent hover:text-slate-200')}>
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-auto-hide">

            {/* ─── TAB: Overview ─── */}
            {selectedTab === 'overview' && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Active Goals', value: TOTALS.active, icon: Target, color: 'text-slate-200' },
                    { label: 'Completed', value: TOTALS.completed, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Avg Completion', value: TOTALS.avgCompletion, icon: TrendingUp, color: 'text-primary' },
                    { label: 'On Track', value: TOTALS.onTrack, icon: UserCheck, color: 'text-blue-400' },
                  ].map(function(m) {
                    var Icon = m.icon
                    return (
                      <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{m.label}</p>
                          <Icon className="h-3 w-3 text-slate-500" />
                        </div>
                        <p className={'text-sm font-bold mt-0.5 ' + m.color}>{m.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Goal Progress Bars */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                      <Hash className="h-3 w-3 inline mr-1" />Goal Progress
                    </span>
                    <span className="text-[10px] text-slate-500">{GOALS.filter(function(g) { return g.status !== 'completed' }).length} active</span>
                  </div>
                  <div className="space-y-2">
                    {GOALS.map(function(g) {
                      var pct = g.tickets > 0 ? Math.round((g.done / g.tickets) * 100) : 0
                      return (
                        <div key={g.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className={'w-1.5 h-1.5 rounded-full shrink-0 ' + priorityColor(g.priority)} />
                              <span className="text-[11px] text-slate-200 truncate">{g.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono ml-2 shrink-0">{g.done}/{g.tickets}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                            <div className={'h-full rounded-full ' + goalBarColor(g)} style={{ width: pct + '%' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400"><ListChecks className="h-3 w-3 inline mr-1" />By Status</span>
                    <div className="mt-2 space-y-1.5">
                      {['active', 'pending', 'completed'].map(function(s) {
                        var count = GOALS.filter(function(g) { return g.status === s }).length
                        return (
                          <div key={s} className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 capitalize">{s}</span>
                            <span className={'text-[10px] font-mono ' + statusColor(s)}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400"><AlertCircle className="h-3 w-3 inline mr-1" />By Priority</span>
                    <div className="mt-2 space-y-1.5">
                      {['high', 'medium', 'low'].map(function(p) {
                        var count = GOALS.filter(function(g) { return g.priority === p }).length
                        return (
                          <div key={p} className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 capitalize">{p}</span>
                            <span className="text-[10px] font-mono text-slate-300">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB: Timeline ─── */}
            {selectedTab === 'timeline' && (
              <>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      <CalendarDays className="h-3 w-3 inline mr-1" />Goal Timeline — Gantt View
                    </span>
                    <span className="text-[10px] text-slate-500">Jun – Aug 2026</span>
                  </div>
                  <div className="space-y-3">
                    {GOALS.map(function(g) {
                      var totalDays = daysBetween(g.start, g.deadline) || 1
                      var elapsedDays = daysBetween(g.start, new Date().toISOString().slice(0, 10))
                      var pctDone = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
                      var daysLeft = daysFromNow(g.deadline)

                      return (
                        <div key={g.id}>
                          {/* Goal header */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className={'w-1.5 h-1.5 rounded-full shrink-0 ' + priorityColor(g.priority)} />
                              <span className="text-[11px] text-slate-200 truncate">{g.title}</span>
                            </div>
                            <span className={'text-[9px] font-medium ml-2 shrink-0 ' + (daysLeft < 0 ? 'text-rose-400' : 'text-slate-500')}>
                              {daysLeft >= 0 ? daysLeft + 'd left' : Math.abs(daysLeft) + 'd overdue'}
                            </span>
                          </div>
                          {/* Gantt bar */}
                          <div className="relative h-5 rounded bg-[var(--border)] overflow-hidden">
                            <div
                              className={'absolute inset-y-0 left-0 rounded ' + (g.status === 'completed' ? 'bg-emerald-500/60' : 'bg-amber-500/40')}
                              style={{ width: pctDone + '%' }}
                            />
                            {/* Milestone markers */}
                            {MILestones.filter(function(m) { return m.goalId === g.id }).map(function(m) {
                              var mPct = pctOfRange(g.start, g.deadline, m.date)
                              return (
                                <div key={m.id}
                                  className={'absolute top-0.5 bottom-0.5 w-[3px] rounded-full z-10 ' + (m.done ? 'bg-emerald-400' : 'bg-slate-400/60')}
                                  style={{ left: mPct + '%' }}
                                  title={m.title + ' (' + m.date + ')'}
                                />
                              )
                            })}
                            {/* Progress % label inside bar */}
                            <div className="absolute inset-0 flex items-center px-1.5">
                              <span className="text-[8px] font-mono text-white/70">{g.done}/{g.tickets}</span>
                            </div>
                          </div>
                          {/* Date label */}
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[8px] text-slate-500">{g.start}</span>
                            <span className="text-[8px] text-slate-500">{g.deadline}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Milestones List */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">🏁 Upcoming Milestones</span>
                  <div className="mt-2 space-y-1">
                    {MILestones.filter(function(m) { return !m.done }).slice(0, 5).map(function(m) {
                      var goal = GOALS.find(function(g) { return g.id === m.goalId })
                      return (
                        <div key={m.id} className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-[10px] text-slate-200 flex-1 truncate">{m.title}</span>
                          <span className="text-[9px] text-slate-500 shrink-0">{m.date}</span>
                          {goal && <span className="text-[9px] text-slate-500 shrink-0">· {goal.title.slice(0, 20)}...</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB: Decomposition ─── */}
            {selectedTab === 'decomposition' && (
              <>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                      <GitBranch className="h-3 w-3 inline mr-1" />CEO Breakdown Example
                    </span>
                    <span className="text-[10px] text-slate-500">Launch lead gen campaign</span>
                  </div>

                  {/* Goal title */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[11px] text-slate-200 font-medium">{DECOMPOSITION_EXAMPLE.goal}</span>
                    </div>
                  </div>

                  {/* Sub-tasks with assigned agents */}
                  <div className="space-y-1">
                    {DECOMPOSITION_EXAMPLE.subtasks.map(function(t) {
                      return (
                        <div key={t.id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                          <div className={'w-1.5 h-1.5 rounded-full shrink-0 ' + (t.status === 'completed' ? 'bg-emerald-500' : t.status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-500')} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-slate-200">#{t.id} {t.title}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 shrink-0 ml-1 whitespace-nowrap">{t.agent}</span>
                          <span className={'text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-1 ' + (
                            t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            t.status === 'in-progress' ? 'bg-amber-500/10 text-primary' :
                            'bg-slate-500/10 text-slate-400'
                          )}>{t.status}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] text-slate-500">Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[9px] text-slate-500">In Progress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span className="text-[9px] text-slate-500">Open</span>
                    </div>
                  </div>
                </div>

                {/* How decomposition works */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400"><Layers className="h-3 w-3 inline mr-1" />How CEO Decomposition Works</span>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { step: '1', desc: 'You describe the goal in natural language' },
                      { step: '2', desc: 'CEO Agent analyzes scope, priority, and dependencies' },
                      { step: '3', desc: 'Goal is broken into 4–8 concrete sub-tasks' },
                      { step: '4', desc: 'Each sub-task auto-assigned to the best-fit agent' },
                      { step: '5', desc: 'Timeline, milestones, and success criteria set' },
                    ].map(function(s) {
                      return (
                        <div key={s.step} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-mono flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                          <span className="text-[10px] text-slate-400">{s.desc}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB: Analytics ─── */}
            {selectedTab === 'analytics' && (
              <>
                {/* KPI metrics */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Goal Completion Rate', value: TOTALS.avgCompletion, icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Avg Time to Complete', value: '6.2d', icon: Clock, color: 'text-primary' },
                    { label: 'Total Goals This Qtr', value: '16', icon: Hash, color: 'text-slate-200' },
                  ].map(function(m) {
                    var Icon = m.icon
                    return (
                      <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{m.label}</p>
                          <Icon className="h-3 w-3 text-slate-500" />
                        </div>
                        <p className={'text-sm font-bold mt-0.5 ' + m.color}>{m.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Completion Rate by Goal */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    <BarChart3 className="h-3 w-3 inline mr-1" />Completion Rate by Goal
                  </span>
                  <div className="mt-2 space-y-2">
                    {GOALS.map(function(g) {
                      var pct = g.tickets > 0 ? Math.round((g.done / g.tickets) * 100) : 0
                      return (
                        <div key={g.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-300 truncate flex-1">{g.title}</span>
                            <span className={'text-[10px] font-mono ml-2 ' + (pct >= 100 ? 'text-emerald-400' : pct >= 50 ? 'text-primary' : 'text-rose-400')}>{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                            <div className={'h-full rounded-full ' + goalBarColor(g)} style={{ width: pct + '%' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Agent Performance */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    <UserCheck className="h-3 w-3 inline mr-1" />Agent Performance per Goal
                  </span>
                  <div className="mt-2 space-y-1">
                    {AGENT_PERFORMANCE.map(function(a) {
                      return (
                        <div key={a.name} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-slate-200">{a.name}</span>
                            <p className="text-[9px] text-slate-500">{a.goals} goals assigned</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 font-mono">{a.completion}</span>
                            <p className="text-[9px] text-slate-500">{a.avgTime} avg</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Insights */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">💡 Intelligence</span>
                  <div className="mt-1.5 space-y-1">
                    {[
                      '📈 Completion rate up 12% from last quarter — keep momentum',
                      '⚡ Ads Runner has highest goal volume — consider load balancing',
                      '🎯 "Improve client retention" completed 2 days ahead of schedule',
                      '💡 Analytics Bot has 95% completion rate — most efficient agent',
                    ].map(function(i, idx) {
                      return <p key={idx} className="text-[10px] text-slate-400 leading-relaxed">{i}</p>
                    })}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
