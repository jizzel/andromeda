"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();

  // Particle count based on device
  const particleCount = isMobile ? 50 : 250;

  // Update particle color based on theme changes
  useEffect(() => {
    const updateMaterial = () => {
      if (materialRef.current) {
        const isLight = document.documentElement.classList.contains('light');
        const color = isLight ? "#8B7355" : "#F5EBDD";
        const opacity = isLight ? 0.4 : 0.6;
        materialRef.current.color.set(color);
        materialRef.current.opacity = opacity;
      }
    };

    // Set initial colors
    updateMaterial();

    // Watch for theme changes
    const observer = new MutationObserver(updateMaterial);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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
        ref={materialRef}
        size={0.05}
        color="#F5EBDD"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function HeroBackground() {
  const isMobile = useIsMobile();
  const [bgColor, setBgColor] = useState("#0F111A");

  useEffect(() => {
    const updateColors = () => {
      const isLight = document.documentElement.classList.contains('light');
      setBgColor(isLight ? "#FAFAFA" : "#0F111A");
    };

    // Set initial colors
    updateColors();

    // Watch for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Mobile fallback: CSS gradient using CSS variables
  if (isMobile) {
    return (
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--andromeda-primary)] to-[var(--andromeda-secondary)]"
      />
    );
  }

  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: bgColor }}
      >
        <ambientLight intensity={0.5} />
        <Particles />
      </Canvas>
    </div>
  );
}
