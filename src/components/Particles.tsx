/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { computeCurl } from '../utils/curlNoise';

const MAX_PARTICLES = 25000;
const PARTICLE_LIFETIME = 3.5; // seconds

interface Particle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  baseColor: THREE.Color;
  life: number;
  size: number;
}

export function Particles({ mousePosRef }: { mousePosRef: React.MutableRefObject<THREE.Vector3 | null> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pull states from store
  const myColor = useGameStore((state) => state.myColor);
  const players = useGameStore((state) => state.players);
  const forceFields = useGameStore((state) => state.forceFields);
  const flowSpeed = useGameStore((state) => state.flowSpeed || 1.0);
  const particlePreset = useGameStore((state) => state.particlePreset || 'nebula');
  const incrementParticleCount = useGameStore((state) => state.incrementParticleCount);

  // Procedural gradient particle circular texture for soft glass-morphic blend
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.15, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.35, 'rgba(200,220,255,0.4)');
    gradient.addColorStop(0.6, 'rgba(100,150,255,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Preset Color Palettes
  const presetColors = useMemo(() => {
    return {
      nebula: ['#a855f7', '#3b82f6', '#06b6d4', '#ec4899'], // purple, blue, cyan, hotpink
      hypernova: ['#10b981', '#06b6d4', '#14b8a6', '#facc15'], // green, cyan, teal, gold
      supernova: ['#f97316', '#ef4444', '#facc15', '#ffffff'], // orange, red, yellow, white
      spectrum: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7'] // full rainbow
    };
  }, []);

  // Helper to retrieve color by preset and seed
  const getPresetColor = (preset: string, index: number): string => {
    const colors = presetColors[preset as keyof typeof presetColors] || presetColors.nebula;
    return colors[index % colors.length];
  };

  // Particles state storage
  const particles = useMemo(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      arr.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        baseColor: new THREE.Color(),
        life: 0,
        size: 0.05 + Math.random() * 0.08,
      });
    }
    return arr;
  }, []);

  // Recyclable THREE components to prevent garbage collection allocation lag
  const tempV1 = useMemo(() => new THREE.Vector3(), []);
  const tempV2 = useMemo(() => new THREE.Vector3(), []);
  const fPos = useMemo(() => new THREE.Vector3(), []);
  const zVector = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const upVector = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const decayColor = useMemo(() => new THREE.Color('#220c04'), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const spawnIndex = useRef(0);

  // Spawn particle handler
  const spawnParticle = (pos: THREE.Vector3, colorHex: string) => {
    const p = particles[spawnIndex.current];
    p.active = true;
    p.position.copy(pos);
    
    // Aesthetic orbital spread starting shapes
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.6;
    p.position.x += Math.cos(angle) * r;
    p.position.y += Math.sin(angle) * r;
    p.position.z += (Math.random() - 0.5) * 1.2;
    
    // Add radial launch momentum based on current color schemes
    p.velocity.set(
      Math.cos(angle) * 1.5 + (Math.random() - 0.5) * 1.0,
      Math.sin(angle) * 1.5 + (Math.random() - 0.5) * 1.0,
      (Math.random() - 0.5) * 1.5
    );

    // Dynamic color blends from preset
    let targetColorHex = colorHex;
    if (Math.random() < 0.6) {
      targetColorHex = getPresetColor(particlePreset, spawnIndex.current);
    }
    
    p.color.set(targetColorHex);
    p.baseColor.set(targetColorHex);
    p.life = PARTICLE_LIFETIME * (0.8 + Math.random() * 0.4); // random duration

    spawnIndex.current = (spawnIndex.current + 1) % MAX_PARTICLES;
  };

  // Keep track of spawned particle metrics for achievements
  const particlesToReportRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Throttle extreme frame timings
    const dt = Math.min(0.1, delta) * flowSpeed;

    // Spawn client particles (Cursor trail)
    if (mousePosRef.current && myColor) {
      const spawnCount = Math.floor(65 * flowSpeed); // Density scaled by flow speed
      for (let i = 0; i < spawnCount; i++) {
        spawnParticle(mousePosRef.current, myColor);
      }
      particlesToReportRef.current += spawnCount;
    }

    // Spawn other players' particles
    Object.values(players).forEach(player => {
      if (player.position && player.color) {
        tempV1.set(player.position.x, player.position.y, player.position.z);
        const spawnCount = Math.floor(40 * flowSpeed);
        for (let i = 0; i < spawnCount; i++) {
          spawnParticle(tempV1, player.color);
        }
      }
    });

    // Send metric update occasionally to avoid clogging local state
    if (particlesToReportRef.current > 400) {
      incrementParticleCount(particlesToReportRef.current);
      particlesToReportRef.current = 0;
    }

    const forces = Object.values(forceFields);
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (!p.active) {
        dummy.position.set(0, 0, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // 1. Natural deep space Simplex/Curl Noise turbulence
      const noiseScale = 0.22;
      const curlVector = computeCurl(p.position.x * noiseScale, p.position.y * noiseScale, p.position.z * noiseScale);
      p.velocity.addScaledVector(curlVector, dt * 7.5);

      // 2. Resolve Multi-Action Active Force Fields
      for (const force of forces) {
        fPos.set(force.position.x, force.position.y, force.position.z);
        tempV1.subVectors(fPos, p.position);
        const distSq = tempV1.lengthSq();
        const dist = Math.sqrt(distSq);

        if (distSq > 0.05 && distSq < 600) {
          const normalDir = tempV1.normalize();
          const gravityMultiplier = 160.0;
          const strength = gravityMultiplier / (distSq + 1.2);

          switch (force.type) {
            case 'attractor': {
              // Classic magnetic sink pulls inwards
              p.velocity.addScaledVector(normalDir, strength * dt);
              if (distSq < 15) {
                // Permanently blend base colors into the attractor node color
                p.baseColor.lerp(new THREE.Color(force.color), 0.06);
              }
              break;
            }
            case 'repulsor': {
              // Radiant expansion thrust pushing particles away
              p.velocity.addScaledVector(normalDir, -strength * 1.5 * dt);
              break;
            }
            case 'vortex': {
              // Heavy centrifugal rotational orbit (right-angle vector)
              const tangent = tempV2.crossVectors(normalDir, zVector).normalize();
              const vortexStrength = 120.0 / (distSq + 2.0);
              // Spirals in slightly as well for dramatic effect!
              p.velocity.addScaledVector(tangent, vortexStrength * dt * 2.2);
              p.velocity.addScaledVector(normalDir, vortexStrength * dt * 0.45);
              break;
            }
            case 'chaos': {
              // Injects jagged local Brownian noise
              const chaoticScale = 0.95;
              const rndCurl = computeCurl(p.position.x * chaoticScale, p.position.y * chaoticScale, time * 0.5);
              p.velocity.addScaledVector(rndCurl, strength * dt * 4.0);
              break;
            }
            case 'wind': {
              // Horizontal horizontal streaming thrust
              p.velocity.x += strength * dt * 0.8;
              p.velocity.y += Math.sin(p.position.x * 0.5 + time) * strength * dt * 0.15;
              break;
            }
            case 'strobe': {
              // High velocity explosion pulses
              const pulse = 1.0 + Math.sin(time * 16.0) * 0.6;
              p.velocity.addScaledVector(normalDir, strength * pulse * dt * 1.8);
              break;
            }
            case 'singularity': {
              // suctions particles in, if too close, ejects them as superheated matter!
              if (dist < 1.2) {
                p.velocity.addScaledVector(normalDir, -strength * 12.0 * dt);
                p.baseColor.setRGB(1.0, 1.0, 1.0); // flash white
              } else {
                p.velocity.addScaledVector(normalDir, strength * 2.5 * dt);
              }
              break;
            }
            case 'gravity_well': {
              // Slows down particles to form orbiting accretion rings
              p.velocity.lerp(tempV2.set(0,0,0), 0.12 * dt);
              const tangent = tempV2.crossVectors(normalDir, zVector).normalize();
              p.velocity.addScaledVector(tangent, strength * dt * 1.5);
              break;
            }
            case 'prism': {
              // Shifts particle color to rainbow spectra based on force coordinate
              const hue = (dist * 0.1 + time * 0.2) % 1.0;
              p.baseColor.setHSL(hue, 1.0, 0.6);
              break;
            }
            case 'magnet': {
              // Strongly suctions, speeds up, and swells particle sizes
              p.velocity.addScaledVector(normalDir, strength * dt * 2.0);
              break;
            }
          }
        }
      }

      // Apply dynamic velocity friction (Damping)
      p.velocity.multiplyScalar(0.965);
      p.position.addScaledVector(p.velocity, dt);

      // Aesthetic color shifts (glow and fade) relative to remaining lifetime
      const lifeRatio = p.life / PARTICLE_LIFETIME;
      p.color.copy(p.baseColor);
      
      // Let standard elements fade to a beautiful stellar charcoal red near retirement
      if (lifeRatio < 0.3) {
        p.color.lerp(decayColor, (1.0 - (lifeRatio / 0.3)));
      }

      // Update actual Matrix Coordinates
      dummy.position.copy(p.position);
      
      // Calculate particle velocity stretch distortion matching standard AAA visuals
      const speed = p.velocity.length();
      const finalLifeScale = Math.min(1.0, lifeRatio * 1.3);
      const stretch = Math.min(3.5, Math.max(1, speed * 0.12));
      const widthScale = p.size * finalLifeScale;
      
      dummy.scale.set(widthScale, widthScale, widthScale * stretch);

      // Orient the stretch mesh to face the velocity direction vector
      if (speed > 0.01) {
        const velDir = tempV1.copy(p.velocity).normalize();
        quaternion.setFromUnitVectors(upVector, velDir);
        dummy.quaternion.copy(quaternion);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, p.color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Render highly optimized instanced mesh using Spheres
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial 
        map={particleTexture}
        transparent 
        opacity={0.88} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
