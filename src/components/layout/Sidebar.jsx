import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Server, Shield } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="p-2 bg-primary-600 rounded-xl">
          <Server className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">ServerDeck</h1>
          <p className="text-xs text-gray-500">Server Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-sidebar-active text-white'
                : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Shield className="w-3.5 h-3.5" />
          <span>ServerDeck v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
