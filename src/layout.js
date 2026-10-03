// Pure text and geometry helpers: no DOM, so they run in Node tests too.

// The drum order every flap cycles through. Blank must stay first.
export const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?'-/&@·";

const normalize = text => text.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const isAction = line => typeof line === 'object' && line !== null;

export const actionsOf = screen => screen.lines.filter(isAction);

const actionSource = action => `[${action.key}]  ${action.text}`;

// "BACK TO MENU" -> "1 — Back to menu"; links also say where they open.
export function actionLabel(action) {
  const text = action.text.replace(/[[\]]/g, '').toLowerCase();
  const name = action.label ?? `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  return `${action.key} — ${name}${action.href ? ' (opens in a new tab)' : ''}`;
}

// "[AB]C" -> { s: "ABC", m: [true, true, false] }
export function parse(text) {
  let s = '';
  const m = [];
  let yellow = false;
  for (const ch of normalize(text)) {
    if (ch === '[') { yellow = true; continue; }
    if (ch === ']') { yellow = false; continue; }
    const c = CHARS.includes(ch) ? ch : ' ';
    s += c;
    m.push(yellow && c !== ' ');
  }
  return { s, m };
}

// Word-wraps one line, keeping the yellow marks. Continuation rows are
// indented by `hang` columns; words longer than a row are split.
export function wrap(text, width, hang = 0) {
  const { s, m } = parse(text);
  const out = [];
  let start = 0;
  let indent = 0;
  while (start < s.length) {
    const room = Math.max(1, width - indent);
    let end = Math.min(start + room, s.length);
    if (end < s.length) {
      // Break at a space or after a hyphen, never inside a menu key prefix.
      const min = start + (out.length ? 1 : hang + 1);
      for (let i = end; i >= min; i--) {
        if ((s[i] === ' ' || s[i - 1] === '-') && s.slice(start, i).trim()) { end = i; break; }
      }
    }
    const piece = s.slice(start, end).replace(/ +$/, '');
    out.push({
      s: ' '.repeat(indent) + piece,
      m: [...Array(indent).fill(false), ...m.slice(start, start + piece.length)],
    });
    start = end;
    while (s[start] === ' ') start++;
    indent = Math.min(hang, width - 1);
  }
  return out.length ? out : [{ s: '', m: [] }];
}

// Wraps a whole screen for a board `cols` wide. Action rows remember
// where they start and how many rows they take.
export function layoutScreen(screen, cols, settings) {
  const width = Math.max(1, cols - 2 * settings.inset);
  const rows = [];
  const actions = [];
  for (const line of screen.lines) {
    const action = isAction(line) ? line : null;
    const wrapped = action
      ? wrap(actionSource(action), width, action.key.length + 2)
      : wrap(line, width);
    if (action) actions.push({ ...action, row: rows.length, span: wrapped.length });
    rows.push(...wrapped);
  }
  return {
    rows,
    actions,
    align: screen.align ?? settings.align,
    valign: screen.valign ?? settings.valign,
  };
}

// Rows needed so that every screen fits on a board `cols` wide.
export const requiredRows = (screens, cols, settings) =>
  Math.max(1, ...Object.values(screens).map(screen => layoutScreen(screen, cols, settings).rows.length));

// Positions a wrapped screen on the board: one { char, yellow } per cell.
export function placeScreen(layout, cols, rows, settings) {
  const lines = layout.rows.slice(0, rows);
  const top = layout.valign === 'center' ? Math.floor((rows - lines.length) / 2) : 0;
  const cells = Array.from({ length: rows }, (_, r) => {
    const { s, m } = lines[r - top] ?? { s: '', m: [] };
    const lead = layout.align === 'center' ? Math.floor((cols - s.length) / 2) : settings.inset;
    return Array.from({ length: cols }, (_, c) => {
      const k = c - lead;
      const inside = k >= 0 && k < s.length;
      return { char: inside ? s[k] : ' ', yellow: inside && Boolean(m[k]) };
    });
  });
  const actions = layout.actions
    .filter(action => action.row < rows)
    .map(action => ({ ...action, row: action.row + top, span: Math.min(action.span, rows - action.row) }));
  return { cells, actions };
}

// Fills the available area with as many rows as fit; shrinks the cells
// when the longest screen would not fit otherwise.
export function measureBoard(width, height, settings, minRows) {
  const { wide, medium, narrow } = settings.columns;
  const cols = width >= 1000 ? wide : width >= 640 ? medium : narrow;
  const gapRatio = 0.1;
  const rowGapRatio = 0.08;
  const aspect = 0.7;
  let cellWidth = width / (cols + (cols - 1) * gapRatio);
  let cellHeight = cellWidth / aspect;
  // A zero-width area would give zero-size cells and endless rows.
  let rows = cellHeight > 0 ? Math.floor((height + cellHeight * rowGapRatio) / (cellHeight * (1 + rowGapRatio))) : 0;
  const needed = minRows(cols);
  if (rows < needed) {
    rows = needed;
    cellHeight = height / (rows + (rows - 1) * rowGapRatio);
    cellWidth = cellHeight * aspect;
  }
  return { cols, rows, cellWidth, cellHeight, gap: cellWidth * gapRatio, rowGap: cellHeight * rowGapRatio };
}

// Plain text of a screen, for screen readers.
export const screenText = screen => screen.lines
  .map(line => isAction(line) ? `${line.key}, ${line.text}` : line)
  .filter(Boolean)
  .join('. ')
  .replace(/[[\]]/g, '');
