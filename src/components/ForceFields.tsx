/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

// 1. Classical Attractor Node
function Attractor({ position, color }: { position: THREE.Vector3; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    const age = (Date.now() - mountedAt.current) / 1000;
    let lifeScale = 1;
    if (age < 0.5) lifeScale = age / 0.5;
    else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

    const time = state.clock.getElapsedTime();

    if (meshRef.current) {
      const scale = (1.2 + Math.sin(time * 5.0) * 0.12) * lifeScale;
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y += 0.01;
    }
    if (ringRef.current) {
      const scale = (1.8 + Math.cos(time * 3.0) * 0.15) * lifeScale;
      ringRef.current.scale.set(scale, scale, scale);
      ringRef.current.rotation.x = time * 1.5;
      ringRef.current.rotation.y = time * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Outer spinning ring orbital */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.8, 0.04, 8, 32]} />
        <meshBasicMaterial color={color || "#ffffff"} transparent opacity={0.4} />
      </mesh>

      {/* Glossy translucent core body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshPhysicalMaterial 
          transmission={0.8} 
          ior={1.6} 
          thickness={1.5} 
          roughness={0.05} 
          color={color || "#3399FF"}
          emissive={color || "#3399FF"}
          emissiveIntensity={0.5}
        />
        {/* Inner radiant fuel nucleus */}
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </mesh>
    </group>
  );
}

// 2. Shockwave Repulsor Ring
function Repulsor({ position, color }: { position: THREE.Vector3; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    if (groupRef.current) {
      const age = (Date.now() - mountedAt.current) / 1000;
      let lifeScale = 1;
      if (age < 0.5) lifeScale = age / 0.5;
      else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

      const time = state.clock.getElapsedTime() * 1.2;
      groupRef.current.children.forEach((child, i) => {
        if (i === 3) {
          // Inner repulsor Core
          child.scale.set(lifeScale, lifeScale, lifeScale);
          return;
        }
        const mesh = child as THREE.Mesh;
        const phase = (time + i * 0.33) % 1.0;
        const scale = (0.2 + phase * 4.2) * lifeScale;
        mesh.scale.set(scale, scale, scale);
        const opacity = Math.sin(phase * Math.PI) * 0.5 * lifeScale;
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      });
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.8, 0.85, 32]} />
          <meshBasicMaterial color={color || "#ff3366"} side={THREE.DoubleSide} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color || "#ff3366"} />
      </mesh>
    </group>
  );
}

// 3. Swirling Vortex Field
function Vortex({ position, color }: { position: THREE.Vector3; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    if (groupRef.current) {
      const age = (Date.now() - mountedAt.current) / 1000;
      let lifeScale = 1;
      if (age < 0.5) lifeScale = age / 0.5;
      else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.z = time * 2.5;
      
      const sc = (1.0 + Math.sin(time * 6.0) * 0.08) * lifeScale;
      groupRef.current.scale.set(sc, sc, sc);
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {/* 3 Concentric spiral arm rings */}
      {[0.5, 0.9, 1.4].map((radius, i) => (
        <mesh key={i} rotation={[0, 0, i * 0.4]}>
          <ringGeometry args={[radius, radius + 0.08, 30, 2, 0, Math.PI * 1.5]} />
          <meshBasicMaterial color={color || "#a855f7"} side={THREE.DoubleSide} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// 4. Jittery Chaos Field
function Chaos({ position, color }: { position: THREE.Vector3; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    const age = (Date.now() - mountedAt.current) / 1000;
    let lifeScale = 1;
    if (age < 0.5) lifeScale = age / 0.5;
    else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Jitter metrics
      meshRef.current.position.set(
        position.x + Math.sin(time * 45.0) * 0.03 * lifeScale,
        position.y + Math.cos(time * 35.0) * 0.03 * lifeScale,
        position.z + Math.sin(time * 25.0) * 0.02 * lifeScale
      );
      meshRef.current.rotation.x = time * 3.0;
      meshRef.current.rotation.y = time * 2.0;

      const sc = (0.7 + Math.sin(time * 12.0) * 0.15) * lifeScale;
      meshRef.current.scale.set(sc, sc, sc);
    }
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.6, 0]} />
      <meshBasicMaterial color={color || "#eab308"} wireframe />
    </mesh>
  );
}

// 5. Unidirectional Solar Wind Thrust vector
function SolarWind({ position, color }: { position: THREE.Vector3; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      const age = (Date.now() - mountedAt.current) / 1000;
      let lifeScale = 1;
      if (age < 0.5) lifeScale = age / 0.5;
      else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const xOffset = ((time * 1.5 + i * 0.4) % 1.6) - 0.8;
        mesh.position.x = xOffset;
        mesh.scale.set(lifeScale, lifeScale, lifeScale);
        const opacity = (1.0 - Math.abs(xOffset / 0.8)) * 0.6 * lifeScale;
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      });
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {[-0.8, 0, 0.8].map((offset, i) => (
        <mesh key={i} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.12, 0.4, 4]} />
          <meshBasicMaterial color={color || "#10b981"} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// 6. Supernova Energy Strobe
function Strobe({ position, color }: { position: THREE.Vector3; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    const age = (Date.now() - mountedAt.current) / 1000;
    let lifeScale = 1;
    if (age < 0.5) lifeScale = age / 0.5;
    else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

    const time = state.clock.getElapsedTime();
    const isFlashing = Math.floor(time * 24.0) % 2 === 0;

    if (meshRef.current) {
      meshRef.current.scale.setScalar((isFlashing ? 0.9 : 0.4) * lifeScale);
    }
    if (glowRef.current) {
      const gSc = (1.6 + Math.sin(time * 16.0) * 0.4) * lifeScale;
      glowRef.current.scale.setScalar(gSc);
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color={color || "#eab308"} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// 7. Dark Rift Singularity
function Singularity({ position, color }: { position: THREE.Vector3; color: string }) {
  const accretionRingRef = useRef<THREE.Mesh>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    const age = (Date.now() - mountedAt.current) / 1000;
    let lifeScale = 1;
    if (age < 0.5) lifeScale = age / 0.5;
    else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

    if (accretionRingRef.current) {
      const time = state.clock.getElapsedTime();
      accretionRingRef.current.rotation.z = -time * 4.0;
      const ringScale = (1.1 + Math.sin(time * 8.0) * 0.08) * lifeScale;
      accretionRingRef.current.scale.set(ringScale, ringScale, ringScale);
    }
  });

  return (
    <group position={position}>
      {/* Dynamic blazing accretion ring */}
      <mesh ref={accretionRingRef}>
        <ringGeometry args={[0.5, 0.72, 32]} />
        <meshBasicMaterial color={color || "#ffffff"} transparent opacity={0.8} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Pitch black event horizon */}
      <mesh>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}

// 8. Gravity Well Accretion Rings
function GravityWell({ position, color }: { position: THREE.Vector3; color: string }) {
  const ringsRef = useRef<THREE.Group>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    const age = (Date.now() - mountedAt.current) / 1000;
    let lifeScale = 1;
    if (age < 0.5) lifeScale = age / 0.5;
    else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

    if (ringsRef.current) {
      const time = state.clock.getElapsedTime();
      ringsRef.current.rotation.z = time * 0.45;
      ringsRef.current.children.forEach((child, idx) => {
        child.rotation.x = time * (0.2 + idx * 0.1);
        child.rotation.y = time * (0.15 + idx * 0.08);
        const sc = (1.0 + Math.sin(time + idx) * 0.05) * lifeScale;
        child.scale.set(sc, sc, sc);
      });
    }
  });

  return (
    <group position={position} ref={ringsRef}>
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {[1.0, 1.6, 2.2].map((r, i) => (
        <mesh key={i}>
          <torusGeometry args={[r, 0.02, 6, 40]} />
          <meshBasicMaterial color={color || "#6366f1"} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

// 9. Prismatic Hue Crystals
function PrismField({ position }: { position: THREE.Vector3 }) {
  const crystalRef = useRef<THREE.Mesh>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    const age = (Date.now() - mountedAt.current) / 1000;
    let lifeScale = 1;
    if (age < 0.5) lifeScale = age / 0.5;
    else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

    const time = state.clock.getElapsedTime();
    if (crystalRef.current) {
      crystalRef.current.rotation.x = time * 0.8;
      crystalRef.current.rotation.y = time * 1.25;
      crystalRef.current.rotation.z = time * 0.6;
      crystalRef.current.scale.setScalar((0.7 + Math.sin(time * 3.0) * 0.06) * lifeScale);
      
      const material = crystalRef.current.material as THREE.MeshBasicMaterial;
      const hue = (time * 0.2) % 1.0;
      material.color.setHSL(hue, 1.0, 0.6);
    }
  });

  return (
    <mesh ref={crystalRef} position={position}>
      <octahedronGeometry args={[0.6, 0]} />
      <meshBasicMaterial color="#ffffff" wireframe />
    </mesh>
  );
}

// 10. Dipole Magnetic Loops
function MagnetField({ position, color }: { position: THREE.Vector3; color: string }) {
  const loopsRef = useRef<THREE.Group>(null);
  const mountedAt = useRef(Date.now());

  useFrame((state) => {
    const age = (Date.now() - mountedAt.current) / 1000;
    let lifeScale = 1;
    if (age < 0.5) lifeScale = age / 0.5;
    else if (age > 9.5) lifeScale = Math.max(0, (10 - age) / 0.5);

    const time = state.clock.getElapsedTime();
    if (loopsRef.current) {
      loopsRef.current.rotation.y = time * 0.5;
      loopsRef.current.scale.setScalar((1.0 + Math.sin(time * 2.0) * 0.15) * lifeScale);
    }
  });

  return (
    <group position={position} ref={loopsRef}>
      <mesh>
        <boxGeometry args={[0.15, 0.55, 0.15]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {[0.5, 0.9, 1.3].map((r, i) => (
        <group key={i} rotation={[0, 0, i * Math.PI / 3]}>
          <mesh>
            <torusGeometry args={[r, 0.015, 4, 30]} />
            <meshBasicMaterial color={color || "#ec4899"} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Global Orchestrator
export function ForceFields() {
  const forceFields = useGameStore((state) => state.forceFields);

  return (
    <>
      {Object.values(forceFields).map((force) => {
        const pos = new THREE.Vector3(force.position.x, force.position.y, force.position.z);
        
        switch (force.type) {
          case 'attractor':
            return <Attractor key={force.id} position={pos} color={force.color} />;
          case 'repulsor':
            return <Repulsor key={force.id} position={pos} color={force.color} />;
          case 'vortex':
            return <Vortex key={force.id} position={pos} color={force.color} />;
          case 'chaos':
            return <Chaos key={force.id} position={pos} color={force.color} />;
          case 'wind':
            return <SolarWind key={force.id} position={pos} color={force.color} />;
          case 'strobe':
            return <Strobe key={force.id} position={pos} color={force.color} />;
          case 'singularity':
            return <Singularity key={force.id} position={pos} color={force.color} />;
          case 'gravity_well':
            return <GravityWell key={force.id} position={pos} color={force.color} />;
          case 'prism':
            return <PrismField key={force.id} position={pos} />;
          case 'magnet':
            return <MagnetField key={force.id} position={pos} color={force.color} />;
          default:
            return <Attractor key={force.id} position={pos} color={force.color} />;
        }
      })}
    </>
  );
}
