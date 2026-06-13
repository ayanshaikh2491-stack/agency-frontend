'use client'
import { useState } from 'react'
import Link from 'next/link'

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook Page',
    emoji: '👍',
    desc: 'Connect your Facebook Business Page to post, engage, and run ads',
    setupUrl: 'https://developers.facebook.com/apps/',
    bg: '#1877f2',
  },
  {
    id: 'instagram',
    name: 'Instagram Business',
    emoji: '📸',
    desc: 'Connect Instagram Business account for posts, stories & analytics',
    setupUrl: 'https://developers.facebook.com/docs/instagram-api/',
    bg: '#e1306c',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Page',
    emoji: '💼',
    desc: 'Connect LinkedIn Company Page for professional content',
    setupUrl: 'https://www.linkedin.com/developers/',
    bg: '#0a66c2',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    emoji: '🐦',
    desc: 'Connect Twitter/X account for tweets and engagement',
    setupUrl: 'https://developer.twitter.com/',
    bg: '#000000',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    emoji: '🎵',
    desc: 'Connect TikTok Business account for short-form video',
    setupUrl: 'https://developers.tiktok.com/',
    bg: '#000000',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    emoji: '▶️',
    desc: 'Connect YouTube channel for video content management',
    setupUrl: 'https://console.cloud.google.com/apis/',
    bg: '#ff0000',
  },
]

// n8n webhook URLs — user can set these in config
const N8N_WEBHOOKS = {
  facebook: '/api/connect/facebook',
  instagram: '/api/connect/instagram',
  linkedin: '/api/connect/linkedin',
  twitter: '/api/connect/twitter',
  tiktok: '/api/connect/tiktok',
  youtube: '/api/connect/youtube',
}

const N8N_BASE_URL = typeof window !== 'undefined'
  ? (localStorage.getItem('n8n_url') || 'http://localhost:5678')
  : 'http://localhost:5678'

export default function ConnectPage() {
  const [webhookUrl, setWebhookUrl] = useState(N8N_BASE_URL)
  const [connecting, setConnecting] = useState(null)
  const [logs, setLogs] = useState([])
  const [showWebhookConfig, setShowWebhookConfig] = useState(false)
  const [showSba, setShowSba] = useState(false)
  const [sbaChat, setSbaChat] = useState([])
  const [sbaInput, setSbaInput] = useState('')
  const [sbaSending, setSbaSending] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState([])

  function getN8nWebhookUrl(platform) {
    const base = webhookUrl.replace(/\/+$/, '')
    return `${base}/webhook/${platform}`
  }

  async function connectPlatform(platform) {
    setConnecting(platform)
    setLogs(l => [...l, { time: new Date().toLocaleTimeString(), msg: `🔄 Connecting ${platform}...`, ok: true }])

    const webhook = N8N_WEBHOOKS[platform]
    try {
      // Try n8n webhook first
      const n8nUrl = getN8nWebhookUrl(platform)
      const res = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          action: 'connect',
          timestamp: new Date().toISOString(),
          callback_url: window.location.origin + '/api/social/callback',
        }),
      })

      if (res.ok) {
        setLogs(l => [...l, { time: new Date().toLocaleTimeString(), msg: `✅ ${platform} connected via n8n!`, ok: true }])
        setConnectedAccounts(c => [...c, platform])
      } else {
        // Fallback: try direct OAuth
        setLogs(l => [...l, { time: new Date().toLocaleTimeString(), msg: `⚠️ n8n at ${n8nUrl} not responding, trying direct OAuth...`, ok: true }])
        const oauthRes = await fetch(`/api/social/oauth/${platform}/url`)
        const oauthData = await oauthRes.json()
        const url = oauthData?.oauth_url || oauthData?.url
        if (url) {
          window.open(url, '_blank', 'width=600,height=700')
          setLogs(l => [...l, { time: new Date().toLocaleTimeString(), msg: `🔗 Opened OAuth for ${platform}`, ok: true }])
        }
      }
    } catch (e) {
      // Fallback: direct OAuth
      setLogs(l => [...l, { time: new Date().toLocaleTimeString(), msg: `⚠️ n8n error, trying direct OAuth...`, ok: true }])
      try {
        const oauthRes = await fetch(`/api/social/oauth/${platform}/url`)
        const oauthData = await oauthRes.json()
        const url = oauthData?.oauth_url || oauthData?.url
        if (url) {
          window.open(url, '_blank', 'width=600,height=700')
          setLogs(l => [...l, { time: new Date().toLocaleTimeString(), msg: `🔗 OAuth opened for ${platform}`, ok: true }])
        }
      } catch (e2) {
        setLogs(l => [...l, { time: new Date().toLocaleTimeString(), msg: `❌ Error: ${e2.message}`, ok: false }])
      }
    }
    setConnecting(null)
  }

  async function sendSbaChat() {
    if (!sbaInput.trim() || sbaSending) return
    const msg = sbaInput.trim()
    setSbaInput('')
    setSbaChat(c => [...c, { role: 'user', content: msg }])
    setSbaSending(true)
    try {
      // Try n8n webhook for SBA
      const n8nUrl = getN8nWebhookUrl('sba')
      const res = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, platform: 'sba' })
      })
      if (res.ok) {
        const data = await res.json()
        setSbaChat(c => [...c, { role: 'assistant', content: data?.output || data?.response || 'Done ✅' }])
      } else {
        throw new Error('n8n unavailable')
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
        setSbaChat(c => [...c, { role: 'assistant', content: d?.data?.response || d?.response || JSON.stringify(d) }])
      } catch (e2) {
        setSbaChat(c => [...c, { role: 'assistant', content: `Error: ${e2.message}` }])
      }
    }
    setSbaSending(false)
  }

  return (
    <>
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2>Connect Platforms</h2>
          <span className="badge badge-purple">
            <span className="badge-dot" /> n8n ready
          </span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={() => setShowWebhookConfig(!showWebhookConfig)}
            style={{fontSize:12,padding:'5px 10px'}}>
            ⚙️ n8n Config
          </button>
        </div>
      </div>

      <div className="page-content" style={{padding:'12px 24px'}}>
        {/* n8n config panel */}
        {showWebhookConfig && (
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header" style={{margin:0,padding:0,marginBottom:12}}>
              <span className="card-title">n8n Webhook Configuration</span>
            </div>
            <div className="form-group">
              <label>n8n Server URL</label>
              <div style={{display:'flex',gap:8}}>
                <input
                  value={webhookUrl}
                  onChange={e => {
                    setWebhookUrl(e.target.value)
                    if (typeof window !== 'undefined') localStorage.setItem('n8n_url', e.target.value)
                  }}
                  placeholder="http://localhost:5678"
                  style={{fontSize:12,fontFamily:'monospace'}}
                />
                <button className="btn btn-secondary" style={{fontSize:11,padding:'6px 12px'}}
                  onClick={() => { navigator.clipboard?.writeText(webhookUrl); }}>
                  Copy
                </button>
              </div>
            </div>
            <div style={{fontSize:11,color:'var(--text-muted)',lineHeight:1.6,marginTop:8}}>
              <strong>How to setup n8n:</strong><br/>
              1. Install n8n: <code style={{background:'var(--bg-hover)',padding:'1px 4px',borderRadius:3}}>npx n8n</code><br/>
              2. Create a webhook workflow for each platform<br/>
              3. Set the webhook URL to: <code style={{background:'var(--bg-hover)',padding:'1px 4px',borderRadius:3}}>{webhookUrl}/webhook/[platform]</code><br/>  
              4. The webhook receives: <code style={{background:'var(--bg-hover)',padding:'1px 4px',borderRadius:3}}>{'{ "platform": "...", "action": "connect" }'}</code><br/>
              5. Your n8n workflow handles the Facebook/Instagram API connection
            </div>
          </div>
        )}

        {/* Platform Cards */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
          {PLATFORMS.map(p => (
            <div key={p.id} className="card" style={{padding:'16px',cursor:'pointer',
              borderColor: connectedAccounts.includes(p.id) ? 'var(--green)' : 'var(--border)'}}
              onClick={() => connectPlatform(p.id)}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{
                  width:36,height:36,borderRadius:8,background:p.bg + '20',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:18
                }}>{p.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
                  {connectedAccounts.includes(p.id) && (
                    <span className="badge badge-green" style={{marginTop:2,fontSize:10}}>
                      <span className="badge-dot" /> Connected
                    </span>
                  )}
                </div>
              </div>
              <p style={{fontSize:11,color:'var(--text-muted)',lineHeight:1.5,marginBottom:0}}>{p.desc}</p>
              <div style={{marginTop:10}}>
                {connecting === p.id ? (
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>
                    <span className="spinner" style={{display:'inline-block',width:12,height:12,marginRight:6}} />
                    Connecting via n8n...
                  </span>
                ) : (
                  <span style={{fontSize:11,color:'var(--accent)'}}>
                    {connectedAccounts.includes(p.id) ? '✓ Connected' : 'Click to connect via n8n + OAuth'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Log */}
        {logs.length > 0 && (
          <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
            <div className="card-header" style={{padding:'10px 14px',margin:0,borderBottom:'1px solid var(--border)'}}>
              <span className="card-title">Connection Log</span>
              <button className="btn-icon" onClick={() => setLogs([])} style={{width:22,height:22,fontSize:10}}>✕</button>
            </div>
            <div style={{padding:'8px 14px',maxHeight:150,overflow:'auto'}}>
              {logs.map((l, i) => (
                <div key={i} style={{fontSize:11,color: l.ok ? 'var(--text-secondary)' : 'var(--red)',padding:'2px 0',fontFamily:'monospace'}}>
                  [{l.time}] {l.msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SBA: Social Business Agent */}
        <div className="card" style={{overflow:'hidden',padding:0}}>
          <div className="card-header" style={{padding:'12px 16px',margin:0,borderBottom:'1px solid var(--border)',cursor:'pointer'}}
            onClick={() => setShowSba(!showSba)}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:16}}>🤖</span>
              <span className="card-title" style={{fontSize:13,textTransform:'none',letterSpacing:0}}>SBA — Social Business Agent</span>
              <span className="badge badge-blue" style={{fontSize:10}}>
                <span className="badge-dot" /> n8n + AI
              </span>
            </div>
            <span style={{fontSize:11,color:'var(--text-muted)',transform: showSba ? 'rotate(180deg)' : 'none',transition:'transform 0.12s'}}>▼</span>
          </div>
          {showSba && (
            <div style={{display:'flex',flexDirection:'column',minHeight:0,height:400}}>
              {/* Chat messages */}
              <div style={{flex:1,overflow:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                {sbaChat.length === 0 && (
                  <div style={{textAlign:'center',padding:'20px',fontSize:12,color:'var(--text-muted)',lineHeight:1.8}}>
                    🤖 <strong style={{color:'var(--text-primary)'}}>SBA (Social Business Agent)</strong><br/>
                    I manage all your social media via n8n!<br/>
                    <br/>
                    Try asking:<br/>
                    📸 "Post to Instagram: New product launch!"<br/>
                    👍 "Share on Facebook: Blog update"<br/>
                    📊 "Get last 7 days analytics"<br/>
                    🔄 "Schedule daily posts at 10am"<br/>
                    📋 "Show all scheduled content"
                  </div>
                )}
                {sbaChat.map((c, i) => (
                  <div key={i} style={{display:'flex',gap:8,flexDirection: c.role === 'user' ? 'row-reverse' : 'row'}}>
                    <div className={`chat-msg ${c.role === 'user' ? 'user' : 'assistant'}`}
                      style={{maxWidth:'85%',whiteSpace:'pre-wrap',fontSize:12}}>
                      {c.content}
                    </div>
                  </div>
                ))}
                {sbaSending && <div style={{fontSize:11,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:6}}>
                  <div className="spinner" style={{width:12,height:12}} /> Processing...
                </div>}
              </div>
              {/* Input */}
              <div className="chat-input" style={{borderTop:'1px solid var(--border)',padding:'10px 16px'}}>
                <input value={sbaInput} onChange={e => setSbaInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendSbaChat()}
                  placeholder="Tell SBA what to post..." style={{fontSize:12}} />
                <button onClick={sendSbaChat} disabled={sbaSending || !sbaInput.trim()}
                  className="btn btn-primary" style={{padding:'7px 14px',fontSize:12}}>
                  {sbaSending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
