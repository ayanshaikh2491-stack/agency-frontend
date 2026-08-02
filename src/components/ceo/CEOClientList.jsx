'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Plus, Pause, Archive, Zap, ChevronDown, X, AlertCircle, TrendingUp, Users, Calendar } from 'lucide-react'

function ClientRow({ client, onAction, loading }) {
  const [showActions, setShowActions] = useState(false)

  const statusColor = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    trial: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    archived: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  }[client.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--card)]/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold">
            {client.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-[12px] font-medium text-slate-200">{client.name || 'Unknown'}</div>
            <div className="text-[10px] text-slate-500">{client.email || '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border ${statusColor}`}>
          {client.status || 'unknown'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-[12px] font-mono text-slate-300">
          ₹{client.mrr?.toLocaleString() || '0'}/mo
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-[12px] font-medium text-slate-300">{client.project_count || 0} projects</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {client.issue_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertCircle size={12} />
              {client.issue_count} issues
            </span>
          )}
          {client.issue_count === 0 && (
            <span className="text-[10px] text-slate-500">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 hover:bg-[var(--card)] rounded transition-colors"
        >
          <ChevronDown size={14} className="text-slate-500" />
        </button>

        {showActions && (
          <div className="absolute right-0 top-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                onAction('pause', client.id)
                setShowActions(false)
              }}
              disabled={loading}
              className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-slate-300 hover:bg-[var(--card)] disabled:opacity-30 first:rounded-t-lg border-b border-[var(--border)]/50"
            >
              <Pause size={12} />
              Pause
            </button>
            <button
              onClick={() => {
                onAction('archive', client.id)
                setShowActions(false)
              }}
              disabled={loading}
              className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-slate-300 hover:bg-[var(--card)] disabled:opacity-30 border-b border-[var(--border)]/50"
            >
              <Archive size={12} />
              Archive
            </button>
            <button
              onClick={() => {
                onAction('assign-agent', client.id)
                setShowActions(false)
              }}
              disabled={loading}
              className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-slate-300 hover:bg-[var(--card)] disabled:opacity-30 last:rounded-b-lg"
            >
              <Zap size={12} />
              Assign Agent
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function CEOClientList({ onClientSelect }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(Array.isArray(data.clients) ? data.clients : [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
    const interval = setInterval(fetchClients, 60000)
    return () => clearInterval(interval)
  }, [fetchClients])

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = !searchTerm ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter])

  const handleAction = useCallback(async (action, clientId) => {
    setActionInProgress(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        await fetchClients()
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    } finally {
      setActionInProgress(false)
    }
  }, [fetchClients])

  const handleNewClient = () => {
    onClientSelect?.('create')
  }

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    trial: clients.filter(c => c.status === 'trial').length,
    totalRevenue: clients.reduce((sum, c) => sum + (c.mrr || 0), 0)
  }), [clients])

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Total Clients</div>
          <div className="text-xl font-bold text-slate-200">{stats.total}</div>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Active</div>
          <div className="text-xl font-bold text-emerald-400">{stats.active}</div>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">In Trial</div>
          <div className="text-xl font-bold text-blue-400">{stats.trial}</div>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Total MRR</div>
          <div className="text-lg font-bold text-slate-200">₹{(stats.totalRevenue / 100000).toFixed(1)}L</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[12px] text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--primary)]/40"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[12px] text-slate-200 outline-none focus:border-[var(--primary)]/40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>

        <button
          onClick={handleNewClient}
          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-[11px] font-medium hover:opacity-90 transition-all"
        >
          <Plus size={14} />
          New Client
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-slate-500">
            {clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--card)]/60 border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Projects</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Issues</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onAction={handleAction}
                  loading={actionInProgress}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="text-[10px] text-slate-500 text-center">
        Showing {filteredClients.length} of {clients.length} clients · Last updated {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
