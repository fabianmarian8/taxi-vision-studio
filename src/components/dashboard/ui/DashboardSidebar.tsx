'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Pencil, CreditCard, Settings, ExternalLink } from 'lucide-react';
import { ReactNode } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  partnerSlug: string | null;
  publicProfileUrl?: string | null;
  isSuperadmin?: boolean;
}

export function DashboardSidebar({ partnerSlug, publicProfileUrl, isSuperadmin }: DashboardSidebarProps) {
  const pathname = usePathname();

  const partnerGroup: SidebarItem[] = [
    { label: 'Prehľad', href: '/partner', icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  if (partnerSlug) {
    partnerGroup.push({
      label: 'Môj profil',
      href: `/partner/edit/${partnerSlug}`,
      icon: <Pencil className="h-4 w-4" />,
    });
  }

  if (publicProfileUrl) {
    partnerGroup.push({
      label: 'Pozrieť verejne',
      href: publicProfileUrl,
      icon: <ExternalLink className="h-4 w-4" />,
      external: true,
    });
  }

  const accountGroup: SidebarItem[] = [
    { label: 'Predplatné', href: '/partner#balik', icon: <CreditCard className="h-4 w-4" /> },
  ];

  if (isSuperadmin) {
    accountGroup.push({
      label: 'Admin',
      href: '/admin',
      icon: <Settings className="h-4 w-4" />,
    });
  }

  const groups: SidebarGroup[] = [
    { label: 'Môj partner', items: partnerGroup },
    { label: 'Účet', items: accountGroup },
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:flex-shrink-0 md:sticky md:top-6 md:self-start">
      <nav className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        {groups.map((group, i) => (
          <div key={group.label} className={i > 0 ? 'mt-4' : ''}>
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  !item.external &&
                  (item.href === '/partner'
                    ? pathname === '/partner'
                    : pathname.startsWith(item.href.split('#')[0]));

                const classes = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`;

                if (item.external) {
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={classes}
                      >
                        <span className="text-gray-400">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link href={item.href} className={classes}>
                      <span className={active ? 'text-amber-600' : 'text-gray-400'}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
