'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useCompany } from '@/lib/client-context'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { uid, ts, PAPERCLIP_BUBBLE, AgentBubbleHeader, TypingBubble, renderMD, detectWorker } from '@/lib/chat-utils'
import PageShell from '@/components/PageShell'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

const WORKER_LABELS = {
  'intake-researcher': 'Intake Researcher',
  'content-creator': 'Content Creator',
  'seo-engine': 'SEO Engine',
  'ads-runner': 'Ads Runner',
  'analytics-bot': 'Analytics Bot',
  'sales-closer': 'Sales Closer',
  'client-success': 'Client Success',
  'review-qc': 'Review QC',
}

const AGENT_EMOJIS = {
  'intake-researcher': '🔍', 'content-creator': '✍️', 'seo-engine': '📈',
  'ads-runner': '📢', 'analytics-bot': '📊', 'sales-closer': '💼',
  'client-success': '🤝', 'review-qc': '✅',
}

const SUGGESTIONS = [
  { label: '🔍 Find Leads', prompt: 'Find hot leads in Dubai real estate market' },
  { label: '✍️ Create Content', prompt: 'Write a blog post about AI in marketing' },
  { label: '📊 Check Status', prompt: 'Give me a quick status update on everything' },
  { label: '📢 Run Ads', prompt: 'Set up Facebook ads campaign' },
]

const CEO_RESPONSES = {
  greeting: function(name) {
    return "Hey " + (name || "there") + "! 👋 I'm your CEO. Ready to get things rolling.\n\n**What do you need today?**\n• Leads to chase 🔍\n• Content to publish ✍️\n• Ads to launch 📢\n• Or just checking in on things"
  },
  lead: function() {
    return "On it. I'll have my intake team dig into Dubai real estate — companies, decision-makers, contact info. Give me a few minutes and I'll come back with a solid list. 🎯"
  },
  content: function() {
    return "Let's get that blog rolling! My content team will draft something sharp around AI in marketing — relevant, on-brand, and publish-ready. I'll review it before it goes out. ✍️"
  },
  ads: function() {
    return "Facebook ads campaign — good call. I'll brief my ads runner on targeting, budget, and creatives. Let me get the setup going and I'll loop you in on the plan. 📢"
  },
  status: function() {
    return "Quick check coming up. Everyone's been running steady — I'll pull the latest from each team and give you the highlights. 📊"
  },
  general: function() {
    return "Got it. Let me look into this and get the right people on it. I'll have a solid answer for you shortly. 👍"
  },
}

export default function CEOPage() {
  var ctx = useCompany()
  var agentsFull = ctx.agentsFull
  var activeCompany = ctx.activeCompany
  var msgsState = useState([])
  var msgs = msgsState[0], setMsgs = msgsState[1]
  var inputState = useState('')
  var input = inputState[0], setInput = inputState[1]
  var sendingState = useState(false)
  var sending = sendingState[0], setSending = sendingState[1]
  var welcomeState = useState(false)
  var welcomeRevealed = welcomeState[0], setWelcomeRevealed = welcomeState[1]
  var chipsState = useState(false)
  var chipsRevealed = chipsState[0], setChipsRevealed = chipsState[1]
  var filesState = useState([])
  var files = filesState[0], setFiles = filesState[1]
  var bottomRef = useRef(null)
  var inputRef = useRef(null)
  var fileInputRef = useRef(null)
  var scrollRef = useRef(null)
  var keepScrolled = useRef(true)

  var safeScroll = useCallback(function() {
    if (!keepScrolled.current || !bottomRef.current) return
    bottomRef.current.scrollIntoView({ block: 'end' })
  }, [])

  // Only auto-scroll when user sends a message or receives final response
  useEffect(function() {
    safeScroll()
  }, [msgs.length])

  useEffect(function() {
    var el = scrollRef.current
    if (!el) return
    var onScroll = function() {
      var dist = el.scrollHeight - el.scrollTop - el.clientHeight
      keepScrolled.current = dist <= 40
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return function() { el.removeEventListener('scroll', onScroll) }
  }, [])

  useEffect(function() {
    if (!activeCompany || welcomeRevealed) return
    var t1 = setTimeout(function() { setWelcomeRevealed(true) }, 1500)
    return function() { clearTimeout(t1) }
  }, [activeCompany, welcomeRevealed])

  useEffect(function() {
    if (!welcomeRevealed || chipsRevealed) return
    var t2 = setTimeout(function() { setChipsRevealed(true) }, 500)
    return function() { clearTimeout(t2) }
  }, [welcomeRevealed, chipsRevealed])

  var agentCount = useMemo(function() { return agentsFull ? agentsFull.length : 8 }, [agentsFull])
  var onlineCount = useMemo(function() {
    return agentsFull ? agentsFull.filter(function(a) { return a.status === 'active' || a.status === 'running' }).length : 8
  }, [agentsFull])

  function handleFileSelect(e) {
    var selected = Array.from(e.target.files || [])
    var valid = selected.filter(function(f) { return f.type.startsWith('image/') || f.type.startsWith('video/') })
    setFiles(function(prev) { return prev.concat(valid.map(function(f) { return { file: f, url: URL.createObjectURL(f), id: uid() } })) })
    e.target.value = ''
  }

  function removeFile(id) {
    setFiles(function(prev) { return prev.filter(function(f) { return f.id !== id }) })
  }

  var send = useCallback(async function(override) {
    var text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')

    var attachedFiles = files.length > 0 ? files.map(function(f) {
      return { id: f.id, type: f.file.type.startsWith('image/') ? 'image' : 'video', url: f.url, name: f.file.name }
    }) : []

    try {
      await supabase.from('goals').insert({
        client_id: localStorage.getItem('activeClientId') || 'default',
        content: text + (attachedFiles.length ? ' [with ' + attachedFiles.length + ' file(s)]' : ''),
        status: 'pending',
        command_type: 'ceo-directive',
      })
    } catch (e) {}

    var userMsg = { id: uid(), role: 'user', content: text, time: ts(), files: attachedFiles.length ? attachedFiles : undefined }
    setMsgs(function(p) { return p.concat([userMsg]) })
    setFiles([])
    setSending(true)
    setWelcomeRevealed(true)
    setChipsRevealed(true)

    var l = text.toLowerCase()
    var ceoReply = ''

    if (l.includes('hi') || l.includes('hello') || l.includes('hey') || l.includes('good morning') || l.includes('good evening') || l.includes('yo') || l.includes('sup')) {
      ceoReply = CEO_RESPONSES.greeting(activeCompany ? activeCompany.name : '')
    } else if (l.includes('thank') || l.includes('thanks') || l.includes('good') || l.includes('nice') || l.includes('perfect')) {
      ceoReply = "Glad you like it! 👍 What's next on your mind?"
    } else {
      // Route to worker behind the scenes
      var targetWorker = detectWorker(text)
      if (targetWorker) {
        try {
          var res = await fetch('/api/agents/' + targetWorker.id + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, client_name: activeCompany?.name || '' }),
          })
          var data = res.ok ? (await res.json()) : null
        } catch (e) {}

        if (l.includes('lead') || l.includes('find') || l.includes('research')) ceoReply = CEO_RESPONSES.lead()
        else if (l.includes('content') || l.includes('blog') || l.includes('write') || l.includes('post') || l.includes('draft')) ceoReply = CEO_RESPONSES.content()
        else if (l.includes('ads') || l.includes('facebook') || l.includes('linkedin') || l.includes('campaign')) ceoReply = CEO_RESPONSES.ads()
        else if (l.includes('status') || l.includes('health') || l.includes('update') || l.includes('how is') || l.includes('check')) ceoReply = CEO_RESPONSES.status()
        else ceoReply = "On it. Let me put the right people on this and get you a solid answer. 💪"
      } else {
        // No worker match -> conversational response
        try {
          var res2 = await fetch('/api/agents/intake-researcher/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Respond as a helpful CEO assistant to this message. Be brief and natural. Message: ' + text, client_name: activeCompany?.name || '' }),
          })
          var data2 = res2.ok ? (await res2.json()) : null
          ceoReply = (data2 && (data2.response || data2.reply || data2.content))
            ? (data2.response || data2.reply || data2.content)
            : "Got it. Let me check on this and get back to you. 👍"
        } catch (e) {
          ceoReply = "Got it. Let me check on this and get back to you. 👍"
        }
      }
    }

    // Small natural delay like a real person
    await new Promise(function(r) { setTimeout(r, 300 + Math.random() * 600) })
    setSending(false)
    setMsgs(function(p) { return p.concat([{ id: uid(), role: 'assistant', content: ceoReply, time: ts() }]) })
  }, [input, sending, files, activeCompany])

  var handleKeyDown = useCallback(function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }, [send])

  var welcomeBody = activeCompany
    ? "Hey! 👋 I'm your CEO. I run the show around here — leads, content, ads, the whole operation.\n\n**Just tell me what you need and I'll make it happen.**"
    : ''

  return (
    <PageShell>
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* LEFT: Chat pane */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-2/3 shrink-0 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-3">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[var(--border)]" aria-hidden />
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/20">
                <span className="text-sm">👑</span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">CEO</h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">● Online</span>
                </div>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{activeCompany ? activeCompany.name : 'No company selected'}</p>
              </div>
            </div>
            <Link href="/admin/dashboard/chat" className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]">Boardroom →</Link>
          </div>

          {/* Messages */}
          <div className="relative min-h-0 min-w-0 flex-1">
            <div ref={scrollRef} className="scrollbar-auto-hide absolute inset-0 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col gap-3 px-6 pt-3 pb-32">
                {!welcomeRevealed && <TypingBubble />}

                {welcomeRevealed && activeCompany && (
                  <>
                    <div className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="👑" name="CEO" />
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
                      <div key={m.id} className="flex flex-col items-end gap-1">
                        {m.files && m.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end max-w-[85%]">
                            {m.files.map(function(f) {
                              return f.type === 'image'
                                ? <img key={f.id} src={f.url} alt={f.name} className="max-w-[180px] max-h-[180px] rounded-lg border border-[var(--border)] object-cover" />
                                : <video key={f.id} src={f.url} controls className="max-w-[180px] max-h-[180px] rounded-lg border border-[var(--border)]" />
                            })}
                          </div>
                        )}
                        <div className={[PAPERCLIP_BUBBLE, 'bg-primary text-white [border-radius:14px_14px_4px_14px]'].join(' ')}>{m.content}</div>
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="👑" name="CEO" />
                      <div className={[PAPERCLIP_BUBBLE, 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'].join(' ')}>
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

          {/* ChatGPT-style Composer */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/95 to-[var(--card)]/0 px-6 pt-6 pb-5">
            <div className="pointer-events-auto relative rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 pb-2 pt-3 shadow-lg transition-colors focus-within:border-[var(--muted-foreground)]/60">
              {/* File previews */}
              {files.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {files.map(function(f) {
                    return (
                      <div key={f.id} className="relative group">
                        {f.file.type.startsWith('image/')
                          ? <img src={f.url} alt={f.file.name} className="h-14 w-14 rounded-md border border-[var(--border)] object-cover" />
                          : <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] text-xs">🎬</div>
                        }
                        <button type="button" onClick={function() { removeFile(f.id) }}
                          className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--muted-foreground)] text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Input row */}
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value) }} onKeyDown={handleKeyDown}
                  placeholder="Message CEO..." rows={1}
                  className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none scrollbar-none" disabled={sending} />
                <div className="flex shrink-0 items-center gap-1 pb-0.5">
                  <button type="button" onClick={function() { if (fileInputRef.current) fileInputRef.current.click() }}
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />
                  <button type="button" onClick={function() { send() }} disabled={(!input.trim() && !files.length) || sending}
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

        {/* Resize handle */}
        <div role="separator" aria-orientation="vertical" aria-label="Resize board chat"
          className="group relative hidden w-3 shrink-0 cursor-col-resize bg-[var(--card)] md:flex">
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-[var(--border)] transition-colors group-hover:bg-[var(--muted-foreground)]/30" aria-hidden />
        </div>

        {/* RIGHT: Agent Health */}
        <div className="hidden md:flex md:min-h-0 md:min-w-0 md:flex-1 flex-col bg-[var(--card)]">
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Agent Health</h4>
              <span className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">{onlineCount}/{agentCount}</span>
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Pipeline */}
            <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">Pipeline</span>
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400">Active</span>
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-[var(--muted-foreground)]">Queue</span><span className="text-[var(--foreground)] font-mono">779</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--muted-foreground)]">Workers</span><span className="text-[var(--foreground)] font-mono">{agentCount} agents</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--muted-foreground)]">Uptime</span><span className="text-[var(--foreground)] font-mono">99.7%</span></div>
              </div>
            </div>

            {/* Agent Roster */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 px-0.5">Team</div>
              {Object.keys(WORKER_LABELS).map(function(slug) {
                var label = WORKER_LABELS[slug]
                var emoji = AGENT_EMOJIS[slug]
                var agent = agentsFull ? agentsFull.find(function(a) { return a.id === slug }) : null
                var online = agent ? (agent.status === 'active' || agent.status === 'running') : true
                return (
                  <div key={slug} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                    <span className="text-xs shrink-0">{emoji}</span>
                    <span className="text-xs text-[var(--foreground)] truncate">{label}</span>
                    <span className={'ml-auto shrink-0 flex h-1.5 w-1.5 rounded-full ' + (online ? 'bg-emerald-400' : 'bg-[var(--muted-foreground)]')} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}