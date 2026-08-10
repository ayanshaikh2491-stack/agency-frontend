'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bot, MessageSquare, Send, Globe, Layout, Rocket,
  Palette, Sparkles, Loader2, CheckCircle2, XCircle,
  AlertCircle, ExternalLink, RefreshCw, FileCode2,
  Server, Wrench, ChevronRight, Copy, Globe2, Link2,
  ShieldCheck, Clock, Zap, Eye, Store as StoreIcon,
} from 'lucide-react'
import PageShell from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StoreTab from './StoreTab'

/* ─── Categories (mirror backend WEBSITE_CATEGORIES) ─── */
const CATEGORIES = [
  { id: 'business', label: 'Business / Corporate' },
  { id: 'portfolio', label: 'Portfolio / Creative' },
  { id: 'restaurant', label: 'Restaurant / Cafe' },
  { id: 'ecommerce', label: 'E-commerce / Shop' },
  { id: 'saas', label: 'SaaS / Tech Product' },
  { id: 'agency', label: 'Agency / Studio' },
  { id: 'realestate', label: 'Real Estate' },
  { id: 'blog', label: 'Blog / News' },
  { id: 'education', label: 'Education / Coaching' },
  { id: 'health', label: 'Health / Clinic / Fitness' },
  { id: 'event', label: 'Event / Wedding' },
  { id: 'hotel', label: 'Hotel / Travel' },
  { id: 'construction', label: 'Construction / Trades' },
  { id: 'nonprofit', label: 'Nonprofit / Charity' },
]

const STYLES = ['modern', 'minimal', 'bold', 'warm', 'tech']
const FRAMEWORKS = ['nextjs', 'html']
const SECTIONS = ['hero', 'services', 'about', 'stats', 'testimonials', 'contact', 'footer']

const PALETTES = {
  modern: '#2563EB', minimal: '#000000', bold: '#DC2626',
  warm: '#D97706', tech: '#7C3AED',
}

/* ─── Small helpers ─── */
function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-[10px] text-muted-foreground/60 mt-1 block">{hint}</span>}
    </label>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors'

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
      className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function StatusPill({ status }) {
  const map = {
    deployed: { label: 'Deployed', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
    connected: { label: 'Connected', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
    verified: { label: 'Verified', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
    pending: { label: 'Pending DNS', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
    building: { label: 'Building...', cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
    failed: { label: 'Failed', cls: 'bg-red-500/15 text-red-500 border-red-500/30' },
    built: { label: 'Built', cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  }
  const s = map[status] || { label: status || 'Unknown', cls: 'bg-muted text-muted-foreground border-border' }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${s.cls}`}>{s.label}</span>
}

/* ═══════════════════════════════════════════════
   Website Agent — Real Website Builder UI
   ═══════════════════════════════════════════════ */
export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState('chat')
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('checking') // checking | online | offline
  const [tools, setTools] = useState([])
  const [skills, setSkills] = useState([])
  const chatEndRef = useRef(null)

  /* ─── Build form state ─── */
  const [form, setForm] = useState({
    title: '', tagline: '', category: 'business', style: 'modern',
    framework: 'nextjs', sections: '',
    color_primary: '#2563EB', services: '', business_email: '',
    project_name: '',
  })
  const [buildResult, setBuildResult] = useState(null)
  const [buildPhase, setBuildPhase] = useState('idle') // idle | running | done | error

  /* ─── Publish state ─── */
  const [publishResult, setPublishResult] = useState(null)
  const [publishPhase, setPublishPhase] = useState('idle')

  /* ─── Domain state ─── */
  const [domainProject, setDomainProject] = useState('')
  const [domainName, setDomainName] = useState('')
  const [domainResult, setDomainResult] = useState(null)
  const [domainPhase, setDomainPhase] = useState('idle')

  /* ─── Check agent status ─── */
  useEffect(() => {
    fetch('/api/website/tools')
      .then(r => r.json())
      .then(d => {
        setTools(Array.isArray(d?.tools) ? d.tools : [])
        setStatus('online')
      })
      .catch(() => setStatus('offline'))
    fetch('/api/website/skills')
      .then(r => r.json())
      .then(d => setSkills(Array.isArray(d?.data?.skills) ? d.data.skills : []))
      .catch(() => {})
  }, [])

  /* ─── Auto-scroll chat ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  /* ─── Chat ─── */
  async function send() {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setChat(c => [...c, { role: 'user', content: msg }])
    setSending(true)
    try {
      const res = await fetch('/api/website/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, workspace_name: 'Default', client_name: 'Client' }),
      })
      const d = await res.json()
      setChat(c => [...c, { role: 'assistant', content: d?.response || d?.message || JSON.stringify(d) }])
    } catch (e) {
      setChat(c => [...c, { role: 'assistant', content: `❌ Error: ${e.message}` }])
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  /* ─── Build site ─── */
  async function handleBuild() {
    if (!form.title.trim()) { alert('Title required'); return }
    setBuildPhase('running'); setBuildResult(null)
    try {
      const res = await fetch('/api/website/build-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, tagline: form.tagline, industry: form.category,
          category: form.category,
          sections: form.sections, style: form.style, color_primary: form.color_primary,
          framework: form.framework, services: form.services, business_email: form.business_email,
          workspace_id: 'ws_agency', client_name: form.title,
        }),
      })
      const d = await res.json()
      if (d?.error) { setBuildResult({ error: d.error, output: d }); setBuildPhase('error') }
      else { setBuildResult(d); setBuildPhase('done') }
    } catch (e) {
      setBuildResult({ error: e.message }); setBuildPhase('error')
    }
  }

  /* ─── Publish (build + deploy) ─── */
  async function handlePublish() {
    if (!form.title.trim()) { alert('Title required'); return }
    setPublishPhase('running'); setPublishResult(null)
    try {
      const res = await fetch('/api/website/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, tagline: form.tagline, industry: form.category,
          category: form.category,
          sections: form.sections, style: form.style, color_primary: form.color_primary,
          framework: form.framework, services: form.services, business_email: form.business_email,
          project_name: form.project_name || undefined,
          workspace_id: 'ws_agency', client_name: form.title, prod: true,
        }),
      })
      const d = await res.json()
      if (d?.error) { setPublishResult({ error: d.error, ...d }); setPublishPhase('error') }
      else { setPublishResult(d); setPublishPhase('done') }
    } catch (e) {
      setPublishResult({ error: e.message }); setPublishPhase('error')
    }
  }

  /* ─── Connect domain ─── */
  async function handleDomainConnect() {
    if (!domainProject.trim() || !domainName.trim()) { alert('Project + domain required'); return }
    setDomainPhase('running'); setDomainResult(null)
    try {
      const res = await fetch('/api/website/domain/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: domainProject.trim(), domain: domainName.trim() }),
      })
      const d = await res.json()
      if (d?.error) { setDomainResult({ error: d.error, ...d }); setDomainPhase('error') }
      else { setDomainResult(d); setDomainPhase('done') }
    } catch (e) {
      setDomainResult({ error: e.message }); setDomainPhase('error')
    }
  }

  async function handleDomainStatus() {
    if (!domainProject.trim() || !domainName.trim()) { alert('Project + domain required'); return }
    setDomainPhase('checking')
    try {
      const res = await fetch(`/api/website/domain/status?project=${encodeURIComponent(domainProject.trim())}&domain=${encodeURIComponent(domainName.trim())}`)
      const d = await res.json()
      setDomainResult(prev => ({ ...prev, status_check: d }))
    } catch (e) {
      setDomainResult(prev => ({ ...prev, status_check: { error: e.message } }))
    }
    setDomainPhase('done')
  }

  /* ─── Site form (shared) ─── */
  const SiteForm = ({ compact = false }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Site Title *">
        <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Sharma & Sons Traders" />
      </Field>
      <Field label="Tagline">
        <input className={inputCls} value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })}
          placeholder="e.g. Quality products since 1995" />
      </Field>
      <Field label="Category">
        <select className={inputCls} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Style">
        <select className={inputCls} value={form.style} onChange={e => setForm({ ...form, style: e.target.value, color_primary: PALETTES[e.target.value] || form.color_primary })}>
          {STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Primary Color">
        <div className="flex items-center gap-2">
          <input type="color" value={form.color_primary} onChange={e => setForm({ ...form, color_primary: e.target.value })}
            className="h-10 w-12 rounded-md border border-border bg-transparent cursor-pointer" />
          <input className={inputCls} value={form.color_primary} onChange={e => setForm({ ...form, color_primary: e.target.value })} />
        </div>
      </Field>
      <Field label="Framework">
        <select className={inputCls} value={form.framework} onChange={e => setForm({ ...form, framework: e.target.value })}>
          {FRAMEWORKS.map(f => <option key={f} value={f}>{f === 'nextjs' ? 'Next.js (React)' : 'Static HTML'}</option>)}
        </select>
      </Field>
      <Field label="Services / Offerings (comma separated)" hint="Blank = category defaults">
        <input className={inputCls} value={form.services} onChange={e => setForm({ ...form, services: e.target.value })}
          placeholder="e.g. Consulting, Installation, Support" />
      </Field>
      <Field label="Business Email">
        <input className={inputCls} value={form.business_email} onChange={e => setForm({ ...form, business_email: e.target.value })}
          placeholder="contact@business.com" />
      </Field>
      {!compact && (
        <div className="md:col-span-2">
          <Field label="Sections (comma separated)" hint="Leave default for category page map">
            <input className={inputCls} value={form.sections} onChange={e => setForm({ ...form, sections: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  )

  /* ─── Chat tab ─── */
  const renderChat = () => (
    <div className="flex-1 flex gap-4 min-h-0">
      <div className="flex-1 flex flex-col border border-border rounded-lg bg-card min-w-0">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
          <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bot className="size-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">Website Agent — AI Web Developer</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              {status === 'online' ? 'AI Online · Build · Publish · Domain' : status === 'offline' ? 'Backend offline' : 'Checking...'}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            {tools.length} tools
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {chat.length === 0 && (
            <div className="text-center py-12">
              <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="size-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Website Agent — Website Design and Development</p>
              <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                Main aapka AI web developer. Batao kya banana hai — landing page, e-commerce, portfolio,
                restaurant, SaaS... Main code likhta hoon, Vercel pe deploy karta hoon, aur domain connect karta hoon.
              </p>
              <div className="max-w-md mx-auto grid grid-cols-1 gap-1.5">
                {[
                  '🌐 "Ek restaurant website banao Delhi ke liye"',
                  '🚀 "Business site banao aur deploy karo Vercel pe"',
                  '🛒 "E-commerce store banao — title: ShopKart"',
                  '🎨 "Portfolio site banao modern style me"',
                  '🔗 "Mera domain example.com connect karo"',
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(cmd); setActiveTab('chat') }}
                    className="text-left text-[11px] text-muted-foreground px-3 py-1.5 border border-border/60 rounded-md hover:border-accent/30 hover:bg-accent/5 transition-colors"
                  >
                    {cmd}
                  </button>
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
              <div className={c.role === 'user'
                ? 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground whitespace-pre-wrap'
                : 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground whitespace-pre-wrap'}>
                {c.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3 animate-pulse" /> Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-border p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Batao kya website banana hai..."
              className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
            />
            <Button onClick={send} disabled={sending || !input.trim()} size="sm">
              {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              <span className="ml-1.5">Send</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 shrink-0 hidden lg:flex flex-col gap-3 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <Server className="size-3" /> Agent Status
          </h4>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-foreground">{status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking...'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
            Backend: /api/website/* · 14 site categories · Vercel deploy · Domain connect
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <Wrench className="size-3" /> Available Tools ({tools.length})
          </h4>
          <div className="space-y-1.5">
            {tools.map(t => (
              <div key={t.name} className="flex items-start gap-2 text-[11px]">
                <ChevronRight className="size-3 text-accent mt-0.5 shrink-0" />
                <span className="text-foreground font-mono text-[10px] break-all">{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <Palette className="size-3" /> Skills ({skills.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {skills.map(s => (
              <span key={typeof s === 'string' ? s : s?.name} className="px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent border border-accent/20">
                {typeof s === 'string' ? s : s?.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  /* ─── Builder tab ─── */
  const renderBuilder = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layout className="size-4 text-accent" /> Website Builder
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Business info do, main pura multi-page website generate karta hoon — 14 categories, har ek ke apne pages aur content ke saath.
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-5 space-y-4">
          <SiteForm />
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleBuild} disabled={buildPhase === 'running'}>
              {buildPhase === 'running' ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileCode2 className="size-4 mr-2" />}
              {buildPhase === 'running' ? 'Building...' : 'Build Website'}
            </Button>
            {buildPhase === 'done' && <Badge variant="outline" className="text-emerald-500">✅ Code generated</Badge>}
            {buildPhase === 'error' && <Badge variant="outline" className="text-red-500">❌ Failed</Badge>}
          </div>
        </div>

        {buildResult && (
          <div className="border border-border rounded-lg bg-card p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Build Result</h4>
            {buildResult.error && <p className="text-xs text-red-500 mb-2">{String(buildResult.error)}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {buildResult.output_dir && (
                <div className="bg-muted/30 rounded-md p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Project path</div>
                    <div className="font-mono text-foreground break-all">{buildResult.output_dir}</div>
                  </div>
                  <CopyBtn text={buildResult.output_dir} />
                </div>
              )}
              {buildResult.pages && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Pages ({buildResult.pages.length})</div>
                  <div className="text-foreground font-mono">{buildResult.pages.join(', ')}</div>
                </div>
              )}
              {buildResult.category && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Category</div>
                  <div className="text-foreground capitalize">{buildResult.category}</div>
                </div>
              )}
              {buildResult.framework && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Framework</div>
                  <div className="text-foreground capitalize">{buildResult.framework}</div>
                </div>
              )}
              {buildResult.style && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Style</div>
                  <div className="text-foreground capitalize">{buildResult.style}</div>
                </div>
              )}
              {buildResult.persisted && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Persisted</div>
                  <div className="text-foreground font-mono">{buildResult.persisted.workspace}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /* ─── Publish tab ─── */
  const renderPublish = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Rocket className="size-4 text-accent" /> Publish to Vercel
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Ek click me: build → deploy → live URL. Vercel CLI session se deploy hota hai (token ki zaroorat nahi).
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-5 space-y-4">
          <SiteForm compact />
          <Field label="Vercel Project Name (optional)" hint="Blank = auto project name">
            <input className={inputCls} value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })}
              placeholder="e.g. my-business-site" />
          </Field>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handlePublish} disabled={publishPhase === 'running'} variant={publishPhase === 'running' ? 'outline' : 'default'}>
              {publishPhase === 'running' ? <Loader2 className="size-4 animate-spin mr-2" /> : <Rocket className="size-4 mr-2" />}
              {publishPhase === 'running' ? 'Building + Deploying...' : 'Publish Live'}
            </Button>
            {publishPhase === 'done' && publishResult?.live_url && (
              <a href={publishResult.live_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-500 hover:underline">
                <ExternalLink className="size-3.5" /> {publishResult.live_url}
              </a>
            )}
            {publishPhase === 'error' && <Badge variant="outline" className="text-red-500">Failed</Badge>}
          </div>
        </div>

        {publishResult && (
          <div className="border border-border rounded-lg bg-card p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Deploy Result</h4>
            {publishResult.error && <p className="text-xs text-red-500 mb-2">{String(publishResult.error)}</p>}
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <StatusPill status={publishResult.status} />
              {publishResult.live_url && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Globe className="size-3.5 text-accent" />
                  <a href={publishResult.live_url} target="_blank" rel="noreferrer" className="text-accent hover:underline font-mono">
                    {publishResult.live_url}
                  </a>
                  <CopyBtn text={publishResult.live_url} />
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {publishResult.project_name && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Project</div>
                  <div className="text-foreground font-mono break-all">{publishResult.project_name}</div>
                </div>
              )}
              {publishResult.status && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Status</div>
                  <div className="text-foreground capitalize">{publishResult.status}</div>
                </div>
              )}
              {publishResult.deploy_time_seconds != null && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Deploy time</div>
                  <div className="text-foreground">{publishResult.deploy_time_seconds}s</div>
                </div>
              )}
              {publishResult.deployed_at && (
                <div className="bg-muted/30 rounded-md p-2.5">
                  <div className="text-[10px] text-muted-foreground">Deployed at</div>
                  <div className="text-foreground">{publishResult.deployed_at}</div>
                </div>
              )}
            </div>
            {publishResult.output && (
              <details className="mt-3">
                <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">Deploy output</summary>
                <pre className="mt-2 text-[10px] font-mono text-muted-foreground bg-muted/30 rounded-md p-3 overflow-x-auto max-h-60 whitespace-pre-wrap">{publishResult.output}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )

  /* ─── Domain tab ─── */
  const renderDomain = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe2 className="size-4 text-accent" /> Domain Connect
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Custom domain ko Vercel project pe attach karo. DNS records milenge jo registrar pe add karne hain.
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Vercel Project Name *">
              <input className={inputCls} value={domainProject} onChange={e => setDomainProject(e.target.value)}
                placeholder="e.g. my-business-site" />
            </Field>
            <Field label="Domain *" hint="example.com ya www.example.com">
              <input className={inputCls} value={domainName} onChange={e => setDomainName(e.target.value)}
                placeholder="e.g. mybusiness.com" />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleDomainConnect} disabled={domainPhase === 'running'}>
              {domainPhase === 'running' ? <Loader2 className="size-4 animate-spin mr-2" /> : <Link2 className="size-4 mr-2" />}
              {domainPhase === 'running' ? 'Connecting...' : 'Connect Domain'}
            </Button>
            <Button onClick={handleDomainStatus} variant="outline" disabled={domainPhase === 'checking'}>
              <RefreshCw className={`size-4 mr-2 ${domainPhase === 'checking' ? 'animate-spin' : ''}`} />
              Check Status
            </Button>
          </div>
        </div>

        {domainResult && (
          <div className="space-y-4">
            {domainResult.error && (
              <div className="border border-red-500/30 rounded-lg bg-red-500/5 p-4">
                <p className="text-xs text-red-500 flex items-center gap-2"><XCircle className="size-4" /> {String(domainResult.error)}</p>
              </div>
            )}

            {domainResult.status && (
              <div className="border border-border rounded-lg bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <StatusPill status={domainResult.status} />
                  <span className="text-xs font-mono text-foreground">{domainResult.domain}</span>
                  <span className="text-[10px] text-muted-foreground">→ {domainResult.project} ({domainResult.mode})</span>
                </div>

                {domainResult.dns_records?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      DNS Records — registrar pe add karo
                    </h4>
                    <div className="overflow-x-auto border border-border rounded-md">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Type</th>
                            <th className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Name</th>
                            <th className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Value</th>
                            <th className="px-3 py-2 text-[10px] uppercase text-muted-foreground">TTL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {domainResult.dns_records.map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">
                                <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono text-[10px]">{r.type}</span>
                              </td>
                              <td className="px-3 py-2 font-mono">{r.name}</td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{r.value}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.ttl}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{domainResult.dns_records[0]?.purpose}</p>
                  </div>
                )}

                {domainResult.next_steps?.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Next steps</h4>
                    <ol className="space-y-1.5">
                      {domainResult.next_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="size-4 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] shrink-0 mt-px">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {domainResult.status_check && (
              <div className="border border-border rounded-lg bg-card p-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status Check</h4>
                {domainResult.status_check.error ? (
                  <p className="text-xs text-red-500">{String(domainResult.status_check.error)}</p>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusPill status={domainResult.status_check.status} />
                    {domainResult.status_check.misconfigured != null && (
                      <span className="text-xs text-muted-foreground">
                        Misconfigured: {domainResult.status_check.misconfigured ? 'Yes' : 'No'}
                      </span>
                    )}
                    {domainResult.status_check.checked_at && (
                      <span className="text-[10px] text-muted-foreground">Checked {domainResult.status_check.checked_at}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  /* ─── Tabs ─── */
  const TABS = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'builder', label: 'Builder', icon: Layout },
    { id: 'publish', label: 'Publish', icon: Rocket },
    { id: 'domain', label: 'Domain', icon: Globe2 },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'store', label: 'Store', icon: StoreIcon },
  ]

  /* ─── Tools tab ─── */
  const renderTools = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wrench className="size-4 text-accent" /> Website Agent Tools
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Saare backend tools jo Website Agent use karta hai.</p>
        </div>

        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tools ({tools.length})</h3>
          </div>
          <div className="divide-y divide-border/60">
            {tools.map(t => (
              <div key={t.name} className="px-4 py-3 flex items-start gap-3">
                <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Wrench className="size-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground font-mono text-xs">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.description}</div>
                </div>
              </div>
            ))}
            {tools.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No tools (backend offline?)</div>}
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills ({skills.length})</h3>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={typeof s === 'string' ? s : s?.name} className="px-2.5 py-1 rounded-full text-[11px] bg-accent/10 text-accent border border-accent/20">
                {typeof s === 'string' ? s : s?.name}
              </span>
            ))}
            {skills.length === 0 && <div className="text-sm text-muted-foreground">No skills loaded</div>}
          </div>
        </div>
      </div>
    </div>
  )

  /* ═══ Render ═══ */
  return (
    <PageShell>
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2">
            <Bot className="size-5" />
            Website Agent - Website Design and Development
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'} mr-1.5`} />
            {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : '...'}
          </Badge>
        </div>
        <div className="topbar-actions">
          <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => { setStatus('checking'); fetch('/api/website/tools').then(r => r.json()).then(d => { setTools(Array.isArray(d?.tools) ? d.tools : []); setStatus('online') }).catch(() => setStatus('offline')) }}>
            <RefreshCw className="size-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-border/60">
        {TABS.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <TabIcon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'builder' && renderBuilder()}
        {activeTab === 'publish' && renderPublish()}
        {activeTab === 'domain' && renderDomain()}
        {activeTab === 'tools' && renderTools()}
        {activeTab === 'store' && <StoreTab />}
      </div>
    </PageShell>
  )
}
