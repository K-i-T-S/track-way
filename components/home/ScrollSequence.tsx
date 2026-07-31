"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollSequenceProps {
  className?: string;
}

export function ScrollSequence({ className }: ScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const FRAME_COUNT = 60;
  const FRAME_FOLDER = "/";
  const framesRef = useRef<HTMLImageElement[]>([]);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const scrollStartRef = useRef<number | null>(null);

  const getFramePath = (index: number) => {
    const paddedIndex = String(index).padStart(3, "0");
    return `${FRAME_FOLDER}ezgif-frame-${paddedIndex}.jpg`;
  };

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const frame = framesRef.current[index];
    
    if (!canvas || !ctx || !frame) return;
    
    // Check if image is valid and loaded
    if (!frame.complete || frame.naturalWidth === 0) {
      console.warn(`Frame ${index} is not loaded or broken`);
      return;
    }

    const { width, height } = canvasSizeRef.current;
    
    // Crop 10% from each edge to reduce borders
    const cropAmount = 0.1;
    const sourceX = frame.naturalWidth * cropAmount;
    const sourceY = frame.naturalHeight * cropAmount;
    const sourceWidth = frame.naturalWidth * (1 - cropAmount * 2);
    const sourceHeight = frame.naturalHeight * (1 - cropAmount * 2);
    
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(frame, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frames: HTMLImageElement[] = [];
    let loaded = 0;

    const preloadFrames = () => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = getFramePath(i);

        img.onload = () => {
          loaded++;
          setLoadedCount(loaded);

          if (loaded === 1) {
            canvasSizeRef.current = {
              width: img.naturalWidth,
              height: img.naturalHeight,
            };
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
          }

          if (loaded === FRAME_COUNT) {
            setIsLoading(false);
            initAnimation();
          }
        };

        img.onerror = () => {
          console.error(`Failed to load frame: ${getFramePath(i)}`);
          // Create a placeholder for broken frames
          img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
          loaded++;
          setLoadedCount(loaded);
          
          if (loaded === FRAME_COUNT) {
            setIsLoading(false);
            initAnimation();
          }
        };

        frames.push(img);
      }
      framesRef.current = frames;
    };

    const initAnimation = () => {
      if (typeof window === "undefined") return;

      // Force frame 0 on initial load
      drawFrame(0);

      const container = containerRef.current;
      if (!container) return;

      // Manual scroll handler for precise control
      const handleScroll = () => {
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        
        // Reset scroll start if container is not in view (user scrolled back up)
        if (rect.top > windowHeight * 0.9) {
          scrollStartRef.current = null;
          drawFrame(0);
          return;
        }
        
        // Initialize scroll start position when container first comes into view
        if (scrollStartRef.current === null) {
          scrollStartRef.current = scrollY;
          drawFrame(0);
          return;
        }
        
        // Calculate progress based on actual scroll distance from start
        const scrollDistance = scrollY - scrollStartRef.current;
        const maxScrollDistance = windowHeight * 0.25; // Complete animation over 25% of viewport height
        
        let progress = scrollDistance / maxScrollDistance;
        progress = Math.max(0, Math.min(1, progress));
        
        const frameIndex = Math.floor(progress * (FRAME_COUNT - 1));
        drawFrame(frameIndex);
      };

      // Initial call
      handleScroll();
      
      // Add scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Store cleanup function
      const cleanup = () => {
        window.removeEventListener('scroll', handleScroll);
      };
      
      // Store for cleanup in useEffect return
      (window as any).__scrollSequenceCleanup = cleanup;
    };

    preloadFrames();

    return () => {
      const cleanup = (window as any).__scrollSequenceCleanup;
      if (cleanup) {
        cleanup();
        delete (window as any).__scrollSequenceCleanup;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        className="h-full w-full object-contain"
        style={{
          imageRendering: "pixelated",
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <div className="mt-3 text-sm text-muted">
            Loading {loadedCount}/{FRAME_COUNT}
          </div>
        </div>
      )}
    </div>
  );
}
