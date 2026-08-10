'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Store, ShoppingBag, Plus, Trash2, RefreshCw, ExternalLink,
  Copy, CheckCircle2, Loader2, Rocket, Link2, KeyRound, TrendingUp,
  Save, Pencil, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

/* ─── Store Tab — Shopify-like client store per workspace ───────────────────
   Agency admin view: store link, product CRUD, client account, sales stats,
   store settings, and publish (rebuild + deploy via Website agent).       */

const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors'
const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'

const DEFAULT_WS = 'ws_agency'
const DEFAULT_CLIENT = 'Client'

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

const emptyProduct = { name: '', description: '', price: '', compare_at: '', image_url: '', category: '', sku: '', stock: 0, active: true }

export default function StoreTab() {
  const [workspace, setWorkspace] = useState(DEFAULT_WS)
  const [client, setClient] = useState(DEFAULT_CLIENT)
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(null)
  const [sales, setSales] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // product editor
  const [editing, setEditing] = useState(null) // product being edited, or 'new'
  const [draft, setDraft] = useState({ ...emptyProduct })
  const [saving, setSaving] = useState(false)

  // account creation
  const [account, setAccount] = useState({ email: '', password: '', name: '' })
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [accountMsg, setAccountMsg] = useState('')

  // settings editor
  const [settingsDraft, setSettingsDraft] = useState('')
  const [showSettingsEditor, setShowSettingsEditor] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // publish
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')

  const storeLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${workspace.replace(/^ws_/, '')}`

  const load = useCallback(async (ws = workspace, cl = client) => {
    setLoading(true); setError('')
    try {
      const [pRes, sRes, salesRes] = await Promise.all([
        fetch(`/api/store/products?workspace=${encodeURIComponent(ws)}&client=${encodeURIComponent(cl)}`),
        fetch(`/api/store/settings?workspace=${encodeURIComponent(ws)}&client=${encodeURIComponent(cl)}`),
        fetch(`/api/store/sales?workspace=${encodeURIComponent(ws)}&client=${encodeURIComponent(cl)}`),
      ])
      if (!pRes.ok) throw new Error(`Products API ${pRes.status}`)
      const p = await pRes.json()
      const s = await sRes.json().catch(() => null)
      const salesData = await salesRes.json().catch(() => null)
      setProducts(Array.isArray(p) ? p : [])
      setSettings(s && !s.detail ? s : null)
      setSales(salesData && !salesData.detail ? salesData : null)
    } catch (e) {
      setError(e.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [workspace, client])

  useEffect(() => { load() }, [load])

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.detail || `API ${res.status}`)
    return data
  }

  function startEdit(p) {
    setEditing(p?.id || 'new')
    setDraft(p ? { ...emptyProduct, ...p, price: p.price ?? '', compare_at: p.compare_at ?? '' } : { ...emptyProduct })
  }

  async function saveProduct() {
    setSaving(true); setError('')
    try {
      if (editing === 'new') {
        await api('/api/store/products', {
          method: 'POST',
          body: JSON.stringify({ workspace, client, product: draft }),
        })
      } else {
        await api(`/api/store/products/${editing}`, {
          method: 'PATCH',
          body: JSON.stringify({ workspace, client, data: draft }),
        })
      }
      setEditing(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(pid) {
    if (!window.confirm('Product delete karna hai?')) return
    try {
      await api(`/api/store/products/${pid}?workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function createAccount() {
    if (!account.email || !account.password) { setAccountMsg('Email + password required'); return }
    setCreatingAccount(true); setAccountMsg('')
    try {
      const d = await api('/api/store/accounts', {
        method: 'POST',
        body: JSON.stringify({ workspace, client, ...account }),
      })
      setAccountMsg(`✅ Account created: ${d?.email || account.email}`)
      setAccount({ email: '', password: '', name: '' })
    } catch (e) {
      setAccountMsg(`❌ ${e.message}`)
    } finally {
      setCreatingAccount(false)
    }
  }

  function openSettingsEditor() {
    setSettingsDraft(settings && typeof settings === 'object' ? JSON.stringify(settings, null, 2) : '{}')
    setShowSettingsEditor(true)
  }

  // form-bound settings
  const s = settings || {}
  const [form, setForm] = useState({ store_name: '', tagline: '', color_primary: '#2563EB', currency: '₹', show_stock: true, contact_email: '', domain: '', category: 'ecommerce', style: 'modern' })
  useEffect(() => { if (settings && typeof settings === 'object') setForm({
    store_name: s.store_name || '', tagline: s.tagline || '', color_primary: s.color_primary || '#2563EB',
    currency: s.currency || '₹', show_stock: s.show_stock !== false, contact_email: s.contact_email || '',
    domain: s.domain || '', category: s.category || 'ecommerce', style: s.style || 'modern',
  }) }, [settings]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveSettingsForm() {
    setSavingSettings(true); setError('')
    try {
      await api('/api/store/settings', {
        method: 'PATCH',
        body: JSON.stringify({ workspace, client, data: form }),
      })
      await load()
    } catch (e) { setError(e.message) } finally { setSavingSettings(false) }
  }

  async function saveSettings() {
    setSavingSettings(true); setError('')
    try {
      let data
      try { data = JSON.parse(settingsDraft || '{}') } catch { throw new Error('Settings JSON invalid') }
      await api('/api/store/settings', {
        method: 'PATCH',
        body: JSON.stringify({ workspace, client, data }),
      })
      setShowSettingsEditor(false)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function publish() {
    setPublishing(true); setPublishMsg('')
    try {
      const d = await api('/api/store/sync', {
        method: 'POST',
        body: JSON.stringify({ workspace, client, deploy: true }),
      })
      setPublishMsg(d?.url ? `✅ Live: ${d.url}` : (d?.message || '✅ Published'))
    } catch (e) {
      setPublishMsg(`❌ ${e.message}`)
    } finally {
      setPublishing(false)
    }
  }

  const stats = [
    { label: 'Products', value: products.length, icon: ShoppingBag },
    { label: 'Leads', value: sales?.leads ?? '—', icon: TrendingUp },
    { label: 'Meetings', value: sales?.meetings ?? '—', icon: Rocket },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Store className="size-4 text-accent" /> Client Store
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Shopify-like storefront — client apna store link dekhta hai, products khud add karta hai, Website agent live site publish karta hai.</p>
          </div>
          <div className="flex items-center gap-2">
            <input className={inputCls + ' w-44'} value={workspace} onChange={e => { setWorkspace(e.target.value); }} placeholder="workspace" />
            <input className={inputCls + ' w-32'} value={client} onChange={e => setClient(e.target.value)} placeholder="client" />
            <Button size="sm" variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className={`size-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Load
            </Button>
          </div>
        </div>

        {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center"><s.icon className="size-4 text-accent" /></div>
                <div>
                  <div className="text-lg font-bold leading-none">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Store link */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <Link2 className="size-4 text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client Store Link</div>
              <div className="text-sm font-mono text-accent truncate">{storeLink}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.open(storeLink, '_blank')}>
              <ExternalLink className="size-3 mr-1" /> Open
            </Button>
            <CopyBtn text={storeLink} />
          </CardContent>
        </Card>

        {/* Publish */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Publish to Live Site</div>
              <div className="text-xs text-muted-foreground mt-0.5">Website agent store se site rebuild karta hai aur Vercel pe deploy karta hai.</div>
              {publishMsg && <div className="text-xs text-accent mt-1 break-all">{publishMsg}</div>}
            </div>
            <Button size="sm" onClick={publish} disabled={publishing}>
              {publishing ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Rocket className="size-3 mr-1" />}
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Products ({products.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => startEdit(null)} disabled={!!editing}>
                <Plus className="size-3 mr-1" /> Add
              </Button>
            </div>
            <CardDescription className="text-xs">Client ke store ke products — image-aware cards me live site pe dikhte hain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>}
            {!loading && products.length === 0 && !editing && (
              <div className="text-center py-6 text-sm text-muted-foreground">No products yet. Add karo ya client se add karwao.</div>
            )}

            {editing && (
              <div className="border border-accent/40 rounded-lg p-4 space-y-3 bg-accent/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">{editing === 'new' ? 'New Product' : 'Edit Product'}</h4>
                  <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><span className={labelCls}>Name *</span><input className={inputCls + ' mt-1'} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Product name" /></div>
                  <div className="col-span-2"><span className={labelCls}>Description</span><textarea className={inputCls + ' mt-1 min-h-16'} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Short description" /></div>
                  <div><span className={labelCls}>Price</span><input className={inputCls + ' mt-1'} value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} placeholder="₹499" /></div>
                  <div><span className={labelCls}>Compare at (MRP)</span><input className={inputCls + ' mt-1'} value={draft.compare_at} onChange={e => setDraft({ ...draft, compare_at: e.target.value })} placeholder="₹999" /></div>
                  <div><span className={labelCls}>Image URL</span><input className={inputCls + ' mt-1'} value={draft.image_url} onChange={e => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." /></div>
                  <div><span className={labelCls}>Category</span><input className={inputCls + ' mt-1'} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="e.g. Menswear" /></div>
                  <div><span className={labelCls}>SKU</span><input className={inputCls + ' mt-1'} value={draft.sku} onChange={e => setDraft({ ...draft, sku: e.target.value })} placeholder="SKU-001" /></div>
                  <div><span className={labelCls}>Stock</span><input type="number" className={inputCls + ' mt-1'} value={draft.stock ?? 0} onChange={e => setDraft({ ...draft, stock: parseInt(e.target.value || '0', 10) })} /></div>
                  <div className="col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} /> Active</label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!draft.featured} onChange={e => setDraft({ ...draft, featured: e.target.checked })} /> Featured</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button size="sm" onClick={saveProduct} disabled={saving || !draft.name.trim()}>
                    {saving ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Save className="size-3 mr-1" />} Save
                  </Button>
                </div>
              </div>
            )}

            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="size-12 rounded-md object-cover bg-muted" onError={e => { e.currentTarget.style.display = 'none' }} />
                ) : (
                  <div className="size-12 rounded-md bg-accent/10 flex items-center justify-center"><ShoppingBag className="size-5 text-accent/50" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.price ? `₹${p.price}` : '—'}{p.compare_at ? ` / ₹${p.compare_at}` : ''}{p.category ? ` • ${p.category}` : ''}
                  </div>
                </div>
                <Badge variant={p.active ? 'outline' : 'secondary'} className={p.active ? 'text-emerald-500 border-emerald-500/30' : 'text-muted-foreground'}>
                  {p.active ? (Number(p.stock) > 0 ? 'In stock' : 'Out of stock') : 'Hidden'}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Pencil className="size-3.5" /></Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={() => deleteProduct(p.id)}><Trash2 className="size-3.5" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client account */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><KeyRound className="size-4 text-accent" /> Client Account</CardTitle>
              <CardDescription className="text-xs">Client is email/password se store link pe login karta hai, products manage karta hai.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Client ko kya milega</div>
                <div>• Store link pe email/password se login</div>
                <div>• Products add / edit / delete</div>
                <div>• SBA sales stats dekhega</div>
                <div>• Live site publish ka button</div>
              </div>
              <div><span className={labelCls}>Email</span><input className={inputCls + ' mt-1'} type="email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} placeholder="client@example.com" /></div>
              <div><span className={labelCls}>Password</span><input className={inputCls + ' mt-1'} type="password" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} placeholder="Password" /></div>
              <div><span className={labelCls}>Name</span><input className={inputCls + ' mt-1'} value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} placeholder="Client name (optional)" /></div>
              <Button size="sm" onClick={createAccount} disabled={creatingAccount} className="w-full">
                {creatingAccount ? <Loader2 className="size-3 mr-1 animate-spin" /> : <KeyRound className="size-3 mr-1" />} Create Account
              </Button>
              {accountMsg && <div className="text-xs text-muted-foreground break-all">{accountMsg}</div>}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Store className="size-4 text-accent" /> Store Settings</CardTitle>
              <CardDescription className="text-xs">Store name, tagline, hero text, contact info — live site pe use hote hain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {showSettingsEditor ? (
                <>
                  <textarea className={inputCls + ' min-h-32 font-mono text-xs'} value={settingsDraft} onChange={e => setSettingsDraft(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowSettingsEditor(false)}>Cancel</Button>
                    <Button size="sm" onClick={saveSettings} disabled={savingSettings}>
                      {savingSettings ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Save className="size-3 mr-1" />} Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><span className={labelCls}>Store Name</span><input className={inputCls + ' mt-1'} value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} placeholder="Brand / store ka naam" /></div>
                    <div className="col-span-2"><span className={labelCls}>Tagline</span><input className={inputCls + ' mt-1'} value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Short tagline" /></div>
                    <div><span className={labelCls}>Brand Color</span><div className="flex items-center gap-2 mt-1"><input type="color" className="size-9 rounded-lg border border-border cursor-pointer bg-transparent" value={form.color_primary} onChange={e => setForm({ ...form, color_primary: e.target.value })} /><input className={inputCls} value={form.color_primary} onChange={e => setForm({ ...form, color_primary: e.target.value })} /></div></div>
                    <div><span className={labelCls}>Currency</span><select className={inputCls + ' mt-1'} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}><option>₹</option><option>$</option><option>€</option><option>£</option><option>¥</option></select></div>
                    <div><span className={labelCls}>Contact Email</span><input type="email" className={inputCls + ' mt-1'} value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="client@example.com" /></div>
                    <div><span className={labelCls}>Domain (optional)</span><input className={inputCls + ' mt-1'} value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="store.example.com" /></div>
                    <div className="col-span-2 flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={!!form.show_stock} onChange={e => setForm({ ...form, show_stock: e.target.checked })} /> Show stock on store</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={openSettingsEditor}><Pencil className="size-3 mr-1" /> JSON</Button>
                    <Button size="sm" onClick={saveSettingsForm} disabled={savingSettings}>
                      {savingSettings ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Save className="size-3 mr-1" />} Save
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
