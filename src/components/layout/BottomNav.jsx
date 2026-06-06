import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Server, Ticket, Activity, Settings, Building2 } from 'lucide-react';

const ALL_LINKS = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard, supportHidden: true, platformOwnerHidden: true },
  { name: 'Servers', path: '/servers', icon: Server, supportHidden: true, platformOwnerHidden: true },
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[var(--bg-main)]/90 backdrop-blur-xl border-t border-[var(--border-color)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            location.pathname === link.path ||
            (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <li key={link.path} className="flex-1">
              <Link
                to={link.path}
                className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-black uppercase tracking-[0.15em]">{link.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
