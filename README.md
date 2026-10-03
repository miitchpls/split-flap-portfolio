# Split-flap portfolio

A fullscreen portfolio inspired by vintage departure boards. Built with **HTML, CSS and vanilla JavaScript**, with Vite for development and production builds. No frameworks, no runtime dependencies, and no backend.

## Run

```sh
npm ci
npm run dev -- --port 5173
```

Open http://localhost:5173/.

## Controls

- Press the number beside an item, or click its row, to choose a destination.
- Press `0` to go back where shown, or `Esc` to return to the home screen.
- The icons at the bottom right turn sound and animation on or off; the lightning bolt makes the flaps spin faster, straight away, even halfway through a screen change.

## Editing screens

Everything you need to edit is in `src/content.js`:

```js
projects: {
  title: 'Projects',              // browser tab and screen readers
  align: 'left',                  // optional: 'left' or 'center'
  valign: 'center',               // optional: 'center' or 'top'
  lines: [
    'PROJECTS',
    'IDEAS, [IN CODE]',           // [brackets] land on yellow flaps
    '',                           // blank row
    { key: '1', text: 'SPLIT-FLAP PORTFOLIO', to: 'split-flap' },  // menu row
    { key: '2', text: 'GITHUB', label: 'GitHub', href: 'https://github.com/miitchpls' },  // link row
    { key: '0', text: 'BACK TO MENU', to: 'home' },
  ],
},
```

- Long lines wrap by themselves on spaces and hyphens; menu rows keep their text aligned after the key.
- Menu rows are shown as `[key]  TEXT` with the key on a yellow flap. The key and a click on the row both open the `to` screen.
- Link rows look the same but open `href` in a new tab, so the portfolio stays open.
- Rows respond (hover, click, key) only once every flap has landed.
- `label` (optional) is the name read to screen readers; otherwise it comes from `text`.
- Text is uppercased and accents are removed; characters missing from the drum (`CHARS` in `src/layout.js`) are shown as blanks.
- `SETTINGS` controls flip speed, the wave stagger, default alignment, the blank side columns and the column count for large, medium and phone screens.

The board fills the available space: the column count follows the screen width, the row count follows the height. If the longest screen needs more rows than fit, the cells shrink so every screen always fits.

## Files

- `src/content.js`: screens and settings — the only file you need to edit.
- `src/layout.js`: text wrapping, placement and board sizing (no DOM).
- `src/board.js`: the split-flap board — flap animation and click sound.
- `src/main.js`: navigation, resizing, sound and animation controls.
- `src/style.css`: layout and appearance. All colours live in the `:root` palette.
- `index.html`: page structure and controls.