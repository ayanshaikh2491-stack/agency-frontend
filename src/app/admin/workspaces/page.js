'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Building2, Globe, Mail, Phone, ExternalLink, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newContact, setNewContact] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [selectedWs, setSelectedWs] = useState(null)

  useEffect(() => { loadWorkspaces() }, [])

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
      toast.success(`Workspace "${newName}" created!`)
      setNewName(''); setNewIndustry(''); setNewEmail(''); setNewContact(''); setNewWebsite('')
      setShowCreate(false)
      loadWorkspaces()
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function deleteWorkspace(id, name) {
    if (!confirm(`Delete workspace "${name}"?`)) return
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`Workspace "${name}" deleted`)
      loadWorkspaces()
      if (selectedWs?.id === id) setSelectedWs(null)
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2>Workspaces</h2>
          <Badge variant="secondary">{workspaces.length} Client(s)</Badge>
        </div>
        <div className="topbar-actions">
          <Button
            variant={showCreate ? 'ghost' : 'default'}
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? (
              <><X className="h-4 w-4 mr-1" /> Cancel</>
            ) : (
              <><Plus className="h-4 w-4 mr-1" /> New Workspace</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 px-6">
        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-5"
            >
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    New Client Workspace
                  </h3>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Company Name *
                      </label>
                      <input
                        className="form-input"
                        placeholder="e.g. Texas Roofing Co"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Industry
                      </label>
                      <input
                        className="form-input"
                        placeholder="e.g. Roofing"
                        value={newIndustry}
                        onChange={e => setNewIndustry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Contact Email
                      </label>
                      <input
                        className="form-input"
                        placeholder="client@email.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Contact Name
                      </label>
                      <input
                        className="form-input"
                        placeholder="John Doe"
                        value={newContact}
                        onChange={e => setNewContact(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Website
                      </label>
                      <input
                        className="form-input"
                        placeholder="https://example.com"
                        value={newWebsite}
                        onChange={e => setNewWebsite(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={createWorkspace} disabled={!newName.trim()}>
                      Create Workspace
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCreate(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-[10px] bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                    <div className="w-2 h-2 rounded-full bg-muted animate-pulse shrink-0" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 bg-muted rounded animate-pulse w-full" />
                    <div className="h-2.5 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-muted p-6">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No workspaces yet
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm">
              Click &quot;New Workspace&quot; to add your first client.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Workspace
            </Button>
          </div>
        )}

        {/* Workspace Grid */}
        {!loading && workspaces.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {workspaces.map(ws => (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-colors ${
                    selectedWs?.id === ws.id
                      ? 'ring-1 ring-primary border-primary'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedWs(selectedWs?.id === ws.id ? null : ws)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {(ws.name || ws.company || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {ws.name || ws.company || 'Unnamed'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {ws.industry || 'General'} · {ws.status || 'active'}
                        </div>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          ws.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/50'
                        }`}
                      />
                    </div>

                    {/* Detail expand */}
                    <AnimatePresence initial={false}>
                      {selectedWs?.id === ws.id && (
                        <motion.div
                          key="detail"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border mt-3 pt-3 space-y-1.5">
                            {ws.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{ws.email}</span>
                              </div>
                            )}
                            {ws.contact && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">{ws.contact}</span>
                              </div>
                            )}
                            {ws.website && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Globe className="h-3 w-3 shrink-0" />
                                <span className="truncate">{ws.website}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600/40 hover:bg-green-600/10 hover:text-green-500"
                              onClick={e => {
                                e.stopPropagation()
                                toast.success('CEO notified about this client')
                              }}
                            >
                              Notify CEO
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/40 hover:bg-destructive/10"
                              onClick={e => {
                                e.stopPropagation()
                                deleteWorkspace(ws.id, ws.name || ws.company)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
