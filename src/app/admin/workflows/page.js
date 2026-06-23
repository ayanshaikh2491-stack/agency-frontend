'use client'
import { useState } from 'react'
import {
  Zap, Search, FileText, Mail, TrendingUp, BarChart3, UserCheck, ShieldCheck,
  Play, CheckCircle2, XCircle, RefreshCw, Activity, Loader2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ICON_MAP = {
  'speed-to-lead': Zap,
  'intake-research': Search,
  'content-pipeline': FileText,
  'nurture-pipeline': Mail,
  'seo-optimize': TrendingUp,
  'analytics-report': BarChart3,
  'client-onboard': UserCheck,
  'quality-review': ShieldCheck,
}

const WORKFLOWS = [
  { id: 'speed-to-lead', name: 'Speed to Lead', desc: 'Instant lead response via SMS + email + LinkedIn' },
  { id: 'intake-research', name: 'Intake Research', desc: 'Client intake → VOC analysis → ICP → positioning' },
  { id: 'content-pipeline', name: 'Content Pipeline', desc: 'Blog → social → ad copy → email sequence' },
  { id: 'nurture-pipeline', name: 'Nurture Pipeline', desc: 'Lead nurturing: emails, retargeting, follow-ups' },
  { id: 'seo-optimize', name: 'SEO Optimization', desc: 'Keyword research → on-page → content optimization' },
  { id: 'analytics-report', name: 'Analytics Report', desc: 'Weekly/Monthly analytics & performance reports' },
  { id: 'client-onboard', name: 'Client Onboarding', desc: 'Welcome sequence → kickoff call → setup' },
  { id: 'quality-review', name: 'Quality Review', desc: 'Content QC, compliance check, brand alignment' },
]

export default function WorkflowsPage() {
  const [running, setRunning] = useState(null)
  const [logs, setLogs] = useState([])

  async function trigger(wf) {
    setRunning(wf.id)
    setLogs(prev => [{id: wf.id, name: wf.name, ts: new Date(), status: 'running'}, ...prev])
    try {
      const res = await fetch(`/api/workflows/${wf.id}/run`, { method: 'POST' })
      const data = await res.json()
      setLogs(prev => prev.map(l => l.id === wf.id ? {...l, status: 'done', result: data} : l))
    } catch (e) {
      setLogs(prev => prev.map(l => l.id === wf.id ? {...l, status: 'error'} : l))
    }
    setRunning(null)
  }

  return (
    <>
      <div className="topbar">
        <h2 className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Workflows
        </h2>
        <div className="topbar-actions">
          <span className="text-xs text-muted-foreground">{WORKFLOWS.length} workflows</span>
        </div>
      </div>
      <div className="page-content">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {WORKFLOWS.map(wf => {
            const Icon = ICON_MAP[wf.id]
            const isLoading = running === wf.id
            return (
              <Card key={wf.id} className="flex flex-col p-5 transition-colors hover:border-accent">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-sm font-medium text-foreground">{wf.name}</h3>
                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{wf.desc}</p>
                <Button
                  size="sm"
                  className="mt-auto w-full justify-center gap-1.5 text-xs"
                  onClick={() => trigger(wf)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      Trigger
                    </>
                  )}
                </Button>
              </Card>
            )
          })}
        </div>

        {logs.length > 0 && (
          <Card className="mt-4 p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Run Log</h3>
            <div className="space-y-2">
              {logs.map((l, i) => {
                const StatusIcon = l.status === 'done' ? CheckCircle2
                  : l.status === 'error' ? XCircle
                  : RefreshCw
                const badgeVariant = l.status === 'done' ? 'default'
                  : l.status === 'error' ? 'destructive'
                  : 'secondary'
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                    <StatusIcon className={`h-4 w-4 shrink-0 ${
                      l.status === 'done' ? 'text-green-500'
                      : l.status === 'error' ? 'text-red-500'
                      : 'animate-spin text-muted-foreground'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">{l.name}</span>
                      <Badge variant={badgeVariant} className="ml-2 text-[10px]">
                        {l.status === 'done' ? 'completed'
                          : l.status === 'error' ? 'failed'
                          : 'running'}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{l.ts.toLocaleTimeString()}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
