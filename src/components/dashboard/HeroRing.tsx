'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import * as THREE from 'three';

function SmartRing() {
  const ringRef = useRef<THREE.Group>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      // Slow auto-rotation
      ringRef.current.rotation.y += 0.008;
      // Gentle wobble
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1 + 0.4;
      ringRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
    }
    if (innerGlowRef.current) {
      // Pulse the inner glow
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      innerGlowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={ringRef} rotation={[0.4, 0, 0]}>
        {/* Main ring body — dark titanium */}
        <mesh>
          <torusGeometry args={[1.4, 0.35, 64, 128]} />
          <meshStandardMaterial
            color="#2a2a2a"
            metalness={0.95}
            roughness={0.15}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Brushed metal accent ring — outer edge */}
        <mesh>
          <torusGeometry args={[1.4, 0.36, 64, 128]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={1}
            roughness={0.3}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Inner ring — slightly different tone */}
        <mesh>
          <torusGeometry args={[1.4, 0.28, 64, 128]} />
          <meshStandardMaterial
            color="#111111"
            metalness={0.9}
            roughness={0.4}
          />
        </mesh>

        {/* Green sensor strip on inside */}
        <mesh ref={innerGlowRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.12, 0.04, 32, 128]} />
          <meshStandardMaterial
            color="#4ade80"
            emissive="#4ade80"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>

        {/* Secondary sensor dots */}
        {[0, 1.2, -1.2].map((offset, i) => (
          <mesh key={i} position={[Math.cos(offset) * 1.12, 0, Math.sin(offset) * 1.12]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function RingScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-3, -2, 4]} intensity={0.4} color="#4ade80" />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#a78bfa" />
      <Suspense fallback={null}>
        <SmartRing />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

export default function HeroRing() {
  const { scrollY } = useScroll();
  
  const ringScale = useTransform(scrollY, [0, 300], [1, 0.5]);
  const ringOpacity = useTransform(scrollY, [0, 350], [1, 0]);
  const ringY = useTransform(scrollY, [0, 300], [0, -60]);
  const textOpacity = useTransform(scrollY, [0, 180], [1, 0]);
  const textY = useTransform(scrollY, [0, 180], [0, -20]);
  
  const smoothScale = useSpring(ringScale, { stiffness: 80, damping: 25 });
  const smoothY = useSpring(ringY, { stiffness: 80, damping: 25 });

  return (
    <div className="relative w-full flex flex-col items-center justify-center pt-2 pb-6 overflow-visible">
      {/* Background glow behind ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[300px] h-[300px] rounded-full bg-primary/[0.07] blur-[60px]" 
        />
      </div>

      {/* 3D Ring Canvas */}
      <motion.div
        style={{ scale: smoothScale, y: smoothY, opacity: ringOpacity }}
        className="relative z-10 w-[320px] h-[280px]"
      >
        <RingScene />

        {/* Floating data tags */}
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0, times: [0, 0.12, 0.88, 1] }}
          className="absolute right-[-20px] top-[30px] text-[11px] font-mono text-primary bg-card/90 border border-primary/20 rounded-lg px-3 py-1.5 backdrop-blur-md shadow-lg shadow-primary/5"
        >
          <span className="text-muted-foreground">HRV</span> 52ms
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1.5, times: [0, 0.12, 0.88, 1] }}
          className="absolute left-[-20px] top-[50px] text-[11px] font-mono text-accent bg-card/90 border border-accent/20 rounded-lg px-3 py-1.5 backdrop-blur-md shadow-lg shadow-accent/5"
        >
          <span className="text-muted-foreground">Sleep</span> 87
        </motion.div>

        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] }}
          transition={{ duration: 4, repeat: Infinity, delay: 3, times: [0, 0.12, 0.88, 1] }}
          className="absolute right-[-10px] bottom-[50px] text-[11px] font-mono text-green-400 bg-card/90 border border-green-400/20 rounded-lg px-3 py-1.5 backdrop-blur-md shadow-lg shadow-green-500/5"
        >
          <span className="text-muted-foreground">Ready</span> 91
        </motion.div>
      </motion.div>

      {/* Hero Text */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 text-center mt-2"
      >
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl font-bold text-white tracking-tight"
        >
          Your body knows before you do
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-[13px] text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed"
        >
          Your ring reads your vitals. EdgeSync tells you when to trade.
        </motion.p>
      </motion.div>
    </div>
  );
}
