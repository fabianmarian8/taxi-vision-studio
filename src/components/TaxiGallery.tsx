'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface TaxiGalleryProps {
  images: string[];
  serviceName: string;
}

export function TaxiGallery({ images, serviceName }: TaxiGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Miniatúry */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            className="relative flex-shrink-0 group"
          >
            <img
              src={image}
              alt={`${serviceName} - foto ${index + 1}`}
              className="w-[120px] h-[120px] object-cover rounded-lg border-2 border-gray-200 hover:border-green-500 transition-all"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt={serviceName}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
