import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Server, Ticket, Activity, Settings, Building2 } from 'lucide-react';

import { ShieldAlert } from 'lucide-react';

const ALL_LINKS = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard, supportHidden: true, platformOwnerHidden: true },
  { name: 'Servers', path: '/servers', icon: Server, supportHidden: true, platformOwnerHidden: true },
  { name: 'Alerts', path: '/alerts', icon: ShieldAlert, supportHidden: true, platformOwnerHidden: true },
  { name: 'Tickets', path: '/tickets', icon: Ticket, supportHidden: false, platformOwnerHidden: true },
  { name: 'Activity', path: '/activity', icon: Activity, supportHidden: true, platformOwnerHidden: true },
  { name: 'Settings', path: '/settings', icon: Settings, supportHidden: true, platformOwnerHidden: true },
  { name: 'Orgs', path: '/organizations', icon: Building2, supportHidden: true, platformOwnerOnly: true },
];

export default function BottomNav() {
  const location = useLocation();
  const { user, isPlatformOwner } = useAuth();
  const isSupport = user?.role === 'support';

  const links = ALL_LINKS.filter((l) => {
    if (l.platformOwnerOnly) return isPlatformOwner;
    if (isPlatformOwner && l.platformOwnerHidden) return false;
    if (isSupport && l.supportHidden) return false;
    return true;
  });

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[var(--bg-main)] border-t border-[var(--border-color)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around" style={{ height: '64px' }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            location.pathname === link.path ||
            (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <li key={link.path} className="flex-1">
              <Link
                to={link.path}
                className={`relative h-full flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${
                  isActive
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
                aria-current={isActive ? 'page' : undefined}
                style={{ minHeight: '44px' }}
              >
                {/* Active glow background */}
                {isActive && (
                  <span className="absolute w-12 h-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/8 -z-10" />
                )}
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {/* Active pip indicator */}
                {isActive && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[var(--text-primary)]" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
