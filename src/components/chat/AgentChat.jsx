'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

function uid() { return 'm' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) }
function ts() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) }

const BUBBLE = 'min-w-0 max-w-[85%] break-words px-3 py-2 text-sm overflow-x-auto overflow-y-visible'

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className={BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'}>
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  )
}

function renderMD(text) {
  var h = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function(_, lang, code) {
    var esc = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return '<pre class="bg-[var(--background)] border border-[var(--border)]/50 rounded p-3 my-2 text-[12px] leading-relaxed text-emerald-400/90 font-mono overflow-x-auto">' + esc + '</pre>'
  })
  h = h.replace(/`([^`]+)`/g, '<code class="bg-[var(--background)]/80 text-[var(--muted-foreground)] px-1.5 py-0.5 rounded text-[12px] font-mono border border-[var(--border)]/40">$1</code>')
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--foreground)]">$1</strong>')
  h = h.replace(/\n/g, '<br>')
  return h
}

export default function AgentChat({
  agentName, agentEmoji, headerSubtitle, welcomeBody, suggestions,
  onSend, rightPanel, composerPlaceholder, sendBtnColor = 'bg-primary'
}) {
  var [msgs, setMsgs] = useState([])
  var [input, setInput] = useState('')
  var [sending, setSending] = useState(false)
  var [welcomeRevealed, setWelcomeRevealed] = useState(false)
  var [chipsRevealed, setChipsRevealed] = useState(false)
  var bottomRef = useRef(null)
  var inputRef = useRef(null)
  var scrollRef = useRef(null)
  var keepScrolled = useRef(true)

  var safeScroll = useCallback(function() {
    if (!keepScrolled.current || !bottomRef.current) return
    bottomRef.current.scrollIntoView({ block: 'end' })
  }, [])

  useEffect(function() { safeScroll() }, [msgs.length])
  useEffect(function() {
    var el = scrollRef.current
    if (!el) return
    var onScroll = function() { keepScrolled.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 40 }
    el.addEventListener('scroll', onScroll, { passive: true })
    return function() { el.removeEventListener('scroll', onScroll) }
  }, [])
  useEffect(function() { if (welcomeRevealed) return; var t1 = setTimeout(function() { setWelcomeRevealed(true) }, 1500); return function() { clearTimeout(t1) } }, [welcomeRevealed])
  useEffect(function() { if (!welcomeRevealed || chipsRevealed) return; var t2 = setTimeout(function() { setChipsRevealed(true) }, 500); return function() { clearTimeout(t2) } }, [welcomeRevealed, chipsRevealed])

  var send = useCallback(async function(override) {
    var text = (override || input).trim()
    if (!text || sending) return
    if (!override) setInput('')
    var userMsg = { id: uid(), role: 'user', content: text, time: ts() }
    setMsgs(function(p) { return p.concat([userMsg]) })
    setSending(true); setWelcomeRevealed(true); setChipsRevealed(true)
    var reply = await onSend(text)
    await new Promise(function(r) { setTimeout(r, 400 + Math.random() * 500) })
    setSending(false)
    setMsgs(function(p) { return p.concat([{ id: uid(), role: 'assistant', content: reply, time: ts() }]) })
  }, [input, sending, onSend])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function AgentHeader() {
    return (
      <div className="mb-1 flex items-center gap-1.5 pl-1">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none">{agentEmoji}</div>
        <span className="text-sm font-medium text-[var(--foreground)]">{agentName}</span>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100%+2rem)] flex-col -m-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* LEFT: Chat */}
        <div className="relative flex min-h-0 min-w-0 w-full md:w-[45%] shrink-0 flex-col bg-[var(--background)]">
          <div className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/20">
                <span className="text-sm">{agentEmoji}</span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{agentName}</h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">● Live</span>
                </div>
                {headerSubtitle && <p className="truncate text-xs text-[var(--muted-foreground)]">{headerSubtitle}</p>}
              </div>
            </div>
          </div>

          <div className="relative min-h-0 min-w-0 flex-1">
            <div ref={scrollRef} className="scrollbar-auto-hide absolute inset-0 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col gap-3 px-6 pt-3 pb-32">
                {!welcomeRevealed && <TypingBubble />}
                {welcomeRevealed && welcomeBody && (
                  <>
                    <div className="flex flex-col items-start">
                      <AgentHeader />
                      <div className={BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'}>
                        <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMD(welcomeBody) }} />
                      </div>
                    </div>
                    {chipsRevealed && suggestions && (
                      <div className="flex flex-wrap gap-2 pl-1">
                        {suggestions.map(function(chip) {
                          return (
                            <button key={chip.label} type="button" onClick={function() { send(chip.prompt) }}
                              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors duration-150 hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]">
                              {chip.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
                {msgs.map(function(m) {
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="flex flex-col items-end gap-1">
                        <div className={BUBBLE + ' bg-blue-600 text-white [border-radius:14px_14px_4px_14px]'}>{m.content}</div>
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className="flex flex-col items-start">
                      <AgentHeader />
                      <div className={BUBBLE + ' bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] [border-radius:14px_14px_14px_4px]'}>
                        <div className="max-w-full overflow-visible [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMD(m.content) }} />
                      </div>
                    </div>
                  )
                })}
                {sending && <TypingBubble />}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-[var(--background)]/0 px-6 pt-6 pb-5">
            <div className="pointer-events-auto relative rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 pb-2 pt-3 shadow-lg transition-colors focus-within:border-[var(--primary)]/60">
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value) }} onKeyDown={handleKeyDown}
                  placeholder={composerPlaceholder} rows={1}
                  className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none scrollbar-none" disabled={sending} />
                <div className="flex shrink-0 items-center gap-1 pb-0.5">
                  <button type="button" onClick={function() { send() }} disabled={!input.trim() || sending}
                    className={'rounded-lg ' + sendBtnColor + ' p-1.5 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div role="separator" aria-orientation="vertical" className="group relative hidden w-3 shrink-0 cursor-col-resize bg-[var(--background)] md:flex">
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-[var(--border)] transition-colors group-hover:bg-[var(--muted-foreground)]/30" aria-hidden />
        </div>

        {/* RIGHT: Right Panel */}
        {rightPanel}
      </div>
    </div>
  )
}
