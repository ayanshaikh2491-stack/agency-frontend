'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

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

var SUGGESTIONS = [
  { label: '📊 Social Overview', prompt: 'Show me social media performance across all platforms' },
  { label: '📅 Scheduled Posts', prompt: 'What posts are scheduled this week?' },
  { label: '📈 Instagram Analytics', prompt: 'How is Instagram performing this month?' },
  { label: '⚡ Engagement Report', prompt: 'Give me the engagement report and best performing posts' },
]

// ─── MOCK SOCIAL DATA ───
var ACCOUNTS = [
  { platform: 'Instagram', handle: '@ayanagency', connected: true, followers: 2840, growth: '+12%', posts: 124, engagement: 4.8, reach: 45200, status: 'active' },
  { platform: 'Facebook', handle: 'AyanAgency', connected: true, followers: 5200, growth: '+5%', posts: 89, engagement: 2.3, reach: 38100, status: 'active' },
  { platform: 'LinkedIn', handle: 'ayan-agency', connected: true, followers: 1850, growth: '+18%', posts: 42, engagement: 6.1, reach: 28100, status: 'active' },
  { platform: 'Twitter/X', handle: '@ayanagency', connected: false, followers: 0, growth: '-', posts: 0, engagement: 0, reach: 0, status: 'disconnected' },
  { platform: 'YouTube', handle: 'AyanAgency', connected: false, followers: 0, growth: '-', posts: 0, engagement: 0, reach: 0, status: 'disconnected' },
]

var SCHEDULED_POSTS = [
  { id: 'sp1', platform: 'Instagram', content: 'New client success story — Dental SEO increased leads by 150% 🔥', type: 'carousel', status: 'scheduled', date: '2026-06-14', time: '10:00', media: '📸' },
  { id: 'sp2', platform: 'LinkedIn', content: 'Deep dive: How AI is changing B2B lead generation in 2026', type: 'article', status: 'scheduled', date: '2026-06-15', time: '09:00', media: '📄' },
  { id: 'sp3', platform: 'Instagram', content: 'Behind the scenes — Our agency workflow for scaling ads 🚀', type: 'reel', status: 'scheduled', date: '2026-06-16', time: '12:00', media: '🎬' },
  { id: 'sp4', platform: 'Facebook', content: 'Case study: How we helped a local biz get 300% more calls', type: 'image', status: 'draft', date: '2026-06-18', time: '14:00', media: '🖼' },
  { id: 'sp5', platform: 'LinkedIn', content: '5 ad copywriting tips that doubled our CTR this quarter', type: 'carousel', status: 'scheduled', date: '2026-06-19', time: '10:00', media: '📸' },
]

var TOP_POSTS = [
  { platform: 'Instagram', content: 'AI tools that saved us 20hrs/week ⚡', type: 'reel', engagement: 12.4, reach: 12800, date: '2026-06-08' },
  { platform: 'LinkedIn', content: 'The real cost of ignoring SEO in 2026', type: 'article', engagement: 8.7, reach: 6500, date: '2026-06-05' },
  { platform: 'Facebook', content: 'Client win! 3x ROAS in 2 weeks 🎯', type: 'image', engagement: 5.2, reach: 9200, date: '2026-06-03' },
]

var ENGAGEMENT_TOTALS = {
  total_reach: 111400,
  total_followers: 9890,
  total_engagement: 4.4,
  total_posts_this_month: 38,
  best_platform: 'LinkedIn',
  best_platform_eng: 6.1,
}

var CONTENT_TIPS = [
  '🔥 Reels are your top performer — 12.4% engagement vs 4.8% avg',
  '📈 LinkedIn growing 18% MoM — double down on thought leadership',
  '📅 You have 5 posts scheduled this week across 3 platforms',
  '💡 Best posting time: Weekdays 9-11AM IST for highest engagement',
]

function formatNum(n) { if (!n) return '0'; if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'; if (n >= 1000) return (n/1000).toFixed(1) + 'K'; return n.toLocaleString() }

export default function SocialPage() {
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

  var connectedAccounts = ACCOUNTS.filter(function(a) { return a.connected })
  var pendingPosts = SCHEDULED_POSTS.filter(function(p) { return p.status === 'scheduled' })

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

  async function callAgent(text) {
    try {
      var l = text.toLowerCase()
      if (l.includes('overview') || l.includes('all') || l.includes('performance')) {
        return '**📊 Social Media Overview**\n\n' +
          '**Connected:** ' + connectedAccounts.length + '/' + ACCOUNTS.length + ' platforms\n' +
          '**Total Reach:** ' + formatNum(ENGAGEMENT_TOTALS.total_reach) + '\n' +
          '**Total Followers:** ' + formatNum(ENGAGEMENT_TOTALS.total_followers) + '\n' +
          '**Avg Engagement:** ' + ENGAGEMENT_TOTALS.total_engagement + '% (best: ' + ENGAGEMENT_TOTALS.best_platform + ' @ ' + ENGAGEMENT_TOTALS.best_platform_eng + '%)\n' +
          '**Posts this month:** ' + ENGAGEMENT_TOTALS.total_posts_this_month + '\n' +
          '**Scheduled this week:** ' + pendingPosts.length + ' posts\n\n' +
          ACCOUNTS.filter(function(a) { return a.connected }).map(function(a) {
            return '• **' + a.platform + '** — ' + formatNum(a.followers) + ' followers · ' + a.growth + ' growth · ' + a.engagement + '% eng\n  👁 ' + formatNum(a.reach) + ' reach · ' + a.posts + ' posts'
          }).join('\n\n')
      }
      if (l.includes('schedule') || l.includes('post') || l.includes('this week')) {
        return '**📅 Scheduled Posts — This Week**\n\n' +
          pendingPosts.map(function(p) {
            return '• ' + p.media + ' **' + p.platform + '** — ' + p.date + ' @ ' + p.time + '\n  "' + p.content + '"' + (p.type ? '\n  Type: ' + p.type : '')
          }).join('\n\n') +
          '\n\n**Total:** ' + pendingPosts.length + ' scheduled · 1 draft'
      }
      if (l.includes('instagram') || l.includes('ig')) {
        var ig = ACCOUNTS.find(function(a) { return a.platform === 'Instagram' })
        if (!ig || !ig.connected) return 'Instagram not connected yet. Want to connect it?'
        return '**📸 Instagram Analytics**\n\n' +
          '• Followers: ' + formatNum(ig.followers) + ' (' + ig.growth + ' growth)\n' +
          '• Posts: ' + ig.posts + ' this month\n' +
          '• Engagement: ' + ig.engagement + '%\n' +
          '• Reach: ' + formatNum(ig.reach) + '\n\n' +
          '**Top Post:** ' + TOP_POSTS.filter(function(p) { return p.platform === 'Instagram' }).map(function(p) { return '"' + p.content + '" — ' + p.engagement + '% eng · ' + formatNum(p.reach) + ' reach' }).join('\n')
      }
      if (l.includes('engagement') || l.includes('top post') || l.includes('best performing')) {
        return '**⚡ Engagement Report**\n\n' +
          '• Avg Engagement: ' + ENGAGEMENT_TOTALS.total_engagement + '%\n' +
          '• Best Platform: ' + ENGAGEMENT_TOTALS.best_platform + ' @ ' + ENGAGEMENT_TOTALS.best_platform_eng + '%\n\n' +
          '**Top 3 Posts:**\n\n' +
          TOP_POSTS.map(function(p, i) {
            return (i + 1) + '. ' + p.platform + ' — ' + '\n   "' + p.content + '"\n   ❤️ ' + p.engagement + '% eng · 👁 ' + formatNum(p.reach) + ' reach'
          }).join('\n\n')
      }
      return 'Let me check social data for you! 📱'
    } catch(e) {
      return 'Checking social data for you... 📱'
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

  var welcomeBody = 'Hey! I\'m your **Social Media Manager** 📱\n\nI manage all your platforms — Instagram, Facebook, LinkedIn, Twitter & YouTube.\n\n**What do you need?**\n📊 Full social overview\n📅 Scheduled posts & calendar\n📈 Instagram/Facebook/LinkedIn analytics\n⚡ Engagement report & best posts'

  return (
    <div className="flex h-[calc(100%+2rem)] flex-col -m-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* ─── LEFT: Chat ─── */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-[45%] shrink-0 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500/20">
                <span className="text-sm">📱</span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Social Media</h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">● Live</span>
                </div>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{connectedAccounts.length} connected · {formatNum(ENGAGEMENT_TOTALS.total_followers)} followers · {pendingPosts.length} scheduled</p>
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
                      <AgentBubbleHeader emoji="📱" name="Social Media Manager" />
                      <div className={PAPERCLIP_BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'}>
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
                        <div className={PAPERCLIP_BUBBLE + ' bg-primary text-white [border-radius:14px_14px_4px_14px]'}>{m.content}</div>
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className="flex flex-col items-start">
                      <AgentBubbleHeader emoji="📱" name="Social Media Manager" />
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
                <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value) }} onKeyDown={handleKeyDown}
                  placeholder="Ask your Social Media Manager..." rows={1}
                  className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none scrollbar-none" disabled={sending} />
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
          className="group relative hidden w-3 shrink-0 cursor-col-resize bg-[var(--card)] md:flex">
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-[var(--border)] transition-colors group-hover:bg-[var(--muted-foreground)]/30" aria-hidden />
        </div>

        {/* ─── RIGHT: Social Intelligence Dashboard ─── */}
        <div className="hidden md:flex md:min-h-0 md:min-w-0 md:flex-1 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Social Intelligence</h4>
              <span className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">Live</span>
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="shrink-0 px-4 py-2 flex gap-1.5 border-b border-[var(--border)]">
            {[
              { id: 'overview', label: '🕵️ Overview' },
              { id: 'accounts', label: '📸 Accounts' },
              { id: 'content', label: '📅 Content' },
              { id: 'analytics', label: '📈 Analytics' },
            ].map(function(tab) {
              return (
                <button key={tab.id} type="button" onClick={function() { setSelectedTab(tab.id) }}
                  className={'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ' + (selectedTab === tab.id
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'text-[var(--muted-foreground)] border border-transparent hover:text-[var(--foreground)]')}>
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
                    { label: 'Total Followers', value: formatNum(ENGAGEMENT_TOTALS.total_followers), color: 'text-[var(--foreground)]' },
                    { label: 'Total Reach', value: formatNum(ENGAGEMENT_TOTALS.total_reach), color: 'text-pink-400' },
                    { label: 'Avg Engagement', value: ENGAGEMENT_TOTALS.total_engagement + '%', color: 'text-emerald-400' },
                    { label: 'Best Platform', value: ENGAGEMENT_TOTALS.best_platform, color: 'text-[var(--primary)]' },
                  ].map(function(m) {
                    return (
                      <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
                        <p className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider">{m.label}</p>
                        <p className={'text-sm font-bold mt-0.5 ' + m.color}>{m.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Connect Status */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-pink-400">🔗 Connected Platforms</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{connectedAccounts.length}/{ACCOUNTS.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {ACCOUNTS.map(function(a) {
                      return (
                        <div key={a.platform} className={'flex items-center justify-between rounded-lg border ' + (a.connected ? 'border-[var(--border)]' : 'border-[var(--border)]/50 opacity-50') + ' bg-[var(--card)] px-3 py-2'}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">
                              {a.platform === 'Instagram' ? '📸' : a.platform === 'Facebook' ? '📘' : a.platform === 'LinkedIn' ? '💼' : a.platform === 'Twitter/X' ? '🐦' : '▶️'}
                            </span>
                            <div>
                              <span className="text-[11px] text-[var(--foreground)] font-medium">{a.platform}</span>
                              <p className="text-[9px] text-[var(--muted-foreground)]">{a.handle}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {a.connected ? (
                              <>
                                <span className="text-[10px] text-emerald-400">● Connected</span>
                                <p className="text-[9px] text-[var(--muted-foreground)]">{formatNum(a.followers)} followers</p>
                              </>
                            ) : (
                              <Link href="/admin/connect" className="text-[10px] text-pink-400 hover:underline">+ Connect</Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Growth Bar */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">📊 Followers Growth by Platform</span>
                  <div className="mt-2 space-y-1.5">
                    {ACCOUNTS.filter(function(a) { return a.connected }).map(function(a) {
                      var pct = Math.round((a.followers / ENGAGEMENT_TOTALS.total_followers) * 100)
                      return (
                        <div key={a.platform} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--muted-foreground)] w-20 truncate">{a.platform}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: pct + '%' }} />
                          </div>
                          <span className="text-[10px] text-[var(--foreground)] font-mono w-14 text-right">{formatNum(a.followers)}</span>
                          <span className={'text-[9px] font-medium w-8 text-right ' + (a.growth.startsWith('+') ? 'text-emerald-400' : 'text-red-400')}>{a.growth}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Content Tips */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">💡 Intelligence</span>
                  <div className="mt-1.5 space-y-1">
                    {CONTENT_TIPS.map(function(t, idx) {
                      return <p key={idx} className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">{t}</p>
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB: Accounts ─── */}
            {selectedTab === 'accounts' && (
              <>
                <div className="space-y-1.5">
                  {ACCOUNTS.map(function(a) {
                    var emoji = a.platform === 'Instagram' ? '📸' : a.platform === 'Facebook' ? '📘' : a.platform === 'LinkedIn' ? '💼' : a.platform === 'Twitter/X' ? '🐦' : '▶️'
                    return (
                      <div key={a.platform} className={'rounded-lg border ' + (a.connected ? 'border-[var(--border)]' : 'border-[var(--border)]/50') + ' bg-[var(--card)] p-3 ' + (!a.connected ? 'opacity-60' : '')}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{emoji}</span>
                            <div>
                              <span className="text-xs text-[var(--foreground)] font-medium">{a.platform}</span>
                              <p className="text-[9px] text-[var(--muted-foreground)]">{a.handle}</p>
                            </div>
                          </div>
                          <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (a.connected ? 'bg-emerald-400/10 text-emerald-400' : 'bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]')}>
                            {a.connected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                        {a.connected && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                              <p className="text-[9px] text-[var(--muted-foreground)]">Followers</p>
                              <p className="text-[11px] text-[var(--foreground)] font-medium">{formatNum(a.followers)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[var(--muted-foreground)]">Engagement</p>
                              <p className="text-[11px] text-[var(--foreground)] font-medium">{a.engagement}%</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[var(--muted-foreground)]">Reach</p>
                              <p className="text-[11px] text-[var(--foreground)] font-medium">{formatNum(a.reach)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ─── TAB: Content ─── */}
            {selectedTab === 'content' && (
              <>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-pink-400">📅 This Week</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{pendingPosts.length} scheduled</span>
                  </div>
                  <div className="space-y-1.5">
                    {SCHEDULED_POSTS.map(function(p) {
                      var dayName = new Date(p.date).toLocaleDateString('en', { weekday: 'short' })
                      return (
                        <div key={p.id} className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                          <span className="text-xs mt-0.5">{p.media}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[var(--muted-foreground)]">{dayName} {p.date}</span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">·</span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">{p.time}</span>
                              <span className={'text-[9px] px-1.5 py-0.5 rounded-full font-medium ' + (p.status === 'scheduled' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]')}>{p.status}</span>
                            </div>
                            <p className="text-[11px] text-[var(--foreground)] truncate mt-0.5">{p.content}</p>
                          </div>
                          <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{p.platform === 'Instagram' ? '📸' : p.platform === 'LinkedIn' ? '💼' : '📘'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Posts */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">🏆 Top Performing Posts</span>
                  <div className="mt-2 space-y-1.5">
                    {TOP_POSTS.map(function(p, i) {
                      var emoji = p.platform === 'Instagram' ? '📸' : p.platform === 'LinkedIn' ? '💼' : '📘'
                      return (
                        <div key={i} className="border border-[var(--border)] rounded-lg bg-[var(--card)] px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px]">{emoji}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">{p.platform}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">·</span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">{p.date}</span>
                          </div>
                          <p className="text-[11px] text-[var(--foreground)] mt-0.5">"{p.content}"</p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] text-[var(--muted-foreground)]">
                            <span>❤️ {p.engagement}% eng</span>
                            <span>👁 {formatNum(p.reach)} reach</span>
                          </div>
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
                {/* Summary */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Total Posts', value: ENGAGEMENT_TOTALS.total_posts_this_month + ' this month', sub: '+8 vs last month' },
                    { label: 'Best Engagement', value: ENGAGEMENT_TOTALS.best_platform_eng + '%', sub: ENGAGEMENT_TOTALS.best_platform },
                    { label: 'Avg Reach/Post', value: formatNum(Math.round(ENGAGEMENT_TOTALS.total_reach / ENGAGEMENT_TOTALS.total_posts_this_month)), sub: 'across all platforms' },
                    { label: 'Growth Rate', value: '+11.7%', sub: 'MoM avg' },
                  ].map(function(m) {
                    return (
                      <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                        <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">{m.label}</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-0.5">{m.value}</p>
                        <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5">{m.sub}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Platform Breakdown */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">📊 Platform Engagement</span>
                  <div className="mt-2 space-y-1.5">
                    {ACCOUNTS.filter(function(a) { return a.connected }).sort(function(a, b) { return b.engagement - a.engagement }).map(function(a) {
                      var maxEng = Math.max(...ACCOUNTS.filter(function(x) { return x.connected }).map(function(x) { return x.engagement }))
                      var pct = Math.round((a.engagement / maxEng) * 100)
                      return (
                        <div key={a.platform} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--muted-foreground)] w-20 truncate">{a.platform}</span>
                          <div className="flex-1 h-3 rounded-full bg-[var(--border)] overflow-hidden">
                            <div className={'h-full rounded-full ' + (a.engagement >= 5 ? 'bg-emerald-500' : a.engagement >= 3 ? 'bg-[oklch(0.75 0.18 40)]' : 'bg-[var(--muted-foreground)]')} style={{ width: pct + '%' }} />
                          </div>
                          <span className="text-[10px] text-[var(--foreground)] font-mono w-12 text-right">{a.engagement}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Post Type Performance */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">🎬 Post Type Performance</span>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {[
                      { type: '📹 Reels', eng: 12.4, label: 'Best' },
                      { type: '📸 Carousel', eng: 6.8, label: 'Great' },
                      { type: '📄 Article', eng: 8.7, label: 'Good' },
                      { type: '🖼 Image', eng: 5.2, label: 'Avg' },
                      { type: '📝 Text', eng: 2.1, label: 'Low' },
                      { type: '🎥 Video', eng: 7.3, label: 'Good' },
                    ].map(function(p) {
                      return (
                        <div key={p.type} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-center">
                          <p className="text-sm">{p.type}</p>
                          <p className="text-[11px] text-[var(--foreground)] font-medium">{p.eng}%</p>
                          <p className="text-[9px] text-[var(--muted-foreground)]">{p.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Intelligence */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">💡 Growth Tips</span>
                  <div className="mt-1.5 space-y-1">
                    {CONTENT_TIPS.map(function(t, idx) {
                      return <p key={idx} className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">{t}</p>
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}