'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetSimulationProps } from '@/lib/types';

/**
 * Star Component - The host star at the center
 */
function Star({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        emissive="#ffaa00"
        emissiveIntensity={1.5}
        color="#ffcc33"
      />
      {/* Star glow */}
      <pointLight intensity={2} distance={50} decay={2} />
    </mesh>
  );
}

/**
 * Planet Component - Orbiting exoplanet
 */
function Planet({
  radius,
  orbitRadius,
  color,
  speed,
}: {
  radius: number;
  orbitRadius: number;
  color: string;
  speed: number;
}) {
  const planetRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (orbitRef.current) {
      // Orbit around star
      orbitRef.current.rotation.y += speed;
    }
    if (planetRef.current) {
      // Planet rotation
      planetRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group ref={orbitRef}>
      <mesh ref={planetRef} position={[orbitRadius, 0, 0]}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      {/* Orbit path */}
      <OrbitPath radius={orbitRadius} />
    </group>
  );
}

/**
 * Orbit Path Component - Shows the planet's orbital path
 */
function OrbitPath({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,              // center x, y
      radius, radius,    // xRadius, yRadius
      0, 2 * Math.PI,    // startAngle, endAngle
      false,             // clockwise
      0                  // rotation
    );
    
    const pts = curve.getPoints(128);
    return pts.map((p) => new THREE.Vector3(p.x, 0, p.y));
  }, [radius]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#444444', opacity: 0.3, transparent: true }))} />
  );
}

/**
 * Scene Component - Main 3D scene with star and planets
 */
function Scene({ detections }: { detections: PlanetSimulationProps['detections'] }) {
  const starRadius = 1.5;
  
  // Generate planet colors based on detection confidence
  const getPlanetColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4ade80'; // green
    if (confidence >= 0.6) return '#60a5fa'; // blue
    if (confidence >= 0.4) return '#fbbf24'; // yellow
    return '#f87171'; // red
  };

  // Calculate orbit radius based on period (simple scaling)
  const getOrbitRadius = (period: number, index: number) => {
    // Use period for realistic spacing, with minimum separation
    return 3 + Math.sqrt(period) * 0.8 + index * 0.5;
  };

  // Calculate planet size based on depth (larger depth = larger planet)
  const getPlanetRadius = (depth: number) => {
    return 0.2 + depth * 30; // Scale depth to reasonable planet size
  };

  // Calculate orbital speed (shorter period = faster orbit)
  const getOrbitalSpeed = (period: number) => {
    return 0.01 / Math.sqrt(period);
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      
      {/* Star field background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Central star */}
      <Star radius={starRadius} />

      {/* Orbiting planets */}
      {detections.map((detection: PlanetSimulationProps['detections'][0], index: number) => (
        <Planet
          key={`planet-${index}`}
          radius={getPlanetRadius(detection.depth)}
          orbitRadius={getOrbitRadius(detection.period, index)}
          color={getPlanetColor(detection.confidence)}
          speed={getOrbitalSpeed(detection.period)}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
      />
    </>
  );
}

/**
 * PlanetSimulation Component
 * 3D visualization of detected exoplanets orbiting their host star
 */
function PlanetSimulation({ detections, ticId }: PlanetSimulationProps) {
  if (!detections || detections.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl">
        <div className="text-center p-8">
          <p className="text-gray-400 text-lg mb-2">🪐</p>
          <p className="text-gray-500 text-sm">No planets to simulate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Info overlay */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="text-sm font-bold mb-2">🌟 System: TIC {ticId}</h3>
        <div className="text-xs space-y-1">
          <p className="text-gray-300">{detections.length} planet{detections.length > 1 ? 's' : ''} detected</p>
          {detections.map((det: PlanetSimulationProps['detections'][0], idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    det.confidence >= 0.8 ? '#4ade80' :
                    det.confidence >= 0.6 ? '#60a5fa' :
                    det.confidence >= 0.4 ? '#fbbf24' : '#f87171'
                }}
              />
              <span className="text-gray-400">
                Planet {idx + 1}: {det.period.toFixed(2)}d period
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
        <p className="text-xs text-gray-400">
          🖱️ Drag to rotate • Scroll to zoom
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 10, 20], fov: 50 }}
        className="bg-black rounded-xl"
      >
        <Scene detections={detections} />
      </Canvas>
    </div>
  );
}

export default PlanetSimulation;
