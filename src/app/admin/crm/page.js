'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

const PAGE_SIZE = 25
const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'closed-won', 'closed-lost']
const STATUS_BADGE_MAP = {
  'new': 'blue',
  'contacted': 'yellow',
  'qualified': 'purple',
  'proposal': 'orange',
  'closed-won': 'green',
  'closed-lost': 'red',
}
const STATUS_COLORS = {
  'new': 'var(--blue)',
  'contacted': 'var(--yellow)',
  'qualified': 'var(--purple)',
  'proposal': 'var(--orange)',
  'closed-won': 'var(--green)',
  'closed-lost': 'var(--red)',
}

const EMPTY_LEAD = {
  name: '', email: '', phone: '', company: '',
  industry: '', location: '', source: '', status: 'new', notes: '',
}

export default function CRMPage() {
  const [leads, setLeads] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [page, setPage] = useState(1)
  const [detailLead, setDetailLead] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [offline, setOffline] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    setOffline(false)
    try {
      const offset = (page - 1) * PAGE_SIZE
      const res = await fetch(`/api/leads?limit=${PAGE_SIZE}&offset=${offset}`)
      if (!res.ok && res.status !== 200) {
        // try without offset
        const fallback = await fetch(`/api/leads?limit=${PAGE_SIZE}`)
        if (!fallback.ok) throw new Error(`HTTP ${fallback.status}`)
        const fb = await fallback.json()
        const list = fb?.data?.leads || fb?.leads || []
        setLeads(list)
        setTotalCount(list.length)
      } else {
        const d = await res.json()
        const list = d?.data?.leads || d?.leads || []
        setLeads(list)
        // If backend returns total count, use it; otherwise use array length
        setTotalCount(d?.data?.total || d?.total || list.length)
      }
    } catch (e) {
      setError(e.message)
      setOffline(true)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const filtered = useMemo(() => {
    if (!debouncedSearch) return leads
    const q = debouncedSearch.toLowerCase()
    return leads.filter(l => JSON.stringify(l).toLowerCase().includes(q))
  }, [leads, debouncedSearch])

  async function handleCreate(form) {
    setSaving(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setShowCreate(false)
      fetchLeads()
    } catch (e) {
      alert('Failed to create lead: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id, form) {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setEditLead(null)
      setDetailLead(null)
      fetchLeads()
    } catch (e) {
      alert('Failed to update lead: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDeleteConfirm(null)
      setDetailLead(null)
      fetchLeads()
    } catch (e) {
      alert('Failed to delete lead: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return d }
  }

  return (
    <>
      <div className="topbar">
        <h2>▦ CRM</h2>
        <div className="topbar-actions">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalCount} lead{totalCount !== 1 ? 's' : ''}
          </span>
          <input style={{ width: 220, fontSize: 12 }}
            placeholder="Search leads..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <button className="btn btn-secondary" onClick={fetchLeads} title="Refresh" style={{ padding: '7px 10px' }}>
            ⟳
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Lead
          </button>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="error-msg" style={{ marginBottom: 12 }}>
            ⚠️ {error}. {offline ? 'Backend may be unreachable.' : ''}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                  <div className="loading"><div className="spinner" /></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                  {search ? 'No leads match your search' : 'No leads found'}
                </td></tr>
              ) : filtered.map((l, i) => {
                const status = (l.status || 'new').toLowerCase()
                const badgeVariant = STATUS_BADGE_MAP[status] || 'blue'
                return (
                  <tr key={l.id || i} style={{ cursor: 'pointer' }}
                    onClick={() => setDetailLead(l)}>
                    <td style={{ fontWeight: 500 }}>{l.name || l.contact_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.email || '—'}</td>
                    <td>{l.phone || '—'}</td>
                    <td>{l.company || l.company_name || '—'}</td>
                    <td>{l.source || '—'}</td>
                    <td>
                      <span className={`badge badge-${badgeVariant}`}>
                        <span className="badge-dot" style={{ background: STATUS_COLORS[status] || 'var(--blue)' }} />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(l.created_at || l.createdAt || l.date_created)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <button key={pageNum}
                  className={`page-btn ${pageNum === page ? 'active' : ''}`}
                  onClick={() => setPage(pageNum)}>
                  {pageNum}
                </button>
              )
            })}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            <span className="page-info">Page {page} of {totalPages}</span>
          </div>
        )}

        {/* Lead Detail Panel */}
        {detailLead && (
          <>
            <div className="panel-overlay" onClick={() => setDetailLead(null)} />
            <div className="panel">
              <div className="panel-header">
                <span className="modal-title">{detailLead.name || detailLead.contact_name || 'Lead Detail'}</span>
                <button className="modal-close" onClick={() => setDetailLead(null)}>✕</button>
              </div>
              <div className="panel-body">
                <div className="panel-field">
                  <div className="label">Name</div>
                  <div className="value">{detailLead.name || detailLead.contact_name || '—'}</div>
                </div>
                <div className="panel-field">
                  <div className="label">Email</div>
                  <div className="value">{detailLead.email || '—'}</div>
                </div>
                <div className="panel-field">
                  <div className="label">Phone</div>
                  <div className="value">{detailLead.phone || '—'}</div>
                </div>
                <div className="panel-field">
                  <div className="label">Company</div>
                  <div className="value">{detailLead.company || detailLead.company_name || '—'}</div>
                </div>
                <div className="panel-field">
                  <div className="label">Industry</div>
                  <div className="value">{detailLead.industry || '—'}</div>
                </div>
                <div className="panel-field">
                  <div className="label">Location</div>
                  <div className="value">
                    {[detailLead.city, detailLead.state, detailLead.country].filter(Boolean).join(', ') || detailLead.location || '—'}
                  </div>
                </div>
                <div className="panel-field">
                  <div className="label">Source</div>
                  <div className="value">{detailLead.source || '—'}</div>
                </div>
                <div className="panel-field">
                  <div className="label">Status</div>
                  <div className="value">
                    <span className={`badge badge-${STATUS_BADGE_MAP[(detailLead.status || 'new').toLowerCase()] || 'blue'}`}>
                      <span className="badge-dot" />{detailLead.status || 'New'}
                    </span>
                  </div>
                </div>
                <div className="panel-field">
                  <div className="label">Notes</div>
                  <div className="value" style={{ whiteSpace: 'pre-wrap' }}>{detailLead.notes || '—'}</div>
                </div>
                <div className="panel-field">
                  <div className="label">Created</div>
                  <div className="value">{formatDate(detailLead.created_at || detailLead.createdAt || detailLead.date_created)}</div>
                </div>
              </div>
              <div className="panel-footer">
                <button className="btn btn-secondary" onClick={() => {
                  setEditLead({ ...detailLead })
                  setDetailLead(null)
                }}>
                  ✏️ Edit
                </button>
                <button className="btn btn-danger" onClick={() => setDeleteConfirm(detailLead)} style={{ marginLeft: 'auto' }}>
                  🗑 Delete
                </button>
              </div>
            </div>
          </>
        )}

        {/* Create Lead Modal */}
        {showCreate && (
          <LeadFormModal
            title="+ New Lead"
            initial={EMPTY_LEAD}
            onSave={handleCreate}
            onClose={() => setShowCreate(false)}
            saving={saving}
          />
        )}

        {/* Edit Lead Modal */}
        {editLead && (
          <LeadFormModal
            title="✏️ Edit Lead"
            initial={editLead}
            onSave={(form) => handleUpdate(editLead.id, form)}
            onClose={() => setEditLead(null)}
            saving={saving}
          />
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal" style={{ width: 380 }}>
              <div className="modal-header">
                <span className="modal-title">🗑 Delete Lead</span>
                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name || deleteConfirm.contact_name || 'this lead'}</strong>?
                This action cannot be undone.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={saving}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={saving}>
                  {saving ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Lead Form Modal (used for both Create and Edit) ─── */
function LeadFormModal({ title, initial, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: initial.name || initial.contact_name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    company: initial.company || initial.company_name || '',
    industry: initial.industry || '',
    location: initial.city
      ? [initial.city, initial.state, initial.country].filter(Boolean).join(', ')
      : initial.location || '',
    source: initial.source || '',
    status: initial.status || 'new',
    notes: initial.notes || '',
  })

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      name: form.name,
      contact_name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      company: form.company || undefined,
      company_name: form.company || undefined,
      industry: form.industry || undefined,
      location: form.location || undefined,
      source: form.source || undefined,
      status: form.status,
      notes: form.notes || undefined,
    }
    onSave(payload)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name} onChange={e => handleChange('name', e.target.value)}
                placeholder="Lead name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                placeholder="email@example.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input value={form.company} onChange={e => handleChange('company', e.target.value)}
                placeholder="Company name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Industry</label>
              <input value={form.industry} onChange={e => handleChange('industry', e.target.value)}
                placeholder="e.g. Real Estate" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input value={form.location} onChange={e => handleChange('location', e.target.value)}
                placeholder="City, State" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Source</label>
              <input value={form.source} onChange={e => handleChange('source', e.target.value)}
                placeholder="Website, Referral, etc." />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => handleChange('status', e.target.value)}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)}
              placeholder="Any additional notes..."
              style={{ minHeight: 60, resize: 'vertical' }} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
