'use client'
import { useState } from 'react'

const DEFAULT_WORKERS = [
  { id: 'intake', name: 'Intake Researcher', role: 'worker', status: 'active', tickets: 3, tokens: 4230, emoji: '🔍' },
  { id: 'content', name: 'Content Creator', role: 'worker', status: 'active', tickets: 2, tokens: 3100, emoji: '✍️' },
  { id: 'ads', name: 'Ads Runner', role: 'worker', status: 'active', tickets: 1, tokens: 1450, emoji: '📢' },
  { id: 'seo', name: 'SEO Engine', role: 'worker', status: 'idle', tickets: 0, tokens: 0, emoji: '🔎' },
  { id: 'analytics', name: 'Analytics Bot', role: 'worker', status: 'active', tickets: 1, tokens: 890, emoji: '📊' },
  { id: 'sales', name: 'Sales Closer', role: 'worker', status: 'idle', tickets: 0, tokens: 0, emoji: '🤝' },
  { id: 'client-success', name: 'Client Success', role: 'worker', status: 'active', tickets: 2, tokens: 670, emoji: '⭐' },
  { id: 'review', name: 'Review & QC', role: 'worker', status: 'active', tickets: 4, tokens: 2100, emoji: '✅' },
]

export default function OrgChart({ ceo, cto, workers: externalWorkers }) {
  const [hovered, setHovered] = useState(null)
  const workers = externalWorkers || DEFAULT_WORKERS

  const statusColor = (s) => {
    switch (s) {
      case 'active': case 'running': return 'var(--green)'
      case 'idle': case 'paused': return 'var(--yellow)'
      case 'error': return 'var(--red)'
      default: return 'var(--text-muted)'
    }
  }

  const NodeTooltip = ({ agent }) => (
    <div className="org-hover-tooltip">
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
        {agent.emoji || '🤖'} {agent.name}
      </div>
      <div>Tokens: <span style={{ color: 'var(--text-code)' }}>{agent.tokens?.toLocaleString() || 0}</span></div>
      <div>Active tickets: <span style={{ color: 'var(--accent)' }}>{agent.tickets || 0}</span></div>
    </div>
  )

  return (
    <div className="org-chart">
      <div className="org-tree">
        {/* CEO Node */}
        <div className="org-node">
          <div className="org-node-card ceo" style={{ minWidth: 200 }}>
            <NodeTooltip agent={ceo || { name: 'CEO Agent', emoji: '🧠', role: 'orchestrator', tokens: 8920, tickets: 5 }} />
            <div className="org-node-title">
              <span style={{ fontSize: 16 }}>🧠</span>
              <span>{ceo?.name || 'CEO Agent'}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(ceo?.status || 'active'), marginLeft: 'auto' }} />
            </div>
            <div className="org-node-role">Orchestrator · Goal Decomposition</div>
            <div className="org-node-metrics">
              <span className="metric">🎯 {ceo?.tickets || 5} tickets</span>
              <span className="metric">⚡ {(ceo?.tokens || 8920).toLocaleString()} tokens</span>
            </div>
            <div className="org-node-actions">
              <button style={{ background: 'var(--green-bg)', color: 'var(--green)' }} title="Pause">⏸</button>
              <button style={{ background: 'var(--red-bg)', color: 'var(--red)' }} title="Terminate">⏹</button>
            </div>
          </div>
        </div>

        {/* Connector line */}
        <div className="org-connector" />

        {/* Horizontal connector bar */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 20%' }}>
          <div className="org-connector-h" />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--bg-base)', flexShrink: 0 }} />
          <div className="org-connector-h" />
        </div>

        {/* CTO Node */}
        <div className="org-node">
          <div className="org-node-card cto">
            <NodeTooltip agent={cto || { name: 'CTO Agent', emoji: '⚙️', role: 'router', tokens: 5600, tickets: 8 }} />
            <div className="org-node-title">
              <span style={{ fontSize: 16 }}>⚙️</span>
              <span>{cto?.name || 'CTO Agent'}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(cto?.status || 'active'), marginLeft: 'auto' }} />
            </div>
            <div className="org-node-role">Task Router · Queue Manager</div>
            <div className="org-node-metrics">
              <span className="metric">📋 {cto?.tickets || 8} routing</span>
              <span className="metric">⚡ {(cto?.tokens || 5600).toLocaleString()} tokens</span>
            </div>
            <div className="org-node-actions">
              <button style={{ background: 'var(--green-bg)', color: 'var(--green)' }} title="Pause">⏸</button>
              <button style={{ background: 'var(--red-bg)', color: 'var(--red)' }} title="Terminate">⏹</button>
            </div>
          </div>
        </div>

        {/* Connector lines */}
        <div style={{ display: 'flex', width: '100%', position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="org-connector" />
            <div style={{ width: 2, height: 12, background: 'var(--border)' }} />
          </div>
        </div>

        {/* Worker Grid */}
        <div className="worker-grid">
          {workers.map((worker, idx) => (
            <div className="org-node" key={worker.id}>
              <div
                className="org-node-card worker"
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
              >
                {hovered === idx && <NodeTooltip agent={worker} />}
                <div className="org-node-title">
                  <span>{worker.emoji || '🤖'}</span>
                  <span style={{ fontSize: 12 }}>{worker.name}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(worker.status), marginLeft: 'auto' }} />
                </div>
                <div className="org-node-role">{worker.role === 'worker' ? 'Worker Agent' : worker.role}</div>
                <div className="org-node-metrics">
                  <span className="metric">🎫 {worker.tickets || 0}</span>
                  <span className="metric">⚡ {(worker.tokens || 0).toLocaleString()}</span>
                </div>
                <div className="org-node-actions">
                  <button style={{ background: 'var(--green-bg)', color: 'var(--green)' }} title="Pause">⏸</button>
                  <button style={{ background: 'var(--red-bg)', color: 'var(--red)' }} title="Terminate">⏹</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
