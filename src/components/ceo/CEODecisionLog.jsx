'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Filter, ChevronDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

function DecisionCard({ decision, expanded, onToggle }) {
  const statusIcon = {
    success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    fail: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    pending: { icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  }[decision.status] || { icon: TrendingUp, color: 'text-slate-400', bg: 'bg-slate-500/10' }

  const Icon = statusIcon.icon

  return (
    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--primary)]/20 transition-all">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-start justify-between hover:bg-[var(--card)]/30 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 text-left">
          <div className={`${statusIcon.bg} rounded-lg p-2 mt-0.5`}>
            <Icon size={14} className={statusIcon.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-[12px] font-semibold text-slate-200">{decision.action || 'Unknown Action'}</h4>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusIcon.bg} ${statusIcon.color}`}>
                {decision.status}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mb-1">{decision.timestamp || new Date().toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{decision.reasoning || 'CEO decision logged'}</p>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''} ml-2`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--card)]/40 px-4 py-3 space-y-3">
          {/* Reasoning */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Reasoning</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{decision.reasoning}</p>
          </div>

          {/* Action taken */}
          {decision.action_taken && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Action Taken</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{decision.action_taken}</p>
            </div>
          )}

          {/* Outcome */}
          {decision.outcome && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Outcome</div>
              <p className={`text-[11px] leading-relaxed ${
                decision.status === 'success' ? 'text-emerald-300'
                  : decision.status === 'fail' ? 'text-red-300'
                  : 'text-yellow-300'
              }`}>
                {decision.outcome}
              </p>
            </div>
          )}

          {/* Insight */}
          {decision.insight && (
            <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Learned</div>
              <p className="text-[11px] text-[var(--primary)]">{decision.insight}</p>
            </div>
          )}

          {/* Impact */}
          {decision.impact && (
            <div className="flex gap-2">
              <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg p-2">
                <div className="text-[9px] text-slate-500 uppercase mb-1">Impact</div>
                <div className="text-[12px] font-semibold text-slate-200">{decision.impact}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CEODecisionLog() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ceo/decisions?limit=50')
      if (response.ok) {
        const data = await response.json()
        setDecisions(Array.isArray(data.decisions) ? data.decisions : [])
      }
    } catch (error) {
      console.error('Failed to fetch decisions:', error)
      // Use mock data for demonstration
      setDecisions([
        {
          id: '1',
          action: 'Pause Agent Queue',
          reasoning: 'Ads runner error rate exceeded 15% threshold',
          action_taken: 'Paused ads-runner agent, queued 12 tasks for review',
          outcome: 'Prevented cascading failures, reduced error propagation',
          status: 'success',
          insight: 'Monitor error rates real-time, not just via aggregates',
          impact: '+2 client satisfaction',
          timestamp: new Date(Date.now() - 3600000).toLocaleString()
        },
        {
          id: '2',
          action: 'Scale Lead Capacity',
          reasoning: 'Pipeline at 87% capacity with strong demand',
          action_taken: 'Increased SBA pipeline worker capacity from 4 to 6',
          outcome: 'Lead processing time decreased 23%, maintained quality',
          status: 'success',
          insight: 'Dynamic scaling based on queue depth is more effective than static limits',
          impact: '+8 new leads/day',
          timestamp: new Date(Date.now() - 86400000).toLocaleString()
        },
        {
          id: '3',
          action: 'Reassign Client Support',
          reasoning: 'Client satisfaction score dropped to 78%',
          action_taken: 'Moved client to dedicated success agent, increased check-in frequency',
          outcome: 'Satisfaction recovered to 92% within 3 days',
          status: 'success',
          insight: 'Proactive engagement > reactive support',
          impact: '+1 retention',
          timestamp: new Date(Date.now() - 172800000).toLocaleString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDecisions()
    const interval = setInterval(fetchDecisions, 300000)
    return () => clearInterval(interval)
  }, [fetchDecisions])

  const actionTypes = useMemo(() => {
    const types = new Set(decisions.map(d => d.action?.split(' ')[0]).filter(Boolean))
    return Array.from(types)
  }, [decisions])

  const filteredDecisions = useMemo(() => {
    return decisions.filter(d => {
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter
      const matchesAction = actionFilter === 'all' || d.action?.includes(actionFilter)
      return matchesStatus && matchesAction
    })
  }, [decisions, statusFilter, actionFilter])

  const stats = useMemo(() => ({
    total: decisions.length,
    success: decisions.filter(d => d.status === 'success').length,
    fail: decisions.filter(d => d.status === 'fail').length,
    successRate: decisions.length > 0 ? Math.round((decisions.filter(d => d.status === 'success').length / decisions.length) * 100) : 0
  }), [decisions])

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Total Decisions</div>
          <div className="text-xl font-bold text-slate-200">{stats.total}</div>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Successful</div>
          <div className="text-xl font-bold text-emerald-400">{stats.success}</div>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Failed</div>
          <div className="text-xl font-bold text-red-400">{stats.fail}</div>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Success Rate</div>
          <div className="text-xl font-bold text-[var(--primary)]">{stats.successRate}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-500" />
          <span className="text-[11px] text-slate-500 font-semibold">Filter:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[11px] text-slate-200 outline-none hover:border-slate-600 focus:border-[var(--primary)]/40"
        >
          <option value="all">All Status</option>
          <option value="success">Success Only</option>
          <option value="fail">Failed Only</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[11px] text-slate-200 outline-none hover:border-slate-600 focus:border-[var(--primary)]/40"
        >
          <option value="all">All Actions</option>
          {actionTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredDecisions.length === 0 ? (
          <div className="text-center py-8 text-[12px] text-slate-500">
            {decisions.length === 0 ? 'No decisions logged yet' : 'No decisions match your filters'}
          </div>
        ) : (
          filteredDecisions.map(decision => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              expanded={expandedId === decision.id}
              onToggle={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
            />
          ))
        )}
      </div>

      {/* Info box */}
      <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg p-3 text-[10px] text-slate-400">
        <p className="mb-1">
          <span className="text-[var(--primary)] font-semibold">CEO Decision Log</span> tracks all strategic decisions made by the CEO agent
        </p>
        <p>Each decision includes reasoning, action taken, outcome, and insights learned for future decisions.</p>
      </div>
    </div>
  )
}
