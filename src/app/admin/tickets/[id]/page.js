'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Terminal from '@/components/Terminal'

const TICKET_DATA = {
  101: { id: 101, title: 'Research Miami real estate market', agent: 'Intake Researcher', status: 'completed', priority: 'high', goal: 'Launch lead gen campaign', budget: { used: 4230, limit: 5000 } },
  102: { id: 102, title: 'Analyze competitor ad strategies', agent: 'Intake Researcher', status: 'in-progress', priority: 'high', goal: 'Launch lead gen campaign', budget: { used: 2100, limit: 5000 } },
  103: { id: 103, title: 'Draft ad creative & copy variants', agent: 'Content Creator', status: 'in-progress', priority: 'high', goal: 'Launch lead gen campaign', budget: { used: 3100, limit: 5000 } },
  104: { id: 104, title: 'Build lookalike audience segments', agent: 'Ads Runner', status: 'open', priority: 'medium', goal: 'Launch lead gen campaign', budget: { used: 0, limit: 4000 } },
}

const BUBBLES = [
  { id: 1, sender: 'CEO Agent', type: 'agent-ceo', msg: 'Assigned ticket: Research Miami real estate market. Priority: high. Target: identify top 50 luxury real estate agencies in Miami with contact info.', time: '09:30' },
  { id: 2, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Checked out ticket #101. Starting research phase. Will query public databases, social media, and real estate listings.', time: '09:31', think: 'Strategy: I will search for "Miami luxury real estate agencies" across multiple sources. First check Google Maps for top-rated agencies, then cross-reference with LinkedIn for key decision makers.' },
  { id: 3, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Querying: Google Maps -> "real estate agency Miami" -> top 200 results', time: '09:32' },
  { id: 4, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Querying: LinkedIn -> "real estate broker Miami" -> filtering by title & company size', time: '09:34' },
  { id: 5, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Querying: Yellow Pages & industry directories for contact data', time: '09:36' },
  { id: 6, sender: 'Intake Researcher', type: 'agent-worker', msg: 'Collected 247 listings. Filtering to >$1M transaction volume...', time: '09:42', think: 'Cross-referencing 247 listings against: (1) minimum 5 years in business (2) at least 10 luxury listings/year (3) presence in Miami Beach, Coral Gables, or Brickell areas. Filtered to 52 qualifying agencies.' },
  { id: 7, sender: 'CTO Agent', type: 'agent-cto', msg: 'Budget check: 4,230 tokens consumed (84.6% of 5,000). Within limit.', time: '09:45' },
  { id: 8, sender: 'Intake Researcher', type: 'agent-worker', msg: '✅ Research complete! Found 52 qualifying luxury agencies with verified contact info. Delivering results.', time: '09:50' },
]

const SAMPLE_LOGS = [
  { ts: Date.now() - 180000, type: 'info', msg: '[AGENT-HEARTBEAT] CEO agent checking ticket queue...' },
  { ts: Date.now() - 175000, type: 'info', msg: '[CEO] Ticket #101 assigned to Intake Researcher' },
  { ts: Date.now() - 170000, type: 'highlight', msg: '[WORKER] Intake Researcher checked out Ticket #101' },
  { ts: Date.now() - 165000, type: 'info', msg: '[TOOL-CALL] Executing: google_maps_search("real estate agency Miami")' },
  { ts: Date.now() - 150000, type: 'info', msg: '[TOOL-CALL] HTTP GET linkedin.com/search?q=real+estate+broker+miami' },
  { ts: Date.now() - 120000, type: 'warn', msg: '[RATE-LIMIT] LinkedIn: waiting 30s...' },
  { ts: Date.now() - 90000, type: 'info', msg: '[TOOL-CALL] Query returned 247 results' },
  { ts: Date.now() - 60000, type: 'info', msg: '[FILTER] Cross-referencing against qualifying criteria...' },
  { ts: Date.now() - 30000, type: 'highlight', msg: '[RESULT] 52 qualifying luxury agencies identified' },
  { ts: Date.now(), type: 'info', msg: '[HEARTBEAT] Ticket #101 completed. Logging results.' },
]

export default function TicketDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const ticket = TICKET_DATA[id] || { id, title: `Ticket #${id}`, agent: 'Unknown', status: 'open', budget: { used: 0, limit: 4000 } }

  const [chat, setChat] = useState(BUBBLES)
  const [input, setInput] = useState('')
  const [showTerminal, setShowTerminal] = useState(true)
  const [terminalHeight, setTerminalHeight] = useState(200)

  const handleSend = () => {
    if (!input.trim()) return
    setChat(prev => [...prev, { id: Date.now(), sender: 'You', type: 'user', msg: input, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }])
    // Simulate agent response
    setTimeout(() => {
      setChat(prev => [...prev, {
        id: Date.now() + 1,
        sender: ticket.agent,
        type: 'agent-worker',
        msg: 'Acknowledged. Adding to ticket thread. Processing your request...',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        think: 'Analyzing user query in context of ticket scope. Cross-referencing with existing research data to provide relevant response.'
      }])
    }, 1500)
    setInput('')
  }

  const budgetPercent = (ticket.budget.used / ticket.budget.limit) * 100
  const budgetClass = budgetPercent > 80 ? 'high' : budgetPercent > 50 ? 'med' : 'low'

  const ThinkBlock = ({ content, label }) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="think-block">
        <button className="think-toggle" onClick={() => setOpen(!open)}>
          <span className={`arrow ${open ? 'open' : ''}`}>▸</span>
          {label || '🧠 Chain of Thought'}
        </button>
        {open && <div className="think-content">{content}</div>}
      </div>
    )
  }

  return (
    <div className="ticket-workspace">
      {/* Header */}
      <div className="ticket-header">
        <Link href="/admin/tickets" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none', marginRight: 4 }}>
          ← Tickets
        </Link>
        <div className="ticket-header-left">
          <div className="ticket-title">
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>#{ticket.id}</span> {ticket.title}
          </div>
          <div className="ticket-meta">
            <span className="agent-chip">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ticket.status === 'completed' ? 'var(--green)' : 'var(--yellow)' }} />
              {ticket.agent}
            </span>
            <span className={`ticket-badge ${ticket.status}`}>
              {ticket.status === 'in-progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ticket.goal}</span>
          </div>
        </div>
        <div className="ticket-budget">
          <span>⚡ {(ticket.budget.used).toLocaleString()} / {(ticket.budget.limit).toLocaleString()}</span>
          <div className="budget-bar">
            <div className={`budget-fill ${budgetClass}`} style={{ width: `${Math.min(budgetPercent, 100)}%` }} />
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setShowTerminal(!showTerminal)}
          style={{ fontSize: 10, padding: '4px 8px' }}
        >
          {showTerminal ? 'Hide Log' : 'Show Log'}
        </button>
      </div>

      {/* Split: Chat + Terminal */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chat */}
        <div className="ticket-chat" style={{ flex: 1 }}>
          {chat.map(b => (
            <div key={b.id} className={`chat-bubble ${b.type}`}>
              {b.type !== 'user' && <div className="bubble-sender" style={{ color: b.type === 'agent-ceo' ? 'var(--accent)' : b.type === 'agent-cto' ? 'var(--teal)' : 'var(--text-secondary)' }}>{b.sender}</div>}
              <div>{b.msg}</div>
              {b.think && <ThinkBlock content={b.think} />}
              <div className="bubble-time">{b.time}</div>
            </div>
          ))}
        </div>

        {/* Resize handle + Terminal panel */}
        {showTerminal && (
          <div style={{ width: 380, flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <Terminal logs={SAMPLE_LOGS} height={1000} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <input
          placeholder={`Message ${ticket.agent}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim()} style={{ padding: '6px 12px', fontSize: 12 }}>
          Send
        </button>
      </div>
    </div>
  )
}
