'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Users, TrendingUp, Activity, Zap, Check, AlertCircle } from 'lucide-react'

function KPICard({ icon: Icon, label, value, change, status, onClick, loading }) {
  const statusColor = {
    good: 'text-emerald-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  }[status] || 'text-slate-400'

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-left flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-3.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon size={16} className="text-slate-500 group-hover:text-slate-400 transition" />
        <span className={`text-[10px] font-medium ${statusColor}`}>
          {change}
        </span>
      </div>
      <div className="text-xl font-bold text-slate-200 mb-0.5">{loading ? '...' : value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </button>
  )
}

export default function CEODashboardKPIs({ onKPIClick }) {
  const [kpis, setKpis] = useState({
    activeClients: 0,
    mrr: 0,
    taskQueue: 0,
    agentsOnline: 0,
    uptime: '—',
    satisfaction: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchKPIs = useCallback(async () => {
    try {
      setRefreshing(true)
      const [clientRes, agentRes, healthRes] = await Promise.all([
        fetch('http://localhost:8000/api/clients'),
        fetch('http://localhost:8000/api/agents'),
        fetch('http://localhost:8000/api/monitor/health').catch(() => null)
      ])

      const clients = clientRes.ok ? await clientRes.json() : { clients: [] }
      const agents = agentRes.ok ? await agentRes.json() : { agents: [] }
      const health = healthRes?.ok ? await healthRes.json() : {}

      const activeCount = clients.clients?.filter(c => c.status === 'active')?.length || 0
      const totalMRR = (clients.clients || []).reduce((sum, c) => sum + (c.mrr || 0), 0)
      const agentOnlineCount = agents.agents?.filter(a => a.status === 'running' || a.status === 'active')?.length || 0
      const totalQueue = agents.agents?.reduce((sum, a) => sum + (a.queue_size || 0), 0) || 0
      const uptime = health.uptime_hours ? `${Math.floor(health.uptime_hours)}h` : '—'
      const satisfaction = health.satisfaction_score || 95

      setKpis({
        activeClients: activeCount,
        mrr: totalMRR,
        taskQueue: totalQueue,
        agentsOnline: agentOnlineCount,
        uptime,
        satisfaction
      })
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch KPIs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchKPIs()
    const interval = setInterval(fetchKPIs, 30000)
    return () => clearInterval(interval)
  }, [fetchKPIs])

  const handleRefresh = () => {
    setLoading(true)
    fetchKPIs()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Real-time KPIs</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-slate-400 bg-[var(--card)] border border-[var(--border)] rounded-md hover:border-slate-600 hover:text-slate-200 transition-all disabled:opacity-30"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          icon={Users}
          label="Active Clients"
          value={kpis.activeClients}
          change={kpis.activeClients > 0 ? `+${kpis.activeClients}` : '0'}
          status={kpis.activeClients > 5 ? 'good' : 'warning'}
          loading={loading}
          onClick={() => onKPIClick?.('clients')}
        />

        <KPICard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={`₹${(kpis.mrr / 100000).toFixed(1)}L`}
          change={kpis.mrr > 0 ? `+₹${kpis.mrr}` : '—'}
          status={kpis.mrr > 300000 ? 'good' : 'warning'}
          loading={loading}
          onClick={() => onKPIClick?.('revenue')}
        />

        <KPICard
          icon={Activity}
          label="Task Queue"
          value={kpis.taskQueue}
          change={kpis.taskQueue < 20 ? 'Normal' : 'High'}
          status={kpis.taskQueue < 50 ? 'good' : kpis.taskQueue < 100 ? 'warning' : 'critical'}
          loading={loading}
          onClick={() => onKPIClick?.('queue')}
        />

        <KPICard
          icon={Zap}
          label="Agents Online"
          value={`${kpis.agentsOnline}/9`}
          change={kpis.agentsOnline === 9 ? 'Full' : 'Partial'}
          status={kpis.agentsOnline >= 8 ? 'good' : kpis.agentsOnline >= 6 ? 'warning' : 'critical'}
          loading={loading}
          onClick={() => onKPIClick?.('agents')}
        />

        <KPICard
          icon={Check}
          label="System Uptime"
          value={kpis.uptime}
          change="99.9%"
          status="good"
          loading={loading}
          onClick={() => onKPIClick?.('health')}
        />

        <KPICard
          icon={AlertCircle}
          label="Satisfaction"
          value={`${kpis.satisfaction}%`}
          change={kpis.satisfaction >= 95 ? 'Excellent' : 'Good'}
          status={kpis.satisfaction >= 90 ? 'good' : 'warning'}
          loading={loading}
          onClick={() => onKPIClick?.('satisfaction')}
        />
      </div>

      {/* Health summary */}
      <div className="bg-[var(--card)]/60 border border-[var(--border)] rounded-lg p-3">
        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2">System Health</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Backend</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-mono">Running</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Agent Loop</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-mono">Active</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Database</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-mono">Connected</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
