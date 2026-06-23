'use client'
import { useState, useEffect } from 'react'
import { Bot, MessageSquare, Send, Repeat, Smartphone, Globe, Twitter, Instagram, Linkedin, Facebook, Youtube, Sparkles, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PLATFORM_ICONS = {
  facebook: { icon: Facebook, label: 'Facebook' },
  instagram: { icon: Instagram, label: 'Instagram' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
  twitter: { icon: Twitter, label: 'Twitter' },
  tiktok: { icon: Smartphone, label: 'TikTok' },
  youtube: { icon: Youtube, label: 'YouTube' },
}

export default function SBAPage() {
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState('ai')
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

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2>SBA — Social Business Agent</h2>
          <Badge variant="outline" className="text-[11px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
            {mode === 'n8n' ? 'n8n mode' : 'AI mode'}
          </Badge>
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

      {/* Main content */}
      <div className="flex-1 px-6 py-4 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-lg bg-card">
          {/* Chat header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
            <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Bot className="size-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">SBA — Social Business Agent</div>
              <div className="text-[11px] text-muted-foreground">
                {mode === 'n8n' ? 'Connected via n8n webhook' : 'Powered by AI'}
                {connectedPlatforms.length > 0 && ` · ${connectedPlatforms.length} platforms connected`}
              </div>
            </div>
            {connectedPlatforms.length > 0 && (
              <div className="flex items-center gap-1">
                {connectedPlatforms.map(p => {
                  const pf = PLATFORM_ICONS[p]
                  const Icon = pf?.icon || Globe
                  return (
                    <span key={p} className="text-muted-foreground/60" title={pf?.label || p}>
                      <Icon className="size-3.5" />
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chat.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="size-6 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Social Business Agent</p>
                <p className="text-xs text-muted-foreground mb-4">
                  I manage all your social media, no matter how many accounts!
                  <br />
                  {mode === 'n8n' ? '⚡ Routing via n8n workflow engine' : '🧠 Using AI backend'}
                </p>
                <div className="max-w-sm mx-auto space-y-1">
                  {[
                    '📸 "Schedule an Instagram post tomorrow at 10am"',
                    '👍 "Cross-post this to Facebook + LinkedIn"',
                    '📊 "Show me this week\'s engagement stats"',
                    '🔄 "Auto-reply to comments on my posts"',
                    '📋 "What\'s my content calendar look like?"',
                  ].map((cmd, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">{cmd}</p>
                  ))}
                </div>
              </div>
            )}
            {chat.map((c, i) => (
              <div key={i} className={`flex gap-2.5 ${c.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {c.role === 'assistant' && (
                  <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-3.5 text-accent" />
                  </div>
                )}
                <div className={
                  c.role === 'user'
                    ? 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground whitespace-pre-wrap'
                    : 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground whitespace-pre-wrap'
                }>
                  {c.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {mode === 'n8n' ? <Repeat className="size-3 animate-spin" /> : <Sparkles className="size-3 animate-pulse" />}
                {mode === 'n8n' ? 'Routing via n8n...' : 'Thinking...'}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'n8n' ? 'Tell SBA what to post (via n8n)...' : 'Tell SBA what to post...'}
                className="flex-1 text-sm"
              />
              <Button
                onClick={send}
                disabled={sending || !input.trim()}
                size="sm"
              >
                {sending ? (
                  mode === 'n8n' ? <Zap className="size-3.5" /> : <Sparkles className="size-3.5" />
                ) : (
                  <Send className="size-3.5" />
                )}
                <span className="ml-1.5">{sending ? '' : 'Send'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
