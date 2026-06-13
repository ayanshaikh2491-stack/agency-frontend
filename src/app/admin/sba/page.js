'use client'
import { useState, useEffect } from 'react'

export default function SBAPage() {
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState('ai') // ai | n8n
  const [connectedPlatforms, setConnectedPlatforms] = useState([])

  useEffect(() => {
    fetch('/api/social/oauth/status').then(r => r.json()).then(d => {
      const accts = d?.data?.accounts || {}
      setConnectedPlatforms(Object.keys(accts))
    }).catch(() => {})
  }, [])

  async function send() {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setChat(c => [...c, { role: 'user', content: msg }])
    setSending(true)
    try {
      if (mode === 'n8n') {
        // Route through n8n webhook
        const n8nUrl = (localStorage.getItem('n8n_url') || 'http://localhost:5678').replace(/\/+$/, '')
        const res = await fetch(`${n8nUrl}/webhook/sba`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, connected_platforms: connectedPlatforms })
        })
        if (res.ok) {
          const data = await res.json()
          setChat(c => [...c, { role: 'assistant', content: data?.output || data?.response || '✅ Done via n8n' }])
        } else {
          throw new Error('n8n not available')
        }
      } else {
        // AI mode — route through social-manager API
        const res = await fetch('/api/social-manager/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        })
        const d = await res.json()
        const reply = d?.data?.response || d?.response || JSON.stringify(d)
        setChat(c => [...c, { role: 'assistant', content: reply }])
      }
    } catch (e) {
      // Fallback to social-manager API
      try {
        const res = await fetch('/api/social-manager/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        })
        const d = await res.json()
        const reply = d?.data?.response || d?.response || JSON.stringify(d)
        setChat(c => [...c, { role: 'assistant', content: reply + '\n\n_(n8n fallback → AI)_' }])
      } catch (e2) {
        setChat(c => [...c, { role: 'assistant', content: `❌ Error: ${e2.message}` }])
      }
    }
    setSending(false)
  }

  return (
    <>
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2>SBA — Social Business Agent</h2>
          <span className="badge badge-blue">
            <span className="badge-dot" /> {mode === 'n8n' ? 'n8n mode' : 'AI mode'}
          </span>
        </div>
        <div className="topbar-actions">
          <div className="toggle-group">
            <button className={`toggle-btn ${mode === 'ai' ? 'active' : ''}`}
              onClick={() => setMode('ai')}>AI</button>
            <button className={`toggle-btn ${mode === 'n8n' ? 'active' : ''}`}
              onClick={() => setMode('n8n')}>n8n</button>
          </div>
        </div>
      </div>

      <div className="page-content" style={{padding:'12px 24px',display:'flex',flexDirection:'column',height:'calc(100vh - 130px)'}}>
        <div className="card" style={{flex:1,display:'flex',flexDirection:'column',padding:0,overflow:'hidden'}}>
          {/* Header */}
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
            <div style={{
              width:32,height:32,borderRadius:8,background:'var(--purple-bg)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:16
            }}>🤖</div>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>SBA — Social Business Agent</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>
                {mode === 'n8n' ? 'Connected via n8n webhook' : 'Powered by AI'}
                {connectedPlatforms.length > 0 && ` · ${connectedPlatforms.length} platforms connected`}
              </div>
            </div>
            {connectedPlatforms.length > 0 && (
              <div style={{marginLeft:'auto',display:'flex',gap:4}}>
                {connectedPlatforms.map(p => (
                  <span key={p} style={{fontSize:16,opacity:0.6}} title={p}>
                    {p === 'facebook' ? '👍' : p === 'instagram' ? '📸' : p === 'linkedin' ? '💼' : '🌐'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chat */}
          <div style={{flex:1,overflow:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
            {chat.length === 0 && (
              <div style={{textAlign:'center',padding:'40px 20px',fontSize:12,color:'var(--text-muted)',lineHeight:2}}>
                🤖 <strong style={{color:'var(--text-primary)'}}>Social Business Agent</strong><br/>
                I manage all your social media, no matter how many accounts!<br/>
                {mode === 'n8n' ? '⚡ Routing via n8n workflow engine' : '🧠 Using AI backend'}<br/>
                <br/>
                <strong style={{color:'var(--text-secondary)'}}>Try commands:</strong><br/>
                📸 "Schedule an Instagram post tomorrow at 10am"<br/>
                👍 "Cross-post this to Facebook + LinkedIn"<br/>
                📊 "Show me this week's engagement stats"<br/>
                🔄 "Auto-reply to comments on my posts"<br/>
                📋 "What's my content calendar look like?"
              </div>
            )}
            {chat.map((c, i) => (
              <div key={i} style={{display:'flex',gap:8,flexDirection: c.role === 'user' ? 'row-reverse' : 'row'}}>
                <div className={`chat-msg ${c.role === 'user' ? 'user' : 'assistant'}`}
                  style={{maxWidth:'85%',whiteSpace:'pre-wrap',fontSize:12}}>
                  {c.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{display:'flex',gap:8,alignItems:'center',fontSize:11,color:'var(--text-muted)',padding:'4px 0'}}>
                <div className="spinner" style={{width:12,height:12}} />
                {mode === 'n8n' ? 'Routing via n8n...' : 'Thinking...'}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-input">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={
                mode === 'n8n'
                  ? 'Tell SBA what to post (via n8n)...'
                  : 'Tell SBA what to post...'
              }
              style={{fontSize:12}}
            />
            <button onClick={send} disabled={sending || !input.trim()}
              className="btn btn-primary" style={{padding:'7px 16px',fontSize:12}}>
              {sending ? (mode === 'n8n' ? '⚡' : '...') : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
