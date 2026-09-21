"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ShieldAlert, Zap, Lock, TerminalSquare, ArrowRight } from "lucide-react";

export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden pt-24 pb-12 bg-brand-bg">
      {/* Deep Background Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="heavy-layer absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_var(--color-brand-blue-500)_0%,_transparent_60%)] opacity-[0.25] blur-3xl" />
        <div className="heavy-layer absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_var(--color-brand-red-500)_0%,_transparent_60%)] opacity-[0.2] blur-3xl" />
        
        {/* Animated Perspective Grid */}
        <motion.div 
          className="heavy-layer absolute bottom-0 left-0 right-0 h-[60vh] opacity-[0.4]"
          style={{ 
            backgroundSize: '40px 40px', 
            backgroundImage: 'linear-gradient(to right, var(--line-color) 1px, transparent 1px), linear-gradient(to bottom, var(--line-color) 1px, transparent 1px)',
            transform: 'perspective(1000px) rotateX(70deg)',
            transformOrigin: 'bottom center'
          }}
          animate={{ backgroundPosition: ['0px 0px', '0px 40px'] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />
        
        {/* Sweeping Laser / Scanline */}
        <motion.div
          className="heavy-layer absolute md:left-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-blue-500/50 to-transparent shadow-[0_0_15px_var(--color-brand-blue-500)]"
          animate={{ top: ['0%', '100%'] }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        {/* Left Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start text-left mt-8 md:mt-0"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-glass border border-brand-blue-500/30 rounded-full mb-8 backdrop-blur-md shadow-[0_0_10px_rgba(47,95,208,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 animate-pulse shadow-[0_0_5px_var(--color-brand-blue-500)]" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-brand-blue-500 uppercase">MK Systems Online</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight leading-[1.15]">
            ADVANCED DIGITAL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-ink-2 via-foreground to-brand-ink-2">
              INFRASTRUCTURE
            </span>
          </h1>
          
          <p className="text-[15px] md:text-[17px] text-brand-ink-3 mb-10 max-w-xl leading-relaxed font-medium">
            Exclusive configurations and premium architecture for the elite. Restrained, precise, and engineered for unparalleled control.
          </p>
          
          <div className="w-full mt-4">
            {children}
          </div>
        </motion.div>

        {/* Right Interactive/Abstract Visualization */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[400px] lg:h-[500px] w-full flex items-center justify-center lg:justify-end perspective-[1200px]"
        >
          {/* Main 3D Panel */}
          <motion.div 
            animate={{ 
              rotateY: [-2, 2, -2],
              rotateX: [2, -2, 2],
              y: [-10, 10, -10]
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="relative w-full max-w-md aspect-[4/3] bg-surface-glass border border-border-subtle rounded-2xl shadow-2xl backdrop-blur-xl z-20 flex flex-col overflow-hidden transform-style-3d"
          >
            {/* Header */}
            <div className="h-12 border-b border-border-subtle bg-foreground/[0.02] flex items-center px-4 gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/10 to-transparent opacity-50" />
              <TerminalSquare size={16} className="text-brand-ink-3 relative z-10" />
              <div className="text-[11px] font-mono text-brand-ink-3 uppercase tracking-widest relative z-10">mk-panel-core.exe</div>
            </div>
            
            {/* Body */}
            <div className="p-8 flex-1 flex flex-col justify-center gap-8">
              
              <div className="flex items-center gap-4 text-brand-ink-3 group">
                <ShieldAlert className="text-brand-blue-500 drop-shadow-[0_0_8px_var(--color-brand-blue-500)]" size={20} /> 
                <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-border-subtle relative">
                  <motion.div 
                    className="absolute top-0 left-0 bottom-0 bg-brand-blue-500 shadow-[0_0_10px_var(--color-brand-blue-500)]"
                    initial={{ width: "0%" }}
                    animate={{ width: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-brand-ink-3">
                <Lock className="text-brand-red-500 drop-shadow-[0_0_8px_var(--color-brand-red-500)]" size={20} />
                <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-border-subtle">
                  <div className="h-full bg-brand-red-500 w-full opacity-60 shadow-[0_0_10px_var(--color-brand-red-500)]" />
                </div>
              </div>

              <div className="flex items-center gap-4 text-brand-ink-3">
                <Zap className="text-foreground drop-shadow-[0_0_8px_var(--foreground)]" size={20} />
                <div className="flex-1 flex gap-2">
                  {[...Array(6)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className="flex-1 h-1.5 bg-foreground rounded-full"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1, ease: "linear" }}
                    />
                  ))}
                </div>
              </div>

            </div>
          </motion.div>

          {/* Core Glow behind panel */}
          <div className="heavy-layer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-brand-blue-500/20 blur-[100px] z-10 pointer-events-none rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
