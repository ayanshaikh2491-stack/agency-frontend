'use client'
export default function IssuesPage() {
  const issues = [
    { id: 'ISS-001', title: 'Research top 50 real estate companies in Miami', status: 'done', agent: 'Intake Researcher', prio: 'High' },
    { id: 'ISS-002', title: 'Write 3 blog posts for client onboarding', status: 'in_progress', agent: 'Content Creator', prio: 'Medium' },
    { id: 'ISS-003', title: 'Optimize SEO for agency landing page', status: 'todo', agent: 'SEO Engine', prio: 'High' },
    { id: 'ISS-004', title: 'Generate weekly analytics report', status: 'todo', agent: 'Analytics Bot', prio: 'Low' },
    { id: 'ISS-005', title: 'Run Facebook ads campaign for new client', status: 'todo', agent: 'Ads Runner', prio: 'Medium' },
  ]
  return (
    <>
      <div className="topbar">
        <h2>○ Issues</h2>
        <div className="topbar-actions">
          <span style={{fontSize:12,color:'var(--text-muted)'}}>{issues.length} open</span>
          <button className="btn btn-primary">+ New Issue</button>
        </div>
      </div>
      <div className="page-content">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Issue</th>
                <th>Title</th>
                <th>Status</th>
                <th>Agent</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(i => (
                <tr key={i.id}>
                  <td style={{color:'var(--text-muted)',fontFamily:'monospace',fontSize:12}}>{i.id}</td>
                  <td>{i.title}</td>
                  <td>
                    <span className={`badge ${i.status === 'done' ? 'badge-green' : i.status === 'in_progress' ? 'badge-blue' : 'badge-yellow'}`}>
                      <span className="badge-dot" />{i.status.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{color:'var(--text-secondary)'}}>{i.agent}</td>
                  <td>
                    <span style={{color: i.prio === 'High' ? 'var(--red)' : i.prio === 'Medium' ? 'var(--yellow)' : 'var(--text-muted)', fontSize:12}}>
                      {i.prio}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
