'use client'
import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDot,
  ArrowUpRight,
  Filter,
  Plus,
  ListTodo,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/* ── Mock Data ─────────────────────────────────────────────── */

const ISSUES = [
  { id: 'ISS-001', title: 'Research top 50 real estate companies in Miami', status: 'done', agent: 'Intake Researcher', prio: 'High' },
  { id: 'ISS-002', title: 'Write 3 blog posts for client onboarding', status: 'in_progress', agent: 'Content Creator', prio: 'Medium' },
  { id: 'ISS-003', title: 'Optimize SEO for agency landing page', status: 'todo', agent: 'SEO Engine', prio: 'High' },
  { id: 'ISS-004', title: 'Generate weekly analytics report', status: 'todo', agent: 'Analytics Bot', prio: 'Low' },
  { id: 'ISS-005', title: 'Run Facebook ads campaign for new client', status: 'todo', agent: 'Ads Runner', prio: 'Medium' },
]

/* ── Helpers ───────────────────────────────────────────────── */

const statusIcon = (s) => {
  switch (s) {
    case 'done': return CheckCircle2
    case 'in_progress': return Clock
    case 'todo': return CircleDot
    default: return CircleDot
  }
}

const statusBadgeClass = (s) => {
  switch (s) {
    case 'done': return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'in_progress': return 'border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400'
    case 'todo': return 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
    default: return ''
  }
}

const priorityBadgeClass = (p) => {
  switch (p) {
    case 'High': return 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400'
    case 'Medium': return 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
    case 'Low': return 'border-muted-foreground/20 bg-muted text-muted-foreground'
    default: return ''
  }
}

/* ── Page ──────────────────────────────────────────────────── */

export default function IssuesPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const openCount = ISSUES.filter(i => i.status === 'todo' || i.status === 'in_progress').length
  const doneCount = ISSUES.filter(i => i.status === 'done').length

  const filtered = ISSUES.filter(i => {
    if (activeTab === 'open') return i.status === 'todo' || i.status === 'in_progress'
    if (activeTab === 'done') return i.status === 'done'
    return true
  }).filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.agent.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="topbar">
        <h2 className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Issues
        </h2>
        <div className="topbar-actions">
          <Badge variant="secondary">{ISSUES.length} total</Badge>
        </div>
      </div>

      <div className="page-content">
        {/* Filter + Search Bar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {['all', 'open', 'done'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'open' ? `Open (${openCount})` : `Done (${doneCount})`}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New Issue
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const SIcon = statusIcon(i.status)
                return (
                  <tr key={i.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.id}</td>
                    <td className="px-4 py-3 text-foreground">{i.title}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusBadgeClass(i.status)}>
                        <SIcon className="mr-1 h-3 w-3" />
                        {i.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{i.agent}</td>
                    <td className="px-4 py-3">
                      <Badge className={priorityBadgeClass(i.prio)}>
                        {i.prio}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  )
}
