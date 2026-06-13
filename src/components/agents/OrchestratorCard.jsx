'use client'

export default function OrchestratorCard({ title, emoji, children, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: (color || '#8b5cf6') + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        {emoji || '⚡'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 4 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}
