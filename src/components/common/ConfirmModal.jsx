import { useState, useEffect } from 'react';
import { HelpCircle, AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  title = "Confirm Action", 
  message, 
  type = "warning", 
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  requiresVerification = false,
  verificationText = "Delete"
}) {
  const [inputValue, setInputValue] = useState('');
  const isDanger = type === 'danger' || requiresVerification;

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const canConfirm = !requiresVerification || inputValue.toLowerCase() === verificationText.toLowerCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-b ${isDanger ? 'from-red-500/20 text-red-500' : 'from-amber-500/20 text-amber-500'} flex items-center justify-center relative`}>
          <div className="absolute inset-0 rounded-3xl bg-current opacity-10" />
          {isDanger ? <AlertTriangle className="w-12 h-12" /> : <HelpCircle className="w-12 h-12" />}
        </div>

        <div className="space-y-4 w-full">
          <h4 className="text-xl font-black text-white uppercase tracking-tight font-display">{message}</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {requiresVerification 
              ? `This action is destructive. To proceed, please type "${verificationText}" in the field below.`
              : "This action might have irreversible consequences. Please verify that you wish to proceed."
            }
          </p>
        </div>

        {requiresVerification && (
          <div className="w-full space-y-3">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-left block ml-1">
              Verification Required
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type "${verificationText}" to confirm`}
              className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-red-500 outline-none transition-all text-center"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-4 w-full pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white/5 text-white hover:bg-white/10 transition-all"
          >
            {cancelText}
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                onConfirm?.();
                onClose();
              }
            }}
            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all transform ${canConfirm ? 'hover:scale-[1.05] active:scale-[0.95] shadow-lg' : 'opacity-30 cursor-not-allowed'} ${
              isDanger 
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
