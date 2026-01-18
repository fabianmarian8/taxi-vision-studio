'use client';

import { useState } from 'react';

interface ReviewAvatarProps {
  profilePhoto?: string;
  author: string;
}

export function ReviewAvatar({ profilePhoto, author }: ReviewAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Always show initials - Google profile photos have referrer restrictions
  const showInitials = !profilePhoto || imageError;

  if (showInitials) {
    return (
      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
        <span className="text-purple-600 font-bold text-lg">
          {author.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={profilePhoto}
      alt={author}
      className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
      onError={() => setImageError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
