/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { CELESTIAL_BODIES, getCelestialPosition, CelestialBody } from '../utils/celestialPhysics';

// High resolution procedural texture generator modeling real satellite imagery specifications
function generateCelestialTexture(id: string, color: string): THREE.Texture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    const fallback = new THREE.Texture();
    return fallback;
  }

  // Draw procedural pattern inside the 2D canvas context based on the element mapping:
  if (id === 'sun') {
    // Glowing convective granules & magnetic solar flares
    const grade = ctx.createLinearGradient(0, 0, width, 0);
    grade.addColorStop(0, '#ff3700');
    grade.addColorStop(0.2, '#ffaa00');
    grade.addColorStop(0.5, '#ffe53b');
    grade.addColorStop(0.8, '#ff9900');
    grade.addColorStop(1, '#ff3700');
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, width, height);

    // Draw turbulent convective cells (sunspots and flares)
    ctx.fillStyle = 'rgba(255, 235, 120, 0.35)';
    for (let i = 0; i < 350; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const radius = 2 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // High thermal prominence storms
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 20 + Math.random() * 35, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'mercury') {
    // Solid silvery lunar-like basalt fields & crater rays
    ctx.fillStyle = '#52525b'; // Dark basalt grey
    ctx.fillRect(0, 0, width, height);

    // Dark volcanic plains (basalt basins)
    ctx.fillStyle = '#27272a';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 25 + Math.random() * 35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thousands of white meteor impact craters with ray lines
    ctx.fillStyle = 'rgba(228, 228, 231, 0.5)';
    ctx.strokeStyle = 'rgba(244, 244, 245, 0.12)';
    for (let i = 0; i < 150; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const r = 1 + Math.random() * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Ray lines radiating from major impacts
      if (Math.random() > 0.85) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (Math.random() - 0.5) * 50, cy + (Math.random() - 0.5) * 50);
        ctx.stroke();
      }
    }
  } else if (id === 'venus') {
    // Thick carbon-dioxide golden cloud layers & volcanic rivers
    ctx.fillStyle = '#78350f'; // Dark volcanic rock
    ctx.fillRect(0, 0, width, height);

    // Glowing basaltic magma fissures (hot rivers)
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      let cx = Math.random() * width;
      let cy = Math.random() * height;
      ctx.moveTo(cx, cy);
      for (let steps = 0; steps < 6; steps++) {
        cx += (Math.random() - 0.5) * 70;
        cy += (Math.random() - 0.5) * 20;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Swirling yellow-orange sulfuric acid cloud blankets on top
    const cloudGradient = ctx.createLinearGradient(0, 0, 0, height);
    cloudGradient.addColorStop(0, 'rgba(254, 240, 138, 0.82)');
    cloudGradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.65)');
    cloudGradient.addColorStop(1, 'rgba(180, 83, 9, 0.85)');
    ctx.fillStyle = cloudGradient;
    
    // Smooth atmospheric bands
    for (let i = 0; i < 16; i++) {
      ctx.fillRect(0, i * (height / 16), width, (height / 16) * Math.random());
    }
  } else if (id === 'earth') {
    // Beautiful photographic satellite view: Oceans, Continents, Ice Caps, Clouds
    // Blue Deep Ocean Base
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, width, height);

    // Draw rich green/brown geographic continents (wrapped around the sphere)
    ctx.fillStyle = '#166534'; // Forest green vegetation
    
    // Draw stylized continental bounds
    const continents = [
      { x: 100, y: 110, rx: 70, ry: 40 },
      { x: 140, y: 140, rx: 50, ry: 45 },
      { x: 280, y: 100, rx: 80, ry: 45 },
      { x: 330, y: 130, rx: 60, ry: 35 },
      { x: 420, y: 110, rx: 35, ry: 25 },
      { x: 60, y: 80, rx: 40, ry: 30 }
    ];
    continents.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, Math.PI / 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Brown desert rocky mountain centers
    ctx.fillStyle = '#78350f';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(80 + Math.random() * (width - 160), 60 + Math.random() * (height - 120), 12 + Math.random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snowy Northern and Southern polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, 30); // North Icy Pole
    ctx.fillRect(0, height - 26, width, 26); // South Icy Pole

    // Real atmospheric white weather cloud spirals on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    for (let i = 0; i < 14; i++) {
      const cx = Math.random() * width;
      const cy = 35 + Math.random() * (height - 70);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 40 + Math.random() * 40, 8 + Math.random() * 12, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'moon') {
    // Highly detailed photographic Moon craters & volcanic Maria
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, 0, width, height);

    // Dark volcanic Maria basins
    ctx.fillStyle = '#1e293b';
    const maria = [
      { x: 90, y: 90, rx: 40, ry: 25 },
      { x: 220, y: 130, rx: 55, ry: 30 },
      { x: 370, y: 100, rx: 45, ry: 22 },
      { x: 410, y: 150, rx: 30, ry: 18 }
    ];
    maria.forEach(m => {
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.rx, m.ry, Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pure white impact rays and meteor craters
    ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
    for (let i = 0; i < 110; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1.2 + Math.random() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'mars') {
    // Rust-orange iron oxide desert with Syrtis Major volcanic basalt plains & snowy polar caps
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 0, width, height);

    // Dark grey volcanic iron-ore regions (Syrtis Major satellite maps)
    ctx.fillStyle = '#1e293b';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(80 + i * 100, 110 + Math.random() * 25, 35 + Math.random() * 25, 18 + Math.random() * 20, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snowy white carbon dioxide polar ice caps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, 16); // North Polar Hood
    ctx.fillRect(0, height - 12, width, 12); // South Icy Cap
  } else if (id === 'jupiter') {
    // Gaseous beige, cream, dark orange and red-brown bands with the Great Red Spot
    const bands = [
      { color: '#451a03', h: 20 },
      { color: '#7c2d12', h: 18 },
      { color: '#9a3412', h: 25 },
      { color: '#fef3c7', h: 35 }, // Bright cream belt
      { color: '#d97706', h: 20 },
      { color: '#9a3412', h: 22 },
      { color: '#fef3c7', h: 30 }, // Second cream belt
      { color: '#7c2d12', h: 26 },
      { color: '#451a03', h: 28 },
      { color: '#1c1917', h: 32 }
    ];
    let currentY = 0;
    bands.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(0, currentY, width, b.h);
      currentY += b.h;
    });

    // Slit ripples modeling high-speed storms
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    for (let r = 0; r < 10; r++) {
      ctx.beginPath();
      const waveY = 20 + Math.random() * (height - 40);
      ctx.moveTo(0, waveY);
      for (let cx = 0; cx <= width; cx += 20) {
        ctx.lineTo(cx, waveY + Math.sin(cx * 0.05) * 5);
      }
      ctx.stroke();
    }

    // DRAW THE GREAT RED SPOT STORM (Scarlet red hurricane centered in the southern belt)
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(310, 168, 32, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // High turbulence white-orange dynamic outer haze halo
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(310, 168, 40, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'saturn') {
    // Delicate, cream-gold gas giant atmospheric layering
    const bands = [
      { color: '#78350f', h: 25 },
      { color: '#b45309', h: 35 },
      { color: '#d97706', h: 30 },
      { color: '#fef3c7', h: 70 }, // Wide cream-ochre tropical belt
      { color: '#d97706', h: 35 },
      { color: '#b45309', h: 30 },
      { color: '#78350f', h: 31 }
    ];
    let currentY = 0;
    bands.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(0, currentY, width, b.h);
      currentY += b.h;
    });

    // Horizontal weather bands
    ctx.fillStyle = 'rgba(254, 243, 199, 0.22)';
    ctx.fillRect(0, 100, width, 16);
  } else if (id === 'uranus') {
    // Pastel cyan-blue methane ice giant gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#155e75'); // Dark Teal
    grad.addColorStop(0.5, '#22d3ee'); // Soft Pale Cyan
    grad.addColorStop(1, '#155e75');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Silvery high altitude gas sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 115, width, 26);
  } else if (id === 'neptune') {
    // Royal cosmic blue methane, high-altitude white clouds and the Great Dark Spot
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1e3a8a'); // Royal Navy Base
    grad.addColorStop(0.5, '#2563eb'); // Deep Methane Blue
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // The Great Dark Spot (deep blue-black cyclonic storm)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(190, 105, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // High altitude white methane ice cirrus streaks
    ctx.strokeStyle = 'rgba(239, 246, 255, 0.4)';
    ctx.lineWidth = 1.2;
    for (let c = 0; c < 3; c++) {
      ctx.beginPath();
      const cy = 50 + c * 50;
      ctx.moveTo(0, cy);
      ctx.quadraticCurveTo(width / 2, cy - 15, width, cy);
      ctx.stroke();
    }
  } else {
    // Fallback block
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Spiral galaxy star system matching majestic Milky Way specs
function MilkyWay() {
  const pointsRef = useRef<THREE.Points>(null);

  const starCount = 6000;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    const cols = new Float32Array(starCount * 3);

    const tempColor = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      // Create spiral arm patterns using stellar distribution equations
      const armIndex = i % 2; // Two main spiral arms
      const armAngle = (armIndex * Math.PI);
      
      // Density highly concentrated at the central stellar bulge
      const progress = Math.pow(Math.random(), 2.2);
      const radius = progress * 48.0 + 1.5; 
      
      // Tightness of orbital spiral arms
      const spiralTightness = 4.2;
      const angle = radius * spiralTightness + armAngle + (Math.random() - 0.5) * 0.85;

      // 3D coordinates matching galactic plane thickness
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Stars at the center bulge are thick vertically, while trailing arms are thin
      const bulgeHeight = 4.2 * Math.exp(-radius / 8.0);
      const y = (Math.random() - 0.5) * bulgeHeight;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Galactic star temperature variations (Gold cores, bright blue/purples arms)
      if (radius < 8.0) {
        // High density golden bulge
        tempColor.setHSL(0.08 + Math.random() * 0.05, 0.95, 0.65 + Math.random() * 0.2);
      } else if (radius < 26.0) {
        // Cyan & Purple star formation lanes
        const hue = Math.random() > 0.5 ? 0.52 + Math.random() * 0.05 : 0.76 + Math.random() * 0.06;
        tempColor.setHSL(hue, 1.0, 0.7 + Math.random() * 0.2);
      } else {
        // Pearly silvery starlight outline
        tempColor.setRGB(0.9, 0.95, 1.0);
      }

      cols[i * 3] = tempColor.r;
      cols[i * 3 + 1] = tempColor.g;
      cols[i * 3 + 2] = tempColor.b;
    }

    return { positions: pos, colors: cols };
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      // Rotation representing orbital motion of the galaxy
      pointsRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          args={[positions, 3]} 
        />
        <bufferAttribute 
          attach="attributes-color" 
          args={[colors, 3]} 
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors 
        transparent 
        opacity={0.36} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Visual rings representing orbital path trajectories
function OrbitPaths() {
  const showOrbits = useGameStore((state) => state.showCelestialOrbits);
  if (!showOrbits) return null;

  return (
    <group>
      {CELESTIAL_BODIES.filter(b => b.id !== 'sun' && !b.parent).map((body) => {
        // Render detailed orbit line loop matching inclined orbital planes
        const points = [];
        const steps = 120;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const x = body.semiMajorAxis * Math.cos(theta);
          const z = body.semiMajorAxis * Math.sin(theta);
          const y = body.semiMajorAxis * Math.sin(theta) * Math.sin(body.inclination);
          points.push(new THREE.Vector3(x, y, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <lineLoop key={`orbit-${body.id}`} geometry={geometry}>
            <lineBasicMaterial color={body.color} opacity={0.15} transparent />
          </lineLoop>
        );
      })}
    </group>
  );
}

// Single celestial body renderer with advanced materials and rings
interface PlanetRefProps {
  body: CelestialBody;
}

const PlanetMesh = React.memo(({ body }: PlanetRefProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const planetBodyRef = useRef<THREE.Mesh>(null);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  
  // Memoize photographic canvas texture once to avoid garbage collection memory leaks
  const photographicTexture = useMemo(() => {
    return generateCelestialTexture(body.id, body.color);
  }, [body.id, body.color]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      getCelestialPosition(body, time, tempPos);
      meshRef.current.position.copy(tempPos);
    }
    
    // Rotate of body on own axis relative to day length
    if (planetBodyRef.current) {
      const rotSpeed = body.id === 'sun' ? 0.12 : body.id === 'jupiter' ? 1.4 : 0.65;
      planetBodyRef.current.rotation.y += delta * rotSpeed;
    }
  });

  return (
    <group ref={meshRef}>
      {body.id === 'sun' ? (
        // The Sun: Brightly glowing convective photographic core
        <group>
          <mesh ref={planetBodyRef}>
            <sphereGeometry args={[body.radius, 32, 32]} />
            <meshBasicMaterial map={photographicTexture} />
          </mesh>
          {/* Dynamic solar flare atmosphere glow overlay */}
          <mesh scale={[1.22, 1.22, 1.22]}>
            <sphereGeometry args={[body.radius, 24, 24]} />
            <meshBasicMaterial 
              color="#ea580c" 
              transparent 
              opacity={0.22} 
              blending={THREE.AdditiveBlending} 
              side={THREE.BackSide} 
            />
          </mesh>
          <pointLight intensity={3.0} distance={42} color="#fef08a" />
        </group>
      ) : (
        // Highly-detailed material representations matching satellite specs
        <group>
          <mesh ref={planetBodyRef}>
            <sphereGeometry args={[body.radius, 32, 32]} />
            {body.id === 'earth' ? (
              // Earth ocean and terrain glossy finish
              <meshStandardMaterial 
                map={photographicTexture}
                roughness={0.25}
                metalness={0.08}
                emissive="#1e3a8a"
                emissiveIntensity={0.12}
              />
            ) : body.id === 'jupiter' || body.id === 'saturn' ? (
              // Gaseous sheen
              <meshStandardMaterial 
                map={photographicTexture}
                roughness={0.8}
                metalness={0.0}
              />
            ) : (
              // Rocky outer planets with realistic craters and crust
              <meshStandardMaterial 
                map={photographicTexture}
                roughness={0.75}
                metalness={0.15}
              />
            )}
          </mesh>

          {/* Saturn concentric beautifully textured rings mimicking real-world Cassini metrics */}
          {body.id === 'saturn' && (
            <mesh rotation={[Math.PI / 2.3, 0, 0]}>
              <ringGeometry args={[0.82, 1.75, 64]} />
              <meshStandardMaterial 
                color="#fef08a" 
                side={THREE.DoubleSide} 
                transparent 
                opacity={0.62} 
                roughness={0.9}
              />
            </mesh>
          )}

          {/* Uranus delicate vertical blue ring */}
          {body.id === 'uranus' && (
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <torusGeometry args={[0.78, 0.012, 4, 64]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
            </mesh>
          )}

          {/* Elegant Billboard style Screen Space Pinned Marker HTML for every body (leaving Sun) */}
          <Html distanceFactor={15} position={[0, body.radius * 1.8, 0]} center>
            <div className="flex flex-col items-center select-none pointer-events-none">
              {/* Reticle connector dashed vertical pointer stem */}
              <div className="w-[1px] h-3.5 bg-cyan-400/50" />
              
              {/* High precision holographic floating tag displaying relative stats */}
              <div className="px-2 py-0.5 rounded-md bg-slate-950/90 border border-cyan-500/40 text-[7.5px] font-mono text-cyan-200 uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                <span>{body.name}</span>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
});

export function SolarSystem() {
  const trackedPlanetId = useGameStore((state) => state.trackedPlanetId);
  const tempTrackPos = useMemo(() => new THREE.Vector3(), []);
  
  useFrame((state) => {
    // Elegant frame focus track matching R3F standard loops
    if (trackedPlanetId) {
      const activeBody = CELESTIAL_BODIES.find(b => b.id === trackedPlanetId);
      if (activeBody) {
        const time = state.clock.getElapsedTime();
        getCelestialPosition(activeBody, time, tempTrackPos);
        
        if (state.controls) {
          const ctrl = state.controls as any;
          ctrl.target.lerp(tempTrackPos, 0.07);
          ctrl.update();
        }
      }
    } else {
      // If tracking defaults to Sun or none, lerp target slowly back to center (0, 0, 0)
      if (state.controls) {
        const ctrl = state.controls as any;
        tempTrackPos.set(0, 0, 0);
        if (ctrl.target.distanceTo(tempTrackPos) > 0.02) {
          ctrl.target.lerp(tempTrackPos, 0.05);
          ctrl.update();
        }
      }
    }
  });

  return (
    <group>
      {/* 1. Milky Way spiral galaxy background */}
      <MilkyWay />

      {/* 2. Visual Orbit lines guiding viewers */}
      <OrbitPaths />

      {/* 3. Physical body meshes dynamically computed in space */}
      {CELESTIAL_BODIES.map((body) => (
        <PlanetMesh key={`body-${body.id}`} body={body} />
      ))}
    </group>
  );
}
