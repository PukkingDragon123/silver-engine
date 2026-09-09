/* Inline index.html + css + js into one self-contained page.
   Used for the Claude artifact build, which cannot load sibling files.
   Run: node tools/build-artifact.mjs */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root, p), 'utf8');

const html = read('index.html');
const css = read('css/style.css');
const scripts = ['js/font.js', 'js/data.js', 'js/ai.js', 'js/audio.js', 'js/sprites.js', 'js/game.js'];

// the artifact host supplies <!doctype>, <head> and <body>, so take the body
// content only and carry the <title> across ourselves
const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'THE WISE OAK TREE'])[1];
const body = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.indexOf('</body>'))
  .replace(/\s*<script src="[^"]+"><\/script>/g, '')
  .trim();

const out = [
  `<title>${title}</title>`,
  '<style>',
  css.trim(),
  '</style>',
  body,
  ...scripts.map(f => `<script>\n${read(f).trim()}\n</script>`)
].join('\n');

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/wise-oak-tree.html'), out + '\n');

const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log(`dist/wise-oak-tree.html  ${kb} KB`);
if (/<script src=/.test(out) || /<link /.test(out)) {
  console.error('ERROR: an external reference survived inlining');
  process.exit(1);
}
