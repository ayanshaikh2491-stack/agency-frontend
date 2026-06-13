'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Search, Menu } from 'lucide-react';
import { useCompany } from '@/lib/client-context';

/**
 * BreadcrumbBar — Paperclip-exact breadcrumb navigation
 * Source: github.com/paperclipai/paperclip/ui/src/components/BreadcrumbBar.tsx
 *
 * Renders:
 * - Mobile: hamburger menu + page title
 * - Desktop single: page title (uppercase)
 * - Desktop multi: breadcrumb trail with separators
 * - Global toolbar slot (search, plugin buttons)
 */

const ROUTE_LABELS = {
  '/admin/dashboard': 'Dashboard',
  '/admin/dashboard/tickets': 'Tickets',
  '/admin/dashboard/org': 'Org Chart',
  '/admin/inbox': 'Inbox',
  '/admin/routines': 'Routines',
  '/admin/goals': 'Goals',
  '/admin/activity': 'Activity',
  '/admin/settings': 'Settings',
};

export default function BreadcrumbBar() {
  const pathname = usePathname();
  const { selectedCompany } = useCompany();

  // Build breadcrumb segments from pathname
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = [];
    let running = '';

    // First: company/workspace name
    if (selectedCompany?.name) {
      crumbs.push({ label: selectedCompany.name, href: '/admin/dashboard' });
    }

    // Then: path segments
    for (const seg of segments) {
      if (seg === 'admin') continue;
      if (seg === 'dashboard') {
        running = '/admin/dashboard';
        crumbs.push({ label: 'Dashboard', href: running });
        continue;
      }
      running = running ? `${running}/${seg}` : `/admin/${seg}`;
      const label = ROUTE_LABELS[running] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, href: running });
    }

    return crumbs;
  }, [pathname, selectedCompany]);

  const isSingle = breadcrumbs.length <= 1;

  return (
    <div className="flex items-center justify-between px-6 h-12 shrink-0 border-b border-border bg-background">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        {isSingle ? (
          <h1 className="text-sm font-medium text-foreground">
            {breadcrumbs[0]?.label || 'Dashboard'}
          </h1>
        ) : (
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && (
                    <span className="text-muted-foreground/30 mx-0.5 select-none">/</span>
                  )}
                  {isLast ? (
                    <span className="text-foreground font-medium truncate">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors truncate shrink-0"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right: Toolbar */}
      <div className="flex items-center gap-1">
        <button
          className="inline-flex items-center justify-center size-8 hover:bg-accent/50 rounded transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
