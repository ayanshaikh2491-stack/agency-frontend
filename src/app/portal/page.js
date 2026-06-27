'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart3, TrendingUp, DollarSign, Clock, Users,
  CheckCircle2, FileText, MessageSquare, Download,
  ArrowRight, Calendar, ShieldCheck, Bot,
  Eye, ExternalLink, ChevronRight
} from 'lucide-react'

/* ─── Sample client data ─── */
const CLIENT_DATA = {
  name: 'Growth Digital Agency',
  plan: 'Growth',
  status: 'active',
  since: 'Mar 2026',
  metrics: [
    { label: 'Total Reach', value: '245.3K', change: '+12%', icon: TrendingUp, color: '#2563eb' },
    { label: 'Engagements', value: '8,427', change: '+8%', icon: BarChart3, color: '#16a34a' },
    { label: 'Leads Generated', value: '142', change: '+23%', icon: Users, color: '#d97706' },
    { label: 'Avg Response', value: '4.2m', change: '-15%', icon: Clock, color: '#2563eb' },
  ],
  recentReports: [
    { title: 'Monthly Performance — May 2026', date: 'Jun 1, 2026', type: 'PDF' },
    { title: 'Campaign Analysis — Q2 2026', date: 'May 28, 2026', type: 'PDF' },
    { title: 'Social Media Audit — Weekly', date: 'May 25, 2026', type: 'PDF' },
  ],
  invoices: [
    { id: 'INV-2026-05', amount: '$2,499', status: 'paid', date: 'May 1, 2026' },
    { id: 'INV-2026-04', amount: '$2,499', status: 'paid', date: 'Apr 1, 2026' },
    { id: 'INV-2026-03', amount: '$2,499', status: 'paid', date: 'Mar 1, 2026' },
  ],
  upcoming: [
    { title: 'Strategy Call', date: 'Jun 30, 2026', time: '10:00 AM' },
    { title: 'Monthly Review', date: 'Jul 5, 2026', time: '2:00 PM' },
  ],
}

/* ─── Metric Card ─── */
function MetricCard({ metric }) {
  const Icon = metric.icon
  const isUp = metric.change.startsWith('+')
  return (
    <div className="pc-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="pc-stat-value">{metric.value}</div>
          <div className="pc-stat-label mt-0.5">{metric.label}</div>
        </div>
        <div className="size-9 flex items-center justify-center shrink-0" style={{ background: `${metric.color}0c` }}>
          <Icon className="size-4" style={{ color: metric.color }} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[11px] font-medium" style={{ color: isUp ? '#16a34a' : '#dc2626' }}>
          {metric.change}
        </span>
        <span className="text-[11px] text-[var(--pc-text-muted)]">vs last month</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Client Portal — Paperclip Design
   ═══════════════════════════════════════════════ */

export default function ClientPortalPage() {
  const [loggedIn, setLoggedIn] = useState(true) // Toggle for demo
  const [email, setEmail] = useState('')
  const data = CLIENT_DATA

  /* ─── Login Screen ─── */
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--pc-bg-soft)]">
        <div className="w-full max-w-sm px-6">
          <div className="text-center mb-8">
            <div className="size-12 mx-auto mb-4 flex items-center justify-center bg-[var(--pc-accent-subtle)]">
              <Bot className="size-6" style={{ color: 'var(--pc-accent)' }} />
            </div>
            <h1 className="text-lg font-semibold text-[var(--pc-text)]">Client Portal</h1>
            <p className="text-sm text-[var(--pc-text-muted)] mt-1">TAGS Agency</p>
            <div className="pc-divider my-4" />
            <p className="text-xs text-[var(--pc-text-soft)]">Sign in to view your dashboard, reports, and invoices</p>
          </div>

          <div className="pc-card">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--pc-text-soft)] mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pc-input"
                />
              </div>
              <button
                onClick={() => setLoggedIn(true)}
                className="pc-btn pc-btn-primary w-full justify-center"
              >
                Sign In
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[var(--pc-text-dim)] text-center mt-6">
            Powered by TAGS Agency · Paperclip System
          </p>
        </div>
      </div>
    )
  }

  /* ─── Dashboard ─── */
  return (
    <div className="min-h-screen bg-[var(--pc-bg-soft)]">

      {/* ─── Top Bar ─── */}
      <div className="border-b border-[var(--pc-border)] bg-[var(--pc-surface)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-7 flex items-center justify-center bg-[var(--pc-accent-subtle)]">
              <Bot className="size-3.5" style={{ color: 'var(--pc-accent)' }} />
            </div>
            <span className="text-sm font-semibold text-[var(--pc-text)]">Client Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[11px] text-[var(--pc-text-muted)]">{data.name}</div>
            <div className="size-7 rounded-full bg-[var(--pc-bg-muted)] flex items-center justify-center text-xs font-semibold text-[var(--pc-text-soft)]">
              G
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--pc-text)]">{data.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="pc-badge pc-badge-success">{data.status}</span>
              <span className="text-xs text-[var(--pc-text-muted)]">Client since {data.since}</span>
            </div>
          </div>
          <button className="pc-btn pc-btn-primary text-xs gap-1.5">
            <MessageSquare className="size-3.5" />
            Contact Agency
          </button>
        </div>

        {/* Metrics */}
        <div className="pc-grid-4 mb-6">
          {data.metrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        {/* Two Column */}
        <div className="pc-grid-2">

          {/* Left: Reports */}
          <div className="pc-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--pc-text)]">Recent Reports</h2>
              <button className="text-xs text-[var(--pc-accent)] font-medium flex items-center gap-1">
                View all <ChevronRight className="size-3" />
              </button>
            </div>
            <div className="space-y-0">
              {data.recentReports.map((report, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--pc-border-soft)] last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="size-4 shrink-0 text-[var(--pc-text-muted)]" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-[var(--pc-text)] truncate">{report.title}</p>
                      <p className="text-[10px] text-[var(--pc-text-muted)]">{report.date}</p>
                    </div>
                  </div>
                  <button className="text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] transition-colors shrink-0">
                    <Download className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Invoices */}
          <div className="pc-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--pc-text)]">Invoices</h2>
              <button className="text-xs text-[var(--pc-accent)] font-medium flex items-center gap-1">
                View all <ChevronRight className="size-3" />
              </button>
            </div>
            <div className="space-y-0">
              {data.invoices.map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--pc-border-soft)] last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] text-[var(--pc-text)]">{inv.id}</p>
                    <p className="text-[10px] text-[var(--pc-text-muted)]">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-[var(--pc-text)]">{inv.amount}</span>
                    <span className={`pc-badge ${inv.status === 'paid' ? 'pc-badge-success' : 'pc-badge-warning'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom: Upcoming */}
        <div className="pc-card mt-4">
          <h2 className="text-sm font-semibold text-[var(--pc-text)] mb-3">Upcoming Meetings</h2>
          <div className="flex flex-wrap gap-3">
            {data.upcoming.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 border border-[var(--pc-border)] min-w-[200px]">
                <Calendar className="size-4 shrink-0 text-[var(--pc-accent)]" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--pc-text)]">{item.title}</p>
                  <p className="text-[10px] text-[var(--pc-text-muted)]">{item.date} at {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-[var(--pc-text-dim)] text-center mt-8 pt-4 border-t border-[var(--pc-border-soft)]">
          TAGS Agency · Paperclip System v1.0
        </div>

      </div>
    </div>
  )
}
