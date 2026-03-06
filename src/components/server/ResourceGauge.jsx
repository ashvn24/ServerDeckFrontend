import { getResourceColor } from '../../utils/formatters';

export default function ResourceGauge({ label, value, max, unit = '%', showPercent = true }) {
  const percent = max ? Math.min((value / max) * 100, 100) : (value || 0);
  const displayValue = showPercent ? percent.toFixed(1) : value;
  const color = getResourceColor(percent);

  const barColors = {
    primary: 'bg-blue-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };
  const bgColors = {
    primary: 'bg-blue-100',
    warning: 'bg-amber-100',
    danger: 'bg-red-100',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-semibold text-gray-700">{displayValue}{unit}</span>
      </div>
      <div className={`h-1.5 rounded-full ${bgColors[color]} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${barColors[color]} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
