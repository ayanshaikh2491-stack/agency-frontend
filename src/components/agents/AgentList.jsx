'use client'

const ORCHESTRATORS = {
  ceo: { name: 'CEO Agent', emoji: '👑', color: '#8b5cf6', desc: 'Orchestrator — deploys all agents' },
}

const BACKEND_AGENTS = [
  { id: 'intake-researcher', name: 'Intake Researcher', emoji: '🔍', color: 'var(--primary)', desc: 'Finds & qualifies leads' },
  { id: 'content-creator',    name: 'Content Creator',    emoji: '✍️', color: 'var(--success)', desc: 'Creates blog posts & content' },
  { id: 'seo-engine',         name: 'SEO Engine',         emoji: '📈', color: 'var(--warning)', desc: 'Optimizes rankings & keywords' },
  { id: 'ads-runner',         name: 'Ads Runner',         emoji: '📢', color: 'var(--error)', desc: 'Runs Facebook/Google campaigns' },
  { id: 'analytics-bot',      name: 'Analytics Bot',      emoji: '📊', color: 'var(--primary)', desc: 'Reports & data analysis' },
  { id: 'sales-closer',       name: 'Sales Closer',       emoji: '💼', color: 'var(--primary)', desc: 'Converts leads to clients' },
  { id: 'client-success',     name: 'Client Success',     emoji: '🤝', color: 'var(--success)', desc: 'Manages client relationships' },
  { id: 'review-qc',          name: 'Review & QC',        emoji: '✓',  color: 'var(--warning)', desc: 'Quality checks deliverables' },
]

export { ORCHESTRATORS, BACKEND_AGENTS }

export default function AgentList({ selected, onSelect }) {
  return (
    <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', marginBottom: 4 }}>
        👑 Orchestrators
      </div>
      {['ceo'].map(id => {
        const o = ORCHESTRATORS[id]
        const active = selected?.id === id
        return (
          <div key={id} onClick={() => onSelect({ id, name: o.name })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: active ? 'var(--bg-hover)' : 'transparent',
              border: active ? '1px solid var(--accent)' : '1px solid transparent',
              transition: 'all 0.12s',
            }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, background: o.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>
              {o.emoji}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{o.name}</div>
              <div style={{ fontSize: 10, color: 'var(--accent)' }}>{o.desc}</div>
            </div>
          </div>
        )
      })}

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', marginTop: 12, marginBottom: 4 }}>
        ⚡ Workers
      </div>
      {BACKEND_AGENTS.map(a => {
        const active = selected?.id === a.id
        return (
          <div key={a.id} onClick={() => onSelect(a)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: active ? 'var(--bg-hover)' : 'transparent',
              border: active ? '1px solid var(--border)' : '1px solid transparent',
              fontSize: 12, transition: 'all 0.12s',
            }}>
            <span style={{ fontSize: 14 }}>{a.emoji}</span>
            <span>{a.name}</span>
          </div>
        )
      })}
    </div>
  )
}
