import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  value,
  className,
  showPercentage = false,
}: ProgressBarProps) {
  const safeValue = Math.min(
    Math.max(value, 0),
    100,
  );

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'h-2.5 w-full overflow-hidden rounded-full bg-slate-100',
          className,
        )}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-sky-500 to-cyan-500 transition-all duration-300"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>

      {showPercentage && (
        <span className="text-xs font-semibold whitespace-nowrap text-slate-700">
          {safeValue}%
        </span>
      )}
    </div>
  );
}