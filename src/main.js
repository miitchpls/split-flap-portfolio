import { SplitFlapBoard } from './board.js';
import { HOME, SCREENS, SETTINGS } from './content.js';
import { actionLabel, actionsOf, layoutScreen, measureBoard, placeScreen, requiredRows, screenText } from './layout.js';

const cabinet = document.querySelector('.cabinet');
const surface = document.querySelector('.board-surface');
const actions = document.querySelector('.board-actions');
const announcement = document.querySelector('#announcement');
const soundButton = document.querySelector('#sound');
const motionButton = document.querySelector('#motion');
const fastButton = document.querySelector('#fast');
const events = new AbortController();
const listenerOptions = { signal: events.signal };
const board = new SplitFlapBoard(document.querySelector('#board'), SETTINGS);
const minRows = cols => requiredRows(SCREENS, cols, SETTINGS);

// The <title> in index.html is the base; other screens add their own title.
const SITE_TITLE = document.title;

let page = HOME;
let renderedPage = null;
let geometry = null;
let busy = true;
let sound = true;
let motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let started = false;
let introTimer;

function setBusy(value) {
  busy = value;
  cabinet.setAttribute('aria-busy', String(value));
  for (const control of actions.children) control.setAttribute('aria-disabled', String(value));
}

// Sizes the board to the space available. Returns true when the number of
// rows or columns changed, which means the current screen must be redrawn.
function fit() {
  const next = measureBoard(surface.clientWidth, surface.clientHeight, SETTINGS, minRows);
  for (const [name, value] of Object.entries({
    '--cols': next.cols, '--rows': next.rows,
    '--board-width': `${next.cols * next.cellWidth + (next.cols - 1) * next.gap}px`,
    '--cell-width': `${next.cellWidth}px`, '--cell-height': `${next.cellHeight}px`,
    '--gap': `${next.gap}px`, '--row-gap': `${next.rowGap}px`,
  })) cabinet.style.setProperty(name, value);
  const rebuild = !geometry || next.cols !== geometry.cols || next.rows !== geometry.rows;
  geometry = next;
  if (rebuild) board.build(next.cols, next.rows);
  return rebuild;
}

function render(animate = motion) {
  clearTimeout(introTimer);
  started = true;
  const screen = SCREENS[page];
  const plan = placeScreen(layoutScreen(screen, geometry.cols, SETTINGS), geometry.cols, geometry.rows, SETTINGS);
  cabinet.setAttribute('aria-label', `Split-flap display — ${screen.title}`);
  document.title = page === HOME ? SITE_TITLE : `${SITE_TITLE} — ${screen.title}`;
  cabinet.dataset.motion = motion ? 'animated' : 'reduced';
  announcement.textContent = '';
  // Rows are rebuilt below; remember whether keyboard focus was on one.
  const focusedKey = actions.contains(document.activeElement) ? document.activeElement.dataset.key : null;
  actions.replaceChildren(...plan.actions.map(action => {
    const control = document.createElement(action.href ? 'a' : 'button');
    if (action.href) {
      // Links open in a new tab, so the portfolio stays where it is.
      Object.assign(control, { href: action.href, target: '_blank', rel: 'noopener noreferrer' });
    } else {
      control.type = 'button';
      control.dataset.page = action.to;
    }
    control.dataset.key = action.key;
    control.style.gridRow = `${action.row + 1} / span ${action.span}`;
    control.setAttribute('aria-label', actionLabel(action));
    return control;
  }));
  // Keep focus on the board: the same row after a redraw, the first row on a new screen.
  if (focusedKey !== null) {
    const target = page === renderedPage ? actions.querySelector(`[data-key="${focusedKey}"]`) : null;
    (target ?? actions.firstElementChild)?.focus({ preventScroll: true });
  }
  renderedPage = page;
  setBusy(true);
  board.show(plan.cells, {
    animate,
    onSettled() {
      setBusy(false);
      announcement.textContent = screenText(screen);
    },
  });
}

function go(destination) {
  if (busy || destination === page || !SCREENS[destination]) return;
  page = destination;
  render();
}

function updateControls() {
  soundButton.setAttribute('aria-pressed', String(sound));
  motionButton.setAttribute('aria-pressed', String(motion));
  fastButton.setAttribute('aria-pressed', String(board.fast));
}

actions.addEventListener('click', event => {
  // Links, too, wait for the flaps: Enter on a focused link still fires a click.
  if (busy) { event.preventDefault(); return; }
  const button = event.target.closest('button[data-page]');
  if (button) go(button.dataset.page);
}, listenerOptions);

window.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat ||
      event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const action = actionsOf(SCREENS[page]).find(action => action.key === event.key);
  if (event.key !== 'Escape' && !action) return;
  // A shortcut is not aimed at whatever was clicked last (say, a footer icon):
  // let go of it, so it does not light up with a keyboard focus ring.
  if (!actions.contains(document.activeElement)) document.activeElement?.blur();
  if (event.key === 'Escape') { go(HOME); return; }
  event.preventDefault();
  if (busy) return;
  if (action.href) actions.querySelector(`a[data-key="${action.key}"]`)?.click();
  else go(action.to);
}, listenerOptions);

// Browsers only allow audio after a user gesture, and not every event counts:
// phones wait for the finger to lift, and keys like Esc or Shift never count.
// Keep trying on each interaction, before it is handled, until audio runs.
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'keydown'];
const unlockAudio = async () => {
  await board.unlockAudio();
  if (board.audio && board.audio.state !== 'running') return;
  for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlockAudio, true);
};
for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlockAudio, { capture: true, signal: events.signal });

soundButton.addEventListener('click', () => {
  sound = !sound;
  board.setSound(sound);
  updateControls();
}, listenerOptions);

// Takes effect at once, even halfway through a screen change.
fastButton.addEventListener('click', () => {
  board.setFast(!board.fast);
  updateControls();
}, listenerOptions);

motionButton.addEventListener('click', () => {
  motion = !motion;
  updateControls();
  if (motion) board.scramble();
  render();
}, listenerOptions);

// A resize that changes the grid lands on the current screen immediately.
const observer = new ResizeObserver(() => {
  if (fit() && started) render(false);
});

updateControls();
board.setSound(sound);
fit();
observer.observe(surface);
if (motion) board.scramble();
else render();

// Browser chrome on mobile takes its colour from the palette.
const themeColor = Object.assign(document.createElement('meta'), { name: 'theme-color' });
themeColor.content = getComputedStyle(document.documentElement).getPropertyValue('--charcoal').trim();
document.head.append(themeColor);

// Reveal the page once the board font has loaded (or after a short wait),
// so nothing flashes in a fallback font; then the flaps spin in.
const fontLoaded = Promise.all(['500', '600'].map(weight => document.fonts.load(`${weight} 1em "Barlow Condensed"`)));
Promise.race([fontLoaded.catch(() => {}), new Promise(resolve => setTimeout(resolve, 2000))]).then(() => {
  document.documentElement.classList.add('ready');
  if (motion && !started) introTimer = setTimeout(render, 350);
});

function dispose() {
  clearTimeout(introTimer);
  observer.disconnect();
  events.abort();
  board.destroy();
}

window.addEventListener('pagehide', event => {
  if (!event.persisted) dispose();
}, listenerOptions);
if (import.meta.hot) import.meta.hot.dispose(dispose);
