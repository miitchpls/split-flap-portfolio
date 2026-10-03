import { CHARS } from './layout.js';

// CSS cubic-bezier timing functions, as plain functions of progress 0..1.
const curve = (s, a, b) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
const bezier = (x1, y1, x2, y2) => t => {
  let lo = 0;
  let hi = 1;
  let s = t;
  for (let i = 0; i < 24; i++) {
    const x = curve(s, x1, x2);
    if (Math.abs(x - t) < 1e-4) break;
    if (x < t) lo = s; else hi = s;
    s = (lo + hi) / 2;
  }
  return curve(s, y1, y2);
};
const easeIn = bezier(0.42, 0, 1, 1);
const easeOut = bezier(0, 0, 0.58, 1);

const write = (el, text) => {
  if (el.textContent !== text) el.textContent = text;
};

const SCRAMBLE = CHARS.replace(/[^A-Z0-9]/g, '');
const LANDING_FLAPS = 3;

// One clock drives both speeds, keeping timing independent of animation promises.
// Fast mode shortens each flip, never the stagger between cells.
export class SplitFlapBoard {
  constructor(element, { flipSpeed = 70, spinSpeed = 32, stagger = 30 } = {}) {
    this.element = element;
    this.flipSpeed = flipSpeed;
    this.spinSpeed = spinSpeed;
    this.stagger = stagger;
    this.fast = false;
    this.cells = [];
    this.cols = 0;
    this.rows = 0;
    this.running = null;
    this.jobs = [];
    this.frame = null;
    this.tick = this.tick.bind(this);
    this.sound = false;
    this.audio = null;
    this.lastClick = 0;
  }

  build(cols, rows) {
    this.cancel();
    this.cols = cols;
    this.rows = rows;
    this.cells = Array.from({ length: cols * rows }, () => this.makeCell());
    this.element.replaceChildren(...this.cells.map(cell => cell.el));
  }

  makeCell() {
    const el = document.createElement('span');
    el.className = 'flap';
    el.innerHTML = '<span class="flap-half flap-upper"><span class="glyph"> </span></span>' +
      '<span class="flap-half flap-lower"><span class="glyph"> </span></span>' +
      '<span class="flap-half flap-upper flap-fall"><span class="glyph"></span></span>' +
      '<span class="flap-half flap-lower flap-rise"><span class="glyph"></span></span>';
    const [upper, lower, fall, rise] = el.querySelectorAll('.flap-half');
    return { el, upper, lower, fall, rise, char: ' ', yellow: false };
  }

  // `cells` is rows × cols of { char, yellow }.
  show(cells, { animate = true, onSettled = () => {} } = {}) {
    this.cancel();
    const targets = cells.flat();
    if (!animate) {
      this.cells.forEach((cell, i) => this.set(cell, targets[i].char, targets[i].yellow));
      onSettled();
      return;
    }
    const now = performance.now();
    this.run(targets, this.cells.map((_, i) => now + this.delay(i)), onSettled);
  }

  // Switching mode mid-change carries on from where every flap is now,
  // keeping each cell's place in the wave.
  setFast(enabled) {
    if (enabled === this.fast) return;
    this.fast = enabled;
    const running = this.running;
    if (!running) return;
    this.cancel();
    this.run(running.targets, running.starts, running.onSettled);
  }

  // `starts` holds, for each cell, the time its first flap may fall.
  run(targets, starts, onSettled) {
    const settle = () => {
      this.running = null;
      onSettled();
    };
    this.running = { targets, starts, onSettled };
    this.showClocked(targets, starts, settle);
  }

  // The wave: later columns and rows start a little later.
  delay(index) {
    const row = Math.floor(index / this.cols);
    const col = index % this.cols;
    return (col + row * 2) * this.stagger + Math.random() * this.stagger * 4;
  }

  // Spin quickly while far away; the last few flaps land at full weight.
  steps(from, to) {
    const steps = [];
    const speed = this.fast ? 0.65 : 1;
    let index = CHARS.indexOf(from);
    let remaining = (CHARS.indexOf(to) - index + CHARS.length) % CHARS.length;
    while (remaining > 0) {
      index = (index + 1) % CHARS.length;
      steps.push({ char: CHARS[index], half: (remaining > LANDING_FLAPS ? this.spinSpeed : this.flipSpeed) * speed });
      remaining--;
    }
    return steps;
  }

  // Instantly shows a jumble of letters, ready to spin into the next screen.
  scramble() {
    this.cancel();
    this.cells.forEach((cell, i) => {
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      this.set(cell, SCRAMBLE[(row * 13 + col * 7) % SCRAMBLE.length], false);
    });
  }

  set(cell, char, yellow) {
    cell.char = char;
    cell.yellow = yellow;
    cell.el.classList.toggle('yellow', yellow);
    cell.upper.firstChild.textContent = cell.lower.firstChild.textContent = char;
  }

  showClocked(targets, starts, onSettled) {
    const now = performance.now();
    this.cells.forEach((cell, i) => {
      const { char, yellow } = targets[i];
      if (cell.char === char && cell.yellow === yellow) return;
      const start = Math.max(now, starts[i]);
      this.jobs.push({ cell, yellow, start, steps: this.steps(cell.char, char), step: 0, stepStart: start, started: false, clicked: -1 });
    });
    this.onSettled = onSettled;
    if (this.jobs.length) this.frame = requestAnimationFrame(this.tick);
    else onSettled();
  }

  tick(time) {
    let active = 0;
    for (const job of this.jobs) {
      if (job.done) continue;
      if (time < job.start) { active++; continue; }
      const { cell, steps } = job;
      if (!job.started) {
        job.started = true;
        cell.yellow = job.yellow;
        cell.el.classList.toggle('yellow', job.yellow);
      }
      // Land every flap that has fully finished by now.
      while (job.step < steps.length && time >= job.stepStart + 2 * steps[job.step].half) {
        job.stepStart += 2 * steps[job.step].half;
        cell.char = steps[job.step].char;
        job.step++;
      }
      if (job.step === steps.length) {
        job.done = true;
        this.rest(cell);
        continue;
      }
      active++;
      if (job.clicked !== job.step) {
        job.clicked = job.step;
        this.click();
      }
      const { char: next, half } = steps[job.step];
      this.pose(cell, cell.char, next, (time - job.stepStart) / half);
    }
    if (active) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    this.frame = null;
    this.jobs = [];
    this.onSettled();
  }

  // Progress 0..1: the OLD upper half falls and uncovers the NEW one.
  // Progress 1..2: the NEW lower half lands over the OLD one.
  pose(cell, old, next, progress) {
    write(cell.upper.firstChild, next);
    write(cell.lower.firstChild, old);
    if (progress < 1) {
      write(cell.fall.firstChild, old);
      cell.fall.style.visibility = 'visible';
      cell.fall.style.transform = `rotateX(${-90 * easeIn(progress)}deg)`;
      cell.rise.style.visibility = '';
    } else {
      write(cell.rise.firstChild, next);
      cell.fall.style.visibility = '';
      cell.rise.style.visibility = 'visible';
      cell.rise.style.transform = `rotateX(${90 * (1 - easeOut(progress - 1))}deg)`;
    }
  }

  // A flap at rest on its last landed character.
  rest(cell) {
    write(cell.upper.firstChild, cell.char);
    write(cell.lower.firstChild, cell.char);
    cell.fall.style.visibility = cell.rise.style.visibility = '';
    cell.fall.style.transform = cell.rise.style.transform = '';
  }

  // Stops every flap on its last completed character.
  cancel() {
    this.running = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
    for (const job of this.jobs) if (!job.done) this.rest(job.cell);
    this.jobs = [];
  }

  setSound(enabled) {
    this.sound = enabled;
    if (enabled) this.audio?.resume();
  }

  // Creates the audio context and asks it to start; call it from a user
  // gesture. Resolves once the browser has answered.
  unlockAudio() {
    if (!this.audio) {
      try {
        const context = new AudioContext();
        const length = Math.ceil(context.sampleRate * 0.012);
        const noise = context.createBuffer(1, length, context.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        this.audio = context;
        this.noise = noise;
      } catch {
        // No Web Audio: the board simply stays silent.
        return Promise.resolve();
      }
    }
    return this.audio.resume().catch(() => {});
  }

  // A short filtered noise burst; throttled so a full board stays pleasant.
  click() {
    const context = this.audio;
    if (!this.sound || !context || context.currentTime - this.lastClick < 0.008) return;
    const now = this.lastClick = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000 + Math.random() * 1000;
    filter.Q.value = 1.5;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.08 + Math.random() * 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(now);
    source.stop(now + 0.012);
  }

  destroy() {
    this.cancel();
    this.audio?.close();
    this.element.replaceChildren();
    this.cells = [];
  }
}
