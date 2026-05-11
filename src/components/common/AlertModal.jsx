import { ShieldAlert, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

export default function AlertModal({ 
  isOpen, 
  onClose, 
  title = "Security Alert", 
  message, 
  type = "error", 
  confirmText = "Understood",
  onConfirm
}) {
  const getIcon = () => {
    switch (type) {
      case 'error': return <ShieldAlert className="w-12 h-12 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-12 h-12 text-[var(--accent-mint)]" />;
      default: return <Info className="w-12 h-12 text-[var(--accent-violet)]" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'error': return 'from-red-500/20 to-transparent text-red-500';
      case 'warning': return 'from-amber-500/20 to-transparent text-amber-500';
      case 'success': return 'from-[var(--accent-mint)]/20 to-transparent text-[var(--accent-mint)]';
      default: return 'from-[var(--accent-violet)]/20 to-transparent text-[var(--accent-violet)]';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Animated Icon Wrapper */}
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-b ${getTypeStyles()} flex items-center justify-center relative group`}>
          <div className="absolute inset-0 rounded-3xl bg-current opacity-10 animate-ping group-hover:animate-none" />
          <div className="relative z-10">
            {getIcon()}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)]">Authorization Engine</p>
          <h4 className="text-xl font-black text-white uppercase tracking-tight font-display">{message}</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[280px] mx-auto">
            Your current role does not have the necessary permissions to execute this operation. Please contact your system administrator if you believe this is an error.
          </p>
        </div>

        <button
          onClick={() => {
            onConfirm?.();
            onClose();
          }}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
            type === 'error' 
              ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' 
              : 'bg-[var(--accent-violet)] text-white shadow-violet-500/20 hover:bg-[var(--accent-violet-hover)]'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
