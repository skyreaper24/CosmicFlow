/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { synth } from '../utils/audioSynth';

export type Vector3 = { x: number; y: number; z: number };

export interface Player {
  id: string;
  color: string;
  position: Vector3 | null;
  name?: string;
  score?: number;
}

export interface Gem {
  id: string;
  position: Vector3;
  color: string;
  scoreValue: number;
}

export interface ForceField {
  id: string;
  position: Vector3;
  type: string; // 'attractor' | 'repulsor' | 'vortex' | 'chaos' | 'wind' | 'strobe' | 'singularity'
  ownerId: string;
  createdAt: number;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  metric: string;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface OracleMessage {
  id: string;
  sender: 'player' | 'oracle';
  text: string;
  timestamp: string;
}

interface GameState {
  myId: string | null;
  myColor: string | null;
  myName: string;
  myScore: number;
  players: Record<string, Player>;
  forceFields: Record<string, ForceField>;
  gems: Gem[];
  ws: WebSocket | null;
  
  // Custom interactive mechanics
  selectedTool: string;
  setTool: (tool: string) => void;
  
  // Audio configuration
  soundEnabled: boolean;
  soundVolume: number;
  toggleSound: () => void;
  setVolume: (vol: number) => void;
  
  // Progression & Stats
  level: number;
  xp: number;
  xpNeeded: number;
  totalParticlesCreated: number;
  totalForceFieldsPlaced: number;
  achievements: Achievement[];
  recentUnlock: string | null;
  fps: number;
  activeParticleCount: number;
  updatePerformanceMetrics: (fps: number, count: number) => void;
  
  // Oracle assistant log
  oracleMessages: OracleMessage[];
  oracleLoading: boolean;
  askOracle: (query: string) => Promise<void>;
  clearOracle: () => void;

  // Celestial Solar System Settings
  celestialGravityEnabled: boolean;
  celestialGravityIntensity: number;
  showCelestialOrbits: boolean;
  trackedPlanetId: string | null;
  toggleCelestialGravity: () => void;
  setCelestialGravityIntensity: (intensity: number) => void;
  toggleCelestialOrbits: () => void;
  setTrackedPlanetId: (id: string | null) => void;

  // Web GL customization overrides
  flowSpeed: number;
  particlePreset: string;
  particleShape: string;
  bloomIntensity: number;
  setFlowSpeed: (speed: number) => void;
  setParticlePreset: (preset: string) => void;
  setParticleShape: (shape: string) => void;
  setBloomIntensity: (intensity: number) => void;
  setCustomColor: (color: string) => void;
  updateProfile: (name: string, color: string) => void;
  collectGem: (gemId: string) => void;

  // Actions
  connect: () => void;
  disconnect: () => void;
  sendCursor: (position: Vector3) => void;
  addForce: (position: Vector3, type: string) => void;
  addLocalXp: (amount: number) => void;
  incrementParticleCount: (amount: number) => void;
}

// Initial achievements list
const initialAchievements: Achievement[] = [
  { id: 'attractor_fanatic', title: 'Cosmic Magnet', description: 'Place 15 Gravity Attractors to capture orbital particles.', metric: 'attractors', target: 15, unlocked: false },
  { id: 'repulsor_shock', title: 'Solar Flare', description: 'Trigger 15 Solar repulsors to push back dark storm clouds.', metric: 'repulsors', target: 15, unlocked: false },
  { id: 'vortex_spinner', title: 'Event Horizon', description: 'Unleash 10 swirling Cosmic Vortices.', metric: 'vortex', target: 10, unlocked: false },
  { id: 'strobe_lights', title: 'Supernova Burst', description: 'Trigger 10 high-intensity energetic Strobe pulses.', metric: 'strobe', target: 10, unlocked: false },
  { id: 'deep_oracle', title: 'Cosmic Prophet', description: 'Commune with the server-side Gemini Cosmic Oracle.', metric: 'oracle_queries', target: 1, unlocked: false },
  { id: 'xp_millionaire', title: 'Grand Star-Lord', description: 'Reach Progression Experience Level 5.', metric: 'level', target: 5, unlocked: false },
  { id: 'particle_breeder', title: 'Galaxy Constructor', description: 'Spawn over 50,000 stardust particles.', metric: 'particles', target: 50000, unlocked: false }
];

// Helper to play high-fidelity haptic feedback patterns
export function triggerHapticFeedback(type: string) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    let pattern: number[];
    switch (type) {
      case 'attractor':
        pattern = [40, 35, 40]; // Soft pleasant gravitational pull
        break;
      case 'repulsor':
        pattern = [120]; // Impactful kinetic burst
        break;
      case 'vortex':
        pattern = [30, 40, 30, 40, 50]; // Whipping whirlwind sweep
        break;
      case 'chaos':
        pattern = [15, 25, 20, 35, 15, 45, 15]; // Erratic dynamic jitter
        break;
      case 'wind':
        pattern = [25, 120, 25]; // Smooth gust expansion
        break;
      case 'strobe':
        pattern = [60, 40, 60, 40, 60]; // Rhythmic flashing pulses
        break;
      case 'singularity':
        pattern = [95, 60, 320]; // Heavy collapse and explosion drop
        break;
      case 'gravity_well':
        pattern = [50, 40, 50, 40]; // Orbit resonance feedback
        break;
      case 'prism':
        pattern = [30, 20, 30, 20, 30, 20]; // High speed light ripple
        break;
      case 'magnet':
        pattern = [150, 50, 150]; // Magnet pull slide recoil
        break;
      case 'achievement':
        pattern = [80, 50, 80, 50, 160]; // Sparkling celebratory cascade
        break;
      case 'level_up':
        pattern = [120, 60, 220, 60, 320]; // Rising triumphant haptic fan-fare
        break;
      default:
        pattern = [50];
    }
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Catch potential sandbox / permission security issues
    }
  }
}

export const useGameStore = create<GameState>((set, get) => {
  // Load local state securely
  let savedLevel = 1;
  let savedXp = 0;
  let savedParticles = 0;
  let savedFields = 0;
  let savedAchievements = [...initialAchievements];
  let savedColor: string | null = null;
  let savedName = '';

  try {
    savedColor = localStorage.getItem('cosmic_my_color');
    savedName = localStorage.getItem('cosmic_my_name') || '';
    const localLevel = localStorage.getItem('cosmic_level');
    if (localLevel) savedLevel = parseInt(localLevel, 10);
    const localXp = localStorage.getItem('cosmic_xp');
    if (localXp) savedXp = parseInt(localXp, 10);
    const localParticles = localStorage.getItem('cosmic_particles');
    if (localParticles) savedParticles = parseInt(localParticles, 10);
    const localFields = localStorage.getItem('cosmic_fields');
    if (localFields) savedFields = parseInt(localFields, 10);
    const localAch = localStorage.getItem('cosmic_achievements');
    if (localAch) {
      const parsed = JSON.parse(localAch);
      savedAchievements = initialAchievements.map(initAch => {
        const found = parsed.find((p: any) => p.id === initAch.id);
        return found ? { ...initAch, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : initAch;
      });
    }
  } catch (e) {
    console.warn("Storage load failed, defaulting to fresh state", e);
  }

  const checkAchievementUnlock = (metric: string, currentValue: number) => {
    const { achievements } = get();
    let updated = false;
    const newAchievements = achievements.map(ach => {
      if (ach.metric === metric && !ach.unlocked && currentValue >= ach.target) {
        updated = true;
        synth.playFeedback('achievement');
        triggerHapticFeedback('achievement');
        set({ recentUnlock: ach.title });
        setTimeout(() => set({ recentUnlock: null }), 6000);
        return {
          ...ach,
          unlocked: true,
          unlockedAt: new Date().toLocaleTimeString()
        };
      }
      return ach;
    });

    if (updated) {
      set({ achievements: newAchievements });
      try {
        localStorage.setItem('cosmic_achievements', JSON.stringify(newAchievements));
      } catch (e) {}
    }
  };

  return {
    myId: null,
    myColor: savedColor,
    myName: savedName,
    myScore: 0,
    players: {},
    forceFields: {},
    gems: [],
    ws: null,

    // Custom modifiers
    selectedTool: 'attractor',
    setTool: (tool) => set({ selectedTool: tool }),

    // Sound
    soundEnabled: true,
    soundVolume: 0.3,
    toggleSound: () => {
      const isEnabled = !get().soundEnabled;
      synth.enabled = isEnabled;
      set({ soundEnabled: isEnabled });
    },
    setVolume: (vol) => {
      synth.setVolume(vol);
      set({ soundVolume: vol });
    },

    // WebGL
    celestialGravityEnabled: true,
    celestialGravityIntensity: 1.0,
    showCelestialOrbits: true,
    trackedPlanetId: null,
    toggleCelestialGravity: () => set((state) => ({ celestialGravityEnabled: !state.celestialGravityEnabled })),
    setCelestialGravityIntensity: (intensity) => set({ celestialGravityIntensity: intensity }),
    toggleCelestialOrbits: () => set((state) => ({ showCelestialOrbits: !state.showCelestialOrbits })),
    setTrackedPlanetId: (id) => set({ trackedPlanetId: id }),

    flowSpeed: 1.0,
    particlePreset: 'nebula',
    particleShape: 'majestic_dust',
    bloomIntensity: 1.8,
    setFlowSpeed: (speed) => set({ flowSpeed: speed }),
    setParticlePreset: (preset) => set({ particlePreset: preset }),
    setParticleShape: (shape) => set({ particleShape: shape }),
    setBloomIntensity: (intensity) => set({ bloomIntensity: intensity }),
    setCustomColor: (color) => {
      set({ myColor: color });
      try {
        localStorage.setItem('cosmic_my_color', color);
      } catch (e) {}
    },

    updateProfile: (name, color) => {
      set({ myName: name, myColor: color });
      try {
        localStorage.setItem('cosmic_my_name', name);
        localStorage.setItem('cosmic_my_color', color);
      } catch (e) {}

      const { ws } = get();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'update_profile', name, color }));
      }
    },

    collectGem: (gemId) => {
      // Optimistic visual audio feedback
      synth.playFeedback('prism');
      triggerHapticFeedback('magnet');

      const { ws } = get();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'collect_gem', gemId }));
      }
    },

    // Persistent State
    level: savedLevel,
    xp: savedXp,
    xpNeeded: savedLevel * 125,
    totalParticlesCreated: savedParticles,
    totalForceFieldsPlaced: savedFields,
    achievements: savedAchievements,
    recentUnlock: null,
    fps: 60,
    activeParticleCount: 0,
    updatePerformanceMetrics: (fps, count) => set({ fps, activeParticleCount: count }),

    // ChatGPT Oracle Log
    oracleMessages: [
      {
        id: 'welcome',
        sender: 'oracle',
        text: 'Welcome, Voyager. I am the Gemini Cosmic AI Oracle. Send me your query, and I shall unveil the quantum secrets of stardust and the multi-dimensional mechanics of Cosmic Flow.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    oracleLoading: false,

    askOracle: async (query: string) => {
      if (!query.trim()) return;
      const userMsg: OracleMessage = {
        id: Math.random().toString(),
        sender: 'player',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      set((state) => ({
        oracleMessages: [...state.oracleMessages, userMsg],
        oracleLoading: true
      }));

      // Track metric toward Oracle achievement
      const queryCount = get().oracleMessages.filter(m => m.sender === 'player').length + 1;
      checkAchievementUnlock('oracle_queries', queryCount);

      try {
        const activeFieldsCount = Object.keys(get().forceFields).length;
        const res = await fetch('/api/oracle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query, activeForceCount: activeFieldsCount }),
        });
        const data = await res.json();
        
        const oracleMsg: OracleMessage = {
          id: Math.random().toString(),
          sender: 'oracle',
          text: data.text || 'The stardust is dense, causing a faint quantum connection. Speak again, Voyager.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        set((state) => ({
          oracleMessages: [...state.oracleMessages, oracleMsg],
          oracleLoading: false
        }));
      } catch (err) {
        const errorMsg: OracleMessage = {
          id: Math.random().toString(),
          sender: 'oracle',
          text: 'The solar interference is too strong to contact the server. Please test your network, or enjoy the offline interactive particle synth sandbox!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        set((state) => ({
          oracleMessages: [...state.oracleMessages, errorMsg],
          oracleLoading: false
        }));
      }
    },

    clearOracle: () => {
      set({
        oracleMessages: [
          {
            id: 'welcome_reset',
            sender: 'oracle',
            text: 'Communication array reset. The quantum stream is clear, Voyager.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      });
    },

    addLocalXp: (amount: number) => {
      let { xp, level, xpNeeded } = get();
      xp += amount;
      let leveledUp = false;
      while (xp >= xpNeeded) {
        leveledUp = true;
        xp -= xpNeeded;
        level += 1;
        xpNeeded = level * 125;
      }

      set({ xp, level, xpNeeded });
      
      if (leveledUp) {
        synth.playFeedback('level_up');
        triggerHapticFeedback('level_up');
        checkAchievementUnlock('level', level);
      }

      try {
        localStorage.setItem('cosmic_level', level.toString());
        localStorage.setItem('cosmic_xp', xp.toString());
      } catch (e) {}
    },

    incrementParticleCount: (amount: number) => {
      const updated = get().totalParticlesCreated + amount;
      set({ totalParticlesCreated: updated });
      checkAchievementUnlock('particles', updated);
      if (Math.random() < 0.05) {
        get().addLocalXp(1); // Give micro XP for spawning particles
      }
      try {
        localStorage.setItem('cosmic_particles', updated.toString());
      } catch (e) {}
    },

    connect: () => {
      const { ws: currentWs } = get();
      if (currentWs && (currentWs.readyState === WebSocket.CONNECTING || currentWs.readyState === WebSocket.OPEN)) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'init') {
          const finalColor = savedColor || data.color;
          const finalName = savedName || data.name || `Player ${Math.floor(100 + Math.random() * 900)}`;
          set({ myId: data.id, myColor: finalColor, myName: finalName });
          
          if (savedName) {
            ws.send(JSON.stringify({ type: 'update_profile', name: savedName, color: finalColor }));
          }

          const playersMap: Record<string, Player> = {};
          data.players.forEach((p: Player) => {
            if (p.id !== data.id) playersMap[p.id] = p;
          });
          
          const forcesMap: Record<string, ForceField> = {};
          data.forceFields.forEach((f: ForceField) => {
            forcesMap[f.id] = f;
          });
          
          set({ players: playersMap, forceFields: forcesMap, gems: data.gems || [] });
        } else if (data.type === 'player_joined') {
          set((state) => ({
            players: { ...state.players, [data.player.id]: data.player }
          }));
        } else if (data.type === 'player_updated') {
          set((state) => {
            if (data.player.id === state.myId) {
              return { myColor: data.player.color, myName: data.player.name };
            }
            return {
              players: { ...state.players, [data.player.id]: data.player }
            };
          });
        } else if (data.type === 'player_left') {
          set((state) => {
            const newPlayers = { ...state.players };
            delete newPlayers[data.id];
            return { players: newPlayers };
          });
        } else if (data.type === 'gem_collected') {
          synth.playFeedback('prism');
          
          const playersMap: Record<string, Player> = {};
          data.players.forEach((p: Player) => {
            if (p.id !== get().myId) playersMap[p.id] = p;
          });

          if (data.collectorId === get().myId) {
            get().addLocalXp(50); // collecting a gem rewards 50 XP
          }

          set({ gems: data.gems, players: playersMap });
        } else if (data.type === 'sync') {
          set((state) => {
            const newPlayers = { ...state.players };
            data.players.forEach((p: Player) => {
              if (p.id !== state.myId) {
                newPlayers[p.id] = p;
              }
            });
            
            let newForces = state.forceFields;
            if (data.forceFields) {
              newForces = {};
              data.forceFields.forEach((f: ForceField) => {
                newForces[f.id] = f;
              });
            }
            
            return { players: newPlayers, forceFields: newForces, gems: data.gems || state.gems };
          });
        } else if (data.type === 'force_added') {
          set((state) => ({
            forceFields: { ...state.forceFields, [data.force.id]: data.force }
          }));
          // Draw sounds from external clients too (if enabled)
          if (get().soundEnabled && data.force.ownerId !== get().myId) {
            synth.playFeedback(data.force.type);
          }
        }
      };

      ws.onclose = () => {
        const { ws: currentWs } = get();
        if (currentWs === ws) {
          setTimeout(() => get().connect(), 1000);
        }
      };

      set({ ws });
    },

    disconnect: () => {
      const { ws } = get();
      if (ws) {
        ws.close();
        set({ ws: null, players: {}, forceFields: {} });
      }
    },

    sendCursor: (position: Vector3) => {
      const { ws } = get();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'cursor', position }));
      }
    },

    addForce: (position: Vector3, type: string) => {
      const { ws, myColor, myId } = get();
      
      // Play local synthesizer sound feedback instantly for ultra responsiveness
      synth.playFeedback(type);
      triggerHapticFeedback(type);

      // Increment placement counts & rewards
      const updatedCount = get().totalForceFieldsPlaced + 1;
      set({ totalForceFieldsPlaced: updatedCount });
      get().addLocalXp(8); // Place rewards 8 XP

      // Check force-specific achievements
      if (type === 'attractor') {
        const total = Object.values(get().forceFields).filter(f => f.type === 'attractor' && f.ownerId === myId).length + 1;
        checkAchievementUnlock('attractors', total);
      } else if (type === 'repulsor') {
        const total = Object.values(get().forceFields).filter(f => f.type === 'repulsor' && f.ownerId === myId).length + 1;
        checkAchievementUnlock('repulsors', total);
      } else if (type === 'vortex') {
        const total = Object.values(get().forceFields).filter(f => f.type === 'vortex' && f.ownerId === myId).length + 1;
        checkAchievementUnlock('vortex', total);
      } else if (type === 'strobe') {
        const total = Object.values(get().forceFields).filter(f => f.type === 'strobe' && f.ownerId === myId).length + 1;
        checkAchievementUnlock('strobe', total);
      }

      // Persist fields placed
      try {
        localStorage.setItem('cosmic_fields', updatedCount.toString());
      } catch (e) {}

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'add_force', position, forceType: type, color: myColor }));
      } else {
        // Multi-use physics simulation works beautifully offline too!
        const localId = 'offline_' + Math.random().toString();
        const localForceObj: ForceField = {
          id: localId,
          position,
          type,
          ownerId: myId || 'offline_player',
          createdAt: Date.now(),
          color: myColor || '#FF3366'
        };
        set((state) => ({
          forceFields: { ...state.forceFields, [localId]: localForceObj }
        }));

        // Remove offline force field after 10.5 seconds
        setTimeout(() => {
          set((state) => {
            const nextFields = { ...state.forceFields };
            delete nextFields[localId];
            return { forceFields: nextFields };
          });
        }, 10500);
      }
    }
  };
});
