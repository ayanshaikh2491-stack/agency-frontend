'use client'
import { useState, useEffect } from 'react'
import { normalizeList } from '@/lib/api-lists'

const AGENT_EMOJIS = {
  'content-creator': '✍️',
  'social-manager': '📱',
  'ads-runner': '📢',
  'seo-engine': '🔎',
  'analytics-bot': '📊',
}

const AGENT_LABELS = {
  'content-creator': 'Content Writing',
  'social-manager': 'Social Media',
  'ads-runner': 'Paid Ads',
  'seo-engine': 'SEO & AEO',
  'analytics-bot': 'Analytics & Reports',
}

export default function OrgChart({ agents: propAgents }) {
  const [agents, setAgents] = useState(propAgents || [])
  const [hovered, setHovered] = useState(null)
  const [loading, setLoading] = useState(!propAgents)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (propAgents) {
      setAgents(propAgents)
      setLoading(false)
      return
    }
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => {
        const list = normalizeList(d, 'agents')
        setAgents(list)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [propAgents])

  const statusColor = (s) => {
    switch ((s || '').toLowerCase()) {
      case 'online': case 'active': case 'running': return '#22c55e'
      case 'idle': case 'paused': return '#eab308'
      case 'error': case 'offline': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const ceo = { name: 'CEO Agent', slug: 'ceo', status: 'online', role: 'Orchestrator', tokens: 8920, tickets: 5 }
  const cto = { name: 'CTO Agent', slug: 'cto', status: 'online', role: 'Task Router', tokens: 5600, tickets: 8 }

  const workers = agents.map(a => ({
    id: a.id || a.slug,
    name: a.name,
    slug: a.slug || a.id,
    status: a.status || 'idle',
    role: AGENT_LABELS[a.id || a.slug] || 'Worker Agent',
    tokens: a.tokens_used || 0,
    tickets: a.active_tickets || 0,
    emoji: AGENT_EMOJIS[a.id || a.slug] || '🤖',
    skills: a.skills || [],
    description: a.description || '',
  }))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#6b7280' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #374151', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'orgSpin 0.8s linear infinite', marginRight: 12 }} />
      Loading org chart...
      <style>{`@keyframes orgSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#ef4444' }}>
      ⚠️ Failed to load agents: {error}
    </div>
  )

  return (
    <div className="org-chart-container" style={{ padding: '24px 0', overflow: 'auto' }}>
      <style>{`
        @keyframes orgFadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes orgPulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        .org-tree { display: flex; flex-direction: column; align-items: center; gap: 0; animation: orgFadeIn 0.5s ease-out }
        .org-node { display: flex; flex-direction: column; align-items: center; position: relative }
        .org-node-card {
          background: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 12px;
          padding: 14px 18px; min-width: 180px; position: relative;
          transition: all 0.2s ease; cursor: default;
        }
        .org-node-card:hover { border-color: #6366f1; box-shadow: 0 0 20px rgba(99,102,241,0.15); transform: translateY(-2px) }
        .org-node-card.ceo { background: linear-gradient(135deg, #1a1a2e 0%, #1e1a3a 100%); border-color: #6366f1; min-width: 200px }
        .org-node-card.cto { background: linear-gradient(135deg, #1a1a2e 0%, #1a2e1a 100%); border-color: #22c55e; min-width: 200px }
        .org-node-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #e5e7eb; margin-bottom: 4px }
        .org-node-role { font-size: 11px; color: #6b7280; margin-bottom: 6px }
        .org-node-metrics { display: flex; gap: 12px; font-size: 11px; color: #9ca3af }
        .org-node-metrics .metric { display: flex; align-items: center; gap: 3px }
        .org-node-actions { display: flex; gap: 6px; margin-top: 8px }
        .org-node-actions button {
          width: 26px; height: 26px; border-radius: 6px; border: none;
          cursor: pointer; font-size: 12px; transition: all 0.15s;
        }
        .org-node-actions button:hover { opacity: 0.8; transform: scale(1.1) }
        .org-connector { width: 2px; height: 24px; background: linear-gradient(to bottom, #374151, #4b5563) }
        .org-connector-h { flex: 1; height: 2px; background: linear-gradient(to right, transparent, #374151, #4b5563, #374151, transparent) }
        .org-hover-tooltip {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          background: #111; border: 1px solid #374151; border-radius: 8px;
          padding: 8px 12px; white-space: nowrap; z-index: 10;
          font-size: 11px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .worker-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px; width: 100%; padding: 0 16px; margin-top: 12px;
        }
        @media (max-width: 768px) {
          .worker-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 0 8px }
          .org-node-card { min-width: 140px; padding: 10px 12px }
        }
      `}</style>

      <div className="org-tree">
        {/* CEO */}
        <div className="org-node" style={{ animation: 'orgFadeIn 0.3s ease-out' }}>
          <div className="org-node-card ceo">
            <div className="org-node-title">
              <span style={{ fontSize: 18 }}>🧠</span>
              <span>{ceo.name}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(ceo.status), marginLeft: 'auto', animation: 'orgPulse 2s infinite' }} />
            </div>
            <div className="org-node-role">{ceo.role} · Goal Decomposition</div>
            <div className="org-node-metrics">
              <span className="metric">🎯 {ceo.tickets} tickets</span>
              <span className="metric">⚡ {(ceo.tokens).toLocaleString()} tokens</span>
            </div>
            <div className="org-node-actions">
              <button style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }} title="Pause">⏸</button>
              <button style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} title="Terminate">⏹</button>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="org-connector" />

        {/* Horizontal bar */}
        <div style={{ display: 'flex', alignItems: 'center', width: '80%', maxWidth: 400 }}>
          <div className="org-connector-h" />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', border: '2px solid #111', flexShrink: 0 }} />
          <div className="org-connector-h" />
        </div>

        {/* CTO */}
        <div className="org-node" style={{ animation: 'orgFadeIn 0.4s ease-out' }}>
          <div className="org-node-card cto">
            <div className="org-node-title">
              <span style={{ fontSize: 18 }}>⚙️</span>
              <span>{cto.name}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(cto.status), marginLeft: 'auto' }} />
            </div>
            <div className="org-node-role">{cto.role} · Queue Manager</div>
            <div className="org-node-metrics">
              <span className="metric">📋 {cto.tickets} routing</span>
              <span className="metric">⚡ {(cto.tokens).toLocaleString()} tokens</span>
            </div>
            <div className="org-node-actions">
              <button style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }} title="Pause">⏸</button>
              <button style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} title="Terminate">⏹</button>
            </div>
          </div>
        </div>

        {/* Connector to workers */}
        <div style={{ width: 2, height: 20, background: 'linear-gradient(to bottom, #4b5563, #374151)' }} />

        {/* Worker count badge */}
        <div style={{ margin: '8px 0', fontSize: 11, color: '#6b7280', background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 20, padding: '4px 14px' }}>
          {workers.length} Worker Agents
        </div>

        {/* Workers */}
        <div className="worker-grid">
          {workers.map((worker, idx) => (
            <div
              className="org-node"
              key={worker.id}
              style={{ animation: `orgFadeIn ${0.3 + idx * 0.05}s ease-out` }}
            >
              <div
                className="org-node-card worker"
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                style={{ position: 'relative' }}
              >
                {hovered === idx && (
                  <div className="org-hover-tooltip">
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#e5e7eb' }}>
                      {worker.emoji} {worker.name}
                    </div>
                    {worker.description && (
                      <div style={{ maxWidth: 220, whiteSpace: 'normal', color: '#9ca3af', marginBottom: 4, fontSize: 10 }}>
                        {worker.description.slice(0, 100)}
                      </div>
                    )}
                    <div>Tokens: <span style={{ color: '#22c55e' }}>{worker.tokens?.toLocaleString() || 0}</span></div>
                    <div>Tickets: <span style={{ color: '#6366f1' }}>{worker.tickets || 0}</span></div>
                    {worker.skills?.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 2 }}>Skills:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {worker.skills.slice(0, 4).map(s => (
                            <span key={s} style={{ background: '#374151', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: '#9ca3af' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="org-node-title">
                  <span>{worker.emoji}</span>
                  <span style={{ fontSize: 12 }}>{worker.name}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(worker.status), marginLeft: 'auto', boxShadow: `0 0 6px ${statusColor(worker.status)}40` }} />
                </div>
                <div className="org-node-role">{worker.role}</div>
                <div className="org-node-metrics">
                  <span className="metric">🎫 {worker.tickets || 0}</span>
                  <span className="metric">⚡ {(worker.tokens || 0).toLocaleString()}</span>
                </div>
                <div className="org-node-actions">
                  <button style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }} title="Pause">⏸</button>
                  <button style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} title="Terminate">⏹</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
