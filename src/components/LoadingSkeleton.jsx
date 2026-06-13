'use client'

/* ════════════════════════════════════
   Loading Skeleton Components
   ───
   <Skeleton width height rounded />
   <CardSkeleton />
   <TableSkeleton rows={5} />
   ════════════════════════════════════ */

export function Skeleton({ width, height = 16, rounded = false, style }) {
  return (
    <div
      className="loading-skeleton"
      style={{
        width: width || '100%',
        height: `${height}px`,
        borderRadius: rounded ? '9999px' : 'var(--radius-sm)',
        ...style,
      }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <Skeleton width={80} height={12} />
      <div style={{ marginTop: 12 }}>
        <Skeleton width={60} height={28} />
      </div>
      <div style={{ marginTop: 8 }}>
        <Skeleton width={100} height={12} />
      </div>
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <Skeleton width={60} height={10} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <Skeleton
                    width={[60, 80, 40, 100][c % cols] || 60}
                    height={12}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PageSkeleton({ title = 'Page' }) {
  return (
    <>
      <div className="topbar">
        <Skeleton width={120} height={16} />
      </div>
      <div className="page-content">
        <StatGridSkeleton />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </>
  )
}
