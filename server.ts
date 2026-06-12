/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Types
type Vector3 = { x: number; y: number; z: number };

interface Player {
  id: string;
  color: string;
  position: Vector3 | null;
  name?: string;
  score?: number;
  lastUpdate: number;
}

interface ForceField {
  id: string;
  position: Vector3;
  type: 'attractor' | 'repulsor';
  ownerId: string;
  createdAt: number;
  color: string;
}

interface Gem {
  id: string;
  position: Vector3;
  color: string;
  scoreValue: number;
}

// State
const players = new Map<string, Player>();
const forceFields = new Map<string, ForceField>();
const clients = new Map<string, WebSocket>();
const gems = new Map<string, Gem>();

// Colors for players
const COLORS = [
  '#facc15', // Gold / Amber Yellow (specifically requested)
  '#FF3366', // Electric Red-Pink
  '#33CCFF', // Cosmic Turquoise cyan
  '#33FF99', // Hyper Neon Green
  '#CC33FF', // Neon Purple
  '#FF3333', // Neon Red
  '#3333FF'  // Royal Blue
];

// Create 8 initial sparkling gold stars/gems
function spawnGems() {
  gems.clear();
  for (let i = 0; i < 8; i++) {
    const gemId = uuidv4();
    gems.set(gemId, {
      id: gemId,
      position: {
        x: (Math.random() - 0.5) * 18,
        y: (Math.random() - 0.5) * 11,
        z: (Math.random() - 0.5) * 8
      },
      color: '#facc15', // Glowing Amber Gold
      scoreValue: 100
    });
  }
}

function broadcast(data: any, excludeId?: string) {
  const message = JSON.stringify(data);
  for (const [id, ws] of clients.entries()) {
    if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Spawn initial gems
  spawnGems();

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    const id = uuidv4();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const defaultName = `Player ${Math.floor(100 + Math.random() * 900)}`;
    
    const player: Player = {
      id,
      color,
      name: defaultName,
      score: 0,
      position: null,
      lastUpdate: Date.now()
    };
    
    players.set(id, player);
    clients.set(id, ws);

    // Send initial state to the new client, including gems
    ws.send(JSON.stringify({
      type: 'init',
      id,
      color,
      name: defaultName,
      players: Array.from(players.values()),
      forceFields: Array.from(forceFields.values()),
      gems: Array.from(gems.values())
    }));

    // Broadcast new player to others
    broadcast({
      type: 'player_joined',
      player
    }, id);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'cursor') {
          const p = players.get(id);
          if (p) {
            p.position = data.position;
            p.lastUpdate = Date.now();
          }
        } else if (data.type === 'update_profile') {
          const p = players.get(id);
          if (p) {
            if (data.name) p.name = data.name;
            if (data.color) p.color = data.color;
            // Broadcast player state immediately to update leaderboards & labels
            broadcast({
              type: 'player_updated',
              player: p
            });
          }
        } else if (data.type === 'collect_gem') {
          const gemId = data.gemId;
          if (gems.has(gemId)) {
            const p = players.get(id);
            if (p) {
              p.score = (p.score || 0) + 100;
            }
            
            // Move collected gem to a new randomized coordinate
            const oldGem = gems.get(gemId)!;
            gems.set(gemId, {
              ...oldGem,
              position: {
                x: (Math.random() - 0.5) * 18,
                y: (Math.random() - 0.5) * 11,
                z: (Math.random() - 0.5) * 8
              }
            });
            
            // Broadcast collection to all clients with the new state
            broadcast({
              type: 'gem_collected',
              collectorId: id,
              gemId,
              players: Array.from(players.values()),
              gems: Array.from(gems.values())
            });
          }
        } else if (data.type === 'add_force') {
          const forceId = uuidv4();
          const force: ForceField = {
            id: forceId,
            position: data.position,
            type: data.forceType,
            ownerId: id,
            createdAt: Date.now(),
            color: data.color
          };
          forceFields.set(forceId, force);
          
          // Broadcast new force field immediately
          broadcast({
            type: 'force_added',
            force
          });
        }
      } catch (e) {
        console.error('Invalid message', e);
      }
    });

    ws.on('close', () => {
      players.delete(id);
      clients.delete(id);
      
      // Remove player's force fields
      for (const [forceId, force] of forceFields.entries()) {
        if (force.ownerId === id) {
          forceFields.delete(forceId);
        }
      }

      broadcast({
        type: 'player_left',
        id
      });
    });
  });

  // Broadcast loop (20Hz)
  setInterval(() => {
    const now = Date.now();
    
    // Clean up old force fields (e.g., after 10.5 seconds to allow client animation)
    let forcesChanged = false;
    for (const [id, force] of forceFields.entries()) {
      if (now - force.createdAt > 10500) {
        forceFields.delete(id);
        forcesChanged = true;
      }
    }

    const updateData = {
      type: 'sync',
      players: Array.from(players.values()),
      gems: Array.from(gems.values()),
      ...(forcesChanged ? { forceFields: Array.from(forceFields.values()) } : {})
    };

    broadcast(updateData);
  }, 50);

  // API routes
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', players: players.size });
  });

  app.post('/api/oracle', async (req, res) => {
    const { message, activeForceCount } = req.body;
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            text: `You are the Cosmic Flow AI Oracle & Gameplay Architect, guidance system for 'Aethera: Cosmic Nexus'. You respond with mysterious, elegant, highly scannable, and extremely inspiring insights about particle physics, cosmic anomalies, and game strategies.
            Keep responses neat, elegant, limited to 2 short paragraphs with markdown, and use space-related and gameplay terminology.
            
            Current live state:
            - Active force fields placed: ${activeForceCount || 0}
            - Current online players: ${players.size}
            
            Player query: "${message}"`
          }
        ],
        config: {
          temperature: 1.0,
        }
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Gemini error:', err);
      res.status(500).json({ error: 'The Cosmic Oracle deep space signal is currently faint. Please supply an API key or try again later.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
