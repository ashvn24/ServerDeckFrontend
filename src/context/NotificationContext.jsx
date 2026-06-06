import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const triggerClose = useCallback((id) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, closing: true } : n));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    // Randomize id to avoid collisions if multiple triggered quickly
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type, duration, closing: false }]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        triggerClose(id);
      }, duration);
    }
  }, [triggerClose]);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-10 right-10 z-[300] flex flex-col gap-4 pointer-events-none">
        {notifications.map((n) => (
          <Toast key={n.id} {...n} onClose={() => triggerClose(n.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function Toast({ message, type, closing, onClose }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[var(--accent-mint)]" />,
    error: <ShieldAlert className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-[var(--accent-violet)]" />,
  };

  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    startX.current = e.clientX ?? e.touches?.[0]?.clientX;
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const diff = clientX - startX.current;
    if (diff > 0) setOffset(diff);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (e.target.releasePointerCapture) {
      e.target.releasePointerCapture(e.pointerId);
    }
    if (offset > 80) {
      onClose();
    } else {
      setOffset(0);
    }
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translateX(${closing ? '120%' : offset + 'px'})`,
        opacity: closing ? 0 : 1 - (offset / 300),
        transition: isDragging ? 'none' : 'transform 300ms ease-in-out, opacity 300ms ease-in-out'
      }}
      className={`pointer-events-auto touch-none select-none ${closing ? '' : 'animate-in slide-in-from-right-10 fade-in duration-500'}`}
    >
      <div className="glass-card !bg-black/60 !backdrop-blur-xl border border-white/10 px-6 py-4 flex items-center gap-5 min-w-[320px] shadow-2xl shadow-black/50 cursor-grab active:cursor-grabbing">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">System Relay</p>
          <p className="text-sm font-bold text-white leading-tight">{message}</p>
        </div>
      </div>
    </div>
  );
}

export const useNotification = () => useContext(NotificationContext);
