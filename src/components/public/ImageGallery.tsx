
import React, { useState } from 'react';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const allImages = images.filter(Boolean);
  const mainImage = allImages[0];
  const additionalImages = allImages.slice(1);
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };
  
  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
        {/* Main large image */}
        <div className="md:col-span-2 cursor-pointer" onClick={() => openLightbox(0)}>
          <AspectRatio ratio={16/9}>
            {mainImage ? (
              <img 
                src={mainImage} 
                alt="Main property" 
                className="rounded-lg object-cover w-full h-full" 
              />
            ) : (
              <div className="w-full h-full bg-gold-900/10 flex items-center justify-center rounded-lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-gold-500/30" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            )}
          </AspectRatio>
        </div>
        
        {/* Thumbnails column */}
        <div className="hidden md:grid grid-rows-2 gap-2">
          {additionalImages?.length > 0 ? (
            additionalImages.slice(0, 2).map((img, index) => (
              <div key={index} className="cursor-pointer" onClick={() => openLightbox(index + 1)}>
                <AspectRatio ratio={4/3}>
                  <img 
                    src={img} 
                    alt={`Property image ${index + 2}`}
                    className="rounded-lg object-cover w-full h-full" 
                  />
                </AspectRatio>
              </div>
            ))
          ) : (
            <div className="cursor-not-allowed row-span-2">
              <AspectRatio ratio={1/1}>
                <div className="w-full h-full bg-gold-900/5 flex items-center justify-center rounded-lg">
                  <p className="text-sm text-gold-500/50">No additional images</p>
                </div>
              </AspectRatio>
            </div>
          )}
        </div>
      </div>
      
      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <Button 
            className="absolute top-4 right-4 rounded-full p-2 bg-black/50 hover:bg-black/70 text-white"
            size="icon"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <Button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/50 hover:bg-black/70 text-white"
            size="icon"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="w-full max-w-4xl mx-4 h-[80vh] flex items-center justify-center">
            <img 
              src={allImages[currentIndex]} 
              alt={`Property image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain" 
            />
          </div>
          
          <Button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/50 hover:bg-black/70 text-white"
            size="icon"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <p className="text-white text-sm">
              {currentIndex + 1} / {allImages.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
