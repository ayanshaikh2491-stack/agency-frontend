'use client'
import { useState, useEffect } from 'react'

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [selectedWs, setSelectedWs] = useState(null)

  useEffect(() => { loadWorkspaces() }, [])

  async function loadWorkspaces() {
    try {
      const res = await fetch('/api/workspaces').then(r => r.json())
      setWorkspaces(res.data || [])
    } catch { setWorkspaces([]) }
    setLoading(false)
  }

  async function createWorkspace() {
    try {
      await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, industry: newIndustry, website: newWebsite }),
      })
      setNewName(''); setNewIndustry(''); setNewWebsite('')
      setShowCreate(false)
      loadWorkspaces()
    } catch {}
  }

  function formatDate(ts) {
    if (!ts) return 'Never'
    const d = new Date(ts)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
  }

  return (
    <>
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2>Workspaces</h2>
          <span className="badge badge-blue"><span className="badge-dot" /> {workspaces.length} clients</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}
            style={{fontSize:12,padding:'6px 14px'}}>+ New Workspace</button>
        </div>
      </div>

      <div className="page-content" style={{padding:'12px 24px'}}>

        {showCreate && (
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header" style={{margin:0,padding:0,marginBottom:12}}>
              <span className="card-title">Create Client Workspace</span>
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:200}}>
                <label style={{fontSize:11,color:'var(--text-muted)',display:'block',marginBottom:4}}>Client Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Acme Corp" style={{fontSize:12}} />
              </div>
              <div style={{flex:1,minWidth:150}}>
                <label style={{fontSize:11,color:'var(--text-muted)',display:'block',marginBottom:4}}>Industry</label>
                <input value={newIndustry} onChange={e => setNewIndustry(e.target.value)} placeholder="Real Estate" style={{fontSize:12}} />
              </div>
              <div style={{flex:1,minWidth:200}}>
                <label style={{fontSize:11,color:'var(--text-muted)',display:'block',marginBottom:4}}>Website</label>
                <input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} placeholder="https://acme.com" style={{fontSize:12}} />
              </div>
              <div style={{display:'flex',alignItems:'flex-end'}}>
                <button className="btn btn-primary" onClick={createWorkspace} style={{fontSize:12,padding:'7px 16px'}}>Create</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>
            <div className="spinner" style={{width:24,height:24,margin:'0 auto 12px'}} /> Loading...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="card" style={{textAlign:'center',padding:40}}>
            <div style={{fontSize:40,marginBottom:12}}>📁</div>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>No workspaces yet</div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>Create your first client workspace</div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {workspaces.map(ws => (
              <div key={ws.id} className="card" style={{padding:16,cursor:'pointer',
                borderColor: selectedWs?.id === ws.id ? 'var(--accent)' : 'var(--border)'}}
                onClick={() => setSelectedWs(selectedWs?.id === ws.id ? null : ws)}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:40,height:40,borderRadius:10,
                    background:`hsl(${(ws.name||'').charCodeAt(0)*37%360},60%,50%)`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:18,color:'white',fontWeight:700}}>
                    {(ws.name||'?')[0].toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{ws.name}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{ws.industry || 'No industry'}</div>
                  </div>
                  <span className="badge badge-green" style={{fontSize:10}}><span className="badge-dot" /> Active</span>
                </div>
                {ws.website && <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',marginBottom:8}}>🔗 {ws.website}</div>}
                <div style={{display:'flex',gap:8,fontSize:11,color:'var(--text-muted)'}}>
                  <span>📝 {ws.work_count||0} tasks</span>
                  <span>🧠 {ws.agents_with_memory?.length||0} agents</span>
                  <span style={{marginLeft:'auto'}}>Created {formatDate(ws.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
