// sound.js — every sound in the kitchen, synthesized with WebAudio.
// No audio files: a chop is a filtered thud, the grill is looped noise, a
// serve is a little two-note ding. Created on the first user gesture, so the
// browser's autoplay rules never bite.

let ctx = null;
let grillNoise = null;
let grillGain = null;

export function ensureAudio(muted) {
  if (ctx || muted) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, type, vol, when) {
  if (!ctx) return;
  const t = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol || 0.12, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function playEvent(name, muted) {
  if (muted) return;
  ensureAudio(muted);
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  switch (name) {
    case 'pickup':
      tone(520, 0.09, 'triangle', 0.1);
      break;
    case 'chop':
      tone(180, 0.08, 'square', 0.09);
      tone(120, 0.1, 'square', 0.07, 0.05);
      break;
    case 'grill':
      tone(220, 0.12, 'sawtooth', 0.05);
      break;
    case 'serve':
      tone(660, 0.12, 'sine', 0.14);
      tone(880, 0.22, 'sine', 0.14, 0.1);
      break;
    case 'error':
      tone(140, 0.16, 'square', 0.08);
      break;
    case 'trash':
      tone(300, 0.08, 'triangle', 0.07);
      tone(200, 0.12, 'triangle', 0.07, 0.07);
      break;
    case 'tick':
      tone(980, 0.05, 'sine', 0.06);
      break;
    case 'start':
      tone(440, 0.1, 'triangle', 0.1);
      tone(554, 0.1, 'triangle', 0.1, 0.09);
      tone(659, 0.18, 'triangle', 0.12, 0.18);
      break;
    default:
      break;
  }
}

// A soft looping sizzle while anything cooks on the grill.
export function setGrillSizzle(on, muted) {
  if (muted) on = false;
  ensureAudio(muted);
  if (!ctx) return;
  if (on && !grillNoise) {
    const len = ctx.sampleRate * 1;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.6;
    grillGain = ctx.createGain();
    grillGain.gain.value = 0.0;
    src.connect(filter);
    filter.connect(grillGain);
    grillGain.connect(ctx.destination);
    src.start();
    grillNoise = src;
    grillGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.4);
  } else if (!on && grillNoise) {
    const src = grillNoise;
    const gain = grillGain;
    grillNoise = null;
    grillGain = null;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    setTimeout(() => { try { src.stop(); } catch { /* already stopped */ } }, 300);
  }
}
