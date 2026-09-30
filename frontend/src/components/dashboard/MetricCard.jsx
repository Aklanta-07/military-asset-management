import { cn } from '../../utils/helpers';

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  valueClassName,
  secondaryValue,
  onClick,
}) {
  const content = (
    <div className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p
            className={cn(
              'mt-2 text-2xl font-bold text-gray-900',
              valueClassName
            )}
          >
            {value}
          </p>

          {secondaryValue && (
            <p className="mt-1 text-xs text-gray-500">
              {secondaryValue}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600',
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="card w-full text-left transition-shadow hover:shadow-md"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="card">
      {content}
    </div>
  );
}