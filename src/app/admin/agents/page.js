'use client'
import { useState, useEffect, useCallback } from 'react'
import { useCompany } from '@/lib/client-context'
import AgentList from '@/components/agents/AgentList'
import ChatWindow from '@/components/agents/ChatWindow'

/* ─── Build CEO orchestrator dynamically so it captures client_name ─── */
function useCEOOOrchestrators() {
  const { selectedCompany } = useCompany()
  const clientName = selectedCompany?.name || ''

  return {
    ceo: {
      name: 'CEO Agent',
      emoji: '👑',
      color: '#8b5cf6',
      desc: 'I deploy ALL agents for you. Tell me what you need — leads, content, ads, reports — I handle it.',
      initialMsg: `Hello${clientName ? ' ' + clientName : ''}! I'm your CEO Agent. Tell me what you need done:\n\n• "Get leads for real estate"\n• "Write 3 blog posts"\n• "Run ads campaign"\n• "Check agency status"\n\nI'll deploy the right agents for the job.`,
      async handle(msg) {
        const l = msg.toLowerCase()
        const cn = clientName

        const route = async (slug, label) => {
          const res = await fetch(`/api/agents/${slug}/chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, client_name: cn }),
          })
          const data = await res.json()
          return `👑 **CEO**: I'm routing this to **${label}**.\n\n${data?.data?.response || data?.response || data?.data?.content || JSON.stringify(data)}`
        }

        if (l.includes('lead') || l.includes('research') || l.includes('find') || l.includes('prospect') || l.includes('real estate')) {
          return route('intake-researcher', 'Intake Researcher')
        }
        if (l.includes('content') || l.includes('blog') || l.includes('write') || l.includes('article') || l.includes('post')) {
          return route('content-creator', 'Content Creator')
        }
        if (l.includes('ad') || l.includes('campaign') || l.includes('facebook') || l.includes('google') || l.includes('marketing')) {
          return route('ads-runner', 'Ads Runner')
        }
        if (l.includes('seo') || l.includes('rank') || l.includes('keyword') || l.includes('optimize')) {
          return route('seo-engine', 'SEO Engine')
        }
        if (l.includes('analytics') || l.includes('report') || l.includes('stats') || l.includes('data')) {
          return route('analytics-bot', 'Analytics Bot')
        }
        if (l.includes('sale') || l.includes('close') || l.includes('convert') || l.includes('pitch')) {
          return route('sales-closer', 'Sales Closer')
        }
        if (l.includes('social') || l.includes('instagram') || l.includes('tweet') || l.includes('linkedin')) {
          return route('social-manager', 'Social Manager')
        }
        if (l.includes('review') || l.includes('qc') || l.includes('quality') || l.includes('check')) {
          return route('review-qc', 'Review & QC')
        }
        if (l.includes('client') || l.includes('success')) {
          return route('client-success', 'Client Success')
        }
        if (l.includes('status') || l.includes('all') || l.includes('agency') || l.includes('health')) {
          const agentRes = await fetch('/api/agents').then(r => r.json())
          const agentList = agentRes.data || []
          const status = agentList.map(a => `  • ${a.name || a.slug}: ${a.status || 'active'}`).join('\n')
          return `👑 **CEO**: Here's your agency status!\n\n**Agents (${agentList.length}):**\n${status}\n\nAll agents are operational.`
        }
        return `👑 **CEO**: I can help you with:\n\n🔍 **Leads** — "Find leads for real estate"\n✍️ **Content** — "Write blog posts"\n📢 **Ads** — "Run ad campaigns"\n📈 **SEO** — "Optimize my SEO"\n📊 **Reports** — "Get analytics"\n🤝 **Clients** — "Check client status"\n\nWhat do you need?`
      },
    },
  }
}

export default function AgentsPage() {
  const [selected, setSelected] = useState(null)
  const [filterTab, setFilterTab] = useState('all')
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const orchestrators = useCEOOOrchestrators()

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => {
      setAgents(d.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function selectAgent(a) {
    setSelected(a)
  }

  const BACKEND_AGENTS = [
    { id: 'intake-researcher', name: 'Intake Researcher', emoji: '🔍', desc: 'Finds & qualifies leads' },
    { id: 'content-creator', name: 'Content Creator', emoji: '✍️', desc: 'Creates blog posts & content' },
    { id: 'seo-engine', name: 'SEO Engine', emoji: '📈', desc: 'Optimizes rankings & keywords' },
    { id: 'website-builder', name: 'Website Agent', emoji: '🌐', desc: 'Designs & builds websites' },
    { id: 'ads-runner', name: 'Ads Runner', emoji: '📢', desc: 'Runs Facebook/Google campaigns' },
    { id: 'analytics-bot', name: 'Analytics Bot', emoji: '📊', desc: 'Reports & data analysis' },
    { id: 'sales-closer', name: 'Sales Closer', emoji: '💼', desc: 'Converts leads to clients' },
    { id: 'client-success', name: 'Client Success', emoji: '🤝', desc: 'Manages client relationships' },
    { id: 'review-qc', name: 'Review & QC', emoji: '✓', desc: 'Quality checks deliverables' },
  ]

  // Merge backend agents with live status
  const agentsWithStatus = BACKEND_AGENTS.map(a => {
    const live = agents.find(x => (x.id === a.id || x.slug === a.id || x.name === a.name))
    return { ...a, status: live?.status || 'unknown' }
  })

  const tabs = [
    { id: 'all', label: 'All', count: agentsWithStatus.length },
    { id: 'active', label: 'Active', count: agentsWithStatus.filter(a => a.status === 'active' || a.status === 'running').length },
    { id: 'error', label: 'Error', count: agentsWithStatus.filter(a => a.status === 'error').length },
  ]

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2>Agents</h2>
          <span className="badge badge-blue">
            <span className="badge-dot" /> {agentsWithStatus.length} agents
          </span>
        </div>
        <div className="topbar-actions">
          <div className="toggle-group">
            <button className="toggle-btn active">List</button>
            <button className="toggle-btn">Org</button>
          </div>
        </div>
      </div>

      <div className="page-content" style={{display:'flex',flexDirection:'column',height:'calc(100vh - 130px)',padding:'12px 24px'}}>
        {/* Filter tabs */}
        <div className="page-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`page-tab ${filterTab === tab.id ? 'active' : ''}`}
              onClick={() => setFilterTab(tab.id)}
            >
              {tab.label} {tab.count !== undefined && tab.count !== '-' && <span style={{color:'var(--text-muted)',fontSize:11,marginLeft:2}}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Main layout */}
        <div className="card" style={{padding:0,overflow:'hidden',flex:1,display:'flex',gap:0}}>
          {/* Left: Agent list */}
          <div style={{width:240,flexShrink:0,borderRight:'1px solid var(--border)',overflowY:'auto'}}>
            <div style={{padding:'8px 12px 4px'}}>
              <div className="sidebar-nav-section">Orchestrators</div>
            </div>
            <div className="agent-status-list">
              <div
                className="agent-status-item"
                onClick={() => selectAgent({ id: 'ceo', name: 'CEO Agent', emoji: '👑' })}
                style={{cursor:'pointer',background:selected?.id === 'ceo' ? 'var(--bg-hover)' : 'transparent'}}
              >
                <span style={{fontSize:16,width:24,textAlign:'center'}}>👑</span>
                <span className="as-name" style={{fontSize:12,fontWeight:500}}>CEO Agent</span>
                <span className="badge badge-green" style={{marginLeft:'auto',fontSize:10,padding:'1px 6px'}}>
                  <span className="badge-dot" style={{width:4,height:4}} /> live
                </span>
              </div>
            </div>
            <div style={{padding:'8px 12px 4px',marginTop:4}}>
              <div className="sidebar-nav-section">Workers</div>
            </div>
            <div className="agent-status-list">
              {agentsWithStatus.map(a => {
                const online = a.status === 'active' || a.status === 'running'
                return (
                  <div
                    key={a.id}
                    className="agent-status-item"
                    onClick={() => selectAgent(a)}
                    style={{cursor:'pointer',background:selected?.id === a.id ? 'var(--bg-hover)' : 'transparent'}}
                  >
                    <span className="as-dot" style={{background:online ? 'var(--green)' : 'var(--text-muted)'}} />
                    <span className="as-name" style={{fontSize:12}}>{a.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Chat */}
          <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
            <ChatWindow
              key={selected?.id || 'none'}
              selected={selected}
              agentOrchestrators={orchestrators}
            />
          </div>
        </div>
      </div>
    </>
  )
}
