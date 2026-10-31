import { defineConfig } from 'vite';
import { HOME, SCREENS } from './src/content.js';
import { isAction } from './src/layout.js';

const escape = text => text.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const plain = text => text.replace(/[[\]]/g, '').replace(/ {2,}/g, ' ').trim();
const same = (a, b) => plain(a).toUpperCase() === plain(b).toUpperCase();
// "About me (2/7)" -> "About me": chapters of one story share a heading.
const baseTitle = title => title.replace(/\s*\(\d+\/\d+\)$/, '');

// Screens in the order a visitor meets them: depth first through the menus,
// starting from home. Screens no menu reaches come last.
function readingOrder() {
  const order = [];
  const seen = new Set();
  const visit = (name, depth) => {
    if (!SCREENS[name] || seen.has(name)) return;
    seen.add(name);
    order.push({ name, depth });
    for (const line of SCREENS[name].lines) if (isAction(line) && line.to) visit(line.to, depth + 1);
  };
  visit(HOME, 0);
  for (const name of Object.keys(SCREENS)) visit(name, 1);
  return order;
}

// The whole portfolio as plain HTML, for crawlers, AI tools and visitors
// without JavaScript. Menu rows are dropped: the reading order replaces them.
function textVersion() {
  const out = [];
  let section = null;
  for (const { name, depth } of readingOrder()) {
    const screen = SCREENS[name];
    const title = baseTitle(screen.title);
    if (name !== HOME && title !== section) {
      const level = Math.min(depth + 1, 3);
      out.push(`<h${level}>${escape(title)}</h${level}>`);
    }
    section = title;
    for (const line of screen.lines) {
      if (isAction(line)) {
        if (line.href) out.push(`<p><a href="${escape(line.href)}" target="_blank" rel="noopener noreferrer">${escape(line.label ?? plain(line.text))}</a></p>`);
      } else if (plain(line) && (name === HOME || !same(line, title))) {
        // The first line of home is the name: the page heading when the board is hidden.
        const tag = name === HOME && !out.length ? 'h1' : 'p';
        out.push(`<${tag}>${escape(plain(line))}</${tag}>`);
      }
    }
  }
  return out.map(line => `      ${line}`).join('\n');
}

// Fills <noscript id="text-version"> in the built page; dev is left alone.
const textVersionPlugin = {
  name: 'text-version',
  apply: 'build',
  transformIndexHtml(html) {
    const target = /(<noscript id="text-version">[\s\S]*?)(\s*<\/noscript>)/;
    if (!target.test(html)) throw new Error('index.html: <noscript id="text-version"> not found');
    return html.replace(target, (_, start, end) => `${start}\n${textVersion()}${end}`);
  },
};

export default defineConfig({ plugins: [textVersionPlugin] });
