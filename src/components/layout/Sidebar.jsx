import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Server, Shield } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0a0f1c]/90 backdrop-blur-2xl border-r border-[#1e293b]/50 flex flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20">
          <Server className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">ServerDeck</h1>
          <p className="text-xs text-gray-400 font-medium">Server Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${isActive
                ? 'bg-gradient-to-r from-primary-600/30 to-primary-900/10 text-primary-400 border border-primary-500/20 shadow-sm'
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#1e293b]/50 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-primary-400' : ''}`} />
                {item.label}
              </>
            )}
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
