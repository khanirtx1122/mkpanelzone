"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Crown, Calendar, Clock, Package, Headset, ChevronLeft, ChevronRight } from "lucide-react";
import { productContent } from "@/lib/productContent";
import type { Product } from "@/components/ui/ProductCard";

function getMeta(slug: string) {
  let badge = "PREMIUM";
  let colorTheme = "blue"; // default

  if (slug.includes("lifetime")) {
    badge = "BEST SELLER";
    colorTheme = "crimson";
  } else if (slug.includes("3-months")) {
    badge = "BEST VALUE";
  } else if (slug.includes("weekly")) {
    badge = "TRIAL";
  } else if (slug.includes("setup") || slug.includes("support")) {
    badge = "ADD-ON";
  }
  
  let Icon = Shield;
  if (slug.includes("3-months")) Icon = Crown;
  else if (slug.includes("monthly")) Icon = Calendar;
  else if (slug.includes("weekly")) Icon = Clock;
  else if (slug.includes("setup")) Icon = Package;
  else if (slug.includes("support")) Icon = Headset;
  
  return { badge, Icon, colorTheme };
}

export function HeroProductSlider({ products }: { products: Product[] }) {
  const baseProducts = products.length > 0 ? products.slice(0, 5) : [];
  
  // Triplicate the array for seamless infinite looping
  const displayProducts = baseProducts.length > 0 
    ? [...baseProducts, ...baseProducts, ...baseProducts, ...baseProducts, ...baseProducts] 
    : [];

  const startIndex = baseProducts.length * 2;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeout = useRef<NodeJS.Timeout | null>(null);

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (isPaused || baseProducts.length === 0 || isDragging) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 2500); // 2.5 seconds

    return () => clearInterval(interval);
  }, [isPaused, baseProducts.length, isDragging]);

  const handleTransitionEnd = () => {
    if (currentIndex >= baseProducts.length * 4) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - baseProducts.length);
    } 
    else if (currentIndex <= baseProducts.length) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + baseProducts.length);
    }
  };

  const handleInteraction = () => {
    setIsPaused(true);
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    pauseTimeout.current = setTimeout(() => {
      setIsPaused(false);
    }, 4500);
  };

  // Touch Swipe (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    handleInteraction();
    setTouchStart(e.targetTouches[0].clientX);
    setIsTransitioning(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    setDragOffset(currentX - touchStart);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsTransitioning(true);
      setDragOffset(0);
      return;
    }
    const distance = touchStart - touchEnd;
    
    setIsTransitioning(true);
    if (distance > 40) {
      setCurrentIndex(prev => prev + 1);
    } else if (distance < -40) {
      setCurrentIndex(prev => prev - 1);
    }
    
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse Drag (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteraction();
    setIsDragging(true);
    setIsTransitioning(false);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent text selection
    setDragOffset(e.clientX - dragStart);
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsTransitioning(true);
    
    if (dragOffset > 50) {
      setCurrentIndex(prev => prev - 1);
    } else if (dragOffset < -50) {
      setCurrentIndex(prev => prev + 1);
    }
    setDragOffset(0);
  };

  // Arrow Navigation
  const handleNext = () => {
    handleInteraction();
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    handleInteraction();
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
  };

  if (displayProducts.length === 0) return null;

  return (
    <div 
      className="w-full max-w-[1024px] mx-auto mt-6 relative overflow-visible pb-4"
      onMouseEnter={handleInteraction}
      onMouseLeave={() => {
        handleInteraction();
        handleMouseUpOrLeave();
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .hero-slider-track {
          --item-width: 82vw;
          --container-width: 100vw;
          --gap: calc(var(--container-width) - var(--item-width));
          padding-left: calc((var(--container-width) - var(--item-width)) / 2);
          transform: translateX(calc(-1 * var(--current-index) * var(--container-width) + var(--drag-offset)));
          transition: var(--slider-transition);
          gap: var(--gap);
        }
        @media (min-width: 640px) {
          .hero-slider-track {
            --item-width: 440px;
          }
        }
        @media (min-width: 1024px) {
          .hero-slider-track {
            --item-width: 520px;
            --container-width: 1024px;
          }
        }
      `}} />

      {/* Desktop Navigation Arrows */}
      <button
        onClick={handlePrev}
        className={`hidden md:flex absolute top-1/2 -left-4 lg:-left-12 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full 
        bg-white/80 dark:bg-[#0A101A]/90 backdrop-blur-md 
        border border-brand-neon-blue/20 dark:border-brand-neon-blue/30
        text-brand-blue-600 dark:text-white
        shadow-[0_4px_20px_rgba(47,95,208,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)]
        hover:bg-brand-neon-blue/10 dark:hover:bg-brand-neon-blue/20
        hover:scale-110 hover:border-brand-neon-blue/40 dark:hover:border-brand-neon-blue/60
        transition-all duration-300 group`}
        aria-label="Previous product"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
        <div className="absolute inset-0 rounded-full bg-brand-neon-blue/0 group-hover:bg-brand-neon-blue/20 blur-md transition-colors pointer-events-none" />
      </button>

      <button
        onClick={handleNext}
        className={`hidden md:flex absolute top-1/2 -right-4 lg:-right-12 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full 
        bg-white/80 dark:bg-[#0A101A]/90 backdrop-blur-md 
        border border-brand-neon-blue/20 dark:border-brand-neon-blue/30
        text-brand-blue-600 dark:text-white
        shadow-[0_4px_20px_rgba(47,95,208,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)]
        hover:bg-brand-neon-blue/10 dark:hover:bg-brand-neon-blue/20
        hover:scale-110 hover:border-brand-neon-blue/40 dark:hover:border-brand-neon-blue/60
        transition-all duration-300 group`}
        aria-label="Next product"
      >
        <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
        <div className="absolute inset-0 rounded-full bg-brand-neon-blue/0 group-hover:bg-brand-neon-blue/20 blur-md transition-colors pointer-events-none" />
      </button>

      {/* Slider Viewport */}
      <div className="overflow-hidden w-full">
        <div 
          className="flex hero-slider-track touch-pan-y select-none cursor-grab active:cursor-grabbing"
          style={{
            '--current-index': currentIndex,
            '--drag-offset': `${dragOffset}px`,
            '--slider-transition': isTransitioning && !isDragging ? 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          } as React.CSSProperties}
          onTransitionEnd={handleTransitionEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
        >
          {displayProducts.map((product, idx) => {
            const { badge, Icon, colorTheme } = getMeta(product.slug);
            const content = productContent[product.slug];
            const coverImage = product.coverImageUrl || content?.image;
            const shortDesc = content?.description || "Premium digital product and access.";

            return (
              <div 
                key={`${product.id}-${idx}`} 
                className="flex-shrink-0"
                style={{ width: 'var(--item-width)' }}
              >
                <Link
                  href={`/products/${product.slug}`}
                  onClick={(e) => {
                    // Prevent navigation if we are just finishing a drag
                    if (Math.abs(dragOffset) > 5) {
                      e.preventDefault();
                    }
                  }}
                  draggable={false}
                  className="group relative flex flex-col rounded-[20px] bg-white/90 dark:bg-[#0A101A]/90 backdrop-blur-xl border border-brand-neon-blue/20 dark:border-brand-neon-blue/25 overflow-hidden transition-all duration-500 hover:-translate-y-1 shadow-[0_8px_30px_rgba(47,95,208,0.1)] hover:shadow-[0_12px_40px_rgba(47,95,208,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_12px_40px_rgba(47,95,208,0.3)] active:scale-[0.985]"
                >
                  {/* Soft Edge Highlight - Theme Aware */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-neon-blue/40 dark:via-brand-neon-blue/60 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Subtle Premium Glows */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[45px] pointer-events-none transition-colors duration-700 ${colorTheme === 'crimson' ? 'bg-brand-neon-red/15 dark:bg-brand-neon-red/25 group-hover:bg-brand-neon-red/25 dark:group-hover:bg-brand-neon-red/35' : 'bg-brand-neon-blue/15 dark:bg-brand-neon-blue/25 group-hover:bg-brand-neon-blue/25 dark:group-hover:bg-brand-neon-blue/35'}`} />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-brand-neon-blue/15 dark:bg-brand-neon-blue/20 rounded-full blur-[45px] pointer-events-none group-hover:bg-brand-neon-blue/25 transition-colors duration-700" />

                  <div className="flex min-h-[115px] sm:min-h-[140px] relative z-10 pointer-events-none">
                    {/* Left: Image/Icon (36%) */}
                    <div className="relative w-[36%] border-r border-brand-neon-blue/10 dark:border-brand-neon-blue/20 flex-shrink-0 bg-slate-50/50 dark:bg-black/30 overflow-hidden flex flex-col items-center justify-center">
                      
                      {/* Radial glow behind image */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(47,95,208,0.15)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_center,_rgba(47,95,208,0.3)_0%,_transparent_70%)] pointer-events-none" />

                      {coverImage ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={coverImage}
                            alt={product.name}
                            fill
                            draggable={false}
                            className="object-contain p-3 sm:p-4 transition-transform duration-700 group-hover:scale-[1.03]"
                            sizes="(max-width: 640px) 36vw, 150px"
                          />
                        </div>
                      ) : (
                        <div className="relative z-10 text-brand-neon-blue drop-shadow-[0_0_12px_rgba(47,95,208,0.3)] dark:drop-shadow-[0_0_15px_rgba(47,95,208,0.5)]">
                          <Icon size={42} className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3" />
                        </div>
                      )}
                      {/* Inner glowing edge for the image container */}
                      <div className="absolute inset-0 ring-1 ring-inset ring-brand-neon-blue/5 dark:ring-white/5 pointer-events-none" />
                    </div>

                    {/* Right: Content (64%) */}
                    <div className="flex flex-col flex-1 p-3 sm:p-4 text-left justify-between w-[64%] bg-white/40 dark:bg-transparent">
                      <div>
                        <div className="mb-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-brand-neon-blue/10 border border-brand-neon-blue/25 dark:border-brand-neon-blue/40 text-[8px] sm:text-[9px] font-bold tracking-[0.15em] uppercase text-brand-blue-600 dark:text-brand-neon-blue shadow-[0_0_10px_rgba(47,95,208,0.1)]">
                            {badge}
                          </span>
                        </div>
                        
                        {/* Product Title - Allow 2 lines */}
                        <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2 mb-1.5 tracking-wide">
                          {product.name}
                        </h3>
                        
                        {/* Subtitle */}
                        <p className="text-[11px] sm:text-[12px] text-slate-600 dark:text-brand-ink-3 line-clamp-1 sm:line-clamp-2 pr-1 font-medium leading-relaxed">
                          {shortDesc}
                        </p>
                      </div>
                      
                      {/* Footer: Price & Premium Action Button */}
                      <div className="flex items-end justify-between mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-brand-neon-blue/10 dark:border-border-subtle">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-brand-ink-3 uppercase tracking-wider mb-0.5">
                            Price
                          </span>
                          <span className="text-[14px] sm:text-[18px] font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]">
                            PKR {product.price.toFixed(0)}
                          </span>
                        </div>
                        
                        {/* Stronger CTA Button */}
                        <div className="relative pointer-events-auto inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 h-[32px] sm:h-[42px] rounded-[10px] text-[9px] sm:text-[11px] font-bold tracking-[0.08em] uppercase text-white overflow-hidden transition-all duration-300 group-hover:scale-[1.03] shadow-[0_4px_12px_rgba(47,95,208,0.25)] group-hover:shadow-[0_6px_20px_rgba(47,95,208,0.4)]">
                          {/* Button Background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#173280] to-[#2F5FD0] opacity-95 transition-opacity duration-300 group-hover:opacity-100" />
                          {/* Edge Glow */}
                          <div className="absolute inset-0 rounded-[10px] border border-white/20 group-hover:border-white/40 transition-colors" />
                          {/* Subtle red reflection on button hover */}
                          <div className="absolute -right-4 -top-4 w-12 h-12 bg-brand-neon-red/30 rounded-full blur-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          
                          <span className="relative z-10 flex items-center gap-1.5 drop-shadow-md">
                            VIEW <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Progress Indicators */}
      <div className="flex items-center justify-center gap-2 mt-4 lg:mt-6">
        {baseProducts.map((_, idx) => {
          const isActive = (currentIndex % baseProducts.length) === idx;
          return (
            <div
              key={idx}
              className={`transition-all duration-500 rounded-full ${
                isActive 
                  ? "w-6 h-1.5 bg-brand-neon-blue shadow-[0_0_10px_rgba(47,95,208,0.6)]" 
                  : "w-1.5 h-1.5 bg-slate-300 dark:bg-border-subtle hover:bg-brand-neon-blue/40 cursor-pointer"
              }`}
              onClick={() => {
                handleInteraction();
                // To jump safely, we find the closest index in our virtual array that matches this product
                const currentSetStart = Math.floor(currentIndex / baseProducts.length) * baseProducts.length;
                let targetIndex = currentSetStart + idx;
                
                setIsTransitioning(true);
                setCurrentIndex(targetIndex);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
