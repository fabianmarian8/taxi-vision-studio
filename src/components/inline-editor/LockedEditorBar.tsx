'use client';

import { Lock, Crown } from 'lucide-react';
import Link from 'next/link';

export function LockedEditorBar() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gray-900 text-white rounded-full px-4 py-2 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700">
          <Lock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">LIVE upravy</span>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        <Link
          href="/partner"
          className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
        >
          <Crown className="w-4 h-4" />
          <span className="text-sm font-bold">Odomknite v Leader baliku</span>
        </Link>
      </div>
    </div>
  );
}
