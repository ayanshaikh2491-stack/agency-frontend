'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompany } from '@/lib/client-context'
import { ChevronDown, Plus, X, Loader2 } from 'lucide-react'

const panelAnim = {
  initial: { opacity: 0, x: -8, scale: 0.97 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -8, scale: 0.97 },
}

export default function ClientSwitcher({ children }) {
  const { companies, selectedCompany, selectedCompanyId, setSelectedCompanyId } = useCompany()
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [panelOpen])

  const current = selectedCompany || companies[0]
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const createInputRef = useRef(null)

  useEffect(() => {
    if (createOpen && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [createOpen])

  const handleCreate = useCallback(async () => {
    const name = createName.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, display_name: name, company: name }),
      })
      if (!res.ok) throw new Error('Failed to create')
      setCreateOpen(false)
      setCreateName('')
      window.location.reload()
    } catch (e) {
      alert('Failed to create workspace: ' + e.message)
    } finally {
      setCreating(false)
    }
  }, [createName, creating])

  if (!current || !companies.length) {
    return (
      <div className="w-16 shrink-0 bg-sidebar border-r border-sidebar-border h-screen" />
    )
  }

  return (
    <>
      <div className="flex h-screen">
        {/* COLUMN 1: Client Avatar Strip */}
        <div className="w-16 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-1 overflow-y-auto relative z-30">
          {companies.map((client) => {
            const isActive = client.id === current.id
            return (
              <div key={client.id} className="relative flex items-center justify-center w-full h-12">
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                    />
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setSelectedCompanyId(client.id)}
                  className={`
                    group relative
                    w-10 h-10 flex items-center justify-center
                    text-xs font-bold text-white
                    transition-all duration-200 ease-in-out
                    ${isActive
                      ? 'rounded-xl scale-105'
                      : 'rounded-full hover:rounded-xl hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: client.color || '#6B6C6E' }}
                  aria-label={client.name}
                >
                  {(client.name || '?').charAt(0).toUpperCase()}

                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-sidebar border border-sidebar-border rounded-lg text-xs text-sidebar-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none shadow-xl">
                    <div className="font-medium text-sidebar-primary">{client.name}</div>
                    <div className="text-[10px] text-sidebar-foreground/70 mt-0.5">
                      {client.plan || 'Active'}
                    </div>
                  </div>
                </button>
              </div>
            )
          })}

          <button
            onClick={() => setCreateOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-primary hover:bg-sidebar-accent/50 transition-all duration-200 border border-dashed border-sidebar-border mt-1 shrink-0"
            title="Add workspace"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* COLUMN 2: Sidebar + Header */}
        <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-full relative z-20">
          {/* Header: active workspace name + chevron */}
          <div className="flex items-center h-12 shrink-0 px-3 border-b border-sidebar-border">
            <button
              onClick={() => setPanelOpen(p => !p)}
              className="flex items-center gap-2 flex-1 min-w-0 h-full text-left hover:bg-sidebar-accent transition-colors rounded-md px-2"
            >
              <span
                className="size-5 shrink-0 rounded flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: current.color || '#6B6C6E' }}
              >
                {(current.name || '?').charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-sm font-medium text-sidebar-primary flex-1">
                {current.name}
              </span>
              <motion.div
                animate={{ rotate: panelOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground" />
              </motion.div>
            </button>
          </div>

          {/* Children: nav items + account menu from layout */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </div>
        </aside>

        {/* FLOATING WORKSPACE PANEL */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              ref={panelRef}
              className="absolute left-16 top-4 w-72 bg-sidebar border border-sidebar-border rounded-xl shadow-2xl p-4 z-50"
              initial={panelAnim.initial}
              animate={panelAnim.animate}
              exit={panelAnim.exit}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 mb-3 px-1">
                Your Workspaces
              </div>

              <div className="space-y-1 max-h-80 overflow-y-auto">
                {companies.map((client) => {
                  const isActive = client.id === current.id
                  return (
                    <button
                      key={client.id}
                      onClick={() => { setSelectedCompanyId(client.id); setPanelOpen(false) }}
                      className={`
                        flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all duration-150
                        ${isActive
                          ? 'bg-sidebar-accent ring-1 ring-primary/30'
                          : 'hover:bg-sidebar-accent/70'
                        }
                      `}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: client.color || '#6B6C6E' }}
                      >
                        {(client.name || '?').charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-sidebar-primary truncate">
                          {client.name}
                        </div>
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="activeDot"
                          className="w-2 h-2 rounded-full bg-primary shrink-0"
                          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-sidebar-border">
                <button onClick={() => { setPanelOpen(false); setCreateOpen(true) }} className="flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all duration-150 hover:bg-sidebar-accent/70">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-sidebar-accent border border-dashed border-sidebar-border shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary">
                      Create Workspace
                    </div>
                    <div className="text-[11px] text-sidebar-foreground/60">
                      Add a new client workspace
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !creating && setCreateOpen(false)}
          >
            <motion.div
              className="w-80 bg-card border border-border rounded-xl shadow-modal p-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Create Workspace</h3>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={creating}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={createInputRef}
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Workspace name..."
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-4"
                disabled={creating}
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!createName.trim() || creating}
                  className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
