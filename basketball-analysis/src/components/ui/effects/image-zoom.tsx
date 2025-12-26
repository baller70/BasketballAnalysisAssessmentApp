"use client"

import React, { useState, useRef, useCallback } from "react"
import NextImage, { ImageProps as NextImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface ImageZoomProps {
  children: React.ReactNode
  className?: string
  zoomScale?: number
  transitionDuration?: number
}

interface ZoomImageProps extends Omit<NextImageProps, 'as'> {
  as?: typeof NextImage | 'img'
  className?: string
}

const ImageZoomContext = React.createContext<{
  isZoomed: boolean
  zoomPosition: { x: number; y: number }
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  zoomScale: number
} | null>(null)

export function ImageZoom({ 
  children, 
  className,
  zoomScale = 2,
  transitionDuration = 300
}: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setZoomPosition({ x, y })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsZoomed(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false)
    setZoomPosition({ x: 50, y: 50 })
  }, [])

  return (
    <ImageZoomContext.Provider value={{ 
      isZoomed, 
      zoomPosition, 
      handleMouseMove, 
      handleMouseEnter, 
      handleMouseLeave,
      zoomScale
    }}>
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden cursor-zoom-in",
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transition: `transform ${transitionDuration}ms ease-out`
        }}
      >
        {children}
      </div>
    </ImageZoomContext.Provider>
  )
}

export function Image({ 
  className, 
  as: Component = NextImage,
  alt,
  ...props 
}: ZoomImageProps) {
  const context = React.useContext(ImageZoomContext)
  
  if (!context) {
    // If used outside ImageZoom, render normally
    if (Component === 'img') {
      return <img className={className} alt={alt} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
    }
    return <NextImage className={className} alt={alt || ''} {...(props as NextImageProps)} />
  }

  const { isZoomed, zoomPosition, zoomScale } = context

  const style: React.CSSProperties = {
    transition: 'transform 0.3s ease-out',
    transform: isZoomed 
      ? `scale(${zoomScale})` 
      : 'scale(1)',
    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
  }

  if (Component === 'img') {
    return (
      <img 
        className={cn("w-full h-full object-cover", className)} 
        alt={alt}
        style={style}
        {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} 
      />
    )
  }

  return (
    <NextImage 
      className={cn("w-full h-full object-cover", className)} 
      alt={alt || ''}
      style={style}
      {...(props as NextImageProps)} 
    />
  )
}

// Simplified wrapper for canvas/data URL images
interface ZoomableImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  zoomScale?: number
}

export function ZoomableImage({ 
  src, 
  alt, 
  className,
  containerClassName,
  zoomScale = 2.5
}: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setZoomPosition({ x, y })
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden cursor-zoom-in",
        containerClassName
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => {
        setIsZoomed(false)
        setZoomPosition({ x: 50, y: 50 })
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={src} 
        alt={alt}
        className={cn("w-full h-full object-contain", className)}
        style={{
          transition: 'transform 0.3s ease-out',
          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
        }}
      />
    </div>
  )
}

// For canvas elements
interface ZoomableCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  className?: string
  containerClassName?: string
  zoomScale?: number
}

export function ZoomableCanvas({ 
  canvasRef,
  className,
  containerClassName,
  zoomScale = 2.5
}: ZoomableCanvasProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setZoomPosition({ x, y })
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden cursor-zoom-in",
        containerClassName
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => {
        setIsZoomed(false)
        setZoomPosition({ x: 50, y: 50 })
      }}
    >
      <canvas 
        ref={canvasRef}
        className={cn("w-full h-full", className)}
        style={{
          transition: 'transform 0.3s ease-out',
          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
        }}
      />
    </div>
  )
}
