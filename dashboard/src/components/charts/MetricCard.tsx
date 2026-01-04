import { formatNumber } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ label, value, suffix = '', change }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {formatNumber(value)}{suffix}
      </div>
      {change && (
        <div className={`text-sm mt-2 flex items-center gap-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change.isPositive ? '↑' : '↓'} {Math.abs(change.value).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
