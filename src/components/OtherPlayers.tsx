/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { Trail, Html } from '@react-three/drei';

function PlayerCursor({ position, color, name, score }: { position: THREE.Vector3; color: string; name: string; score: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Smoothly interpolate position
      meshRef.current.position.lerp(position, 0.2);
      // Add a fast pulsing effect based on spawn rate
      const scale = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Trail
      width={0.5}
      length={20}
      color={new THREE.Color(color)}
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
        
        {/* Floating HTML Name & Score Overlay */}
        <Html distanceFactor={14} position={[0, 0.75, 0]} pointerEvents="none" center>
          <div className="flex flex-col items-center select-none select-none-all">
            <span 
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20 bg-black/90 text-white whitespace-nowrap shadow-md flex items-center gap-1.5"
              style={{ boxShadow: `0 0 10px ${color}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {name || 'Astronaut'}
              <span className="text-yellow-400 font-mono font-bold text-[9px]">{score || 0} pts</span>
            </span>
          </div>
        </Html>

        {/* Outer glow */}
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </mesh>
    </Trail>
  );
}

export function LocalCursor({ mousePosRef }: { mousePosRef: React.MutableRefObject<THREE.Vector3 | null> }) {
  const myColor = useGameStore((state) => state.myColor);
  const myName = useGameStore((state) => state.myName);
  const myScore = useGameStore((state) => state.myScore || 0);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && mousePosRef.current) {
      meshRef.current.position.lerp(mousePosRef.current, 0.5);
      const scale = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!myColor) return null;

  return (
    <Trail
      width={0.5}
      length={20}
      color={new THREE.Color(myColor)}
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial color={myColor} transparent opacity={0.8} />

        {/* Floating HTML Label for Self */}
        <Html distanceFactor={14} position={[0, 0.75, 0]} pointerEvents="none" center>
          <div className="flex flex-col items-center select-none select-none-all">
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500 bg-black/95 text-white whitespace-nowrap shadow-md flex items-center gap-1.5"
              style={{ boxShadow: `0 0 12px ${myColor}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping-slow" />
              {myName || 'You'}
              <span className="text-yellow-400 font-mono font-bold text-[9px]">{myScore} pts</span>
            </span>
          </div>
        </Html>

        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshBasicMaterial color={myColor} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </mesh>
    </Trail>
  );
}

export function OtherPlayers() {
  const players = useGameStore((state) => state.players);

  return (
    <>
      {Object.values(players).map((player) => {
        if (!player.position) return null;
        const pos = new THREE.Vector3(player.position.x, player.position.y, player.position.z);
        return (
          <PlayerCursor 
            key={player.id} 
            position={pos} 
            color={player.color} 
            name={player.name || 'Anonymous'}
            score={player.score || 0}
          />
        );
      })}
    </>
  );
}
