"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();

  // Particle count based on device
  const particleCount = isMobile ? 50 : 250;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };

    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (!isMobile) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [isMobile]);

  // Create particle geometry
  const particles = useRef<THREE.BufferGeometry | null>(null);
  const positions = useRef<Float32Array | null>(null);

  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const positionsArray = new Float32Array(particleCount * 3);

    // Initialize positions in a grid with randomness
    for (let i = 0; i < particleCount * 3; i += 3) {
      positionsArray[i] = (Math.random() - 0.5) * 50; // x
      positionsArray[i + 1] = (Math.random() - 0.5) * 50; // y
      positionsArray[i + 2] = (Math.random() - 0.5) * 10; // z
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
    particles.current = geometry;
    positions.current = positionsArray;
  }, [particleCount]);

  // Animate particles
  useFrame(() => {
    if (particlesRef.current) {
      // Subtle rotation
      particlesRef.current.rotation.y += 0.0005;
    }
  });

  if (!particles.current) return null;

  return (
    <points ref={particlesRef} geometry={particles.current}>
      <pointsMaterial
        size={0.05}
        color="#F5EBDD" // Beige accent
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function HeroBackground() {
  const isMobile = useIsMobile();

  // Mobile fallback: CSS gradient instead of Three.js
  if (isMobile) {
    return (
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(180deg, #0F111A 0%, #1B1E2B 100%)",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: "#0F111A" }}
      >
        <ambientLight intensity={0.5} />
        <Particles />
      </Canvas>
    </div>
  );
}
