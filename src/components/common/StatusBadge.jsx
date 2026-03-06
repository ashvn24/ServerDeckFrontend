export default function StatusBadge({ status, size = 'sm' }) {
  const isOnline = status === 'online' || status === true;
  const isWarning = status === 'warning';

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  let dotColor, textColor, label;
  if (isOnline) {
    dotColor = 'bg-emerald-500';
    textColor = 'text-emerald-700';
    label = 'Online';
  } else if (isWarning) {
    dotColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    label = 'Warning';
  } else {
    dotColor = 'bg-red-500';
    textColor = 'text-red-600';
    label = 'Offline';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-medium ${textColor}`}>
      <span className={`relative flex ${dotSize}`}>
        {isOnline && (
          <span className={`animate-pulse-dot absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${dotColor}`} />
      </span>
      {label}
    </span>
  );
}
