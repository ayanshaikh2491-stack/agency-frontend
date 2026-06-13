'use client'
import OrgChart from '@/components/OrgChart'

export default function OrgPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Org Chart</h2>
          <span className="badge badge-accent">Hierarchical Routing</span>
        </div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CEO → CTO → 8 Worker Agents</span>
        </div>
      </div>
      <div className="org-chart" style={{ flex: 1, overflow: 'auto' }}>
        <OrgChart />
      </div>
    </div>
  )
}
