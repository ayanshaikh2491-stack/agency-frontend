'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Store, ShoppingBag, LogIn, LogOut, Plus, Trash2, Save, Pencil, X,
  Loader2, Rocket, TrendingUp, KeyRound,
  Eye, EyeOff, Mail, Lock, Package, AlertCircle, CheckCircle2,
} from 'lucide-react'

/* ─── Client Storefront ─────────────────────────────────────────────────────
   Public page at /store/[slug]. Visitors see a clean storefront. The store
   owner logs in (account created by the agency) to manage products, view
   real sales stats (revenue, orders, units), and publish to the live
   website. No agency UI.                                               */

const cardCls = 'rounded-2xl border border-border bg-card shadow-sm'
const inputCls = 'w-full pl-9 pr-3 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all'
const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'
const emptyProduct = { name: '', description: '', price: '', compare_at: '', image_url: '', category: '', sku: '', stock: 0, active: true }

function discountPct(price, compare) {
  const p = parseFloat(String(price).replace(/[^0-9.]/g, ''))
  const c = parseFloat(String(compare).replace(/[^0-9.]/g, ''))
  if (!p || !c || c <= p) return null
  return Math.round(((c - p) / c) * 100)
}

function currency(s) {
  return `₹${String(s ?? '').replace(/[^0-9.]/g, '') || '—'}`
}

export default function StorefrontPage() {
  const params = useParams()
  const slug = (params?.slug || '').toString().replace(/^ws_/, '')
  const workspace = `ws_${slug}`
  const client = 'Client'

  // auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [token, setToken] = useState('')
  const [account, setAccount] = useState(null)
  const [authMsg, setAuthMsg] = useState('')
  const [authError, setAuthError] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

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
  const [publishOk, setPublishOk] = useState(false)

  // category filter
  const [catFilter, setCatFilter] = useState('')

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
    if (!email || !password) { setAuthMsg('Email aur password daalo'); setAuthError(true); return }
    setLoggingIn(true); setAuthMsg(''); setAuthError(false)
    try {
      const res = await fetch('/api/store/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace, client, email, password }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.detail || 'Login failed')
      setToken(d.token); setAccount(d.account); setEmail(''); setPassword('')
      setLoginOpen(false); setAuthMsg('')
      try { localStorage.setItem(`store_token_${workspace}`, d.token) } catch { /* ignore */ }
      await load()
    } catch (e) {
      setAuthMsg(e.message); setAuthError(true)
    } finally {
      setLoggingIn(false)
    }
  }

  function logout() {
    setToken(''); setAccount(null); setLoginOpen(false)
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
    setPublishing(true); setPublishMsg(''); setPublishOk(false)
    try {
      const d = await api('/api/store/sync', { method: 'POST', body: JSON.stringify({ workspace, client, deploy: true }) })
      setPublishMsg(d?.url ? `Live: ${d.url}` : (d?.message || 'Store published'))
      setPublishOk(true)
    } catch (e) { setPublishMsg(e.message); setPublishOk(false) } finally { setPublishing(false) }
  }

  const storeName = settings?.store_name || settings?.name || 'My Store'
  const tagline = settings?.tagline || 'Shop our latest collection'
  const accent = settings?.color_primary || '#2563EB'

  const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
  const visible = catFilter ? products.filter(p => p.category === catFilter) : products

  const cur = settings?.currency || '₹'
  const fmtMoney = v => `${cur}${Number(v || 0).toLocaleString('en-IN')}`
  const stats = [
    { label: 'Revenue', value: fmtMoney(sales?.revenue ?? 0), icon: TrendingUp },
    { label: 'Orders', value: sales?.orders ?? 0, icon: ShoppingBag },
    { label: 'Units Sold', value: sales?.units ?? 0, icon: Package },
    { label: 'Top Product', value: sales?.top_product?.name || '—', icon: Rocket, small: true },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Top bar ── */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: accent }}>
              <Store className="size-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{storeName}</div>
              <div className="text-[10px] text-muted-foreground truncate">Official Store</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {account ? (
              <>
                <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">{account.name || account.email}</span>
                <button onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border hover:bg-muted hover:text-foreground transition-colors">
                  <LogOut className="size-3" /> Logout
                </button>
              </>
            ) : (
              <button onClick={() => setLoginOpen(v => !v)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                style={{ backgroundColor: accent }}>
                <LogIn className="size-3" /> Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="border-b border-border/40" style={{ background: `linear-gradient(135deg, ${accent}14, ${accent}05 60%, transparent)` }}>
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 flex flex-col items-center text-center">
          <div className="size-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg" style={{ backgroundColor: accent }}>
            <Store className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{storeName}</h1>
          {tagline && <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">{tagline}</p>}
          <div className="flex items-center gap-2 mt-5">
            <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card/60">{products.length} Products</span>
            {sales && (
              <>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card/60">{sales.orders ?? 0} Orders</span>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card/60">{fmtMoney(sales.revenue ?? 0)} Revenue</span>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── Login card (owner only) ── */}
        {!account && loginOpen && (
          <section className={`${cardCls} max-w-md mx-auto p-6 sm:p-8`}>
            <div className="text-center mb-6">
              <div className="size-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="size-5 text-accent" />
              </div>
              <h2 className="text-lg font-bold">Store Owner Login</h2>
              <p className="text-xs text-muted-foreground mt-1">Agency ne jo account diya hai usse login karo</p>
            </div>

            <form onSubmit={login} className="space-y-4">
              <div>
                <span className={labelCls}>Email</span>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>
              <div>
                <span className={labelCls}>Password</span>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <input className={inputCls + ' pr-10'} type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {authMsg && (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${authError ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                  {authError ? <AlertCircle className="size-3.5 shrink-0" /> : <CheckCircle2 className="size-3.5 shrink-0" />}
                  {authMsg}
                </div>
              )}

              <button type="submit" disabled={loggingIn}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
                style={{ backgroundColor: accent }}>
                {loggingIn ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                {loggingIn ? 'Logging in...' : 'Login'}
              </button>

              <button type="button" onClick={() => setLoginOpen(false)} className="w-full text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                Cancel
              </button>
            </form>
          </section>
        )}

        {/* ── Owner dashboard (after login) ── */}
        {account && (
          <>
            {/* Welcome strip */}
            <div className={`${cardCls} p-5 flex flex-wrap items-center justify-between gap-3 border-accent/30`}>
              <div>
                <div className="text-sm font-bold">Namaste, {account.name || 'Store Owner'} 👋</div>
                <div className="text-xs text-muted-foreground mt-0.5">Products manage karo, sales dekho, aur live site publish karo.</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border border-border hover:bg-muted transition-colors">
                  <LogOut className="size-3.5" /> Logout
                </button>
              </div>
            </div>

            {/* Sales stats */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Aapke Sales Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(s => (
                  <div key={s.label} className={`${cardCls} p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <s.icon className="size-4 text-accent" />
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
                    </div>
                    <div className={`leading-none truncate ${s.small ? 'text-sm font-bold pt-1' : 'text-2xl font-extrabold'}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Publish */}
            <section className={`${cardCls} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2"><Rocket className="size-4 text-accent" /> Publish to Live Website</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Website agent aapke products ke saath live site rebuild + deploy karta hai.</p>
                  {publishMsg && (
                    <div className={`text-xs mt-2 flex items-center gap-1.5 ${publishOk ? 'text-emerald-500' : 'text-red-500'}`}>
                      {publishOk ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                      <span className="break-all">{publishMsg}</span>
                    </div>
                  )}
                </div>
                <button onClick={publish} disabled={publishing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
                  style={{ backgroundColor: accent }}>
                  {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </section>
          </>
        )}

        {/* ── Products ── */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-extrabold">Our Products</h2>
              <p className="text-xs text-muted-foreground">{visible.length} item{visible.length !== 1 ? 's' : ''}</p>
            </div>
            {account && (
              <button onClick={() => startEdit(null)} disabled={!!editing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: accent }}>
                <Plus className="size-3.5" /> Add Product
              </button>
            )}
          </div>

          {/* Category filter */}
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <button onClick={() => setCatFilter('')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${catFilter === '' ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground'}`}
                style={catFilter === '' ? { backgroundColor: accent } : {}}>
                All
              </button>
              {cats.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${catFilter === c ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  style={catFilter === c ? { backgroundColor: accent } : {}}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className={`${cardCls} overflow-hidden animate-pulse`}>
                  <div className="aspect-[4/3] bg-muted/50" />
                  <div className="p-4 space-y-2"><div className="h-3 w-2/3 bg-muted/50 rounded" /><div className="h-3 w-1/2 bg-muted/50 rounded" /></div>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length === 0 && !editing && (
            <div className={`${cardCls} p-10 text-center`}>
              <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3"><Package className="size-6 text-muted-foreground/40" /></div>
              <div className="text-sm font-medium">Abhi koi product nahi hai</div>
              <div className="text-xs text-muted-foreground mt-1">{account ? 'Add Product se pehla product add karo.' : 'Store owner login karke products add kar sakte hain.'}</div>
            </div>
          )}

          {!loading && visible.length === 0 && products.length > 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">Is category me koi product nahi.</div>
          )}

          {/* Editor */}
          {editing && account && (
            <div className={`${cardCls} p-6 mb-6 space-y-4 border-accent/40`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{editing === 'new' ? 'New Product' : 'Edit Product'}</h3>
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"><X className="size-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><span className={labelCls}>Name *</span><input className={inputCls + ' pl-3 mt-1.5'} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Product name" /></div>
                <div className="sm:col-span-2"><span className={labelCls}>Description</span><textarea className={inputCls + ' pl-3 mt-1.5 min-h-20'} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Short description" /></div>
                <div><span className={labelCls}>Price</span><input className={inputCls + ' pl-3 mt-1.5'} value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} placeholder="₹499" /></div>
                <div><span className={labelCls}>Compare at (MRP)</span><input className={inputCls + ' pl-3 mt-1.5'} value={draft.compare_at} onChange={e => setDraft({ ...draft, compare_at: e.target.value })} placeholder="₹999" /></div>
                <div className="sm:col-span-2"><span className={labelCls}>Image URL</span><input className={inputCls + ' pl-3 mt-1.5'} value={draft.image_url} onChange={e => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." /></div>
                <div><span className={labelCls}>Category</span><input className={inputCls + ' pl-3 mt-1.5'} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="e.g. Menswear" /></div>
                <div><span className={labelCls}>Stock</span><input type="number" className={inputCls + ' pl-3 mt-1.5'} value={draft.stock ?? 0} onChange={e => setDraft({ ...draft, stock: parseInt(e.target.value || '0', 10) })} /></div>
                <div className="sm:col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={!!draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} className="accent-[var(--accent)]" /> Active</label>
                  <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={!!draft.featured} onChange={e => setDraft({ ...draft, featured: e.target.checked })} className="accent-[var(--accent)]" /> Featured</label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={saveProduct} disabled={saving || !draft.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: accent }}>
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save Product
                </button>
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map(p => {
              const off = discountPct(p.price, p.compare_at)
              const inStock = Number(p.stock) > 0
              return (
                <div key={p.id} className={`${cardCls} overflow-hidden flex flex-col group transition-shadow hover:shadow-md`}>
                  <div className="relative aspect-[4/3] bg-muted/40 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" onError={e => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="size-9 text-muted-foreground/30" /></div>
                    )}
                    {off && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: accent }}>
                        {off}% OFF
                      </span>
                    )}
                    {p.featured && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-100 border border-amber-200">
                        ★ Featured
                      </span>
                    )}
                    <span className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${inStock ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                      {inStock ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {p.category && <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">{p.category}</div>}
                        <h3 className="text-sm font-bold leading-snug mt-0.5 line-clamp-1">{p.name}</h3>
                      </div>
                      {account && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="size-3.5" /></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600" title="Delete"><Trash2 className="size-3.5" /></button>
                        </div>
                      )}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                    <div className="flex items-end justify-between mt-auto pt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold">{currency(p.price)}</span>
                        {p.compare_at && <span className="text-[11px] text-muted-foreground/60 line-through">{currency(p.compare_at)}</span>}
                      </div>
                      {inStock && (
                        <span className="text-[9px] text-muted-foreground/60">{p.stock} left</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <footer className="text-center text-[10px] text-muted-foreground/50 pb-8">
          © {new Date().getFullYear()} {storeName} · Powered by Agency OS
        </footer>
      </div>
    </main>
  )
}
