'use client'
import { useState, useEffect } from 'react'

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newContact, setNewContact] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [notification, setNotification] = useState(null)
  const [selectedWs, setSelectedWs] = useState(null)

  useEffect(() => { loadWorkspaces() }, [])

  function notify(msg, type = 'success') {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  async function loadWorkspaces() {
    try {
      const res = await fetch('/api/clients').then(r => r.json())
      setWorkspaces(res.data || [])
    } catch { setWorkspaces([]) }
    setLoading(false)
  }

  async function createWorkspace() {
    if (!newName.trim()) return
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          company: newName,
          industry: newIndustry || 'General',
          email: newEmail,
          contact: newContact,
          website: newWebsite,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      notify(`✅ Workspace "${newName}" created!`)
      setNewName(''); setNewIndustry(''); setNewEmail(''); setNewContact(''); setNewWebsite('')
      setShowCreate(false)
      loadWorkspaces()
    } catch (e) {
      notify(`❌ ${e.message}`, 'error')
    }
  }

  async function deleteWorkspace(id, name) {
    if (!confirm(`Delete workspace "${name}"?`)) return
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      notify(`🗑 Workspace "${name}" deleted`)
      loadWorkspaces()
      if (selectedWs?.id === id) setSelectedWs(null)
    } catch (e) {
      notify(`❌ ${e.message}`, 'error')
    }
  }

  const pageStyle = {
    display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    position: 'relative',
  }

  const notifStyle = {
    position: 'fixed', top: 16, right: 16, zIndex: 1000,
    padding: '10px 20px', borderRadius: 8,
    background: notification?.type === 'error' ? '#7f1d1d' : '#14532d',
    border: `1px solid ${notification?.type === 'error' ? '#ef4444' : '#22c55e'}`,
    color: '#e5e7eb', fontSize: 13,
    animation: 'slideIn 0.3s ease-out',
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {notification && <div style={notifStyle}>{notification.msg}</div>}

      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Workspaces</h2>
          <span className="badge badge-accent">{workspaces.length} Client(s)</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '✕ Cancel' : '+ New Workspace'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
        {/* Create Form */}
        {showCreate && (
          <div style={{
            background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12,
            padding: 20, marginBottom: 20, animation: 'fadeIn 0.2s ease-out',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>New Client Workspace</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Company Name *</label>
                <input className="form-input" placeholder="e.g. Texas Roofing Co" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Industry</label>
                <input className="form-input" placeholder="e.g. Roofing" value={newIndustry} onChange={e => setNewIndustry(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Contact Email</label>
                <input className="form-input" placeholder="client@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Contact Name</label>
                <input className="form-input" placeholder="John Doe" value={newContact} onChange={e => setNewContact(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Website</label>
                <input className="form-input" placeholder="https://example.com" value={newWebsite} onChange={e => setNewWebsite(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={createWorkspace} disabled={!newName.trim()}>
                ✨ Create Workspace
              </button>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #374151', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading workspaces...
          </div>
        )}

        {/* Empty */}
        {!loading && workspaces.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <div style={{ fontSize: 15, marginBottom: 8 }}>No workspaces yet</div>
            <div style={{ fontSize: 12, marginBottom: 20 }}>Click "New Workspace" to add your first client.</div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + Create Workspace
            </button>
          </div>
        )}

        {/* Workspace Grid */}
        {!loading && workspaces.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {workspaces.map(ws => (
              <div
                key={ws.id}
                style={{
                  background: selectedWs?.id === ws.id ? '#1e1a3a' : '#1a1a2e',
                  border: `1px solid ${selectedWs?.id === ws.id ? '#6366f1' : '#2d2d4e'}`,
                  borderRadius: 12, padding: 16, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelectedWs(selectedWs?.id === ws.id ? null : ws)}
                onMouseEnter={e => { if (selectedWs?.id !== ws.id) e.currentTarget.style.borderColor = '#4b5563' }}
                onMouseLeave={e => { if (selectedWs?.id !== ws.id) e.currentTarget.style.borderColor = '#2d2d4e' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                  }}>
                    {(ws.name || ws.company || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                      {ws.name || ws.company || 'Unnamed'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {ws.industry || 'General'} · {ws.status || 'active'}
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ws.status === 'active' ? '#22c55e' : '#6b7280' }} />
                </div>

                {selectedWs?.id === ws.id && (
                  <div style={{ borderTop: '1px solid #2d2d4e', marginTop: 12, paddingTop: 12, animation: 'fadeIn 0.2s' }}>
                    {ws.email && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>✉️ {ws.email}</div>}
                    {ws.contact && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>👤 {ws.contact}</div>}
                    {ws.website && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>🌐 {ws.website}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn btn-sm" style={{ background: '#1e3a1e', color: '#22c55e', border: '1px solid #22c55e' }}
                        onClick={e => { e.stopPropagation(); notify('🤝 CEO notified about this client') }}>
                        🔔 Notify CEO
                      </button>
                      <button className="btn btn-sm" style={{ background: '#3a1e1e', color: '#ef4444', border: '1px solid #ef4444' }}
                        onClick={e => { e.stopPropagation(); deleteWorkspace(ws.id, ws.name || ws.company) }}>
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
