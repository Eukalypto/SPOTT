import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const built = path.join(root, 'demo/playable/index.html');
const out = path.join(root, 'demo/spott-playable.html');

let html = readFileSync(built, 'utf8');

// Classic scripts in <head> run before <body>, so #app is missing.
// Vite modules were deferred; after inlining we must place the script after #app.
const scriptMatch = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/);
if (!scriptMatch) {
  throw new Error('Expected an inlined <script> in the Vite build output');
}

const scriptTag = scriptMatch[0]
  .replace('<script type="module" crossorigin>', '<script>')
  .replace('<script type="module">', '<script>');

html = html.replace(scriptMatch[0], '');

if (!html.includes('<div id="app"></div>')) {
  throw new Error('Expected <div id="app"></div> in the Vite build output');
}

html = html.replace(
  '<div id="app"></div>',
  `<div id="app"></div>\n    ${scriptTag}`,
);

writeFileSync(out, html);
copyFileSync(out, built);
console.log(`Wrote ${path.relative(root, out)}`);
