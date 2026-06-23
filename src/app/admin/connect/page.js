'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Settings,
  ChevronDown,
  Bot,
  Send,
  Check,
  X,
  Loader2,
  Copy,
  ExternalLink,
  Link2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

const N8N_BASE_URL =
  typeof window !== 'undefined'
    ? localStorage.getItem('n8n_url') || 'http://localhost:5678'
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
    setLogs((l) => [
      ...l,
      { time: new Date().toLocaleTimeString(), msg: `🔄 Connecting ${platform}...`, ok: true },
    ])

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
        setLogs((l) => [
          ...l,
          {
            time: new Date().toLocaleTimeString(),
            msg: `✅ ${platform} connected via n8n!`,
            ok: true,
          },
        ])
        setConnectedAccounts((c) => [...c, platform])
      } else {
        // Fallback: try direct OAuth
        setLogs((l) => [
          ...l,
          {
            time: new Date().toLocaleTimeString(),
            msg: `⚠️ n8n at ${n8nUrl} not responding, trying direct OAuth...`,
            ok: true,
          },
        ])
        const oauthRes = await fetch(`/api/social/oauth/${platform}/url`)
        const oauthData = await oauthRes.json()
        const url = oauthData?.oauth_url || oauthData?.url
        if (url) {
          window.open(url, '_blank', 'width=600,height=700')
          setLogs((l) => [
            ...l,
            {
              time: new Date().toLocaleTimeString(),
              msg: `🔗 Opened OAuth for ${platform}`,
              ok: true,
            },
          ])
        }
      }
    } catch (e) {
      // Fallback: direct OAuth
      setLogs((l) => [
        ...l,
        {
          time: new Date().toLocaleTimeString(),
          msg: `⚠️ n8n error, trying direct OAuth...`,
          ok: true,
        },
      ])
      try {
        const oauthRes = await fetch(`/api/social/oauth/${platform}/url`)
        const oauthData = await oauthRes.json()
        const url = oauthData?.oauth_url || oauthData?.url
        if (url) {
          window.open(url, '_blank', 'width=600,height=700')
          setLogs((l) => [
            ...l,
            {
              time: new Date().toLocaleTimeString(),
              msg: `🔗 OAuth opened for ${platform}`,
              ok: true,
            },
          ])
        }
      } catch (e2) {
        setLogs((l) => [
          ...l,
          {
            time: new Date().toLocaleTimeString(),
            msg: `❌ Error: ${e2.message}`,
            ok: false,
          },
        ])
      }
    }
    setConnecting(null)
  }

  async function sendSbaChat() {
    if (!sbaInput.trim() || sbaSending) return
    const msg = sbaInput.trim()
    setSbaInput('')
    setSbaChat((c) => [...c, { role: 'user', content: msg }])
    setSbaSending(true)
    try {
      // Try n8n webhook for SBA
      const n8nUrl = getN8nWebhookUrl('sba')
      const res = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, platform: 'sba' }),
      })
      if (res.ok) {
        const data = await res.json()
        setSbaChat((c) => [
          ...c,
          { role: 'assistant', content: data?.output || data?.response || 'Done ✅' },
        ])
      } else {
        throw new Error('n8n unavailable')
      }
    } catch (e) {
      // Fallback to social-manager API
      try {
        const res = await fetch('/api/social-manager/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const d = await res.json()
        setSbaChat((c) => [
          ...c,
          {
            role: 'assistant',
            content: d?.data?.response || d?.response || JSON.stringify(d),
          },
        ])
      } catch (e2) {
        setSbaChat((c) => [...c, { role: 'assistant', content: `Error: ${e2.message}` }])
      }
    }
    setSbaSending(false)
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2>Connect Platforms</h2>
          <Badge variant="secondary" className="gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
            n8n ready
          </Badge>
        </div>
        <div className="topbar-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWebhookConfig(!showWebhookConfig)}
          >
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            n8n Config
          </Button>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content">
        {/* n8n config panel */}
        {showWebhookConfig && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                n8n Webhook Configuration
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  n8n Server URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value)
                      if (typeof window !== 'undefined')
                        localStorage.setItem('n8n_url', e.target.value)
                    }}
                    placeholder="http://localhost:5678"
                    className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(webhookUrl)
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">How to setup n8n:</strong>
                <br />
                1. Install n8n:{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">npx n8n</code>
                <br />
                2. Create a webhook workflow for each platform
                <br />
                3. Set the webhook URL to:{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  {webhookUrl}/webhook/[platform]
                </code>
                <br />
                4. The webhook receives:{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  {'{ "platform": "...", "action": "connect" }'}
                </code>
                <br />
                5. Your n8n workflow handles the Facebook/Instagram API connection
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Cards */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer border-l-[3px] transition-colors hover:bg-accent/5"
              style={{ borderLeftColor: p.bg }}
              onClick={() => connectPlatform(p.id)}
            >
              <CardContent className="p-4">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: p.bg + '20' }}
                  >
                    {p.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                    {connectedAccounts.includes(p.id) && (
                      <Badge
                        variant="outline"
                        className="mt-0.5 border-green-500/20 bg-green-500/10 px-1.5 py-0 text-[10px] text-green-600 dark:text-green-400"
                      >
                        <Check className="mr-0.5 h-2.5 w-2.5" />
                        Connected
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="mb-0 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                <div className="mt-2.5">
                  {connecting === p.id ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Connecting via n8n...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-accent">
                      {connectedAccounts.includes(p.id) ? (
                        <>
                          <Check className="h-3 w-3" /> Connected
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3 w-3" /> Click to connect via n8n + OAuth
                        </>
                      )}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Log */}
        {logs.length > 0 && (
          <Card className="mb-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">Connection Log</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setLogs([])}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="max-h-36 overflow-y-auto px-4 py-2">
              {logs.map((l, i) => (
                <div
                  key={i}
                  className={`py-0.5 font-mono text-xs ${
                    l.ok ? 'text-muted-foreground' : 'text-destructive'
                  }`}
                >
                  [{l.time}] {l.msg}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* SBA: Social Business Agent */}
        <Card className="overflow-hidden">
          {/* SBA Header */}
          <div
            className="flex cursor-pointer items-center justify-between border-b border-border px-4 py-3"
            onClick={() => setShowSba(!showSba)}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                SBA — Social Business Agent
              </span>
              <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                <span className="inline-block h-1 w-1 rounded-full bg-blue-500" />
                n8n + AI
              </Badge>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                showSba ? 'rotate-180' : ''
              }`}
            />
          </div>

          {/* SBA Chat Body */}
          {showSba && (
            <div className="flex h-[400px] flex-col">
              {/* Chat messages */}
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {sbaChat.length === 0 && (
                  <div className="py-6 text-center text-xs leading-relaxed text-muted-foreground">
                    <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <strong className="text-foreground">SBA (Social Business Agent)</strong>
                    <br />
                    I manage all your social media via n8n!
                    <br />
                    <br />
                    Try asking:
                    <br />
                    📸 &quot;Post to Instagram: New product launch!&quot;
                    <br />
                    👍 &quot;Share on Facebook: Blog update&quot;
                    <br />
                    📊 &quot;Get last 7 days analytics&quot;
                    <br />
                    🔄 &quot;Schedule daily posts at 10am&quot;
                    <br />
                    📋 &quot;Show all scheduled content&quot;
                  </div>
                )}
                {sbaChat.map((c, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${c.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {c.role === 'assistant' && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <Bot className="h-3.5 w-3.5 text-accent" />
                      </div>
                    )}
                    <div
                      className={
                        c.role === 'user'
                          ? 'max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                          : 'max-w-[85%] whitespace-pre-wrap rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground'
                      }
                    >
                      {c.content}
                    </div>
                  </div>
                ))}
                {sbaSending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={sbaInput}
                    onChange={(e) => setSbaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendSbaChat()}
                    placeholder="Tell SBA what to post..."
                    className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button
                    onClick={sendSbaChat}
                    disabled={sbaSending || !sbaInput.trim()}
                    size="sm"
                  >
                    {sbaSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5">{sbaSending ? '' : 'Send'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
