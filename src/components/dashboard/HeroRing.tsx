'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import * as THREE from 'three';

function SmartRing() {
  const ringRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.006;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08 + 0.5;
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      glowRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={ringRef} rotation={[0.5, 0, 0.1]}>
        {/* Main ring — dark brushed titanium */}
        <mesh castShadow>
          <torusGeometry args={[1.1, 0.3, 128, 256]} />
          <meshPhysicalMaterial
            color="#1c1c1c"
            metalness={1}
            roughness={0.2}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            reflectivity={1}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Subtle brushed texture layer */}
        <mesh>
          <torusGeometry args={[1.1, 0.305, 128, 256]} />
          <meshPhysicalMaterial
            color="#2a2a2a"
            metalness={1}
            roughness={0.35}
            transparent
            opacity={0.15}
          />
        </mesh>

        {/* Inner surface */}
        <mesh>
          <torusGeometry args={[1.1, 0.22, 64, 256]} />
          <meshStandardMaterial
            color="#0a0a0a"
            metalness={0.8}
            roughness={0.6}
          />
        </mesh>

        {/* Green sensor LED strip — the signature look */}
        <mesh ref={glowRef}>
          <torusGeometry args={[0.85, 0.02, 32, 256]} />
          <meshStandardMaterial
            color="#4ade80"
            emissive="#4ade80"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>

        {/* Individual sensor dots */}
        {[0, 0.8, -0.8, 1.6, -1.6].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 0.85, Math.sin(angle) * 0.02, Math.sin(angle) * 0.85]}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={4}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-4, -2, 3]} intensity={0.3} color="#4ade80" />
      <pointLight position={[2, 2, 3]} intensity={0.6} color="#a78bfa" distance={10} />
      <pointLight position={[-2, -1, 3]} intensity={0.3} color="#4ade80" distance={8} />
      <Suspense fallback={null}>
        <SmartRing />
        <Environment preset="studio" />
      </Suspense>
    </Canvas>
  );
}

export default function HeroRing() {
  const { scrollY } = useScroll();
  
  const ringScale = useTransform(scrollY, [0, 250], [1, 0.5]);
  const ringOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const ringY = useTransform(scrollY, [0, 250], [0, -50]);
  const textOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const textY = useTransform(scrollY, [0, 150], [0, -15]);
  
  const smoothScale = useSpring(ringScale, { stiffness: 80, damping: 25 });
  const smoothY = useSpring(ringY, { stiffness: 80, damping: 25 });

  return (
    <div className="relative w-full flex flex-col items-center justify-center pb-4 overflow-visible" style={{ minHeight: '420px' }}>
      {/* Background ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[350px] h-[350px] rounded-full bg-primary/[0.05] blur-[80px]" 
        />
      </div>

      {/* 3D Ring */}
      <motion.div
        style={{ scale: smoothScale, y: smoothY, opacity: ringOpacity }}
        className="relative z-10 w-[420px] h-[380px]"
      >
        <Scene />

        {/* Data readouts */}
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 0, times: [0, 0.1, 0.9, 1] }}
          className="absolute right-[0px] top-[40px] text-[11px] font-mono bg-card/90 border border-primary/20 rounded-xl px-3 py-2 backdrop-blur-md shadow-xl"
        >
          <span className="text-muted-foreground text-[10px] block">HRV</span>
          <span className="text-primary font-semibold">52 ms</span>
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 1.5, times: [0, 0.1, 0.9, 1] }}
          className="absolute left-[0px] top-[60px] text-[11px] font-mono bg-card/90 border border-accent/20 rounded-xl px-3 py-2 backdrop-blur-md shadow-xl"
        >
          <span className="text-muted-foreground text-[10px] block">Sleep</span>
          <span className="text-accent font-semibold">87 / 100</span>
        </motion.div>

        <motion.div
          animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 3, times: [0, 0.1, 0.9, 1] }}
          className="absolute right-[10px] bottom-[60px] text-[11px] font-mono bg-card/90 border border-green-400/20 rounded-xl px-3 py-2 backdrop-blur-md shadow-xl"
        >
          <span className="text-muted-foreground text-[10px] block">Readiness</span>
          <span className="text-green-400 font-semibold">91 / 100</span>
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 text-center -mt-2"
      >
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-lg font-semibold text-white tracking-tight"
        >
          Your body knows before you do
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-[13px] text-muted-foreground mt-1.5 max-w-[300px] mx-auto"
        >
          Ring data meets trading data. See the correlation.
        </motion.p>
      </motion.div>
    </div>
  );
}
