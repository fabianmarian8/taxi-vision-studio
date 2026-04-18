'use client';

import { ReactNode } from 'react';

interface DashPanelProps {
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  accentDot?: boolean;
}

export function DashPanel({
  title,
  icon,
  right,
  footer,
  children,
  className = '',
  accentDot = false,
}: DashPanelProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            {accentDot && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'hsl(var(--primary-yellow))' }}
              />
            )}
            {icon && <span className="flex-shrink-0 text-gray-500">{icon}</span>}
            {title && (
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide truncate">
                {title}
              </h3>
            )}
          </div>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex items-center justify-between gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}
