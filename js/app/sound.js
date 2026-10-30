/*
✒ Metadata
    - Title: Sound (MONOLITH Edition - v1.0)
    - File Name: sound.js
    - Relative Path: js/app/sound.js
    - Artifact Type: javascript
    - Version: 1.0.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The page's sounds, synthesized with Web Audio rather than loaded from
    files. The audio context opens on a player's gesture (Start game, the
    sound switch, a typed move), as browsers require.

✒ Key Features:
    - ensureAudio(): opens or resumes the audio context.
    - sound: tick for a move, crack for a capture, chime for check, and for
      the end a rising arpeggio (a win), two soft notes (a draw) or a low
      thud (a loss).
    - Silent while the Sound setting is off (app.muted).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { sound, ensureAudio } from '../app/sound.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js.
    - Shared state (js/app/store.js): reads only app.muted.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from './store.js';

/* ---------- sound (synthesized) ---------- */
let actx = null;
export function ensureAudio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } if (actx && actx.state === 'suspended') actx.resume(); }
export const sound = {
  tick(vol = 1) { if (!actx || app.muted) return; const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(vol < 1 ? 760 : 520, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.08); g.gain.setValueAtTime(0.18 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.13); },
  crack() { if (!actx || app.muted) return; const t = actx.currentTime, n = actx.sampleRate * 0.5, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2); const s = actx.createBufferSource(); s.buffer = buf; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.45); const g = actx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5); s.connect(f).connect(g).connect(actx.destination); s.start(t); const o = actx.createOscillator(), og = actx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.3); og.gain.setValueAtTime(0.35, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(og).connect(actx.destination); o.start(t); o.stop(t + 0.36); },
  /* game-end sounds: a rising major arpeggio for a win, two soft notes for a draw, a low thud for a fall */
  fanfare() { if (!actx || app.muted) return; const t = actx.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((fq, i) => { const o = actx.createOscillator(), g = actx.createGain(), st = t + i * 0.13, len = i === 3 ? 0.9 : 0.22; o.type = 'triangle'; o.frequency.value = fq; g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.16, st + 0.02); g.gain.exponentialRampToValueAtTime(0.001, st + len); o.connect(g).connect(actx.destination); o.start(st); o.stop(st + len + 0.02); }); },
  drawTone() { if (!actx || app.muted) return; const t = actx.currentTime; [440, 554.37].forEach((fq, i) => { const o = actx.createOscillator(), g = actx.createGain(), st = t + i * 0.22; o.type = 'sine'; o.frequency.value = fq; g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.12, st + 0.04); g.gain.exponentialRampToValueAtTime(0.001, st + 0.8); o.connect(g).connect(actx.destination); o.start(st); o.stop(st + 0.82); }); },
  thud() { if (!actx || app.muted) return; const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.32); },
  chime() { if (!actx || app.muted) return; const t = actx.currentTime; [880, 1320].forEach((fq, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = fq; g.gain.setValueAtTime(0.0001, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.14, t + i * 0.09 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.5); o.connect(g).connect(actx.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.52); }); }
};
