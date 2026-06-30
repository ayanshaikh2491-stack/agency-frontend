'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Crown, Bot, Share2, Megaphone, Search, Globe, MessageSquare, Users,
  DollarSign, TrendingUp, Activity, Clock, ArrowRight,
  BarChart3, Calendar, CheckCircle2, AlertCircle, Loader2,
  Zap, PieChart, ExternalLink, RefreshCw
} from 'lucide-react'

/* ─── Quick Stats ─── */
const QUICK_STATS = [
  { label: 'Active Clients', value: '—', icon: Users, color: '#2563eb', href: '/admin/workspaces' },
  { label: 'Revenue (MRR)', value: '—', icon: DollarSign, color: '#16a34a', href: '/admin/costs' },
  { label: 'Pipeline Leads', value: '—', icon: TrendingUp, color: '#d97706', href: '/admin/agents/sba' },
  { label: 'Active Agents', value: '—', icon: Bot, color: '#2563eb', href: '/admin/agents' },
]

/* ─── Agent Cards ─── */
const AGENTS = [
  { id: 'ceo',   name: 'CEO Console',   desc: 'Command center — oversee operations, decisions, and strategy', icon: Crown,     color: '#2563eb', href: '/admin/ceo', status: 'running' },
  { id: 'sba',   name: 'SBA',            desc: 'Lead qualification, pipeline, meetings, and sales automation',  icon: Bot,        color: '#16a34a', href: '/admin/agents/sba', status: 'running' },
  { id: 'social',name: 'Social Media',   desc: 'Schedule posts, manage platforms, track engagement',              icon: Share2,     color: '#d97706', href: '/admin/social', status: 'running' },
  { id: 'ads',   name: 'Ads Manager',    desc: 'Create and manage ad campaigns across platforms',                 icon: Megaphone,  color: '#dc2626', href: '/admin/ads', status: 'idle' },
  { id: 'seo',   name: 'SEO Engine',     desc: 'Keyword research, site audits, rank tracking, and backlinks',               icon: Search,       color: '#8b5cf6', href: '/admin/agents/seo', status: 'running' },
  { id: 'website', name: 'Website Agent', desc: 'Design, build, and maintain client websites and landing pages',           icon: Globe,        color: '#06b6d4', href: '/admin/agents/website', status: 'running' },
]

/* ─── Recent Activity (placeholder) ─── */
const RECENT_ACTIVITY = [
  { time: '2m ago', text: 'SBA qualified new lead — Digital Marketing Agency (score: 65)', type: 'success' },
  { time: '15m ago', text: 'CEO decision: Pause client outreach for Annual Innovations', type: 'info' },
  { time: '1h ago', text: 'Social: 3 posts scheduled for this week across 2 platforms', type: 'default' },
  { time: '3h ago', text: 'Ads: Campaign ROAS dropped below threshold — review needed', type: 'warning' },
]

/* ═══════════════════════════════════════════════
   Admin Portal — Paperclip Design
   ═══════════════════════════════════════════════ */

function StatCard({ stat }) {
  const Icon = stat.icon
  return (
    <Link href={stat.href} className="group no-underline text-inherit">
      <div className="pc-card flex items-center gap-3 h-full group-hover:border-[var(--pc-border-strong)] group-hover:shadow-[var(--pc-shadow-sm)] transition-all">
        <div className="size-9 flex items-center justify-center" style={{ background: `${stat.color}0c` }}>
          <Icon className="size-4" style={{ color: stat.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="pc-stat-value text-lg">{stat.value}</div>
          <div className="pc-stat-label mt-0.5">{stat.label}</div>
        </div>
      </div>
    </Link>
  )
}

function AgentCard({ agent }) {
  const Icon = agent.icon
  return (
    <Link href={agent.href} className="group no-underline text-inherit">
      <div className="pc-card group-hover:border-[var(--pc-border-strong)] group-hover:shadow-[var(--pc-shadow-sm)] transition-all h-full flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-9 flex items-center justify-center" style={{ background: `${agent.color}0c` }}>
            <Icon className="size-4.5" style={{ color: agent.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--pc-text)]">{agent.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex size-1.5 rounded-full" style={{
                background: agent.status === 'running' ? '#16a34a' : '#a0a1a3'
              }} />
              <span className="text-[11px] text-[var(--pc-text-muted)] uppercase tracking-wider">{agent.status}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-[var(--pc-text-soft)] leading-relaxed flex-1">{agent.desc}</p>
        <div className="flex items-center gap-1 mt-3 text-[11px] font-medium text-[var(--pc-accent)] group-hover:gap-1.5 transition-all">
          <span>Open</span>
          <ArrowRight className="size-3" />
        </div>
      </div>
    </Link>
  )
}

function ActivityIcon({ type }) {
  const icons = {
    success: CheckCircle2,
    info: Bot,
    warning: AlertCircle,
    default: Activity,
  }
  const colors = {
    success: '#16a34a',
    info: '#2563eb',
    warning: '#d97706',
    default: '#a0a1a3',
  }
  const Icon = icons[type] || icons.default
  return <Icon className="size-3.5 shrink-0 mt-0.5" style={{ color: colors[type] || colors.default }} />
}

export default function AdminPortalPage() {
  const [greeting, setGreeting] = useState('Good morning')
  const [stats, setStats] = useState(QUICK_STATS)

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good morning')
    else if (h < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--pc-text)]">{greeting}, Ayan</h1>
        <p className="text-sm text-[var(--pc-text-muted)] mt-1">
          Agency Control Center — Paperclip
        </p>
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="pc-grid-4">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      {/* ─── Agent Grid ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--pc-text)]">Agents</h2>
          <Link href="/admin/agents" className="text-[11px] font-medium text-[var(--pc-accent)] no-underline hover:underline flex items-center gap-1">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="pc-grid-4">
          {AGENTS.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      </div>

      {/* ─── Bottom Row: Recent Activity + Quick Actions ─── */}
      <div className="pc-grid-2">

        {/* Recent Activity */}
        <div className="pc-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--pc-text)]">Recent Activity</h2>
            <button className="text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] transition-colors">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <div className="space-y-0">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 py-2 border-b border-[var(--pc-border-soft)] last:border-0">
                <ActivityIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--pc-text)] leading-snug">{item.text}</p>
                  <p className="text-[10px] text-[var(--pc-text-muted)] mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pc-card">
          <h2 className="text-sm font-semibold text-[var(--pc-text)] mb-3">Quick Actions</h2>
          <div className="space-y-1">
            <Link href="/admin/agents/sba" className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--pc-text)] no-underline hover:bg-[var(--pc-bg-hover)] transition-colors">
              <Bot className="size-4 text-[var(--pc-accent)]" />
              <span>Qualify new leads in SBA</span>
            </Link>
            <Link href="/admin/ceo" className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--pc-text)] no-underline hover:bg-[var(--pc-bg-hover)] transition-colors">
              <Crown className="size-4 text-[#d97706]" />
              <span>CEO decision review</span>
            </Link>
            <Link href="/admin/social" className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--pc-text)] no-underline hover:bg-[var(--pc-bg-hover)] transition-colors">
              <Share2 className="size-4 text-[#3b82f6]" />
              <span>Schedule social posts</span>
            </Link>
            <Link href="/admin/workspaces" className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--pc-text)] no-underline hover:bg-[var(--pc-bg-hover)] transition-colors">
              <Users className="size-4 text-[var(--pc-accent)]" />
              <span>Manage clients & workspaces</span>
            </Link>
            <Link href="/admin/costs" className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--pc-text)] no-underline hover:bg-[var(--pc-bg-hover)] transition-colors">
              <DollarSign className="size-4 text-[#16a34a]" />
              <span>Finance & costs</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ─── Footer ─── */}
      <div className="text-[11px] text-[var(--pc-text-dim)] text-center pt-4 border-t border-[var(--pc-border-soft)]">
        TAGS Agency · Paperclip System v1.0
      </div>

    </div>
  )
}
