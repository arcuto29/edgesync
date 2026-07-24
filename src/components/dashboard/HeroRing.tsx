'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function HeroRing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Scroll-based transforms
  const ringScale = useTransform(scrollY, [0, 300], [1, 0.6]);
  const ringOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const ringRotate = useTransform(scrollY, [0, 600], [0, 180]);
  const ringY = useTransform(scrollY, [0, 300], [0, -40]);
  const textOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const textY = useTransform(scrollY, [0, 150], [0, -20]);
  
  // Smooth spring physics
  const smoothScale = useSpring(ringScale, { stiffness: 100, damping: 30 });
  const smoothRotate = useSpring(ringRotate, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(ringY, { stiffness: 100, damping: 30 });

  // Animated data points that float out of the ring
  const [pulseActive, setPulseActive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseActive((p) => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center justify-center py-12 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating data particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/60"
            initial={{ 
              x: '50%', 
              y: '50%',
              opacity: 0,
              scale: 0 
            }}
            animate={{ 
              x: `${30 + Math.random() * 40}%`,
              y: `${20 + Math.random() * 60}%`,
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* The Ring */}
      <motion.div
        style={{ scale: smoothScale, rotate: smoothRotate, y: smoothY, opacity: ringOpacity }}
        className="relative z-10"
      >
        {/* Ring SVG */}
        <div className="relative w-[200px] h-[200px] flex items-center justify-center">
          {/* Outer glow ring */}
          <motion.div
            animate={{ 
              boxShadow: pulseActive 
                ? '0 0 60px 10px oklch(0.75 0.18 160 / 0.2), inset 0 0 30px 5px oklch(0.75 0.18 160 / 0.1)' 
                : '0 0 30px 5px oklch(0.75 0.18 160 / 0.1), inset 0 0 15px 2px oklch(0.75 0.18 160 / 0.05)'
            }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="absolute inset-4 rounded-full border-[3px] border-primary/40"
          />
          
          {/* Main ring body */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 border border-zinc-600/50 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
            {/* Inner ring detail */}
            <div className="absolute inset-3 rounded-full border border-zinc-700/50" />
            
            {/* Ring sensor dots */}
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </motion.div>
          </div>

          {/* Orbiting data indicators */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50"
              />
            </div>
          </motion.div>

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2"
          >
            <div className="absolute bottom-0 right-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_2px] shadow-accent/50"
              />
            </div>
          </motion.div>
        </div>

        {/* Data readouts floating around ring */}
        <motion.div
          animate={{ opacity: [0, 1, 0], y: [-5, -15, -25] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0 }}
          className="absolute -right-16 top-8 text-[10px] font-mono text-primary/80 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1"
        >
          HRV 52ms
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0, 1, 0], y: [5, -5, -15] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="absolute -left-20 top-12 text-[10px] font-mono text-accent/80 bg-accent/5 border border-accent/20 rounded-lg px-2 py-1"
        >
          Sleep 87
        </motion.div>

        <motion.div
          animate={{ opacity: [0, 1, 0], y: [5, -5, -15] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          className="absolute -right-20 bottom-8 text-[10px] font-mono text-green-400/80 bg-green-400/5 border border-green-400/20 rounded-lg px-2 py-1"
        >
          Ready 91
        </motion.div>
      </motion.div>

      {/* Hero Text */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 text-center mt-8"
      >
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          Your body knows before you do
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm text-muted-foreground mt-2 max-w-md mx-auto"
        >
          EdgeSync correlates your biometric data with trading performance.
          See the patterns. Find your edge.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-6 flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-border/50 flex items-start justify-center p-1.5"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1], height: ['4px', '8px', '4px'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1 bg-muted-foreground rounded-full"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
