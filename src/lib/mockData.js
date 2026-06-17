// All fake data removed — real data comes from backend API
// Numbers stay 0 until actual work happens

export const mockClients = []
export const mockAgents = []
export const mockWorkflows = []
export const mockCampaigns = []
export const mockSocialPosts = []
export const mockLeads = []
export const mockAnalytics = {
  totalClients: 0,
  activeClients: 0,
  totalLeads: 0,
  leadsToday: 0,
  totalRevenue: 0,
  contentGenerated: 0,
  campaignsActive: 0,
  postsScheduled: 0,
}
export const mockPipeline = {
  leadsToday: 0,
  leadsTotal: 0,
  queue: [],
}
export const mockActivityLog = []
export const mockTickets = []
export const mockGoals = []
export const mockRoutines = []
export const mockCosts = {
  totalSpend: 0,
  dailyBudget: 0,
}

export const emptyState = {
  title: 'No data yet',
  description: 'Data will appear when agents start working',
}
