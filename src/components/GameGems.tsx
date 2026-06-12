/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

function SingleGem({ id, position, color }: { id: string; position: THREE.Vector3; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Fast orbital spinning
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 2.8 + id.charCodeAt(0) * 0.1;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 1.6;
      
      // Floating hover motion
      const hover = Math.sin(state.clock.getElapsedTime() * 4 + id.charCodeAt(1) * 0.15) * 0.12;
      meshRef.current.position.y = position.y + hover;
    }
    
    if (glowRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.getElapsedTime() * 8) * 0.18;
      glowRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Octahedron Core Crystal Mesh */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={1.8}
          roughness={0.05}
          metalness={0.95}
        />
      </mesh>
      
      {/* Halo Pulse Bubble */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.16} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
        />
      </mesh>

      {/* Concentric Energy Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.46, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function GameGems({ mousePosRef }: { mousePosRef: React.MutableRefObject<THREE.Vector3 | null> }) {
  const gems = useGameStore((state) => state.gems);
  const collectGem = useGameStore((state) => state.collectGem);
  const lastCollectedTime = useRef<Record<string, number>>({});

  useFrame(() => {
    if (!mousePosRef.current) return;
    
    const now = Date.now();
    gems.forEach((gem) => {
      // Prevent rapid double triggers within 350ms
      if (now - (lastCollectedTime.current[gem.id] || 0) < 350) return;

      const gemPos = new THREE.Vector3(gem.position.x, gem.position.y, gem.position.z);
      const dist = mousePosRef.current!.distanceTo(gemPos);
      
      // Collect range
      if (dist < 1.05) {
        lastCollectedTime.current[gem.id] = now;
        collectGem(gem.id);
      }
    });
  });

  return (
    <>
      {gems.map((gem) => {
        const pos = new THREE.Vector3(gem.position.x, gem.position.y, gem.position.z);
        return (
          <SingleGem 
            key={gem.id} 
            id={gem.id} 
            position={pos} 
            color={gem.color} 
          />
        );
      })}
    </>
  );
}
