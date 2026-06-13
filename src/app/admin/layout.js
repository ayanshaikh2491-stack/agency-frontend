'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CompanyProvider, useCompany } from '@/lib/client-context'
import { motion, AnimatePresence } from 'framer-motion'
import ClientSwitcher from '@/components/ClientSwitcher'
import {
  LayoutDashboard,
  Inbox,
  CircleDot,
  Repeat,
  Target,
  History,
  SquarePen,
  Network,
  Settings,
  UserRound,
  LogOut,
  BookOpen,
  Package,
  ShieldCheck,
  DollarSign,
} from 'lucide-react'

/* ─── NavItem ─── */
function NavItem({ href, icon: Icon, label, badge }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors ${
        isActive
          ? 'bg-accent text-foreground'
          : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
          {badge}
        </span>
      )}
    </Link>
  )
}

/* ─── Section Header ─── */
function SidebarSection({ label, children }) {
  return (
    <div>
      <div className="px-3 py-1.5">
        <div className="inline-flex min-w-0 max-w-full items-center px-1 py-0.5">
          <span className="text-[10px] font-medium uppercase tracking-widest font-mono text-muted-foreground/60">
            {label}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 mt-0.5">{children}</div>
    </div>
  )
}

/* ─── Agent Row ─── */
function AgentRow({ name, emoji, status, href }) {
  const statusColors = {
    running: '#10b981',
    active: '#4ade80',
    idle: 'var(--muted-foreground)',
    paused: 'var(--error)',
    error: 'var(--error)',
  }
  const dotColor = statusColors[status] || 'var(--muted-foreground)'

  const row = (
    <div className="flex items-center gap-2.5 text-[13px] font-medium transition-colors cursor-pointer px-3 py-1.5 text-foreground/80 hover:bg-accent/50 hover:text-foreground">
      {emoji && <span className="shrink-0 text-xs">{emoji}</span>}
      <span className="flex-1 truncate">{name}</span>
      <span className="relative flex h-2 w-2 shrink-0">
        {status === 'running' ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: dotColor }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
          </>
        ) : (
          <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
        )}
      </span>
    </div>
  )

  if (href) {
    return <Link href={href} className="block no-underline">{row}</Link>
  }
  return row
}

/* ─── Account Menu ─── */
function AccountMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-border shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full text-left transition-colors hover:bg-accent/50 rounded-md p-2.5"
      >
        <div className="size-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
          A
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-foreground leading-tight">Ayan</div>
          <div className="text-[11px] text-muted-foreground truncate leading-tight">ayan@agenxy.com</div>
        </div>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 z-50 w-56 p-1.5 border border-border bg-card rounded-lg shadow-xl"
             style={{ left: '8px', right: '8px' }}>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="size-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-muted-foreground">A</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">Ayan</div>
              <div className="text-xs text-muted-foreground truncate">ayan@agenxy.com</div>
            </div>
          </div>
          <div className="border-t border-border mt-1 pt-1">
            <button className="flex items-center gap-2 w-full px-2 py-2 text-sm text-foreground/80 hover:bg-accent/50 transition-colors rounded-md">
              <UserRound className="size-4" />
              <span>Profile</span>
            </button>
            <button className="flex items-center gap-2 w-full px-2 py-2 text-sm text-foreground/80 hover:bg-accent/50 transition-colors rounded-md">
              <BookOpen className="size-4" />
              <span>Docs</span>
            </button>
            <button className="flex items-center gap-2 w-full px-2 py-2 text-sm text-foreground/80 hover:bg-accent/50 transition-colors rounded-md">
              <LogOut className="size-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sidebar Nav (children passed to ClientSwitcher) ─── */
function SidebarNav() {
  const { selectedCompany } = useCompany()
  const agents = useMemo(() => {
    if (!selectedCompany?.org?.workers) return []
    return selectedCompany.org.workers
  }, [selectedCompany])

  const mainAgents = [
    { id: 'ceo', name: 'CEO Console', status: 'running', emoji: '👑', href: '/admin/ceo' },
    { id: 'social', name: 'Social Media', status: 'running', emoji: '📱', href: '/admin/social' },
    { id: 'ads', name: 'Ads Manager', status: 'running', emoji: '📢', href: '/admin/ads' },
  ]

  return (
    <>
      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide flex flex-col gap-4 px-3 py-2">
        {/* Top */}
        <div className="flex flex-col gap-0.5">
          <Link
            href="/admin/inbox"
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/80 hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <SquarePen className="h-4 w-4 shrink-0" />
            <span className="truncate">New Task</span>
          </Link>
          <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/admin/inbox" icon={Inbox} label="Inbox" badge="3" />
        </div>

        {/* Work */}
        <SidebarSection label="Work">
          <NavItem href="/admin/dashboard/chat" icon={CircleDot} label="Boardroom" />
          <NavItem href="/admin/tickets" icon={Package} label="Tickets" />
          <NavItem href="/admin/routines" icon={Repeat} label="Routines" />
          <NavItem href="/admin/goals" icon={Target} label="Goals" />
          <NavItem href="/admin/activity" icon={History} label="Activity" />
          <NavItem href="/admin/approvals" icon={ShieldCheck} label="Approvals" />
          <NavItem href="/admin/costs" icon={DollarSign} label="Costs" />
        </SidebarSection>

        {/* Agency */}
        <SidebarSection label="Agency">
          {mainAgents.map((a) => (
            <AgentRow key={a.id} name={a.name} emoji={a.emoji} status={a.status} href={a.href} />
          ))}
          {agents.map((agent) => (
            <AgentRow key={agent.id} name={agent.label || agent.name} emoji={agent.emoji} status={agent.status} />
          ))}
        </SidebarSection>

        {/* Company */}
        <SidebarSection label="Company">
          <NavItem href="/admin/dashboard/org" icon={Network} label="Org" />
          <NavItem href="/admin/settings" icon={Settings} label="Settings" />
        </SidebarSection>
      </nav>

      <AccountMenu />
    </>
  )
}

/* ─── Layout Content ─── */
function LayoutContent({ children }) {
  const { selectedCompanyId } = useCompany()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ClientSwitcher renders Col 1 (strip) + Col 2 (sidebar header + children) */}
      <ClientSwitcher>
        <SidebarNav />
      </ClientSwitcher>

      {/* Main viewport with fade transition on client change */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCompanyId || 'default'}
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            <div className="max-w-[1400px] mx-auto w-full p-6">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }) {
  return (
    <CompanyProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </CompanyProvider>
  )
}
