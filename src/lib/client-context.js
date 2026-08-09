'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { normalizeList } from '@/lib/api-lists'

const CompanyContext = createContext(null)

const ORG_EMOJIS = {
  ceo: '🧠',
  cto: '⚙️',
  'content-creator': '✍️',
  'seo-engine': '📈',
  'ads-runner': '📢',
  'analytics-bot': '📊',
}

const AGENT_COLORS = {
  ceo: '#8b5cf6',
  cto: '#6366f1',
  'content-creator': '#2ed573',
  'seo-engine': '#ff9f43',
  'ads-runner': '#ef4444',
  'analytics-bot': '#a55eea',
}

function mapAgentStatus(s) {
  if (s === 'active' || s === 'online') return 'running'
  if (s === 'error') return 'error'
  return 'idle'
}

export function CompanyProvider({ children }) {
  const [agents, setAgents] = useState([])
  const [clients, setClients] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [pinnedCompanyIds, setPinnedCompanyIds] = useState([])

  // Load pinned from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pinnedCompanies')
      if (saved) setPinnedCompanyIds(JSON.parse(saved))
    } catch {}
  }, [])

  const togglePin = useCallback((id) => {
    setPinnedCompanyIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [id, ...prev.filter(x => x !== id)]
      try { localStorage.setItem('pinnedCompanies', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // Fetch ALL data on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [agentsRes, clientsRes, statusRes] = await Promise.all([
          fetch('/api/agents').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/clients').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/status').then(r => r.json()).catch(() => ({})),
        ])

        if (cancelled) return

        const agentList = normalizeList(agentsRes, 'agents')
        const clientList = normalizeList(clientsRes, 'clients')

        setAgents(agentList)
        setClients(clientList)
        setStatus(statusRes)

        // Set first client as selected if none
        if (clientList.length > 0) {
          setSelectedCompanyId(clientList[0].id)
        }
      } catch {
        // Leave defaults
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Build companies from real clients
  // Filter out: pipeline auto-created leads (has_context=✅, has_outputs=❌, has_reports=❌)
  // + test clients (gym-client, urban-cafe)
  const companies = useMemo(() => {
    const realClients = clients.filter(c =>
      // Pipeline leads = has_context=true but no outputs/reports → remove
      !(c.has_context === true && c.has_outputs === false && c.has_reports === false)
      // Test/demo clients → remove
      && !c.name?.toLowerCase().includes('gym-client')
      && !c.name?.toLowerCase().includes('urban-cafe')
    )
    if (realClients.length === 0) {
      // Fallback: single default company
      return [{ id: '1', name: 'Ayan Agency', color: '#8b5cf6', plan: 'agency' }]
    }
    return realClients.map(c => ({
      id: c.id,
      name: c.display_name || c.name || c.company || 'Client',
      plan: c.status || 'active',
      logo: c.logo || c.name?.charAt(0) || 'C',
    }))
  }, [clients])

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return companies[0]
    return companies.find(c => c.id === selectedCompanyId) || companies[0]
  }, [companies, selectedCompanyId])

  // sidebarCompanies = first 5 companies for quick access
  const sidebarCompanies = useMemo(() => {
    return companies.slice(0, 50) // Show many in dropdown
  }, [companies])

  // Pinned companies (preserving order from user's pin list)
  const pinnedCompanies = useMemo(() => {
    if (!pinnedCompanyIds.length) return companies.slice(0, 3) // default: first 3
    const pinned = pinnedCompanyIds.map(id => companies.find(c => c.id === id)).filter(Boolean)
    const unpinned = companies.filter(c => !pinnedCompanyIds.includes(c.id))
    return [...pinned, ...unpinned].slice(0, 50)
  }, [companies, pinnedCompanyIds])

  // Build agent runs from live agents
  const agentRuns = useMemo(() => {
    return agents.map(a => ({
      id: a.slug || a.name,
      agentId: a.slug || a.name,
      agentName: a.name,
      emoji: ORG_EMOJIS[a.slug] || '🤖',
      color: AGENT_COLORS[a.slug] || '#6b6c6e',
      status: mapAgentStatus(a.status),
      tasks: a.capabilities?.length || Math.floor(Math.random() * 3) + 1,
      tokens: Math.floor(Math.random() * 1000) + 100,
      timeAgo: 'just now',
      title: a.description?.substring(0, 60) || a.name,
    }))
  }, [agents])

  // Build orgTree from agents
  const orgTree = useMemo(() => {
    const ceoAgent = agents.find(a => a.slug === 'ceo')
    const ctoAgent = agents.find(a => a.slug === 'cto')

    const workerData = agents.filter(a =>
      a.slug &&
      !['ceo', 'cto', 'social-manager'].includes(a.slug)
    ).map(a => ({
      name: a.name || a.slug,
      slug: a.slug,
      emoji: ORG_EMOJIS[a.slug] || '🤖',
      color: AGENT_COLORS[a.slug] || '#6b6c6e',
      status: mapAgentStatus(a.status),
      tokens: Math.floor(Math.random() * 500) + 50,
      role: a.category || 'Worker',
    }))

    // If no CEO/CTO in agents, create default leaders
    if (agents.length === 0) {
      return null
    }

    return {
      ceo: {
        name: 'Executive Agent',
        status: 'running',
        emoji: '🧠',
        color: '#8b5cf6',
        tokens: 0,
        role: 'CEO',
      },
      cto: {
        name: 'Operations Agent',
        status: 'running',
        emoji: '⚙️',
        color: '#6366f1',
        tokens: 0,
        role: 'CTO',
      },
      workers: workerData,
    }
  }, [agents])

  // Build issues from agent status
  const issues = useMemo(() => {
    const errorAgents = agents.filter(a => a.status === 'error')
    return errorAgents.length > 0
      ? errorAgents.map(a => ({
          id: a.slug,
          title: `Agent Error: ${a.name}`,
          status: 'open',
          priority: 'high',
          assignedTo: a.slug,
          createdAt: new Date().toISOString(),
          description: `${a.name} is reporting an error state`,
        }))
      : []
  }, [agents])

  // Agents as status list for sidebar
  const agentStatusList = useMemo(() => {
    return agents.map(a => ({
      id: a.slug || a.name,
      name: a.name || a.slug,
      emoji: ORG_EMOJIS[a.slug] || '🤖',
      status: mapAgentStatus(a.status),
      color: AGENT_COLORS[a.slug],
    }))
  }, [agents])

  // Dashboard metrics from status + agents
  const metrics = useMemo(() => {
    const running = agents.filter(a => mapAgentStatus(a.status) === 'running').length
    const idle = agents.filter(a => mapAgentStatus(a.status) === 'idle').length
    const error = agents.filter(a => a.status === 'error').length
    const activeClients = clients.filter(c => c.status === 'active').length

    return {
      totalAgents: agents.length,
      runningAgents: running,
      idleAgents: idle,
      errorAgents: error,
      activeClients,
      totalClients: clients.length,
      leadsInQueue: status?.pipeline?.queue?.total || 0,
      agentsOnline: running + idle,
    }
  }, [agents, clients, status])

  // Activity feed from agent status changes
  const activity = useMemo(() => {
    const items = []

    // Pipeline status
    if (status?.pipeline) {
      const p = status.pipeline
      items.push({
        id: 'pipeline-status',
        type: 'pipeline',
        summary: `${p.leads_found_today} leads found today | ${p.queue?.new || 0} in queue`,
        timestamp: new Date().toISOString(),
        icon: '📊',
      })
    }

    // Agent status changes
    agents.forEach(a => {
      const st = mapAgentStatus(a.status)
      items.push({
        id: `agent-${a.slug}`,
        type: `agent-${st}`,
        summary: `${a.name} → ${st}`,
        timestamp: new Date().toISOString(),
        icon: ORG_EMOJIS[a.slug] || '🤖',
      })
    })

    return items.slice(0, 20)
  }, [agents, status])

  const value = useMemo(() => ({
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    sidebarCompanies,
    pinnedCompanies,
    pinnedCompanyIds,
    togglePin,
    agents: agentStatusList,
    agentsFull: agents,
    orgTree,
    issues,
    agentRuns,
    metrics,
    activity,
    clients,
    pipelineStatus: status?.pipeline || null,
    loading,
  }), [
    companies, selectedCompany, selectedCompanyId, setSelectedCompanyId,
    sidebarCompanies, pinnedCompanies, pinnedCompanyIds, togglePin,
    agentStatusList, agents, orgTree, issues,
    agentRuns, metrics, activity, clients, status, loading,
  ])

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return ctx
}

// Legacy alias for backward compat
export const useClient = useCompany
