/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpecItem {
  id: string;
  title: string;
  content: string;
}

export interface SpecCategory {
  id: string;
  name: string;
  icon: string;
  items: SpecItem[];
}

export const designBibleData: SpecCategory[] = [
  {
    id: "concept",
    name: "🌌 Core Concept & Loop",
    icon: "Sparkles",
    items: [
      {
        id: "game_names",
        title: "1. Game Name Options (20)",
        content: `1. **Aethera: Cosmic Nexus** (Selected)\n2. **Stardust Symphony**\n3. **Event Horizon Cooperative**\n4. **Singularity.IO**\n5. **Quantum Flow**\n6. **Stardust Weaver**\n7. **Astrokinetic sandbox**\n8. **Nebula Drift**\n9. **Graviton Core**\n10. **Chronos Particle Stream**\n11. **Cosmic Resonance**\n12. **Vector Space**\n13. **Starforge Sandbox**\n14. **Astral Wind**\n15. **Nebulaic Resonance**\n16. **Celestial Canvas**\n17. **Solaris Drift**\n18. **Aura Collider**\n19. **Void Weaver**\n20. **Kinetic Core**`
      },
      {
        id: "one_liner",
        title: "2. One-Line Pitch",
        content: `"Direct cosmic stardust and bend orbital physics in real-time collaboration with global stargazers to engineer living, breathing particle symphonies."`
      },
      {
        id: "viral_engine",
        title: "3. Virality Engine",
        content: `• **Instantly Export Dynamic GIFs**: Seamless, one-tap export of 4K custom looping particle creations directly to TikTok, Reddit, and Instagram Reels with procedural beat-matched audio overlay.\n• **Collaborative Creation Links**: Generate an instant 'Room ID' join link. When shared on messenger platforms, friends can drag and drop into the exact quantum gravity well room within 2 seconds without load screens.\n• **Reddit Living Wallpaper Engine**: Seamless integration permitting Android users to set their collaborative live simulation directly as an interactive system wallpaper.`
      },
      {
        id: "gameplay_loop",
        title: "4. Complete Gameplay Loop",
        content: `• **Entry**: Player boots to a serene, borderless galaxy. Instantly, their touch spawns trails of multi-colored stardust.\n• **Action & Combo**: Double tapping or holding triggers specialized gravitational weapon structures (Attractor, Repulsor, Vortex, Singularity, Strobe).\n• **Synergy**: Gravitational actions earn orbital velocity multiples. Speeding particles near core sinks trigger XP boosts.\n• **Reward**: Leveling up unlocks high-energy visual spectral presets (e.g. Spectrum, Supernova) and dynamic audio synthesizer harmonics.`
      },
      {
        id: "risk_reward",
        title: "5. Risk vs. Reward Systems",
        content: `• **Event Horizon Compression**: Holding a Singularity collapses all local matter, risking complete particle absorption (loss of multiplier), but releasing right at peak compression launches a 5x 'Stardust Supernova' XP multiplier.\n• **Chaotic Drift**: Placing a Chaos field near player clusters amplifies particle turbulence heavily—increasing random spawn counts by 300% but making particle coordinates extremely erratic to lock onto attractors.`
      }
    ]
  },
  {
    id: "mechanics",
    name: "🎮 Mechanics & Specifications",
    icon: "Gamepad2",
    items: [
      {
        id: "core_mechanics",
        title: "6. Core Game Mechanics",
        content: `• **Velocity Trail Elasticity**: Particles stretch dynamically along their exact velocity vectors via GPU shaders, offering physical weight.\n• **Aether Magnetism**: Specialized nodes that charge particles to glow with 2x scale and emit high-pitched melodic synth frequencies.\n• **Vortex Torque**: Bends space with horizontal tangent torque vectors, creating beautiful spiral accretion discs.\n• **Chromatic Split**: Prismatic light filters that colorize stardust coordinates dynamically based on screen intersection math.`
      },
      {
        id: "controls",
        title: "7. Fluid Controls",
        content: `• **Intuitive Touch/Cursor Drag**: Smooth mouse movement or single-finger drag spawns elegant stardust starrunes.\n• **Left Double-Touch / Click**: Instantly places a gravity-attracting black hole.\n• **Right-Touch / Spacebar**: Expels a shockwave repellent wave.\n• **Hotbar Shortcuts**: SERENE layout with beautiful floating glassmorphism widgets lets players select active visualizers instantly (Chaos, Solar Wind, Accretion Wells, Prisms).`
      },
      {
        id: "camera_system",
        title: "8. Orbital Camera System",
        content: `• **Dynamic Depth Panning**: Smooth camera lerp that slightly pulls backward during huge particle explosions or speed gains, emphasizing spatial magnitude.\n• **Ambient Auto-Rotate**: Serene, micro-rotational camera pivot (0.015 rad/s) maintaining active depth parallax even during stagnant player states.`
      },
      {
        id: "physics_matrix",
        title: "9. Physics Matrix",
        content: `• **Simplex Curl Noise Integration**: Multi-frequency wind simulation vectors flowing over the Coordinate plane, ensuring particles never drift in robotic straight lines.\n• **Inverse Square Magnetism**: Force vectors diminish smoothly based on 1/d² distance scale calculations, preventing clipping glitches.`
      },
      {
        id: "ai_architect",
        title: "10. AI System Behavior",
        content: `• **Stardust Entity AI**: Intelligent space dust configurations that react to player density. If players aggregate space nodes in one vector, AI-seeded anomalies cluster on opposite screens to maintain compositional balance.\n• **Gemini Server-Side Oracle Engine**: An active cosmic guide that parses natural language and creates adaptive physics rules or delivers custom preset seeds.`
      },
      {
        id: "progression_map",
        title: "11. Progression Roadmap",
        content: `• **Quantum Ranks**: Level 1 to 100 with satisfying neon visual rank badges.\n• **Aesthetic Mastery Paths**: Play milestones unlock rare glowing particle elements (e.g. antimatter dark spores, solar wind trails, prismatic light nodes).\n• **Cosmic achievements**: 7 high-contrast badges reflecting gravity manipulation skill.`
      }
    ]
  },
  {
    id: "product",
    name: "📈 Business & Marketing",
    icon: "Globe",
    items: [
      {
        id: "economy_simulation",
        title: "12. Sandbox Economy",
        content: `• **Stardust Essence (XP)**: Earned dynamically through collaborative flow states, placing gravity anchors, and creating cosmic prisms. Zero pay-to-win locks.\n• **Astro-Cores**: Sandbox unlock indicators used to configure custom ambient baseline hums or visual nebula presets.`
      },
      {
        id: "reward_triggers",
        title: "13. Neuro-Reward Triggers",
        content: `• **Audiovisual Level Caps**: Every level-up is paired with a radiant white particle flash, followed by a gorgeous modular synthesizer arpeggio.\n• **Tactile Satisfaction**: Touch dragging triggers progressive micro-sound tick scale changes, mimicking physical instrument response.`
      },
      {
        id: "sound_design",
        title: "14. Dynamic Sound Systems",
        content: `• **Responsive Synthesizer**: Built via Web Audio oscillators. Generates high-pitched chimes for Attractors, sub-bass booms for Repulsors, swirling sweep filters for Vortices, and chaotic FM ticks for high-turbulence zones.`
      },
      {
        id: "ethical_monetization",
        title: "15. Ethical Monetization",
        content: `• **Premium Expansion Packs**: Optional offline custom texture packs (e.g. Liquid Glass, Retro 8-bit voxel space dust).\n• **Serenity Season Pass**: Cosmetic rewards ONLY. No intrusive pop-up ads, keeping the mindfulness experience pristine.`
      },
      {
        id: "marketing_strategy",
        title: "16. Marketing Engine",
        content: `• **Mindfulness ASMR Campaigns**: Short loops of custom serene synth sequences accompanied by fluid visual flows, targeted directly at studying, sleep, and ADHD meditation playlists under social tags.`
      },
      {
        id: "gpo_spec",
        title: "17. Google Play Optimization (GPO)",
        content: `• **Featured Category Target**: 'Mindfulness & Serenities' and 'Physics Puzzle & Sandboxes'.\n• **Minimal APK Payload**: Sub 35MB footprint using dynamic vector SVGs, localized canvas procedural textures, and runtime synthesizer audio generation.`
      }
    ]
  },
  {
    id: "technical",
    name: "🛠️ Technical Architecture",
    icon: "Cpu",
    items: [
      {
        id: "tech_stack",
        title: "18. Production Tech Stack",
        content: `• **Target Platform**: Android & Web GL Container Environments.\n• **Runtime Engines**: Jetpack Compose Desktop + LibGDX Canvas API for native Android; React 19 + Three.js / React Three Fiber + Vite + Tailwind CSS for web deployment.\n• **Database**: Offline SQLite database (via better-sqlite3) on backend, LocalStorage for state persistence.`
      },
      {
        id: "performance_optimization",
        title: "19. Performance Engineering",
        content: `• **Instanced GPU Rendering**: Single-draw-call vector buffering supporting over 25,000 active particles at solid 60/120 FPS on standard mobile phones.\n• **Pre-Allocated Vectors**: Recyclable Three.js Vector3 arrays preventing garbage collector thrashing in loops.`
      },
      {
        id: "sqlite_schema",
        title: "20. Persistent Database Schema",
        content: `\`\`\`sql\nCREATE TABLE IF NOT EXISTS player_progression (\n  player_id TEXT PRIMARY KEY,\n  level INTEGER DEFAULT 1,\n  experience INTEGER DEFAULT 0,\n  particles_created INTEGER DEFAULT 0,\n  fields_placed INTEGER DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE IF NOT EXISTS unlocked_badges (\n  badge_id TEXT NOT NULL,\n  player_id TEXT NOT NULL,\n  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (badge_id, player_id)\n);\n\`\`\``
      },
      {
        id: "assets_list",
        title: "21. Procedural Asset Manifest",
        content: `• **Particle Texture**: Procedural canvas radial gradient radial texture compiled at client initialization.\n• **Synth Presets**: Wave tables (Sine, Square, Triangle, Noise) built purely on physical browser oscillators (0KB asset payload).\n• **Visual Icons**: Pure Lucide svg assets, fully cached on startup.`
      },
      {
        id: "checklist_mvp",
        title: "22. MVP Implementation Checklist",
        content: `✔ Real-time responsive 25,000 particles simulation with 10 modular forces.\n✔ Multi-channel Web Audio Synthesizer playing satisfying sound effects.\n✔ Level Progression & XP tracking persistent across sessions.\n✔ Live server-side Gemini Cosmic Oracle chat Integration.\n✔ Full glassmorphism screen overlay styled in high-class dark cosmic colors.`
      }
    ]
  }
];
