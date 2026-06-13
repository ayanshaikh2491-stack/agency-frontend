'use client'
import { useState } from 'react'

const WORKFLOWS = [
  { id: 'speed-to-lead', name: 'Speed to Lead', desc: 'Instant lead response via SMS + email + LinkedIn', emoji: '⚡' },
  { id: 'intake-research', name: 'Intake Research', desc: 'Client intake → VOC analysis → ICP → positioning', emoji: '🔍' },
  { id: 'content-pipeline', name: 'Content Pipeline', desc: 'Blog → social → ad copy → email sequence', emoji: '✍️' },
  { id: 'nurture-pipeline', name: 'Nurture Pipeline', desc: 'Lead nurturing: emails, retargeting, follow-ups', emoji: '🌱' },
  { id: 'seo-optimize', name: 'SEO Optimization', desc: 'Keyword research → on-page → content optimization', emoji: '📈' },
  { id: 'analytics-report', name: 'Analytics Report', desc: 'Weekly/Monthly analytics & performance reports', emoji: '📊' },
  { id: 'client-onboard', name: 'Client Onboarding', desc: 'Welcome sequence → kickoff call → setup', emoji: '🤝' },
  { id: 'quality-review', name: 'Quality Review', desc: 'Content QC, compliance check, brand alignment', emoji: '✓' },
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
        <h2>⟳ Workflows</h2>
        <div className="topbar-actions">
          <span style={{fontSize:12,color:'var(--text-muted)'}}>{WORKFLOWS.length} workflows</span>
        </div>
      </div>
      <div className="page-content">
        <div className="workflow-grid">
          {WORKFLOWS.map(wf => (
            <div key={wf.id} className="wf-card">
              <div style={{fontSize:24,marginBottom:6}}>{wf.emoji}</div>
              <div style={{fontWeight:500,fontSize:13,marginBottom:4}}>{wf.name}</div>
              <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:12,lineHeight:1.4}}>{wf.desc}</div>
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',fontSize:12}}
                onClick={() => trigger(wf)} disabled={running === wf.id}>
                {running === wf.id ? <><div className="spinner" style={{width:12,height:12}} /> Running...</> : 'Trigger →'}
              </button>
            </div>
          ))}
        </div>

        {logs.length > 0 && (
          <div className="card" style={{marginTop:16}}>
            <div className="card-title" style={{marginBottom:12}}>Run Log</div>
            <div className="activity-feed">
              {logs.map((l, i) => (
                <div key={i} className="activity-item">
                  <div className="ai-icon">{l.status === 'done' ? '✓' : l.status === 'error' ? '✗' : '⟳'}</div>
                  <div className="ai-text">
                    <strong>{l.name}</strong>
                    {l.status === 'done' ? ' completed' : l.status === 'error' ? ' failed' : ' running...'}
                  </div>
                  <div className="ai-time">{l.ts.toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
