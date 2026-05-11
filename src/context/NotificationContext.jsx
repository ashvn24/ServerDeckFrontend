import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const closeToast = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-10 right-10 z-[300] flex flex-col gap-4 pointer-events-none">
        {notifications.map((n) => (
          <Toast key={n.id} {...n} onClose={() => closeToast(n.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[var(--accent-mint)]" />,
    error: <ShieldAlert className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-[var(--accent-violet)]" />,
  };

  return (
    <div className="pointer-events-auto animate-in slide-in-from-right-10 fade-in duration-500">
      <div className="glass-card !bg-black/60 !backdrop-blur-xl border border-white/10 px-6 py-4 flex items-center gap-5 min-w-[320px] shadow-2xl shadow-black/50 group">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">System Relay</p>
          <p className="text-sm font-bold text-white leading-tight">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const useNotification = () => useContext(NotificationContext);
