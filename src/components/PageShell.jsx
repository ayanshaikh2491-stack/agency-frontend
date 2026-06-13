export default function PageShell({ children, className = '' }) {
  return (
    <div className={`flex h-screen w-full flex-col overflow-hidden bg-[var(--bg-canvas)] ${className}`}>
      {children}
    </div>
  )
}
