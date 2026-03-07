import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm flex items-center justify-end px-8 sticky top-0 z-30">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
