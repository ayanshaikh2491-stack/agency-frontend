'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useCompany } from '@/lib/client-context'
import { createBrowserClient } from '@supabase/ssr'
import {
  Bot, BarChart3, TrendingUp, DollarSign, Users, Target,
  Zap, CheckCircle, Clock, ArrowUpRight, MessageSquare,
  Briefcase, PieChart, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageShell from '@/components/PageShell'
import { RunActivityChart, PriorityChart, IssueStatusChart, SuccessRateChart } from '@/components/ActivityCharts'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

/* ─── Agency Service Offerings ─── */
const SERVICES = [
  { id: 'seo', label: 'SEO', icon: TrendingUp, color: 'text-emerald-500', desc: 'Rank higher, drive traffic' },
  { id: 'social', label: 'Social Media', icon: MessageSquare, color: 'text-blue-500', desc: 'Content, engage, grow' },
  { id: 'ads', label: 'Paid Ads', icon: Target, color: 'text-orange-500', desc: 'FB, Google, LinkedIn campaigns' },
  { id: 'content', label: 'Content', icon: Briefcase, color: 'text-purple-500', desc: 'Blogs, scripts, creatives' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-cyan-500', desc: 'Reports, dashboards, insights' },
  { id: 'sales', label: 'Sales', icon: DollarSign, color: 'text-rose-500', desc: 'Proposals, closing, pipelines' },
]

/* ─── Worker Label Map ─── */
const WORKER_LABELS = {
  'intake-researcher': { label: 'Intake Researcher', emoji: '🔍', color: 'text-blue-500' },
  'content-creator': { label: 'Content Creator', emoji: '✍️', color: 'text-purple-500' },
  'seo-engine': { label: 'SEO Engine', emoji: '📈', color: 'text-emerald-500' },
  'ads-runner': { label: 'Ads Runner', emoji: '📢', color: 'text-orange-500' },
  'analytics-bot': { label: 'Analytics Bot', emoji: '📊', color: 'text-cyan-500' },
  'sales-closer': { label: 'Sales Closer', emoji: '💼', color: 'text-rose-500' },
  'client-success': { label: 'Client Success', emoji: '🤝', color: 'text-teal-500' },
  'review-qc': { label: 'Review QC', emoji: '✅', color: 'text-amber-500' },
}

/* ─── Suggested Chips ─── */
const SUGGESTIONS = [
  { label: 'Research competitors', prompt: 'Research competitors for a roofing business in Texas' },
  { label: 'Write a blog post', prompt: 'Write a blog post about AI in marketing' },
  { label: 'LinkedIn strategy', prompt: 'Create a LinkedIn content strategy for a SaaS company' },
  { label: 'Facebook ad campaign', prompt: 'Set up Facebook ads for a local service business' },
  { label: 'SEO audit', prompt: 'Audit SEO for an e-commerce website' },
  { label: 'Give me a status update', prompt: 'Give me a quick status update on everything' },
]

/* ═══════════════════════════════════════════════════════════
   CEO Command Center
   ═══════════════════════════════════════════════════════════ */
export default function CEOPage() {
  const ctx = useCompany()
  const agentsFull = ctx.agentsFull
  const activeCompany = ctx.activeCompany

  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [routingInfo, setRoutingInfo] = useState(null)
  const [files, setFiles] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  const agentCount = useMemo(() => agentsFull ? agentsFull.length : 8, [agentsFull])
  const onlineCount = useMemo(() =>
    agentsFull ? agentsFull.filter(a => a.status === 'active' || a.status === 'running').length : 8,
  [agentsFull])

  const safeScroll = useCallback(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [])

  useEffect(() => { safeScroll() }, [msgs.length])

  function detectIntent(text) {
    const l = text.toLowerCase()
    if (l.includes('lead') || l.includes('find') || l.includes('research') || l.includes('prospect')) return { agent: 'intake-researcher', label: 'Intake Researcher' }
    if (l.includes('content') || l.includes('blog') || l.includes('write') || l.includes('draft')) return { agent: 'content-creator', label: 'Content Creator' }
    if (l.includes('social') || l.includes('linkedin') || l.includes('instagram')) return { agent: 'social-manager', label: 'Social Manager' }
    if (l.includes('ads') || l.includes('campaign')) return { agent: 'ads-runner', label: 'Ads Runner' }
    if (l.includes('seo') || l.includes('keyword') || l.includes('ranking')) return { agent: 'seo-engine', label: 'SEO Engine' }
    if (l.includes('analytics') || l.includes('report') || l.includes('stats')) return { agent: 'analytics-bot', label: 'Analytics Bot' }
    if (l.includes('sales') || l.includes('proposal') || l.includes('close')) return { agent: 'sales-closer', label: 'Sales Closer' }
    if (l.includes('client') || l.includes('onboarding')) return { agent: 'client-success', label: 'Client Success' }
    return null
  }

  const send = useCallback(async (override) => {
    const text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')

    try {
      await supabase.from('goals').insert({
        client_id: localStorage.getItem('activeClientId') || 'default',
        content: text + (files.length ? ` [with ${files.length} file(s)]` : ''),
        status: 'pending',
        command_type: 'ceo-directive',
      })
    } catch (e) {}

    setMsgs(p => [...p, { id: Date.now().toString(), role: 'user', content: text, time: new Date().toISOString() }])
    setFiles([])
    setSending(true)
    setRoutingInfo(detectIntent(text))

    let ceoReply = 'Haan bhai! Kya karna hai? 👊'
    try {
      const res = await fetch('/api/ceo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = await res.json()
        ceoReply = data?.response || data?.reply || data?.content || data?.message || ceoReply
      }
    } catch (e) {}

    setRoutingInfo(null)
    await new Promise(r => setTimeout(r, 300 + Math.random() * 600))
    setSending(false)
    setMsgs(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: ceoReply, time: new Date().toISOString() }])
  }, [input, sending, files])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }, [send])

  return (
    <PageShell>
      <div className="flex h-full min-h-0 gap-0">
        {/* ════════════════════════════════════════════
            LEFT: CEO Chat Pane — 3/5 width
            ════════════════════════════════════════════ */}
        <div className="relative flex min-h-0 w-full flex-col lg:w-3/5 shrink-0 bg-card">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">CEO Command</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600 bg-emerald-50">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                    Online
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{activeCompany?.name || 'No company selected'}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1.5">
              <a href="/admin/dashboard/chat"><MessageSquare className="h-3.5 w-3.5" /> Boardroom</a>
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-auto-hide px-5 py-4">
            <div className="flex flex-col gap-4">
              {msgs.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                  {/* Welcome greeting */}
                  <div className="text-center max-w-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Hey, I'm your CEO! 👋</h2>
                    <p className="text-sm text-muted-foreground">
                      Ready to run the show. Just tell me what you need — leads, content, ads, or just checking in.
                    </p>
                  </div>

                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s.label}
                        onClick={() => { setInput(s.prompt); setTimeout(() => send(s.prompt), 100) }}
                        className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map(m => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-foreground">CEO</span>
                      <span className="text-[10px] text-muted-foreground">just now</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted/50 text-foreground border border-border rounded-bl-md'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {routingInfo && sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2 px-1">
                  <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                    <Activity className="h-3 w-3 text-amber-500 animate-pulse" />
                    <span>Routing to <span className="font-medium text-foreground">{routingInfo.label}</span></span>
                  </div>
                </div>
              )}

              {sending && !routingInfo && (
                <div className="flex items-start gap-2">
                  <Bot className="h-4 w-4 text-primary mt-1.5" />
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 focus-within:border-primary/40 shadow-sm">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message CEO..."
                className="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                disabled={sending}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || sending}
                className="rounded-lg bg-primary p-1.5 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT: Analytics & Command Panel — 2/5 width
            ════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-2/5 flex-col bg-background border-l border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* ─── KPI Cards Row ─── */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Clients</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{activeCompany ? 1 : 0}</p>
                  <p className="text-[10px] text-muted-foreground">{onlineCount}/{agentCount} agents online</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pipeline</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">779</p>
                  <p className="text-[10px] text-muted-foreground">tasks in queue</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Success</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">99.7%</p>
                  <p className="text-[10px] text-muted-foreground">system uptime</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Throughput</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">1.2k</p>
                  <p className="text-[10px] text-muted-foreground">tasks/day avg</p>
                </CardContent>
              </Card>
            </div>

            {/* ─── Charts Grid ─── */}
            <Card className="border-border">
              <CardHeader className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analytics</CardTitle>
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border p-2.5">
                    <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Activity</h4>
                    <RunActivityChart />
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Priority</h4>
                    <PriorityChart />
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Issues</h4>
                    <IssueStatusChart />
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <h4 className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Success Rate</h4>
                    <SuccessRateChart />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── Service Offerings ─── */}
            <Card className="border-border">
              <CardHeader className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Services</CardTitle>
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setInput(s.label); setTimeout(() => send(s.label), 100) }}
                      className="flex items-center gap-2.5 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                    >
                      <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{s.label}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ─── Agent Status ─── */}
            <Card className="border-border">
              <CardHeader className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Status</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-medium">{onlineCount}/{agentCount}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-0.5">
                  {Object.entries(WORKER_LABELS).map(([slug, worker]) => {
                    const agent = agentsFull?.find(a => a.id === slug)
                    const online = agent ? (agent.status === 'active' || agent.status === 'running') : true
                    return (
                      <div key={slug} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-accent/50 transition-colors">
                        <span className="shrink-0">{worker.emoji}</span>
                        <span className="text-foreground truncate flex-1">{worker.label}</span>
                        <span className={`flex h-2 w-2 rounded-full shrink-0 ${online ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-muted-foreground'}`} />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
