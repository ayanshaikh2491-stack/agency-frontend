'use client'
import { useState, useEffect } from 'react'
import AgentList from '@/components/agents/AgentList'
import ChatWindow from '@/components/agents/ChatWindow'

const ORCHESTRATORS = {
  ceo: {
    name: 'CEO Agent',
    emoji: '👑',
    color: '#8b5cf6',
    desc: 'I deploy ALL agents for you. Tell me what you need — leads, content, ads, reports — I handle it.',
    initialMsg: 'Hello Ayan! I\'m your CEO Agent. Tell me what you need done:\n\n• "Get leads for real estate in Miami"\n• "Write 3 blog posts"\n• "Run ads for new client"\n• "Check agency status"\n• "Find me new clients"\n\nI\'ll deploy the right agents for the job.',
    async handle(msg) {
      const l = msg.toLowerCase()
      if (l.includes('lead') || l.includes('research') || l.includes('find') || l.includes('prospect') || l.includes('real estate')) {
        const res = await fetch('/api/agents/intake-researcher/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: I'm routing this to **Intake Researcher**.\n\n${data?.data?.response || data?.response || data?.data?.content || JSON.stringify(data)}`
      }
      if (l.includes('content') || l.includes('blog') || l.includes('write') || l.includes('article') || l.includes('post')) {
        const res = await fetch('/api/agents/content-creator/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: I'm routing this to **Content Creator**.\n\n${data?.data?.response || data?.response || data?.data?.content || JSON.stringify(data)}`
      }
      if (l.includes('ad') || l.includes('campaign') || l.includes('facebook') || l.includes('google') || l.includes('marketing')) {
        const res = await fetch('/api/agents/ads-runner/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: I'm routing this to **Ads Runner**.\n\n${data?.data?.response || data?.response || JSON.stringify(data)}`
      }
      if (l.includes('seo') || l.includes('rank') || l.includes('keyword') || l.includes('optimize')) {
        const res = await fetch('/api/agents/seo-engine/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: Routing to **SEO Engine**.\n\n${data?.data?.response || data?.response || JSON.stringify(data)}`
      }
      if (l.includes('analytics') || l.includes('report') || l.includes('stats') || l.includes('data')) {
        const res = await fetch('/api/agents/analytics-bot/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: Routing to **Analytics Bot**.\n\n${data?.data?.response || data?.response || JSON.stringify(data)}`
      }
      if (l.includes('sale') || l.includes('close') || l.includes('convert') || l.includes('pitch')) {
        const res = await fetch('/api/agents/sales-closer/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: Routing to **Sales Closer**.\n\n${data?.data?.response || data?.response || JSON.stringify(data)}`
      }
      if (l.includes('social') || l.includes('instagram') || l.includes('tweet') || l.includes('linkedin')) {
        const res = await fetch('/api/agents/social-manager/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: Routing to **Social Manager**.\n\n${data?.data?.response || data?.response || JSON.stringify(data)}`
      }
      if (l.includes('review') || l.includes('qc') || l.includes('quality') || l.includes('check')) {
        const res = await fetch('/api/agents/review-qc/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: Routing to **Review & QC**.\n\n${data?.data?.response || data?.response || JSON.stringify(data)}`
      }
      if (l.includes('client') || l.includes('success')) {
        const res = await fetch('/api/agents/client-success/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        return `👑 **CEO**: Routing to **Client Success**.\n\n${data?.data?.response || data?.response || JSON.stringify(data)}`
      }
      if (l.includes('status') || l.includes('all') || l.includes('agency') || l.includes('health')) {
        const agentRes = await fetch('/api/agents').then(r => r.json())
        const agentList = agentRes.data || []
        const status = agentList.map(a => `  • ${a.name || a.slug}: ${a.status || 'active'}`).join('\n')
        return `👑 **CEO**: Here's your agency status!\n\n**Agents (${agentList.length}):**\n${status}\n\nAll agents are operational. What task would you like me to execute?`
      }
      return `👑 **CEO**: I can help you with:\n\n🔍 **Leads** — "Find leads for real estate"\n✍️ **Content** — "Write blog posts"\n📢 **Ads** — "Run ad campaigns"\n📈 **SEO** — "Optimize my SEO"\n📊 **Reports** — "Get analytics"\n🤝 **Clients** — "Check client status"\n\nWhat do you need?`
    },
  },
}

const BACKEND_AGENTS = [
  { id: 'intake-researcher', name: 'Intake Researcher', emoji: '🔍', color: 'var(--primary)', desc: 'Finds & qualifies leads' },
  { id: 'content-creator', name: 'Content Creator', emoji: '✍️', color: 'var(--success)', desc: 'Creates blog posts & content' },
  { id: 'seo-engine', name: 'SEO Engine', emoji: '📈', color: 'var(--warning)', desc: 'Optimizes rankings & keywords' },
  { id: 'ads-runner', name: 'Ads Runner', emoji: '📢', color: 'var(--error)', desc: 'Runs Facebook/Google campaigns' },
  { id: 'analytics-bot', name: 'Analytics Bot', emoji: '📊', color: 'var(--primary)', desc: 'Reports & data analysis' },
  { id: 'sales-closer', name: 'Sales Closer', emoji: '💼', color: 'var(--primary)', desc: 'Converts leads to clients' },
  { id: 'client-success', name: 'Client Success', emoji: '🤝', color: 'var(--success)', desc: 'Manages client relationships' },
  { id: 'review-qc', name: 'Review & QC', emoji: '✓', color: 'var(--warning)', desc: 'Quality checks deliverables' },
]

export default function AgentsPage() {
  const [selected, setSelected] = useState(null)
  const [filterTab, setFilterTab] = useState('all')
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => {
      setAgents(d.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function selectAgent(a) {
    setSelected(a)
  }

  // Paperclip-style filter tabs
  const tabs = [
    { id: 'all', label: 'All', count: BACKEND_AGENTS.length },
    { id: 'active', label: 'Active', count: '-' },
    { id: 'paused', label: 'Paused', count: '-' },
    { id: 'error', label: 'Error', count: '-' },
  ]

  return (
    <>
      {/* Topbar — Paperclip clean */}
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2>Agents</h2>
          <span className="badge badge-blue">
            <span className="badge-dot" /> {BACKEND_AGENTS.length} agents
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
        {/* Paperclip-style filter tabs */}
        <div className="page-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`page-tab ${filterTab === tab.id ? 'active' : ''}`}
              onClick={() => setFilterTab(tab.id)}
            >
              {tab.label} {tab.count !== '-' && <span style={{color:'var(--text-muted)',fontSize:11,marginLeft:2}}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Paperclip-style agent list */}
        <div className="card" style={{padding:0,overflow:'hidden',flex:1,display:'flex',gap:0}}>
          {/* Left: Agent list */}
          <div style={{width:240,flexShrink:0,borderRight:'1px solid var(--border)',overflowY:'auto'}}>
            {/* Section header — CEO (like Paperclip's sidebar sections) */}
            <div style={{padding:'8px 12px 4px'}}>
              <div className="sidebar-nav-section">Orchestrators</div>
            </div>
            <div className="agent-status-list">
              <div
                className="agent-status-item"
                onClick={() => selectAgent({ id: 'ceo', name: 'CEO Agent', emoji: '👑' })}
                style={{cursor:'pointer',textDecoration:'none',color:'inherit',background:selected?.id === 'ceo' ? 'var(--bg-hover)' : 'transparent'}}
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
              {BACKEND_AGENTS.map(a => {
                const online = agents.find(x => x.id === a.id || x.name === a.name)?.status === 'active'
                return (
                  <div
                    key={a.id}
                    className="agent-status-item"
                    onClick={() => selectAgent(a)}
                    style={{cursor:'pointer',textDecoration:'none',color:'inherit',background:selected?.id === a.id ? 'var(--bg-hover)' : 'transparent'}}
                  >
                    <span className="as-dot" style={{background:online ? 'var(--green)' : 'var(--text-muted)'}} />
                    <span className="as-name" style={{fontSize:12}}>{a.name}</span>
                    {a.desc && <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto',display:'none'}}>{a.desc}</span>}
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
              agentOrchestrators={ORCHESTRATORS}
            />
          </div>
        </div>
      </div>
    </>
  )
}
