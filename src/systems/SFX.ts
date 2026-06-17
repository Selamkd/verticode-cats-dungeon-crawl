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
}

export const sfx = new SFX();