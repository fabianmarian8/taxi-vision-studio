'use client';

interface DashToggleProps {
  label: string;
  sub?: string;
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function DashToggle({
  label,
  sub,
  on,
  onChange,
  disabled = false,
}: DashToggleProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
          on ? 'bg-green-500' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${
            on ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
