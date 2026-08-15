'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDot,
  ArrowUpRight,
  Filter,
  Plus,
  ListTodo,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/* ── Page ──────────────────────────────────────────────────── */

export default function IssuesPage() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/issues')
      const data = await res.json()
      const raw = data?.issues ?? []
      const normalized = raw.map((i) => ({
        id: String(i.id ?? ''),
        title: String(i.title ?? 'Untitled'),
        status: ['todo', 'in_progress', 'done'].includes(i.status) ? i.status : 'todo',
        agent: String(i.agent ?? 'System'),
        prio: ['High', 'Medium', 'Low'].includes(i.prio) ? i.prio : 'Medium',
      }))
      setIssues(normalized)
    } catch (e) {
      setError(e?.message || 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const STATUSES = ['todo', 'in_progress', 'done']
  const openCount = issues.filter((i) => i.status === 'todo' || i.status === 'in_progress').length
  const doneCount = issues.filter((i) => i.status === 'done').length

  const filtered = issues
    .filter((i) => {
      if (activeTab === 'open') return i.status === 'todo' || i.status === 'in_progress'
      if (activeTab === 'done') return i.status === 'done'
      return true
    })
    .filter((i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.agent.toLowerCase().includes(search.toLowerCase())
    )

  const statusIcon = (s) => {
    if (s === 'done') return CheckCircle2
    if (s === 'in_progress') return Clock
    return CircleDot
  }
  const statusBadgeClass = (s) => {
    if (s === 'done') return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    if (s === 'in_progress') return 'border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400'
    return 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
  }
  const priorityBadgeClass = (p) => {
    if (p === 'High') return 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400'
    if (p === 'Medium') return 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
    return 'border-muted-foreground/20 bg-muted text-muted-foreground'
  }

  return (
    <>
      <div className="topbar">
        <h2 className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Issues
        </h2>
        <div className="topbar-actions">
          <Badge variant="secondary">{issues.length} total</Badge>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={load}>Retry</Button>
          </div>
        )}

        {/* Filter + Search Bar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {['all', 'open', 'done'].map((tab) => (
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
              onChange={(e) => setSearch(e.target.value)}
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading issues...
                  </td>
                </tr>
              ) : (
                <>
                  {filtered.map((i) => {
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
                </>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  )
}
