'use client'
import { useState, useRef, useEffect } from 'react'
import { useCompany } from '@/lib/client-context'
import { ORCHESTRATORS, BACKEND_AGENTS } from './AgentList'

export default function ChatWindow({ selected, agentOrchestrators, onBack }) {
  const { selectedCompany } = useCompany()
  const [input, setInput] = useState('')
  const [chat, setChat] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const chatEnd = useRef(null)

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  useEffect(() => {
    if (selected) {
      const orch = agentOrchestrators?.[selected.id]
      if (orch) {
        setChat([{ role: 'assistant', content: orch.initialMsg }])
      } else {
        setChat([{ role: 'assistant', content: `Hello! I'm **${selected.name}**. How can I help you?` }])
      }
      setError(null)
    }
  }, [selected, agentOrchestrators])

  async function sendMessage() {
    if (!input.trim() || sending || !selected) return
    const msg = input.trim()
    setInput('')
    setChat(c => [...c, { role: 'user', content: msg }])
    setSending(true)
    setError(null)

    try {
      if (selected.id === 'ceo') {
        const orchestrator = agentOrchestrators?.[selected.id]
        if (orchestrator) {
          const reply = await orchestrator.handle(msg)
          setChat(c => [...c, { role: 'assistant', content: reply }])
        }
      } else {
        const res = await fetch(`/api/agents/${selected.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, client_name: selectedCompany?.name || '' }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const reply = data?.data?.response || data?.response || data?.data?.content || JSON.stringify(data)
        setChat(c => [...c, { role: 'assistant', content: reply }])
      }
    } catch (e) {
      setError(e.message)
      setChat(c => [...c, { role: 'assistant', content: `❌ Error: ${e.message}` }])
    }
    setSending(false)
  }

  if (!selected) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, color: 'var(--text-muted)', padding: 20, textAlign: 'center',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', minHeight: 0,
      }}>
        <div style={{ fontSize: 40 }}>👑</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Select an Agent</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          Talk to <strong style={{ color: 'var(--accent)' }}>CEO Agent</strong> to orchestrate all agents<br />
          Ask for leads, content, ads, or anything else
        </div>
      </div>
    )
  }

  const emoji = ORCHESTRATORS[selected.id]?.emoji || BACKEND_AGENTS.find(a => a.id === selected.id)?.emoji || '⚡'

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', minHeight: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
      }}>
        {onBack && (
          <button onClick={onBack} className="btn-icon" style={{ fontSize: 14, marginRight: 4 }} title="Back to list">←</button>
        )}
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span style={{ fontWeight: 500, fontSize: 13 }}>{selected.name}</span>
        <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
          <span className="badge-dot" /> online
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {chat.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, flexDirection: c.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              maxWidth: '80%', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: c.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
              color: c.role === 'user' ? '#fff' : 'var(--text)',
              border: c.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>
              {c.content}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            Thinking...
          </div>
        )}
        {error && (
          <div className="error-msg" style={{ fontSize: 11 }}>
            ❌ {error}
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={ORCHESTRATORS[selected.id] ? 'Tell CEO what to do...' : 'Chat with agent...'}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--bg-secondary)',
            color: 'var(--text)', fontSize: 12,
          }}
        />
        <button onClick={sendMessage} disabled={sending || !input.trim()}
          className="btn btn-primary" style={{ padding: '8px 14px' }}>
          {sending ? '...' : '→'}
        </button>
      </div>
    </div>
  )
}
