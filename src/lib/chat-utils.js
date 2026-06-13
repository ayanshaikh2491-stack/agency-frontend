/* Shared chat utilities — extracted from CEO, Social, and Boardroom pages */

export function uid() {
  return 'm' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
}

export function ts() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

export const PAPERCLIP_BUBBLE = 'min-w-0 max-w-[85%] break-words px-3 py-2 text-sm overflow-x-auto overflow-y-visible'

export function AgentBubbleHeader({ emoji, name }) {
  return (
    <div className="mb-1 flex items-center gap-1.5 pl-1">
      <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none">{emoji}</div>
      <span className="text-sm font-medium text-[var(--foreground)]">{name}</span>
    </div>
  )
}

export function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className={[PAPERCLIP_BUBBLE, 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'].join(' ')}>
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  )
}

export function renderMD(text) {
  var h = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function(_, lang, code) {
    var esc = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return '<pre class="bg-[var(--background)] border border-[var(--border)]/50 rounded p-3 my-2 text-[12px] leading-relaxed text-emerald-400/90 font-mono overflow-x-auto">' + esc + '</pre>'
  })
  h = h.replace(/`([^`]+)`/g, '<code class="bg-[var(--background)]/80 text-[var(--muted-foreground)] px-1.5 py-0.5 rounded text-[12px] font-mono border border-[var(--border)]/40">$1</code>')
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  h = h.replace(/\*(.*?)\*/g, '<em class="text-[var(--muted-foreground)] italic">$1</em>')
  h = h.replace(/\n/g, '<br>')
  return h
}

export function detectWorker(text) {
  var l = text.toLowerCase()
  if (l.includes('ads') || l.includes('facebook') || l.includes('linkedin') || l.includes('ad ')) return { id: 'ads-runner', emoji: '📢', name: 'Ads Runner' }
  if (l.includes('blog') || l.includes('content') || l.includes('write') || l.includes('post') || l.includes('copy') || l.includes('draft')) return { id: 'content-creator', emoji: '✍️', name: 'Content Creator' }
  if (l.includes('seo') || l.includes('rank') || l.includes('keyword') || l.includes('search') || l.includes('google')) return { id: 'seo-engine', emoji: '📈', name: 'SEO Engine' }
  if (l.includes('analytics') || l.includes('report') || l.includes('metric') || l.includes('kpi') || l.includes('data')) return { id: 'analytics-bot', emoji: '📊', name: 'Analytics Bot' }
  if (l.includes('sale') || l.includes('close') || l.includes('convert') || l.includes('lead') || l.includes('find') || l.includes('research')) return { id: 'sales-closer', emoji: '💼', name: 'Sales Closer' }
  if (l.includes('client') || l.includes('succes') || l.includes('support') || l.includes('onboard') || l.includes('care')) return { id: 'client-success', emoji: '🤝', name: 'Client Success' }
  if (l.includes('review') || l.includes('qc') || l.includes('quality') || l.includes('check') || l.includes('audit') || l.includes('proof')) return { id: 'review-qc', emoji: '✅', name: 'Review QC' }
  return null
}
