'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const SAMPLE_LOGS = [
  { ts: 0, type: 'info', msg: '[AGENT-HEARTBEAT] CEO agent waking up...' },
  { ts: 1, type: 'info', msg: '[AGENT-HEARTBEAT] Checking out client_id: 1...' },
  { ts: 2, type: 'info', msg: '[TOOL-CALL] Fetching goal queue for active client...' },
  { ts: 3, type: 'highlight', msg: '[CEO] Analyzing goal: "Launch lead gen campaign for Miami real estate"' },
  { ts: 4, type: 'info', msg: '[CEO] Breaking goal into structured tickets...' },
  { ts: 5, type: 'warn', msg: '[BUDGET] Token budget estimate: 4,230 / 10,000 tokens' },
  { ts: 6, type: 'info', msg: '[CEO] Ticket #101 created: "Research Miami real estate market"' },
  { ts: 7, type: 'info', msg: '[CEO] Ticket #102 created: "Draft ad creative copy"' },
  { ts: 8, type: 'info', msg: '[CTO] Evaluating pending tickets...' },
  { ts: 9, type: 'info', msg: '[CTO] Assigning Ticket #101 -> Intake Researcher worker' },
  { ts: 10, type: 'info', msg: '[CTO] Assigning Ticket #102 -> Content Creator worker' },
  { ts: 11, type: 'highlight', msg: '[WORKER] Intake Researcher checked out Ticket #101' },
  { ts: 12, type: 'info', msg: '[TOOL-CALL] Executing bash: python3 research.py --query="Miami real estate leads"' },
  { ts: 13, type: 'info', msg: '[TOOL-CALL] HTTP GET https://api.example.com/listings?location=miami' },
  { ts: 14, type: 'warn', msg: '[TOOL-CALL] Rate limit hit, retrying in 5s...' },
  { ts: 15, type: 'info', msg: '[TOOL-CALL] Query returned 247 results' },
  { ts: 16, type: 'info', msg: '[WRITER] Content Creator: Generating ad variants...' },
  { ts: 17, type: 'info', msg: '[TOOL-CALL] Executing bash: pnpm build --filter=ads-module' },
  { ts: 18, type: 'error', msg: '[ERROR] Build failed: Missing dependency @types/react' },
  { ts: 19, type: 'info', msg: '[RECOVERY] Installing @types/react...' },
  { ts: 20, type: 'info', msg: '[WORKER] Intake Researcher completed Ticket #101' },
  { ts: 21, type: 'highlight', msg: '[RESULT] Ticket #101: No results yet, avg price $425K' },
  { ts: 22, type: 'info', msg: '[HEARTBEAT] Cycle completed. Sleeping 30s...' },
]

export default function Terminal({ logs: externalLogs, height = 200 }) {
  const [collapsed, setCollapsed] = useState(false)
  const [logs, setLogs] = useState(SAMPLE_LOGS)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (externalLogs && externalLogs.length > 0) setLogs(externalLogs)
  }, [externalLogs])

  // Auto-append new log entries every 3s for live demo
  useEffect(() => {
    let i = SAMPLE_LOGS.length
    const interval = setInterval(() => {
      if (!externalLogs || externalLogs.length === 0) {
        setLogs(prev => [...prev, {
          ts: Date.now(),
          type: ['info','info','highlight','warn','info'][i % 5],
          msg: `[HEARTBEAT] Agent cycle ${i-22}... checking ticket queue...`
        }])
        i++
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [externalLogs])

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [logs])

  const formatTime = (ts) => {
    if (typeof ts === 'number' && ts < 100) return `+${ts}s`
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false })
  }

  return (
    <div className="terminal" style={{ height: collapsed ? 36 : height }}>
      <div className="terminal-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="terminal-header-left">
          <div className="terminal-dot live" />
          <span className="terminal-title">Execution Terminal</span>
          {!collapsed && <span className="terminal-title" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— {logs.length} events</span>}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
          {collapsed ? '▸ expand' : '▾ collapse'}
        </span>
      </div>
      {!collapsed && (
        <div className="terminal-body" ref={bodyRef}>
          {logs.map((log, i) => (
            <div key={`${log.ts}-${i}`} className="terminal-line">
              <span className="ts">[{formatTime(log.ts)}]</span>{' '}
              <span className={log.type}>{log.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
