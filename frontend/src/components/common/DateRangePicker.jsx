import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { formatDate, cn } from '../../utils/helpers';

export function DateRangePicker({ startDate, endDate, onChange, className = '' }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This month', days: null, isMonth: true },
    { label: 'Last month', days: null, isLastMonth: true },
  ];

  const applyPreset = (preset) => {
    let end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();

    if (preset.isMonth) {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset.isLastMonth) {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end = new Date(end.getFullYear(), end.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(start.getDate() - preset.days);
    }

    const newStart = start.toISOString().split('T')[0];
    const newEnd = end.toISOString().split('T')[0];

    setTempStartDate(newStart);
    setTempEndDate(newEnd);
  };

  const apply = () => {
    onChange({ startDate: tempStartDate, endDate: tempEndDate });
    setShowDropdown(false);
  };

  const formatDisplay = (date) => {
    if (!date) return 'Select date';
    return formatDate(date, 'MMM dd, yyyy');
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex-1 flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          aria-haspopup="true"
          aria-expanded={showDropdown}
        >
          <div className="flex items-center gap-2 text-gray-900">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDisplay(tempStartDate)} - {formatDisplay(tempEndDate)}</span>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showDropdown && 'rotate-180')} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="space-y-3">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="input"
                max={tempEndDate}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="input"
                min={tempStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Quick Select</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="flex-1 btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={apply}
                className="flex-1 btn-primary text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
