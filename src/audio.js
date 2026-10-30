const NOTE = {
  a1: 55,
  c2: 65.41,
  d2: 73.42,
  e2: 82.41,
  f2: 87.31,
  g2: 98,
  a2: 110,
  c3: 130.81,
  d3: 146.83,
  e3: 164.81,
  g3: 196,
  a3: 220,
  c4: 261.63,
  d4: 293.66,
  e4: 329.63,
  g4: 392,
  a4: 440,
};

const MUSIC_BASS = [
  NOTE.a1, 0, NOTE.a1, 0, NOTE.c2, 0, NOTE.e2, 0,
  NOTE.a1, 0, NOTE.a1, NOTE.g2, NOTE.e2, 0, NOTE.d2, 0,
  NOTE.f2, 0, NOTE.f2, 0, NOTE.a2, 0, NOTE.g2, 0,
  NOTE.e2, 0, NOTE.e2, NOTE.d2, NOTE.c2, 0, NOTE.a1, 0,
];

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
    this.ambience = null;
    this.enabled = localStorage.getItem("cdl-sound") !== "off";
    this.started = false;
    this.musicTimer = null;
    this.step = 0;
    this.nextNote = 0;
    this.intensity = 0;
    this.noise = null;
    this.rainSource = null;
  }

  async init() {
    if (this.started) {
      if (this.ctx?.state === "suspended") await this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.started = true;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.72 : 0;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 16;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.22;
    this.master.connect(comp);
    comp.connect(this.ctx.destination);

    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.8;
    this.sfx.connect(this.master);

    this.music = this.ctx.createGain();
    this.music.gain.value = 0.23;
    this.music.connect(this.master);

    const delay = this.ctx.createDelay(0.5);
    delay.delayTime.value = 0.17;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.19;
    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = "lowpass";
    delayFilter.frequency.value = 1600;
    this.sfx.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.master);

    this.noise = this.makeNoise(2.2);
    await this.startAmbience();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.startMusic();
  }

  makeNoise(seconds = 1) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = 0.82 * last + 0.18 * white;
      data[i] = last;
    }
    return buffer;
  }

  startAmbience() {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
    this.rainSource = src;
    this.ambience = gain;
  }

  setEnabled(on) {
    this.enabled = on;
    localStorage.setItem("cdl-sound", on ? "on" : "off");
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(on ? 0.72 : 0, this.ctx.currentTime + 0.06);
    }
  }

  setIntensity(value) {
    this.intensity = Math.max(0, Math.min(1, value));
  }

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.nextNote = this.ctx.currentTime + 0.12;
    this.step = 0;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 90);
  }

  scheduleMusic() {
    if (!this.ctx || this.ctx.state !== "running") return;
    const ahead = this.ctx.currentTime + 0.25;
    const stepDur = 0.1375;
    while (this.nextNote < ahead) {
      this.playMusicStep(this.step, this.nextNote, stepDur);
      this.nextNote += stepDur;
      this.step = (this.step + 1) % MUSIC_BASS.length;
    }
  }

  playMusicStep(step, when, dur) {
    const bass = MUSIC_BASS[step];
    if (bass) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = step % 8 === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(bass, when);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(420 + this.intensity * 900, when);
      filter.Q.value = 5.2;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.14 + this.intensity * 0.06, when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.9);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.music);
      osc.start(when);
      osc.stop(when + dur);
    }

    if (step % 2 === 0) this.kick(when, step % 8 === 0 ? 0.14 : 0.08);
    if (step % 2 === 1 && this.intensity > 0.1) this.hat(when, 0.018 + this.intensity * 0.018);

    if (step === 0 || step === 16) this.chord(when, step === 0 ? NOTE.a2 : NOTE.f2, dur * 12);
    if (step === 8 || step === 24) this.chord(when, step === 8 ? NOTE.c3 : NOTE.e2, dur * 8);
  }

  chord(when, root, length) {
    const notes = [root, root * 1.189, root * 1.498];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.value = freq / 2;
      osc.detune.value = i === 1 ? 7 : -5;
      filter.type = "lowpass";
      filter.frequency.value = 390;
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.linearRampToValueAtTime(0.022, when + 0.32);
      gain.gain.linearRampToValueAtTime(0.0001, when + length);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.music);
      osc.start(when);
      osc.stop(when + length + 0.05);
    });
  }

  kick(when, level = 0.12) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(44, when + 0.16);
    gain.gain.setValueAtTime(level, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    osc.connect(gain);
    gain.connect(this.music);
    osc.start(when);
    osc.stop(when + 0.24);
  }

  hat(when, level = 0.024) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 5800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.055);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.music);
    src.start(when, Math.random() * 0.8, 0.06);
  }

  noiseBurst({ duration = 0.12, gain = 0.3, freq = 1800, type = "lowpass", q = 0.8, when = 0, output = this.sfx } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(output);
    src.start(t, Math.random() * 1.4, duration + 0.02);
  }

  tone({ freq = 440, end = freq, duration = 0.12, gain = 0.1, type = "sine", when = 0, output = this.sfx } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (end !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(output);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  ui() {
    this.tone({ freq: 660, end: 820, duration: 0.06, gain: 0.05, type: "square" });
  }

  shot() {
    if (!this.ctx) return;
    this.noiseBurst({ duration: 0.15, gain: 0.44, freq: 3200, type: "highpass" });
    this.noiseBurst({ duration: 0.26, gain: 0.31, freq: 700, type: "lowpass" });
    this.tone({ freq: 160, end: 58, duration: 0.21, gain: 0.38, type: "sine" });
    this.tone({ freq: 880, end: 260, duration: 0.075, gain: 0.08, type: "square" });
  }

  dry() {
    this.tone({ freq: 150, end: 120, duration: 0.04, gain: 0.08, type: "square" });
    this.noiseBurst({ duration: 0.04, gain: 0.08, freq: 1600, type: "bandpass" });
  }

  reloadStart() {
    this.noiseBurst({ duration: 0.045, gain: 0.13, freq: 2400, type: "bandpass", q: 2 });
    this.tone({ freq: 350, end: 240, duration: 0.06, gain: 0.05, type: "square" });
  }

  reloadEnd() {
    this.noiseBurst({ duration: 0.035, gain: 0.18, freq: 3000, type: "bandpass", q: 2.4 });
    this.noiseBurst({ duration: 0.05, gain: 0.12, freq: 1300, type: "bandpass", q: 2 });
    this.tone({ freq: 230, end: 170, duration: 0.07, gain: 0.09, type: "square" });
  }

  hit(head = false) {
    this.noiseBurst({ duration: 0.08, gain: head ? 0.28 : 0.18, freq: head ? 3400 : 1700, type: "bandpass", q: 1.4 });
    this.tone({ freq: head ? 980 : 420, end: head ? 640 : 280, duration: 0.09, gain: head ? 0.14 : 0.09, type: "triangle" });
    if (head) this.tone({ freq: 1900, end: 1300, duration: 0.16, gain: 0.1, type: "sine", when: 0.02 });
  }

  kill() {
    this.tone({ freq: 220, end: 330, duration: 0.1, gain: 0.12, type: "sawtooth" });
    this.tone({ freq: 330, end: 494, duration: 0.2, gain: 0.12, type: "sawtooth", when: 0.08 });
    this.noiseBurst({ duration: 0.2, gain: 0.12, freq: 900, type: "lowpass" });
  }

  civilian() {
    this.tone({ freq: 530, end: 240, duration: 0.34, gain: 0.15, type: "triangle" });
    this.tone({ freq: 720, end: 290, duration: 0.3, gain: 0.08, type: "sine", when: 0.05 });
  }

  enemyShot() {
    this.noiseBurst({ duration: 0.18, gain: 0.32, freq: 1200, type: "lowpass" });
    this.tone({ freq: 105, end: 40, duration: 0.23, gain: 0.26, type: "sine" });
  }

  hurt() {
    this.noiseBurst({ duration: 0.22, gain: 0.25, freq: 420, type: "lowpass" });
    this.tone({ freq: 92, end: 48, duration: 0.36, gain: 0.22, type: "sawtooth" });
    this.tone({ freq: 1850, end: 700, duration: 0.18, gain: 0.035, type: "sine" });
  }

  waveClear() {
    if (!this.ctx) return;
    const notes = [NOTE.a3, NOTE.c4, NOTE.e4, NOTE.a4];
    notes.forEach((f, i) => {
      this.tone({ freq: f, end: f, duration: 0.26, gain: 0.12, type: "triangle", when: i * 0.075 });
      this.tone({ freq: f * 0.5, end: f * 0.5, duration: 0.4, gain: 0.06, type: "sawtooth", when: i * 0.075 });
    });
  }

  waveStart() {
    if (!this.ctx) return;
    this.tone({ freq: 82, end: 82, duration: 0.36, gain: 0.18, type: "sawtooth" });
    this.tone({ freq: 164, end: 164, duration: 0.5, gain: 0.1, type: "triangle", when: 0.08 });
    this.tone({ freq: 246, end: 246, duration: 0.5, gain: 0.07, type: "triangle", when: 0.16 });
    this.noiseBurst({ duration: 0.35, gain: 0.12, freq: 2400, type: "highpass" });
  }

  gameOver() {
    if (!this.ctx) return;
    const notes = [NOTE.e3, NOTE.d3, NOTE.c3, NOTE.a2];
    notes.forEach((f, i) => this.tone({ freq: f, end: f * 0.98, duration: 0.5, gain: 0.15, type: "sawtooth", when: i * 0.20 }));
    this.noiseBurst({ duration: 0.7, gain: 0.12, freq: 500, type: "lowpass", when: 0.2 });
  }

  victory() {
    if (!this.ctx) return;
    const notes = [NOTE.a3, NOTE.c4, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.a4];
    notes.forEach((f, i) => {
      this.tone({ freq: f, end: f, duration: 0.35, gain: 0.11, type: "triangle", when: i * 0.11 });
      this.tone({ freq: f / 2, end: f / 2, duration: 0.42, gain: 0.07, type: "sawtooth", when: i * 0.11 });
    });
  }

  dispose() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.rainSource?.stop();
    this.ctx?.close();
  }
}
