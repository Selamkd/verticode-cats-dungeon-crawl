type WebAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

class SFX {
  private ctx: AudioContext | null = null;

  constructor() {
    const audioWindow = window as WebAudioWindow;
    const AudioContextCtor =
      audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

    if (!AudioContextCtor) return;

    try {
      this.ctx = new AudioContextCtor();
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.15,
    decay = 0.8,
  ) {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration * decay,
    );

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  step() {
    this.tone(200 + Math.random() * 60, 0.06, 'triangle', 0.06);
  }

  fuseOk() {
    this.tone(523, 0.12, 'sine', 0.18);

    window.setTimeout(() => {
      this.tone(659, 0.12, 'sine', 0.18);
    }, 80);

    window.setTimeout(() => {
      this.tone(784, 0.2, 'sine', 0.22);
    }, 160);
  }

  fuseFail() {
    this.tone(120, 0.3, 'sawtooth', 0.2);
    this.tone(100, 0.35, 'square', 0.1);
  }

  tick() {
    this.tone(800, 0.04, 'sine', 0.08);
  }

  seq() {
    this.tone(440, 0.15, 'sine', 0.15);
  }

  win() {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      window.setTimeout(() => {
        this.tone(frequency, 0.25, 'sine', 0.2);
      }, index * 120);
    });
  }

  lose() {
    this.tone(220, 0.6, 'sawtooth', 0.15);
    this.tone(180, 0.8, 'sawtooth', 0.1);
  }

  select() {
    this.tone(660, 0.1, 'sine', 0.12);
  }

  start() {
    this.tone(392, 0.08, 'triangle', 0.12);

    window.setTimeout(() => {
      this.tone(523, 0.12, 'triangle', 0.14);
    }, 80);
  }


    private glide(
    startFrequency: number,
    peakFrequency: number,
    endFrequency: number,
    duration: number,
    type: OscillatorType = 'triangle',
    volume = 0.14,
  ) {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.linearRampToValueAtTime(
      peakFrequency,
      now + duration * 0.35,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      now + duration,
    );

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(7, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  meow() {
    this.glide(420, 720, 260, 0.42, 'triangle', 0.16);

    window.setTimeout(() => {
      this.glide(520, 760, 340, 0.28, 'sine', 0.07);
    }, 35);
  }

  tinyMeow() {
    this.glide(620, 920, 460, 0.22, 'triangle', 0.11);
  }

  sadMeow() {
    this.glide(360, 520, 180, 0.65, 'sawtooth', 0.12);
  }

  attentionSiren() {
    this.glide(500, 980, 300, 0.55, 'sawtooth', 0.15);

    window.setTimeout(() => {
      this.glide(620, 1100, 360, 0.45, 'triangle', 0.1);
    }, 130);
  }
}

export const sfx = new SFX();