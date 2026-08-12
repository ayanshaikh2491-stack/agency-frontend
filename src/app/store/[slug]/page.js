'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Store, ShoppingBag, LogIn, LogOut, Plus, Trash2, Save, Pencil, X,
  Loader2, Rocket, TrendingUp, KeyRound, Phone, MapPin,
  Eye, EyeOff, Mail, Lock, Package, AlertCircle, CheckCircle2, ClipboardList,
  Bell, Truck, Globe, RefreshCw, Search, Minus, Wallet, Settings,
  Download, Printer, BarChart3, Users, Receipt, PackageCheck, ImagePlus,
  Star, MessageCircle,
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
const emptyCoupon = { code: '', discount_type: 'percent', discount_value: '', min_order: '', max_uses: '', expires_at: '', active: true }

function discountPct(price, compare) {
  const p = parseFloat(String(price).replace(/[^0-9.]/g, ''))
  const c = parseFloat(String(compare).replace(/[^0-9.]/g, ''))
  if (!p || !c || c <= p) return null
  return Math.round(((c - p) / c) * 100)
}

function currency(s) {
  return `₹${String(s ?? '').replace(/[^0-9.]/g, '') || '—'}`
}

// Image upload helper: file -> resize (max 900px) -> compressed JPEG data URL.
// Data URL seedha settings/product me save hota hai, koi server storage nahi.
function readImageFile(file, cb) {
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      try {
        const MAX = 900
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        cb(canvas.toDataURL('image/jpeg', 0.82))
      } catch (err) {
        cb(null)
      }
    }
    img.onerror = () => cb(null)
    img.src = reader.result
  }
  reader.onerror = () => cb(null)
  reader.readAsDataURL(file)
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
  // Owner mode: sirf tab active jab URL me ?owner=1 ho. Marketing site pe login
  // button nahi dikhta — owner apne link me ?owner=1 laga ke login karta hai.
  const [ownerMode, setOwnerMode] = useState(false)

  // data
  const [settings, setSettings] = useState(null)
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState(null)
  const [siteUrl, setSiteUrl] = useState('')
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

  // reviews (visitor + owner moderation)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({ total: 0, avg: 0, by_product: {} })
  const [reviewForm, setReviewForm] = useState(null) // { product } -> modal open
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, reviewer_name: '', reviewer_email: '', comment: '' })
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')

  // coupons (owner management + visitor checkout apply)
  const [coupons, setCoupons] = useState([])
  const [couponEditing, setCouponEditing] = useState(null)
  const [couponDraft, setCouponDraft] = useState({ ...emptyCoupon })
  const [couponSaving, setCouponSaving] = useState(false)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponError, setCouponError] = useState(false)
  const [applyCode, setApplyCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null) // { discount, coupon }
  const [couponBusy, setCouponBusy] = useState(false)
  const [couponApplyMsg, setCouponApplyMsg] = useState('')

  // checkout / cart flow
  const [cart, setCart] = useState([]) // [{ product, qty }]
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(null) // { items: [{product, qty}], fromCart }
  const [cust, setCust] = useState({ name: '', email: '', phone: '', address: '' })
  const [payment, setPayment] = useState('COD')
  const [ordering, setOrdering] = useState(false)
  const [orderMsg, setOrderMsg] = useState('')
  const [orderOk, setOrderOk] = useState(false)
  const [orderWa, setOrderWa] = useState('') // WhatsApp confirm deep link after order
  // product search
  const [search, setSearch] = useState('')

  // owner orders management
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [orderUpdating, setOrderUpdating] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [newOrders, setNewOrders] = useState(0) // orders placed after lastSeen
  const [dispatchDraft, setDispatchDraft] = useState(null) // { oid, carrier, tracking }

  // order detail modal (label, invoice, timeline)
  const [detailOrder, setDetailOrder] = useState(null)

  // bulk dispatch
  const [selOrders, setSelOrders] = useState([]) // selected order ids
  const [bulkCarrier, setBulkCarrier] = useState('')
  const [bulkTracking, setBulkTracking] = useState('')
  const [bulkNote, setBulkNote] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)

  // settings editor
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState({})
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [settingsOk, setSettingsOk] = useState(false)

  // image upload busy state ('logo' | 'product' | 'banner' | null)
  const [imgBusy, setImgBusy] = useState(null)

  // hero carousel index (banners)
  const [heroIdx, setHeroIdx] = useState(0)

  // owner dashboard tab (sab kuch ek jagah — scroll nahi)
  const [tab, setTab] = useState('dashboard')

  const authHeaders = token ? { 'X-Store-Token': token } : {}

  // Marketing source: where did this customer come from? (utm > referrer > direct)
  function detectSource() {
    try {
      const q = new URLSearchParams(window.location.search)
      const utm = q.get('utm_source') || q.get('source') || q.get('ref')
      if (utm) return String(utm).slice(0, 40)
      const r = (document.referrer || '').toLowerCase()
      if (r.includes('instagram')) return 'Instagram'
      if (r.includes('facebook')) return 'Facebook'
      if (r.includes('whatsapp')) return 'WhatsApp'
      if (r.includes('google') || r.includes('youtube')) return 'Google'
      if (r) return 'Referral'
      return 'Direct'
    } catch { return 'Direct' }
  }

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const q = `workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`
      const [pubRes, salesRes, statusRes] = await Promise.all([
        fetch(`/api/store/public?${q}`),
        fetch(`/api/store/sales?${q}`),
        fetch(`/api/store/status?${q}`),
      ])
      const pub = await pubRes.json()
      if (!pubRes.ok) throw new Error(pub?.detail || 'Store load failed')
      setSettings(pub.settings || null)
      setProducts(pub.products || [])
      setReviews(pub.reviews || [])
      setReviewStats(pub.review_stats || { total: 0, avg: 0, by_product: {} })
      const sd = await salesRes.json().catch(() => null)
      setSales(sd && !sd.detail ? sd : null)
      const st = await statusRes.json().catch(() => null)
      if (st && !st.detail) setSiteUrl(st.site_url || '')
      if (account) {
        try {
          const cpRes = await fetch(`/api/store/coupons?${q}`, { headers: { 'X-Store-Token': token } })
          const cpd = await cpRes.json()
          if (cpRes.ok && Array.isArray(cpd)) setCoupons(cpd)
        } catch { /* ignore */ }
        try {
          // owner: saare reviews (pending included) token ke saath
          const rvRes = await fetch(`/api/store/reviews?${q}`, { headers: { 'X-Store-Token': token } })
          const rvd = await rvRes.json()
          if (rvRes.ok && Array.isArray(rvd)) setReviews(rvd)
        } catch { /* ignore */ }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [workspace, client, account, token])

  useEffect(() => { load() }, [load])

  // restore session
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('owner') === '1') {
        setOwnerMode(true)
        // owner link pe aaya to login card seedha khul jaaye
        setLoginOpen(true)
      }
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
      if (d?.url) setSiteUrl(d.url)
    } catch (e) { setPublishMsg(e.message); setPublishOk(false) } finally { setPublishing(false) }
  }

  async function placeOrder() {
    if (!checkout || !checkout.items.length) return
    setOrdering(true); setOrderMsg(''); setOrderOk(false)
    try {
      const d = await api('/api/store/orders', {
        method: 'POST',
        body: JSON.stringify({
          workspace, client,
          items: checkout.items.map(({ product, qty }) => ({ product_id: product.id, quantity: qty })),
          customer: { name: cust.name, email: cust.email, phone: cust.phone, address: cust.address, source: detectSource() },
          payment_method: payment,
          coupon_code: appliedCoupon?.coupon || '',
        }),
      })
      const total = d?.total ?? 0
      const orderNo = d?.order_number || d?.id || ''
      setOrderOk(true)
      setOrderMsg(`Order ${orderNo} placed! Total ${fmtMoney(total)}. Confirmation email bhej diya gaya hai.`)
      setOrderWa(d?.whatsapp_link || '')
      setAppliedCoupon(null); setApplyCode(''); setCouponApplyMsg('')
      if (checkout.fromCart) setCart([])
      setCartOpen(false)
      await load()
    } catch (e) { setOrderMsg(e.message); setOrderOk(false) } finally { setOrdering(false) }
  }

  const loadOrders = useCallback(async () => {
    if (!account) return
    setOrdersLoading(true); setOrdersError('')
    try {
      const q = `workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`
      const res = await fetch(`/api/store/orders?${q}`, { headers: { 'X-Store-Token': token } })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.detail || 'Orders load failed')
      const list = Array.isArray(d) ? d : []
      setOrders(list)
      // Naye orders = created after lastSeen (localStorage per workspace)
      try {
        const lastSeen = Number(localStorage.getItem(`store_lastseen_${workspace}`) || 0)
        const fresh = list.filter(o => new Date(o.created_at || 0).getTime() > lastSeen)
        setNewOrders(fresh.length)
      } catch { setNewOrders(0) }
    } catch (e) {
      setOrdersError(e.message)
    } finally {
      setOrdersLoading(false)
    }
  }, [workspace, client, account, token])

  useEffect(() => { loadOrders() }, [loadOrders])

  // Poll for new orders every 30s while the owner is logged in
  useEffect(() => {
    if (!account) return
    const t = setInterval(loadOrders, 30000)
    return () => clearInterval(t)
  }, [account, loadOrders])

  function markOrdersSeen() {
    try { localStorage.setItem(`store_lastseen_${workspace}`, String(Date.now())) } catch { /* ignore */ }
    setNewOrders(0)
  }

  function onStatusChange(o, status) {
    if (status === 'shipped') {
      setDispatchDraft({ oid: o.id, carrier: o.carrier || '', tracking: o.tracking_number || '', note: o.dispatch_note || '' })
    } else {
      setDispatchDraft(null)
      updateStatus(o.id, status)
    }
  }

  async function saveDispatch() {
    if (!dispatchDraft) return
    const { oid, carrier, tracking, note } = dispatchDraft
    setOrderUpdating(oid); setOrdersError('')
    try {
      await api(`/api/store/orders/${oid}?workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'shipped', carrier, tracking_number: tracking, dispatch_note: note }),
      })
      setDispatchDraft(null)
      await loadOrders(); await load(); markOrdersSeen()
    } catch (e) { setOrdersError(e.message) } finally { setOrderUpdating(null) }
  }

  async function updateStatus(oid, status) {
    setOrderUpdating(oid); setOrdersError('')
    try {
      await api(`/api/store/orders/${oid}?workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      })
      await loadOrders(); await load(); markOrdersSeen()
    } catch (e) { setOrdersError(e.message) } finally { setOrderUpdating(null) }
  }

  // ── Settings editor ──
  function openSettings() {
    setSettingsDraft({ ...(settings || {}) })
    setSettingsOpen(true); setSettingsMsg(''); setSettingsOk(false)
  }

  async function saveSettings() {
    setSettingsSaving(true); setSettingsMsg(''); setSettingsOk(false)
    try {
      const data = { ...settingsDraft }
      // payments object ko clean karo
      if (data.payments && typeof data.payments === 'object') {
        data.payments = {
          cod: !!data.payments.cod, upi: !!data.payments.upi,
          card: !!data.payments.card, bank: !!data.payments.bank,
        }
      }
      const saved = await api('/api/store/settings', {
        method: 'PATCH', body: JSON.stringify({ workspace, client, data }),
      })
      setSettings(saved)
      setSettingsMsg('Settings save ho gaye! Publish karke live website update karo.')
      setSettingsOk(true)
    } catch (e) { setSettingsMsg(e.message); setSettingsOk(false) } finally { setSettingsSaving(false) }
  }

  // Image file select -> resize -> data URL -> draft me save
  function handleImageFile(e, kind) {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // same file dobara select kar sake
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Sirf image file (JPG/PNG) upload karo'); return }
    if (file.size > 6 * 1024 * 1024) { alert('Image 6MB se choti honi chahiye'); return }
    setImgBusy(kind)
    readImageFile(file, (dataUrl) => {
      setImgBusy(null)
      if (!dataUrl) { alert('Image process nahi ho payi, dobara try karo'); return }
      if (kind === 'logo') setSettingsDraft({ ...settingsDraft, logo_url: dataUrl })
      else if (kind === 'banner') setSettingsDraft({ ...settingsDraft, banners: [...(settingsDraft.banners || []), dataUrl] })
      else setDraft({ ...draft, image_url: dataUrl })
    })
  }

  // ── Coupons (owner manage + visitor apply) ──
  function startCouponEdit(c) {
    setCouponEditing(c?.id || 'new')
    setCouponDraft(c ? {
      code: c.code || '', discount_type: c.discount_type || 'percent',
      discount_value: c.discount_value ?? '', min_order: c.min_order ?? '', max_uses: c.max_uses ?? '',
      expires_at: (c.expires_at || '').slice(0, 16), active: c.active !== false,
    } : { ...emptyCoupon })
    setCouponMsg(''); setCouponError(false)
  }

  async function saveCoupon() {
    if (!couponDraft.code?.trim()) { setCouponError(true); setCouponMsg('Coupon code zaroori hai'); return }
    setCouponSaving(true); setCouponMsg(''); setCouponError(false)
    try {
      const payload = {
        ...couponDraft,
        code: couponDraft.code.trim().toUpperCase(),
        discount_value: Number(couponDraft.discount_value) || 0,
        min_order: Number(couponDraft.min_order) || 0,
        max_uses: Number(couponDraft.max_uses) || 0,
      }
      if (couponEditing === 'new') {
        await api('/api/store/coupons', { method: 'POST', body: JSON.stringify({ workspace, client, coupon: payload }) })
      } else {
        await api(`/api/store/coupons/${couponEditing}`, { method: 'PATCH', body: JSON.stringify({ workspace, client, coupon: payload }) })
      }
      setCouponEditing(null)
      setCouponMsg('Coupon save ho gaya!'); setCouponError(false)
      await load()
    } catch (e) { setCouponError(true); setCouponMsg(e.message) } finally { setCouponSaving(false) }
  }

  async function deleteCoupon(cid) {
    if (!window.confirm('Is coupon ko delete karna hai?')) return
    try {
      await api(`/api/store/coupons/${cid}?workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`, { method: 'DELETE' })
      await load()
    } catch (e) { setCouponError(true); setCouponMsg(e.message) }
  }

  async function toggleCoupon(c) {
    try {
      await api(`/api/store/coupons/${c.id}`, {
        method: 'PATCH', body: JSON.stringify({ workspace, client, coupon: { active: !c.active } }),
      })
      await load()
    } catch (e) { setCouponError(true); setCouponMsg(e.message) }
  }

  async function applyCoupon() {
    if (!applyCode.trim()) { setCouponApplyMsg('Coupon code likho'); return }
    setCouponBusy(true); setCouponApplyMsg('')
    try {
      const d = await api('/api/store/coupons/validate', {
        method: 'POST', body: JSON.stringify({ workspace, client, code: applyCode.trim(), subtotal: checkoutSubtotal }),
      })
      setAppliedCoupon({ discount: Number(d.discount) || 0, coupon: d.coupon || applyCode.trim().toUpperCase() })
      setCouponApplyMsg(`✅ ${d.coupon} — ${fmtMoney(d.discount)} chhut mili!`)
    } catch (e) {
      setAppliedCoupon(null)
      setCouponApplyMsg(`❌ ${e.message}`)
    } finally { setCouponBusy(false) }
  }

  // ── Reviews (visitor write + owner moderate) ──
  const prodRating = pid => reviewStats?.by_product?.[pid] || null

  async function submitReview(e) {
    e?.preventDefault()
    if (!reviewForm) return
    setReviewBusy(true); setReviewMsg('')
    try {
      await api('/api/store/reviews', {
        method: 'POST', body: JSON.stringify({
          workspace, client,
          review: {
            product_id: reviewForm.product.id,
            product_name: reviewForm.product.name,
            rating: reviewDraft.rating,
            reviewer_name: reviewDraft.reviewer_name,
            reviewer_email: reviewDraft.reviewer_email,
            comment: reviewDraft.comment,
          },
        }),
      })
      setReviewMsg('✅ Review submit ho gaya! Owner approve karega to dikhega. Shukriya!')
      setReviewForm(null)
      setReviewDraft({ rating: 5, reviewer_name: '', reviewer_email: '', comment: '' })
    } catch (e2) {
      setReviewMsg(`❌ ${e2.message}`)
    } finally { setReviewBusy(false) }
  }

  async function setReviewApproved(rid, approved) {
    try {
      await api(`/api/store/reviews/${rid}`, { method: 'PATCH', body: JSON.stringify({ workspace, client, data: { approved } }) })
      await load()
    } catch (e) { setError(e.message) }
  }

  async function deleteReview(rid) {
    if (!window.confirm('Is review ko delete karna hai?')) return
    try {
      await api(`/api/store/reviews/${rid}?workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`, { method: 'DELETE' })
      await load()
    } catch (e) { setError(e.message) }
  }

  function starsHtml(rating) {
    return '★★★★★'.slice(0, 5).split('').map((s, i) => (
      <span key={i} className={i < Math.round(rating) ? 'text-amber-400' : 'text-muted-foreground/25'}>{s}</span>
    ))
  }

  // ── Bulk dispatch ──
  function toggleSel(oid) {
    setSelOrders(prev => prev.includes(oid) ? prev.filter(x => x !== oid) : [...prev, oid])
  }
  function toggleSelAll(ids) {
    const allSel = ids.every(id => selOrders.includes(id))
    setSelOrders(allSel ? selOrders.filter(x => !ids.includes(x)) : [...new Set([...selOrders, ...ids])])
  }
  async function bulkDispatch() {
    if (!selOrders.length) return
    setBulkBusy(true); setOrdersError('')
    try {
      const body = { status: 'shipped', carrier: bulkCarrier, tracking_number: bulkTracking, dispatch_note: bulkNote }
      for (const oid of selOrders) {
        await api(`/api/store/orders/${oid}?workspace=${encodeURIComponent(workspace)}&client=${encodeURIComponent(client)}`, {
          method: 'PATCH', body: JSON.stringify(body),
        })
      }
      setSelOrders([]); setBulkCarrier(''); setBulkTracking(''); setBulkNote('')
      await loadOrders(); await load(); markOrdersSeen()
    } catch (e) { setOrdersError(e.message) } finally { setBulkBusy(false) }
  }

  // ── CSV export ──
  function exportCSV() {
    if (!orders.length) return
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ['Order ID', 'Placed', 'Customer', 'Email', 'Phone', 'City', 'State', 'Pincode', 'Source', 'Items', 'Payment', 'Total', 'Status', 'Carrier', 'Tracking']
    const rows = orders.map(o => [
      o.order_number || o.id, o.created_at || '',
      o.customer_name || '', o.customer_email || '', o.customer_phone || '',
      o.customer_city || '', o.customer_state || '', o.customer_pincode || '',
      o.source || '',
      (o.items || []).map(i => `${i.name} x${i.quantity}`).join('; ') || `${o.product_name || ''} x${o.quantity || ''}`,
      o.payment_method || '', o.total ?? '', o.status || '', o.carrier || '', o.tracking_number || '',
    ])
    const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${storeName.replace(/[^a-z0-9]+/gi, '-')}-orders.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Print label / invoice ──
  function printHTML(title, bodyHTML) {
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${title}</title><style>
      body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;font-size:13px}
      h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:0 0 2px}
      .brand{display:flex;align-items:center;gap:10px;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px}
      .brand img{max-height:48px;max-width:140px;object-fit:contain}
      .muted{color:#555}.right{text-align:right}.row{display:flex;justify-content:space-between;margin:2px 0}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}
      th{background:#f3f3f3}.totals{margin-top:8px}.box{border:1px solid #ccc;border-radius:8px;padding:12px;margin:10px 0}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .badge{display:inline-block;border:1px solid #999;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:bold}
      @media print{body{margin:16px}}
    </style></head><body>${bodyHTML}
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
    </body></html>`)
    w.document.close()
  }

  function orderItems(o) {
    return (o.items && o.items.length) ? o.items : (o.product_name ? [{ name: o.product_name, quantity: o.quantity, price: o.total }] : [])
  }

  function printLabel(o) {
    const items = orderItems(o)
    const loc = [o.customer_city, o.customer_state].filter(Boolean).join(', ')
    const html = `
      <div class="brand">
        ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="logo">` : ''}
        <div><h1>${storeName}</h1>${settings?.tagline ? `<div class="muted">${settings.tagline}</div>` : ''}</div>
      </div>
      <div class="row"><span class="muted">Order</span><strong>#${o.order_number || o.id}</strong></div>
      <div class="row"><span class="muted">Placed</span><span>${o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '—'}</span></div>
      <div class="row"><span class="muted">Payment</span><span>${o.payment_method || '—'}</span></div>
      <div class="row"><span class="muted">Status</span><span class="badge">${statusLabel(o.status)}</span></div>
      <h2 style="margin-top:18px">Ship To</h2>
      <div class="box">
        <div style="font-size:16px;font-weight:bold">${o.customer_name || ''}</div>
        <div>${o.customer_phone || ''}</div>
        <div>${o.customer_email || ''}</div>
        ${o.customer_address ? `<div style="margin-top:4px">${o.customer_address}</div>` : ''}
        ${loc ? `<div>${loc}${o.customer_pincode ? ' - ' + o.customer_pincode : ''}</div>` : ''}
      </div>
      <h2>Items (${items.length})</h2>
      <table><thead><tr><th>Item</th><th>Qty</th></tr></thead><tbody>
        ${items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td></tr>`).join('')}
      </tbody></table>
      ${(o.carrier || o.tracking_number) ? `<div class="box"><div class="row"><span class="muted">Carrier</span><strong>${o.carrier || '—'}</strong></div><div class="row"><span class="muted">Tracking</span><strong>${o.tracking_number || '—'}</strong></div></div>` : ''}
    `
    printHTML(`Label ${o.order_number || o.id}`, html)
  }

  function printInvoice(o) {
    const items = orderItems(o)
    const sub = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
    const delivery = Number(settings?.delivery_charge || 0) || 0
    const total = o.total ?? (sub + delivery)
    const itemsHtml = items.map((i, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${i.name}</td>
        <td class="right">${Number(i.quantity) || 1}</td>
        <td class="right">${fmtMoney(i.price)}</td>
        <td class="right">${fmtMoney((Number(i.price) || 0) * (Number(i.quantity) || 1))}</td>
      </tr>`).join('')
    const html = `
      <div class="brand">
        ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="logo">` : ''}
        <div><h1>INVOICE</h1><div style="font-size:15px;font-weight:bold">${storeName}</div>
          ${settings?.contact_address ? `<div class="muted">${settings.contact_address}</div>` : ''}
          ${settings?.contact_phone ? `<div class="muted">Ph: ${settings.contact_phone}</div>` : ''}
          ${settings?.contact_email ? `<div class="muted">${settings.contact_email}</div>` : ''}
        </div>
      </div>
      <div class="grid">
        <div><div class="muted">Billed To</div><div style="font-weight:bold">${o.customer_name || ''}</div>
          <div>${o.customer_phone || ''}</div><div>${o.customer_email || ''}</div>
          ${o.customer_address ? `<div>${o.customer_address}</div>` : ''}
          ${[o.customer_city, o.customer_state].filter(Boolean).join(', ') ? `<div>${[o.customer_city, o.customer_state].filter(Boolean).join(', ')}${o.customer_pincode ? ' - ' + o.customer_pincode : ''}</div>` : ''}
        </div>
        <div class="right">
          <div class="row"><span class="muted">Invoice #</span><strong>${o.order_number || o.id}</strong></div>
          <div class="row"><span class="muted">Date</span><span>${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—'}</span></div>
          <div class="row"><span class="muted">Payment</span><span>${o.payment_method || '—'}</span></div>
          <div class="row"><span class="muted">Status</span><span class="badge">${statusLabel(o.status)}</span></div>
        </div>
      </div>
      <table><thead><tr><th>#</th><th>Item</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
        <tbody>${itemsHtml}</tbody></table>
      <div class="totals">
        <div class="row"><span class="muted">Subtotal</span><span>${fmtMoney(sub)}</span></div>
        ${delivery > 0 ? `<div class="row"><span class="muted">Delivery</span><span>${fmtMoney(delivery)}</span></div>` : ''}
        <div class="row" style="font-size:16px;font-weight:bold"><span>Total</span><span>${fmtMoney(total)}</span></div>
      </div>
      ${settings?.whatsapp ? `<div class="muted" style="margin-top:16px">Questions? WhatsApp: ${settings.whatsapp}</div>` : ''}
      <div class="muted" style="margin-top:24px">Thank you for your order!</div>
    `
    printHTML(`Invoice ${o.order_number || o.id}`, html)
  }

  const orderStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded']
  const statusColor = s => ({
    placed: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    shipped: 'bg-violet-50 text-violet-700 border-violet-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    returned: 'bg-orange-50 text-orange-700 border-orange-200',
    refunded: 'bg-slate-100 text-slate-700 border-slate-300',
  }[s] || 'bg-muted text-muted-foreground border-border')
  const statusLabel = s => ({
    placed: 'Placed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
    returned: 'Returned', refunded: 'Refunded',
  }[s] || s || '—')
  const visibleOrders = statusFilter ? orders.filter(o => (o.status || 'placed') === statusFilter) : orders

  const filteredCounts = orders.reduce((acc, o) => { const k = o.status || 'placed'; acc[k] = (acc[k] || 0) + 1; return acc }, {})
  const statusTabs = [{ k: '', label: 'All' }].concat(orderStatuses.filter(s => filteredCounts[s]).map(s => ({ k: s, label: statusLabel(s) })))

  const storeName = settings?.store_name || settings?.name || 'My Store'
  const tagline = settings?.tagline || 'Shop our latest collection'
  const accent = settings?.color_primary || '#2563EB'
  const banners = (settings?.banners || []).filter(Boolean)
  const waNum = (settings?.whatsapp || '').replace(/[^0-9]/g, '')

  const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
  const q = search.trim().toLowerCase()
  const visible = products.filter(p =>
    (!catFilter || p.category === catFilter) &&
    (!q || [p.name, p.category, p.description, p.sku].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
  )

  // Banner carousel auto-rotate
  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setHeroIdx(h => (h + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  // ── cart helpers ──
  const priceNum = p => Number(String(p?.price || '').replace(/[^0-9.]/g, '')) || 0
  const cartCount = cart.reduce((n, c) => n + c.qty, 0)
  const cartTotal = cart.reduce((t, c) => t + priceNum(c.product) * c.qty, 0)

  // checkout totals (coupon discount applied)
  const checkoutSubtotal = (checkout?.items || []).reduce((t, i) => t + priceNum(i.product) * i.qty, 0)
  const checkoutDiscount = Math.min(appliedCoupon?.discount || 0, checkoutSubtotal)
  const checkoutTotal = Math.max(0, checkoutSubtotal - checkoutDiscount)

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === p.id)
      if (ex) return prev.map(c => c.product.id === p.id ? { ...c, qty: Math.min(Number(p.stock) || 99, c.qty + 1) } : c)
      return [...prev, { product: p, qty: 1 }]
    })
  }
  function setCartQty(id, qty) {
    setCart(prev => qty <= 0
      ? prev.filter(c => c.product.id !== id)
      : prev.map(c => c.product.id === id ? { ...c, qty: Math.min(Number(c.product.stock) || 99, qty) } : c))
  }
  function removeFromCart(id) { setCart(prev => prev.filter(c => c.product.id !== id)) }
  function openCheckout(fromCart) {
    const items = fromCart ? cart : []
    setCheckout({ items, fromCart })
    setCust({ name: '', email: '', phone: '', address: '' })
    setPayment('COD')
    setOrderMsg(''); setOrderOk(false)
    setCartOpen(false)
  }

  const cur = settings?.currency || '₹'
  const fmtMoney = v => `${cur}${Number(v || 0).toLocaleString('en-IN')}`
  const stats = [
    { label: 'Revenue', value: fmtMoney(sales?.revenue ?? 0), icon: TrendingUp },
    { label: 'Orders', value: sales?.orders ?? 0, icon: ShoppingBag },
    { label: 'Units Sold', value: sales?.units ?? 0, icon: Package },
    { label: 'Views', value: sales?.views ?? 0, icon: Eye },
    { label: 'Top Product', value: sales?.top_product?.name || '—', icon: Rocket, small: true },
  ]
  const topProducts = sales?.top_products || []
  const topMaxUnits = Math.max(1, ...topProducts.map(p => Number(p.units) || 0))
  const pendingDispatch = orders.filter(o => ['placed', 'processing'].includes(o.status || 'placed')).length

  // ── Derived analytics (from real orders) ──
  const salesByDay = useMemo(() => {
    const days = 14
    const out = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
      out.push({ label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0, orders: 0 })
    }
    for (const o of orders) {
      const t = new Date(o.created_at || 0).getTime()
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (days - 1))
      if (t < day.getTime() || t > now.getTime() + 86400000) continue
      const idx = Math.floor((t - day.getTime()) / 86400000)
      if (idx >= 0 && idx < days) {
        out[idx].revenue += Number(o.total) || 0
        out[idx].orders += 1
      }
    }
    return out
  }, [orders])
  const graphMax = Math.max(1, ...salesByDay.map(d => d.revenue))
  const graphTotals = salesByDay.reduce((a, d) => ({ revenue: a.revenue + d.revenue, orders: a.orders + d.orders }), { revenue: 0, orders: 0 })

  const customers = useMemo(() => {
    const m = new Map()
    for (const o of orders) {
      const key = o.customer_email || o.customer_phone || o.customer_name || 'Unknown'
      const c = m.get(key) || { name: o.customer_name || '—', email: o.customer_email || '', phone: o.customer_phone || '', orders: 0, total: 0, last: '' }
      c.orders += 1
      c.total += Number(o.total) || 0
      if (!c.last || new Date(o.created_at || 0) > new Date(c.last)) c.last = o.created_at || ''
      m.set(key, c)
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [orders])

  const payBreakdown = useMemo(() => {
    const m = new Map()
    for (const o of orders) {
      const k = o.payment_method || 'Other'
      const p = m.get(k) || { method: k, orders: 0, total: 0 }
      p.orders += 1; p.total += Number(o.total) || 0
      m.set(k, p)
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [orders])
  const payMax = Math.max(1, ...payBreakdown.map(p => p.total))

  const lowStock = products.filter(p => Number(p.stock) >= 0 && Number(p.stock) <= 5)

  return (
    <main className="min-h-screen bg-background text-foreground" style={{ '--accent': accent }}>
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
            {!account && (
              <button onClick={() => setCartOpen(v => !v)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border hover:bg-muted hover:text-foreground transition-colors">
                <ShoppingBag className="size-3" /> Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>{cartCount}</span>
                )}
              </button>
            )}
            {account ? (
              <>
                <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">{account.name || account.email}</span>
                <button onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border hover:bg-muted hover:text-foreground transition-colors">
                  <LogOut className="size-3" /> Logout
                </button>
              </>
            ) : ownerMode && (
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
      <section className="border-b border-border/40 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}1a, ${accent}08 55%, transparent)` }}>
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl opacity-30" style={{ backgroundColor: accent }} />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full blur-3xl opacity-20" style={{ backgroundColor: accent }} />
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 flex flex-col items-center text-center relative">
          <div className="size-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg" style={{ backgroundColor: accent }}>
            <Store className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{storeName}</h1>
          {tagline && <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">{tagline}</p>}
          <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card/60 backdrop-blur">{products.length} Products</span>
            {sales && (
              <>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card/60 backdrop-blur">{sales.orders ?? 0} Orders</span>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card/60 backdrop-blur">{fmtMoney(sales.revenue ?? 0)} Revenue</span>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card/60 backdrop-blur">{sales.views ?? 0} Views</span>
              </>
            )}
          </div>
          {ownerMode && !account && (
            <button onClick={() => setLoginOpen(v => !v)}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg"
              style={{ backgroundColor: accent }}>
              <LogIn className="size-4" /> Store Owner Login: Orders, Dispatch & Stats
            </button>
          )}
        </div>
      </section>

      {/* ── Banner carousel ── */}
      {banners.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-6">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-md group">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${heroIdx * 100}%)` }}>
              {banners.map((b, i) => (
                <div key={i} className="w-full shrink-0 aspect-[21/9] sm:aspect-[21/7] bg-muted/40 relative">
                  {b ? (
                    <img src={b} alt={`banner ${i + 1}`} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40"><Store className="size-10" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={() => setHeroIdx(h => (h - 1 + banners.length) % banners.length)} className="absolute left-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-lg backdrop-blur-sm">‹</button>
                <button onClick={() => setHeroIdx(h => (h + 1) % banners.length)} className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-lg backdrop-blur-sm">›</button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} className={`size-1.5 rounded-full transition-all ${i === heroIdx ? 'w-5 bg-white' : 'bg-white/50 hover:bg-white/80'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── Login card (owner only, ?owner=1 se khulta hai) ── */}
        {ownerMode && !account && loginOpen && (
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
                <button onClick={() => { openSettings(); setTab('settings') }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border border-border hover:bg-muted transition-colors">
                  <Settings className="size-3.5" /> Settings
                </button>
                <button onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border border-border hover:bg-muted transition-colors">
                  <LogOut className="size-3.5" /> Logout
                </button>
              </div>
            </div>

            {/* ── Owner tab nav: sab features ek jagah ── */}
            <nav className="sticky top-[57px] z-10 flex flex-wrap gap-1.5 -mx-1 px-1 py-2 rounded-2xl bg-background/85 backdrop-blur border border-border/60 shadow-sm">
              {[
                { k: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: 0 },
                { k: 'orders', label: 'Orders', icon: ClipboardList, badge: pendingDispatch },
                { k: 'products', label: 'Products', icon: Package, badge: lowStock.length },
                { k: 'coupons', label: 'Coupons', icon: Receipt, badge: 0 },
                { k: 'reviews', label: 'Reviews', icon: Users, badge: reviews.filter(r => !r.approved).length },
                { k: 'settings', label: 'Settings', icon: Settings, badge: 0 },
              ].map(t => (
                <button key={t.k} onClick={() => { if (t.k === 'settings') openSettings(); setTab(t.k) }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-colors ${tab === t.k ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                  style={tab === t.k ? { backgroundColor: accent } : {}}>
                  <t.icon className="size-3.5" /> {t.label}
                  {t.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{t.badge}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Settings editor */}
            {tab === 'settings' && (
              <section className={`${cardCls} p-6 space-y-4 border-accent/40`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2"><Settings className="size-4 text-accent" /> Store Settings</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Store ka naam, logo, color, delivery aur payment options. Save karo + Publish karo.</p>
                  </div>
                  <button onClick={() => setTab('dashboard')} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>

                {settingsMsg && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${settingsOk ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {settingsOk ? <CheckCircle2 className="size-3.5 shrink-0" /> : <AlertCircle className="size-3.5 shrink-0" />}
                    {settingsMsg}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div><span className={labelCls}>Store Name</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.store_name || ''} onChange={e => setSettingsDraft({ ...settingsDraft, store_name: e.target.value })} placeholder="My Store" /></div>
                  <div><span className={labelCls}>Tagline</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.tagline || ''} onChange={e => setSettingsDraft({ ...settingsDraft, tagline: e.target.value })} placeholder="Shop our latest collection" /></div>
                  <div className="sm:col-span-2">
                    <span className={labelCls}>Logo</span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity shrink-0" style={{ backgroundColor: accent }}>
                        {imgBusy === 'logo' ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageFile(e, 'logo')} />
                        {imgBusy === 'logo' ? 'Uploading...' : 'Upload Logo'}
                      </label>
                      {settingsDraft.logo_url ? (
                        <>
                          <div className="size-12 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={settingsDraft.logo_url} alt="logo preview" className="max-w-full max-h-full object-contain" onError={e => { e.currentTarget.style.display = 'none' }} />
                          </div>
                          <button onClick={() => setSettingsDraft({ ...settingsDraft, logo_url: '' })} className="text-xs text-red-500 hover:underline shrink-0">Remove</button>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50">Koi logo nahi — button se upload karo</span>
                      )}
                    </div>
                    <input className={inputCls + ' pl-3 mt-2'} value={settingsDraft.logo_url || ''} onChange={e => setSettingsDraft({ ...settingsDraft, logo_url: e.target.value })} placeholder="Optional: image ka link paste karo" />
                  </div>
                  <div><span className={labelCls}>Primary Color</span><input type="color" className="w-full h-10 rounded-xl border border-border bg-transparent mt-1.5 cursor-pointer" value={settingsDraft.color_primary || '#2563EB'} onChange={e => setSettingsDraft({ ...settingsDraft, color_primary: e.target.value })} /></div>
                  <div><span className={labelCls}>Contact Email</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.contact_email || ''} onChange={e => setSettingsDraft({ ...settingsDraft, contact_email: e.target.value })} placeholder="owner@store.com" /></div>
                  <div><span className={labelCls}>Contact Phone</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.contact_phone || ''} onChange={e => setSettingsDraft({ ...settingsDraft, contact_phone: e.target.value })} placeholder="+91 98765 43210" /></div>
                  <div className="sm:col-span-2"><span className={labelCls}>Contact Address</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.contact_address || ''} onChange={e => setSettingsDraft({ ...settingsDraft, contact_address: e.target.value })} placeholder="Shop address (invoice pe dikhega)" /></div>
                  <div><span className={labelCls}>WhatsApp Number</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.whatsapp || ''} onChange={e => setSettingsDraft({ ...settingsDraft, whatsapp: e.target.value })} placeholder="+91 98765 43210" /></div>
                  <div><span className={labelCls}>Delivery Charge (₹)</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.delivery_charge || ''} onChange={e => setSettingsDraft({ ...settingsDraft, delivery_charge: e.target.value })} placeholder="e.g. 49" /></div>
                  <div><span className={labelCls}>Free Delivery Above (₹)</span><input className={inputCls + ' pl-3 mt-1.5'} value={settingsDraft.free_delivery_min || ''} onChange={e => setSettingsDraft({ ...settingsDraft, free_delivery_min: e.target.value })} placeholder="e.g. 499" /></div>
                </div>

                <div>
                  <span className={labelCls}>Payment Methods (checkout pe dikhenge)</span>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {['cod', 'upi', 'card', 'bank'].map(k => (
                      <label key={k} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-muted/20 cursor-pointer">
                        <input type="checkbox" checked={!!(settingsDraft.payments || {})[k]} onChange={e => setSettingsDraft({ ...settingsDraft, payments: { ...(settingsDraft.payments || {}), [k]: e.target.checked } })} className="accent-[var(--accent)]" />
                        {k === 'cod' ? 'COD' : k === 'upi' ? 'UPI' : k === 'card' ? 'Card' : 'Bank Transfer'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Banners (hero carousel) ── */}
                <div className="sm:col-span-2">
                  <span className={labelCls}>Hero Banners (storefront top pe carousel)</span>
                  {(settingsDraft.banners || []).map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2 mt-2">
                      <div className="size-14 rounded-lg border border-border bg-muted/30 overflow-hidden shrink-0">
                        <img src={b} alt={`banner ${bi + 1}`} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                      </div>
                      <input className={inputCls + ' pl-3'} value={b} onChange={e => { const bs = [...(settingsDraft.banners || [])]; bs[bi] = e.target.value; setSettingsDraft({ ...settingsDraft, banners: bs }) }} placeholder="Banner image ka link" />
                      <button onClick={() => setSettingsDraft({ ...settingsDraft, banners: (settingsDraft.banners || []).filter((_, i) => i !== bi) })} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 shrink-0"><Trash2 className="size-3.5" /></button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity shrink-0" style={{ backgroundColor: accent }}>
                      {imgBusy === 'banner' ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageFile(e, 'banner')} />
                      {imgBusy === 'banner' ? 'Uploading...' : 'Upload Banner'}
                    </label>
                    <button onClick={() => setSettingsDraft({ ...settingsDraft, banners: [...(settingsDraft.banners || []), ''] })} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors shrink-0">
                      <Plus className="size-3.5" /> Add Link
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setTab('dashboard')} className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                  <button onClick={saveSettings} disabled={settingsSaving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                    style={{ backgroundColor: accent }}>
                    {settingsSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save Settings
                  </button>
                </div>
              </section>
            )}

            {/* Coupons tab: owner manage discount codes */}
            {tab === 'coupons' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2"><Receipt className="size-4 text-accent" /> Coupons</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Discount codes banao, checkout pe customers apply karenge.</p>
                  </div>
                  <button onClick={() => startCouponEdit(null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accent }}>
                    <Plus className="size-3.5" /> New Coupon
                  </button>
                </div>

                {couponMsg && (
                  <div className={`rounded-xl border px-4 py-3 text-xs flex items-center gap-2 ${couponError ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'}`}>
                    {couponError ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />} {couponMsg}
                  </div>
                )}

                {/* Coupon editor */}
                {couponEditing && (
                  <div className={`${cardCls} p-6 space-y-4 border-accent/40`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">{couponEditing === 'new' ? 'New Coupon' : 'Edit Coupon'}</h3>
                      <button onClick={() => setCouponEditing(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"><X className="size-4" /></button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><span className={labelCls}>Code *</span><input className={inputCls + ' pl-3 mt-1.5 uppercase'} value={couponDraft.code} onChange={e => setCouponDraft({ ...couponDraft, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" /></div>
                      <div><span className={labelCls}>Type</span>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {[['percent', 'Percent %'], ['flat', 'Flat ₹']].map(([k, lbl]) => (
                            <button key={k} onClick={() => setCouponDraft({ ...couponDraft, discount_type: k })}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${couponDraft.discount_type === k ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground'}`}
                              style={couponDraft.discount_type === k ? { backgroundColor: accent } : {}}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><span className={labelCls}>{couponDraft.discount_type === 'percent' ? 'Discount %' : 'Discount (₹)'}</span><input type="number" className={inputCls + ' pl-3 mt-1.5'} value={couponDraft.discount_value} onChange={e => setCouponDraft({ ...couponDraft, discount_value: e.target.value })} placeholder={couponDraft.discount_type === 'percent' ? 'e.g. 10' : 'e.g. 100'} /></div>
                      <div><span className={labelCls}>Min Order (₹)</span><input type="number" className={inputCls + ' pl-3 mt-1.5'} value={couponDraft.min_order} onChange={e => setCouponDraft({ ...couponDraft, min_order: e.target.value })} placeholder="0 = koi limit nahi" /></div>
                      <div><span className={labelCls}>Max Uses</span><input type="number" className={inputCls + ' pl-3 mt-1.5'} value={couponDraft.max_uses} onChange={e => setCouponDraft({ ...couponDraft, max_uses: e.target.value })} placeholder="0 = unlimited" /></div>
                      <div><span className={labelCls}>Expiry (optional)</span><input type="datetime-local" className={inputCls + ' pl-3 mt-1.5'} value={couponDraft.expires_at} onChange={e => setCouponDraft({ ...couponDraft, expires_at: e.target.value })} /></div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={!!couponDraft.active} onChange={e => setCouponDraft({ ...couponDraft, active: e.target.checked })} className="accent-[var(--accent)]" /> Active</label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setCouponEditing(null)} className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                      <button onClick={saveCoupon} disabled={couponSaving || !couponDraft.code.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                        style={{ backgroundColor: accent }}>
                        {couponSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save Coupon
                      </button>
                    </div>
                  </div>
                )}

                {/* Coupon list */}
                {coupons.length === 0 && !couponEditing && (
                  <div className={`${cardCls} p-10 text-center`}>
                    <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3"><Receipt className="size-6 text-muted-foreground/40" /></div>
                    <div className="text-sm font-medium">Abhi koi coupon nahi hai</div>
                    <div className="text-xs text-muted-foreground mt-1">New Coupon se pehla discount code banao.</div>
                  </div>
                )}

                {coupons.length > 0 && (
                  <div className={`${cardCls} overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-2.5 font-semibold">Code</th>
                            <th className="px-4 py-2.5 font-semibold">Discount</th>
                            <th className="px-4 py-2.5 font-semibold">Min Order</th>
                            <th className="px-4 py-2.5 font-semibold">Uses</th>
                            <th className="px-4 py-2.5 font-semibold">Expiry</th>
                            <th className="px-4 py-2.5 font-semibold">Status</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map(c => (
                            <tr key={c.id} className="border-b border-border/50 last:border-0">
                              <td className="px-4 py-2.5 font-bold tracking-wide">{c.code}</td>
                              <td className="px-4 py-2.5">{c.discount_type === 'percent' ? `${c.discount_value}%` : fmtMoney(c.discount_value)}</td>
                              <td className="px-4 py-2.5">{Number(c.min_order) > 0 ? fmtMoney(c.min_order) : '—'}</td>
                              <td className="px-4 py-2.5">{c.used_count || 0}{Number(c.max_uses) > 0 ? ` / ${c.max_uses}` : ''}</td>
                              <td className="px-4 py-2.5">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-2.5">
                                <button onClick={() => toggleCoupon(c)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.active !== false ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-muted-foreground bg-muted/40 border-border'}`}>
                                  {c.active !== false ? 'Active' : 'Paused'}
                                </button>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => startCouponEdit(c)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="size-3.5" /></button>
                                  <button onClick={() => deleteCoupon(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600" title="Delete"><Trash2 className="size-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Reviews tab: owner moderation */}
            {tab === 'reviews' && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2"><Users className="size-4 text-accent" /> Reviews</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Customer reviews approve karo, phir storefront pe dikhenge. {reviews.filter(r => !r.approved).length} pending hain.</p>
                </div>

                {reviews.length === 0 && (
                  <div className={`${cardCls} p-10 text-center`}>
                    <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3"><Star className="size-6 text-muted-foreground/40" /></div>
                    <div className="text-sm font-medium">Abhi koi review nahi hai</div>
                    <div className="text-xs text-muted-foreground mt-1">Customers product pe review likhenge to yahan dikhenge.</div>
                  </div>
                )}

                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className={`${cardCls} p-4 ${r.approved ? '' : 'border-amber-500/30'}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-0.5 text-sm">{starsHtml(r.rating)}</span>
                            <span className="text-xs font-bold">{r.reviewer_name || 'Anonymous'}</span>
                            <span className="text-[10px] text-muted-foreground/60">{r.product_name || 'Product'}</span>
                          </div>
                          {r.comment && <p className="text-xs text-muted-foreground mt-1.5">{r.comment}</p>}
                          <div className="text-[10px] text-muted-foreground/50 mt-1.5">{r.reviewer_email}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString()}` : ''}</div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {!r.approved && (
                            <button onClick={() => setReviewApproved(r.id, true)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: accent }}>
                              <CheckCircle2 className="size-3" /> Approve
                            </button>
                          )}
                          {r.approved && (
                            <button onClick={() => setReviewApproved(r.id, false)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-border hover:bg-muted transition-colors">
                              Unpublish
                            </button>
                          )}
                          <button onClick={() => deleteReview(r.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600" title="Delete"><Trash2 className="size-3.5" /></button>
                        </div>
                      </div>
                      {!r.approved && <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mt-2">Pending approval</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dashboard tab: stats, graph, publish */}
            {tab === 'dashboard' && (
              <>
            {/* Sales stats */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Aapke Sales Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

            {/* Top selling products */}
            {topProducts.length > 0 && (
              <section className={`${cardCls} p-5`}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-accent" /> Top Selling Products
                </h2>
                <div className="space-y-3">
                  {topProducts.map((p, i) => {
                    const pct = Math.max(4, Math.round((Number(p.units) || 0) / topMaxUnits * 100))
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold truncate">{p.name || 'Product'}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{p.units || 0} sold · {fmtMoney(p.revenue ?? 0)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Sales graph + payment breakdown + customers + low stock */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Sales graph */}
              <section className={`${cardCls} p-5`}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                  <BarChart3 className="size-4 text-accent" /> Sales Last 14 Days
                </h2>
                <p className="text-[10px] text-muted-foreground/70 mb-3">{graphTotals.orders} orders · {fmtMoney(graphTotals.revenue)} in 14 din</p>
                <div className="flex items-end gap-1 h-32">
                  {salesByDay.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.label}: ${d.orders} order(s), ${fmtMoney(d.revenue)}`}>
                      <div className="w-full rounded-t bg-accent/80 hover:bg-accent transition-colors" style={{ height: `${Math.max(2, (d.revenue / graphMax) * 100)}%` }} />
                      {i % 2 === 0 && <span className="text-[8px] text-muted-foreground/50">{d.label}</span>}
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment breakdown */}
              <section className={`${cardCls} p-5`}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Wallet className="size-4 text-accent" /> Payment Breakdown
                </h2>
                {payBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60">Abhi koi payment data nahi.</p>
                ) : (
                  <div className="space-y-3">
                    {payBreakdown.map(p => (
                      <div key={p.method}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{p.method}</span>
                          <span className="text-[10px] text-muted-foreground">{p.orders} order(s) · {fmtMoney(p.total)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(3, (p.total / payMax) * 100)}%`, backgroundColor: accent }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Customers */}
              <section className={`${cardCls} p-5`}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="size-4 text-accent" /> Customers ({customers.length})
                </h2>
                {customers.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60">Abhi koi customer nahi.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {customers.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 px-3 py-2">
                        <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                          {(c.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{c.email || c.phone || '—'}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold">{fmtMoney(c.total)}</div>
                          <div className="text-[9px] text-muted-foreground">{c.orders} order(s)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Low stock */}
              <section className={`${cardCls} p-5`}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <PackageCheck className="size-4 text-accent" /> Low Stock Alert
                  {lowStock.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: '#d97706' }}>{lowStock.length}</span>}
                </h2>
                {lowStock.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60">Sab products ka stock thik hai ✅</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{p.name}</div>
                          <div className="text-[10px] text-amber-700">
                            {Number(p.stock) === 0 ? 'Out of stock!' : `Sirf ${p.stock} left!`}
                          </div>
                        </div>
                        <button onClick={() => { setTab('products'); startEdit(p) }} className="text-[10px] font-semibold text-amber-700 border border-amber-300 rounded-lg px-2 py-1 hover:bg-amber-100 shrink-0">Update Stock</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

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
                <div className="flex flex-wrap items-center gap-2">
                  {siteUrl && (
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/5 transition-colors">
                      <Globe className="size-4" /> Preview Live Site
                    </a>
                  )}
                  <button onClick={publish} disabled={publishing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
                    style={{ backgroundColor: accent }}>
                    {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                    {publishing ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </section>
              </>
            )}

            {/* Orders tab */}
            {tab === 'orders' && (
              <>
            {/* Orders management */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="size-4 text-accent" /> Orders ({orders.length})
                  </h2>
                  {newOrders > 0 && (
                    <button onClick={markOrdersSeen}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white animate-pulse shadow-sm"
                      style={{ backgroundColor: '#dc2626' }}>
                      <Bell className="size-3" /> {newOrders} naya
                    </button>
                  )}
                  {pendingDispatch > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: '#d97706' }}>
                      <Truck className="size-3" /> {pendingDispatch} dispatch pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {orders.length > 0 && (
                    <button onClick={exportCSV} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-border hover:bg-muted transition-colors">
                      <Download className="size-3" /> CSV
                    </button>
                  )}
                  <button onClick={() => { loadOrders(); markOrdersSeen() }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-border hover:bg-muted transition-colors">
                    <RefreshCw className="size-3" /> Refresh
                  </button>
                </div>
              </div>

              {/* Bulk dispatch bar */}
              {orders.length > 0 && (
                <div className={`${cardCls} p-3 mb-3 flex flex-wrap items-center gap-2 border-accent/30`}>
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <PackageCheck className="size-3.5 text-accent" /> Bulk Dispatch
                  </span>
                  <input className="px-2 py-1.5 rounded-lg border border-border bg-transparent text-[10px] outline-none focus:border-accent w-32" value={bulkCarrier} onChange={e => setBulkCarrier(e.target.value)} placeholder="Carrier" />
                  <input className="px-2 py-1.5 rounded-lg border border-border bg-transparent text-[10px] outline-none focus:border-accent w-36" value={bulkTracking} onChange={e => setBulkTracking(e.target.value)} placeholder="Tracking no." />
                  <input className="px-2 py-1.5 rounded-lg border border-border bg-transparent text-[10px] outline-none focus:border-accent w-40" value={bulkNote} onChange={e => setBulkNote(e.target.value)} placeholder="Note (optional)" />
                  <button onClick={bulkDispatch} disabled={bulkBusy || selOrders.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: accent }}>
                    {bulkBusy ? <Loader2 className="size-3 animate-spin" /> : <Truck className="size-3" />}
                    Ship {selOrders.length > 0 ? `${selOrders.length} selected` : 'selected'}
                  </button>
                  {selOrders.length > 0 && (
                    <button onClick={() => setSelOrders([])} className="px-2 py-1.5 rounded-lg text-[10px] font-medium border border-border hover:bg-muted transition-colors">Clear</button>
                  )}
                </div>
              )}

              {newOrders > 0 && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-600 flex items-center gap-2 mb-3">
                  <Bell className="size-4 shrink-0" /> {newOrders} naya order aaya hai! Neeche scroll karke order dekho aur dispatch karo. (dismiss karne ke liye badge pe click karo)
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/70 mb-3">Customer orders + location (kaha se) + dispatch status — placed → processing → shipped → delivered. Customer ko har step pe email jaata hai.</p>

              {ordersError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-500 flex items-center gap-2 mb-3">
                  <AlertCircle className="size-4 shrink-0" /> {ordersError}
                </div>
              )}

              {ordersLoading && (
                <div className={`${cardCls} p-6 text-center text-xs text-muted-foreground animate-pulse`}>Orders load ho rahe hain...</div>
              )}

              {!ordersLoading && orders.length === 0 && (
                <div className={`${cardCls} p-8 text-center`}>
                  <div className="size-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3"><ClipboardList className="size-5 text-muted-foreground/40" /></div>
                  <div className="text-sm font-medium">Abhi koi order nahi hai</div>
                  <div className="text-xs text-muted-foreground mt-1">Jab customer koi product kharidega, order yahan dikhega.</div>
                </div>
              )}

              {!ordersLoading && orders.length > 0 && (
                <>
                  {/* Status filter tabs */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {statusTabs.map(t => (
                      <button key={t.k} onClick={() => setStatusFilter(t.k)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${statusFilter === t.k ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground'}`}
                        style={statusFilter === t.k ? { backgroundColor: accent } : {}}>
                        {t.label} {t.k ? `(${filteredCounts[t.k]})` : `(${orders.length})`}
                      </button>
                    ))}
                  </div>

                  <div className={`${cardCls} overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-3 py-2.5 font-semibold w-8">
                              <input type="checkbox" checked={visibleOrders.length > 0 && visibleOrders.every(o => selOrders.includes(o.id))}
                                onChange={() => toggleSelAll(visibleOrders.map(o => o.id))}
                                className="accent-[var(--accent)]" title="Select all" />
                            </th>
                            <th className="px-3 py-2.5 font-semibold">Order</th>
                            <th className="px-4 py-2.5 font-semibold">Customer</th>
                            <th className="px-4 py-2.5 font-semibold">Kaha se (Location)</th>
                            <th className="px-4 py-2.5 font-semibold">Source</th>
                            <th className="px-4 py-2.5 font-semibold">Items</th>
                            <th className="px-4 py-2.5 font-semibold">Total</th>
                            <th className="px-4 py-2.5 font-semibold">Status / Dispatch</th>
                            <th className="px-4 py-2.5 font-semibold">Placed</th>
                            <th className="px-3 py-2.5 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleOrders.map(o => {
                            const isNew = (() => { try { return new Date(o.created_at || 0).getTime() > Number(localStorage.getItem(`store_lastseen_${workspace}`) || 0) } catch { return false } })()
                            const loc = [o.customer_city, o.customer_state].filter(Boolean).join(', ')
                            return (
                            <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                              <td className="px-3 py-3">
                                <input type="checkbox" checked={selOrders.includes(o.id)} onChange={() => toggleSel(o.id)}
                                  className="accent-[var(--accent)]" title="Select for bulk dispatch" />
                              </td>
                              <td className="px-3 py-3 font-mono font-medium text-accent">
                                <button onClick={() => setDetailOrder(o)} className="hover:underline text-left">{o.order_number || o.id}</button>
                                {isNew && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: '#dc2626' }}>NEW</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{o.customer_name || '—'}</div>
                                <div className="text-[10px] text-muted-foreground">{o.customer_email || ''}{o.customer_phone ? ` · ${o.customer_phone}` : ''}</div>
                                {o.customer_address && <div className="text-[10px] text-muted-foreground/70 truncate max-w-40">{o.customer_address}</div>}
                              </td>
                              <td className="px-4 py-3">
                                {loc ? (
                                  <div className="flex items-start gap-1">
                                    <MapPin className="size-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                                    <div>
                                      <div className="font-medium">{loc}</div>
                                      {o.customer_pincode && <div className="text-[10px] text-muted-foreground/70">PIN {o.customer_pincode}</div>}
                                    </div>
                                  </div>
                                ) : <span className="text-muted-foreground/50">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-border bg-muted/30">
                                  <Globe className="size-2.5 text-muted-foreground/60" /> {o.source || 'Direct'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {(o.items || []).map((it, i) => (
                                  <div key={i} className="text-muted-foreground">{it.name} × {it.quantity}</div>
                                ))}
                                {(o.items || []).length === 0 && <div className="text-muted-foreground">{o.product_name} × {o.quantity}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold">{fmtMoney(o.total)}</div>
                                {o.payment_method && <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wide mt-0.5">{o.payment_method}</div>}
                              </td>
                              <td className="px-4 py-3">
                                {dispatchDraft?.oid === o.id ? (
                                  <div className="flex flex-col gap-1.5 min-w-44">
                                    <input className="px-2 py-1 rounded-md border border-border bg-transparent text-[10px] outline-none focus:border-accent" value={dispatchDraft.carrier} onChange={e => setDispatchDraft({ ...dispatchDraft, carrier: e.target.value })} placeholder="Carrier (e.g. DTDC, Delhivery)" />
                                    <input className="px-2 py-1 rounded-md border border-border bg-transparent text-[10px] outline-none focus:border-accent" value={dispatchDraft.tracking} onChange={e => setDispatchDraft({ ...dispatchDraft, tracking: e.target.value })} placeholder="Tracking number" />
                                    <input className="px-2 py-1 rounded-md border border-border bg-transparent text-[10px] outline-none focus:border-accent" value={dispatchDraft.note} onChange={e => setDispatchDraft({ ...dispatchDraft, note: e.target.value })} placeholder="Dispatch note (optional)" />
                                    <div className="flex gap-1.5">
                                      <button onClick={saveDispatch} disabled={orderUpdating === o.id} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: accent }}>
                                        {orderUpdating === o.id ? <Loader2 className="size-3 animate-spin" /> : <Truck className="size-3" />} Ship it
                                      </button>
                                      <button onClick={() => setDispatchDraft(null)} className="px-2 py-1 rounded-md text-[10px] font-medium border border-border hover:bg-muted">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(o.status)}`}>
                                        {statusLabel(o.status)}
                                      </span>
                                      <select
                                        value={o.status || 'placed'}
                                        disabled={orderUpdating === o.id}
                                        onChange={e => onStatusChange(o, e.target.value)}
                                        className="px-1.5 py-1 rounded-md border border-border bg-transparent text-[10px] font-medium outline-none focus:border-accent"
                                      >
                                        {orderStatuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                                      </select>
                                      {orderUpdating === o.id && <Loader2 className="size-3 animate-spin text-accent" />}
                                    </div>
                                    {(o.tracking_number || o.carrier) && (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Truck className="size-3 text-accent" />
                                        <span className="font-medium">{o.carrier || 'Carrier'}</span>
                                        <span className="font-mono">{o.tracking_number}</span>
                                      </div>
                                    )}
                                    {o.dispatch_note && <div className="text-[10px] text-muted-foreground/70">{o.dispatch_note}</div>}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground/70">
                                {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-col gap-1">
                                  <button onClick={() => setDetailOrder(o)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-border hover:bg-muted transition-colors">
                                    <Eye className="size-3" /> View
                                  </button>
                                  <div className="flex gap-1">
                                    <button onClick={() => printLabel(o)} title="Print shipping label" className="p-1 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"><Printer className="size-3" /></button>
                                    <button onClick={() => printInvoice(o)} title="Print invoice" className="p-1 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"><Receipt className="size-3" /></button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {visibleOrders.length === 0 && (
                      <div className="p-6 text-center text-xs text-muted-foreground">Is status mein koi order nahi.</div>
                    )}
                  </div>
                </>
              )}
            </section>
              </>
            )}

            {/* ── Order detail modal ── */}
            {detailOrder && (
              <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailOrder(null)} />
                <div className={`relative w-full max-w-2xl ${cardCls} p-6`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold flex items-center gap-2">
                        <ClipboardList className="size-4 text-accent" /> Order #{detailOrder.order_number || detailOrder.id}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(detailOrder.status)}`}>{statusLabel(detailOrder.status)}</span>
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {detailOrder.created_at ? new Date(detailOrder.created_at).toLocaleString('en-IN') : '—'} · {detailOrder.payment_method || '—'} · {fmtMoney(detailOrder.total)}
                      </p>
                    </div>
                    <button onClick={() => setDetailOrder(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => printLabel(detailOrder)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border border-border hover:bg-muted transition-colors">
                      <Printer className="size-3.5" /> Print Label
                    </button>
                    <button onClick={() => printInvoice(detailOrder)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border border-border hover:bg-muted transition-colors">
                      <Receipt className="size-3.5" /> Print Invoice
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="rounded-xl bg-muted/20 border border-border p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Customer</div>
                      <div className="text-sm font-semibold">{detailOrder.customer_name || '—'}</div>
                      <div className="text-[11px] text-muted-foreground">{detailOrder.customer_email}</div>
                      <div className="text-[11px] text-muted-foreground">{detailOrder.customer_phone}</div>
                      {detailOrder.customer_address && <div className="text-[11px] text-muted-foreground mt-1">{detailOrder.customer_address}</div>}
                      {[detailOrder.customer_city, detailOrder.customer_state].filter(Boolean).join(', ') && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="size-3 text-muted-foreground/50" /> {[detailOrder.customer_city, detailOrder.customer_state].filter(Boolean).join(', ')}{detailOrder.customer_pincode ? ` - ${detailOrder.customer_pincode}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl bg-muted/20 border border-border p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Dispatch</div>
                      <div className="text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Truck className="size-3 text-accent" /> Carrier: <span className="text-foreground font-medium">{detailOrder.carrier || '—'}</span></div>
                        <div className="mt-1">Tracking: <span className="text-foreground font-medium font-mono">{detailOrder.tracking_number || '—'}</span></div>
                        {detailOrder.dispatch_note && <div className="mt-1">{detailOrder.dispatch_note}</div>}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Globe className="size-3 text-muted-foreground/50" />
                        <span className="text-[11px]">Source: {detailOrder.source || 'Direct'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden mb-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <th className="px-3 py-2 font-semibold">Item</th>
                          <th className="px-3 py-2 font-semibold text-right">Qty</th>
                          <th className="px-3 py-2 font-semibold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems(detailOrder).map((it, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2 font-medium">{it.name}</td>
                            <td className="px-3 py-2 text-right">{it.quantity}</td>
                            <td className="px-3 py-2 text-right font-semibold">{fmtMoney((Number(it.price) || 0) * (Number(it.quantity) || 1))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-muted/20 border border-border px-4 py-3">
                    <span className="text-xs font-semibold text-muted-foreground">Order Total</span>
                    <span className="text-lg font-extrabold">{fmtMoney(detailOrder.total)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {orderStatuses.filter(s => s !== (detailOrder.status || 'placed')).map(s => (
                      <button key={s} onClick={() => { updateStatus(detailOrder.id, s); setDetailOrder(null) }}
                        disabled={orderUpdating === detailOrder.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border hover:bg-muted transition-colors">
                        Mark {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Checkout modal (visitors only) ── */}
        {!account && checkout && (
          <section className={`${cardCls} max-w-md mx-auto p-6 sm:p-8 border-accent/40`}>
            {orderOk ? (
              /* ── Success state ── */
              <div className="text-center py-4">
                <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="size-7 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold">Order Placed! 🎉</h2>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                  {(checkout.items || []).map(it => `${it.product.name} (x${it.qty})`).join(', ')} — {orderMsg}
                </p>
                {orderWa && (
                  <a href={orderWa} target="_blank" rel="noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                    style={{ backgroundColor: '#22c55e' }}>
                    <MessageCircle className="size-4" /> WhatsApp pe Order Confirm karo
                  </a>
                )}
                <button onClick={() => { setCheckout(null); setCust({ name: '', email: '', phone: '', address: '' }); setOrderMsg(''); setOrderOk(false); setOrderWa('') }}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors">
                  <ShoppingBag className="size-4" /> Continue Shopping
                </button>
              </div>
            ) : (
              <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingBag className="size-4.5 text-accent" /> Checkout</h2>
                <p className="text-xs text-muted-foreground mt-1">Apna naam + email daalo, order confirm ho jayega.</p>
              </div>
              <button onClick={() => setCheckout(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>

            {/* Order summary */}
            <div className="rounded-xl bg-muted/30 border border-border p-3 mb-4 space-y-2">
              {(checkout.items || []).map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="size-12 rounded-lg object-cover bg-muted" onError={e => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <div className="size-12 rounded-lg bg-muted/40 flex items-center justify-center"><ShoppingBag className="size-4 text-muted-foreground/40" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {currency(product.price)}{product.compare_at && <span className="line-through ml-1.5 opacity-60">{currency(product.compare_at)}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Qty</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button onClick={() => setCheckout(c => ({ ...c, items: c.items.map(i => i.product.id === product.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i) }))} className="size-7 rounded-lg border border-border hover:bg-muted text-sm font-bold">−</button>
                      <span className="w-8 text-center text-sm font-bold">{qty}</span>
                      <button onClick={() => setCheckout(c => ({ ...c, items: c.items.map(i => i.product.id === product.id ? { ...i, qty: Math.min(Number(product.stock) || 99, i.qty + 1) } : i) }))} className="size-7 rounded-lg border border-border hover:bg-muted text-sm font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border/60 pt-2 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-extrabold">{fmtMoney(checkoutSubtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-600">
                  <span>Coupon {appliedCoupon.coupon}</span>
                  <span className="font-bold">−{fmtMoney(checkoutDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-sm">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-extrabold text-base">{fmtMoney(checkoutTotal)}</span>
              </div>
            </div>

            {/* Coupon apply */}
            <div className="mb-4">
              <span className={labelCls}>Coupon Code</span>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                  <input className={inputCls} value={applyCode} onChange={e => setApplyCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" />
                </div>
                {appliedCoupon ? (
                  <button onClick={() => { setAppliedCoupon(null); setApplyCode(''); setCouponApplyMsg('') }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors shrink-0">
                    Remove
                  </button>
                ) : (
                  <button onClick={applyCoupon} disabled={couponBusy || !applyCode.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                    style={{ backgroundColor: accent }}>
                    {couponBusy ? <Loader2 className="size-3.5 animate-spin" /> : 'Apply'}
                  </button>
                )}
              </div>
              {couponApplyMsg && <div className={`text-[11px] mt-1.5 ${couponApplyMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{couponApplyMsg}</div>}
            </div>

            {/* Payment method */}
            <div className="mb-4">
              <span className={labelCls}>Payment Method</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button onClick={() => setPayment('COD')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${payment === 'COD' ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  style={payment === 'COD' ? { backgroundColor: accent } : {}}>
                  <Package className="size-3.5" /> Cash on Delivery
                </button>
                <button onClick={() => setPayment('UPI')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${payment === 'UPI' ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  style={payment === 'UPI' ? { backgroundColor: accent } : {}}>
                  <Wallet className="size-3.5" /> UPI
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className={labelCls}>Name</span>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <input className={inputCls} value={cust.name} onChange={e => setCust({ ...cust, name: e.target.value })} placeholder="Aapka naam" />
                </div>
              </div>
              <div>
                <span className={labelCls}>Email</span>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <input className={inputCls} type="email" value={cust.email} onChange={e => setCust({ ...cust, email: e.target.value })} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <span className={labelCls}>Phone</span>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <input className={inputCls} type="tel" value={cust.phone} onChange={e => setCust({ ...cust, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div>
                <span className={labelCls}>Address</span>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <textarea className={inputCls + ' min-h-16 resize-none'} value={cust.address} onChange={e => setCust({ ...cust, address: e.target.value })} placeholder="Delivery address" />
                </div>
              </div>
            </div>

            {orderMsg && !orderOk && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mt-3 ${orderOk ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                {orderOk ? <CheckCircle2 className="size-3.5 shrink-0" /> : <AlertCircle className="size-3.5 shrink-0" />}
                {orderMsg}
              </div>
            )}

            <button onClick={placeOrder} disabled={ordering || !cust.name.trim() || !cust.email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm mt-4"
              style={{ backgroundColor: accent }}>
              {ordering ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
              {ordering ? 'Placing order...' : `Order Now · ${fmtMoney(checkoutTotal)}`}
            </button>
            <button type="button" onClick={() => setCheckout(null)} className="w-full text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-2">
              Cancel
            </button>
              </>
            )}
          </section>
        )}

        {/* ── Cart drawer (visitors only) ── */}
        {!account && cartOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                <h2 className="text-sm font-bold flex items-center gap-2"><ShoppingBag className="size-4 text-accent" /> Your Cart
                  {cartCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: accent }}>{cartCount}</span>}
                </h2>
                <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
                  <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center"><ShoppingBag className="size-6 text-muted-foreground/40" /></div>
                  <div className="text-sm font-medium">Cart khali hai</div>
                  <div className="text-xs text-muted-foreground">Products mein "Add to Cart" dabao aur yahan se checkout karo.</div>
                  <button onClick={() => setCartOpen(false)} className="mt-2 px-4 py-2 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: accent }}>Browse Products</button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {cart.map(({ product, qty }) => (
                      <div key={product.id} className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border p-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="size-14 rounded-lg object-cover bg-muted shrink-0" onError={e => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-14 rounded-lg bg-muted/40 flex items-center justify-center shrink-0"><ShoppingBag className="size-5 text-muted-foreground/40" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{product.name}</div>
                          <div className="text-[11px] text-muted-foreground">{currency(product.price)}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button onClick={() => setCartQty(product.id, qty - 1)} className="size-6 rounded-md border border-border hover:bg-muted text-xs font-bold">−</button>
                            <span className="w-7 text-center text-xs font-bold">{qty}</span>
                            <button onClick={() => setCartQty(product.id, qty + 1)} className="size-6 rounded-md border border-border hover:bg-muted text-xs font-bold">+</button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs font-bold">{fmtMoney(priceNum(product) * qty)}</div>
                          <button onClick={() => removeFromCart(product.id)} className="p-1 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600" title="Remove"><Trash2 className="size-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border/60 px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-extrabold">{fmtMoney(cartTotal)}</span>
                    </div>
                    <button onClick={() => openCheckout(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                      style={{ backgroundColor: accent }}>
                      <ShoppingBag className="size-4" /> Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}

        {/* ── Products (visitor OR owner on Products tab) ── */}
        {(!account || tab === 'products') && (
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-extrabold">Our Products</h2>
              <p className="text-xs text-muted-foreground">{visible.length} item{visible.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                  className="w-44 sm:w-56 pl-9 pr-3 py-2 text-xs bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground/50 hover:text-foreground"><X className="size-3" /></button>
                )}
              </div>
              {account && (
                <button onClick={() => startEdit(null)} disabled={!!editing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: accent }}>
                  <Plus className="size-3.5" /> Add Product
                </button>
              )}
            </div>
          </div>

          {/* Products section: owner dashboard me admin controls, visitor ko clean marketing view */}

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
              <div className="text-xs text-muted-foreground mt-1">{account ? 'Add Product se pehla product add karo.' : 'Abhi products available nahi hain — jald aa rahe hain!'}</div>
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
                <div className="sm:col-span-2">
                  <span className={labelCls}>Product Image</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity shrink-0" style={{ backgroundColor: accent }}>
                      {imgBusy === 'product' ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageFile(e, 'product')} />
                      {imgBusy === 'product' ? 'Uploading...' : 'Upload Image'}
                    </label>
                    {draft.image_url ? (
                      <>
                        <div className="size-12 rounded-lg border border-border bg-muted/30 overflow-hidden shrink-0">
                          <img src={draft.image_url} alt="preview" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                        </div>
                        <button onClick={() => setDraft({ ...draft, image_url: '' })} className="text-xs text-red-500 hover:underline shrink-0">Remove</button>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">Koi image nahi — button se upload karo</span>
                    )}
                  </div>
                  <input className={inputCls + ' pl-3 mt-2'} value={draft.image_url || ''} onChange={e => setDraft({ ...draft, image_url: e.target.value })} placeholder="Optional: image ka link paste karo" />
                </div>
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
                    {inStock && Number(p.stock) <= 5 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 shadow-sm">
                        Low stock
                      </span>
                    )}
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
                    {!account && prodRating(p.id) && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="flex items-center gap-0.5 text-sm">{starsHtml(prodRating(p.id).avg)}</span>
                        <span className="text-[10px] text-muted-foreground/70">({prodRating(p.id).count})</span>
                        <button onClick={() => setReviewForm({ product: p })}
                          className="ml-auto text-[10px] font-semibold text-accent hover:underline">Rate this</button>
                      </div>
                    )}
                    {!account && !prodRating(p.id) && (
                      <button onClick={() => setReviewForm({ product: p })}
                        className="mt-2 text-[10px] font-semibold text-accent hover:underline">★ Rate this product</button>
                    )}
                    <div className="flex items-end justify-between mt-auto pt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold">{currency(p.price)}</span>
                        {p.compare_at && <span className="text-[11px] text-muted-foreground/60 line-through">{currency(p.compare_at)}</span>}
                      </div>
                      {inStock && (
                        <span className="text-[9px] text-muted-foreground/60">{p.stock} left</span>
                      )}
                    </div>
                    {!account && inStock && (
                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => addToCart(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors">
                          <ShoppingBag className="size-3.5" /> Add to Cart
                        </button>
                        <button onClick={() => { openCheckout(false); setCheckout({ items: [{ product: p, qty: 1 }], fromCart: false }) }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                          style={{ backgroundColor: accent }}>
                          <ShoppingBag className="size-3.5" /> Buy Now
                        </button>
                      </div>
                    )}
                    {!account && !inStock && (
                      <div className="mt-3 w-full text-center py-2 rounded-xl text-xs font-medium text-muted-foreground/50 border border-border/50">Sold out</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        )}

        {/* Services feature removed — abhi product business hai. Future service business ke liye backend ready hai (git history me code maujood). */}

        <footer className="text-center text-[10px] text-muted-foreground/50 pb-8">
          © {new Date().getFullYear()} {storeName} · Powered by Agency OS
        </footer>
      </div>

      {/* ── Floating WhatsApp (visitors) ── */}
      {!account && waNum && (
        <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Hi ${storeName}! Mujhe aapke products ke baare mein jaanna hai.`)}`}
          target="_blank" rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white shadow-xl hover:scale-105 transition-transform"
          style={{ backgroundColor: '#22c55e' }}
          title="WhatsApp pe baat karo">
          <MessageCircle className="size-5" />
          <span className="text-xs font-bold">Chat</span>
        </a>
      )}

      {/* ── Review modal (visitors) ── */}
      {!account && reviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setReviewForm(null); setReviewMsg('') }} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2"><Star className="size-4 text-amber-400" /> Product Review</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{reviewForm.product.name}</p>
              </div>
              <button onClick={() => { setReviewForm(null); setReviewMsg('') }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>

            <div className="mb-3">
              <span className={labelCls}>Rating</span>
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setReviewDraft(d => ({ ...d, rating: n }))}
                    className={`text-2xl transition-colors ${n <= reviewDraft.rating ? 'text-amber-400' : 'text-muted-foreground/25 hover:text-amber-300'}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div><span className={labelCls}>Naam</span><input className={inputCls + ' pl-3 mt-1.5'} value={reviewDraft.reviewer_name} onChange={e => setReviewDraft(d => ({ ...d, reviewer_name: e.target.value }))} placeholder="Aapka naam" /></div>
              <div><span className={labelCls}>Email</span><input className={inputCls + ' pl-3 mt-1.5'} type="email" value={reviewDraft.reviewer_email} onChange={e => setReviewDraft(d => ({ ...d, reviewer_email: e.target.value }))} placeholder="you@example.com" /></div>
              <div><span className={labelCls}>Comment</span><textarea className={inputCls + ' pl-3 mt-1.5 min-h-20'} value={reviewDraft.comment} onChange={e => setReviewDraft(d => ({ ...d, comment: e.target.value }))} placeholder="Product ke baare mein kya khayal hai?" /></div>
            </div>

            {reviewMsg && <div className={`text-[11px] mt-2 ${reviewMsg.startsWith('❌') ? 'text-red-500' : 'text-emerald-600'}`}>{reviewMsg}</div>}

            <button onClick={submitReview} disabled={reviewBusy || !reviewDraft.reviewer_name.trim() || !reviewDraft.reviewer_email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity mt-4"
              style={{ backgroundColor: accent }}>
              {reviewBusy ? <Loader2 className="size-4 animate-spin" /> : <Star className="size-4" />} Submit Review
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
