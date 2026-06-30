/**
 * CEO API Layer — TAGS Agency Dashboard
 * Centralized API calls for CEO Command Center
 * ================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'
const EC2_BACKEND = 'http://18.213.66.136:8000'

/* ─────────────────────────────────────────────────
   Error Handling & Response Validation
   ───────────────────────────────────────────────── */

function handleError(error, endpoint) {
  console.error(`[CEO API] Error calling ${endpoint}:`, error)
  return {
    success: false,
    data: null,
    error: error?.message || 'Unknown error',
    cached: false,
  }
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: data?.message || data?.error || `HTTP ${response.status}`,
        status: response.status,
      }
    }

    return {
      success: true,
      data: data.data || data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return handleError(error, endpoint)
  }
}

/* ─────────────────────────────────────────────────
   Metrics & Monitoring
   ───────────────────────────────────────────────── */

/**
 * Fetch agency metrics snapshot
 * GET /api/dashboard/clients + /api/dashboard/agents
 */
export async function fetchMetrics() {
  try {
    const [clientsRes, agentsRes] = await Promise.all([
      fetchAPI('/api/dashboard/clients'),
      fetchAPI('/api/dashboard/agents'),
    ])

    if (!clientsRes.success || !agentsRes.success) {
      return {
        success: false,
        data: null,
        error: 'Failed to fetch metrics',
      }
    }

    const clients = clientsRes.data || []
    const agents = agentsRes.data || []

    return {
      success: true,
      data: {
        clients: clients.length || 0,
        projects: clients.reduce((sum, c) => sum + (c.projects?.length || 0), 0),
        totalTasks: clients.reduce((sum, c) => sum + (c.tasks?.length || 0), 0),
        agentCount: agents.length || 0,
        agents: agents,
        timestamp: new Date().toISOString(),
      },
      error: null,
    }
  } catch (error) {
    return handleError(error, '/api/dashboard/metrics')
  }
}

/**
 * Fetch all clients with details
 * GET /api/dashboard/clients
 */
export async function fetchClients() {
  return fetchAPI('/api/dashboard/clients')
}

/**
 * Fetch all agents with status
 * GET /api/dashboard/agents
 */
export async function fetchAgents() {
  return fetchAPI('/api/dashboard/agents')
}

/**
 * Fetch agency CEO status
 * GET /api/ceo/status
 */
export async function fetchCEOStatus() {
  return fetchAPI('/api/ceo/status')
}

/* ─────────────────────────────────────────────────
   Decisions & Command Log
   ───────────────────────────────────────────────── */

/**
 * Fetch decision log (from memory or database)
 * GET /api/ceo/decisions?limit=10
 */
export async function fetchDecisions(limit = 10) {
  return fetchAPI(`/api/ceo/decisions?limit=${limit}`)
}

/**
 * Propose a new decision (CEO autonomous decision)
 * POST /api/ceo/decision/propose
 */
export async function createDecision(data) {
  return fetchAPI('/api/ceo/decision/propose', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Send CEO command
 * POST /api/ceo/command
 */
export async function sendCEOCommand(message) {
  return fetchAPI('/api/ceo/command', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

/**
 * CEO chat (conversational) - Direct EC2 call for fast response
 * POST /api/ceo/chat-hermes
 */
export async function sendCEOChat(message, sessionId = 'web') {
  try {
    const url = `${EC2_BACKEND}/api/ceo/chat-hermes`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
    })
    const data = await response.json()
    return {
      success: true,
      data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Chat failed',
      status: 500,
    }
  }
}

/* ─────────────────────────────────────────────────
   Client Management
   ───────────────────────────────────────────────── */

/**
 * Update client status
 * POST /api/clients/{id}/update or similar
 */
export async function updateClientStatus(clientId, status) {
  return fetchAPI(`/api/clients/${clientId}`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

/**
 * Pause a client
 * POST /api/clients/{id}/pause
 */
export async function pauseClient(clientId) {
  return fetchAPI(`/api/clients/${clientId}/pause`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/**
 * Resume a client
 * POST /api/clients/{id}/resume
 */
export async function resumeClient(clientId) {
  return fetchAPI(`/api/clients/${clientId}/resume`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/* ─────────────────────────────────────────────────
   Agent Management & Tasks
   ───────────────────────────────────────────────── */

/**
 * Assign task to an agent
 * POST /api/ceo/task/assign
 */
export async function assignTask(data) {
  return fetchAPI('/api/ceo/task/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Get agent details
 * GET /api/agents/{agentId}
 */
export async function fetchAgentDetails(agentId) {
  return fetchAPI(`/api/agents/${agentId}`)
}

/**
 * Get agent tasks
 * GET /api/agents/{agentId}/tasks
 */
export async function fetchAgentTasks(agentId) {
  return fetchAPI(`/api/agents/${agentId}/tasks`)
}

/* ─────────────────────────────────────────────────
   Real-Time Updates & Polling
   ───────────────────────────────────────────────── */

/**
 * Setup polling interval for metrics
 * Returns cleanup function
 */
export function setupMetricsPolling(onUpdate, intervalMs = 60000) {
  const interval = setInterval(async () => {
    const result = await fetchMetrics()
    if (result.success) {
      onUpdate(result.data)
    }
  }, intervalMs)

  return () => clearInterval(interval)
}

/**
 * Setup polling for agents (faster interval)
 */
export function setupAgentsPolling(onUpdate, intervalMs = 10000) {
  const interval = setInterval(async () => {
    const result = await fetchAgents()
    if (result.success) {
      onUpdate(result.data)
    }
  }, intervalMs)

  return () => clearInterval(interval)
}

/**
 * Setup polling for CEO status
 */
export function setupCEOStatusPolling(onUpdate, intervalMs = 30000) {
  const interval = setInterval(async () => {
    const result = await fetchCEOStatus()
    if (result.success) {
      onUpdate(result.data)
    }
  }, intervalMs)

  return () => clearInterval(interval)
}

/* ─────────────────────────────────────────────────
   Batch Operations
   ───────────────────────────────────────────────── */

/**
 * Fetch all critical data in parallel
 * Used for initial page load
 */
export async function fetchAllDashboardData() {
  const results = await Promise.allSettled([
    fetchMetrics(),
    fetchClients(),
    fetchAgents(),
    fetchCEOStatus(),
    fetchDecisions(10),
  ])

  return {
    metrics: results[0].status === 'fulfilled' ? results[0].value : null,
    clients: results[1].status === 'fulfilled' ? results[1].value : null,
    agents: results[2].status === 'fulfilled' ? results[2].value : null,
    ceoStatus: results[3].status === 'fulfilled' ? results[3].value : null,
    decisions: results[4].status === 'fulfilled' ? results[4].value : null,
    loadedAt: new Date().toISOString(),
  }
}

/* ─────────────────────────────────────────────────
   Caching Layer (Optional — for local performance)
   ───────────────────────────────────────────────── */

const _cache = {
  metrics: null,
  clients: null,
  agents: null,
  decisions: null,
  ceoStatus: null,
  timestamps: {},
}

const CACHE_TTL = {
  metrics: 60000, // 60 seconds
  clients: 120000, // 2 minutes
  agents: 10000, // 10 seconds
  decisions: 60000, // 60 seconds
  ceoStatus: 30000, // 30 seconds
}

function isCacheValid(key) {
  const timestamp = _cache.timestamps[key]
  if (!timestamp) return false
  return Date.now() - timestamp < CACHE_TTL[key]
}

function getCached(key) {
  if (isCacheValid(key)) {
    return { ..._cache[key], cached: true }
  }
  return null
}

function setCached(key, value) {
  _cache[key] = value
  _cache.timestamps[key] = Date.now()
}

/**
 * Fetch metrics with caching
 */
export async function fetchMetricsWithCache() {
  const cached = getCached('metrics')
  if (cached) return cached

  const result = await fetchMetrics()
  if (result.success) {
    setCached('metrics', result.data)
  }
  return result
}

/**
 * Invalidate cache
 */
export function invalidateCache(key) {
  if (key) {
    _cache[key] = null
    _cache.timestamps[key] = 0
  } else {
    // Invalidate all
    Object.keys(_cache).forEach(k => {
      if (k !== 'timestamps') {
        _cache[k] = null
      }
    })
    _cache.timestamps = {}
  }
}
