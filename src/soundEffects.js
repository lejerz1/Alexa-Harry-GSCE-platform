/* ── Web Audio API sound effects for landing page avatars ──────── */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/* ── Alexa — shimmery sparkle / chime ─────────────────────────── */

function alexaSparkle(ctx) {
  const now = ctx.currentTime;
  const frequencies = [2400, 3200, 4800, 5600];
  const stagger = 0.03;

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * stagger);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * stagger + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * stagger);
    osc.stop(now + i * stagger + 0.2);
  });
}

/* ── Harry — electric zap / buzz ──────────────────────────────── */

function harryZap(ctx) {
  const now = ctx.currentTime;

  // Primary zap
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(800, now);
  osc1.frequency.exponentialRampToValueAtTime(100, now + 0.2);
  gain1.gain.setValueAtTime(0.2, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Detuned buzz layer
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(820, now);
  osc2.frequency.exponentialRampToValueAtTime(110, now + 0.2);
  gain2.gain.setValueAtTime(0.08, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.3);
}

/* ── Zara — bubbly pop sequence ───────────────────────────────── */

function zaraBubbles(ctx) {
  const now = ctx.currentTime;
  const blips = [
    { freq: 400, start: 0 },
    { freq: 600, start: 0.1 },
    { freq: 800, start: 0.2 },
    { freq: 1050, start: 0.28 },
  ];

  blips.forEach(({ freq, start }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.linearRampToValueAtTime(0.18, now + start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + 0.1);
  });
}

/* ── Layla — firework whistle then boom ───────────────────────── */

function laylaFirework(ctx) {
  const now = ctx.currentTime;

  // Phase 1: rising whistle
  const whistleOsc = ctx.createOscillator();
  const whistleGain = ctx.createGain();
  whistleOsc.type = "sine";
  whistleOsc.frequency.setValueAtTime(500, now);
  whistleOsc.frequency.exponentialRampToValueAtTime(2500, now + 0.3);
  whistleGain.gain.setValueAtTime(0.12, now);
  whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  whistleOsc.connect(whistleGain);
  whistleGain.connect(ctx.destination);
  whistleOsc.start(now);
  whistleOsc.stop(now + 0.4);

  // Phase 2: boom (low sine burst)
  const boomOsc = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boomOsc.type = "sine";
  boomOsc.frequency.value = 80;
  boomGain.gain.setValueAtTime(0.001, now + 0.3);
  boomGain.gain.linearRampToValueAtTime(0.25, now + 0.31);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  boomOsc.connect(boomGain);
  boomGain.connect(ctx.destination);
  boomOsc.start(now + 0.3);
  boomOsc.stop(now + 0.7);

  // Phase 2: sub-rumble through lowpass
  const rumbleOsc = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  const rumbleFilter = ctx.createBiquadFilter();
  rumbleOsc.type = "sawtooth";
  rumbleOsc.frequency.value = 40;
  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.value = 150;
  rumbleGain.gain.setValueAtTime(0.001, now + 0.3);
  rumbleGain.gain.linearRampToValueAtTime(0.15, now + 0.32);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  rumbleOsc.connect(rumbleGain);
  rumbleGain.connect(rumbleFilter);
  rumbleFilter.connect(ctx.destination);
  rumbleOsc.start(now + 0.3);
  rumbleOsc.stop(now + 0.7);
}

/* ── Georgia — cosmic whoosh / swirl ──────────────────────────── */

function georgiaWhoosh(ctx) {
  const now = ctx.currentTime;
  const duration = 0.8;

  // Procedural white noise buffer
  const bufferSize = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.5;
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(4000, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
  gain.gain.setValueAtTime(0.2, now + 0.55);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration + 0.05);
}

/* ── Exports ──────────────────────────────────────────────────── */

export const SOUNDS = {
  alexa: alexaSparkle,
  harry: harryZap,
  zara: zaraBubbles,
  layla: laylaFirework,
  georgia: georgiaWhoosh,
};

export function playSound(slug) {
  const fn = SOUNDS[slug];
  if (!fn) return;
  try {
    const ctx = getAudioContext();
    fn(ctx);
  } catch (e) {
    // Audio is decorative — never block the UI
  }
}
