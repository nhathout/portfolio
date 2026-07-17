// Tiny WebAudio chiptune synth — no audio assets needed.

export class Chip {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("sl_mute") === "1";
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  }

  tone(freq, dur = 0.08, type = "square", vol = 0.04, when = 0, slide = 0) {
    if (this.muted || !this.ensure()) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // ---- custom recorded samples (drop mp3s in assets/sfx/ — see README) ----
  async loadSamples(map) {
    this._raw = {};
    this.samples = {};
    await Promise.all(Object.entries(map).map(async ([name, url]) => {
      try {
        const r = await fetch(url);
        if (r.ok) this._raw[name] = await r.arrayBuffer();
      } catch { /* no custom sample — synth fallback */ }
    }));
  }

  /** plays a loaded sample; returns false if none exists (caller falls back to synth) */
  playSample(name, vol = 0.5) {
    if (this.muted || !this.ensure()) return this._raw?.[name] != null;
    const buf = this.samples?.[name];
    if (buf) {
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.buffer = buf;
      src.connect(g).connect(this.ctx.destination);
      src.start();
      return true;
    }
    const raw = this._raw?.[name];
    if (raw) { // decode lazily on first use, play from the next call on
      this.ctx.decodeAudioData(raw.slice(0), (b) => (this.samples[name] = b));
      return true;
    }
    return false;
  }

  blip() { this.tone(880, 0.025, "square", 0.015); }
  step(alt) { this.tone(alt ? 170 : 150, 0.03, "triangle", 0.02); }
  engine(alt) { this.tone(alt ? 82 : 74, 0.07, "square", 0.045); this.tone(46, 0.07, "sawtooth", 0.028); }
  rev() { this.tone(70, 0.4, "sawtooth", 0.06, 0, 160); this.tone(110, 0.3, "square", 0.04, 0.1, 120); }
  neigh() { this.tone(620, 0.28, "sawtooth", 0.035, 0, -320); this.tone(430, 0.22, "triangle", 0.03, 0.06, -200); }
  toot() { this.tone(340, 0.16, "sawtooth", 0.035, 0, 240); this.tone(500, 0.2, "square", 0.02, 0.05, 120); }
  kpop() { [523, 659, 784, 659, 880, 784, 1047, 880].forEach((f, i) => this.tone(f, 0.11, "square", 0.05, i * 0.11)); }
  noahVoice() { this.playSample("noah", 0.6); }
  confirm() { this.tone(660, 0.07); this.tone(990, 0.09, "square", 0.035, 0.07); }
  close() { this.tone(440, 0.06, "square", 0.03); }
  pickup() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.09, "square", 0.045, i * 0.07)); }
  fanfare() { [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, "triangle", 0.06, i * 0.12)); }
  meow() {
    if (this.playSample("meow", 0.55)) return;
    this.tone(760, 0.22, "sawtooth", 0.025, 0, -300);
    this.tone(980, 0.16, "triangle", 0.02, 0.04, -350);
  }
  denied() { this.tone(220, 0.12, "square", 0.045); this.tone(175, 0.18, "square", 0.045, 0.12); }
  heart() { this.tone(1175, 0.08, "triangle", 0.045); this.tone(1568, 0.12, "triangle", 0.04, 0.07); }

  // ------------------------------------------------------------ music
  // A cozy looping chiptune (C–G–Am–F) built from the same synth. Uses a
  // lookahead scheduler so it stays in time regardless of frame rate.
  startMusic() {
    if (this.musicOn) return;
    if (!this.ensure()) return;
    this.musicOn = true;
    // note table
    const N = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
    };
    const _ = 0;
    this._mel = [
      N.E4, _, N.G4, _, N.C5, _, N.A4, N.G4,
      N.D4, _, N.G4, _, N.B4, _, N.D5, _,
      N.C4, _, N.A4, _, N.E5, _, N.C5, N.A4,
      N.F4, _, N.A4, _, N.C5, _, N.G4, _,
    ];
    this._bass = [
      N.C3, _, _, N.G3, N.C3, _, _, _,
      N.G3, _, _, N.D3, N.G3, _, _, _,
      N.A3, _, _, N.E3, N.A3, _, _, _,
      N.F3, _, _, N.C4, N.F3, _, _, _,
    ];
    this._tempo = 112;
    this._beat = 0;
    this._nextT = this.ctx.currentTime + 0.15;
    this._musicTimer = setInterval(() => this._schedule(), 30);
  }

  stopMusic() {
    this.musicOn = false;
    clearInterval(this._musicTimer);
  }

  _schedule() {
    if (!this.ctx || !this.musicOn) return;
    const spb = 60 / this._tempo / 2; // eighth-note length
    while (this._nextT < this.ctx.currentTime + 0.2) {
      if (!this.muted) {
        const m = this._mel[this._beat];
        const b = this._bass[this._beat];
        if (m) this._voice(m, this._nextT, spb * 0.92, "triangle", 0.05);
        if (b) this._voice(b, this._nextT, spb * 2.2, "square", 0.022);
      }
      this._beat = (this._beat + 1) % this._mel.length;
      this._nextT += spb;
    }
  }

  // soft ADSR voice for the music (gentler than the raw `tone` SFX)
  _voice(freq, t, dur, type, vol) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  toggle() {
    this.muted = !this.muted;
    localStorage.setItem("sl_mute", this.muted ? "1" : "0");
    return this.muted;
  }
}
