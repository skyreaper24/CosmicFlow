/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  public enabled = true;

  constructor() {
    // Lazy initializing on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // default volume 30%
      this.masterGain.connect(this.ctx.destination);
      
      // Start a continuous subtle cosmic hum in the background
      this.startCosmicHum();
    } catch (e) {
      console.warn("Failed to initialize Web Audio UI", e);
    }
  }

  public setVolume(vol: number) {
    if (!this.ctx) this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);
    }
  }

  private startCosmicHum() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const carrier = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      carrier.type = 'triangle';
      carrier.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 hum

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // 0.15Hz rate
      lfoGain.gain.setValueAtTime(10, this.ctx.currentTime); // amount of filter sweep

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      carrier.connect(filter);
      
      const humGain = this.ctx.createGain();
      humGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      filter.connect(humGain);
      humGain.connect(this.masterGain);

      lfo.start();
      carrier.start();
    } catch (e) {
      console.warn("Background hum failed", e);
    }
  }

  public playFeedback(type: string) {
    if (!this.enabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx || !this.masterGain) return;
    
    // Resume context if suspended (browser behavior)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    try {
      switch (type) {
        case 'attractor': {
          // Glassy crystal chime chord
          const notes = [440, 554.37, 659.25, 880]; // A major chime
          notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + idx * 0.03);
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + idx * 0.03 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t);
            osc.stop(t + 1.3);
          });
          break;
        }
        case 'repulsor': {
          // Deep sweep-down warning boom
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(45, t + 0.5);
          
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          
          // Lowpass filter to make it soft/dubby
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(220, t);
          filter.frequency.linearRampToValueAtTime(80, t + 0.4);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);
          
          osc.start(t);
          osc.stop(t + 0.9);
          break;
        }
        case 'vortex': {
          // Swirling sci-fi ring frequency modulation
          const osc = this.ctx.createOscillator();
          const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, t);
          osc.frequency.linearRampToValueAtTime(320, t + 0.3);
          osc.frequency.linearRampToValueAtTime(110, t + 0.8);

          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

          if (panner) {
            panner.pan.setValueAtTime(-1, t);
            panner.pan.linearRampToValueAtTime(1, t + 0.6);
            osc.connect(panner);
            panner.connect(gain);
          } else {
            osc.connect(gain);
          }

          gain.connect(this.masterGain);
          osc.start(t);
          osc.stop(t + 1.0);
          break;
        }
        case 'chaos': {
          // Scattered bubble ticks
          for (let i = 0; i < 6; i++) {
            const tickTime = t + i * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            const rndFreq = 400 + Math.random() * 800;
            osc.frequency.setValueAtTime(rndFreq, tickTime);
            
            gain.gain.setValueAtTime(0.08, tickTime);
            gain.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.05);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(tickTime);
            osc.stop(tickTime + 0.06);
          }
          break;
        }
        case 'wind': {
          // White noise gust synthesized with lowpass filter sweep
          const bufferSize = this.ctx.sampleRate * 1.2; // 1.2 seconds of noise
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          
          const noiseNode = this.ctx.createBufferSource();
          noiseNode.buffer = buffer;
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, t);
          filter.frequency.exponentialRampToValueAtTime(1800, t + 0.4);
          filter.frequency.exponentialRampToValueAtTime(200, t + 1.2);
          
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
          
          noiseNode.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);
          
          noiseNode.start(t);
          noiseNode.stop(t + 1.25);
          break;
        }
        case 'strobe': {
          // Intense tech pulse chord
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'square';
          osc1.frequency.setValueAtTime(330, t); // E4
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(660, t); // Octave

          gain.gain.setValueAtTime(0.15, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1000, t);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);

          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.5);
          osc2.stop(t + 0.5);
          break;
        }
        case 'singularity': {
          // Massive sub collapse and sub-bass drop
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.exponentialRampToValueAtTime(30, t + 1.5); // sub frequency drop

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.35, t + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(t);
          osc.stop(t + 1.9);

          // Spark sound at collapse initiation
          const spark = this.ctx.createOscillator();
          const sparkGain = this.ctx.createGain();
          spark.type = 'sine';
          spark.frequency.setValueAtTime(2000, t);
          sparkGain.gain.setValueAtTime(0.1, t);
          sparkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          spark.connect(sparkGain);
          sparkGain.connect(this.masterGain);
          spark.start(t);
          spark.stop(t + 0.15);
          break;
        }
        case 'gravity_well': {
          // Heavy oscillating sub-bass frequency modulation (resonance sweep)
          const osc = this.ctx.createOscillator();
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(90, t);
          
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(8, t); // 8Hz modulation
          lfoGain.gain.setValueAtTime(35, t);

          gain.gain.setValueAtTime(0.2, t);
          gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          osc.connect(gain);
          gain.connect(this.masterGain);

          lfo.start(t);
          osc.start(t);
          lfo.stop(t + 1.2);
          osc.stop(t + 1.2);
          break;
        }
        case 'prism': {
          // Rainbow cascade chord chime
          const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.50]; // Pentatonic rainbow
          notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + idx * 0.05);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.1, t + idx * 0.05 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t);
            osc.stop(t + idx * 0.05 + 0.5);
          });
          break;
        }
        case 'magnet': {
          // Slide key down and deep pulse
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);

          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(180, t);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);

          osc.start(t);
          osc.stop(t + 0.75);
          break;
        }
        case 'level_up': {
          // Beautiful positive melodic arpeggio
          const root = 261.63; // C4
          const notes = [root, root * 1.25, root * 1.5, root * 2.0]; // C - E - G - C chord
          notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + idx * 0.12);
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + idx * 0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.6);
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t);
            osc.stop(t + idx * 0.12 + 0.7);
          });
          break;
        }
        case 'achievement': {
          // Victory trill scale
          const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.50];
          notes.forEach((freq, idx) => {
            const noteTime = t + idx * 0.06;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteTime);
            gain.gain.setValueAtTime(0.12, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(noteTime);
            osc.stop(noteTime + 0.15);
          });
          break;
        }
      }
    } catch (e) {
      console.warn("Play feedback failed", e);
    }
  }
}

export const synth = new AudioSynth();
