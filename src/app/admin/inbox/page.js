'use client'
import { useRouter } from 'next/navigation'

export default function InboxPage() {
  const router = useRouter()
  const items = []

  return (
    <>
      <div className="topbar">
        <h2>⊡ Inbox</h2>
        <div className="topbar-actions">
          <span style={{fontSize:12,color:'var(--text-muted)'}}>{items.length} items</span>
        </div>
      </div>
      <div className="page-content">
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {items.map(item => (
            <div key={item.id} style={{
              display:'flex',gap:14,alignItems:'flex-start',
              padding:'14px 16px',
              background:'var(--bg-elevated)',
              border:'1px solid var(--border)',
              borderRadius:'var(--radius-md)',
              transition:'border-color 0.15s',
            }}>
              <div style={{fontSize:20}}>{item.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:13}}>{item.title}</div>
                <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>{item.desc}</div>
                {item.cost && <div style={{fontSize:11,color:'var(--yellow)',marginTop:4}}>{item.cost}</div>}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{item.time}</div>
                <div style={{marginTop:8,display:'flex',gap:6}}>
                  <button className="btn btn-primary" style={{fontSize:11,padding:'4px 10px'}}>✓</button>
                  <button className="btn btn-secondary" style={{fontSize:11,padding:'4px 10px'}}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
