'use client'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import OrgChart from '@/components/OrgChart'
import { normalizeList } from '@/lib/api-lists'

export default function OrgPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    Promise.all([
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/status').then(r => r.json()).catch(() => ({})),
    ]).then(([agentsData, statusData]) => {
      setAgents(normalizeList(agentsData, 'agents'))
      setStats(statusData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const online = agents.filter(a => a.status === 'online').length
  const idle = agents.filter(a => a.status === 'idle').length
  const error = agents.filter(a => a.status === 'error').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2>Org Chart</h2>
          <Badge variant="outline" className="text-[11px]">
            Hierarchical Routing
          </Badge>
          {!loading && (
            <span className="text-[11px] text-muted-foreground">
              CEO → CTO → {agents.length} Agents
            </span>
          )}
        </div>
        <div className="topbar-actions">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-500" />
              Online: {online}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-yellow-500" />
              Idle: {idle}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-red-500" />
              Error: {error}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <OrgChart agents={agents} />
      </div>
    </div>
  )
}
