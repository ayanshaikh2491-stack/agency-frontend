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
  { label: '📊 Full Overview', prompt: 'Show me everything — campaigns, budget, competitors, recommendations' },
  { label: '💰 Budget Analysis', prompt: 'How is my budget doing? Give me Good Better Best recommendations' },
  { label: '🔍 Competitors', prompt: 'What are competitors doing? Share of voice and ad activity' },
  { label: '⚡ Top Performers', prompt: 'Which campaigns are winning and which need attention?' },
]

// ─── MOCK DATA (real API will replace) ───
var BUDGET = { total: 15000, spent: 9800, remaining: 5200, days_remaining: 12, daily_avg_spend: 817, recommended_daily: 833 }
var SCENARIOS = [
  { level: '✅ Good', desc: 'Keep current', budget: 15000, projected: 315, roas: 2.8, cpl: 44 },
  { level: '⚡ Better', desc: '+$5K to Lookalike', budget: 20000, projected: 450, roas: 3.2, cpl: 38 },
  { level: '🚀 Best', desc: 'Restructure +$10K', budget: 25000, projected: 600, roas: 3.8, cpl: 32 },
]

var CAMPAIGNS = [] // Real data from backend
var _CAMPAIGNS_OLD = [
  { id: 'c1', name: 'B2B SaaS Lead Gen', platform: 'Meta', status: 'active', impressions: 84700, clicks: 2150, spend: 4800, ctr: 2.54, cpc: 2.23, conversions: 128, cpl: 37.50, roas: 3.2, rating: '🔥', change: '+12%' },
  { id: 'c2', name: 'Site Retargeting', platform: 'Meta', status: 'active', impressions: 32100, clicks: 980, spend: 1900, ctr: 3.05, cpc: 1.94, conversions: 45, cpl: 42.22, roas: 2.8, rating: '✅', change: '+8%' },
  { id: 'c3', name: 'Brand — Dental SEO', platform: 'Google', status: 'active', impressions: 62300, clicks: 1420, spend: 3600, ctr: 2.28, cpc: 2.54, conversions: 72, cpl: 50.00, roas: 2.1, rating: '⚠️', change: '-3%' },
  { id: 'c4', name: 'Lookalike 1%', platform: 'Meta', status: 'paused', impressions: 15000, clicks: 340, spend: 800, ctr: 2.27, cpc: 2.35, conversions: 12, cpl: 66.67, roas: 1.5, rating: '❌', change: '-18%' },
  { id: 'c5', name: 'Search — AI Tools', platform: 'Google', status: 'active', impressions: 45600, clicks: 1150, spend: 2800, ctr: 2.52, cpc: 2.43, conversions: 58, cpl: 48.28, roas: 2.3, rating: '✅', change: '+5%' },
]

var COMPETITORS = [
  { name: 'GrowthBox', platform: 'Meta', spend_est: 14000, share_of_voice: 22, trend: 'up' },
  { name: 'ScaleAgency', platform: 'Google', spend_est: 11000, share_of_voice: 18, trend: 'down' },
  { name: 'LeadMachine', platform: 'Both', spend_est: 18000, share_of_voice: 32, trend: 'up' },
]

var INSIGHTS = [
  '🔥 B2B Lead Gen is your top campaign at 3.2x ROAS — consider increasing budget',
  '⚠️ Lookalike 1% paused at 1.5x ROAS — needs creative refresh before restart',
  '📈 Competitor "LeadMachine" increased spend 22% this month in your vertical',
  '💡 Your Google Brand campaign CPC is up 11% — check competitor bidding activity',
]

function formatNum(n) { if (!n) return '0'; if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'; if (n >= 1000) return (n/1000).toFixed(1) + 'K'; return n.toLocaleString() }

export default function AdsPage() {
  var [msgs, setMsgs] = useState([])
  var [input, setInput] = useState('')
  var [sending, setSending] = useState(false)
  var [welcomeRevealed, setWelcomeRevealed] = useState(false)
  var [chipsRevealed, setChipsRevealed] = useState(false)
  var [selectedTab, setSelectedTab] = useState('intel')
  var bottomRef = useRef(null)
  var inputRef = useRef(null)
  var scrollRef = useRef(null)
  var keepScrolled = useRef(true)

  var topCampaign = CAMPAIGNS.filter(function(c) { return c.status === 'active' }).sort(function(a, b) { return b.roas - a.roas })[0] || null
  var worstCampaign = CAMPAIGNS.filter(function(c) { return c.status === 'active' }).sort(function(a, b) { return a.roas - b.roas })[0] || null
  var activeImps = CAMPAIGNS.filter(function(c) { return c.status === 'active' }).reduce(function(s, c) { return s + c.impressions }, 0)
  var activeSpend = CAMPAIGNS.filter(function(c) { return c.status === 'active' }).reduce(function(s, c) { return s + c.spend }, 0)
  var activeConvs = CAMPAIGNS.filter(function(c) { return c.status === 'active' }).reduce(function(s, c) { return s + c.conversions }, 0)
  var budgetPct = Math.round((BUDGET.spent / BUDGET.total) * 100)
  var dailyRemaining = Math.round(BUDGET.remaining / BUDGET.days_remaining)

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
      if (l.includes('budget') || l.includes('good') || l.includes('better') || l.includes('best')) {
        return '**💰 Budget Command Center**\n\n' +
          '• Total Budget: $' + formatNum(BUDGET.total) + '\n' +
          '• Spent: $' + formatNum(BUDGET.spent) + ' (' + budgetPct + '%)\n' +
          '• Remaining: $' + formatNum(BUDGET.remaining) + ' · ' + BUDGET.days_remaining + ' days left\n' +
          '• Daily avg: $' + BUDGET.daily_avg_spend + ' · Recommended: $' + BUDGET.recommended_daily + '\n\n' +
          '**Recommendations (Good → Better → Best)**\n\n' +
          SCENARIOS.map(function(s) {
            return s.level + ' **' + s.desc + '** — $' + formatNum(s.budget) + '\n  ↳ ' + s.projected + ' conversions · ROAS ' + s.roas + 'x · CPL $' + s.cpl
          }).join('\n\n')
      }
      if (l.includes('competitor')) {
        return '**🔍 Competitor Intelligence**\n\n' +
          'Your **Share of Voice**: 28% (+5% from last month)\n\n' +
          COMPETITORS.map(function(c) {
            return '• **' + c.name + '** — ' + c.platform + '\n  Est. spend: $' + formatNum(c.spend_est) + ' · SOV: ' + c.share_of_voice + '% · Trend: ' + (c.trend === 'up' ? '⬆️' : '⬇️')
          }).join('\n\n') +
          '\n\n**Insights:**\n' + INSIGHTS.map(function(i) { return '• ' + i }).join('\n')
      }
      if (l.includes('top') || l.includes('perform') || l.includes('win')) {
        var sorted = [...CAMPAIGNS].filter(function(c) { return c.status === 'active' }).sort(function(a, b) { return b.roas - a.roas })
        return '**⚡ Campaign Performance — Ranked**\n\n' +
          sorted.map(function(c, i) {
            return (i + 1) + '. ' + c.rating + ' **' + c.name + '** (' + c.platform + ')\n  ROAS ' + c.roas + 'x · CPL $' + c.cpl + ' · ' + formatNum(c.impressions) + ' imp · $' + formatNum(c.spend) + ' spend\n  Change: ' + c.change
          }).join('\n\n')
      }
      // Default: full overview
      return '**📊 Ads Intelligence — Full Overview**\n\n' +
        '**💰 Budget:** $' + formatNum(BUDGET.spent) + ' / $' + formatNum(BUDGET.total) + ' (' + budgetPct + '%) — $' + formatNum(BUDGET.remaining) + ' remaining\n' +
        '**📈 Performance:** ' + formatNum(activeImps) + ' imp · ' + CAMPAIGNS.filter(function(c) { return c.status === 'active' }).length + ' active · $' + formatNum(activeSpend) + ' spend\n' +
        '**🎯 Conversions:** ' + activeConvs + ' · Avg CPL $' + Math.round(activeSpend / activeConvs) + ' · Blended ROAS ' + (activeSpend > 0 ? (activeConvs * 50 / activeSpend).toFixed(1) : '0') + 'x\n\n' +
        '**🔥 Top:** ' + topCampaign.name + ' (' + topCampaign.platform + ') — ROAS ' + topCampaign.roas + 'x\n' +
        '**⚠️ Needs attention:** ' + worstCampaign.name + ' — ROAS ' + worstCampaign.roas + 'x\n\n' +
        '**🔍 Competitors seen:** ' + COMPETITORS.length + ' active (' + COMPETITORS.filter(function(c) { return c.trend === 'up' }).length + ' trending up)\n' +
        '**💡 Tip:** ' + INSIGHTS[0]
    } catch(e) {
      return 'Checking ad data for you... 📢'
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

  var welcomeBody = 'Hey! I\'m your **Ads Intelligence Manager** 📢\n\nI track **everything** — campaign performance, budget, competitors, and recommendations.\n\n**What do you want?**\n📊 Full intelligence report\n💰 Budget with Good → Better → Best\n🔍 Competitor activity & share of voice\n⚡ Top performers & weak spots'

  return (
    <div className="flex h-[calc(100%+2rem)] flex-col -m-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* ─── LEFT: Chat ─── */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-[45%] shrink-0 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/20">
                <span className="text-sm">📢</span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Ads Intelligence</h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">● Live</span>
                </div>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{CAMPAIGNS.filter(function(c) { return c.status === 'active' }).length} active · ${
                  formatNum(activeSpend)} spend · {formatNum(activeImps)} imp</p>
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
                      <AgentBubbleHeader emoji="📢" name="Ads Intelligence" />
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
                      <AgentBubbleHeader emoji="📢" name="Ads Intelligence" />
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
                  placeholder="Ask your Ads Intelligence..." rows={1}
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

        {/* ─── RIGHT: Intelligence Dashboard ─── */}
        <div className="hidden md:flex md:min-h-0 md:min-w-0 md:flex-1 flex-col bg-[var(--card)]">
          {/* Header */}
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Ads Intelligence</h4>
              <span className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">Live</span>
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="shrink-0 px-4 py-2 flex gap-1.5 border-b border-[var(--border)]">
            {[
              { id: 'intel', label: '🕵️ Intelligence' },
              { id: 'campaigns', label: '📊 Campaigns' },
              { id: 'competitors', label: '🔍 Competitors' },
              { id: 'budget', label: '💰 Budget' },
            ].map(function(tab) {
              return (
                <button key={tab.id} type="button" onClick={function() { setSelectedTab(tab.id) }}
                  className={'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ' + (selectedTab === tab.id
                    ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30'
                    : 'text-[var(--muted-foreground)] border border-transparent hover:text-[var(--foreground)]')}>
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-auto-hide">

            {/* ─── TAB: Intelligence ─── */}
            {selectedTab === 'intel' && (
              <>
                {/* Top KPI cards */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Active Campaigns', value: CAMPAIGNS.filter(function(c) { return c.status === 'active' }).length + '/' + CAMPAIGNS.length, color: 'text-[var(--foreground)]' },
                    { label: 'Total Spend', value: '$' + formatNum(activeSpend), color: 'text-[oklch(0.75 0.18 40)]' },
                    { label: 'Tot. Conversions', value: activeConvs, color: 'text-emerald-400' },
                    { label: 'Blended ROAS', value: (activeSpend > 0 ? (activeConvs * 50 / activeSpend).toFixed(1) : '0') + 'x', color: 'text-[var(--primary)]' },
                  ].map(function(m) {
                    return (
                      <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
                        <p className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider">{m.label}</p>
                        <p className={'text-sm font-bold mt-0.5 ' + m.color}>{m.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Budget Progress */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[oklch(0.75 0.18 40)]">💰 Budget Tracker</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{budgetPct}% used · ${formatNum(BUDGET.remaining)} left</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[oklch(0.75 0.18 40)] to-red-500" style={{ width: budgetPct + '%' }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-[var(--muted-foreground)]">
                    <span>${formatNum(BUDGET.spent)} spent</span>
                    <span>{BUDGET.days_remaining}d remaining</span>
                    <span>${dailyRemaining}/d rec.</span>
                  </div>
                </div>

                {/* Top vs Worst */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg border border-emerald-500/20 bg-[var(--card)] p-3">
                    <span className="text-[10px] text-emerald-400 font-medium">🔥 Top Performer</span>
                    <p className="text-xs text-[var(--foreground)] font-medium mt-1 truncate">{topCampaign.name}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">ROAS {topCampaign.roas}x · ${formatNum(topCampaign.spend)} spend</p>
                  </div>
                  <div className="rounded-lg border border-red-500/20 bg-[var(--card)] p-3">
                    <span className="text-[10px] text-red-400 font-medium">⚠️ Needs Attention</span>
                    <p className="text-xs text-[var(--foreground)] font-medium mt-1 truncate">{worstCampaign.name}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">ROAS {worstCampaign.roas}x · {worstCampaign.change} change</p>
                  </div>
                </div>

                {/* Good Better Best */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--primary)]">🎯 Budget Scenarios</span>
                  <div className="mt-2 space-y-1.5">
                    {SCENARIOS.map(function(s) {
                      var borderColor = s.level.includes('Good') ? 'border-emerald-500/30' : s.level.includes('Better') ? 'border-[oklch(0.75 0.18 40)]/30' : 'border-[var(--primary)]/30'
                      return (
                        <div key={s.level} className={'flex items-center justify-between rounded-lg border ' + borderColor + ' bg-[var(--card)] px-2.5 py-1.5'}>
                          <div>
                            <span className="text-[11px] text-[var(--foreground)] font-medium">{s.level}</span>
                            <p className="text-[9px] text-[var(--muted-foreground)]">{s.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-[var(--foreground)] font-mono">${formatNum(s.budget)}</p>
                            <p className="text-[9px] text-[var(--muted-foreground)]">{s.projected} conv · {s.roas}x</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Live Insights */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">💡 Live Intelligence</span>
                  <div className="mt-1.5 space-y-1">
                    {INSIGHTS.map(function(i, idx) {
                      return <p key={idx} className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">{i}</p>
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB: Campaigns ─── */}
            {selectedTab === 'campaigns' && (
              <>
                <div className="space-y-1.5">
                  {CAMPAIGNS.map(function(c) {
                    return (
                      <div key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs">{c.rating}</span>
                            <span className="text-xs text-[var(--foreground)] font-medium truncate">{c.name}</span>
                            <span className={'text-[9px] px-1.5 py-0.5 rounded-full font-medium ' + (c.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]')}>{c.status}</span>
                          </div>
                          <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 ml-2">{c.platform === 'Meta' ? '📸' : '🔍'}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--muted-foreground)] flex-wrap">
                          <span>👁 {formatNum(c.impressions)}</span>
                          <span>🖱 {formatNum(c.clicks)}</span>
                          <span>💰 ${formatNum(c.spend)}</span>
                          <span>CTR {c.ctr}%</span>
                          <span>CPC ${c.cpc}</span>
                          <span>CPL ${c.cpl}</span>
                          <span>ROAS {c.roas}x</span>
                          <span className={'text-[9px] ' + (c.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400')}>{c.change}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ─── TAB: Competitors ─── */}
            {selectedTab === 'competitors' && (
              <>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">🔍 Active Competitors</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">Your SOV: 28%</span>
                  </div>
                  <div className="space-y-1.5">
                    {COMPETITORS.map(function(c) {
                      return (
                        <div key={c.name} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                          <div>
                            <span className="text-[11px] text-[var(--foreground)] font-medium">{c.name}</span>
                            <p className="text-[9px] text-[var(--muted-foreground)]">{c.platform} · Est. ${formatNum(c.spend_est)}/mo</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-[var(--foreground)] font-mono">{c.share_of_voice}% SOV</span>
                            <p className="text-[9px] text-[var(--muted-foreground)]">{c.trend === 'up' ? '⬆️ Rising' : '⬇️ Declining'}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Share of Voice Bar */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">📊 Share of Voice</span>
                  <div className="mt-2 space-y-1.5">
                    {[{ name: 'You', pct: 28, color: 'bg-[var(--primary)]' }, ...COMPETITORS].sort(function(a, b) { return b.pct - a.pct }).map(function(c) {
                      var nm = c.name || 'You'
                      return (
                        <div key={nm} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--muted-foreground)] w-20 truncate">{nm}</span>
                          <div className="flex-1 h-3 rounded-full bg-[var(--border)] overflow-hidden">
                            <div className={'h-full rounded-full ' + c.color} style={{ width: c.pct + '%' }} />
                          </div>
                          <span className="text-[10px] text-[var(--foreground)] font-mono w-8 text-right">{c.pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Insights */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">💡 Competitive Insights</span>
                  <div className="mt-1.5 space-y-1">
                    {INSIGHTS.map(function(i, idx) {
                      return <p key={idx} className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">{i}</p>
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB: Budget ─── */}
            {selectedTab === 'budget' && (
              <>
                {/* Large budget circle */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col items-center">
                  <div className="relative h-24 w-24">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" strokeWidth="8" strokeDasharray={264} strokeDashoffset={264 * (1 - budgetPct / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-[var(--foreground)]">${formatNum(BUDGET.remaining)}</span>
                      <span className="text-[9px] text-[var(--muted-foreground)]">remaining</span>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs text-[var(--foreground)] font-medium">${formatNum(BUDGET.spent)} / ${formatNum(BUDGET.total)}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{BUDGET.days_remaining} days left · ${dailyRemaining}/day recommended</p>
                  </div>
                </div>

                {/* Good Better Best */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--primary)]">🎯 Good → Better → Best</span>
                  <div className="mt-2">
                    {/* Your current */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-l-2 border-[var(--primary)] bg-[var(--card)] mb-1.5 rounded-r-lg">
                      <div>
                        <span className="text-[11px] text-[var(--foreground)] font-medium">Current Plan</span>
                        <p className="text-[9px] text-[var(--muted-foreground)]">${formatNum(BUDGET.spent)} of ${formatNum(BUDGET.total)} spent</p>
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{budgetPct}%</span>
                    </div>
                    {SCENARIOS.map(function(s) {
                      var borderC = s.level.includes('Good') ? 'border-emerald-500' : s.level.includes('Better') ? 'border-[oklch(0.75 0.18 40)]' : 'border-[var(--primary)]'
                      return (
                        <div key={s.level} className={'flex items-center justify-between px-2.5 py-1.5 border-l-2 ' + borderC + ' bg-[var(--card)] mb-1 rounded-r-lg'}>
                          <div>
                            <span className="text-[11px] text-[var(--foreground)] font-medium">{s.level}</span>
                            <p className="text-[9px] text-[var(--muted-foreground)]">{s.desc} · ${formatNum(s.budget)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-emerald-400 font-mono">{s.projected} conv</p>
                            <p className="text-[9px] text-[var(--muted-foreground)]">ROAS {s.roas}x · CPL ${s.cpl}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Daily budget */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">📅 Daily Budget Pace</span>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--muted-foreground)]">Current daily spend</p>
                      <p className="text-xs text-[var(--foreground)] font-bold">${BUDGET.daily_avg_spend}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--muted-foreground)]">Recommended daily</p>
                      <p className="text-xs text-[oklch(0.75 0.18 40)] font-bold">${BUDGET.recommended_daily}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--muted-foreground)]">Pace status</p>
                      <p className={'text-xs font-bold ' + (budgetPct > 75 ? 'text-red-400' : budgetPct > 50 ? 'text-[oklch(0.75 0.18 40)]' : 'text-emerald-400')}>{budgetPct > 75 ? '⚠️ Over' : budgetPct > 50 ? '📊 On track' : '✅ Under'}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Bottom spacer */}
            <div className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}