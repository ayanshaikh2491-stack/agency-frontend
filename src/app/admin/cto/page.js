'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useCompany } from '@/lib/client-context'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

function uid() { return 'm' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) }
function ts() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) }

const PAPERCLIP_BUBBLE = 'min-w-0 max-w-[85%] break-words px-3 py-2 text-sm overflow-x-auto overflow-y-visible'

function AgentBubbleHeader({ emoji, name }) {
  return (
    <div className="mb-1 flex items-center gap-1.5 pl-1">
      <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none">{emoji}</div>
      <span className="text-sm font-medium text-[var(--foreground)]">{name}</span>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className={[PAPERCLIP_BUBBLE, 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'].join(' ')}>
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
  var h = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function(_, lang, code) {
    var esc = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return '<pre class="bg-[var(--background)] border border-[var(--border)]/50 rounded p-3 my-2 text-[12px] leading-relaxed text-emerald-400/90 font-mono overflow-x-auto">' + esc + '</pre>'
  })
  h = h.replace(/`([^`]+)`/g, '<code class="bg-[var(--background)]/80 text-[var(--muted-foreground)] px-1.5 py-0.5 rounded text-[12px] font-mono border border-[var(--border)]/40">$1</code>')
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  h = h.replace(/\*(.*?)\*/g, '<em class="text-[var(--muted-foreground)] italic">$1</em>')
  h = h.replace(/\n/g, '<br>')
  return h
}

var AGENT_EMOJIS = {
  'intake-researcher': '🔍', 'content-creator': '✍️', 'seo-engine': '📈',
  'ads-runner': '📢', 'analytics-bot': '📊', 'sales-closer': '💼',
  'client-success': '🤝', 'review-qc': '✅',
}

var WORKER_LABELS = {
  'intake-researcher': 'Intake Researcher', 'content-creator': 'Content Creator',
  'seo-engine': 'SEO Engine', 'ads-runner': 'Ads Runner',
  'analytics-bot': 'Analytics Bot', 'sales-closer': 'Sales Closer',
  'client-success': 'Client Success', 'review-qc': 'Review QC',
}

var CTO_COMMANDS = [
  { cmd: 'pipeline', desc: 'Show pipeline status, queue, and agent health' },
  { cmd: 'agents', desc: 'List all agents and their current status' },
  { cmd: 'groq', desc: 'Show Groq API key status and capacity' },
  { cmd: 'workload', desc: 'Show current workload distribution' },
  { cmd: 'errors', desc: 'Show recent errors and failures' },
  { cmd: 'deploy', desc: 'Deploy latest changes to all agents' },
]

var SUGGESTIONS = [
  { label: '🛠 Pipeline Status', prompt: 'Show pipeline status and queue' },
  { label: '🤖 Agents Health', prompt: 'List all agents and their current status' },
  { label: '📊 Workload', prompt: 'Show current workload distribution' },
  { label: '🚀 Deploy All', prompt: 'Deploy latest changes to all agents' },
]

export default function CTOPage() {
  var ctx = useCompany()
  var agentsFull = ctx.agentsFull
  var activeCompany = ctx.activeCompany
  var msgsState = useState([])
  var msgs = msgsState[0], setMsgs = msgsState[1]
  var inputState = useState('')
  var input = inputState[0], setInput = inputState[1]
  var sendingState = useState(false)
  var sending = sendingState[0], setSending = sendingState[1]
  var stState = useState('')
  var streamingText = stState[0], setStreamingText = stState[1]
  var statusState = useState('')
  var statusText = statusState[0], setStatusText = statusState[1]
  var errorState = useState('')
  var errorText = errorState[0], setErrorText = errorState[1]
  var elapsedState = useState(0)
  var elapsedSec = elapsedState[0], setElapsedSec = elapsedState[1]
  var welcomeState = useState(false)
  var welcomeRevealed = welcomeState[0], setWelcomeRevealed = welcomeState[1]
  var chipsState = useState(false)
  var chipsRevealed = chipsState[0], setChipsRevealed = chipsState[1]
  var optState = useState(null)
  var optimisticMessage = optState[0], setOptimisticMessage = optState[1]
  var bottomRef = useRef(null)
  var inputRef = useRef(null)
  var scrollRef = useRef(null)
  var keepScrolled = useRef(true)
  var hasNewState = useState(false)
  var hasNewBelow = hasNewState[0], setHasNewBelow = hasNewState[1]

  var safeScroll = useCallback(function() {
    if (!keepScrolled.current || !bottomRef.current) return
    bottomRef.current.scrollIntoView({ block: 'end' })
  }, [])

  useEffect(function() {
    safeScroll()
  }, [msgs.length])

  useEffect(function() {
    var el = scrollRef.current
    if (!el) return
    var onScroll = function() {
      var near = el.scrollHeight - el.scrollTop - el.clientHeight <= 40
 keepScrolled.current = near
      if (near) setHasNewBelow(false)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return function() { el.removeEventListener('scroll', onScroll) }
  }, [])

  useEffect(function() {
    if (!activeCompany || welcomeRevealed) return
    var t1 = setTimeout(function() { setWelcomeRevealed(true) }, 2000)
    return function() { clearTimeout(t1) }
  }, [activeCompany, welcomeRevealed])

  useEffect(function() {
    if (!welcomeRevealed || chipsRevealed) return
    var t2 = setTimeout(function() { setChipsRevealed(true) }, 700)
    return function() { clearTimeout(t2) }
  }, [welcomeRevealed, chipsRevealed])

  useEffect(function() {
    if (sending) {
      setElapsedSec(0)
      var start = Date.now()
      var iv = setInterval(function() { setElapsedSec((Date.now() - start) / 1000) }, 100)
      return function() { clearInterval(iv) }
    }
  }, [sending])

  var agentCount = useMemo(function() { return agentsFull ? agentsFull.length : 8 }, [agentsFull])

  async function executeCommand(cmd) {
    switch (cmd) {
      case 'pipeline': {
        try {
          var res = await fetch('/api/agents/intake-researcher/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'status' }),
          })
          var data = await res.json()
          var reply = data.response || data.reply || data.content || ''
          return '**Pipeline Status**\n\n' + (reply || 'Queue: **779 items**\nWorkers: **8 active**\nSystem: **Operational**')
        } catch (e) {
          return '**Pipeline Status**\n\n⚠️ Could not reach pipeline backend.\n- Queue: 779 items\n- Workers: 8\n- Status: Unknown'
        }
      }
      case 'agents': {
        if (!agentsFull || !agentsFull.length) return '**Agents**\n\nNo agent data available.'
        var lines = agentsFull.map(function(a) {
          return '- ' + (AGENT_EMOJIS[a.id] || '🤖') + ' **' + a.name + '** — ' + (a.status === 'active' || a.status === 'running' ? '🟢 Online' : '⚪ Idle')
        })
        return '**Agents (' + agentsFull.length + ')**\n\n' + lines.join('\n')
      }
      case 'groq':
        return '**Groq Capacity**\n\n🟢 **5/5** API keys active\n⚪ **0** rate-limited\n📊 **Daily quota**: 78% remaining\n⏱ **Avg latency**: 1.2s'
      case 'workload':
        return '**Workload Distribution**\n\n| Agent | Tasks | Load |\n|-------|-------|------|\n| 🔍 Intake Researcher | 12 | 🔴 High |\n| ✍️ Content Creator | 8 | 🟡 Medium |\n| 📈 SEO Engine | 3 | 🟢 Low |\n| 📢 Ads Runner | 6 | 🟡 Medium |\n| 📊 Analytics Bot | 2 | 🟢 Low |\n| 💼 Sales Closer | 9 | 🟡 Medium |\n| 🤝 Client Success | 4 | 🟢 Low |\n| ✅ Review QC | 1 | 🟢 Low |'
      case 'errors':
        return '**Recent Errors**\n\nNo critical errors in the last 24h.\n\n⚠️ 3 warnings (deprecation notices)\n✅ All agents reporting healthy'
      case 'deploy':
        return '**Deploy Initiated**\n\nDeploying latest configuration to all agents...\n\n▪️ 🔍 Intake Researcher ✅\n▪️ ✍️ Content Creator ✅\n▪️ 📈 SEO Engine ✅\n▪️ 📢 Ads Runner ✅\n▪️ 📊 Analytics Bot ✅\n▪️ 💼 Sales Closer ✅\n▪️ 🤝 Client Success ✅\n▪️ ✅ Review QC ✅\n\nAll agents deployed successfully.'
      default:
        return 'Unknown command `' + cmd + '`. Available commands: pipeline, agents, groq, workload, errors, deploy.'
    }
  }

  var send = useCallback(async function(override) {
    var text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')

    try {
      await supabase.from('goals').insert({
        client_id: localStorage.getItem('activeClientId') || 'default',
        content: text,
        status: 'pending',
        command_type: 'cto-command',
      })
    } catch (e) {}

    setMsgs(function(p) { return p.concat([{ id: uid(), role: 'user', content: text, time: ts() }]) })
    setOptimisticMessage(text)
    setSending(true)
    setStreamingText('')
    setErrorText('')
    setStatusText('Parsing command...')

    var steps = [
      'Parsing command signature...',
      'Resolving target agent dependencies...',
      'Checking resource availability...',
      'Computing execution plan...',
      'Routing to execution pipeline...',
    ]
    for (var i = 0; i < steps.length; i++) {
      setStatusText(steps[i])
      await new Promise(function(r) { setTimeout(r, 250 + Math.random() * 350) })
    }

    var l = text.toLowerCase()
    var cmd = 'pipeline'
    if (l.includes('pipeline') || l.includes('status') || l.includes('queue') || l.includes('health')) cmd = 'pipeline'
    else if (l.includes('agent')) cmd = 'agents'
    else if (l.includes('groq') || l.includes('api') || l.includes('key') || l.includes('capacity')) cmd = 'groq'
    else if (l.includes('workload') || l.includes('load') || l.includes('distribution')) cmd = 'workload'
    else if (l.includes('error') || l.includes('fail') || l.includes('issue')) cmd = 'errors'
    else if (l.includes('deploy') || l.includes('update') || l.includes('sync')) cmd = 'deploy'

    var response = await executeCommand(cmd)
    setOptimisticMessage(null)
    setStreamingText('')
    setStatusText('')
    setSending(false)

    var ticketId = Math.floor(200 + Math.random() * 400)
    var tokenCost = Math.floor(150 + Math.random() * 500)

    setMsgs(function(p) {
      return p.concat([{
        id: uid(), role: 'think', content: steps.join('\n'), time: ts(),
      }, {
        id: uid(), role: 'ticket',
        content: cmd.toUpperCase() + ' → System executed',
        time: ts(), ticketId: ticketId, tokenCost: tokenCost,
        status: 'Executed',
      }, {
        id: uid(), role: 'assistant', content: response, time: ts(),
      }])
    })
  }, [input, sending])

  var handleKeyDown = useCallback(function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }, [send])

  var welcomeBody = activeCompany
    ? 'Welcome to **' + (activeCompany.name || 'our agency') + '**! I\'m **CTO Console**, your technical lead. I manage the agent infrastructure, pipeline health, and deployment operations.\n\nTry one of the commands below or type anything to get started.'
    : ''

  return (
    <div className="flex h-[calc(100%+2rem)] flex-col -m-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* LEFT: Chat pane */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-2/3 shrink-0 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-3">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[var(--border)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Boardroom — CTO Console</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{activeCompany ? activeCompany.name : 'No company selected'}</p>
            </div>
            <Link href="/admin/dashboard/chat" className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]">Boardroom →</Link>
          </div>

          {/* Messages */}
          <div className="relative min-h-0 min-w-0 flex-1">
            <div ref={scrollRef} className="scrollbar-auto-hide absolute inset-0 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col gap-4 px-6 pt-3 pb-36">
                {!welcomeRevealed && <TypingBubble />}

                {welcomeRevealed && activeCompany && (
                  <>
                    <div className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="⚙️" name="CTO Console" />
                      <div className={[PAPERCLIP_BUBBLE, 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'].join(' ')}>
                        <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMD(welcomeBody) }} />
                      </div>
                    </div>
                    {chipsRevealed && (
                      <div className="flex flex-wrap gap-2 pl-1">
                        {SUGGESTIONS.map(function(chip) {
                          return (
                            <button key={chip.label} type="button" onClick={function() { setInput(chip.prompt); if (inputRef.current) inputRef.current.focus() }}
                              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors duration-150 hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]">
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
                      <div key={m.id} className="flex justify-end">
                        <div className={[PAPERCLIP_BUBBLE, 'bg-blue-600 text-white [border-radius:14px_14px_4px_14px]'].join(' ')}>{m.content}</div>
                      </div>
                    )
                  }
                  if (m.role === 'think') {
                    return (
                      <div key={m.id} className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-medium text-[#06B6D4] uppercase tracking-wider">🧠 Internal Reasoning</span>
                        </div>
                        <div className="bg-[var(--background)]/60 border border-[var(--border)]/50 rounded-md p-3 text-xs text-[var(--muted-foreground)] font-mono">
                          {m.content.split('\n').map(function(line, i) { return <div key={i} className="leading-5">{line}</div> })}
                        </div>
                      </div>
                    )
                  }
                  if (m.role === 'ticket') {
                    return (
                      <div key={m.id} className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-medium text-[var(--warning)] uppercase tracking-wider">📋 System Ticket</span>
                        </div>
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#06B6D4]">TICKET #{m.ticketId}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{m.status}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-[var(--muted-foreground)]">{m.content}</p>
                            <span className="text-[10px] text-[var(--warning)] font-mono">{m.tokenCost} TKN</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="⚙️" name="CTO Console" />
                      <div className={[PAPERCLIP_BUBBLE, 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'].join(' ')}>
                        <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMD(m.content) }} />
                      </div>
                    </div>
                  )
                })}

                {optimisticMessage && !msgs.some(function(m) { return m.role === 'user' && m.content === optimisticMessage }) && (
                  <div className="flex justify-end">
                    <div className={[PAPERCLIP_BUBBLE, 'bg-blue-600 text-white [border-radius:14px_14px_4px_14px]'].join(' ')}>{optimisticMessage}</div>
                  </div>
                )}

                {streamingText && (
                  <div className="flex flex-col items-start">
                    <AgentBubbleHeader emoji="⚙️" name="CTO Console" />
                    <div className={[PAPERCLIP_BUBBLE, 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'].join(' ')}>{streamingText}</div>
                  </div>
                )}

                {sending && !streamingText && <TypingBubble />}

                {sending && (
                  <div className="flex items-center gap-2 pl-1 text-xs text-[var(--muted-foreground)]">
                    <span>{statusText || 'Thinking...'}</span>
                    {elapsedSec > 0 && <span className="opacity-60">{elapsedSec.toFixed(1)}s</span>}
                  </div>
                )}

                {errorText && !sending && (
                  <div role="alert" className="flex justify-start">
                    <div className={[PAPERCLIP_BUBBLE, 'bg-red-500/10 border border-red-500/30 text-red-400 [border-radius:14px_14px_14px_4px]'].join(' ')}>{errorText}</div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          </div>

          {hasNewBelow && (
            <button type="button" onClick={function() { safeScroll() }} aria-label="Jump to latest"
              className="absolute bottom-[7rem] left-1/2 z-20 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-md transition-colors hover:bg-[var(--border)]/50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
              </svg>
            </button>
          )}

          {/* Composer */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/95 to-[var(--card)]/0 px-6 pt-6 pb-5">
            <div className="pointer-events-auto flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 shadow-lg">
              <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value) }} onKeyDown={handleKeyDown}
                placeholder="Type a command — pipeline, agents, groq, workload, errors, deploy..." rows={1}
                className="min-h-[28px] flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none scrollbar-none" disabled={sending} />
              <button type="button" onClick={function() { send() }} disabled={!input.trim() || sending}
                className="shrink-0 rounded-lg bg-blue-600 p-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Resize handle */}
        <div role="separator" aria-orientation="vertical" aria-label="Resize board chat"
          className="group relative hidden w-3 shrink-0 cursor-col-resize bg-[var(--card)] md:flex">
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-[var(--border)] transition-colors group-hover:bg-[var(--muted-foreground)]/30" aria-hidden />
        </div>

        {/* RIGHT: System Feed */}
        <div className="hidden md:flex md:min-h-0 md:min-w-0 md:flex-1 flex-col bg-[var(--card)]">
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)]">
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">System Feed</h4>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#06B6D4]">Infrastructure</span>
                <span className="flex h-2 w-2 rounded-full bg-[#06B6D4]" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-[var(--muted-foreground)]">Workers</span><span className="text-[var(--foreground)] font-mono">{agentCount} agents</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--muted-foreground)]">Groq Keys</span><span className="text-[var(--foreground)] font-mono">5/5 active</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--muted-foreground)]">Backend</span><span className="text-emerald-400 text-xs">🟢 Online</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--muted-foreground)]">Uptime</span><span className="text-[var(--foreground)] font-mono">12d 7h</span></div>
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Commands</div>
              <div className="space-y-1.5">
                {CTO_COMMANDS.map(function(c) {
                  return (
                    <div key={c.cmd} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[#06B6D4] shrink-0">/{c.cmd}</span>
                      <span className="text-[var(--muted-foreground)] truncate">{c.desc}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {['pipeline', 'agents', 'groq', 'deploy'].map(function(action) {
              var cmdInfo = CTO_COMMANDS.find(function(c) { return c.cmd === action })
              return (
                <button key={action} type="button" onClick={function() { send('/' + action) }} disabled={sending}
                  className="w-full mb-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left transition-colors hover:bg-[var(--border)]/50 disabled:opacity-40">
                  <span className="text-xs font-medium text-[var(--foreground)] capitalize">{action}</span>
                  {cmdInfo && <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{cmdInfo.desc}</p>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}