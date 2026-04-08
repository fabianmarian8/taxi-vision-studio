'use client';

import { ReactNode } from 'react';
import { Pencil, Lock } from 'lucide-react';
import { isFieldAccessible, getUpsellTier, type PlanTier } from '@/lib/tier-config';

export type FieldType = 'text' | 'textarea' | 'phone' | 'email' | 'url' | 'image';

interface EditableFieldProps {
  children: ReactNode;
  fieldKey: string;
  fieldType: FieldType;
  label: string;
  isEditMode: boolean;
  onClick: (fieldKey: string, fieldType: FieldType, label: string) => void;
  className?: string;
  planTier?: PlanTier;
}

export function EditableField({
  children,
  fieldKey,
  fieldType,
  label,
  isEditMode,
  onClick,
  className = '',
  planTier = 'partner', // Default partner = plný prístup (spätná kompatibilita)
}: EditableFieldProps) {
  if (!isEditMode) {
    return <>{children}</>;
  }

  const accessible = isFieldAccessible(fieldKey, planTier);
  const upsellTier = getUpsellTier(fieldKey, planTier);

  // Zamknuté pole — zobraz zámok s upsell CTA
  if (!accessible && upsellTier) {
    return (
      <div className={`group relative ${className}`}>
        {/* Locked overlay */}
        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg pointer-events-none z-10" />

        {/* Lock indicator */}
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-gray-400 text-white rounded-full p-1.5 shadow-lg">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        {/* Upsell tooltip on hover */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap">
            {upsellTier.name} ({upsellTier.price})
          </div>
        </div>

        {/* Dimmed content with upsell bar */}
        <div className="opacity-40 pointer-events-none">
          {children}
        </div>

        {/* Upsell CTA overlay */}
        <a
          href="/pre-taxiky#pricing"
          className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-lg transition-colors cursor-pointer z-10"
        >
          <span className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Odomknúť v {upsellTier.name}
          </span>
        </a>
      </div>
    );
  }

  // Odomknuté pole — normálne editovateľné
  return (
    <div
      onClick={() => onClick(fieldKey, fieldType, label)}
      className={`group relative cursor-pointer ${className}`}
    >
      {/* Highlight border */}
      <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-yellow-400 rounded-lg transition-colors pointer-events-none" />

      {/* Edit indicator */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-yellow-400 text-gray-900 rounded-full p-1.5 shadow-lg">
          <Pencil className="w-3 h-3" />
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Upraviť: {label}
        </div>
      </div>

      {/* Content */}
      <div className="group-hover:opacity-75 transition-opacity">
        {children}
      </div>
    </div>
  );
}
