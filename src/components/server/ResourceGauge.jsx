import { getResourceColor } from '../../utils/formatters';

export default function ResourceGauge({ label, value, max, unit = '%', showPercent = true }) {
  const percent = max ? Math.min((value / max) * 100, 100) : (value || 0);
  const displayValue = showPercent ? percent.toFixed(1) : value;
  const color = getResourceColor(percent);

  const barGradient = {
    primary: 'bg-gradient-to-r from-blue-400 to-blue-500',
    warning: 'bg-gradient-to-r from-amber-400 to-amber-500',
    danger: 'bg-gradient-to-r from-red-400 to-red-500',
  };
  const bgColors = {
    primary: 'bg-blue-100/50',
    warning: 'bg-amber-100/50',
    danger: 'bg-red-100/50',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-[11px] font-semibold text-gray-600 font-mono tracking-tight">{displayValue}{unit}</span>
      </div>
      <div className={`h-1.5 rounded-full ${bgColors[color]} overflow-hidden ring-1 ring-inset ring-black/5`}>
        <div
          className={`h-full rounded-full ${barGradient[color]} transition-all duration-700 ease-out shadow-[inset_0_-1px_1px_rgba(0,0,0,0.1)]`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
