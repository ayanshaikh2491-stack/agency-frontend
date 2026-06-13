'use client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  return (
    <>
      <div className="topbar">
        <h2>⚙ Admin</h2>
        <div className="topbar-actions">
          <span style={{fontSize:12,color:'var(--text-muted)'}}>Company settings</span>
        </div>
      </div>
      <div className="page-content">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:600}}>
          <div className="card">
            <div className="card-title" style={{marginBottom:12}}>Company</div>
            <div className="form-group">
              <label>Company Name</label>
              <input defaultValue="Ayan Agency" />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input defaultValue="AI Marketing Agency" />
            </div>
            <div className="form-group">
              <label>Monthly Budget</label>
              <input defaultValue="Not configured" placeholder="Set budget limit" />
            </div>
          </div>
          <div className="card">
            <div className="card-title" style={{marginBottom:12}}>Backend</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6}}>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0'}}>
                <span>EC2 Backend</span>
                <span className="badge badge-green"><span className="badge-dot" /> Connected</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderTop:'1px solid var(--border-subtle)'}}>
                <span>Agents</span>
                <span style={{fontWeight:500}}>9 enabled</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderTop:'1px solid var(--border-subtle)'}}>
                <span>Leads</span>
                <span style={{fontWeight:500}}>431</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderTop:'1px solid var(--border-subtle)'}}>
                <span>Version</span>
                <span style={{fontWeight:500}}>v0.3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
