'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useCompany } from '@/lib/client-context'
import {
  Share2, BarChart3, TrendingUp, Users, MessageCircle, Send,
  Activity, Calendar, Clock, Eye, Heart, Repeat2, MessageSquare,
  Play, Pause, AlertCircle, CheckCircle2, ExternalLink, RefreshCw,
  Server, Settings as SettingsIcon, BookOpen, Image, Video,
  Search, Filter, MoreHorizontal, ChevronDown, Upload, Download,
  Plus, X, Copy, Trash2, Edit3, Globe, Smartphone, Loader2,
  Crosshair, Bot, PieChart, Hash, UserCheck, Camera
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageShell from '@/components/PageShell'

/* ─── Sample data ─── */
const SAMPLE_POSTS = [
  { id: 'pst_001', content: 'Summer collection launch! 🔥 Get 20% off today', client: 'Client A', platform: 'Instagram', type: 'feed', status: 'published', engagement: 4.2, likes: 1240, comments: 83, shares: 45, scheduled: '2025-06-15', posted: '2025-06-15', reach: 18200 },
  { id: 'pst_002', content: 'Behind the scenes: Product shoot', client: 'Client A', platform: 'Instagram', type: 'story', status: 'published', engagement: 3.8, likes: 890, comments: 42, shares: 28, scheduled: '2025-06-16', posted: '2025-06-16', reach: 12400 },
  { id: 'pst_003', content: 'New blog post: Industry trends 2025', client: 'Client B', platform: 'LinkedIn', type: 'article', status: 'scheduled', engagement: 0, likes: 0, comments: 0, shares: 0, scheduled: '2025-06-22', posted: null, reach: 0 },
  { id: 'pst_004', content: 'Customer testimonial video', client: 'Client B', platform: 'Facebook', type: 'video', status: 'draft', engagement: 0, likes: 0, comments: 0, shares: 0, scheduled: '2025-06-25', posted: null, reach: 0 },
  { id: 'pst_005', content: 'Flash sale this weekend!', client: 'Client A', platform: 'Facebook', type: 'feed', status: 'scheduled', engagement: 0, likes: 0, comments: 0, shares: 0, scheduled: '2025-06-20', posted: null, reach: 0 },
  { id: 'pst_006', content: 'Wellness Wednesday tip: Morning routine', client: 'Client C', platform: 'Instagram', type: 'reel', status: 'published', engagement: 6.7, likes: 3200, comments: 156, shares: 420, scheduled: '2025-06-14', posted: '2025-06-14', reach: 45200 },
  { id: 'pst_007', content: 'Product demo: See it in action', client: 'Client C', platform: 'YouTube', type: 'video', status: 'scheduled', engagement: 0, likes: 0, comments: 0, shares: 0, scheduled: '2025-06-28', posted: null, reach: 0 },
]

const SAMPLE_PLATFORMS = [
  { id: 'plt_001', name: '@client_a_insta', client: 'Client A', platform: 'Instagram', followers: 45200, following: 1240, posts: 342, engagement_rate: 3.8, status: 'connected' },
  { id: 'plt_002', name: 'Client A Page', client: 'Client A', platform: 'Facebook', followers: 28100, following: 0, posts: 189, engagement_rate: 2.4, status: 'connected' },
  { id: 'plt_003', name: '@client_a_tiktok', client: 'Client A', platform: 'TikTok', followers: 12500, following: 320, posts: 67, engagement_rate: 5.1, status: 'pending' },
  { id: 'plt_004', name: 'Client B Business', client: 'Client B', platform: 'LinkedIn', followers: 8500, following: 0, posts: 156, engagement_rate: 4.6, status: 'connected' },
  { id: 'plt_005', name: '@client_b_twitter', client: 'Client B', platform: 'Twitter', followers: 3200, following: 450, posts: 892, engagement_rate: 2.1, status: 'connected' },
  { id: 'plt_006', name: '@client_c_health', client: 'Client C', platform: 'Instagram', followers: 78500, following: 890, posts: 423, engagement_rate: 5.8, status: 'connected' },
  { id: 'plt_007', name: 'Client C Channel', client: 'Client C', platform: 'YouTube', followers: 12400, following: 0, posts: 89, engagement_rate: 3.2, status: 'connected' },
]

const SAMPLE_AUDIENCES = [
  { id: 'aud_001', client: 'Client A', platform: 'Instagram', followers: 45200, growth_rate: 3.2, top_age: '25-34', top_gender: 'Female 58%', top_city: 'Mumbai', best_time: '7PM-9PM', best_day: 'Sunday' },
  { id: 'aud_002', client: 'Client A', platform: 'Facebook', followers: 28100, growth_rate: 1.8, top_age: '35-44', top_gender: 'Male 52%', top_city: 'Delhi', best_time: '8PM-10PM', best_day: 'Saturday' },
  { id: 'aud_003', client: 'Client B', platform: 'LinkedIn', followers: 8500, growth_rate: 5.4, top_age: '25-34', top_gender: 'Male 65%', top_city: 'Bangalore', best_time: '12PM-2PM', best_day: 'Tuesday' },
  { id: 'aud_004', client: 'Client C', platform: 'Instagram', followers: 78500, growth_rate: 8.1, top_age: '18-24', top_gender: 'Female 72%', top_city: 'Mumbai', best_time: '9PM-11PM', best_day: 'Friday' },
]

const SUGGESTIONS = [
  { label: '📊 Social Overview', prompt: 'show social overview all clients' },
  { label: '📅 Scheduled Posts', prompt: 'show scheduled posts' },
  { label: '📈 Instagram Analytics', prompt: 'instagram analytics all clients' },
  { label: '⚡ Engagement Report', prompt: 'engagement report all clients' },
]

const PLATFORM_ICONS = { Instagram: Camera, Facebook: Globe, LinkedIn: Users, Twitter: Hash, TikTok: Video, YouTube: Play }

const POST_TEMPLATES = {
  reddit: { subreddit: 'r/test', title: '', body: '' },
  telegram: { text: '' },
  twitter: { text: '' },
  linkedin: { text: '' },
  pinterest: { title: '', image_url: '', board_id: '' },
  gbp: { summary: '' },
  facebook: { target: '', message: '' },
}

function StatusPill({ color, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
      style={{ background: `${color}15`, color }}>
      <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  )
}

function PlatformBadge({ platform }) {
  const Icon = PLATFORM_ICONS[platform] || Globe
  const colors = { Instagram: '#e1306c', Facebook: '#1877f2', LinkedIn: '#0a66c2', Twitter: '#1da1f2', TikTok: '#000000', YouTube: '#ff0000' }
  const color = colors[platform] || '#6b7280'
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium" style={{ background: `${color}15`, color }}>
      <Icon className="h-3 w-3" />
      {platform}
    </span>
  )
}

function PostCard({ post }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 hover:border-foreground/20 transition-colors space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[9px] font-medium text-muted-foreground shrink-0">{post.posted || post.scheduled}</span>
          <PlatformBadge platform={post.platform} />
          <Badge variant="outline" className="text-[9px] px-1 h-3.5">{post.client}</Badge>
        </div>
        <StatusPill color={post.status === 'published' ? '#10b981' : post.status === 'scheduled' ? '#3b82f6' : '#6b7280'} text={post.status} />
      </div>
      <p className="text-xs text-foreground leading-relaxed line-clamp-2">{post.content}</p>
      {post.status === 'published' && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.comments}</span>
          <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />{post.shares}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.reach.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

export default function SocialPage() {
  const { selectedCompany, companies } = useCompany()
  const clientName = selectedCompany?.name || ''
  const clientId = selectedCompany?.id || ''

  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState('chat')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState('All Clients')
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // ─── Organic Channels (Phase 1) ───
  const [organicChannels, setOrganicChannels] = useState([])
  const [organicConfigs, setOrganicConfigs] = useState({})
  const [configDraft, setConfigDraft] = useState('{}')
  const [postChannel, setPostChannel] = useState('reddit')
  const [postPayload, setPostPayload] = useState(JSON.stringify(POST_TEMPLATES.reddit, null, 2))
  const [postResult, setPostResult] = useState(null)
  const [organicLoading, setOrganicLoading] = useState(true)

  useEffect(() => {
    fetch('/api/social/organic/channels?workspace_id=default')
      .then(r => r.json())
      .then(d => {
        const channels = d.channels || []
        const configs = d.configs || {}
        setOrganicChannels(channels)
        setOrganicConfigs(configs)
        if (channels.length > 0) setPostChannel(channels[0].id || channels[0].name || 'reddit')
        if (configs && configs[postChannel]) setConfigDraft(JSON.stringify(configs[postChannel], null, 2))
      })
      .catch(() => {})
      .finally(() => setOrganicLoading(false))
  }, [])

  function handlePostChannelChange(e) {
    const ch = e.target.value
    setPostChannel(ch)
    setPostPayload(JSON.stringify(POST_TEMPLATES[ch] || POST_TEMPLATES.reddit, null, 2))
    setConfigDraft(organicConfigs[ch] ? JSON.stringify(organicConfigs[ch], null, 2) : '{}')
    setPostResult(null)
  }

  async function saveOrganicConfig() {
    setPostResult(null)
    try {
      const res = await fetch('/api/social/organic/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: postChannel, workspace_id: 'default', config: JSON.parse(configDraft) }),
      })
      const data = await res.json().catch(() => ({ ok: res.ok, status: res.status }))
      setPostResult(data)
    } catch (e) {
      setPostResult({ error: e.message })
    }
  }

  async function organicPostNow() {
    setPostResult(null)
    try {
      const res = await fetch('/api/social/organic/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: postChannel, workspace_id: 'default', payload: JSON.parse(postPayload) }),
      })
      const data = await res.json().catch(() => ({ ok: res.ok, status: res.status }))
      setPostResult(data)
    } catch (e) {
      setPostResult({ error: e.message })
    }
  }

  // Filter data by selected client
  const filteredPosts = useMemo(() => {
    if (selectedClient === 'All Clients') return SAMPLE_POSTS
    return SAMPLE_POSTS.filter(p => p.client === selectedClient)
  }, [selectedClient])

  const filteredPlatforms = useMemo(() => {
    if (selectedClient === 'All Clients') return SAMPLE_PLATFORMS
    return SAMPLE_PLATFORMS.filter(p => p.client === selectedClient)
  }, [selectedClient])

  const filteredAudiences = useMemo(() => {
    if (selectedClient === 'All Clients') return SAMPLE_AUDIENCES
    return SAMPLE_AUDIENCES.filter(a => a.client === selectedClient)
  }, [selectedClient])

  // KPIs
  const kpis = useMemo(() => {
    const platforms = filteredPlatforms
    const posts = filteredPosts
    const totalFollowers = platforms.reduce((s, p) => s + p.followers, 0)
    const totalPosts = platforms.reduce((s, p) => s + p.posts, 0)
    const totalPublished = posts.filter(p => p.status === 'published').length
    const totalScheduled = posts.filter(p => p.status === 'scheduled').length
    const totalLikes = posts.reduce((s, p) => s + p.likes, 0)
    const totalComments = posts.reduce((s, p) => s + p.comments, 0)
    const avgEngagement = platforms.length ? (platforms.reduce((s, p) => s + p.engagement_rate, 0) / platforms.length).toFixed(1) : 0
    return { totalFollowers, totalPosts, totalPublished, totalScheduled, totalLikes, totalComments, avgEngagement }
  }, [filteredPlatforms, filteredPosts])

  // TabIcon
  const TabIcon = ({ tabId }) => {
    const icons = {
      chat: MessageCircle, overview: BarChart3, platforms: Globe,
      content: Image, schedule: Calendar, audience: Users,
      analytics: TrendingUp, sba: Bot, organic: Upload, settings: SettingsIcon
    }
    const Icon = icons[tabId] || MessageCircle
    return <Icon className="h-4 w-4" />
  }

  const send = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim()
    if (!text || sending) return
    if (!overrideText) setInput('')
    setMsgs(p => [...p, { id: Date.now().toString(), role: 'user', content: text, time: new Date().toISOString() }])
    setSending(true)
    try {
      const res = await fetch('/api/agents/social-manager/chat', {
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
    { id: 'overview', label: 'Overview' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'content', label: 'Content' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'audience', label: 'Audience' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'sba', label: 'SBA' },
    { id: 'organic', label: 'Organic' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <PageShell>
      <div className="flex h-full min-h-0 gap-0">
        {/* ═══ LEFT: Main — 3/5 ═══ */}
        <div className="relative flex min-h-0 w-full flex-col lg:w-3/5 shrink-0 bg-card">
          {/* ─── Header + Client Filter ─── */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500/80">
                <Share2 className="h-5 w-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">Social Media Manager</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">{filteredPlatforms.length} platforms</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">{kpis.totalFollowers.toLocaleString()} followers</Badge>
                </div>
                <p className="text-xs text-muted-foreground">All clients · Instagram, Facebook, LinkedIn, Twitter</p>
              </div>
            </div>
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
          {(tab === 'content' || tab === 'platforms' || tab === 'audience') && (
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
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                            <Share2 className="h-8 w-8 text-pink-500" />
                          </div>
                          <h2 className="text-lg font-semibold text-foreground mb-1">Social Media Manager 📱</h2>
                          <p className="text-sm text-muted-foreground">
                            Manage all clients' social media from one place. Schedule, analyze, engage — sab natural language mein.
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
                            <Share2 className="h-4 w-4 text-pink-500" />
                            <span className="text-xs font-medium text-foreground">Social Manager</span>
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted/50 text-foreground border border-border rounded-bl-md'
                        }`}>{m.content}</div>
                      </div>
                    ))}
                    {sending && (
                      <div className="flex items-start gap-2">
                        <Share2 className="h-4 w-4 text-pink-500 mt-1.5" />
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
                      placeholder={`Ask your Social Media Manager... (${selectedClient})`} disabled={sending}
                      className="min-h-[24px] flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none" />
                    <button onClick={() => send()} disabled={!input.trim() || sending}
                      className="rounded-lg bg-primary p-1.5 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ OVERVIEW ═══ */}
            {tab === 'overview' && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Followers', value: kpis.totalFollowers.toLocaleString(), icon: Users, color: 'text-pink-500', sub: 'across all platforms' },
                    { label: 'Posts', value: kpis.totalPosts, icon: Image, color: 'text-blue-500', sub: 'total published' },
                    { label: 'Avg Engagement', value: `${kpis.avgEngagement}%`, icon: TrendingUp, color: 'text-emerald-500', sub: 'across platforms' },
                    { label: 'Engagement Rate', value: filteredPosts.filter(p => p.status === 'published').length ? (filteredPosts.reduce((s, p) => s + p.engagement, 0) / filteredPosts.filter(p => p.status === 'published').length).toFixed(1) + '%' : '0%', icon: Heart, color: 'text-red-500', sub: 'avg per post' },
                  ].map((k, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</span>
                        </div>
                        <p className="text-lg font-semibold tabular-nums text-foreground">{k.value}</p>
                        <p className="text-[9px] text-muted-foreground">{k.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">
                    Recent posts across {selectedClient}
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent">
                    <BarChart3 className="h-3.5 w-3.5" /> Full Report
                  </button>
                </div>
                {filteredPosts.slice(0, 4).map(p => <PostCard key={p.id} post={p} />)}
              </div>
            )}

            {/* ═══ PLATFORMS ═══ */}
            {tab === 'platforms' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">{filteredPlatforms.length} connected platforms</div>
                  <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                    <Plus className="h-3.5 w-3.5" /> Connect Platform
                  </button>
                </div>
                {filteredPlatforms.map(p => {
                  const Icon = PLATFORM_ICONS[p.platform] || Globe
                  const platformColors = { Instagram: '#e1306c', Facebook: '#1877f2', LinkedIn: '#0a66c2', Twitter: '#1da1f2', TikTok: '#000', YouTube: '#ff0000' }
                  const color = platformColors[p.platform] || '#6b7280'
                  return (
                    <Card key={p.id} className="border-border">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}15` }}>
                            <Icon className="h-4 w-4" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">{p.name}</span>
                              <Badge variant="outline" className="text-[9px] px-1 h-3.5">{p.client}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                              <span>{p.followers.toLocaleString()} followers</span>
                              <span>· {p.posts} posts</span>
                              <span>· {p.engagement_rate}% eng.</span>
                            </div>
                          </div>
                          <StatusPill color={p.status === 'connected' ? '#10b981' : '#f59e0b'} text={p.status} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* ═══ CONTENT ═══ */}
            {tab === 'content' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-muted-foreground">{filteredPosts.length} total</div>
                    <Badge variant="default" className="text-[9px] px-1.5 h-3.5 bg-emerald-500/90 text-white">{filteredPosts.filter(p => p.status === 'published').length} published</Badge>
                    <Badge variant="secondary" className="text-[9px] px-1.5 h-3.5">{filteredPosts.filter(p => p.status === 'scheduled').length} scheduled</Badge>
                    <Badge variant="outline" className="text-[9px] px-1.5 h-3.5">{filteredPosts.filter(p => p.status === 'draft').length} drafts</Badge>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                    <Plus className="h-3.5 w-3.5" /> New Post
                  </button>
                </div>
                {filteredPosts.map(p => <PostCard key={p.id} post={p} />)}
                {filteredPosts.length === 0 && (
                  <div className="text-center py-12">
                    <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No content for this client yet. Create your first post!</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ SCHEDULE ═══ */}
            {tab === 'schedule' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Upcoming scheduled posts</div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent">
                    <Calendar className="h-3.5 w-3.5" /> Calendar View
                  </button>
                </div>
                {filteredPosts.filter(p => p.status === 'scheduled').length === 0 && (
                  <div className="text-center py-8 rounded-lg border border-dashed border-border">
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No scheduled posts for {selectedClient}</p>
                  </div>
                )}
                {filteredPosts.filter(p => p.status === 'scheduled').map(p => (
                  <div key={p.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-blue-50 shrink-0">
                      <span className="text-[9px] font-medium text-blue-600 leading-none">{p.scheduled.split('-')[2]}</span>
                      <span className="text-[9px] text-blue-600 leading-none">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(p.scheduled.split('-')[1])-1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground line-clamp-1">{p.content}</span>
                        <PlatformBadge platform={p.platform} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{p.scheduled}</span>
                        <Badge variant="outline" className="text-[9px] px-1 h-3.5">{p.client}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="rounded-md border border-border p-1 text-muted-foreground hover:text-foreground"><Edit3 className="h-3 w-3" /></button>
                      <button className="rounded-md border border-border p-1 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ AUDIENCE ═══ */}
            {tab === 'audience' && (
              <div className="p-4 space-y-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Audience insights for {selectedClient}
                </div>
                {filteredAudiences.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No audience data available for {selectedClient}</p>
                  </div>
                )}
                {filteredAudiences.map(a => {
                  const Icon = PLATFORM_ICONS[a.platform] || Globe
                  const platformColors = { Instagram: '#e1306c', Facebook: '#1877f2', LinkedIn: '#0a66c2', Twitter: '#1da1f2', TikTok: '#000', YouTube: '#ff0000' }
                  const color = platformColors[a.platform] || '#6b7280'
                  return (
                    <Card key={a.client + a.platform} className="border-border">
                      <CardHeader className="px-4 py-2.5 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color }} />
                          <CardTitle className="text-xs font-semibold text-foreground">{a.platform} — {a.client}</CardTitle>
                          <Badge variant="outline" className="text-[9px] px-1 h-3.5">{a.followers.toLocaleString()} followers</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: 'Growth Rate', value: `${a.growth_rate}%`, color: 'text-emerald-600' },
                            { label: 'Top Age', value: a.top_age, color: 'text-blue-600' },
                            { label: 'Top Gender', value: a.top_gender, color: 'text-purple-600' },
                            { label: 'Top City', value: a.top_city, color: 'text-orange-600' },
                            { label: 'Best Time', value: a.best_time, color: 'text-green-600' },
                            { label: 'Best Day', value: a.best_day, color: 'text-rose-600' },
                          ].map((k, i) => (
                            <div key={i} className="rounded-lg bg-muted/50 p-2">
                              <div className={`text-xs font-semibold ${k.color}`}>{k.value}</div>
                              <div className="text-[9px] text-muted-foreground">{k.label}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* ═══ ANALYTICS ═══ */}
            {tab === 'analytics' && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Platform Report', desc: 'Per-platform performance', icon: PieChart, color: 'text-pink-500' },
                    { label: 'Engagement Report', desc: 'Likes, shares, comments', icon: Heart, color: 'text-red-500' },
                    { label: 'Growth Report', desc: 'Follower growth trends', icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Content Report', desc: 'Best performing content', icon: Image, color: 'text-blue-500' },
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
                      <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 shrink-0">Generate</button>
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
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Smart Business Assistant — Social</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-start gap-3 rounded-lg bg-purple-50 border border-purple-100 p-3">
                      <Bot className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-purple-700 mb-1">SBA Social Insights</p>
                        <ul className="text-[11px] text-purple-600 space-y-1">
                          <li>• <strong>Client A</strong>: Instagram reel engagement 6.7% — best performing format</li>
                          <li>• <strong>Client B</strong>: LinkedIn article scheduled for June 22 — high B2B potential</li>
                          <li>• <strong>Client C</strong>: 8.1% follower growth this month — fastest growing</li>
                          <li>• Overall avg engagement {kpis.avgEngagement}% — {'>'}3% is good benchmark</li>
                        </ul>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Client A Health', value: 'Growing', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Client B Health', value: 'Needs Content', color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Client C Health', value: 'Viral Trend', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Best Platform', value: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-50' },
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
                        <input placeholder="e.g. Client A ki engagement kyu gira hai?" className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none" />
                        <button className="rounded-lg bg-primary p-1 text-white"><Send className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ ORGANIC ═══ */}
            {tab === 'organic' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Organic Channels · Phase 1</div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">{organicChannels.length} channels</Badge>
                </div>

                {organicLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading organic channels...
                  </div>
                )}
                {!organicLoading && organicChannels.length === 0 && (
                  <div className="text-center py-10 rounded-lg border border-dashed border-border">
                    <Globe className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No organic channels connected yet.</p>
                  </div>
                )}
                {organicChannels.map(ch => (
                  <Card key={ch.id || ch.name} className="border-border">
                    <CardHeader className="px-4 py-2.5 border-b border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <CardTitle className="text-xs font-semibold text-foreground truncate">{ch.name || ch.id}</CardTitle>
                        {ch.type && <Badge variant="outline" className="text-[9px] px-1 h-3.5">{ch.type}</Badge>}
                        <div className="ml-auto flex items-center gap-1.5 shrink-0">
                          {Array.isArray(ch.capabilities) && ch.capabilities.slice(0, 3).map(c => (
                            <Badge key={c} variant="secondary" className="text-[9px] px-1 h-3.5">{c}</Badge>
                          ))}
                          <StatusPill color={ch.auth ? '#10b981' : '#f59e0b'} text={ch.auth ? 'authed' : 'no auth'} />
                        </div>
                      </div>
                    </CardHeader>
                    {ch.auth && (
                      <CardContent className="p-3">
                        <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground max-h-24 overflow-y-auto">{JSON.stringify(ch.auth, null, 2)}</pre>
                      </CardContent>
                    )}
                  </Card>
                ))}

                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel Config</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground shrink-0">Channel</span>
                      <select value={postChannel} onChange={handlePostChannelChange}
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none">
                        {(organicChannels.length > 0 ? organicChannels.map(ch => ({ id: ch.id || ch.name, name: ch.name || ch.id })) : Object.keys(POST_TEMPLATES).map(ch => ({ id: ch, name: ch }))).map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.name}</option>
                        ))}
                      </select>
                    </div>
                    <textarea value={configDraft} onChange={e => setConfigDraft(e.target.value)} rows={4} spellCheck={false}
                      placeholder='{ "api_key": "..." }'
                      className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-primary/40" />
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfigDraft(organicConfigs[postChannel] ? JSON.stringify(organicConfigs[postChannel], null, 2) : '{}')}>Reset</Button>
                      <Button size="sm" onClick={saveOrganicConfig}>Save config</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Composer</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground shrink-0">Channel</span>
                      <select value={postChannel} onChange={handlePostChannelChange}
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none">
                        {Object.keys(POST_TEMPLATES).map(ch => <option key={ch} value={ch}>{ch}</option>)}
                      </select>
                    </div>
                    <textarea value={postPayload} onChange={e => setPostPayload(e.target.value)} rows={6} spellCheck={false}
                      className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-primary/40" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">Payload template for <span className="font-medium text-foreground">{postChannel}</span></span>
                      <Button size="sm" onClick={organicPostNow}><Send className="h-3.5 w-3.5 mr-1.5" /> Post Now</Button>
                    </div>
                  </CardContent>
                </Card>

                {postResult && (
                  <Card className="border-border">
                    <CardHeader className="px-4 py-2.5 border-b border-border">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 font-mono text-[10px] text-foreground">{JSON.stringify(postResult, null, 2)}</pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ═══ SETTINGS ═══ */}
            {tab === 'settings' && (
              <div className="p-4 space-y-3">
                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connected Platforms</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {companies.filter(c => c.name).map(c => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <div className="flex items-center gap-2.5">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs font-medium text-foreground">{c.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {filteredPlatforms.filter(p => p.client === c.name).length} platforms connected
                            </div>
                          </div>
                        </div>
                        <button className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-accent transition-colors">Manage</button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="px-4 py-3 border-b border-border">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auto-Posting Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {['Instagram', 'Facebook', 'LinkedIn', 'Twitter'].map(p => (
                      <div key={p} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <PlatformBadge platform={p} />
                        <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer">
                          Auto-post
                          <div className="relative h-4 w-7 rounded-full border border-border bg-muted transition-colors">
                            <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-foreground/80 transition-transform" />
                          </div>
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Analytics — 2/5 ═══ */}
        <div className="hidden lg:flex lg:w-2/5 flex-col bg-background border-l border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Followers</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.totalFollowers.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">across all platforms</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Engagement</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.avgEngagement}%</p>
                  <p className="text-[10px] text-muted-foreground">avg across platforms</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Image className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Posts</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.totalPosts}</p>
                  <p className="text-[10px] text-muted-foreground">{kpis.totalPublished} pub · {kpis.totalScheduled} sch</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Reactions</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-foreground">{(kpis.totalLikes + kpis.totalComments).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{kpis.totalLikes} likes · {kpis.totalComments} comments</p>
                </CardContent>
              </Card>
            </div>

            {/* ─── Client Breakdown ─── */}
            <Card className="border-border">
              <CardHeader className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {selectedClient === 'All Clients' ? 'Client Platforms' : selectedClient}
                  </CardTitle>
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {selectedClient === 'All Clients' ? (
                  [...new Set(SAMPLE_PLATFORMS.map(p => p.client))].map(client => {
                    const platforms = SAMPLE_PLATFORMS.filter(p => p.client === client)
                    return (
                      <div key={client} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <div>
                          <div className="text-xs font-medium text-foreground">{client}</div>
                          <div className="text-[10px] text-muted-foreground">{platforms.length} platforms · {platforms.reduce((s, p) => s + p.followers, 0).toLocaleString()} followers</div>
                        </div>
                        <div className="flex gap-1">
                          {platforms.filter(p => p.status === 'connected').length > 0 && (
                            <Badge variant="default" className="text-[9px] px-1 h-3.5 bg-emerald-500">{platforms.filter(p => p.status === 'connected').length} active</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-3">
                    Showing platforms for <span className="font-medium text-foreground">{selectedClient}</span>
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
                <button onClick={() => { setTab('content') }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">New Post</div>
                </button>
                <button onClick={() => { setTab('schedule') }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">Schedule</div>
                </button>
                <button onClick={() => { setTab('analytics') }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">Analytics</div>
                </button>
                <button onClick={() => { setTab('sba') }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <Bot className="h-4 w-4 text-orange-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">SBA Insights</div>
                </button>
                <button onClick={() => { setTab('organic') }}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <Upload className="h-4 w-4 text-teal-500" />
                  <div className="text-xs font-medium text-foreground group-hover:text-primary">Organic Post</div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
