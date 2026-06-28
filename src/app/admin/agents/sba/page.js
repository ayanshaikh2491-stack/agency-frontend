'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bot, MessageSquare, Send, Repeat, Smartphone, Globe,
  Twitter, Instagram, Linkedin, Facebook, Youtube,
  Sparkles, Zap, CheckCircle2, Activity, BarChart3,
  Users, Clock, Settings as SettingsIcon, BookOpen,
  ShieldCheck, DollarSign, TrendingUp, PieChart,
  AlertCircle, Loader2, RefreshCw, ChevronDown,
  Plus, Search, Filter, Download, ExternalLink,
  Server, Play, Pause, Columns3, Calendar,
  GripVertical,
} from 'lucide-react'
import PageShell from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/* ─── Platform config ─── */
const PLATFORM_CONFIG = {
  facebook: { icon: Facebook, label: 'Facebook', color: '#1877F2' },
  instagram: { icon: Instagram, label: 'Instagram', color: '#E4405F' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
  twitter: { icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
  tiktok: { icon: Smartphone, label: 'TikTok', color: '#FF004F' },
  youtube: { icon: Youtube, label: 'YouTube', color: '#FF0000' },
}

/* ─── Sample metrics ─── */
const SAMPLE_METRICS = [
  { label: 'Platforms', value: '6', desc: 'connected', icon: Globe, color: '#533afd' },
  { label: 'Total Reach', value: '245.3K', desc: 'this month', icon: TrendingUp, color: '#10b981' },
  { label: 'Engagements', value: '8,427', desc: '+12% vs last month', icon: Activity, color: '#f59e0b' },
  { label: 'Avg Response', value: '4.2m', desc: 'response time', icon: Clock, color: '#3b82f6' },
]

/* ─── Tabs ─── */
const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pipeline', label: 'Pipeline', icon: Columns3 },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'platforms', label: 'Platforms', icon: Globe },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

/* ─── Metrics bar ─── */
function MetricsBar({ metrics }) {
  return (
    <div className="flex items-stretch gap-px bg-border/50">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <div key={m.label} className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-canvas min-w-0">
            <div className="size-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
              <Icon className="size-3.5" style={{ color: m.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{m.label} · {m.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SBA Page
   ═══════════════════════════════════════════════ */
export default function SBAPage() {
  const [activeTab, setActiveTab] = useState('chat')
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState('ai')
  const [activeAgent, setActiveAgent] = useState('sba-agent')
  const [connectedPlatforms, setConnectedPlatforms] = useState([])
  const [pipelineData, setPipelineData] = useState(null)
  const [meetingsList, setMeetingsList] = useState([])
  const [financeData, setFinanceData] = useState(null)
  const [loadingTab, setLoadingTab] = useState(false)
  const chatEndRef = useRef(null)

  /* ─── Agent options (ONLY SBA) ─── */
  const AGENTS = [
    { id: 'sba-agent', name: '📊 SBA Agent (OpenCode)', desc: 'Lead qualification + Pipeline + Meetings' },
  ]

  /* ─── Fetch connected platforms ─── */
  useEffect(() => {
    fetch('/api/social/oauth/status')
      .then(r => r.json())
      .then(d => {
        const accts = d?.data?.accounts || {}
        setConnectedPlatforms(Object.keys(accts))
      })
      .catch(() => {})
  }, [])

  /* ─── Fetch tab data when switching tabs ─── */
  useEffect(() => {
    if (activeTab === 'pipeline') {
      setLoadingTab(true)
      fetch('/api/sba/pipeline')
        .then(r => r.json())
        .then(d => { setPipelineData(d?.data); setLoadingTab(false) })
        .catch(() => setLoadingTab(false))
    } else if (activeTab === 'meetings') {
      setLoadingTab(true)
      fetch('/api/sba/meetings')
        .then(r => r.json())
        .then(d => { setMeetingsList(d?.data?.meetings || []); setLoadingTab(false) })
        .catch(() => setLoadingTab(false))
    } else if (activeTab === 'finance') {
      setLoadingTab(true)
      fetch('/api/sba/finance')
        .then(r => r.json())
        .then(d => { setFinanceData(d?.data); setLoadingTab(false) })
        .catch(() => setLoadingTab(false))
    }
  }, [activeTab])

  /* ─── Auto-scroll chat ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  /* ─── Send message ─── */
  async function send() {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setChat(c => [...c, { role: 'user', content: msg }])
    setSending(true)

    try {
      if (mode === 'n8n') {
        const n8nUrl = (localStorage.getItem('n8n_url') || 'http://localhost:5678').replace(/\/+$/, '')
        const res = await fetch(`${n8nUrl}/webhook/sba`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, connected_platforms: connectedPlatforms }),
        })
        if (res.ok) {
          const data = await res.json()
          setChat(c => [...c, {
            role: 'assistant',
            content: data?.output || data?.response || '✅ Done via n8n',
          }])
        } else {
          throw new Error('n8n not available')
        }
      } else {
        // Route based on agent selection
        const agentId = activeAgent || 'ceo-agent'
        
        if (agentId === 'sba-agent') {
          // SBA agent goes through dedicated SBA API
          const res = await fetch('/api/sba/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, session_id: 'sba_web' }),
          })
          const d = await res.json()
          const reply = d?.response || d?.message || JSON.stringify(d)
          setChat(c => [...c, { role: 'assistant', content: reply, agent: 'sba-agent' }])
        } else {
          // Other agents go through CEO agent router
          const res = await fetch(`/api/agents/${agentId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, session_id: 'web_client' }),
          })
          const d = await res.json()
          const reply = d?.data?.content || d?.data?.response || d?.response || JSON.stringify(d)
          setChat(c => [...c, { role: 'assistant', content: reply, agent: agentId }])
        }
      }
    } catch (e) {
      try {
        // Fallback: always try CEO agent
        const agentId = activeAgent || 'ceo-agent'
        const res = await fetch(`/api/agents/${agentId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, session_id: 'web_client' }),
        })
        const d = await res.json()
        const reply = d?.data?.content || d?.data?.response || d?.response || JSON.stringify(d)
        setChat(c => [...c, { role: 'assistant', content: reply + '\n\n_(fallback)_' }])
      } catch (e2) {
        setChat(c => [...c, { role: 'assistant', content: `❌ Error: ${e2.message}` }])
      }
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  /* ─── Chat tab ─── */
  const renderChat = () => (
    <div className="flex-1 flex gap-4 min-h-0">
      {/* Left — Chat */}
      <div className="flex-1 flex flex-col border border-border rounded-lg bg-card min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
          <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bot className="size-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">📊 SBA Agent (OpenCode) — Sales Pipeline</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${mode === 'n8n' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              {mode === 'n8n' ? 'n8n mode' : 'AI mode'}
              {connectedPlatforms.length > 0 && `· ${connectedPlatforms.length} platforms`}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {connectedPlatforms.map(p => {
              const pf = PLATFORM_CONFIG[p]
              const PFIcon = pf?.icon || Globe
              return (
                <span key={p} className="text-muted-foreground/50" title={pf?.label || p}>
                  <PFIcon className="size-3.5" />
                </span>
              )
            })}
            <div className="ml-2 toggle-group">
              <button
                className={`toggle-btn ${mode === 'ai' ? 'active' : ''}`}
                onClick={() => setMode('ai')}
              >AI</button>
              <button
                className={`toggle-btn ${mode === 'n8n' ? 'active' : ''}`}
                onClick={() => setMode('n8n')}
              >n8n</button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {chat.length === 0 && (
            <div className="text-center py-12">
              <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="size-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">SBA Agent - Sales Business Assistant</p>
              <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                I manage all your social media, campaigns, and business operations.
                <br />
                {mode === 'n8n' ? '⚡ Routing via n8n workflow engine' : '🧠 Using AI backend'}
              </p>
              <div className="max-w-md mx-auto grid grid-cols-1 gap-1.5">
                {[
                  '📊 "Show me this week\'s performance"',
                  '📝 "Schedule an Instagram post tomorrow at 10am"',
                  '📈 "Generate a weekly report for Client A"',
                  '🔄 "Cross-post to Facebook + LinkedIn"',
                  '🤖 "What can you automate for me?"',
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(cmd); }}
                    className="text-left text-[11px] text-muted-foreground px-3 py-1.5 border border-border/60 rounded-md hover:border-accent/30 hover:bg-accent/5 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.map((c, i) => (
            <div key={i} className={`flex gap-2.5 ${c.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {c.role === 'assistant' && (
                <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-3.5 text-accent" />
                </div>
              )}
              <div className={
                c.role === 'user'
                  ? 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground whitespace-pre-wrap'
                  : 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground whitespace-pre-wrap'
              }>
                {c.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {mode === 'n8n' ? <Repeat className="size-3 animate-spin" /> : <Sparkles className="size-3 animate-pulse" />}
              {mode === 'n8n' ? 'Routing via n8n...' : 'Thinking...'}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'n8n' ? 'Tell SBA what to do (via n8n)...' : 'Ask SBA about leads, pipeline, meetings...'}
              className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={send}
              disabled={sending || !input.trim()}
              size="sm"
            >
              {sending
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Send className="size-3.5" />
              }
              <span className="ml-1.5">{sending ? '' : 'Send'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right — Insights Panel */}
      <div className="w-72 shrink-0 hidden lg:flex flex-col gap-3">
        {/* Connected platforms */}
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Connected Platforms
          </h4>
          <div className="space-y-2">
            {Object.entries(PLATFORM_CONFIG).map(([key, pf]) => {
              const PFIcon = pf.icon
              const active = connectedPlatforms.includes(key)
              return (
                <div key={key} className="flex items-center gap-2">
                  <PFIcon className="size-3.5 shrink-0" style={{ color: active ? pf.color : undefined }} />
                  <span className={`text-xs flex-1 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {pf.label}
                  </span>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Quick Actions
          </h4>
          <div className="space-y-1">
            {[
              { label: 'Generate Report', icon: BarChart3 },
              { label: 'Schedule Post', icon: Plus },
              { label: 'Check Analytics', icon: TrendingUp },
              { label: 'Run Automation', icon: Zap },
            ].map((action) => {
              const ActionIcon = action.icon
              return (
                <button
                  key={action.label}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors rounded-sm"
                >
                  <ActionIcon className="size-3.5" />
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mode info */}
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Current Mode
          </h4>
          <div className="flex items-center gap-2 text-xs">
            {mode === 'n8n' ? (
              <>
                <Server className="size-3.5 text-blue-500" />
                <span className="text-foreground">n8n Workflow</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 text-accent" />
                <span className="text-foreground">AI Powered</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
            {mode === 'n8n'
              ? 'Requests route through your n8n instance for custom workflows.'
              : 'Direct AI chat for social media management, scheduling, and analytics.'}
          </p>
        </div>
      </div>
    </div>
  )

  /* ─── Overview tab ─── */
  const renderOverview = () => (
    <div className="flex-1 overflow-y-auto space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {SAMPLE_METRICS.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="border border-border bg-card px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
                  <Icon className="size-4.5" style={{ color: m.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">{m.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Performance summary */}
      <div className="border border-border bg-card">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform Performance</h3>
        </div>
        <div className="divide-y divide-border/60">
          {Object.entries(PLATFORM_CONFIG).slice(0, 4).map(([key, pf]) => {
            const PFIcon = pf.icon
            const active = connectedPlatforms.includes(key)
            return (
              <div key={key} className="px-4 py-3 flex items-center gap-3">
                <PFIcon className="size-4 shrink-0" style={{ color: active ? pf.color : undefined }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{pf.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {active ? 'Connected · Active' : 'Not connected'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium tabular-nums text-foreground">
                    {active ? Math.floor(Math.random() * 50000 + 5000).toLocaleString() : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">followers</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ─── Agents tab ─── */
  const renderAgents = () => (
    <div className="flex-1 overflow-y-auto space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { name: 'Content Creator', desc: 'Creates posts, captions, blogs', status: 'running', color: '#533afd' },
          { name: 'Analytics Bot', desc: 'Tracks performance metrics', status: 'running', color: '#10b981' },
          { name: 'Social Manager', desc: 'Manages social media accounts', status: 'running', color: '#3b82f6' },
          { name: 'SEO Engine', desc: 'Optimizes content for search', status: 'running', color: '#f59e0b' },
          { name: 'Ads Runner', desc: 'Runs and monitors ad campaigns', status: 'running', color: '#ef4444' },
          { name: 'Sales Closer', desc: 'Converts leads to clients', status: 'idle', color: '#6b7280' },
        ].map((agent) => (
          <div key={agent.name} className="border border-border bg-card px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}12` }}>
                <Bot className="size-4.5" style={{ color: agent.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{agent.name}</span>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${agent.status === 'running' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                </div>
                <div className="text-[11px] text-muted-foreground">{agent.desc}</div>
              </div>
              <Badge variant={agent.status === 'running' ? 'default' : 'secondary'} className="text-[10px]">
                {agent.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  /* ─── Platforms tab ─── */
  const renderPlatforms = () => (
    <div className="flex-1 overflow-y-auto space-y-4">
      <div className="border border-border bg-card">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Platforms</h3>
        </div>
        <div className="divide-y divide-border/60">
          {Object.entries(PLATFORM_CONFIG).map(([key, pf]) => {
            const PFIcon = pf.icon
            const active = connectedPlatforms.includes(key)
            return (
              <div key={key} className="px-4 py-3.5 flex items-center gap-3.5">
                <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pf.color}10` }}>
                  <PFIcon className="size-5" style={{ color: active ? pf.color : undefined }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{pf.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {active ? 'Connected · Ready for tasks' : 'Not connected — click to set up'}
                  </div>
                </div>
                <Button size="sm" variant={active ? 'outline' : 'default'} className="text-[11px] h-7 px-3">
                  {active ? 'Manage' : 'Connect'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ─── Settings tab ─── */
  const renderSettings = () => (
    <div className="flex-1 overflow-y-auto space-y-5 max-w-2xl">
      <div className="border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">SBA Mode</h3>
        <p className="text-xs text-muted-foreground mb-3">Choose how SBA processes your requests.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
              mode === 'ai'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <Sparkles className="size-4 mb-1 inline-block mr-1.5" />
            AI Mode
          </button>
          <button
            onClick={() => setMode('n8n')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
              mode === 'n8n'
                ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <Zap className="size-4 mb-1 inline-block mr-1.5" />
            n8n Mode
          </button>
        </div>
      </div>

      <div className="border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">n8n Webhook URL</h3>
        <p className="text-xs text-muted-foreground mb-3">Set a custom n8n webhook endpoint.</p>
        <input
          defaultValue={typeof window !== 'undefined' ? localStorage.getItem('n8n_url') || 'http://localhost:5678' : ''}
          onChange={e => localStorage.setItem('n8n_url', e.target.value)}
          placeholder="http://localhost:5678"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
        />
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════
     Pipeline tab — Kanban from Sales Agent
     ═══════════════════════════════════════════════ */
  const renderPipeline = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading pipeline...
      </div>
    )

    if (!pipelineData) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No pipeline data yet
      </div>
    )

    const stageColors = {
      lead: { bg: 'bg-purple-500/10', dot: 'bg-purple-500', border: 'border-purple-500/30' },
      contacted: { bg: 'bg-blue-500/10', dot: 'bg-blue-500', border: 'border-blue-500/30' },
      meeting: { bg: 'bg-amber-500/10', dot: 'bg-amber-500', border: 'border-amber-500/30' },
      proposal: { bg: 'bg-orange-500/10', dot: 'bg-orange-500', border: 'border-orange-500/30' },
      negotiation: { bg: 'bg-red-500/10', dot: 'bg-red-500', border: 'border-red-500/30' },
      closed: { bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
    }

    return (
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full min-w-0" style={{ minWidth: pipelineData?.stages?.length * 240 }}>
          {pipelineData?.stages?.map(stage => {
            const items = pipelineData?.pipeline?.[stage] || []
            const sc = stageColors[stage] || { bg: 'bg-gray-500/10', dot: 'bg-gray-500', border: 'border-gray-500/30' }
            return (
              <div key={stage} className="flex-1 min-w-[220px] max-w-[280px] flex flex-col border border-border rounded-lg bg-card/50">
                <div className={`px-3 py-2 border-b ${sc.border} flex items-center gap-2`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${sc.dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">{items.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {items.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/40 text-center py-6">Empty</p>
                  ) : items.map((item, i) => (
                    <div key={item.id || i} className="px-2.5 py-2 text-xs border border-border/60 rounded bg-card cursor-pointer hover:border-accent/30 transition-colors">
                      <div className="font-medium text-foreground">{item.business_name || item.name || 'Unknown'}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.email || item.industry || ''}</div>
                      {item.score && <div className="text-[10px] text-muted-foreground/60 mt-0.5">Score: {item.score}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Meetings tab — Calendar from Sales Agent
     ═══════════════════════════════════════════════ */
  const renderMeetings = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading meetings...
      </div>
    )

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Meetings</h3>
            <Button size="sm" variant="outline" className="text-[11px] h-7">
              <Plus className="size-3 mr-1" /> Schedule
            </Button>
          </div>
          {meetingsList.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Calendar className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p>No meetings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {meetingsList.map((m, i) => (
                <div key={m.id || i} className="px-4 py-3 flex items-center gap-3.5">
                  <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Calendar className="size-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.date} at {m.time}
                      {m.lead_name ? ` · ${m.lead_name}` : ''}
                      {m.duration_minutes ? ` · ${m.duration_minutes}min` : ''}
                    </div>
                  </div>
                  <Badge variant={m.status === 'scheduled' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Finance tab — Revenue & forecast from Sales Agent
     ═══════════════════════════════════════════════ */
  const renderFinance = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading finance...
      </div>
    )

    const fd = financeData || {}
    const deals = fd.deals || []
    const forecast = fd.revenue_forecast || []
    const pipelineValue = fd.pipeline_value || 0

    return (
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Pipeline Value', value: `₹${(pipelineValue || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
            { label: 'Closed Deals', value: String(deals.length || 0), icon: CheckCircle2, color: '#3b82f6' },
            { label: 'Avg Deal Size', value: deals.length ? `₹${Math.round(pipelineValue / deals.length).toLocaleString()}` : '₹0', icon: TrendingUp, color: '#f59e0b' },
            { label: 'Forecast (6mo)', value: forecast.length ? `₹${(forecast.reduce((a, f) => a + f.projected, 0)).toLocaleString()}` : '₹0', icon: PieChart, color: '#533afd' },
          ].map((m) => (
            <div key={m.label} className="border border-border bg-card px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
                  <m.icon className="size-4.5" style={{ color: m.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closed deals */}
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closed Deals</h3>
          </div>
          {deals.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No deals closed yet</div>
          ) : (
            <div className="divide-y divide-border/60">
              {deals.map((d, i) => (
                <div key={d.id || i} className="px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{d.lead_name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.date?.slice(0, 10)}</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">₹{d.amount?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue Forecast</h3>
          </div>
          {forecast.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Forecast generating...</div>
          ) : (
            <div className="divide-y divide-border/60">
              {forecast.map((f, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{f.month}</div>
                    <div className="text-[10px] text-muted-foreground">Confidence: {f.confidence}%</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-500">₹{f.projected?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */
  return (
    <PageShell>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2">
            <Bot className="size-5" />
            SBA Agent - Sales Business Assistant
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${mode === 'n8n' ? 'bg-blue-500' : 'bg-emerald-500'} mr-1.5`} />
            {mode === 'n8n' ? 'n8n' : 'AI'}
          </Badge>
        </div>
        <div className="topbar-actions">
          <Button size="sm" variant="ghost" className="text-[11px]">
            <RefreshCw className="size-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics bar */}
      <MetricsBar metrics={SAMPLE_METRICS} />

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-border/60">
        {TABS.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <TabIcon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'pipeline' && renderPipeline()}
        {activeTab === 'meetings' && renderMeetings()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'platforms' && renderPlatforms()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </PageShell>
  )
}
