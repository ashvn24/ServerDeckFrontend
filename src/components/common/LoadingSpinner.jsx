import { Box } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const containerClass = {
    sm: 'w-6 h-6 rounded-md',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
  }[size];

  const iconClass = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  }[size];

  const isPageLoader = size === 'lg';

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${isPageLoader ? 'fixed inset-0 z-50 pointer-events-none' : 'py-12'}`}>
      <div className={`bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-heartbeat ${containerClass}`}>
        <Box className={`${iconClass} text-black`} />
      </div>
      {text && <p className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">{text}</p>}
    </div>
  );
}
