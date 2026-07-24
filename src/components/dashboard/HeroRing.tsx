'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function HeroRing() {
  const { scrollY } = useScroll();
  
  // Scroll-based transforms
  const ringScale = useTransform(scrollY, [0, 300], [1, 0.5]);
  const ringOpacity = useTransform(scrollY, [0, 350], [1, 0]);
  const ringRotateX = useTransform(scrollY, [0, 400], [65, 30]);
  const ringRotateZ = useTransform(scrollY, [0, 400], [-20, 15]);
  const ringY = useTransform(scrollY, [0, 300], [0, -60]);
  const textOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const textY = useTransform(scrollY, [0, 150], [0, -20]);
  
  // Smooth spring physics
  const smoothScale = useSpring(ringScale, { stiffness: 80, damping: 25 });
  const smoothRotateX = useSpring(ringRotateX, { stiffness: 60, damping: 20 });
  const smoothRotateZ = useSpring(ringRotateZ, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(ringY, { stiffness: 80, damping: 25 });

  const [pulseActive, setPulseActive] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setPulseActive((p) => !p), 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center justify-center pt-8 pb-12 overflow-hidden" style={{ perspective: '1000px' }}>
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[80px]" />
        <div className="absolute w-[200px] h-[200px] rounded-full bg-accent/[0.04] blur-[60px]" style={{ animationDelay: '1s' }} />
      </div>

      {/* The 3D Ring */}
      <motion.div
        style={{ 
          scale: smoothScale, 
          rotateX: smoothRotateX,
          rotateZ: smoothRotateZ,
          y: smoothY, 
          opacity: ringOpacity,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10"
      >
        <div className="relative w-[220px] h-[220px] flex items-center justify-center ring-breathe">
          {/* Ring shadow on "surface" */}
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[160px] h-[30px] bg-primary/[0.08] blur-[20px] rounded-full" />

          {/* Outer ring body — the actual ring shape */}
          <div 
            className="absolute inset-[20px] rounded-full border-[16px] border-transparent"
            style={{
              background: `linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 30%, #2d2d2d 50%, #1a1a1a 70%, #3a3a3a 100%) padding-box,
                           linear-gradient(145deg, #555 0%, #222 50%, #444 100%) border-box`,
              boxShadow: `
                inset 0 4px 12px rgba(255,255,255,0.08),
                inset 0 -4px 12px rgba(0,0,0,0.4),
                0 8px 30px -5px rgba(0,0,0,0.6),
                0 0 0 1px rgba(255,255,255,0.05)
              `,
            }}
          >
            {/* Inner channel/groove of the ring */}
            <div 
              className="absolute inset-[6px] rounded-full"
              style={{
                background: 'linear-gradient(145deg, #1a1a1a, #111, #1a1a1a)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), inset 0 -1px 3px rgba(255,255,255,0.03)',
              }}
            />

            {/* Sensor array (inside of ring — the green LEDs) */}
            <div className="absolute inset-[14px] rounded-full flex items-center justify-center">
              <motion.div
                animate={{ opacity: pulseActive ? [0.4, 1, 0.4] : [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex gap-[6px]"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-green-400 shadow-[0_0_6px_2px] shadow-green-400/60" />
                <div className="w-[5px] h-[5px] rounded-full bg-green-500 shadow-[0_0_6px_2px] shadow-green-500/60" />
                <div className="w-[5px] h-[5px] rounded-full bg-green-400 shadow-[0_0_6px_2px] shadow-green-400/60" />
              </motion.div>
            </div>
          </div>

          {/* Ring highlight/reflection */}
          <div 
            className="absolute inset-[20px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
              borderRadius: '50%',
            }}
          />

          {/* Animated glow around ring */}
          <motion.div
            animate={{ 
              boxShadow: pulseActive 
                ? '0 0 40px 8px oklch(0.75 0.18 160 / 0.15), 0 0 80px 20px oklch(0.75 0.18 160 / 0.05)' 
                : '0 0 20px 4px oklch(0.75 0.18 160 / 0.08), 0 0 40px 10px oklch(0.75 0.18 160 / 0.02)'
            }}
            transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
            className="absolute inset-[18px] rounded-full"
          />
        </div>

        {/* Floating data readouts */}
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0, times: [0, 0.15, 0.85, 1] }}
          className="absolute -right-24 top-6 text-[11px] font-mono text-primary bg-primary/[0.08] border border-primary/20 rounded-lg px-2.5 py-1.5 backdrop-blur-sm"
        >
          HRV 52ms
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1.3, times: [0, 0.15, 0.85, 1] }}
          className="absolute -left-28 top-10 text-[11px] font-mono text-accent bg-accent/[0.08] border border-accent/20 rounded-lg px-2.5 py-1.5 backdrop-blur-sm"
        >
          Sleep 87
        </motion.div>

        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
          transition={{ duration: 4, repeat: Infinity, delay: 2.6, times: [0, 0.15, 0.85, 1] }}
          className="absolute -right-28 bottom-10 text-[11px] font-mono text-green-400 bg-green-400/[0.08] border border-green-400/20 rounded-lg px-2.5 py-1.5 backdrop-blur-sm"
        >
          Ready 91
        </motion.div>
      </motion.div>

      {/* Hero Text */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 text-center mt-10"
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
          className="text-sm text-muted-foreground mt-2.5 max-w-sm mx-auto leading-relaxed"
        >
          EdgeSync reads your ring. Correlates the data. Shows you when to trade — and when to sit out.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 flex flex-col items-center"
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
