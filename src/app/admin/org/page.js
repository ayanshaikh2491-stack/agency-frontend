'use client'
import { useState, useEffect } from 'react'
import OrgChart from '@/components/OrgChart'

export default function OrgPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    Promise.all([
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/status').then(r => r.json()).catch(() => ({})),
    ]).then(([agentsData, statusData]) => {
      setAgents(agentsData.data || [])
      setStats(statusData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Org Chart</h2>
          <span className="badge badge-accent">Hierarchical Routing</span>
          {!loading && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              CEO → CTO → {agents.length} Agents
            </span>
          )}
        </div>
        <div className="topbar-actions">
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>🟢 Online: {agents.filter(a => a.status === 'online').length}</span>
            <span>⏸ Idle: {agents.filter(a => a.status === 'idle').length}</span>
            <span>🔴 Error: {agents.filter(a => a.status === 'error').length}</span>
          </div>
        </div>
      </div>
      <div className="org-chart" style={{ flex: 1, overflow: 'auto' }}>
        <OrgChart agents={agents} />
      </div>
    </div>
  )
}
