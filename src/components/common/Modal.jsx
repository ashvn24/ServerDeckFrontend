import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const overlayRef = useRef();
  const { theme } = useTheme();

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

  return createPortal(
    <div
      data-theme={theme === 'light' ? 'light' : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div
        className={`glass-card relative z-10 w-full flex flex-col max-h-[90vh] ${maxWidth} border border-[var(--border-color)] shadow-2xl animate-in zoom-in-95 fade-in duration-300`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-7 border-b border-[var(--border-color)] bg-[var(--bg-card-hover)] rounded-t-[1.5rem]">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)] font-display leading-none">{title}</h3>
            <div className="h-1 w-8 bg-[var(--accent-violet)] mt-3 rounded-full" />
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-all duration-300 group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="px-8 py-8 overflow-y-auto no-scrollbar relative">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

