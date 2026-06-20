'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCompany } from '@/lib/client-context'
import { uid, ts, renderMD, PAPERCLIP_BUBBLE, AgentBubbleHeader, TypingBubble } from '@/lib/chat-utils'

const ADS_SERVER_URL = process.env.NEXT_PUBLIC_ADS_SERVER_URL || 'http://localhost:8765'

const SUGGESTIONS = [
  { label: '📊 Research', prompt: 'research ecommerce 30000' },
  { label: '✍️ Ad Copy', prompt: 'adcopy for fitness brand targeting young professionals' },
  { label: '📢 Quick Campaign', prompt: 'create campaign summer sale with 500 budget' },
  { label: '🔧 Check Status', prompt: 'check health' },
]

function StatusPill({ color, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
      style={{ background: `${color}15`, color }}>
      <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  )
}

function CampaignCard({ campaign, onActivate, onPause, onPerf }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 hover:border-foreground/20 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground truncate">{campaign.name || 'Campaign'}</span>
        <StatusPill color={campaign.status === 'ACTIVE' ? '#10b981' : campaign.status === 'PAUSED' ? '#f59e0b' : '#6b7280'}
          text={campaign.status || 'UNKNOWN'} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-muted-foreground">ID: {campaign.id}</span>
        <span className="text-[11px] text-muted-foreground">|</span>
        <span className="text-[11px] text-muted-foreground">₹{campaign.budget || 0}/day</span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        {campaign.status !== 'ACTIVE' && (
          <button onClick={() => onActivate?.(campaign.id)}
            className="rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-2.5 py-1 text-[11px] font-medium transition-colors">
            ▶ Activate
          </button>
        )}
        {campaign.status === 'ACTIVE' && (
          <button onClick={() => onPause?.(campaign.id)}
            className="rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-2.5 py-1 text-[11px] font-medium transition-colors">
            ⏸ Pause
          </button>
        )}
        <button onClick={() => onPerf?.(campaign.id)}
          className="rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-2.5 py-1 text-[11px] font-medium transition-colors">
          📈 Performance
        </button>
      </div>
    </div>
  )
}

function ServerSetupWizard({ onClose }) {
  const [step, setStep] = useState(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">🚀 Ads Server Setup</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        <div className="space-y-4">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <div key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">Ads Server chalao — terminal mein ye command do:</p>
              <div className="rounded-lg bg-[#1e1e1e] p-3 text-xs font-mono">
                <div className="text-gray-400"># backend directory mein jakar:</div>
                <div className="text-green-400">cd C:\Users\TAUSHEF\Downloads\int\backend</div>
                <div className="text-green-400 mt-1">uv run --python 3.13 --with requests python ads_server.py</div>
              </div>
              <p className="text-xs text-muted-foreground">Server start hote hi health check pass ho jayega.</p>
              <button onClick={() => setStep(2)}
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity mt-2">
                👍 Done, Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">Ab client ke API keys store karo:</p>
              <div className="rounded-lg bg-[#1e1e1e] p-3 text-xs font-mono">
                <div className="text-cyan-400"># Terminal 2 mein:</div>
                <div className="text-green-400">cd backend && uv run --python 3.13 --with requests python ads_cli.py store-keys client_abc act_123456789 ACCESS_TOKEN PAGE_ID</div>
              </div>
              <p className="text-xs text-muted-foreground">⚠️ Pehle client ka Meta ad account ID, access token aur page ID ready rakho.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground/80 hover:bg-accent transition-colors">
                  ← Back
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                  Keys Ready → 
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
                <div className="text-2xl mb-2">🚀</div>
                <p className="text-sm font-medium text-emerald-500">Sab ready hai!</p>
                <p className="text-xs text-muted-foreground mt-1">Ab Ads Manager se campaign banao.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <span className="text-emerald-400">✅</span>
                  <span>Ads Server chal raha hai</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <span className="text-emerald-400">✅</span>
                  <span>Client API keys stored</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <span className="text-amber-400">⏸</span>
                  <span>Campaign PAUSED create hogi — phir activate karna</span>
                </div>
              </div>
              <button onClick={onClose}
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity mt-2">
                🎯 Start Campaigning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdsPage() {
  const { selectedCompany } = useCompany()
  const clientName = selectedCompany?.name || ''
  const clientId = selectedCompany?.id || clientName.toLowerCase().replace(/\s+/g, '_')

  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [serverOnline, setServerOnline] = useState(false)
  const [checkingServer, setCheckingServer] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [tab, setTab] = useState('chat') // chat | campaigns | settings
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Check server health
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${ADS_SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) })
        setServerOnline(res.ok)
      } catch {
        setServerOnline(false)
      }
      setCheckingServer(false)
    }
    check()
    const iv = setInterval(check, 15000)
    return () => clearInterval(iv)
  }, [])

  const send = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim()
    if (!text || sending) return
    if (!overrideText) setInput('')

    const userMsg = { id: uid(), role: 'user', content: text, time: ts() }
    setMsgs(prev => [...prev, userMsg])
    setSending(true)

    try {
      const res = await fetch('/api/agents/ads-runner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, client_name: clientName, client_id: clientId }),
      })
      const data = await res.json()
      const reply = data?.data?.response || data?.response || data?.data?.content || JSON.stringify(data)
      setMsgs(prev => [...prev, { id: uid(), role: 'assistant', content: reply, time: ts() }])
    } catch (e) {
      setMsgs(prev => [...prev, { id: uid(), role: 'assistant', content: `❌ Error: ${e.message}`, time: ts() }])
    }

    setSending(false)
  }, [input, sending, clientName, clientId])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }, [send])

  // Activate campaign
  const activateCampaign = useCallback(async (campaignId) => {
    setInput(`activate ${campaignId}`)
    send(`activate ${campaignId}`)
  }, [send])

  const pauseCampaign = useCallback(async (campaignId) => {
    setInput(`pause ${campaignId}`)
    send(`pause ${campaignId}`)
  }, [send])

  const checkPerf = useCallback(async (campaignId) => {
    setInput(`performance ${campaignId}`)
    send(`performance ${campaignId}`)
  }, [send])

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* LEFT: Main Content Area */}
      <div className={`flex flex-col min-h-0 min-w-0 ${tab === 'campaigns' || tab === 'settings' ? 'w-2/3' : 'w-full'}`}>
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">📢 Ads Manager</h2>
            {checkingServer ? (
              <StatusPill color="#6b7280" text="Checking..." />
            ) : serverOnline ? (
              <StatusPill color="#10b981" text="Online" />
            ) : (
              <button onClick={() => setShowSetup(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-500 hover:bg-amber-500/20 transition-colors">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                Offline — Setup
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">{clientName || 'No client'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-3 shrink-0">
          {[
            { id: 'chat', label: '💬 Chat' },
            { id: 'campaigns', label: '📋 Campaigns' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide mb-3">
              <div className="flex flex-col gap-3">
                {msgs.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📢</div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Ads Runner</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                      Facebook Ads campaigns create karo, ad copy generate karo, 
                      performance track karo — sab client ke ad account mein.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {SUGGESTIONS.map(s => (
                        <button key={s.label} onClick={() => { setInput(s.prompt); inputRef.current?.focus() }}
                          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {msgs.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {m.role === 'assistant' && <AgentBubbleHeader emoji="📢" name="Ads Runner" />}
                    <div className={`${PAPERCLIP_BUBBLE} ${
                      m.role === 'user'
                        ? 'bg-primary text-white [border-radius:14px_14px_4px_14px]'
                        : 'bg-card border border-border text-foreground [border-radius:14px_14px_14px_4px]'
                    }`}>
                      <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm [&_code]:bg-[#1e1e1e] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_pre]:bg-[#1e1e1e] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-xs [&_pre]:my-2"
                        dangerouslySetInnerHTML={{ __html: renderMD(m.content) }} />
                    </div>
                  </div>
                ))}
                {sending && <TypingBubble />}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0">
              <div className="relative rounded-xl border border-border bg-card px-4 pb-2 pt-3 shadow-lg transition-colors focus-within:border-foreground/30">
                <div className="flex items-end gap-2">
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Campaign banao, research karo, ya kuch bhi bolo..." rows={1}
                    className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none scrollbar-none"
                    disabled={sending} />
                  <button onClick={() => send()} disabled={!input.trim() || sending}
                    className="rounded-lg bg-primary p-1.5 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'campaigns' && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide">
            <div className="text-center py-12">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm text-muted-foreground">Campaigns tab ayega jab server se real data aayega.</p>
              <p className="text-xs text-muted-foreground mt-1">Abhi Chat mein "campaign banao" bol ke test kar sakte ho.</p>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide">
            <div className="space-y-4 max-w-md">
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">🔌 Server Status</h4>
                <div className="flex items-center gap-2">
                  {serverOnline ? (
                    <span className="text-xs text-emerald-500">✅ Ads Server online hai — port {ADS_SERVER_URL}</span>
                  ) : (
                    <span className="text-xs text-amber-500">⚠️ Offline — setup guide ke liye top bar ka button click karo</span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">🔑 API Keys</h4>
                <p className="text-xs text-muted-foreground mb-3">Client ke Meta Ads keys store karne ke liye terminal:</p>
                <div className="rounded-lg bg-[#1e1e1e] p-3 text-xs font-mono">
                  <div className="text-gray-400">cd backend</div>
                  <div className="text-green-400">uv run --python 3.13 --with requests python ads_cli.py store-keys {clientId || 'client_id'} act_123 AD_TOKEN PAGE_ID</div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">📖 Commands</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p><span className="text-foreground font-mono">campaign banao</span> — new campaign create</p>
                  <p><span className="text-foreground font-mono">activate [id]</span> — campaign live karo</p>
                  <p><span className="text-foreground font-mono">pause [id]</span> — campaign rok do</p>
                  <p><span className="text-foreground font-mono">performance [id]</span> — stats dekho</p>
                  <p><span className="text-foreground font-mono">research ecommerce 30000</span> — research karo</p>
                  <p><span className="text-foreground font-mono">adcopy fitness brand</span> — ad copy banao</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Campaign List (only visible in campaign tab) */}
      {(tab === 'campaigns' || tab === 'settings') && (
        <div className="hidden md:flex md:flex-1 md:min-h-0 md:flex-col">
          {tab === 'campaigns' && (
            <>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 shrink-0">Active Campaigns</h4>
              <div className="flex-1 overflow-y-auto scrollbar-auto-hide space-y-2">
                <p className="text-xs text-muted-foreground text-center pt-8">No campaigns yet. Chat mein campain banao.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Setup wizard modal */}
      {showSetup && <ServerSetupWizard onClose={() => setShowSetup(false)} />}
    </div>
  )
}
