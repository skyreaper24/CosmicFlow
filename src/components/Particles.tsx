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
  const particleShape = useGameStore((state) => state.particleShape || 'dust');
  const bloomIntensity = useGameStore((state) => state.bloomIntensity || 1.8);
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
      const p: Particle = {
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        baseColor: new THREE.Color(),
        life: 0,
        size: 0.05 + Math.random() * 0.08,
      };

      const colorHex = getPresetColor(particlePreset, i);
      p.color.set(colorHex);
      p.baseColor.set(colorHex);

      arr.push(p);
    }
    return arr;
  }, [particlePreset]);

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

  // High performance spatial hashing arrays (reusable) for physical collisions
  const gridHead = useMemo(() => new Int32Array(2000), []);
  const gridNext = useMemo(() => new Int32Array(MAX_PARTICLES), []);

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

  // Trail particle decay features removed as requested

  // Keep track of spawned particle metrics for achievements
  const particlesToReportRef = useRef(0);

  // Performance monitoring tracking variables
  const fpsFrameCountRef = useRef(0);
  const fpsTimeElapsedRef = useRef(0);
  const lastMetricsUpdateRef = useRef(0);

  // Interaction tracking refs
  const prevMousePosRef = useRef<THREE.Vector3 | null>(null);
  const playerLastPosRef = useRef<Record<string, THREE.Vector3>>({});
  const isPointerDownRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const clickCountRef = useRef(1);
  const movingFramesRef = useRef(0);

  useEffect(() => {
    const activeColor = myColor || getPresetColor(particlePreset, 0);

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.closest('.interactive-overlay') || target.closest('button') || target.closest('input'))) {
        return;
      }
      isPointerDownRef.current = true;
      const now = performance.now();
      if (now - lastClickTimeRef.current < 350) {
        clickCountRef.current++;
      } else {
        clickCountRef.current = 1;
      }
      lastClickTimeRef.current = now;

      // Click or repeated clicks: spawn dynamic stardust burst
      const burstSize = clickCountRef.current > 2 ? 160 : 80;
      if (mousePosRef.current) {
        for (let i = 0; i < burstSize; i++) {
          spawnParticle(mousePosRef.current, activeColor);
        }
      }
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
    };

    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.closest('.interactive-overlay') || target.closest('button') || target.closest('input'))) {
        return;
      }
      // Double click super planetary burst wave
      const burstSize = 250;
      if (mousePosRef.current) {
        for (let i = 0; i < burstSize; i++) {
          spawnParticle(mousePosRef.current, activeColor);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.closest('.interactive-overlay') || target.closest('button') || target.closest('input'))) {
        return;
      }
      movingFramesRef.current = 8; // keep active for 8 frames of spawn
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('dblclick', handleDblClick);
    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [myColor, particlePreset, mousePosRef]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Throttle extreme frame timings
    const dt = Math.min(0.1, delta) * flowSpeed;

    // 1. Rebuild spatial hashing grid for collision detection
    const CELL_SIZE = 0.85;
    gridHead.fill(-1);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (!p.active) continue;
      
      const cx = Math.floor(p.position.x / CELL_SIZE);
      const cy = Math.floor(p.position.y / CELL_SIZE);
      const cz = Math.floor(p.position.z / CELL_SIZE);
      
      const hash = (Math.abs(cx * 73856093 ^ cy * 19349663 ^ cz * 83492791)) % 2000;
      
      gridNext[i] = gridHead[hash];
      gridHead[hash] = i;
    }

    // Track FPS metrics
    fpsFrameCountRef.current++;
    fpsTimeElapsedRef.current += delta;

    // Throttle store updates to 0.3s for fluid performance with zero React rendering overhead
    const elapsed = state.clock.getElapsedTime();
    if (elapsed - lastMetricsUpdateRef.current > 0.3) {
      let activeCount = 0;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (particles[i].active) {
          activeCount++;
        }
      }
      const calculatedFps = Math.round(fpsFrameCountRef.current / fpsTimeElapsedRef.current);
      const finalFps = isNaN(calculatedFps) ? 60 : Math.min(120, Math.max(1, calculatedFps));
      
      useGameStore.getState().updatePerformanceMetrics(finalFps, activeCount);

      // Reset
      fpsFrameCountRef.current = 0;
      fpsTimeElapsedRef.current = 0;
      lastMetricsUpdateRef.current = elapsed;
    }

    const activeColor = myColor || getPresetColor(particlePreset, 0);

    // Spawn client particles when moving / dragging / clicking
    if (mousePosRef.current) {
      let spawnCount = 0;
      if (movingFramesRef.current > 0) {
        spawnCount += Math.floor(18 * flowSpeed);
        movingFramesRef.current--;
      }
      if (isPointerDownRef.current) {
        spawnCount += Math.floor(15 * flowSpeed);
      }

      if (spawnCount > 0) {
        for (let i = 0; i < spawnCount; i++) {
          spawnParticle(mousePosRef.current, activeColor);
        }
        particlesToReportRef.current += spawnCount;
      }
    }

    // Spawn other players' particles (Only as they show movement)
    Object.values(players).forEach(player => {
      if (player.position) {
        const playerColor = player.color || getPresetColor(particlePreset, 1);
        tempV1.set(player.position.x, player.position.y, player.position.z);
        let playerMoved = true;
        const lastPos = playerLastPosRef.current[player.id];
        if (lastPos) {
          if (tempV1.distanceTo(lastPos) < 0.001) {
            playerMoved = false;
          }
          lastPos.copy(tempV1);
        } else {
          playerLastPosRef.current[player.id] = new THREE.Vector3().copy(tempV1);
        }

        if (playerMoved) {
          const spawnCount = Math.floor(25 * flowSpeed);
          for (let i = 0; i < spawnCount; i++) {
            spawnParticle(tempV1, playerColor);
          }
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
        // Inactive particles are kept offspace or hidden with zero scale so they don't render out-of-the-blue
        dummy.position.set(9999, 9999, 9999);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // We remove particle death/fading. All particles are permanently active, enabling an infinite, persistent cosmic fluid flow!

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

      // --- HIGH_PERFORMANCE SPATIAL COLLISION SYSTEM ---
      // Evaluate particle-particle collisions using our active grid to handle bounces and overlaps
      const cx = Math.floor(p.position.x / CELL_SIZE);
      const cy = Math.floor(p.position.y / CELL_SIZE);
      const cz = Math.floor(p.position.z / CELL_SIZE);
      const hash = (Math.abs(cx * 73856093 ^ cy * 19349663 ^ cz * 83492791)) % 2000;

      let otherIdx = gridHead[hash];
      let collisionPowerCount = 0; // Cap limits checks on extremely dense regions to guarantee flawless 60fps

      while (otherIdx !== -1 && collisionPowerCount < 5) {
        if (otherIdx !== i) {
          const other = particles[otherIdx];
          if (other.active) {
            const dx = p.position.x - other.position.x;
            const dy = p.position.y - other.position.y;
            const dz = p.position.z - other.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const radiusSum = (p.size + other.size) * 1.35; 
            const minDistSq = radiusSum * radiusSum;

            if (distSq > 0.0001 && distSq < minDistSq) {
              collisionPowerCount++;
              const dist = Math.sqrt(distSq);
              const overlap = radiusSum - dist;

              // Collision normal vector
              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              // Elastic positional correction (separates overlaps)
              const correctionX = nx * overlap * 0.5;
              const correctionY = ny * overlap * 0.5;
              const correctionZ = nz * overlap * 0.5;

              p.position.x += correctionX;
              p.position.y += correctionY;
              p.position.z += correctionZ;

              other.position.x -= correctionX;
              other.position.y -= correctionY;
              other.position.z -= correctionZ;

              // Relative velocity bounce handling
              const rvx = p.velocity.x - other.velocity.x;
              const rvy = p.velocity.y - other.velocity.y;
              const rvz = p.velocity.z - other.velocity.z;

              const relativeSpeed = rvx * nx + rvy * ny + rvz * nz;
              if (relativeSpeed < 0) {
                const restitution = 0.85; // crisp rebound coefficient
                const impulse = -(1.0 + restitution) * relativeSpeed * 0.5;

                p.velocity.x += nx * impulse;
                p.velocity.y += ny * impulse;
                p.velocity.z += nz * impulse;

                other.velocity.x -= nx * impulse;
                other.velocity.y -= ny * impulse;
                other.velocity.z -= nz * impulse;
              }
            }
          }
        }
        otherIdx = gridNext[otherIdx];
      }

      // Aesthetic color shifts (glow and fade) relative to remaining lifetime
      const lifeRatio = p.life / PARTICLE_LIFETIME;
      p.color.copy(p.baseColor);
      
      // High-fidelity dynamic preset transitions with full color blending support
      if (particleShape === 'majestic_dust' || particleShape === 'dust') {
        // High density cosmic gold dust shine blending with custom palette scaled by bloom intensity
        const shineFactor = (0.2 + 0.15 * Math.sin(time * 3.5 + i)) * (bloomIntensity / 1.5);
        p.color.addScalar(shineFactor);
      } else if (particleShape === 'glowing_star' || particleShape === 'star') {
        // Vibrant hot star sparkles scaled by bloom intensity
        const twinkle = Math.abs(Math.sin(time * 6.5 + i));
        if (twinkle > 0.85) {
          p.color.addScalar(0.3 * (bloomIntensity / 1.5)); // High-voltage star sparkle
        }
      } else if (particleShape === 'nebula_bloom' || particleShape === 'ring') {
        // Rich dynamic chromatic offset of nebulas
        const offsetColor = new THREE.Color(p.baseColor).offsetHSL(0.12 * Math.cos(time + i * 0.05), 0, 0);
        p.color.copy(offsetColor);
      } else if (particleShape === 'fractal_spore' || particleShape === 'crystal') {
        // Quantum spores chromatic inverter
        const spFreq = Math.sin(time * 4.0 + i * 0.4);
        if (spFreq > 0.72) {
          p.color.setRGB(1.0 - p.color.r, 1.0 - p.color.g, 1.0 - p.color.b);
        }
      }

      // Update actual Matrix Coordinates
      dummy.position.copy(p.position);
      
      // Let particles retain their brilliant shapes/colors completely without stretching into pencil-like lines
      const speed = p.velocity.length();
      const finalLifeScale = 1.0;
      
      let widthScale = p.size * finalLifeScale;
      let heightScale = widthScale;
      let depthScale = widthScale;

      // High fidelity physical scale transformations per-preset
      if (particleShape === 'glowing_star' || particleShape === 'star') {
        const starPulse = 1.0 + 0.35 * Math.sin(time * 8.0 + i * 1.5);
        widthScale *= starPulse;
        heightScale *= starPulse;
        depthScale *= starPulse;
      } else if (particleShape === 'nebula_bloom' || particleShape === 'ring') {
        const bloomScale = 1.0 + 0.25 * Math.cos(time * 2.5 + i * 0.2);
        widthScale *= bloomScale;
        heightScale *= bloomScale;
        depthScale *= bloomScale;
      } else if (particleShape === 'fractal_spore' || particleShape === 'crystal') {
        const sporeJitter = 1.0 + 0.15 * (Math.sin(time * 12.0 + i) > 0 ? 1 : -1);
        widthScale *= sporeJitter;
        heightScale *= sporeJitter;
        depthScale *= sporeJitter;
      }
      
      dummy.scale.set(widthScale, heightScale, depthScale);

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

  // Render highly optimized instanced mesh with dynamic geometry based on selected particle shape
  return (
    <instancedMesh key={particleShape} ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      {(particleShape === 'glowing_star' || particleShape === 'star') && <octahedronGeometry args={[1, 0]} />}
      {(particleShape === 'nebula_bloom' || particleShape === 'ring') && <torusGeometry args={[0.8, 0.22, 6, 12]} />}
      {(particleShape === 'fractal_spore' || particleShape === 'crystal') && <tetrahedronGeometry args={[1, 0]} />}
      {(particleShape === 'majestic_dust' || particleShape === 'dust') && <sphereGeometry args={[1, 6, 6]} />}
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
