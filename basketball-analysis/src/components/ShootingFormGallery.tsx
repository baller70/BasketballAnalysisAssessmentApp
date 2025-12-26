"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Camera, ZoomIn } from "lucide-react"
import { type EliteShooter, TIER_COLORS, TIER_LABELS } from "@/data/eliteShooters"

interface ShootingFormGalleryProps {
  shooter: EliteShooter;
  onClose: () => void;
}

export default function ShootingFormGallery({ shooter, onClose }: ShootingFormGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [approvedImages, setApprovedImages] = useState<string[]>([]);
  const [excludedImages, setExcludedImages] = useState<string[]>([]);
  
  // Load approved and excluded images from localStorage on mount
  useEffect(() => {
    // Load approved images
    const approvedKey = 'approved_shooting_forms';
    const storedApproved = localStorage.getItem(approvedKey);
    if (storedApproved) {
      try {
        const parsed = JSON.parse(storedApproved);
        if (parsed[shooter.id]) {
          setApprovedImages(parsed[shooter.id]);
        }
      } catch (e) {
        console.error('Failed to load approved images:', e);
      }
    }
    
    // Load excluded images (original URLs that have been cropped/replaced)
    const excludedKey = 'excluded_shooting_forms';
    const storedExcluded = localStorage.getItem(excludedKey);
    if (storedExcluded) {
      try {
        const parsed = JSON.parse(storedExcluded);
        if (parsed[shooter.id]) {
          setExcludedImages(parsed[shooter.id]);
        }
      } catch (e) {
        console.error('Failed to load excluded images:', e);
      }
    }
  }, [shooter.id]);
  
  // Combine database images with approved images, filtering out excluded ones
  const databaseImages = (shooter.shootingFormImages || []).filter(
    url => !excludedImages.includes(url)
  );
  const allImages = [...new Set([...databaseImages, ...approvedImages])];
  const images = allImages;
  const hasImages = images.length > 0;
  const tierColor = TIER_COLORS[shooter.tier];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose]);

  const goToPrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-[#FF6B35]/30 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-[#333] bg-gradient-to-r from-[#1a1a1a] to-[#252525]">
          <div className="flex items-center gap-4">
            {/* Player Photo */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: tierColor }}>
              {shooter.photoUrl ? (
                <Image src={shooter.photoUrl} alt={shooter.name} fill className="object-cover object-top" unoptimized />
              ) : (
                <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: tierColor }}>
                    {shooter.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wide">{shooter.name}</h2>
              <p className="text-[#888]">{shooter.team}</p>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                  style={{ backgroundColor: `${tierColor}20`, color: tierColor, border: `1px solid ${tierColor}50` }}
                >
                  {TIER_LABELS[shooter.tier]}
                </span>
                <span className="text-[#666] text-sm">Shooting Form Analysis</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-[#FF6B35] font-bold">{images.length} Photos</span>
            </div>
          </div>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Gallery Content */}
        <div className="p-6">
          {hasImages ? (
            <>
              {/* Main Image Display */}
              <div className="relative bg-[#0a0a0a] rounded-xl overflow-hidden mb-4" style={{ minHeight: '400px' }}>
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      disabled={currentIndex === 0}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all ${
                        currentIndex === 0 
                          ? 'bg-black/20 text-[#444] cursor-not-allowed' 
                          : 'bg-black/60 text-white hover:bg-[#FF6B35] hover:text-black'
                      }`}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={goToNext}
                      disabled={currentIndex === images.length - 1}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all ${
                        currentIndex === images.length - 1 
                          ? 'bg-black/20 text-[#444] cursor-not-allowed' 
                          : 'bg-black/60 text-white hover:bg-[#FF6B35] hover:text-black'
                      }`}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Current Image */}
                <div 
                  className={`relative w-full transition-all duration-300 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  style={{ height: isZoomed ? '600px' : '400px' }}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <Image
                    src={images[currentIndex]}
                    alt={`${shooter.name} shooting form ${currentIndex + 1}`}
                    fill
                    className={`transition-all duration-300 ${isZoomed ? 'object-contain' : 'object-contain'}`}
                    unoptimized
                  />
                  
                  {/* Zoom indicator */}
                  <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-white" />
                    <span className="text-white text-sm">{isZoomed ? 'Click to zoom out' : 'Click to zoom in'}</span>
                  </div>
                </div>

                {/* Image Counter */}
                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full">
                  <span className="text-white font-bold">{currentIndex + 1}</span>
                  <span className="text-[#888]"> / {images.length}</span>
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-3 justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentIndex 
                          ? 'border-[#FF6B35] scale-105 shadow-lg shadow-[#FF6B35]/20' 
                          : 'border-[#333] hover:border-[#666] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Form Analysis Tips */}
              <div className="mt-6 p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <h3 className="text-[#FF6B35] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Study Points
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-[#252525] rounded-lg p-3 text-center">
                    <p className="text-[#888]">Elbow Angle</p>
                    <p className="text-white font-bold">{shooter.measurements.elbowAngle}°</p>
                  </div>
                  <div className="bg-[#252525] rounded-lg p-3 text-center">
                    <p className="text-[#888]">Release Angle</p>
                    <p className="text-white font-bold">{shooter.measurements.releaseAngle}°</p>
                  </div>
                  <div className="bg-[#252525] rounded-lg p-3 text-center">
                    <p className="text-[#888]">Knee Bend</p>
                    <p className="text-white font-bold">{shooter.measurements.kneeAngle}°</p>
                  </div>
                  <div className="bg-[#252525] rounded-lg p-3 text-center">
                    <p className="text-[#888]">Style</p>
                    <p className="text-white font-bold text-xs">{shooter.shootingStyle}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Images State */
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center mb-6">
                <Camera className="w-12 h-12 text-[#444]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Shooting Form Images</h3>
              <p className="text-[#888] text-center max-w-md">
                Shooting form images for {shooter.name} have not been added yet. 
                Check back later for visual analysis of their shooting mechanics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

