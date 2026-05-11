import { HelpCircle, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  title = "Confirm Action", 
  message, 
  type = "warning", 
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-b ${type === 'danger' ? 'from-red-500/20 text-red-500' : 'from-amber-500/20 text-amber-500'} flex items-center justify-center relative`}>
          <div className="absolute inset-0 rounded-3xl bg-current opacity-10" />
          {type === 'danger' ? <AlertTriangle className="w-12 h-12" /> : <HelpCircle className="w-12 h-12" />}
        </div>

        <div className="space-y-4">
          <h4 className="text-xl font-black text-white uppercase tracking-tight font-display">{message}</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            This action might have irreversible consequences. Please verify that you wish to proceed.
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white/5 text-white hover:bg-white/10 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all transform hover:scale-[1.05] active:scale-[0.95] shadow-lg ${
              type === 'danger' 
                ? 'bg-red-500 text-white shadow-red-500/20' 
                : 'bg-white text-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
