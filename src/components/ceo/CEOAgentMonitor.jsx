'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pause, Eye, Terminal, AlertCircle, RefreshCw, Zap, CheckCircle2, Clock } from 'lucide-react'

function AgentCard({ agent, onAction, loading }) {
  const statusDot = {
    active: 'bg-emerald-400 animate-pulse',
    running: 'bg-emerald-400 animate-pulse',
    idle: 'bg-slate-500',
    warning: 'bg-yellow-400',
    error: 'bg-red-400'
  }[agent.status] || 'bg-slate-500'

  const statusBg = {
    active: 'bg-emerald-500/10 border-emerald-500/30',
    running: 'bg-emerald-500/10 border-emerald-500/30',
    idle: 'bg-slate-500/10 border-slate-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    error: 'bg-red-500/10 border-red-500/30'
  }[agent.status] || 'bg-slate-500/10 border-slate-500/30'

  const successRate = agent.tasks_completed > 0
    ? Math.round((agent.tasks_completed / (agent.tasks_completed + agent.tasks_failed)) * 100)
    : 0

  return (
    <div className={`bg-[var(--background)] border ${statusBg} rounded-lg p-4 transition-all hover:border-[var(--primary)]/20`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusDot}`} />
          <div>
            <h4 className="text-[12px] font-semibold text-slate-200">{agent.name || agent.id}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{agent.description || 'Agent'}</p>
          </div>
        </div>
        <span className={`text-[9px] font-semibold px-2 py-1 rounded-full border ${statusBg}`}>
          {agent.status || 'unknown'}
        </span>
      </div>

      {/* Queue and stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[var(--card)]/60 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-500 mb-0.5">Queue</div>
          <div className="text-lg font-bold text-slate-200">{agent.queue_size || 0}</div>
        </div>
        <div className="bg-[var(--card)]/60 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-500 mb-0.5">Success</div>
          <div className="text-lg font-bold text-emerald-400">{successRate}%</div>
        </div>
        <div className="bg-[var(--card)]/60 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-500 mb-0.5">Errors</div>
          <div className="text-lg font-bold text-red-400">{agent.error_count || 0}</div>
        </div>
      </div>

      {/* Performance bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-500">Performance</span>
          <span className="text-[10px] font-mono text-slate-400">{successRate}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--card)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              successRate >= 95 ? 'bg-emerald-400'
                : successRate >= 85 ? 'bg-yellow-400'
                : 'bg-red-400'
            }`}
            style={{ width: `${Math.min(100, successRate)}%` }}
          />
        </div>
      </div>

      {/* Last run info */}
      {agent.last_run && (
        <div className="bg-[var(--card)]/40 rounded-lg p-2 mb-3">
          <div className="flex items-center gap-2 text-[10px]">
            <Clock size={12} className="text-slate-500" />
            <span className="text-slate-500">Last run: {agent.last_run}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAction('pause', agent.id)}
          disabled={loading || agent.status === 'idle'}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] bg-[var(--card)] border border-[var(--border)] rounded-lg hover:border-slate-600 hover:text-slate-200 transition-all disabled:opacity-30"
        >
          <Pause size={12} />
          Pause
        </button>
        <button
          onClick={() => onAction('queue', agent.id)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] bg-[var(--card)] border border-[var(--border)] rounded-lg hover:border-slate-600 hover:text-slate-200 transition-all disabled:opacity-30"
        >
          <Eye size={12} />
          Queue
        </button>
        <button
          onClick={() => onAction('logs', agent.id)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] bg-[var(--card)] border border-[var(--border)] rounded-lg hover:border-slate-600 hover:text-slate-200 transition-all disabled:opacity-30"
        >
          <Terminal size={12} />
          Logs
        </button>
      </div>

      {/* Error indicator */}
      {agent.error_count > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          <AlertCircle size={12} />
          {agent.error_count} recent errors
        </div>
      )}
    </div>
  )
}

export default function CEOAgentMonitor({ onAgentSelect }) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        const agentList = Array.isArray(data.agents) ? data.agents : []

        // Enrich with queue data
        const enriched = await Promise.all(
          agentList.map(async (agent) => {
            try {
              const queueRes = await fetch(`/api/agents/${agent.id}/queue`)
              if (queueRes.ok) {
                const queueData = await queueRes.json()
                return { ...agent, queue_size: queueData.queue_size || 0 }
              }
            } catch (e) {
              console.error(`Failed to fetch queue for ${agent.id}:`, e)
            }
            return agent
          })
        )

        setAgents(enriched)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  const handleAction = useCallback(async (action, agentId) => {
    if (action === 'queue' || action === 'logs') {
      onAgentSelect?.(action, agentId)
      return
    }

    setActionInProgress(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        await fetchAgents()
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    } finally {
      setActionInProgress(false)
    }
  }, [fetchAgents, onAgentSelect])

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active' || a.status === 'running').length,
    idle: agents.filter(a => a.status === 'idle').length,
    errors: agents.filter(a => a.status === 'error').length,
    totalQueue: agents.reduce((sum, a) => sum + (a.queue_size || 0), 0)
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Agent Network</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {lastRefresh ? `Polling every 10s · Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={fetchAgents}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-slate-400 bg-[var(--card)] border border-[var(--border)] rounded-md hover:border-slate-600 transition-all disabled:opacity-30"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Active</div>
          <div className="text-lg font-bold text-emerald-400">{stats.active}</div>
        </div>
        <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Idle</div>
          <div className="text-lg font-bold text-slate-400">{stats.idle}</div>
        </div>
        <div className={`${stats.errors > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-500/10 border-slate-500/30'} rounded-lg p-2`}>
          <div className="text-[10px] text-slate-500 uppercase">Errors</div>
          <div className={`text-lg font-bold ${stats.errors > 0 ? 'text-red-400' : 'text-slate-400'}`}>{stats.errors}</div>
        </div>
        <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Queue</div>
          <div className="text-lg font-bold text-[var(--primary)]">{stats.totalQueue}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Total</div>
          <div className="text-lg font-bold text-blue-400">{stats.total}</div>
        </div>
      </div>

      {/* Agents grid */}
      <div className="grid grid-cols-1 gap-3">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-[12px] text-slate-500">
            {loading ? 'Loading agents...' : 'No agents found'}
          </div>
        ) : (
          agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onAction={handleAction}
              loading={actionInProgress}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="bg-[var(--card)]/40 border border-[var(--border)]/50 rounded-lg p-3 text-[10px] text-slate-500">
        <div className="font-semibold mb-2">Status Legend</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active · Executing tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Idle · Waiting for tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>Warning · High queue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Error · Failed tasks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
