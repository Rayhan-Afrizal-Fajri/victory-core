import { cn } from '@/lib/utils';

interface DeadlineBadgeProps {
  deadline: string;
}

function getDaysLeft(deadline: string) {
  const now = new Date();
  const due = new Date(deadline);

  return Math.ceil(
    (due.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

export default function DeadlineBadge({
  deadline,
}: DeadlineBadgeProps) {
  const days = getDaysLeft(deadline);

  const variant =
    days < 0
      ? 'bg-rose-100 text-rose-700'
      : days <= 3
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-[7px] sm:text-xs font-semibold flex-nowrap',
        variant,
      )}
    >
      {days < 0
        ? 'Overdue'
        : `${days} hari lagi`}
    </span>
  );
}