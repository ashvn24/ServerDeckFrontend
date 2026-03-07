import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const overlayRef = useRef();

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0f172a]/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`bg-white/70 backdrop-blur-2xl border border-white/60 shadow-glass-card rounded-[2rem] w-full flex flex-col max-h-[85vh] ${maxWidth} transform transition-all duration-300 ease-out`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-white/40 bg-white/30 rounded-t-[2rem]">
          <h3 className="text-xl font-bold tracking-tight text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/50 hover:shadow-sm transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body (Scrollable) */}
        <div className="px-8 py-6 overflow-y-auto form-scroll">
          {children}
        </div>
      </div>
    </div>
  );
}
