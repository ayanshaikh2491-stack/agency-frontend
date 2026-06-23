'use client'
import { useRouter } from 'next/navigation'
import { Building2, Activity, Server, Zap, Users, Globe, DollarSign, Shield, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function SectionHeader({ label }) {
  return (
    <div className="px-1 py-1.5">
      <div className="inline-flex items-center px-1 py-0.5">
        <span className="text-[10px] font-medium uppercase tracking-widest font-mono text-muted-foreground/60">
          {label}
        </span>
      </div>
    </div>
  )
}

const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function SettingsPage() {
  const router = useRouter()
  return (
    <>
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2>Admin</h2>
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Settings
          </Badge>
        </div>
        <div className="topbar-actions">
          <Button variant="outline" size="sm" onClick={() => toast.success('Settings saved')}>
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="page-content p-6 space-y-2">
        <SectionHeader label="Settings" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {/* Company Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="form-group">
                <label>Company Name</label>
                <input className={inputClass} defaultValue="Ayan Agency" />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input className={inputClass} defaultValue="AI Marketing Agency" />
              </div>
              <div className="form-group">
                <label className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Monthly Budget
                </label>
                <input
                  className={inputClass}
                  defaultValue="Not configured"
                  placeholder="Set budget limit"
                />
              </div>
            </CardContent>
          </Card>

          {/* Backend Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4 text-muted-foreground" />
                Backend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between py-2.5 first:pt-0">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 shrink-0" />
                    EC2 Backend
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 text-[11px]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    Agents
                  </span>
                  <span className="text-sm font-medium text-foreground">9 enabled</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    Leads
                  </span>
                  <span className="text-sm font-medium text-foreground">431</span>
                </div>
                <div className="flex items-center justify-between py-2.5 last:pb-0">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    Version
                  </span>
                  <span className="text-sm font-medium text-foreground">v0.3</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
