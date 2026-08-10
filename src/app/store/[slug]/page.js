'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Store, ShoppingBag, LogIn, LogOut, Plus, Trash2, Save, Pencil, X,
  Loader2, Rocket, TrendingUp, Users, CalendarCheck, RefreshCw, KeyRound,
} from 'lucide-react'

/* ─── Client Storefront ─────────────────────────────────────────────────────
   Public page at /store/[slug]. Client logs in with email/password (created
   by the agency), manages products, sees SBA sales stats, and can publish
   their store to the live website. No agency UI here.                    */

const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/40 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors'
const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'
const cardCls = 'rounded-xl border border-border bg-card shadow-sm'
const emptyProduct = { name: '', description: '', price: '', compare_at: '', image_url: '', category: '', sku: '', stock: 0, active: true }

export default function StorefrontPage() {
  const params = useParams()
  const slug = (params?.slug || '').toString().replace(/^ws_/, '')
  const workspace = `ws_${slug}`
  const client = 'Client'

  // auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [account, setAccount] = useState(null)
  const [authMsg, setAuthMsg] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // data
  const [settings, setSettings] = useState(null)
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // editor
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({ ...emptyProduct })
  const [saving, setSaving] = useState(false)

  // publish
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')

  const authHeaders = token ? { 'X-Store-Token': token } : {}

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const q = `workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`
      const [pubRes, salesRes] = await Promise.all([
        fetch(`/api/store/public?${q}`),
        fetch(`/api/store/sales?${q}`),
      ])
      const pub = await pubRes.json()
      if (!pubRes.ok) throw new Error(pub?.detail || 'Store load failed')
      setSettings(pub.settings || null)
      setProducts(pub.products || [])
      const sd = await salesRes.json().catch(() => null)
      setSales(sd && !sd.detail ? sd : null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [workspace, client])

  useEffect(() => { load() }, [load])

  // restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`store_token_${workspace}`)
      if (saved) { setToken(saved); loadWithToken(saved) }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace])

  async function loadWithToken(tok) {
    try {
      const me = await fetch(`/api/store/client/me?workspace=${encodeURIComponent(workspace)}`, {
        headers: { 'X-Store-Token': tok },
      })
      if (me.ok) { setAccount(await me.json()); await load() }
      else setToken('')
    } catch { setToken('') }
  }

  async function login(e) {
    e?.preventDefault()
    if (!email || !password) { setAuthMsg('Email aur password daalo'); return }
    setLoggingIn(true); setAuthMsg('')
    try {
      const res = await fetch('/api/store/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace, client, email, password }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.detail || 'Login failed')
      setToken(d.token); setAccount(d.account); setEmail(''); setPassword('')
      try { localStorage.setItem(`store_token_${workspace}`, d.token) } catch { /* ignore */ }
      await load()
    } catch (e) {
      setAuthMsg(`❌ ${e.message}`)
    } finally {
      setLoggingIn(false)
    }
  }

  function logout() {
    setToken(''); setAccount(null)
    try { localStorage.removeItem(`store_token_${workspace}`) } catch { /* ignore */ }
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      ...opts,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.detail || `API ${res.status}`)
    return data
  }

  function startEdit(p) {
    setEditing(p?.id || 'new')
    setDraft(p ? { ...emptyProduct, ...p } : { ...emptyProduct })
  }

  async function saveProduct() {
    setSaving(true); setError('')
    try {
      if (editing === 'new') {
        await api('/api/store/products', { method: 'POST', body: JSON.stringify({ workspace, client, product: draft }) })
      } else {
        await api(`/api/store/products/${editing}`, { method: 'PATCH', body: JSON.stringify({ workspace, client, data: draft }) })
      }
      setEditing(null)
      await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function deleteProduct(pid) {
    if (!window.confirm('Is product ko delete karna hai?')) return
    try {
      await api(`/api/store/products/${pid}?workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`, { method: 'DELETE' })
      await load()
    } catch (e) { setError(e.message) }
  }

  async function publish() {
    setPublishing(true); setPublishMsg('')
    try {
      const d = await api('/api/store/sync', { method: 'POST', body: JSON.stringify({ workspace, client, deploy: true }) })
      setPublishMsg(d?.url ? `✅ Live: ${d.url}` : (d?.message || '✅ Published'))
    } catch (e) { setPublishMsg(`❌ ${e.message}`) } finally { setPublishing(false) }
  }

  const storeName = settings?.store_name || settings?.name || 'My Store'
  const tagline = settings?.tagline || ''

  const stats = [
    { label: 'Total Leads', value: sales?.leads ?? '—', icon: Users },
    { label: 'Contacted', value: sales?.contacted ?? '—', icon: ShoppingBag },
    { label: 'Hot Leads', value: sales?.hot ?? '—', icon: TrendingUp },
    { label: 'Meetings', value: sales?.meetings ?? '—', icon: CalendarCheck },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0"><Store className="size-4 text-accent" /></div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{storeName}</div>
              <div className="text-[10px] text-muted-foreground truncate">Client Store · {workspace}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {account ? (
              <>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">{account.name || account.email}</span>
                <button onClick={logout} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] border border-border hover:bg-muted transition-colors">
                  <LogOut className="size-3" /> Logout
                </button>
              </>
            ) : (
              <button onClick={() => document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] border border-accent/40 text-accent hover:bg-accent/10 transition-colors">
                <LogIn className="size-3" /> Client Login
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</div>}

        {!account && (
          <section id="login-form" className={`${cardCls} p-5`}>
            <div className="flex items-center gap-2 mb-1"><KeyRound className="size-4 text-accent" /><h2 className="text-sm font-semibold">Client Login</h2></div>
            <p className="text-xs text-muted-foreground mb-3">Agency ne jo account banaya hai usi email/password se login karo. Login ke baad products add/edit kar sakte ho aur publish kar sakte ho.</p>
            <form onSubmit={login} className="grid sm:grid-cols-3 gap-3">
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
              <input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
              <button type="submit" disabled={loggingIn}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors">
                {loggingIn ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />} Login
              </button>
            </form>
            {authMsg && <div className="text-xs mt-2 text-muted-foreground">{authMsg}</div>}
          </section>
        )}

        {/* Sales stats */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Aapke Sales Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className={`${cardCls} p-4`}>
                <div className="flex items-center gap-2 mb-1"><s.icon className="size-3.5 text-accent" /><span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span></div>
                <div className="text-xl font-bold">{s.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Publish */}
        {account && (
          <section className={`${cardCls} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2"><Rocket className="size-4 text-accent" /> Publish to Live Website</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Website agent aapke store ke products ke saath live site rebuild + deploy karta hai.</p>
                {publishMsg && <div className="text-xs text-accent mt-1 break-all">{publishMsg}</div>}
              </div>
              <button onClick={publish} disabled={publishing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors">
                {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />} {publishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </section>
        )}

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products ({products.length})</h2>
            {account && (
              <button onClick={() => startEdit(null)} disabled={!!editing}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] border border-accent/40 text-accent hover:bg-accent/10 transition-colors">
                <Plus className="size-3" /> Add Product
              </button>
            )}
          </div>

          {loading && <div className="text-center py-10 text-sm text-muted-foreground">Loading store...</div>}
          {!loading && products.length === 0 && !editing && (
            <div className={`${cardCls} p-8 text-center text-sm text-muted-foreground`}>Abhi koi product nahi hai. {account ? 'Add Product se pehla product add karo.' : 'Login karke products add karo.'}</div>
          )}

          {/* Editor */}
          {editing && account && (
            <div className={`${cardCls} p-5 mb-4 space-y-3 border-accent/40`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{editing === 'new' ? 'New Product' : 'Edit Product'}</h3>
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><span className={labelCls}>Name *</span><input className={inputCls + ' mt-1'} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Product name" /></div>
                <div className="sm:col-span-2"><span className={labelCls}>Description</span><textarea className={inputCls + ' mt-1 min-h-16'} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Short description" /></div>
                <div><span className={labelCls}>Price</span><input className={inputCls + ' mt-1'} value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} placeholder="₹499" /></div>
                <div><span className={labelCls}>Compare at (MRP)</span><input className={inputCls + ' mt-1'} value={draft.compare_at} onChange={e => setDraft({ ...draft, compare_at: e.target.value })} placeholder="₹999" /></div>
                <div className="sm:col-span-2"><span className={labelCls}>Image URL</span><input className={inputCls + ' mt-1'} value={draft.image_url} onChange={e => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." /></div>
                <div><span className={labelCls}>Category</span><input className={inputCls + ' mt-1'} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="e.g. Menswear" /></div>
                <div><span className={labelCls}>Stock</span><input type="number" className={inputCls + ' mt-1'} value={draft.stock ?? 0} onChange={e => setDraft({ ...draft, stock: parseInt(e.target.value || '0', 10) })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-md text-xs border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={saveProduct} disabled={saving || !draft.name.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save
                </button>
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className={`${cardCls} overflow-hidden flex flex-col`}>
                {p.image_url ? (
                  <div className="aspect-[4/3] bg-muted/40"><img src={p.image_url} alt={p.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} /></div>
                ) : (
                  <div className="aspect-[4/3] bg-muted/40 flex items-center justify-center"><ShoppingBag className="size-8 text-muted-foreground/40" /></div>
                )}
                <div className="p-4 flex-1 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
                    <span className={`text-xs font-bold shrink-0 ${p.compare_at ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{p.price ? `₹${p.price}` : ''}</span>
                  </div>
                  {p.compare_at && <div className="text-xs font-bold text-emerald-500">₹{p.price} <span className="line-through text-muted-foreground font-normal">₹{p.compare_at}</span></div>}
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${Number(p.stock) > 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>
                      {Number(p.stock) > 0 ? 'In stock' : 'Out of stock'}
                    </span>
                    {account && (
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(p)} className="p-1 rounded-md hover:bg-muted text-muted-foreground" title="Edit"><Pencil className="size-3.5" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1 rounded-md hover:bg-muted text-red-500" title="Delete"><Trash2 className="size-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center text-[10px] text-muted-foreground/60 pb-6">
          Powered by Agency OS · {workspace} store
        </footer>
      </div>
    </main>
  )
}
