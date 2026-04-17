'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, X, Sparkles } from 'lucide-react';

interface ChecklistItem {
  label: string;
  description: string;
  done: boolean;
  editorTab?: 'general' | 'hero' | 'appearance' | 'gallery' | 'social';
}

interface OnboardingBannerProps {
  partnerSlug: string;
  items: ChecklistItem[];
}

export function OnboardingBanner({ partnerSlug, items }: OnboardingBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = items.filter((i) => i.done).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isComplete = completedCount === total;

  if (isComplete) return null;

  const nextAction = items.find((i) => !i.done);

  return (
    <div className="mb-5 md:mb-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <svg className="h-10 w-10 md:h-12 md:w-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e9d5ff" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none" stroke="#9333ea" strokeWidth="3"
                strokeDasharray={`${(percent / 100) * 94.2} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs md:text-sm font-black text-purple-700">{percent}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <h3 className="text-sm md:text-base font-black text-gray-900 truncate">
                Dokončite svoj profil
              </h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate">
              {completedCount}/{total} krokov · {total - completedCount} {total - completedCount === 1 ? 'krok zostáva' : 'kroky zostávajú'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 p-1.5 -m-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={collapsed ? 'Rozbaliť' : 'Zbaliť'}
        >
          {collapsed ? (
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 rotate-90" />
          ) : (
            <X className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </button>
      </div>

      {/* Body — checklist + CTA */}
      {!collapsed && (
        <div className="px-4 md:px-6 pb-4 md:pb-5 border-t border-purple-100 bg-white/60">
          <div className="grid sm:grid-cols-2 gap-2 md:gap-3 pt-4">
            {items.map((item, i) => (
              <Link
                key={i}
                href={`/partner/edit/${partnerSlug}${item.editorTab ? `?tab=${item.editorTab}` : ''}`}
                className={`flex items-start gap-2.5 rounded-lg p-2.5 md:p-3 transition-all ${
                  item.done
                    ? 'bg-green-50/50 cursor-default pointer-events-none'
                    : 'bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50/50'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${item.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                {!item.done && (
                  <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0 mt-1" />
                )}
              </Link>
            ))}
          </div>

          {nextAction && (
            <Link
              href={`/partner/edit/${partnerSlug}${nextAction.editorTab ? `?tab=${nextAction.editorTab}` : ''}`}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
            >
              Pokračovať: {nextAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
