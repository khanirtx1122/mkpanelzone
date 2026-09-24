"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string | null;
  coverImageUrl?: string | null;
  productName: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export function ProductVideoPlayer({
  videoUrl,
  posterUrl,
  coverImageUrl,
  productName,
  autoplay = true,
  muted = true,
  loop = true,
}: ProductVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fallbackImage = posterUrl || coverImageUrl;

  useEffect(() => {
    // Attempt to play if autoplay is true, might be blocked by browser
    if (autoplay && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [autoplay]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div 
      className="relative aspect-video sm:aspect-[4/3] lg:aspect-square w-full rounded-[24px] sm:rounded-[32px] overflow-hidden border border-border-subtle bg-surface-glass shadow-2xl group flex items-center justify-center"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-brand-neon-blue-glow),transparent_70%)] opacity-20 pointer-events-none" />
      
      {isLoading && fallbackImage && (
        <Image
          src={fallbackImage}
          alt={productName}
          fill
          className="object-cover absolute inset-0 z-0 transition-opacity duration-500"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-brand-neon-blue animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        autoPlay={autoplay}
        muted={isMuted}
        loop={loop}
        playsInline
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        className={`w-full h-full object-cover transition-opacity duration-500 relative z-0 ${isLoading && fallbackImage ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Overlay gradient for controls */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10 transition-opacity duration-300" />

      {/* Controls */}
      <AnimatePresence>
        {(showControls || !isPlaying) && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-6"
          >
            {/* Center massive play button if paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* `border-border` was not a real token, so this button rendered with no
                    border at all. The valid scale is border-subtle / border-strong. */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-foreground/10 backdrop-blur-md border border-border-strong flex items-center justify-center text-foreground cursor-pointer hover:bg-foreground/20 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" />
                </div>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2">
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-surface-glass hover:bg-surface backdrop-blur-md border border-border-subtle flex items-center justify-center text-foreground transition-all active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="ml-0.5 fill-current" />}
                </button>
                <button 
                  onClick={toggleMute}
                  className="w-10 h-10 rounded-full bg-surface-glass hover:bg-surface backdrop-blur-md border border-border-subtle flex items-center justify-center text-foreground transition-all active:scale-95"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
