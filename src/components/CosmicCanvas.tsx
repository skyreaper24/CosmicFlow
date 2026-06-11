/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { Particles } from './Particles';
import { ForceFields } from './ForceFields';
import { OtherPlayers, LocalCursor } from './OtherPlayers';
import { SolarSystem } from './SolarSystem';

function SceneInteraction({ mousePosRef }: { mousePosRef: React.MutableRefObject<THREE.Vector3 | null> }) {
  const sendCursor = useGameStore((state) => state.sendCursor);
  const addForce = useGameStore((state) => state.addForce);
  const { camera, gl } = useThree();

  useEffect(() => {
    const plane = new THREE.Plane();
    const camDir = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const updateMousePos = (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      // Update plane to face the camera and pass through origin (0, 0, 0)
      camera.getWorldDirection(camDir);
      plane.setFromNormalAndCoplanarPoint(camDir.negate(), new THREE.Vector3(0, 0, 0));
      
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      mousePosRef.current = target;
      return target;
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Prevent interactions inside overlay panels of the floating menus
      const target = e.target as HTMLElement;
      if (target && (target.closest('.interactive-overlay') || target.closest('button') || target.closest('input'))) {
        return;
      }
      const pos = updateMousePos(e.clientX, e.clientY);
      sendCursor({ x: pos.x, y: pos.y, z: pos.z });
    };

    const triggerCanvasVibrateFeedback = (toolId: string) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        let pattern = [20, 30, 20];
        switch (toolId) {
          case 'attractor':
            pattern = [40, 30, 40];
            break;
          case 'repulsor':
            pattern = [90, 40, 90];
            break;
          case 'vortex':
            pattern = [30, 35, 30, 35, 40];
            break;
          case 'chaos':
            pattern = [20, 25, 20, 30, 20];
            break;
          case 'wind':
            pattern = [30, 90, 30];
            break;
          case 'strobe':
            pattern = [50, 35, 50, 35];
            break;
          case 'singularity':
            pattern = [100, 50, 250];
            break;
          case 'gravity_well':
            pattern = [50, 35, 50];
            break;
          case 'prism':
            pattern = [25, 15, 25, 15, 25];
            break;
          case 'magnet':
            pattern = [120, 40, 120];
            break;
        }
        try {
          navigator.vibrate(pattern);
        } catch {
          // Suppress sandboxed window errors
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      window.focus();
      // Ignore click if clicking on HUD / interactive buttons
      const target = e.target as HTMLElement;
      if (target && (target.closest('.interactive-overlay') || target.closest('button') || target.closest('input'))) {
        return;
      }
      
      if (e.button === 0 || e.pointerType === 'touch') {
        const pos = updateMousePos(e.clientX, e.clientY);
        // Deploy currently selected tool from state
        const currentTool = useGameStore.getState().selectedTool;
        addForce({ x: pos.x, y: pos.y, z: pos.z }, currentTool);
        triggerCanvasVibrateFeedback(currentTool);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar always deploys an optional quick escape 'repulsor' or 'singularity'
      if (e.code === 'Space') {
        if (mousePosRef.current) {
          const target = document.activeElement;
          // Avoid triggering when user typing in chat input
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return;
          }
          addForce({ x: mousePosRef.current.x, y: mousePosRef.current.y, z: mousePosRef.current.z }, 'repulsor');
          triggerCanvasVibrateFeedback('repulsor');
          e.preventDefault();
        }
      }
    };

    const handleContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [camera, gl, addForce, sendCursor, mousePosRef]);

  return null;
}

function RotatingStars() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.015;
      groupRef.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={3500} factor={3} saturation={0.5} fade speed={0.8} />
    </group>
  );
}

export function CosmicCanvas() {
  const mousePosRef = useRef<THREE.Vector3 | null>(null);
  const bloomIntensity = useGameStore((state) => state.bloomIntensity || 1.8);

  return (
    <div className="w-full h-full absolute inset-0 bg-[#020208]">
      <Canvas camera={{ position: [3, 4, 18], fov: 60 }}>
        <color attach="background" args={['#02020a']} />
        
        <ambientLight intensity={0.25} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#4338ca" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#06b6d4" />
        
        <RotatingStars />
        
        <SolarSystem />
        <Particles mousePosRef={mousePosRef} />
        <ForceFields />
        <OtherPlayers />
        <LocalCursor mousePosRef={mousePosRef} />
        
        <SceneInteraction mousePosRef={mousePosRef} />
        
        <OrbitControls 
          makeDefault
          enableDamping 
          dampingFactor={0.06}
          minDistance={6}
          maxDistance={38}
        />
        
        <EffectComposer>
          <Bloom 
            luminanceThreshold={Math.max(0.0, 0.45 - (bloomIntensity / 4.0) * 0.4)} 
            mipmapBlur 
            intensity={bloomIntensity} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
