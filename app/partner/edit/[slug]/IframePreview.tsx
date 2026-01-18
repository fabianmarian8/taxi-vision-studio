'use client';

import { useState, useEffect, useRef } from 'react';
import { Smartphone, Monitor, ExternalLink } from 'lucide-react';
import { PreviewMessage } from '@/lib/preview-protocol';

interface IframePreviewProps {
  formData: {
    company_name: string;
    description: string;
    show_description: boolean;
    phone: string;
    email: string;
    website: string;
    hero_image_url: string;
    hero_image_zoom: number;
    hero_image_pos_x: number;
    hero_image_pos_y: number;
    hero_title: string;
    hero_subtitle: string;
    services: string[];
    show_services: boolean;
    gallery: string[];
    social_facebook: string;
    social_instagram: string;
    template_variant: string;
    banner_title?: string;
    banner_subtitle?: string;
  };
  partnerSlug: string;
  citySlug: string;
  cityName: string;
}

export function IframePreview({ formData, partnerSlug, citySlug, cityName }: IframePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [lastSentData, setLastSentData] = useState<string>('');

  // Construct URL with preview param
  const previewUrl = `/taxi/${citySlug}/${partnerSlug}?preview=editor`;

  // Handle messages from iframe (e.g. ready signal)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check could go here if we had a specific origin
      if (event.data?.type === 'PREVIEW_READY') {
        console.log('[IframePreview] Iframe reported ready');
        setIframeReady(true);
        // Immediately send current data upon ready
        if (iframeRef.current?.contentWindow) {
             const message: PreviewMessage = {
                type: 'PREVIEW_UPDATE',
                payload: formData
              };
              iframeRef.current.contentWindow.postMessage(message, '*');
              setLastSentData(JSON.stringify(formData));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [formData]); // Add formData dependency to ensure we send latest data on ready

  // Send updates when formData changes
  useEffect(() => {
    if (!iframeReady || !iframeRef.current?.contentWindow) return;

    const dataString = JSON.stringify(formData);
    if (dataString === lastSentData) return;

    // Debounce update
    const timer = setTimeout(() => {
      console.log('[IframePreview] Sending update to iframe');
      const message: PreviewMessage = {
        type: 'PREVIEW_UPDATE',
        payload: formData
      };
      iframeRef.current?.contentWindow?.postMessage(message, '*');
      setLastSentData(dataString);
    }, 150);

    return () => clearTimeout(timer);
  }, [formData, iframeReady, lastSentData]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header with controls */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Živý náhľad stránky
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Mobilný náhľad"
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Desktop náhľad"
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>

          <a
            href={`/taxi/${citySlug}/${partnerSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Otvoriť
          </a>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 overflow-hidden bg-gray-100 p-4 flex items-center justify-center relative">
        <div
          className={`bg-white shadow-2xl overflow-hidden transition-all duration-300 border border-gray-200 ${
            viewMode === 'mobile' 
              ? 'w-[375px] h-[667px] rounded-[30px]' 
              : 'w-full h-full rounded-lg'
          }`}
        >
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Partner Page Preview"
          />
        </div>
        
        {!iframeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-600">Načítavam náhľad...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
