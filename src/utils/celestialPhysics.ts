/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface CelestialBody {
  id: string;
  name: string;
  radius: number;
  semiMajorAxis: number;
  orbitalSpeed: number; // orbital angular speed in rads/sec
  inclination: number; // tilt of the orbital plane relative to core
  phaseOffset: number; // orbital starting angle offset
  color: string;
  mass: number; // multiplier for stardust gravity pull
  parent?: string; // used for moons (e.g. Earth)
  
  // Real-world physical metrics
  realGravity: number; // surface gravity in m/s^2
  massRelToEarth: number; // actual planetary relative mass to Earth (Earth = 1)
  influenceRadius: number; // sphere of gravitational influence in simulator units
  diameterKM: number; // real diameter in kilometers
  realDistanceAU: number; // semi-major axis in AU
}

// Full solar system data scaled for beautiful visual fit within the sandbox coordinates bounds
export const CELESTIAL_BODIES: CelestialBody[] = [
  {
    id: 'sun',
    name: 'Sun',
    radius: 1.8,
    semiMajorAxis: 0,
    orbitalSpeed: 0,
    inclination: 0,
    phaseOffset: 0,
    color: '#ffbb00',
    mass: 14.0,
    realGravity: 274.0,
    massRelToEarth: 333000,
    influenceRadius: 18.0, // Large, but not infinite: won't pull particles from the boundary edge
    diameterKM: 1392700,
    realDistanceAU: 0,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    radius: 0.16,
    semiMajorAxis: 3.2,
    orbitalSpeed: 0.85,
    inclination: 0.12,
    phaseOffset: 0.5,
    color: '#a1a1aa',
    mass: 0.8,
    realGravity: 3.7,
    massRelToEarth: 0.055,
    influenceRadius: 1.2,
    diameterKM: 4879,
    realDistanceAU: 0.39,
  },
  {
    id: 'venus',
    name: 'Venus',
    radius: 0.28,
    semiMajorAxis: 4.8,
    orbitalSpeed: 0.60,
    inclination: -0.05,
    phaseOffset: 1.2,
    color: '#f59e0b',
    mass: 1.8,
    realGravity: 8.87,
    massRelToEarth: 0.815,
    influenceRadius: 1.8,
    diameterKM: 12104,
    realDistanceAU: 0.72,
  },
  {
    id: 'earth',
    name: 'Earth',
    radius: 0.32,
    semiMajorAxis: 6.8,
    orbitalSpeed: 0.44,
    inclination: 0,
    phaseOffset: 2.1,
    color: '#2563eb',
    mass: 2.2,
    realGravity: 9.81,
    massRelToEarth: 1.0,
    influenceRadius: 2.2,
    diameterKM: 12742,
    realDistanceAU: 1.0,
  },
  {
    id: 'moon',
    name: 'Moon',
    radius: 0.08,
    semiMajorAxis: 0.72, // distance from Earth
    orbitalSpeed: 2.50, // orbits Earth rapidly
    inclination: 0.30,
    phaseOffset: 0.2,
    color: '#94a3b8',
    mass: 0.4,
    realGravity: 1.62,
    massRelToEarth: 0.0123,
    influenceRadius: 0.6,
    parent: 'earth', // orbits Earth
    diameterKM: 3474,
    realDistanceAU: 0.00257,
  },
  {
    id: 'mars',
    name: 'Mars',
    radius: 0.22,
    semiMajorAxis: 8.8,
    orbitalSpeed: 0.32,
    inclination: 0.04,
    phaseOffset: 3.5,
    color: '#dc2626',
    mass: 1.1,
    realGravity: 3.71,
    massRelToEarth: 0.107,
    influenceRadius: 1.5,
    diameterKM: 6779,
    realDistanceAU: 1.52,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    radius: 0.75,
    semiMajorAxis: 11.5,
    orbitalSpeed: 0.20,
    inclination: 0.02,
    phaseOffset: 4.2,
    color: '#eab308',
    mass: 5.8,
    realGravity: 24.79,
    massRelToEarth: 317.8,
    influenceRadius: 4.5,
    diameterKM: 139820,
    realDistanceAU: 5.20,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    radius: 0.60,
    semiMajorAxis: 14.8,
    orbitalSpeed: 0.14,
    inclination: 0.06,
    phaseOffset: 1.8,
    color: '#d97706',
    mass: 4.5,
    realGravity: 10.44,
    massRelToEarth: 95.2,
    influenceRadius: 3.8,
    diameterKM: 116460,
    realDistanceAU: 9.58,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    radius: 0.44,
    semiMajorAxis: 18.2,
    orbitalSpeed: 0.09,
    inclination: -0.02,
    phaseOffset: 5.6,
    color: '#06b6d4',
    mass: 3.0,
    realGravity: 8.69,
    massRelToEarth: 14.5,
    influenceRadius: 2.8,
    diameterKM: 50724,
    realDistanceAU: 19.20,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    radius: 0.42,
    semiMajorAxis: 21.5,
    orbitalSpeed: 0.06,
    inclination: 0.03,
    phaseOffset: 0.9,
    color: '#3b82f6',
    mass: 3.2,
    realGravity: 11.15,
    massRelToEarth: 17.1,
    influenceRadius: 2.8,
    diameterKM: 49244,
    realDistanceAU: 30.05,
  },
];

// Helper variables to prevent allocating memory inside high frequency loops
const _parentPos = new THREE.Vector3();

/**
 * Deterministically computes the 3D position of a celestial body at any given time.
 */
export function getCelestialPosition(body: CelestialBody, time: number, outPosition: THREE.Vector3) {
  if (body.id === 'sun') {
    outPosition.set(0, 0, 0);
    return;
  }

  const angle = time * body.orbitalSpeed + body.phaseOffset;
  const x = body.semiMajorAxis * Math.cos(angle);
  const z = body.semiMajorAxis * Math.sin(angle);
  const y = body.semiMajorAxis * Math.sin(angle) * Math.sin(body.inclination);

  if (body.parent) {
    const parentBody = CELESTIAL_BODIES.find(b => b.id === body.parent);
    if (parentBody) {
      getCelestialPosition(parentBody, time, _parentPos);
      outPosition.set(x, y, z).add(_parentPos);
      return;
    }
  }

  outPosition.set(x, y, z);
}
