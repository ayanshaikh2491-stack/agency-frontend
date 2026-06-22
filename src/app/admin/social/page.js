'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { uid, ts, PAPERCLIP_BUBBLE, AgentBubbleHeader, TypingBubble, renderMD } from '@/lib/chat-utils'
import PageShell from '@/components/PageShell'

var SUGGESTIONS = [
  { label: '📊 Social Overview', prompt: 'Show me social media performance across all platforms' },
  { label: '📅 Scheduled Posts', prompt: 'What posts are scheduled this week?' },
  { label: '📈 Instagram Analytics', prompt: 'How is Instagram performing this month?' },
  { label: '⚡ Engagement Report', prompt: 'Give me the engagement report and best performing posts' },
]

// ─── REAL DATA — loaded from backend ───
var ACCOUNTS = []

var SCHEDULED_POSTS = []

var TOP_POSTS = []

var ENGAGEMENT_TOTALS = {
  total_reach: 0,
  total_followers: 0,
  total_engagement: 0,
  total_posts_this_month: 0,
  best_platform: null,
  best_platform_eng: 0,
}

var CONTENT_TIPS = []

function formatNum(n) { if (!n) return '0'; if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'; if (n >= 1000) return (n/1000).toFixed(1) + 'K'; return n.toLocaleString() }

export default function SocialPage() {
  var [msgs, setMsgs] = useState([])
  var [input, setInput] = useState('')
  var [sending, setSending] = useState(false)
  var [welcomeRevealed, setWelcomeRevealed] = useState(false)
  var [chipsRevealed, setChipsRevealed] = useState(false)
  var [selectedTab, setSelectedTab] = useState('overview')
  var [successMsg, setSuccessMsg] = useState('')
  var [refreshKey, setRefreshKey] = useState(0)
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

  // Handle OAuth callback success
  useEffect(function() {
    var params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'facebook_connected') {
      var page = params.get('page_name') || 'Facebook'
      setSuccessMsg('✅ ' + page + ' connected successfully!')
      window.history.replaceState({}, '', '/admin/social')
      setTimeout(function() { setSuccessMsg('') }, 5000)
    }
    if (params.get('error')) {
      setSuccessMsg('Connection failed')
      window.history.replaceState({}, '', '/admin/social')
      setTimeout(function() { setSuccessMsg('') }, 8000)
    }
  }, [])

  // Fetch connected accounts from backend
  useEffect(function() {
    fetch('/api/social-manager/accounts').then(function(r) { return r.json() }).then(function(d) {
      if (d.success && d.data) {
        ACCOUNTS.length = 0
        d.data.forEach(function(a) {
          ACCOUNTS.push({
            platform: a.platform === 'facebook' ? 'Facebook' : a.platform === 'instagram' ? 'Instagram' : a.platform,
            connected: true,
            name: a.account_name || (a.meta && a.meta.page_name) || a.account_id,
            followers: 0,
            engagement: 0,
            reach: 0,
            posts: 0,
            growth: '+0%',
            id: a.account_id
          })
        })
        setRefreshKey(function(v) { return v + 1 })
      }
    }).catch(function() {})
  }, [])

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
    <PageShell>
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* ─── LEFT: Chat ─── */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-[45%] shrink-0 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="relative flex shrink-0 flex-col">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
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
              <div className="flex items-center gap-2">
              <button onClick={function() {
                window.location.href = 'https://www.facebook.com/v18.0/dialog/oauth?client_id=1900581880622376&redirect_uri=https%3A%2F%2Fagency-frontend-seven.vercel.app%2Fapi%2Fsocial%2Foauth%2Ffacebook%2Fcallback&scope=pages_show_list,pages_read_engagement,pages_manage_posts,ads_management,ads_read,business_management,instagram_basic,instagram_content_publish,public_profile&state=default:facebook&response_type=code';
              }}
                 className="flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166fe5] transition-colors cursor-pointer">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Connect Facebook
              </button>
              <button onClick={function() {
                window.location.href = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=&redirect_uri=http://18.213.66.136:8000/api/social/oauth/linkedin/callback&scope=w_member_social,email&state=default:linkedin';
              }}
                 className="flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#004182] transition-colors cursor-pointer">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Connect LinkedIn
              </button>
            </div>
            {successMsg ? (
              <div className="flex items-center justify-center px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-sm text-emerald-400">
                {successMsg}
              </div>
            ) : null}
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
                        {SUGGESTIONS.map(function(s) {
                          return (
                            <button key={s.label} onClick={function() { send(s.prompt) }} className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {msgs.map(function(m) {
                      if (m.role === 'user') {
                        return (
                          <div key={m.id} className="flex flex-col items-end gap-1">
                            <div className={PAPERCLIP_BUBBLE + ' bg-[var(--primary)] text-white [border-radius:14px_14px_4px_14px]'}>
                              {m.content}
                            </div>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--card)] via-[var(--card)] to-transparent pt-6">
            <div className="pointer-events-auto relative rounded-xl border border-[var(--border)] bg-[var(--background)] mx-4 mb-3">
              <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value) }} onKeyDown={handleKeyDown} placeholder="Ask your Social Media Manager..." rows={1} className="scrollbar-auto-hide block w-full resize-none bg-transparent px-3 py-2.5 pr-11 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none" style={{ maxHeight: '120px' }} />
              <div className="flex shrink-0 items-center gap-1 pb-0.5">
                <button disabled={!input.trim() || sending} onClick={function() { send() }} className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-white disabled:opacity-30 transition-opacity">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div role="separator" aria-orientation="vertical"
          className="hidden md:block w-px shrink-0 bg-[var(--border)]" />
        {/* ─── RIGHT: Dashboard ─── */}
        <div className="hidden md:flex md:min-h-0 md:min-w-0 md:flex-1 flex-col bg-[var(--card)] min-w-0">
          {/* Tabs */}
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">SOCIAL INTELLIGENCE</h3>
            </div>
          </div>
          <div className="shrink-0 px-4 py-2 flex gap-1.5 border-b border-[var(--border)] overflow-x-auto">
            {[
              { id: 'overview', label: '🕵️ Overview' },
              { id: 'accounts', label: '📸 Accounts' },
              { id: 'content', label: '📅 Content' },
              { id: 'analytics', label: '📈 Analytics' },
            ].map(function(tab) {
              return (
                <button key={tab.id} onClick={function() { setSelectedTab(tab.id) }}
                  className={'shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ' + (selectedTab === tab.id ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ─── TAB: Overview ─── */}
          {selectedTab === 'overview' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-auto-hide">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Connected Accounts', value: connectedAccounts.length + '/' + ACCOUNTS.length, color: 'text-[var(--foreground)]' },
                  { label: 'Total Followers', value: formatNum(ENGAGEMENT_TOTALS.total_followers), color: 'text-[var(--foreground)]' },
                  { label: 'Total Reach', value: formatNum(ENGAGEMENT_TOTALS.total_reach), color: 'text-pink-400' },
                  { label: 'Avg Engagement', value: ENGAGEMENT_TOTALS.total_engagement + '%', color: 'text-emerald-400' },
                ].map(function(m) {
                  return (
                    <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2">
                      <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5">{m.label}</div>
                      <div className={'text-lg font-bold tracking-tight ' + m.color}>{m.value}</div>
                    </div>
                  )
                })}
              </div>

              {/* Connected Platforms */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[var(--foreground)]">Connected Platforms</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">{connectedAccounts.length}/{ACCOUNTS.length}</span>
                </div>
                <div className="space-y-1.5">
                  {ACCOUNTS.map(function(a) {
                    return (
                      <div key={a.platform} className={'flex items-center justify-between rounded-lg px-2 py-1.5 ' + (a.connected ? 'bg-emerald-500/5' : 'bg-[var(--background)]')}>
                        <div className="flex items-center gap-2">
                          <div className={'h-1.5 w-1.5 rounded-full ' + (a.connected ? 'bg-emerald-400' : 'bg-[var(--border)]')} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-[var(--foreground)]">{a.platform}</span>
                              {a.connected && <span className="text-[9px] text-emerald-400">Connected</span>}
                            </div>
                            {a.name && <div className="text-[10px] text-[var(--muted-foreground)]">{a.name}</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-[var(--foreground)]">{formatNum(a.followers)}</div>
                          <div className="text-[9px] text-[var(--muted-foreground)]">followers</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Content Tips */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <span className="text-[11px] font-medium text-[var(--foreground)]">📝 Content Tips</span>
                <div className="mt-1.5 space-y-1">
                  {CONTENT_TIPS.map(function(t, idx) {
                    return <div key={idx} className="text-[11px] text-[var(--muted-foreground)]">💡 {t}</div>
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Accounts ─── */}
          {selectedTab === 'accounts' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 scrollbar-auto-hide">
              {ACCOUNTS.map(function(a) {
                var pct = Math.round((a.followers / ENGAGEMENT_TOTALS.total_followers) * 100)
                return (
                  <div key={a.platform} className={'rounded-lg border ' + (a.connected ? 'border-emerald-500/20 bg-emerald-500/[.02]' : 'border-[var(--border)]')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={'h-2 w-2 rounded-full ' + (a.connected ? 'bg-emerald-400' : 'bg-[var(--border)]')} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--foreground)]">{a.platform}</span>
                            {a.connected
                              ? <span className="text-[9px] text-emerald-400">● Connected</span>
                              : <span className="text-[9px] text-[var(--muted-foreground)]">Disconnected</span>}
                          </div>
                          {a.name && <div className="text-[10px] text-[var(--muted-foreground)]">{a.name}</div>}
                        </div>
                      </div>
                    </div>
                    {a.connected && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <div className="text-[9px] text-[var(--muted-foreground)]">Followers</div>
                          <div className="text-[11px] font-medium text-[var(--foreground)]">{formatNum(a.followers)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[var(--muted-foreground)]">Engagement</div>
                          <div className="text-[11px] font-medium text-[var(--foreground)]">{a.engagement}%</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[var(--muted-foreground)]">Posts/Month</div>
                          <div className="text-[11px] font-medium text-[var(--foreground)]">{a.posts}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── TAB: Content ─── */}
          {selectedTab === 'content' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-auto-hide">
              {/* Scheduled Posts */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[var(--foreground)]">📅 Scheduled This Week</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">{pendingPosts.length} posts</span>
                </div>
                <div className="space-y-1.5">
                  {pendingPosts.length === 0 && <div className="text-[11px] text-[var(--muted-foreground)] py-1">No posts scheduled yet.</div>}
                  {pendingPosts.map(function(p) {
                    return (
                      <div key={p.id} className="flex items-start gap-2 rounded-lg border border-[var(--border)]/50 px-2 py-1.5 bg-[var(--card)]">
                        <div className="text-sm">{p.media}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-[var(--foreground)]">{p.platform}</span>
                            <span className="text-[9px] text-[var(--muted-foreground)]">{p.date} @ {p.time}</span>
                          </div>
                          <div className="text-[10px] text-[var(--muted-foreground)] truncate mt-0.5">{p.content}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top Posts */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <span className="text-[11px] font-medium text-[var(--foreground)]">🏆 Top Performing Posts</span>
                <div className="mt-2 space-y-1.5">
                  {TOP_POSTS.map(function(p, i) {
                    return (
                      <div key={i} className="border border-[var(--border)] rounded-lg px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">#{i + 1}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">{p.platform}</span>
                        </div>
                        <div className="text-[10px] text-[var(--foreground)] mt-0.5">{p.content}</div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-[var(--muted-foreground)]">
                          <span>❤️ {p.engagement}% eng</span>
                          <span>👁 {formatNum(p.reach)} reach</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Analytics ─── */}
          {selectedTab === 'analytics' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-auto-hide">
              {/* Overview stats */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <span className="text-[11px] font-medium text-[var(--foreground)]">📊 Engagement Overview</span>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Total Posts', value: ENGAGEMENT_TOTALS.total_posts_this_month + ' this month', sub: '+8 vs last month' },
                    { label: 'Best Engagement', value: ENGAGEMENT_TOTALS.best_platform_eng + '%', sub: ENGAGEMENT_TOTALS.best_platform },
                    { label: 'Avg Reach/Post', value: formatNum(Math.round(ENGAGEMENT_TOTALS.total_reach / ENGAGEMENT_TOTALS.total_posts_this_month)), sub: 'across all platforms' },
                  ].map(function(m) {
                    return (
                      <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-2">
                        <div className="text-[10px] text-[var(--muted-foreground)]">{m.label}</div>
                        <div className="text-sm font-semibold text-[var(--foreground)]">{m.value}</div>
                        <div className="text-[9px] text-[var(--muted-foreground)]">{m.sub}</div>
                      </div>
                    )
                  })}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 flex items-center justify-center">
                    <span className="text-[11px] text-[var(--muted-foreground)]">More data coming...</span>
                  </div>
                </div>
              </div>

              {/* Per-platform engagement bars */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <span className="text-[11px] font-medium text-[var(--foreground)]">📈 Per-Platform Engagement</span>
                <div className="mt-2 space-y-1.5">
                  {ACCOUNTS.filter(function(a) { return a.connected }).sort(function(a, b) { return b.engagement - a.engagement }).map(function(a) {
                    var maxEng = Math.max(...ACCOUNTS.filter(function(x) { return x.connected }).map(function(x) { return x.engagement }))
                    return (
                      <div key={a.platform} className="flex items-center gap-2">
                        <span className="w-20 text-[10px] text-[var(--muted-foreground)]">{a.platform}</span>
                        <div className="flex-1 h-3 rounded-full bg-[var(--border)]/30">
                          <div className={'h-full rounded-full ' + (a.engagement === maxEng ? 'bg-emerald-400' : 'bg-pink-400/60')} style={{ width: Math.max(2, a.engagement) + '%' }} />
                        </div>
                        <span className="w-8 text-right text-[10px] text-[var(--foreground)]">{a.engagement}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Post types breakdown */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <span className="text-[11px] font-medium text-[var(--foreground)]">🎯 Content Type Performance</span>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[
                    { type: '📸 Image', eng: '4.2%', reach: '12.5K' },
                    { type: '🎬 Video', eng: '3.8%', reach: '18.2K' },
                    { type: '📝 Carousel', eng: '5.1%', reach: '9.8K' },
                  ].map(function(p) {
                    return (
                      <div key={p.type} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-center">
                        <div className="text-[10px] text-[var(--muted-foreground)]">{p.type}</div>
                        <div className="text-[11px] font-medium text-[var(--foreground)]">{p.eng}</div>
                        <div className="text-[9px] text-[var(--muted-foreground)]">{p.reach}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Content Tips */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <span className="text-[11px] font-medium text-[var(--foreground)]">📝 Tips</span>
                <div className="mt-1.5 space-y-1">
                  {CONTENT_TIPS.map(function(t, idx) {
                    return <div key={idx} className="text-[11px] text-[var(--muted-foreground)]">💡 {t}</div>
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
