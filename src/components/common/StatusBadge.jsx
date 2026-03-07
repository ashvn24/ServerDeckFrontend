export default function StatusBadge({ status, size = 'sm' }) {
  const isOnline = status === 'online' || status === true;
  const isWarning = status === 'warning';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  let dotColor, textColor, bgLight, label;
  if (isOnline) {
    dotColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
    textColor = 'text-emerald-700';
    bgLight = 'bg-emerald-50 border border-emerald-100/50';
    label = 'Online';
  } else if (isWarning) {
    dotColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]';
    textColor = 'text-amber-700';
    bgLight = 'bg-amber-50 border border-amber-100/50';
    label = 'Warning';
  } else {
    dotColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    textColor = 'text-red-700';
    bgLight = 'bg-red-50 border border-red-100/50';
    label = 'Offline';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-bold tracking-wide uppercase ${textColor} ${bgLight} ${padding} rounded-full`}>
      <span className={`relative flex ${dotSize}`}>
        {isOnline && (
          <span className={`animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${dotColor}`} />
      </span>
      {label}
    </span>
  );
}
