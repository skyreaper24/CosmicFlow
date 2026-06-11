/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CosmicCanvas } from './components/CosmicCanvas';
import { useGameStore, OracleMessage } from './store/useGameStore';
import { designBibleData } from './data/designBible';
import { CELESTIAL_BODIES } from './utils/celestialPhysics';
import { 
  Users, Sparkles, Gamepad2, Globe, Cpu, 
  Volume2, VolumeX, Send, Trophy, Zap, 
  Settings, Flame, RotateCcw, HelpCircle,
  MessageSquare, BookOpen, Sliders, ChevronDown, CheckCircle
} from 'lucide-react';

export default function App() {
  const connect = useGameStore((state) => state.connect);
  const disconnect = useGameStore((state) => state.disconnect);
  const players = useGameStore((state) => state.players);
  const myColor = useGameStore((state) => state.myColor);
  
  // Custom store inputs
  const selectedTool = useGameStore((state) => state.selectedTool);
  const setTool = useGameStore((state) => state.setTool);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const soundVolume = useGameStore((state) => state.soundVolume);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const setVolume = useGameStore((state) => state.setVolume);
  const level = useGameStore((state) => state.level);
  const xp = useGameStore((state) => state.xp);
  const xpNeeded = useGameStore((state) => state.xpNeeded);
  const totalParticlesCreated = useGameStore((state) => state.totalParticlesCreated);
  const totalForceFieldsPlaced = useGameStore((state) => state.totalForceFieldsPlaced);
  const achievements = useGameStore((state) => state.achievements);
  const recentUnlock = useGameStore((state) => state.recentUnlock);
  const flowSpeed = useGameStore((state) => state.flowSpeed);
  const setFlowSpeed = useGameStore((state) => state.setFlowSpeed);
  const particlePreset = useGameStore((state) => state.particlePreset);
  const setParticlePreset = useGameStore((state) => state.setParticlePreset);
  const particleShape = useGameStore((state) => state.particleShape || 'dust');
  const setParticleShape = useGameStore((state) => state.setParticleShape);
  const bloomIntensity = useGameStore((state) => state.bloomIntensity || 1.8);
  const setBloomIntensity = useGameStore((state) => state.setBloomIntensity);
  const setCustomColor = useGameStore((state) => state.setCustomColor);

  // Celestial mechanics parameters from store
  const celestialGravityEnabled = useGameStore((state) => state.celestialGravityEnabled);
  const celestialGravityIntensity = useGameStore((state) => state.celestialGravityIntensity);
  const showCelestialOrbits = useGameStore((state) => state.showCelestialOrbits);
  const trackedPlanetId = useGameStore((state) => state.trackedPlanetId);
  const toggleCelestialGravity = useGameStore((state) => state.toggleCelestialGravity);
  const setCelestialGravityIntensity = useGameStore((state) => state.setCelestialGravityIntensity);
  const toggleCelestialOrbits = useGameStore((state) => state.toggleCelestialOrbits);
  const setTrackedPlanetId = useGameStore((state) => state.setTrackedPlanetId);
  const addForce = useGameStore((state) => state.addForce);
  const fps = useGameStore((state) => state.fps);
  const activeParticleCount = useGameStore((state) => state.activeParticleCount);
  
  // Local active tabs
  const [rightTab, setRightTab] = useState<'dashboard' | 'oracle' | 'bible'>('dashboard');
  const [selectedBibleCat, setSelectedBibleCat] = useState<string>('concept');
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  
  // Oracle input state
  const [oracleQuery, setOracleQuery] = useState('');
  const oracleMessages = useGameStore((state) => state.oracleMessages);
  const oracleLoading = useGameStore((state) => state.oracleLoading);
  const askOracle = useGameStore((state) => state.askOracle);
  const clearOracle = useGameStore((state) => state.clearOracle);
  
  // Collapsible panel status (for mobile visual sizing)
  const [panelsCollapsed, setPanelsCollapsed] = useState(false);

  const oracleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Scroll oracle to bottom whenever a message comes
  useEffect(() => {
    if (oracleEndRef.current) {
      oracleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [oracleMessages, oracleLoading]);

  // Helper to trigger specific high-fidelity haptic vibration patterns per tool ID, using light pulse [20, 30, 20] as fallback
  const triggerVibrateFeedback = (toolId: string) => {
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
      } catch (e) {
        // Suppress sandboxed environment errors
      }
    }
  };

  // Bind numerical keys 1-0 for selecting and instantly deploying mechanics (ignoring when input/textarea is focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }
      
      const keyMap: Record<string, string> = {
        '1': 'attractor',
        '2': 'repulsor',
        '3': 'vortex',
        '4': 'chaos',
        '5': 'wind',
        '6': 'strobe',
        '7': 'singularity',
        '8': 'gravity_well',
        '9': 'prism',
        '0': 'magnet'
      };

      if (e.key in keyMap) {
        const toolId = keyMap[e.key];
        setTool(toolId);
        
        // Instantly spawn/deploy the mechanic in the simulation
        const randPos = {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 6,
          z: (Math.random() - 0.5) * 6
        };
        addForce(randPos, toolId);
        triggerVibrateFeedback(toolId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTool, addForce]);

  const playerCount = Object.keys(players).length + 1;

  // Render lists of tools with names and detailed behaviors
  const TOOL_SPECS = [
    { id: 'attractor', label: 'Attractor Sink', desc: 'Gravitational center. Orbit fields.', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/20', shortcut: '[1]' },
    { id: 'repulsor', label: 'Repulsor Blast', desc: 'Expels stardust outward.', color: 'text-rose-400 bg-rose-950/40 border-rose-500/20', shortcut: '[2]' },
    { id: 'vortex', label: 'Vortex Spindle', desc: 'Swirling tangent torque spiral.', color: 'text-purple-400 bg-purple-950/40 border-purple-500/20', shortcut: '[3]' },
    { id: 'chaos', label: 'Chaos Field', desc: 'Turbulent erratic jittering noise.', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/20', shortcut: '[4]' },
    { id: 'wind', label: 'Solar Wind', desc: 'Steady horizontal wind stream.', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20', shortcut: '[5]' },
    { id: 'strobe', label: 'Energy Strobe', desc: 'Violent high energy strobe pulses.', color: 'text-amber-400 bg-amber-950/40 border-amber-500/20', shortcut: '[6]' },
    { id: 'singularity', label: 'Singularity', desc: 'Massive collapse & boom release.', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20', shortcut: '[7]' },
    { id: 'gravity_well', label: 'Gravity Well', desc: 'Slow planetary accretion rings.', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20', shortcut: '[8]' },
    { id: 'prism', label: 'Prism Refractor', desc: 'Rainbow spectrum color shifter.', color: 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-500/20', shortcut: '[9]' },
    { id: 'magnet', label: 'Dipole Magnet', desc: 'Fast magnetic suction attraction.', color: 'text-pink-400 bg-pink-950/40 border-pink-500/20', shortcut: '[0]' }
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02020a] text-gray-200 font-sans select-none cyber-panel">
      {/* Three.js Interactive WebGL Scene */}
      <CosmicCanvas />

      {/* Dynamic Animated Glassmorphic HUD overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between z-10">
        
        {/* TOP PANEL: Brand & Live Progress Tracking */}
        <div className="flex md:flex-row flex-col justify-between items-start gap-3 w-full pointer-events-auto">
          
          {/* Logo & Subtext */}
          <div className="bg-charcoal-900/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                <Sparkles className="text-white w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-white glow-text flex items-center gap-2">
                Aethera <span className="text-xs bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 font-mono px-1.5 py-0.5 rounded-md uppercase">V2 Sandbox</span>
              </h1>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase font-mono">Editor's Choice Premium</p>
            </div>
          </div>

          {/* XP Progression and Level Progress Tracker */}
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-lg px-6 py-3 rounded-2xl border border-white/5 shadow-2xl w-full max-w-md">
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex flex-col justify-center items-center shadow-lg border border-indigo-400/30">
                <span className="text-[10px] text-indigo-200 uppercase font-bold font-mono">Lvl</span>
                <span className="text-lg font-bold text-white leading-none -mt-0.5">{level}</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-indigo-300 font-mono font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 animate-bounce text-yellow-400" />
                  Stardust Resonance XP
                </span>
                <span className="text-gray-400 font-mono font-bold">{xp} / {xpNeeded}</span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                <motion.div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp / xpNeeded) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </div>

          {/* Performance Monitoring HUD widget */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 text-xs font-mono select-none shadow-md">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${fps >= 45 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : fps >= 25 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-rose-400 shadow-[0_0_8px_#f87171]'}`} />
                <span className="text-gray-400">FPS:</span>
                <span className={`${fps >= 45 ? 'text-emerald-400 font-bold' : fps >= 25 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}`}>{fps}</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Stardust:</span>
                <span className="text-purple-400 font-bold">{activeParticleCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Active Player Connections HUD block */}
            <div className="flex items-center gap-2 bg-emerald-950/40 backdrop-blur-md px-4 py-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Users size={15} className="animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">{playerCount} Online</span>
            </div>
            
            <button 
              onClick={() => setPanelsCollapsed(!panelsCollapsed)}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl px-3 py-2.5 border border-white/10 backdrop-blur-sm shadow-md transition-all text-xs font-semibold"
            >
              {panelsCollapsed ? 'Expand HUD' : 'Collapse HUD'}
            </button>
          </div>

        </div>

        {/* MIDDLE SECTION: Dual-column adaptive workspace */}
        <div className="flex-1 w-full flex md:flex-row flex-col gap-4 mt-4 overflow-hidden mb-4 items-stretch">
          
          {/* LEFT INTERACTIVE Hotbar and Multi-Action System controls */}
          <AnimatePresence>
            {!panelsCollapsed && (
              <motion.div 
                className="w-full md:w-80 flex flex-col gap-4 pointer-events-auto interactive-overlay"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {/* Simulation Control Console */}
                <div className="bg-black/60 backdrop-blur-lg rounded-2xl border border-white/5 p-4 shadow-xl flex-1 flex flex-col gap-4 overflow-y-auto">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-bold uppercase font-display tracking-widest text-indigo-300">Aetheric Forge Controls</h2>
                  </div>

                  {/* Hotbar weapons tool deployment selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Select Interactive Mechanic</label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {TOOL_SPECS.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setTool(tool.id);
                            // Immediately trigger/deploy the mechanic at a randomized central coordinate
                            const randPos = {
                              x: (Math.random() - 0.5) * 10,
                              y: (Math.random() - 0.5) * 6,
                              z: (Math.random() - 0.5) * 6
                            };
                            addForce(randPos, tool.id);
                            triggerVibrateFeedback(tool.id);
                          }}
                          title="Click to select & immediately deploy on-stage"
                          className={`flex items-center justify-between text-left p-2.5 rounded-xl border transition-all duration-250 cursor-pointer ${
                            selectedTool === tool.id 
                              ? 'bg-gradient-to-r from-indigo-950/60 to-purple-900/30 border-purple-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.25)] scale-[1.02]' 
                              : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className={`w-2 h-2 rounded-full ring-4 ring-black shadow-md ${
                              tool.id === 'attractor' ? 'bg-cyan-400' :
                              tool.id === 'repulsor' ? 'bg-rose-400' :
                              tool.id === 'vortex' ? 'bg-purple-400' :
                              tool.id === 'chaos' ? 'bg-yellow-400' :
                              tool.id === 'wind' ? 'bg-emerald-400' :
                              tool.id === 'strobe' ? 'bg-amber-400' :
                              tool.id === 'singularity' ? 'bg-indigo-500' :
                              tool.id === 'gravity_well' ? 'bg-blue-400' :
                              tool.id === 'prism' ? 'bg-fuchsia-400' :
                              tool.id === 'magnet' ? 'bg-pink-400' : 'bg-gray-400'
                            }`} />
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold leading-tight">{tool.label}</p>
                              <p className="text-[10px] text-gray-400 truncate">{tool.desc}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono border border-white/10 px-1 py-0.5 rounded text-gray-500 uppercase">{tool.shortcut}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Themes / Presets */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Aesthetic Preset schemes</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'nebula', label: '💜 Nebula', color: 'bg-purple-900' },
                        { id: 'hypernova', label: '💚 Hypernova', color: 'bg-teal-900' },
                        { id: 'supernova', label: '🧡 Supernova', color: 'bg-amber-900' },
                        { id: 'spectrum', label: '🌈 Spectrum', color: 'bg-slate-900' }
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setParticlePreset(preset.id)}
                          className={`py-2 text-xs rounded-lg border text-center transition-all cursor-pointer ${
                            particlePreset === preset.id
                              ? 'bg-white/10 text-white border-white/20 font-bold scale-[1.02]'
                              : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Particle Geometry Shape Picker */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Particle Geometry Essence</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'majestic_dust', label: '✨ Majestic Dust' },
                        { id: 'glowing_star', label: '⭐ Glowing Star' },
                        { id: 'nebula_bloom', label: '🌸 Nebula Bloom' },
                        { id: 'fractal_spore', label: '👾 Fractal Spore' }
                      ].map((shape) => (
                        <button
                          id={`shape-${shape.id}`}
                          key={shape.id}
                          onClick={() => setParticleShape(shape.id)}
                          className={`py-2 px-2.5 text-xs rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            particleShape === shape.id
                              ? 'bg-gradient-to-r from-purple-950/60 to-purple-900/30 text-white border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.2)] scale-[1.02]'
                              : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{shape.label}</span>
                          {particleShape === shape.id && <CheckCircle className="w-3 h-3 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Independent Stardust Colorizer */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Independent Custom Color</label>
                      <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">{myColor || '#A855F7'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="customColorPicker"
                        value={myColor || '#a855f7'}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer transition-transform duration-100 active:scale-90"
                        title="Independent Spectrometer Wheel Picker"
                      />
                      <div className="flex-1 grid grid-cols-6 gap-1">
                        {[
                          '#a855f7', // Violet Pulsar
                          '#3b82f6', // Azure Aurora
                          '#06b6d4', // Ice Cyan
                          '#10b981', // Emerald Storm
                          '#f97316', // Ember Nova
                          '#ec4899'  // Pink Nebula
                        ].map((hex) => (
                          <button
                            key={hex}
                            onClick={() => setCustomColor(hex)}
                            className={`h-5 rounded-md transition-transform hover:scale-110 cursor-pointer border ${
                              myColor?.toLowerCase() === hex.toLowerCase() 
                                ? 'border-white scale-110 shadow-[0_0_4px_rgba(255,255,255,0.4)]' 
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: hex }}
                            title={`Palette Swatch ${hex}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Flow Speed Multiplier Slider */}
                  <div className="space-y-1.5 border-t border-white/5 pt-3">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-mono">
                      <span>Flow Velocity Flux</span>
                      <span className="text-indigo-400 font-bold font-mono">{flowSpeed.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.2" 
                      max="2.5" 
                      step="0.1" 
                      value={flowSpeed}
                      onChange={(e) => setFlowSpeed(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Bloom Intensity Slider - Adjusts the glow threshold of majestic dust & stars */}
                  <div className="space-y-1.5 border-t border-white/5 pt-3">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-mono">
                      <span>Aetheric Bloom Glow</span>
                      <span className="text-purple-400 font-bold font-mono">{bloomIntensity.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="4.0" 
                      step="0.1" 
                      value={bloomIntensity}
                      onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      title="Adjusts bloom intensity and glow threshold for majestic dust and glowing stars"
                    />
                  </div>

                  {/* Solar System & Celestial Gravity Panel */}
                  <div className="space-y-3.5 border-t border-white/5 pt-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-300 font-semibold">Celestial Mechanics</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={toggleCelestialOrbits}
                          title="Toggle Planet Orbits"
                          className={`px-1.5 py-0.5 text-[8px] font-mono rounded border uppercase transition-all cursor-pointer ${
                            showCelestialOrbits 
                              ? 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20' 
                              : 'text-gray-500 border-white/10'
                          }`}
                        >
                          Orbits
                        </button>
                        <button
                          onClick={toggleCelestialGravity}
                          title="Toggle Planetary Orbit Gravity"
                          className={`px-1.5 py-0.5 text-[8px] font-mono rounded border uppercase transition-all cursor-pointer ${
                            celestialGravityEnabled 
                              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20' 
                              : 'text-gray-500 border-white/10'
                          }`}
                        >
                          Gravity
                        </button>
                      </div>
                    </div>

                    {/* Celestial Gravity Slider */}
                    {celestialGravityEnabled && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono">
                          <span>Solar/Planetary Pull</span>
                          <span className="text-emerald-400 font-bold font-mono">{celestialGravityIntensity.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="3.0"
                          step="0.1"
                          value={celestialGravityIntensity}
                          onChange={(e) => setCelestialGravityIntensity(parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    )}

                    {/* Dynamic Camera Planet Focus list */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-mono tracking-wider text-gray-400 block pb-0.5">Focus Space Camera</label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pr-1 py-0.5 whitespace-nowrap scrollbar-thin">
                        <button
                          onClick={() => setTrackedPlanetId(null)}
                          className={`px-2 py-1 text-[10px] rounded-lg border transition-all cursor-pointer ${
                            trackedPlanetId === null
                              ? 'bg-gradient-to-r from-purple-950/60 to-purple-900/30 text-white border-purple-500 font-bold'
                              : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          🌌 Full View
                        </button>
                        {CELESTIAL_BODIES.map((body) => {
                          const emoji = 
                            body.id === 'sun' ? '☀️' : 
                            body.id === 'mercury' ? '🌑' : 
                            body.id === 'venus' ? '🟠' : 
                            body.id === 'earth' ? '🌍' : 
                            body.id === 'moon' ? '🌙' : 
                            body.id === 'mars' ? '🔴' : 
                            body.id === 'jupiter' ? '🪐' : 
                            body.id === 'saturn' ? '🪐' : 
                            body.id === 'uranus' ? '🔵' : 
                            body.id === 'neptune' ? '🩵' : '🌏';

                          return (
                            <button
                              key={body.id}
                              onClick={() => setTrackedPlanetId(body.id)}
                              className={`px-2 py-1 text-[10px] rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                trackedPlanetId === body.id
                                  ? 'bg-gradient-to-r from-indigo-950/60 to-purple-900/40 text-white border-indigo-400 font-bold'
                                  : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{body.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Real-time Planetary Telemetry HUD */}
                    {(() => {
                      const trackedBody = CELESTIAL_BODIES.find(b => b.id === trackedPlanetId);
                      if (!trackedBody) return null;
                      return (
                        <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-cyan-500/15 space-y-1.5 animate-fadeIn">
                          {/* Header */}
                          <div className="flex justify-between items-center pb-1 border-b border-white/5">
                            <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase">{trackedBody.name} Telemetry</span>
                            <span className="text-[8px] font-mono text-zinc-500">ACTIVE REALTIME READOUT</span>
                          </div>

                          {/* Mass, Gravity, Radius values in clean grids */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8.5px] font-mono text-zinc-300">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Gravity:</span>
                              <span className="text-cyan-300 font-bold">{trackedBody.realGravity.toFixed(2)} m/s²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Relative Mass:</span>
                              <span className="text-cyan-300 font-bold">
                                {trackedBody.massRelToEarth >= 1000 
                                  ? `${(trackedBody.massRelToEarth/1000).toFixed(0)}k` 
                                  : trackedBody.massRelToEarth.toFixed(3)}x
                              </span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-zinc-500">Diameter (Equatorial):</span>
                              <span className="text-indigo-300 font-bold">{trackedBody.diameterKM.toLocaleString()} km</span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-zinc-500">Orbital Distance:</span>
                              <span className="text-amber-300 font-bold">
                                {trackedBody.realDistanceAU > 0 ? `${trackedBody.realDistanceAU.toFixed(2)} AU` : '0.0 AU (Solar Barycenter)'}
                              </span>
                            </div>
                            <div className="flex justify-between col-span-2 border-t border-white/5 pt-1 mt-0.5">
                              <span className="text-zinc-400 uppercase text-[7.5px]">Pull Field Range:</span>
                              <span className="text-emerald-400 font-medium">Sphere of Influence &lt; {trackedBody.influenceRadius.toFixed(1)} units</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Core Synthesizer Sound controls */}
                  <div className="space-y-3 border-t border-white/5 pt-3 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Audio Synthesis Engine</span>
                      <button 
                        onClick={toggleSound}
                        className={`p-1.5 rounded-lg border cursor-pointer hover:bg-white/10 ${
                          soundEnabled ? 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20' : 'text-gray-500 border-white/10 bg-transparent'
                        }`}
                      >
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                        <span>Resonance Vol</span>
                        <span>{Math.round(soundVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1.0" 
                        step="0.05" 
                        value={soundVolume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        disabled={!soundEnabled}
                        className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-30"
                      />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CENTRAL STARDUST STAGE (Empty spacer allowing particle view) */}
          <div className="flex-1 min-h-[160px] pointer-events-none" />

          {/* RIGHT VIEW TABBED DECK: Dashboard, Gemini Oracle, and Design Specifications */}
          <AnimatePresence>
            {!panelsCollapsed && (
              <motion.div 
                className="w-full md:w-110 flex flex-col gap-4 pointer-events-auto interactive-overlay"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.25 }}
              >
                {/* Container Card */}
                <div className="bg-black/60 backdrop-blur-lg rounded-2xl border border-white/5 shadow-2xl flex-1 flex flex-col overflow-hidden">
                  
                  {/* Top Glass Tabs Selector */}
                  <div className="flex border-b border-white/5 bg-black/40 p-1">
                    {[
                      { id: 'dashboard', label: 'Trophy', icon: <Trophy size={14} />, text: 'Dashboard' },
                      { id: 'oracle', label: 'MessageSquare', icon: <MessageSquare size={14} />, text: 'Cosmic Oracle' },
                      { id: 'bible', label: 'BookOpen', icon: <BookOpen size={14} />, text: 'Design Bible' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setRightTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold cursor-pointer rounded-lg transition-all ${
                          rightTab === tab.id 
                            ? 'bg-white/5 text-white shadow-inner font-bold border border-white/10' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.text}</span>
                      </button>
                    ))}
                  </div>

                  {/* TAB CONTENT 1: Dashboard and Stats */}
                  {rightTab === 'dashboard' && (
                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                      
                      {/* Interactive sandbox performance numbers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Stardust Emitted</p>
                          <p className="text-xl font-bold text-white font-mono">{totalParticlesCreated.toLocaleString()}</p>
                          <div className="w-full bg-black/40 h-1 mt-2.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalParticlesCreated / 50000) * 100)}%` }} />
                          </div>
                          <span className="text-[9px] text-gray-500 font-mono mt-1 block">Goal: 50,000 for badge</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Force Fields Sunk</p>
                          <p className="text-xl font-bold text-white font-mono">{totalForceFieldsPlaced}</p>
                          <div className="w-full bg-black/40 h-1 mt-2.5 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalForceFieldsPlaced / 30) * 100)}%` }} />
                          </div>
                          <span className="text-[9px] text-gray-500 font-mono mt-1 block">Yields 8 XP per placement</span>
                        </div>
                      </div>

                      {/* Achievements Progression Scroll List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">Cosmic Achievements</span>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 max-h-55 overflow-y-auto pr-1">
                          {achievements.map((ach) => (
                            <div 
                              key={ach.id} 
                              className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                                ach.unlocked 
                                  ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-100' 
                                  : 'bg-white/5 border-transparent text-gray-400'
                              }`}
                            >
                              <div className={`mt-0.5 rounded-md p-1 ${ach.unlocked ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-600'}`}>
                                <Trophy size={14} />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline gap-2">
                                  <h4 className="text-xs font-bold truncate">{ach.title}</h4>
                                  {ach.unlocked && <span className="text-[8px] font-mono text-cyan-500 uppercase font-semibold">Ready</span>}
                                </div>
                                <p className="text-[10px] text-gray-400">{ach.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Brief Instructions box to help players build */}
                      <div className="bg-indigo-950/25 border border-indigo-500/10 p-3.5 rounded-xl space-y-1.5 text-xs text-indigo-300">
                        <h4 className="font-semibold flex items-center gap-1">
                          <HelpCircle size={14} className="text-indigo-400 animate-pulse" />
                          Gravity Sandbox Instructions:
                        </h4>
                        <ul className="list-disc list-inside text-[11px] space-y-1 text-gray-300">
                          <li>Click anywhere on stage to spawn the <span className="text-white font-medium">{selectedTool}</span> at your path.</li>
                          <li>Drag cursor to spray sparkling multi-colored stardust.</li>
                          <li>Press keys <span className="text-white font-medium font-mono border border-white/15 px-1 rounded bg-black/40">1</span> to <span className="text-white font-medium font-mono border border-white/15 px-1 rounded bg-black/40">0</span> to select tools instantly.</li>
                          <li>Press <span className="text-white font-medium font-mono border border-white/15 px-1 rounded bg-black/40">Spacebar</span> to quickly deploy a Repulsor wave.</li>
                        </ul>
                      </div>

                    </div>
                  )}

                  {/* TAB CONTENT 2: Server-Side Gemini AI Oracle Chat Terminal */}
                  {rightTab === 'oracle' && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#03030a]">
                      
                      {/* Chat array logs */}
                      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 flex flex-col">
                        {oracleMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] ${
                              msg.sender === 'player' ? 'self-end items-end' : 'self-start items-start'
                            }`}
                          >
                            <span className="text-[8px] font-mono text-gray-500 mb-0.5">{msg.sender === 'player' ? 'Voyager Core' : 'Gemini AI oracle'} • {msg.timestamp}</span>
                            <div 
                              className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                                msg.sender === 'player' 
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none' 
                                  : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none font-sans whitespace-pre-line'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        
                        {oracleLoading && (
                          <div className="self-start flex flex-col items-start max-w-[80%]">
                            <span className="text-[8px] font-mono text-cyan-400 animate-pulse mb-0.5">Contacting server system...</span>
                            <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl rounded-tl-none flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        )}
                        <div ref={oracleEndRef} />
                      </div>

                      {/* Quick starter queries */}
                      <div className="px-3 py-1.5 border-t border-white/5 bg-black/40 flex gap-1.5 overflow-x-auto pr-1">
                        {[
                          "Describe stardust anomalies",
                          "Explain Singularity core",
                          "Generate code event code",
                          "Mindfulness tips"
                        ].map((promptText, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setOracleQuery(promptText);
                              askOracle(promptText);
                            }}
                            className="bg-white/5 hover:bg-white/10 text-[9px] text-gray-400 hover:text-white px-2 py-1 rounded-md border border-white/5 backdrop-blur-sm whitespace-nowrap cursor-pointer transition-all"
                          >
                            {promptText}
                          </button>
                        ))}
                      </div>

                      {/* Input controls form */}
                      <div className="p-3 border-t border-white/5 bg-black/60 flex gap-2">
                        <input
                          type="text"
                          placeholder="Type cosmic question for the AI architect..."
                          value={oracleQuery}
                          onChange={(e) => setOracleQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && oracleQuery.trim() && !oracleLoading) {
                              askOracle(oracleQuery);
                              setOracleQuery('');
                            }
                          }}
                          className="flex-1 bg-gray-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-gray-500"
                        />
                        <button
                          onClick={() => {
                            if (oracleQuery.trim() && !oracleLoading) {
                              askOracle(oracleQuery);
                              setOracleQuery('');
                            }
                          }}
                          disabled={!oracleQuery.trim() || oracleLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white p-2 px-3 rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={clearOracle}
                          className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white p-2 rounded-xl text-xs border border-white/5 cursor-pointer transition-all"
                          title="Reset Chat"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>

                    </div>
                  )}

                  {/* TAB CONTENT 3: Design Bible 30 Aspect deck scroll */}
                  {rightTab === 'bible' && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-black/45">
                      
                      {/* Categories horizontal list */}
                      <div className="flex border-b border-white/5 bg-black/25">
                        {designBibleData.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedBibleCat(cat.id);
                              setActiveAccordion(null);
                            }}
                            className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-wider cursor-pointer border-b text-center transition-all ${
                              selectedBibleCat === cat.id
                                ? 'text-cyan-400 border-cyan-500 bg-white/5'
                                : 'text-gray-500 border-transparent hover:text-gray-300'
                            }`}
                          >
                            {cat.name.split(' ')[0]} {cat.name.split(' ').slice(1).join(' ')}
                          </button>
                        ))}
                      </div>

                      {/* Accordion checklist items */}
                      <div className="flex-1 p-3.5 overflow-y-auto space-y-2">
                        <div className="border-b border-white/5 pb-2 mb-3">
                          <h3 className="text-xs font-bold text-cyan-400 font-display flex items-center gap-1.5">
                            <Sparkles size={14} />
                            Android Game Architecture Deck
                          </h3>
                          <p className="text-[10px] text-gray-500 leading-normal">
                            Explore full specifications describing our "Editor\'s Choice" design, including monetization mechanics, physics, and implementation checklists.
                          </p>
                        </div>

                        {designBibleData.find(c => c.id === selectedBibleCat)?.items.map((item) => {
                          const isOpen = activeAccordion === item.id;
                          return (
                            <div key={item.id} className="border border-white/5 rounded-xl bg-white/5 overflow-hidden transition-all">
                              <button
                                onClick={() => setActiveAccordion(isOpen ? null : item.id)}
                                className="w-full flex items-center justify-between p-3 text-left cursor-pointer hover:bg-white/5 transition-all"
                              >
                                <span className="text-xs font-semibold text-gray-200 font-display">{item.title}</span>
                                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-250 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                              </button>
                              
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-white/5 bg-black/40"
                                  >
                                    <div className="p-3.5 text-[11px] text-gray-300 leading-relaxed whitespace-pre-line font-mono max-h-70 overflow-y-auto">
                                      {item.content}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* FOOTER BAR: Active Player Info / Dynamic Unlock Toasts */}
        <div className="flex justify-between items-center w-full mt-auto">
          
          {/* Active Player Custom Color Indicators */}
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 pointer-events-auto">
            {myColor && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full animate-ping absolute shadow-[0_0_15px_rgba(255,255,255,1)]" 
                  style={{ backgroundColor: myColor }} 
                />
                <div 
                  className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)] relative" 
                  style={{ backgroundColor: myColor }} 
                />
                <span className="text-[10px] font-mono tracking-widest text-white font-semibold uppercase">YOUR COLOR</span>
              </div>
            )}
          </div>

          {/* Achievement Trophy Pop-ups */}
          <div className="pointer-events-auto">
            <AnimatePresence>
              {recentUnlock && (
                <motion.div 
                  className="bg-gradient-to-r from-cyan-950 via-indigo-900 to-purple-950 border border-cyan-400 p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm"
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div className="bg-cyan-400 text-black p-2 rounded-xl animate-bounce">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase font-display tracking-wider">Achievement Completed!</h3>
                    <p className="text-sm font-black text-cyan-300">{recentUnlock}</p>
                    <p className="text-[10px] text-indigo-200 mt-0.5">Proceeding unlocks stardust essence items.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
