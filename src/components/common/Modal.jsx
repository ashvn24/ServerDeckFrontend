import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const overlayRef = useRef();

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div
        className={`glass-card relative z-10 w-full flex flex-col max-h-[90vh] ${maxWidth} border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-300`}
      >
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[inherit] -z-10 opacity-50" />

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-7 border-b border-white/5 bg-white/2 rounded-t-[2.5rem]">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white font-display leading-none">{title}</h3>
            <div className="h-1 w-8 bg-[var(--accent-violet)] mt-3 rounded-full" />
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all duration-300 group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="px-8 py-8 overflow-y-auto no-scrollbar relative">
          {children}
        </div>
      </div>
    </div>
  );
}

