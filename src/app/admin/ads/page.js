'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useCompany } from '@/lib/client-context'
import {
  Target, BarChart3, DollarSign, TrendingUp, PieChart,
  Play, Pause, Activity, Send, AlertCircle, CheckCircle2,
  ExternalLink, RefreshCw, Server, Settings as SettingsIcon,
  BookOpen, Image, Users, Calendar, FileText, Bot,
  Search, Filter, MoreHorizontal, Clock, Eye,
  ChevronDown, Upload, Download, Plus, X, Copy,
  Trash2, Edit3, Globe, Smartphone, Loader2, Crosshair
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageShell from '@/components/PageShell'

const ADS_SERVER_URL = process.env.NEXT_PUBLIC_ADS_SERVER_URL || 'http://localhost:8765'

/* ─── Sample data for UI demos ─── */
const SAMPLE_CAMPAIGNS = [
  { id: 'cmp_001', name: 'Summer Sale 2025', client: 'Client A', platform: 'Facebook', status: 'ACTIVE', budget: 500, spent: 1234, impressions: 45200, clicks: 1820, ctr: 4.02, conversions: 48, start: '2025-06-01', end: '2025-06-30' },
  { id: 'cmp_002', name: 'Brand Awareness Q3', client: 'Client A', platform: 'Instagram', status: 'ACTIVE', budget: 300, spent: 876, impressions: 28100, clicks: 945, ctr: 3.36, conversions: 22, start: '2025-06-10', end: '2025-07-10' },
  { id: 'cmp_003', name: 'Retargeting - Cart Abandon', client: 'Client B', platform: 'Facebook', status: 'PAUSED', budget: 200, spent: 654, impressions: 12400, clicks: 523, ctr: 4.22, conversions: 15, start: '2025-05-15', end: '2025-06-15' },
  { id: 'cmp_004', name: 'Lead Gen Campaign', client: 'Client B', platform: 'LinkedIn', status: 'ACTIVE', budget: 800, spent: 2100, impressions: 18300, clicks: 412, ctr: 2.25, conversions: 31, start: '2025-06-05', end: '2025-07-05' },
  { id: 'cmp_005', name: 'Product Launch', client: 'Client C', platform: 'Instagram', status: 'DRAFT', budget: 1000, spent: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, start: '2025-07-01', end: '2025-08-01' },
]

const SAMPLE_CLIENTS = ['Client A', 'Client B', 'Client C', 'All Clients']

const SAMPLE_CREATIVES = [
  { id: 'cr_001', name: 'Summer Banner v1', client: 'Client A', type: 'image', url: '', thumbnail: '', size: '1.2 MB', format: 'jpg', created: '2025-06-01', status: 'approved' },
  { id: 'cr_002', name: 'Product Video 15s', client: 'Client A', type: 'video', url: '', thumbnail: '', size: '4.8 MB', format: 'mp4', created: '2025-06-03', status: 'approved' },
  { id: 'cr_003', name: 'Logo Animation', client: 'Client B', type: 'video', url: '', thumbnail: '', size: '2.1 MB', format: 'gif', created: '2025-05-28', status: 'pending' },
  { id: 'cr_004', name: 'Lead Magnet CTA', client: 'Client B', type: 'image', url: '', thumbnail: '', size: '0.8 MB', format: 'png', created: '2025-06-10', status: 'approved' },
]

const SAMPLE_AUDIENCES = [
  { id: 'aud_001', name: 'Website Visitors - 30d', client: 'Client A', size: 45200, source: 'website', status: 'active', created: '2025-05-01' },
  { id: 'aud_002', name: 'Cart Abandoners', client: 'Client A', size: 3200, source: 'pixel', status: 'active', created: '2025-05-10' },
  { id: 'aud_003', name: 'Lookalike - Top Customers', client: 'Client B', size: 185000, source: 'lookalike', status: 'active', created: '2025-04-15' },
]

const SAMPLE_SCHEDULE = [
  { id: 'sch_001', title: 'Summer Sale Launch', client: 'Client A', date: '2025-06-20', type: 'campaign_start', status: 'scheduled' },
  { id: 'sch_002', title: 'Creative Review', client: 'Client A', date: '2025-06-18', type: 'review', status: 'pending' },
  { id: 'sch_003', title: 'Budget Top-Up', client: 'Client B', date: '2025-06-22', type: 'budget', status: 'scheduled' },
]

const SAMPLE_COMPETITORS = [
  { id: 'comp_001', name: 'ShopVerse', client: 'Client A', niche: 'Fashion Ecommerce', platform: 'Instagram', tracked_ads: 12, avg_engagement: '3.2%', estimated_spend: '₹12L/month', strength: 'Strong influencer network', weakness: 'No retargeting', status: 'active' },
  { id: 'comp_002', name: 'TrendSwift', client: 'Client A', niche: 'Fashion Ecommerce', platform: 'Facebook', tracked_ads: 8, avg_engagement: '2.8%', estimated_spend: '₹8L/month', strength: 'Budget-friendly ads', weakness: 'Low video engagement', status: 'active' },
  { id: 'comp_003', name: 'BizGrow Solutions', client: 'Client B', niche: 'SaaS', platform: 'LinkedIn', tracked_ads: 15, avg_engagement: '4.1%', estimated_spend: '₹20L/month', strength: 'High-quality lead gen', weakness: 'Expensive CPC', status: 'active' },
  { id: 'comp_004', name: 'StartupBoost', client: 'Client B', niche: 'SaaS', platform: 'Facebook', tracked_ads: 6, avg_engagement: '2.1%', estimated_spend: '₹5L/month', strength: 'Low CPA', weakness: 'Small audience reach', status: 'inactive' },
  { id: 'comp_005', name: 'QuickGrow', client: 'Client C', niche: 'Health & Wellness', platform: 'Instagram', tracked_ads: 10, avg_engagement: '5.3%', estimated_spend: '₹15L/month', strength: 'Organic virality', weakness: 'No paid strategy', status: 'active' },
]

const SUGGESTIONS = [
  { label: 'Research a niche', prompt: 'research ecommerce 30000' },
  { label: 'Generate ad copy', prompt: 'adcopy for fitness brand targeting young professionals' },
  { label: 'Create campaign', prompt: 'create campaign summer sale with 500 budget' },
  { label: 'Check server health', prompt: 'check health' },
]

const COMMANDS = [
  { cmd: 'campaign banao [name] [budget]', desc: 'Create a new campaign' },
  { cmd: 'activate [id]', desc: 'Activate a paused campaign' },
  { cmd: 'pause [id]', desc: 'Pause an active campaign' },
  { cmd: 'performance [id]', desc: 'Get campaign analytics' },
  { cmd: 'research [niche] [budget]', desc: 'Research a market niche' },
  { cmd: 'adcopy [brand] [audience]', desc: 'Generate ad copy' },
  { cmd: 'report [client] [period]', desc: 'Generate performance report' },
  { cmd: 'check health', desc: 'Check ads server status' },
]

function StatusPill({ color, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
      style={{ background: `${color}15`, color }}>
      <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  )
}

function CampaignCard({ campaign }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 hover:border-foreground/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{campaign.name}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 h-3.5">{campaign.client}</Badge>
          </div>
        </div>
        <StatusPill color={campaign.status === 'ACTIVE' ? '#10b981' : campaign.status === 'PAUSED' ? '#f59e0b' : '#6b7280'} text={campaign.status} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div><div className="text-[9px] text-muted-foreground">Budget</div><div className="text-[11px] font-medium tabular-nums text-foreground">₹{campaign.budget}/d</div></div>
        <div><div className="text-[9px] text-muted-foreground">Spent</div><div className="text-[11px] font-medium tabular-nums text-foreground">₹{campaign.spent}</div></div>
        <div><div className="text-[9px] text-muted-foreground">Impressions</div><div className="text-[11px] font-medium tabular-nums text-foreground">{campaign.impressions.toLocaleString()}</div></div>
        <div><div className="text-[9px] text-muted-foreground">CTR</div><div className="text-[11px] font-medium tabular-nums text-foreground">{campaign.ctr}%</div></div>
      </div>
    </div>
  )
}

export default function AdsPage() {
  const { selectedCompany, companies } = useCompany()
  const clientName = selectedCompany?.name || ''
  const clientId = selectedCompany?.id || ''

  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [serverOnline, setServerOnline] = useState(false)
  const [checkingServer, setCheckingServer] = useState(true)
  const [tab, setTab] = useState('chat')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState('All Clients')
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Check server health
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${ADS_SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) })
        setServerOnline(res.ok)
      } catch { setServerOnline(false) }
      setCheckingServer(false)
    }
    check()
    const iv = setInterval(check, 15000)
    return () => clearInterval(iv)
  }, [])

  // Filter data by selected client
  const filteredCampaigns = useMemo(() => {
    if (selectedClient === 'All Clients') return SAMPLE_CAMPAIGNS
    return SAMPLE_CAMPAIGNS.filter(c => c.client === selectedClient)
  }, [selectedClient])

  const filteredCreatives = useMemo(() => {
    if (selectedClient === 'All Clients') return SAMPLE_CREATIVES
    return SAMPLE_CREATIVES.filter(c => c.client === selectedClient)
  }, [selectedClient])

  const filteredAudiences = useMemo(() => {
    if (selectedClient === 'All Clients') return SAMPLE_AUDIENCES
    return SAMPLE_AUDIENCES.filter(a => a.client === selectedClient)
  }, [selectedClient])

  const filteredCompetitors = useMemo(() => {
    if (selectedClient === 'All Clients') return SAMPLE_COMPETITORS
    return SAMPLE_COMPETITORS.filter(c => c.client === selectedClient)
  }, [selectedClient])

  // KPIs
  const kpis = useMemo(() => {
    const camps = filteredCampaigns
    return {
      totalCampaigns: camps.length,
      activeCampaigns: camps.filter(c => c.status === 'ACTIVE').length,
      totalSpent: camps.reduce((s, c) => s + c.spent, 0),
      totalImpressions: camps.reduce((s, c) => s + c.impressions, 0),
      totalClicks: camps.reduce((s, c) => s + c.clicks, 0),
      totalConversions: camps.reduce((s, c) => s + c.conversions, 0),
      avgCtr: camps.length ? (camps.reduce((s, c) => s + c.ctr, 0) / camps.length).toFixed(2) : 0,
    }
  }, [filteredCampaigns])

  // Active tab icon
  const TabIcon = ({ tabId }) => {
    const icons = {
      chat: Target, campaigns: PieChart, creative: Image,
      audience: Users, schedule: Calendar, reports: FileText,
      sba: Bot, settings: SettingsIcon, competitors: Crosshair
    }
    const Icon = icons[tabId] || Target
    return <Icon className="h-4 w-4" />
  }

  const send = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim()
    if (!text || sending) return
    if (!overrideText) setInput('')
    setMsgs(p => [...p, { id: Date.now().toString(), role: 'user', content: text, time: new Date().toISOString() }])
    setSending(true)
    try {
      const res = await fetch('/api/agents/ads-runner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, client_name: clientName, client_id: clientId }),
      })
      const data = await res.json()
      const reply = data?.data?.response || data?.response || data?.data?.content || JSON.stringify(data)
      setMsgs(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, time: new Date().toISOString() }])
    } catch (e) {
      setMsgs(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: `❌ Error: ${e.message}`, time: new Date().toISOString() }])
    }
    setSending(false)
  }, [input, sending, clientName, clientId])

  const clientList = useMemo(() => {
    const names = companies.map(c => c.name).filter(Boolean)
    return ['All Clients', ...new Set(names)]
  }, [companies])

  const TABS = [
    { id: 'chat', label: 'Chat' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'creative', label: 'Creative' },
    { id: 'audience', label: 'Audience' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'reports', label: 'Reports' },
    { id: 'sba', label: 'SBA' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <PageShell>
      <div className="flex h-full min-h-0 gap-0">
        {/* ════════════════════════════════════════════
            LEFT: Main Content — 3/5
            ════════════════════════════════════════════ */}
        <div className="relative flex min-h-0 w-full flex-col lg:w-3/5 shrink-0 bg-card">
          {/* ─── Header + Client Filter ─── */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500/80">
                <Target className="h-5 w-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">Ads Manager</h3>
                  {checkingServer ? (
                    <StatusPill color="#6b7280" text="..." />
                  ) : serverOnline ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600 bg-emerald-50"><span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />Online</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 bg-amber-50"><span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 mr-1" />Offline</Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">{filteredCampaigns.length} campaigns</Badge>
                </div>
                <p className="text-xs text-muted-foreground">All clients · Facebook, Instagram, LinkedIn Ads</p>
              </div>
            </div>

            {/* Client Filter Dropdown */}
            <div className="relative shrink-0">
              <button onClick={() => setClientDropdownOpen(p => !p)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-[100px] truncate">{selectedClient}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {clientDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg py-1 z-30">
                  {clientList.map(client => (
                    <button key={client} onClick={() => { setSelectedClient(client); setClientDropdownOpen(false) }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${selectedClient === client ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-accent'}`}>
                      {client}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Tab Bar ─── */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border bg-background/40 overflow-x-auto scrollbar-auto-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}>
                <TabIcon tabId={t.id} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── Search Bar ─── */}
          {(tab === 'campaigns' || tab === 'creative' || tab === 'audience' || tab === 'competitors') && (
            <div className="shrink-0 px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${tab}...`}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none" />
              </div>
            </div>
          )}

          {/* ─── TAB CONTENT ─── */}
          <div className="flex-1 overflow-y-auto scrollbar-auto-hide">
            {/* ═══ CHAT ═══ */}
            {tab === 'chat' && (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto scrollbar-auto-hide px-5 py-4">
                  <div className="flex flex-col gap-4">
                    {msgs.length === 0 && (
                      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                        <div className="text-center max-w-sm">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                            <Target className="h-8 w-8 text-orange-500" />
                          </div>
                          <h2 className="text-lg font-semibold text-foreground mb-1">Ads Manager 🎯</h2>
                          <p className="text-sm text-muted-foreground">
                            Manage all clients' campaigns from one place. Research, create, optimize — sab natural language mein.
                          </p>
                          <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                            Selected: <span className="font-medium text-foreground">{selectedClient}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md">
                          {SUGGESTIONS.map(s => (
                            <button key={s.label} onClick={() => { setInput(s.prompt); setTimeout(() => send(s.prompt), 100) }}
                              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-colors">
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
                            <Target className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-medium text-foreground">Ads Manager</span>
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted/50 text-foreground border border-border rounded-bl-md'
                        }`}>{m.content}</div>
                      </div>
                    ))}
                    {sending && (
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-orange-500 mt-1.5" />
                        <div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} /><span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} /><span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </div>
                <div className="border-t border-border px-4 py-3">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 focus-within:border-primary/40 shadow-sm">
                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                      placeholder={`Campaign banao, research karo... (${selectedClient})`} disabled={sending}
                      className="min-h-[24px] flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none" />
                    <button onClick={() => send()} disabled={!input.trim() || sending}
                      className="rounded-lg bg-primary p-1.5 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CAMPAIGNS ═══ */}
            {tab === 'campaigns' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">
                    Showing {filteredCampaigns.length} campaigns
                    {selectedClient !== 'All Clients' && <span> for <span className="text-foreground font-semibold">{selectedClient}</span></span>}
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity">
                    <Plus className="h-3.5 w-3.5" />
                    New Campaign
                  </button>
                </div>
                {filteredCampaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-12">
                    <PieChart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No campaigns for this client yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ CREATIVE LIBRARY ═══ */}
            {tab === 'creative' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">{filteredCreatives.length} creatives</div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filteredCreatives.map(c => (
                    <div key={c.id} className="relative rounded-lg border border-border bg-card p-3 hover:border-foreground/20 transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[9px] px-1 h-3.5">{c.client}</Badge>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /></button>
                          <button className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-center h-20 rounded-lg bg-muted/50 mb-2">
                        {c.type === 'video' ? (
                          <Smartphone className="h-8 w-8 text-muted-foreground/50" />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="text-xs font-medium text-foreground truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.size} · {c.format}</div>
                      <Badge variant={c.status === 'approved' ? 'default' : 'secondary'} className="text-[9px] px-1 h-3.5 mt-1">{c.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ AUDIENCE MANAGER ═══ */}
            {tab === 'audience' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">{filteredAudiences.length} audiences</div>
                  <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity">
                    <Plus className="h-3.5 w-3.5" />
                    Create Audience
                  </button>
                </div>
                {filteredAudiences.map(a => (
                  <div key={a.id} className="rounded-lg border border-border bg-card p-3 hover:border-foreground/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{a.name}</span>
                          <Badge variant="outline" className="text-[9px] px-1 h-3.5">{a.client}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{a.size.toLocaleString()} people</span>
                          <span>· {a.source}</span>
                          <span>· Created {a.created}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusPill color={a.status === 'active' ? '#10b981' : '#6b7280'} text={a.status} />
                        <button className="p-1 text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ COMPETITORS ═══ */}
            {tab === 'competitors' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">{filteredCompetitors.length} tracked competitors</div>
                  <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity">
                    <Plus className="h-3.5 w-3.5" />
                    Track Competitor
                  </button>
                </div>

                {/* Comparison Overview */}
                <Card className="border-border bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                  <CardHeader className="px-4 py-3 border-b border-border/50">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                      {selectedClient === 'All Clients' ? 'Competitive Landscape' : `${selectedClient} vs Competitors`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Competitors', value: filteredCompetitors.length, suffix: 'tracked', color: 'text-orange-600' },
                        { label: 'Total Ads', value: filteredCompetitors.reduce((s, c) => s + c.tracked_ads, 0), suffix: 'across all', color: 'text-blue-600' },
                        { label: 'Avg Engagement', value: filteredCompetitors.length ? (filteredCompetitors.reduce((s, c) => s + parseFloat(c.avg_engagement), 0) / filteredCompetitors.length).toFixed(1) + '%' : '—', suffix: 'competitor avg', color: 'text-emerald-600' },
                        { label: 'Active Tracked', value: filteredCompetitors.filter(c => c.status === 'active').length, suffix: 'currently', color: 'text-green-600' },
                      ].map((k, i) => (
                        <div key={i} className="rounded-lg bg-white/60 backdrop-blur p-2.5 text-center">
                          <div className={`text-lg font-bold tabular-nums ${k.color}`}>{k.value}</div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</div>
                          <div className="text-[8px] text-muted-foreground">{k.suffix}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Competitor Cards */}
                {filteredCompetitors.map(c => (
                  <Card key={c.id} className="border-border hover:border-foreground/20 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{c.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1 h-3.5">{c.client}</Badge>
                            <Badge variant="secondary" className="text-[9px] px-1 h-3.5">{c.niche}</Badge>
                          </div>
                          <StatusPill color={c.status === 'active' ? '#10b981' : '#6b7280'} text={c.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <div className="text-xs font-bold tabular-nums text-foreground">{c.tracked_ads}</div>
                            <div className="text-[9px] text-muted-foreground">Ads Tracked</div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <div className="text-xs font-bold tabular-nums text-emerald-600">{c.avg_engagement}</div>
                            <div className="text-[9px] text-muted-foreground">Engagement</div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <div className="text-xs font-bold tabular-nums text-amber-600">{c.estimated_spend}</div>
                            <div className="text-[9px] text-muted-foreground">Est. Spend</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 text-[10px]">
                          <div className="flex-1 rounded-lg bg-emerald-50 p-2">
                            <span className="font-medium text-emerald-700">✅ Strength:</span>
                            <span className="text-emerald-600 ml-1">{c.strength}</span>
                          </div>
                          <div className="flex-1 rounded-lg bg-red-50 p-2">
                            <span className="font-medium text-red-700">⚠️ Weakness:</span>
                            <span className="text-red-600 ml-1">{c.weakness}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">{c.platform}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[9px] text-foreground hover:bg-accent">
                            <Eye className="h-3 w-3" /> View Ads
                          </button>
                          <button className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[9px] text-foreground hover:bg-accent">
                            <BarChart3 className="h-3 w-3" /> Compare
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredCompetitors.length === 0 && (
                  <div className="text-center py-12">
                    <Crosshair className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No competitors tracked for this client yet.</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Add competitors to start tracking their ads and performance.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ SCHEDULE ═══ */}
            {tab === 'schedule' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-muted-foreground">Upcoming events</div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors">
                    <Calendar className="h-3.5 w-3.5" />
                    Calendar View
                  </button>
                </div>
                {SAMPLE_SCHEDULE.filter(s => selectedClient === 'All Clients' || s.client === selectedClient).map(s => (
                  <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
                      <span className="text-[9px] font-medium text-muted-foreground leading-none">{s.date.split('-')[2]}</span>
                      <span className="text-[9px] text-muted-foreground leading-none">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(s.date.split('-')[1])-1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{s.title}</span>
                        <Badge variant="outline" className="text-[9px] px-1 h-3.5">{s.client}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{s.date}</span>
                        <span>· {s.type}</span>
                      </div>
                    </div>
                    <StatusPill color={s.status === 'scheduled' ? '#3b82f6' : '#f59e0b'} text={s.status} />
                  </div>
                ))}
              </div>
            )}

            {/* ═══ REPORTS ═══ */}
            {tab === 'reports' && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: 'Performance Report', desc: 'Campaign KPIs, spend, ROI', icon: BarChart3, color: 'text-blue-500' },
                    { label: 'Client Summary', desc: 'Per-client breakdown', icon: Users, color: 'text-green-500' },
                    { label: 'Creative Report', desc: 'Ad creative performance', icon: Image, color: 'text-purple-500' },
                    { label: 'Schedule Report', desc: 'Upcoming campaign timeline', icon: Calendar, color: 'text-amber-500' },
                  ].map(r => (
                    <button key={r.label} className="rounded-lg border border-border p-3 text-left hover:border-foreground/20 hover:bg-accent/30 transition-colors">
                      <r.icon className={`h-6 w-6 ${r.color} mb-2`} />
                      <div className="text-xs font-medium text-foreground">{r.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <button className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[9px] font-medium text-white hover:opacity-90" onClick={e => e.stopPropagation()}>
                          <Download className="h-3 w-3" /> PDF
                        </button>
                        <button className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[9px] font-medium text-foreground hover:bg-accent" onClick={e => e.stopPropagation()}>
                          <Download className="h-3 w-3" /> CSV
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generate Custom Report</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none flex-1">
                        <option>All Clients</option>
                        {companies.filter(c => c.name).map(c => <option key={c.id}>{c.name}</option>)}
                      </select>
                      <select className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none flex-1">
                        <option>This Month</option>
                        <option>Last Month</option>
                        <option>Last Quarter</option>
                        <option>Custom Range</option>
                      </select>
                      <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 shrink-0">
                        Generate
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ SBA ═══ */}
            {tab === 'sba' && (
              <div className="p-4 space-y-3">
                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Smart Business Assistant</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
                      <Bot className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-1">SBA Insights</p>
                        <ul className="text-[11px] text-blue-600 space-y-1">
                          <li>• <strong>Client A</strong>: Summer Sale campaign CTR 4.02% — above industry avg</li>
                          <li>• <strong>Client B</strong>: Retargeting campaign paused since June 15 — review performance</li>
                          <li>• <strong>Client C</strong>: Product Launch campaign in DRAFT — budget approved?</li>
                          <li>• Overall spend ₹4,864 across 5 campaigns — 12% under monthly target</li>
                        </ul>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Client A Health', value: 'Stable', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Client B Health', value: 'Needs Attention', color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Client C Health', value: 'Pending Launch', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Overall ROI', value: '2.4x', color: 'text-green-600', bg: 'bg-green-50' },
                      ].map(s => (
                        <div key={s.label} className={`rounded-lg ${s.bg} p-2.5`}>
                          <div className="text-[10px] text-muted-foreground">{s.label}</div>
                          <div className={`text-sm font-semibold ${s.color}`}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs font-medium text-foreground mb-2">Ask SBA</div>
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                        <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input placeholder="e.g. Client A ka performance kaise chal raha hai?" className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none" />
                        <button className="rounded-lg bg-primary p-1 text-white"><Send className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ SETTINGS ═══ */}
            {tab === 'settings' && (
              <div className="p-4 space-y-3">
                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Server Status</CardTitle>
                      <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {serverOnline ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Ads Server running at {ADS_SERVER_URL}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Ads Server offline</span>
                        </div>
                        <div className="rounded-lg bg-muted p-3 text-xs font-mono">
                          <div className="text-muted-foreground mb-1"># Terminal mein chalao:</div>
                          <div className="text-foreground">cd backend && uv run python ads_server.py</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ad Accounts</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {companies.filter(c => c.name).map(c => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <div className="flex items-center gap-2.5">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs font-medium text-foreground">{c.name}</div>
                            <div className="text-[10px] text-muted-foreground">No ad account connected</div>
                          </div>
                        </div>
                        <button className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-accent transition-colors">Connect</button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commands Reference</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-1.5">
                    {COMMANDS.map(c => (
                      <div key={c.cmd} className="flex items-start gap-3 rounded-lg border border-border p-2">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <code className="text-[11px] font-mono font-medium text-foreground">{c.cmd}</code>
                          <p className="text-[9px] text-muted-foreground">{c.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT: Analytics Dashboard — 2/5
            ════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-2/5 flex-col bg-background border-l border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Campaigns</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.activeCampaigns}/{kpis.totalCampaigns}</p>
                  <p className="text-[10px] text-muted-foreground">active / total</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Spend</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">₹{kpis.totalSpent.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">all campaigns</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Impressions</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.totalImpressions.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">total to date</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg CTR</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.avgCtr}%</p>
                  <p className="text-[10px] text-muted-foreground">across {selectedClient}</p>
                </CardContent>
              </Card>
            </div>

            {/* ─── Client Breakdown ─── */}
            <Card className="border-border">
              <CardHeader className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {selectedClient === 'All Clients' ? 'Client Breakdown' : selectedClient}
                  </CardTitle>
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {selectedClient === 'All Clients' ? (
                  [...new Set(SAMPLE_CAMPAIGNS.map(c => c.client))].map(client => {
                    const camps = SAMPLE_CAMPAIGNS.filter(c => c.client === client)
                    return (
                      <div key={client} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <div>
                          <div className="text-xs font-medium text-foreground">{client}</div>
                          <div className="text-[10px] text-muted-foreground">{camps.length} campaigns · ₹{camps.reduce((s, c) => s + c.spent, 0).toLocaleString()} spent</div>
                        </div>
                        <div className="flex gap-1">
                          {camps.filter(c => c.status === 'ACTIVE').length > 0 && (
                            <Badge variant="default" className="text-[9px] px-1 h-3.5 bg-emerald-500">{camps.filter(c => c.status === 'ACTIVE').length} active</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-3">
                    Showing campaigns for <span className="font-medium text-foreground">{selectedClient}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Quick Actions ─── */}
            <Card className="border-border">
              <CardHeader className="px-4 py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 grid grid-cols-2 gap-2">
                <button onClick={() => { setTab('chat'); setTimeout(() => send('campaign banao summer sale 500'), 100) }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <Play className="h-4 w-4 text-emerald-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">New Campaign</div>
                </button>
                <button onClick={() => { setTab('chat'); setTimeout(() => send('check health'), 100) }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">Check Server</div>
                </button>
                <button onClick={() => { setTab('reports') }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">Generate Report</div>
                </button>
                <button onClick={() => { setTab('sba') }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <Bot className="h-4 w-4 text-orange-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">SBA Insights</div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
