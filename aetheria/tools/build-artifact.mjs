/* Inline index.html + css + js into one self-contained page, for hosts that
   cannot load sibling files.  Run: node tools/build-artifact.mjs */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root, p), 'utf8');

const html = read('index.html');
const css = read('css/style.css');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'AETHERIA'])[1];
const body = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.indexOf('</body>'))
  .replace(/\s*<script src="[^"]+"><\/script>/g, '')
  .trim();

const out = [
  `<title>${title}</title>`,
  '<style>', css.trim(), '</style>',
  body,
  ...scripts.map(f => `<script>\n${read(f).trim()}\n</script>`)
].join('\n');

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/aetheria.html'), out + '\n');

console.log(`dist/aetheria.html  ${(Buffer.byteLength(out)/1024).toFixed(1)} KB  (${scripts.length} scripts)`);
if (/<script src=/.test(out) || /<link /.test(out)) { console.error('ERROR: an external reference survived inlining'); process.exit(1); }
