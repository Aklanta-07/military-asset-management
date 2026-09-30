import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

export const Select = forwardRef(({
  label,
  value,
  options = [],
  onChange,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  error = false,
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="label">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        required={required}
        className={cn(
          'input appearance-none bg-white',
          'pr-10',
          error && 'input-error',
          disabled && 'bg-gray-100 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-danger-500" role="alert">
          {typeof error === 'string' ? error : 'Invalid selection'}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';