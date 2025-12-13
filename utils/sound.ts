import { ThemeId } from '../types';

// Use a singleton AudioContext to prevent running out of hardware contexts (limit is usually 6)
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  
  // Browsers suspend AudioContext until user interaction
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.warn("Audio resume failed", e));
  }
  
  return audioCtx;
};

export const playSound = (type: 'match' | 'levelup' | 'incorrect' | 'tick' | 'gameover', theme: ThemeId) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (type === 'tick') {
    playTick(ctx);
    return;
  }

  if (type === 'gameover') {
    playGameOver(ctx);
    return;
  }

  if (type === 'incorrect') {
    playIncorrect(ctx);
    return;
  }

  switch (theme) {
    case 'hockey':
      if (type === 'match') playHockeyMatch(ctx);
      else playHockeyLevelUp(ctx);
      break;
    case 'football':
      if (type === 'match') playFootballMatch(ctx);
      else playFootballLevelUp(ctx);
      break;
    case 'space':
      if (type === 'match') playSpaceMatch(ctx);
      else playSpaceLevelUp(ctx);
      break;
    case 'classic':
    default:
      if (type === 'match') playClassicMatch(ctx);
      else playClassicLevelUp(ctx);
      break;
  }
};

const playTick = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  // High pitch short blip resembling a digital watch or metronome
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
  
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  
  osc.start(t);
  osc.stop(t + 0.05);
};

const playGameOver = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  // Descending "sad" slide
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.linearRampToValueAtTime(100, t + 0.8);
  
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.8);
  
  osc.start(t);
  osc.stop(t + 0.8);
};

const playIncorrect = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
  
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  
  osc.start(t);
  osc.stop(t + 0.2);
};

// --- Classic Sounds (Arcade/Chime style) ---

const playClassicMatch = (ctx: AudioContext) => {
  // "Coin" sound: Two rapid notes
  const t = ctx.currentTime;
  
  // Note 1 (B5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, t);
  gain1.gain.setValueAtTime(0.1, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc1.start(t);
  osc1.stop(t + 0.1);

  // Note 2 (E6) - higher pitch, slightly delayed
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1318.51, t + 0.05);
  gain2.gain.setValueAtTime(0.1, t + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc2.start(t + 0.05);
  osc2.stop(t + 0.4);
};

const playClassicLevelUp = (ctx: AudioContext) => {
  // "Power Up": Fast major arpeggio
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t + i * 0.08);
    
    gain.gain.setValueAtTime(0, t + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3);
    
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.3);
  });
};

// --- Hockey Sounds (Impact/Noise style) ---

const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

const playHockeyMatch = (ctx: AudioContext) => {
  // "Slap Shot": Noise burst with filter sweep + low thud
  const t = ctx.currentTime;

  // 1. Noise Burst (Stick hitting ice/puck)
  const noiseBuffer = createNoiseBuffer(ctx);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(3000, t);
  noiseFilter.frequency.exponentialRampToValueAtTime(500, t + 0.1);

  noiseGain.gain.setValueAtTime(0.4, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  noise.start(t);
  noise.stop(t + 0.15);

  // 2. Thud (Body/Puck weight)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  
  osc.start(t);
  osc.stop(t + 0.1);
};

const playHockeyLevelUp = (ctx: AudioContext) => {
  // "Goal Horn": Loud detuned sawtooths + Crowd noise
  const t = ctx.currentTime;
  
  // Horn frequencies (Minor third-ish)
  const freqs = [150, 180, 300]; 
  
  freqs.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    
    // Blast envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
    gain.gain.setValueAtTime(0.15, t + 1.2);
    gain.gain.linearRampToValueAtTime(0, t + 1.8);
    
    osc.start(t);
    osc.stop(t + 1.8);
  });

  // Crowd noise background
  const noiseBuffer = createNoiseBuffer(ctx);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  filter.type = 'bandpass';
  filter.frequency.value = 500;
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.5);
  gain.gain.linearRampToValueAtTime(0, t + 2.0);

  noise.start(t);
  noise.stop(t + 2.0);
};

// --- Football Sounds (Whistle/Kick style) ---

const playFootballMatch = (ctx: AudioContext) => {
  // "Kick": Pitch drop sine (Kick drum) + Click
  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
  
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  
  osc.start(t);
  osc.stop(t + 0.15);
};

const playFootballLevelUp = (ctx: AudioContext) => {
  // "Referee Whistle": Modulated square wave
  // Pattern: Peep-PEEEEEP!
  const t = ctx.currentTime;

  const playWhistlePart = (startTime: number, duration: number) => {
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const mainGain = ctx.createGain();

    // Modulator creates the "trill" (pea in the whistle)
    modulator.type = 'sine';
    modulator.frequency.value = 40; // Trill speed
    modulator.connect(modGain);
    
    modGain.gain.value = 500; // Trill depth
    modGain.connect(carrier.frequency);

    carrier.type = 'square'; // Harsh whistle tone
    carrier.frequency.setValueAtTime(2000, startTime);
    carrier.connect(mainGain);
    
    mainGain.connect(ctx.destination);
    
    mainGain.gain.setValueAtTime(0, startTime);
    mainGain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
    mainGain.gain.setValueAtTime(0.1, startTime + duration - 0.05);
    mainGain.gain.linearRampToValueAtTime(0, startTime + duration);

    carrier.start(startTime);
    modulator.start(startTime);
    
    carrier.stop(startTime + duration);
    modulator.stop(startTime + duration);
  };

  // Short peep
  playWhistlePart(t, 0.2);
  // Long peep
  playWhistlePart(t + 0.3, 0.8);
};

// --- Space Sounds (Sci-fi) ---

const playSpaceMatch = (ctx: AudioContext) => {
  // "Laser": Fast descending sawtooth
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
  
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  
  osc.start(t);
  osc.stop(t + 0.15);
};

const playSpaceLevelUp = (ctx: AudioContext) => {
  // "Warp Power Up": Rising FM sweep
  const t = ctx.currentTime;
  
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const mainGain = ctx.createGain();
  
  carrier.connect(mainGain);
  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  mainGain.connect(ctx.destination);
  
  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(200, t);
  carrier.frequency.linearRampToValueAtTime(800, t + 1.0);
  
  modulator.type = 'square';
  modulator.frequency.setValueAtTime(50, t);
  modulator.frequency.linearRampToValueAtTime(10, t + 1.0);
  
  modGain.gain.setValueAtTime(100, t);
  
  mainGain.gain.setValueAtTime(0, t);
  mainGain.gain.linearRampToValueAtTime(0.2, t + 0.5);
  mainGain.gain.linearRampToValueAtTime(0, t + 1.2);
  
  carrier.start(t);
  modulator.start(t);
  
  carrier.stop(t + 1.2);
  modulator.stop(t + 1.2);
};