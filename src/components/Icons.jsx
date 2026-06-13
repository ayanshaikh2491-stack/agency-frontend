'use client'

// ─── SVG Icons (Minimal, Lucide-style — Paperclip aesthetic) ───

export function DashboardIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="1" width="7" height="7" rx="1" />
      <rect x="10" y="1" width="7" height="7" rx="1" />
      <rect x="1" y="10" width="7" height="7" rx="1" />
      <rect x="10" y="10" width="7" height="7" rx="1" />
    </svg>
  )
}

export function CEOIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 1.5C6.5 1.5 5 3 5 5s1.5 3.5 4 3.5S13 7 13 5s-1.5-3.5-4-3.5z" />
      <path d="M2.5 16.5c0-4 2.5-6 6.5-6s6.5 2 6.5 6" />
      <path d="M9 12c2 0 4 .5 5.5 2" />
      <circle cx="9" cy="5" r="1.5" />
    </svg>
  )
}

export function AgentsIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7" cy="5" r="2.5" />
      <circle cx="13" cy="6" r="2" />
      <path d="M2 15c0-3 2-4.5 5-4.5s5 1.5 5 4.5" />
      <path d="M11 14c0-2 1.5-3 4-3s4 1 4 3" />
    </svg>
  )
}

export function ActivityIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="1 10 5 10 7 4 9 14 11 8 13 10 17 10" />
    </svg>
  )
}

export function InboxIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="1 9 5 9 7 11 11 11 13 9 17 9" />
      <rect x="1" y="4" width="16" height="11" rx="1.5" />
    </svg>
  )
}

export function IssuesIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="9" r="7" />
      <line x1="9" y1="5" x2="9" y2="10" />
      <circle cx="9" cy="13" r="0.8" />
    </svg>
  )
}

export function SettingsIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4" />
    </svg>
  )
}

export function WorkflowsIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="4" cy="4" r="2" />
      <circle cx="14" cy="4" r="2" />
      <circle cx="9" cy="14" r="2" />
      <line x1="5.5" y1="5.5" x2="7.5" y2="12" />
      <line x1="12.5" y1="5.5" x2="10.5" y2="12" />
    </svg>
  )
}

export function OrgIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="1" width="8" height="3" rx="1" />
      <line x1="9" y1="4" x2="9" y2="7" />
      <rect x="1" y="7" width="7" height="3" rx="1" />
      <rect x="10" y="7" width="7" height="3" rx="1" />
      <line x1="4.5" y1="10" x2="4.5" y2="14" />
      <line x1="13.5" y1="10" x2="13.5" y2="14" />
      <circle cx="4.5" cy="15.5" r="1.5" />
      <circle cx="13.5" cy="15.5" r="1.5" />
    </svg>
  )
}

export function CRM(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 15c0-3 2-5 7-5s7 2 7 5" />
      <circle cx="9" cy="5" r="3" />
      <line x1="10" y1="10" x2="10" y2="13" />
      <line x1="8" y1="13" x2="12" y2="13" />
    </svg>
  )
}

export function SocialIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 1C5 1 2 3.5 2 6.5c0 1.5 1 2.8 2.5 3.8L4 13l3-1.5c.6.2 1.3.3 2 .3 4 0 7-2.5 7-5.5S13 1 9 1z" />
      <line x1="6" y1="5" x2="7" y2="5" />
      <line x1="6" y1="8" x2="7" y2="8" />
      <line x1="11" y1="5" x2="12" y2="5" />
      <line x1="11" y1="8" x2="12" y2="8" />
    </svg>
  )
}

export function RefreshIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 1v4h-4" />
      <path d="M2 13V9h4" />
      <path d="M12 5A5.5 5.5 0 0 1 2.5 9" />
      <path d="M2 9A5.5 5.5 0 0 1 11.5 5" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="6" r="4.5" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" />
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="7" y1="2" x2="7" y2="12" />
      <line x1="2" y1="7" x2="12" y2="7" />
    </svg>
  )
}

export function ChevronDown(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="2 4 6 8 10 4" />
    </svg>
  )
}

export function ExternalLinkIcon(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 1h4v4" />
      <path d="M11 1L6 6" />
      <path d="M9 8v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="2 7 5 10 12 3" />
    </svg>
  )
}

export function InfoIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7" cy="7" r="6" />
      <line x1="7" y1="6" x2="7" y2="10" />
      <circle cx="7" cy="4.5" r="0.7" />
    </svg>
  )
}

export function OrgChartIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7" cy="2" r="1.5" />
      <circle cx="4" cy="7" r="1.5" />
      <circle cx="10" cy="7" r="1.5" />
      <circle cx="7" cy="12" r="1.5" />
      <line x1="7" y1="3.5" x2="4.5" y2="5.5" />
      <line x1="7" y1="3.5" x2="9.5" y2="5.5" />
      <line x1="4.5" y1="8.5" x2="6.5" y2="10.5" />
      <line x1="9.5" y1="8.5" x2="7.5" y2="10.5" />
    </svg>
  )
}

export function ListIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" y1="3" x2="12" y2="3" />
      <line x1="4" y1="7" x2="12" y2="7" />
      <line x1="4" y1="11" x2="12" y2="11" />
      <circle cx="1.5" cy="3" r="0.7" />
      <circle cx="1.5" cy="7" r="0.7" />
      <circle cx="1.5" cy="11" r="0.7" />
    </svg>
  )
}

// ─── Additional Icons ───

export function MenuIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="14" y2="12" />
    </svg>
  )
}

export function LogOutIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 12v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <polyline points="14 8 10 4" />
      <line x1="14" y1="8" x2="6" y2="8" />
      <polyline points="10 12 14 8" />
    </svg>
  )
}

export function LogoIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="9" r="7" />
      <path d="M5.5 9h7M9 5.5v7" strokeWidth="1.5" />
    </svg>
  )
}

// Alias for layout imports
export const CRMIcon = CRM
export const ChevronDownIcon = ChevronDown

export function ConnectIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="5" r="2" />
      <circle cx="13" cy="13" r="2" />
      <line x1="6.5" y1="6.5" x2="11.5" y2="11.5" />
      <line x1="7" y1="5" x2="11" y2="5" />
      <line x1="5" y1="7" x2="5" y2="11" />
    </svg>
  )
}

export function SBAIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="4" r="2.5" />
      <path d="M4 16c0-3 2-5 5-5s5 2 5 5" />
      <rect x="6" y="9" width="6" height="3" rx="0.5" />
      <path d="M12 11l2 2" />
      <path d="M14 6l-2 2" />
      <path d="M6 11l-2 2" />
      <path d="M4 6l2 2" />
    </svg>
  )
}

export function GoalsIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="9" r="4" />
      <circle cx="9" cy="9" r="1.5" />
    </svg>
  )
}

export function TicketsIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="4" width="16" height="10" rx="2" />
      <line x1="5" y1="4" x2="5" y2="14" />
      <line x1="13" y1="4" x2="13" y2="14" />
      <line x1="8" y1="8" x2="8" y2="10" />
      <line x1="10" y1="8" x2="10" y2="10" />
    </svg>
  )
}
