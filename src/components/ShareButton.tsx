'use client';

import { Button } from './ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export const ShareButton = ({ title, url }: ShareButtonProps) => {
  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    try {
      await navigator.share({
        title,
        url: shareUrl,
      });
    } catch (err) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link skopírovaný do schránky');
    }
  };

  return (
    <Button onClick={handleShare} variant="outline" className="gap-2">
      <Share2 className="h-4 w-4" />
      Zdieľať článok
    </Button>
  );
};
