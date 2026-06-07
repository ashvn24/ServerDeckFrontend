import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, Box, LogOut, User, Settings, Shield, LifeBuoy, Sun, Moon } from 'lucide-react';

const ALL_NAV_LINKS = [
  { name: 'Dashboard', path: '/dashboard', supportHidden: true },
  { name: 'Servers', path: '/servers', supportHidden: true },
  { name: 'Tickets', path: '/tickets', supportHidden: false },
  { name: 'Activity', path: '/activity', supportHidden: true },
  { name: 'Settings', path: '/settings', supportHidden: true },
];


export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isPlatformOwner, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isSupport = user?.role === 'support';
  const NAV_LINKS = isPlatformOwner ? [] : ALL_NAV_LINKS.filter(l => isSupport ? !l.supportHidden : true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border-color)]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-4 sm:px-6 md:px-12 flex items-center justify-between" style={{ height: 'var(--nav-height)' }}>
        {/* Logo & Links */}
        <div className="flex items-center gap-6 md:gap-12">
          <Link to="/dashboard" className="flex items-center gap-3 md:gap-4 group">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-500">
              <Box className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <span className="text-base md:text-xl font-black tracking-tighter uppercase font-display text-white">ServerDeck</span>
          </Link>


          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    isActive 
                      ? 'text-white' 
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right cluster: theme toggle + profile */}
        <div className="flex items-center gap-3">
          {/* Theme toggle (dark is default) */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-10 h-10 rounded-2xl flex items-center justify-center border border-[var(--border-color)] bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
          >
            {theme === 'dark'
              ? <Sun className="w-[18px] h-[18px]" />
              : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-4 p-2 rounded-2xl transition-all border ${
              showDropdown ? 'bg-white/10 border-white/10' : 'bg-transparent border-transparent hover:bg-white/5'
            }`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{
                user?.role === 'support' ? 'Support Agent' : 'Operator'
              }</p>
              <p className="text-xs font-black text-white uppercase tracking-tight">{user?.name || 'Authorized'}</p>
            </div>
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-sm ${
                user?.role === 'support' ? 'bg-sky-500 shadow-sky-500/20' :
                user?.role === 'admin' ? 'bg-indigo-500 shadow-indigo-500/20' :
                'bg-[var(--accent-violet)] shadow-violet-500/20'
              }`}>
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--bg-main)] rounded-full flex items-center justify-center p-0.5 border border-[var(--border-color)]">
                 <div className="w-full h-full bg-[var(--accent-mint)] rounded-full animate-pulse-dot" />
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-4 min-w-[240px] sm:min-w-[280px] max-w-[calc(100vw-2rem)] glass-card p-2 sm:p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50 origin-top-right">
               <div className="p-4 mb-2">
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-sm font-black text-white uppercase tracking-tight truncate">{user?.email}</p>
               </div>
               
               <div className="space-y-1">
                 <Link 
                   to="/settings" 
                   onClick={() => setShowDropdown(false)}
                   className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all group"
                 >
                    <User className="w-4 h-4 group-hover:text-[var(--accent-violet)] transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Operator Profile</span>
                 </Link>
                 <Link 
                   to="/settings" 
                   onClick={() => setShowDropdown(false)}
                   className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all group"
                 >
                    <Shield className="w-4 h-4 group-hover:text-[var(--accent-mint)] transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Security Policy</span>
                 </Link>
               </div>

               <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                  >
                     <LogOut className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                  </button>
               </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
}
