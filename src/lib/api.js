const API_BASE = ''
// ── Direct EC2 for CEO chat (HTTPS for production) ──
// NOTE: If port 443 blocked, add rule in AWS Console → EC2 → Security Groups → Inbound → Port 443 → 0.0.0.0/0
const EC2_BACKEND = 'https://18.213.66.136'

async function fetchAPI(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const res = await fetch(url, config)
    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.detail || data.message || `API error: ${res.status}` }
    }

    return data
  } catch (error) {
    return { success: false, error: error.message, offline: true }
  }
}

export const api = {
  login(email, password) {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  },

  signup(fullName, email, password) {
    return fetchAPI('/api/auth/signup', {
      method: 'POST',
      body: { fullName, email, password },
    })
  },

  logout() {
    return fetchAPI('/api/auth/logout', { method: 'POST' })
  },

  getClients() {
    return fetchAPI('/api/clients')
  },

  getClient(id) {
    return fetchAPI(`/api/clients/${id}`)
  },

  createClient(data) {
    return fetchAPI('/api/clients', {
      method: 'POST',
      body: data,
    })
  },

  updateClient(id, data) {
    return fetchAPI(`/api/clients/${id}`, {
      method: 'PUT',
      body: data,
    })
  },

  deleteClient(id) {
    return fetchAPI(`/api/clients/${id}`, {
      method: 'DELETE',
    })
  },

  getAgents() {
    return fetchAPI('/api/agents')
  },

  executeAgent(name, task, context) {
    return fetchAPI('/api/agents/execute', {
      method: 'POST',
      body: { name, task, context },
    })
  },

  chatWithAgent(name, message, history) {
    return fetchAPI('/api/agents/chat', {
      method: 'POST',
      body: { name, message, history },
    })
  },

  ceoChat(message, context) {
    // ── Hermes CEO on EC2 port 8000 (direct call to bypass Vercel timeout) ──
    return fetchAPI(`${EC2_BACKEND}/api/ceo/chat-hermes`, {
      method: 'POST',
      body: {
        message,
        session_id: context?.session_id || 'web',
        workspace_id: context?.workspace_id || '',
      },
    })
  },

  getWorkflows() {
    return fetchAPI('/api/workflows')
  },

  runWorkflow(clientId, workflowName) {
    return fetchAPI('/api/workflows/run', {
      method: 'POST',
      body: { client_id: clientId, workflow_name: workflowName },
    })
  },

  getWorkflowStatus(id) {
    return fetchAPI(`/api/workflows/${id}`)
  },

  getReports() {
    return fetchAPI('/api/reports')
  },

  generateReport(clientId, type) {
    return fetchAPI('/api/reports/generate', {
      method: 'POST',
      body: { client_id: clientId, type },
    })
  },

  getDashboardStats() {
    return fetchAPI('/api/dashboard')
  },

  // ── Meta Ads API (via MCP) ──
  metaSetApiKey(clientName, accessToken, adAccountId) {
    return fetchAPI('/api/meta/set-key', {
      method: 'POST',
      body: { client_name: clientName, access_token: accessToken, ad_account_id: adAccountId },
    })
  },

  metaHealthCheck(clientName) {
    return fetchAPI(`/api/meta/health/${clientName}`)
  },

  metaGetAccounts(clientName) {
    return fetchAPI(`/api/meta/accounts/${clientName}`)
  },

  metaCreateCampaign(clientName, name, objective, dailyBudgetCents, accountId) {
    return fetchAPI('/api/meta/create-campaign', {
      method: 'POST',
      body: { client_name: clientName, name, objective, daily_budget_cents: dailyBudgetCents, account_id: accountId },
    })
  },

  metaCreateFullCampaign(data) {
    return fetchAPI('/api/meta/create-full-campaign', {
      method: 'POST',
      body: data,
    })
  },

  metaResumeCampaign(clientName, campaignId) {
    return fetchAPI('/api/meta/resume-campaign', {
      method: 'POST',
      body: { client_name: clientName, campaign_id: campaignId },
    })
  },

  metaPauseCampaign(clientName, campaignId) {
    return fetchAPI('/api/meta/pause-campaign', {
      method: 'POST',
      body: { client_name: clientName, campaign_id: campaignId },
    })
  },

  metaGetInsights(clientName, datePreset, level, accountId) {
    return fetchAPI('/api/meta/insights', {
      method: 'POST',
      body: { client_name: clientName, date_preset: datePreset, level, account_id: accountId },
    })
  },

  metaExecuteAgent(clientName, task) {
    return fetchAPI('/api/meta/execute-agent', {
      method: 'POST',
      body: { client_name: clientName, task },
    })
  },

  // ── Social Media Manager API ──
  socialManagerCommand(command) {
    return fetchAPI('/api/social-manager/command', {
      method: 'POST',
      body: { command },
    })
  },

  socialManagerChat(message) {
    return fetchAPI('/api/social-manager/chat', {
      method: 'POST',
      body: { message },
    })
  },

  // ── Social OAuth API ──
  getSocialAccountStatus(clientName) {
    return fetchAPI(`/api/social/oauth/status?client_name=${encodeURIComponent(clientName || 'default')}`)
  },

  getSocialOAuthUrl(platform, clientName) {
    return fetchAPI(`/api/social/oauth/${platform}/authorize?client_name=${encodeURIComponent(clientName || 'default')}`)
  },

  // ── Client Content API ──
  getClientContent(clientId) {
    return fetchAPI(`/api/clients/${clientId}/content`)
  },

  generateClientContent(clientId, contentType, topic, framework) {
    return fetchAPI(`/api/clients/${clientId}/generate-content`, {
      method: 'POST',
      body: { content_type: contentType, topic, framework },
    })
  },

  getClientStats(clientId) {
    return fetchAPI(`/api/clients/${clientId}/stats`)
  },

  // ── Memory API (Session 102) ──
  getAgentMemories(agentSlug, clientName = '', memoryType = '', limit = 20) {
    const params = new URLSearchParams({ client_name: clientName, limit })
    if (memoryType) params.set('memory_type', memoryType)
    return fetchAPI(`/api/agents/${agentSlug}/memories?${params}`)
  },

  getAgentConversations(agentSlug, clientName = '', limit = 10) {
    return fetchAPI(`/api/agents/${agentSlug}/conversations?client_name=${encodeURIComponent(clientName)}&limit=${limit}`)
  },

  agentChat(agentSlug, message, clientName = '') {
    return fetchAPI(`/api/agents/${agentSlug}/chat`, {
      method: 'POST',
      body: { message, client_name: clientName },
    })
  },
}
