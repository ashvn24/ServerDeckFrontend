import { ShieldAlert } from 'lucide-react';

export default function RestrictedView({ title = "Access Restricted", message = "This feature is not available for your current authorization level." }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center text-center py-32 px-10">
      <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-red-500/10 ring-4 ring-red-500/5">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-3xl font-black uppercase tracking-tight mb-4 font-display text-white">{title}</h3>
      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest max-w-sm leading-relaxed mb-8">
        {message}
      </p>
      <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Insufficient Privileges</span>
      </div>
    </div>
  );
}
