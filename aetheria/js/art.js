/* =========================================================================
   ART — the look of the place.

   Two halves. Small things (icons, creatures, props) are hand-placed pixels
   written as character grids with a palette per sprite. Big things (islands,
   trees, buildings) are drawn procedurally out of 1px rectangles, which is
   still pixel art — it just means a sawmill can be five different sizes
   without me typing it out five times.
   ========================================================================= */
const ART = (() => {
  const cache = new Map();
  const warned = [];

  /* build a canvas from a character grid */
  function build(rows, pal) {
    const h = rows.length, w = rows[0].length;
    for (const r of rows) if (r.length !== w) warned.push(`ragged row (${r.length} vs ${w}): "${r}"`);
    const cv = surface(w,h), c = cv.getContext('2d');
    for (let y=0;y<h;y++) for (let x=0;x<rows[y].length;x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) { warned.push(`no palette entry '${ch}'`); continue; }
      c.fillStyle = col; c.fillRect(x,y,1,1);
    }
    return cv;
  }

  /* a sprite, optionally with some palette keys overridden (pet colours,
     shirt colours, elemental variants of the same monster) */
  function get(name, swap) {
    const key = swap ? name + '|' + JSON.stringify(swap) : name;
    if (cache.has(key)) return cache.get(key);
    const d = SPR[name];
    if (!d) { console.warn('missing sprite', name); return surface(1,1); }
    const pal = swap ? Object.assign({}, d.pal, swap) : d.pal;
    const cv = build(d.rows, pal);
    cache.set(key, cv);
    return cv;
  }

  /* ---------------------------------------------------------------------- */
  const SPR = {};

  /* ==== ICONS — 12x12, chunky enough to read at 1x on a phone ============ */
  const ICO = (name, pal, rows) => { SPR['i_'+name] = { pal, rows }; };

  ICO('wood', { k:'#4a2a12', b:'#b9773d', d:'#8a5328', l:'#e0a866' }, [
    '............',
    '.kkkkkkkkkk.',
    'kbblbbbbbbdk',
    'kblllbbbbbdk',
    'kbbllbbbbbdk',
    'kbbbbbbbbbdk',
    'kbbbbbbbbbdk',
    'kddddddddddk',
    '.kkkkkkkkkk.',
    '............',
    '............',
    '............'
  ]);
  ICO('stone', { k:'#2f3852', b:'#9aa6c4', d:'#6b789c', l:'#cfd9ee' }, [
    '............',
    '.....kk.....',
    '...kkllkk...',
    '..kbllbbbk..',
    '.kbbbbbbbdk.',
    'kbbbbbbbdddk',
    'kbbbbbbddddk',
    'kdbbbdddddkk',
    '.kddddddkk..',
    '..kkkkkkk...',
    '............',
    '............'
  ]);
  ICO('essence', { k:'#20105a', b:'#a35cff', d:'#6a27c8', l:'#e0b6ff', w:'#ffffff' }, [
    '.....kk.....',
    '....kllk....',
    '...kbllbk...',
    '..kbblbbbk..',
    '.kbbblbbbdk.',
    'kbbbblbbbddk',
    'kbbbwlbbbddk',
    '.kbbblbbddk.',
    '..kbblbddk..',
    '...kbbddk...',
    '....kddk....',
    '.....kk.....'
  ]);
  ICO('gem', { k:'#0d3a4a', b:'#46ecd5', d:'#1a9e93', l:'#c9fff4', w:'#ffffff' }, [
    '............',
    '..kkkkkkkk..',
    '.klllbbbbdk.',
    'kwlbbbbbbddk',
    'kllbbbbbbddk',
    '.kbbbbbbbddk',
    '.kbbbbbbddk.',
    '..kbbbbddk..',
    '...kbbddk...',
    '....kddk....',
    '.....kk.....',
    '............'
  ]);
  ICO('coin', { k:'#7a4a06', b:'#ffd23f', d:'#f0a022', l:'#fff0a8' }, [
    '............',
    '...kkkkkk...',
    '..kllbbbdk..',
    '.klbbbbbbdk.',
    'klbbkkkbbddk',
    'klbbkddkbddk',
    'klbbkddkbddk',
    '.kbbkkkbddk.',
    '.kbbbbbbddk.',
    '..kdddddk...',
    '...kkkkk....',
    '............'
  ]);
  ICO('heart', { k:'#5c0c1e', R:'#ff4d5e', W:'#ff97a4', d:'#c31f3f' }, [
    '............',
    '..kk..kk....',
    '.kRRkkRRk...',
    'kRWRRRRRRk..',
    'kRWRRRRRRk..',
    'kRRRRRRRdk..',
    '.kRRRRRdk...',
    '..kRRRdk....',
    '...kRdk.....',
    '....kk......',
    '............',
    '............'
  ]);
  ICO('star', { k:'#7a4a06', b:'#ffd23f', l:'#fff0a8', d:'#f0a022' }, [
    '.....kk.....',
    '.....kk.....',
    '....kllk....',
    'kkkkkllkkkkk',
    'kllllbbllldk',
    '.kbbbbbbbdk.',
    '..kbbbbbdk..',
    '..kbbbbbdk..',
    '.kbbkddkbdk.',
    'kbbk...kddk.',
    'kk.......kk.',
    '............'
  ]);
  ICO('trophy', { k:'#7a4a06', b:'#ffd23f', l:'#fff0a8', d:'#f0a022', w:'#c08a4a' }, [
    '.kkkkkkkkkk.',
    '.kllbbbbbdk.',
    'kkbbbbbbbbdk',
    'kbkbbbbbbkdk',
    'kbkbbbbbbkdk',
    'kkbbbbbbbdkk',
    '.kdbbbbbddk.',
    '..kkdbbdkk..',
    '....kbbk....',
    '...kwwwwk...',
    '..kwwwwwwk..',
    '..kkkkkkkk..'
  ]);
  ICO('sword', { k:'#2a2140', b:'#d9e4ff', l:'#ffffff', d:'#8e9bb5', w:'#b9773d', g:'#ffd23f' }, [
    '..........kk',
    '.........kbk',
    '........kblk',
    '.......kbllk',
    '......kbllbk',
    '.....kbllbdk',
    '....kbllbdk.',
    '.kk.kbbbdk..',
    'kgkkbbdk....',
    '.kgggdk.....',
    '..kwgk......',
    '...kk.......'
  ]);
  ICO('shield', { k:'#2a2140', b:'#49a7ff', l:'#a8dcff', d:'#2358c9', g:'#ffd23f' }, [
    '.kkkkkkkkkk.',
    'klllbbbbbbdk',
    'klbbbbbbbbdk',
    'klbbbggbbbdk',
    'klbbgggbbbdk',
    'klbbbggbbbdk',
    'klbbbggbbbdk',
    '.kbbbbbbbdk.',
    '.kdbbbbbddk.',
    '..kdbbbddk..',
    '...kdbddk...',
    '....kkkk....'
  ]);
  ICO('book', { k:'#3a1a10', b:'#ff4d5e', d:'#c31f3f', w:'#fffdf5', g:'#ffd23f', s:'#e7dcc6' }, [
    '.kkkkkkkkkk.',
    'kbbbbbkddddk',
    'kbwwwwkssssk',
    'kbwwwwkssssk',
    'kbwggwkssssk',
    'kbwgwwkssssk',
    'kbwwwwkssssk',
    'kbwwwwkssssk',
    'kbwwwwkssssk',
    'kbbbbbkddddk',
    '.kkkkkkkkkk.',
    '............'
  ]);
  ICO('flask', { k:'#231a3a', b:'#3fe07a', l:'#c3ff4d', g:'#d9e4ff', w:'#ffffff' }, [
    '...kkkkkk...',
    '...kggggk...',
    '....kggk....',
    '....kggk....',
    '...kgggggk..',
    '..kgbbbbbgk.',
    '.kgbbwbbbbgk',
    '.kgblbbbbbgk',
    '.kgbbbbbbbgk',
    '..kgbbbbbgk.',
    '...kkkkkkk..',
    '............'
  ]);
  ICO('clock', { k:'#231a3a', b:'#fffdf5', d:'#9a8fb5', r:'#ff4d5e', g:'#ffd23f' }, [
    '...kkkkkk...',
    '..kbbbbbbk..',
    '.kbbdbdbbbk.',
    'kbbbbdbbbbdk',
    'kbdbbdbbbbdk',
    'kbbbbdrrbbdk',
    'kbbbbbbbbbdk',
    'kbdbbbbbbbdk',
    '.kbbbbbbbdk.',
    '..kdbbbbdk..',
    '...kkkkkk...',
    '............'
  ]);
  ICO('bolt', { k:'#6b4a00', b:'#ffd23f', l:'#fff0a8', d:'#f0a022' }, [
    '......kkk...',
    '.....kllk...',
    '....kllbk...',
    '...kllbbk...',
    '..kllbkkk...',
    '..kbbbbbbk..',
    '..kkkkbbdk..',
    '....kbbdk...',
    '....kbdk....',
    '...kbdk.....',
    '...kdk......',
    '...kk.......'
  ]);
  ICO('egg', { k:'#4a3a1a', b:'#fffdf5', d:'#d9cdb0', s:'#46ecd5', l:'#ffffff' }, [
    '....kkkk....',
    '...klbbbk...',
    '..klbbbbbk..',
    '.klbbsbbbdk.',
    'klbbbsbbbddk',
    'klbbbbbbbddk',
    'kbbbsbbbsddk',
    'kbbbbbbbbddk',
    'kbbbbbbbdddk',
    '.kdbbbbdddk.',
    '..kddddddk..',
    '...kkkkkk...'
  ]);
  ICO('paw', { k:'#3a2410', b:'#ffb26b', d:'#d9803a' }, [
    '............',
    '.kk..kk..kk.',
    'kbbkkbbkkbbk',
    'kbbkkbbkkbbk',
    '.kk..kk..kk.',
    '...kkkkkk...',
    '..kbbbbbbk..',
    '.kbbbbbbbbk.',
    '.kbbbbbbbbk.',
    '..kdbbbbdk..',
    '...kkkkkk...',
    '............'
  ]);
  ICO('lock', { k:'#231a3a', b:'#9aa6c4', d:'#6b789c', g:'#ffd23f' }, [
    '............',
    '...kkkkk....',
    '..kdk.kdk...',
    '..kdk.kdk...',
    '.kkkkkkkkk..',
    'kbbbbbbbbbk.',
    'kbbbbgbbbbk.',
    'kbbbggbbbbk.',
    'kbbbbgbbbbk.',
    'kbbbbbbbbbk.',
    '.kkkkkkkkk..',
    '............'
  ]);
  ICO('speaker', { k:'#231a3a', b:'#fffdf5', d:'#9a8fb5', g:'#46ecd5' }, [
    '............',
    '......kk....',
    '.....kbk.g..',
    '..kkkbbk.gg.',
    '..kbbbbkg.g.',
    '..kbbbbkg.g.',
    '..kbbbbkg.g.',
    '..kkkbbk.gg.',
    '.....kbk.g..',
    '......kk....',
    '............',
    '............'
  ]);
  ICO('flame', { k:'#7a1a00', b:'#ff9330', l:'#ffd23f', w:'#fff0a8', d:'#ff4d5e' }, [
    '.....kk.....',
    '....kbk.....',
    '...kblkk....',
    '..kbllbdk...',
    '..kbllbdk...',
    '.kdbllbbdk..',
    '.kdblwlbbdk.',
    'kddblwwlbddk',
    'kddbllwlbddk',
    'kddbbllbbddk',
    '.kdddbbdddk.',
    '..kkkkkkkk..'
  ]);

  /* ==== PROPS — small world objects ===================================== */
  SPR.flower = { pal:{ k:'#1e4a12', s:'#35ad3c', p:'#ff5fb8', y:'#ffd23f', w:'#ffffff' }, rows:[
    '.p.p.',
    'pypyp',
    '.pwp.',
    '..s..',
    '.s.s.'
  ]};
  SPR.flower2 = { pal:{ s:'#35ad3c', p:'#49a7ff', y:'#ffd23f', w:'#ffffff' }, rows:[
    '.p.p.',
    'pypyp',
    '.pwp.',
    '..s..',
    '.s.s.'
  ]};
  SPR.mushroom = { pal:{ k:'#4a1020', r:'#ff4d5e', w:'#fffdf5', d:'#c31f3f', s:'#e7dcc6' }, rows:[
    '..kkkk..',
    '.krwrrk.',
    'krrwwrrk',
    'krwrrrwk',
    'kdrrrrdk',
    '.kssssk.',
    '.kswwsk.',
    '..kkkk..'
  ]};
  SPR.crystal = { pal:{ k:'#20105a', b:'#a35cff', l:'#e0b6ff', d:'#6a27c8', w:'#ffffff' }, rows:[
    '...k....',
    '..klk...',
    '..klbk..',
    '.kblbdk.',
    '.kblbdk.',
    'kkblbddk',
    'kblwbddk',
    'kblbbddk',
    'kdbbbddk',
    '.kddddk.',
    '..kkkk..'
  ]};
  SPR.chestSm = { pal:{ k:'#3a2410', w:'#c08a4a', d:'#8a5a2c', g:'#ffd23f', l:'#f0a022', s:'#5b3a1b' }, rows:[
    '..kkkkkkkk..',
    '.kwwwwwwwwk.',
    'kwwwwggwwwwk',
    'kdddddggdddk',
    'kkkkkkkkkkkk',
    'kwwwwgggwwwk',
    'kwwwgglgggwk',
    'kdwwwgggwwdk',
    'kdddddddddkk',
    '.kssssssssk.',
    '..kkkkkkkk..',
    '............'
  ]};
  SPR.sign = { pal:{ k:'#3a2410', w:'#c08a4a', d:'#8a5a2c', t:'#5b3a1b' }, rows:[
    'kkkkkkkkkk',
    'kwwwwwwwwk',
    'kwttwwttwk',
    'kwwwwwwwwk',
    'kwttttttwk',
    'kddddddddk',
    'kkkkttkkkk',
    '....tt....',
    '....tt....',
    '...kttk...'
  ]};
  SPR.anvil = { pal:{ k:'#231a3a', b:'#6b789c', l:'#9aa6c4', d:'#434f74' }, rows:[
    '.kkkkkkkk.',
    'kllllbbbdk',
    'kbbbbbbbdk',
    '.kdbbbbdk.',
    '...kbbk...',
    '...kbbk...',
    '..kbbbbk..',
    '.kllbbbdk.',
    'kdddddddkk',
    '.kkkkkkkk.'
  ]};

  /* ==== PETS — 14x14, four little friends ============================== */
  const PET = (name, pal, rows) => { SPR['pet_'+name] = { pal, rows }; };
  PET('drake', { k:'#0f2a1a', b:'#3fe07a', d:'#1d9a52', l:'#c3ff4d', w:'#ffffff', e:'#1b1030', y:'#ffd23f' }, [
    '..............',
    '...kk....kk...',
    '..klbk..kblk..',
    '..kbbkkkkbbk..',
    '.kkbbbbbbbbkk.',
    'klbbbbbbbbbbdk',
    'kbbwekkewbbbdk',
    'kbbbbkkbbbbbdk',
    'kdbbbbbbbbbddk',
    '.kdbyyyybbddk.',
    '..kddbbbdddk..',
    '...kkdddkkk...',
    '....kk..kk....',
    '..............'
  ]);
  PET('owlet', { k:'#2a1a10', b:'#c08a4a', d:'#8a5a2c', l:'#e7dcc6', w:'#ffffff', e:'#1b1030', y:'#ffd23f' }, [
    '..............',
    '...kk....kk...',
    '..kbdk..kdbk..',
    '.kkbbbkkbbbkk.',
    'klbbbbbbbbbbdk',
    'kbwwwwkkwwwwdk',
    'kbwekwkkwkewdk',
    'kbwwwwyywwwwdk',
    'kbbbbbyybbbbdk',
    '.kbdbbbbbbddk.',
    '..kdbbbbbddk..',
    '...kkdddkkk...',
    '....ky..yk....',
    '..............'
  ]);
  PET('slimepup', { k:'#0d2a4a', b:'#49a7ff', d:'#2358c9', l:'#a8dcff', w:'#ffffff', e:'#1b1030' }, [
    '..............',
    '.....kkkk.....',
    '...kklllbkk...',
    '..klbbbbbbdk..',
    '.klbbbbbbbbdk.',
    'klbbbbbbbbbbdk',
    'kbbwekbbekwbdk',
    'kbbwwkbbkwwbdk',
    'kbbbbbbbbbbbdk',
    'kbbbkbbbbkbbdk',
    'kdbbbkkkkbbddk',
    '.kdbbbbbbbddk.',
    '..kkkkkkkkkk..',
    '..............'
  ]);
  PET('sparkfox', { k:'#4a1a00', b:'#ff9330', d:'#c35a10', l:'#ffd23f', w:'#ffffff', e:'#1b1030' }, [
    '..............',
    '..kk......kk..',
    '.klbk....kblk.',
    '.kbbkkkkkkbbk.',
    'kkbbbbbbbbbbkk',
    'kbbbbbbbbbbbdk',
    'kbwekbbbbkewdk',
    'kbwwkbwwbkwwdk',
    'kbbbbwkkwbbbdk',
    '.kbbbbbbbbbdk.',
    '..kdbbbbbbdk..',
    '...kkdddkklk..',
    '.....kk..klk..',
    '..............'
  ]);

  /* ---------------------------------------------------------------------- */
  return { SPR, get, build, warnings: warned };
})();

/* draw a named sprite, with optional scale / flip / tint / alpha */
/* Every sprite in the game is authored on one grid and blown up by a whole
   number. Fractional zoom resamples the art onto half-pixels, which is what
   makes pixel art look mushy and inconsistent from screen to screen. */
function spr(c, name, x, y, opt) {
  opt = opt || {};
  const img = ART.get(name, opt.swap);
  const s = Math.max(1, Math.round(opt.scale || 1));
  const w = img.width*s, h = img.height*s;
  x = Math.round(x); y = Math.round(y);
  if (opt.center) { x -= Math.round(w/2); y -= Math.round(h/2); }
  if (opt.alpha != null) c.globalAlpha = opt.alpha;
  if (opt.flip) {
    c.save(); c.translate(x+w, y); c.scale(-1,1); c.drawImage(img, 0, 0, w, h); c.restore();
  } else {
    c.drawImage(img, x, y, w, h);
  }
  if (opt.tint) {                          /* flat colour stamp of the shape */
    const t = surface(img.width, img.height), tc = t.getContext('2d');
    tc.drawImage(img,0,0); tc.globalCompositeOperation = 'source-in';
    tc.fillStyle = opt.tint; tc.fillRect(0,0,img.width,img.height);
    c.globalAlpha = (opt.alpha == null ? 1 : opt.alpha) * (opt.tintAmt == null ? 1 : opt.tintAmt);
    if (opt.flip) { c.save(); c.translate(x+w,y); c.scale(-1,1); c.drawImage(t,0,0,w,h); c.restore(); }
    else c.drawImage(t, x, y, w, h);
  }
  c.globalAlpha = 1;
  return { w, h };
}
const sprSize = (name) => { const i = ART.get(name); return { w:i.width, h:i.height }; };

/* =========================================================================
   MONSTERS — 16x16 grids, drawn at 3x or 4x in battle. Small canvases with
   hard shading read better blown up than big fuzzy ones.
   ========================================================================= */
(function(){
  const M = (name, pal, rows) => { ART.SPR['m_'+name] = { pal, rows }; };
  M('slime', { k:'#0b3a2a', b:'#3fe07a', l:'#c3ff4d', d:'#1d9a52', w:'#ffffff', e:'#1b1030' }, [
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkllbbbbkk...',
    '..kbllbbbbbbbk..',
    '.kbllbbbbbbbbbk.',
    '.kbbbbbbbbbbbbk.',
    'kbbwekbbbbkewbbk',
    'kbbwwkbbbbkwwbbk',
    'kbbbbbbbbbbbbbbk',
    'kbbbbkbbbbkbbbbk',
    'kdbbbbkkkkbbbbdk',
    'kdbbbbbbbbbbbbdk',
    '.kddbbbbbbbbddk.',
    '..kkddddddddkk..',
    '....kkkkkkkk....'
  ]);
  M('bat', { k:'#2a0d3a', b:'#a35cff', l:'#e0b6ff', d:'#6a27c8', w:'#ffffff', r:'#ff4d5e' }, [
    '................',
    'kk............kk',
    'kbkk........kkbk',
    'kbbbk......kbbbk',
    'kbbbbkkkkkkbbbbk',
    'kbbbbbllllbbbbbk',
    '.kbbbkbwwbkbbbk.',
    '..kbbkbrrbkbbk..',
    '...kbkbbbbkbk...',
    '....kkbbbbkk....',
    '......kbbk......',
    '.....kbwwbk.....',
    '.....kbkkbk.....',
    '......kkkk......',
    '................',
    '................'
  ]);
  M('shroom', { k:'#4a1020', r:'#ff4d5e', w:'#fffdf5', d:'#c31f3f', s:'#e7dcc6', e:'#1b1030', m:'#8a2a3a' }, [
    '................',
    '.....kkkkkk.....',
    '...kkrrrrrrkk...',
    '..krwwrrrrwwrk..',
    '.krrwwrrrrwwrrk.',
    '.krrrrrrrrrrrrk.',
    'kdrrrrrrrrrrrrdk',
    '.kddddddddddddk.',
    '...kssssssssk...',
    '...ksewsswesk...',
    '...kssssssssk...',
    '...kssmmmmssk...',
    '...kddddddddk...',
    '..kkddkkkkddkk..',
    '..kddk....kddk..',
    '..kkkk....kkkk..'
  ]);
  M('golem', { k:'#1b2340', b:'#6b789c', l:'#cfd9ee', d:'#434f74', w:'#46ecd5', e:'#1b1030' }, [
    '................',
    '....k......k....',
    '...klk....klk...',
    '...klk....klk...',
    '..kkbkkkkkkbkk..',
    '.kbbbbbbbbbbbbk.',
    'kbblbbbbbbbblbbk',
    'kbwwbbbbbbbbwwbk',
    'kbwwbbbbbbbbwwbk',
    'kbbbbbkkkkbbbbbk',
    'kdbbbbbbbbbbbbdk',
    '.kdbbbbbbbbbbdk.',
    '..kddddddddddk..',
    '..kddk....kddk..',
    '..kddk....kddk..',
    '..kkkk....kkkk..'
  ]);
  M('wisp', { k:'#123a4a', b:'#6cc8ff', l:'#b6ecff', d:'#2c7ff0', w:'#ffffff', e:'#1b1030', m:'#2358c9' }, [
    '......kkkk......',
    '....kkllllkk....',
    '...klbbbbbblk...',
    '..klbbbbbbbbbk..',
    '..kbbbbbbbbbbk..',
    '.kbbwekbbkewbbk.',
    '.kbbwwkbbkwwbbk.',
    '.kbbbbbbbbbbbbk.',
    '..kbbbkmmkbbbk..',
    '..kdbbbbbbbbdk..',
    '...kdbbbbbbdk...',
    '....kdbbbbdk....',
    '.....kddddk.....',
    '......kddk......',
    '.......kk.......',
    '................'
  ]);
  M('wyrm', { k:'#3a2410', b:'#c08a4a', l:'#e7dcc6', d:'#8a5a2c', w:'#ffffff', e:'#1b1030', y:'#fffdf5' }, [
    '................',
    '..kk........kk..',
    '.klk........klk.',
    '.kbkkkkkkkkkkbk.',
    'kkbbbbbbbbbbbbkk',
    'kbbbbbbbbbbbbbbk',
    'kbwekbbbbbbkewbk',
    'kbwwkbbbbbbkwwbk',
    'kbbbbbbbbbbbbbbk',
    'kbbkyyyyyyyykbbk',
    'kdbbkkkkkkkkbbdk',
    '.kdbbbbbbbbbbdk.',
    '..kddbbbbbbddk..',
    '...kkddddddkk...',
    '.....kkkkkk.....',
    '................'
  ]);
  M('seraph', { k:'#1a0a2e', b:'#ff5fb8', l:'#ffc2e4', d:'#a3157a', w:'#fffdf5', e:'#1b1030', g:'#ffd23f' }, [
    '..g..gkkkkg..g..',
    '.....kkbbbbkk...',
    '..kbbbbbbbbbbk..',
    '.kbbllbbbbllbbk.',
    'kbbkeekbbkeekbbk',
    'kbbkeekbbkeekbbk',
    'kbbbbbbbbbbbbbbk',
    'kbbbkbbbbbbkbbbk',
    '.kbbbkkkkkkbbbk.',
    '..kbbbbbbbbbbk..',
    '..kdbwwwwwwbdk..',
    '...kdbbbbbbdk...',
    '....kddddddk....',
    '.....kddddk.....',
    '......kddk......',
    '.......kk.......'
  ]);
})();

/* =========================================================================
   PROCEDURAL SCENERY — islands, trees, buildings. Still one-pixel
   rectangles, just assembled by arithmetic instead of by hand.
   ========================================================================= */

/* stable per-object randomness so a tree does not reshuffle every frame */
function srnd(seed) {
  let s = (seed*2654435761) >>> 0;
  return () => { s ^= s<<13; s>>>=0; s ^= s>>17; s ^= s<<5; s>>>=0; return s/4294967296; };
}
function pxEllipse(c,cx,cy,rx,ry,col) {
  c.fillStyle = col;
  cx = Math.round(cx); cy = Math.round(cy);
  for (let y=-ry;y<=ry;y++) {
    const k = 1-(y/ry)*(y/ry); if (k < 0) continue;
    const w = Math.floor(rx*Math.sqrt(k));
    c.fillRect(cx-w, cy+y, w*2+1, 1);
  }
}
function pxDither(c,x,y,w,h,col,phase) {
  c.fillStyle = col;
  for (let j=0;j<h;j++) for (let i=(j+(phase||0))%2;i<w;i+=2) c.fillRect(Math.round(x+i),Math.round(y+j),1,1);
}

/* a fat pixel cloud built from overlapping lumps */
function drawCloud(c,x,y,s,alpha) {
  c.globalAlpha = alpha == null ? 1 : alpha;
  const lumps = [[0,0,10,6],[-9,2,7,4],[9,2,7,4],[-4,-4,7,5],[5,-3,6,4]];
  for (const [dx,dy,rx,ry] of lumps) pxEllipse(c, x+dx*s, y+dy*s, rx*s, ry*s, '#ffffff');
  for (const [dx,dy,rx,ry] of lumps) pxEllipse(c, x+dx*s, y+dy*s+ry*s*.55, rx*s*.85, ry*s*.4, '#d8ecff');
  c.globalAlpha = 1;
}

/* the sky behind everything: banded gradient, sun, parallax clouds */
function drawSky(c, t, opt) {
  opt = opt || {};
  const top = opt.top || '#2c7ff0', mid = opt.mid || '#6cc8ff', bot = opt.bot || '#b6ecff';
  const gr = c.createLinearGradient(0,0,0,VH);
  gr.addColorStop(0, top); gr.addColorStop(.55, mid); gr.addColorStop(1, bot);
  c.fillStyle = gr; c.fillRect(0,0,VW,VH);
  /* banding — a gradient with visible steps reads as pixel art, not CSS */
  for (let y=0;y<VH;y+=8) { c.fillStyle = rgba('#ffffff', .022*(y/VH)); c.fillRect(0,y,VW,4); }
  if (opt.sun !== false) {
    const sx = opt.sunX == null ? 292 : opt.sunX, sy = opt.sunY == null ? 74 : opt.sunY;
    c.globalAlpha = .18; pxEllipse(c,sx,sy,34,34,'#fff0a8');
    c.globalAlpha = .3;  pxEllipse(c,sx,sy,24,24,'#fff0a8'); c.globalAlpha = 1;
    pxEllipse(c,sx,sy,14,14,'#ffe57a'); pxEllipse(c,sx,sy,11,11,'#fffdf5');
  }
  if (opt.stars) {
    const r = srnd(7);
    for (let i=0;i<46;i++) {
      const x = r()*VW, y = r()*VH*.6, tw = .5+.5*Math.sin(t*3+i);
      c.globalAlpha = .3+tw*.7; c.fillStyle = '#fffdf5';
      c.fillRect(Math.round(x),Math.round(y),1,1);
      if (tw > .9) { c.fillRect(Math.round(x)-1,Math.round(y),3,1); c.fillRect(Math.round(x),Math.round(y)-1,1,3); }
    }
    c.globalAlpha = 1;
  }
  const layers = opt.cloudLayers || [[.22,.55,120,.55],[.45,.85,210,.75]];
  for (let li=0;li<layers.length;li++) {
    const [yf, sc, period, al] = layers[li];
    const r = srnd(31+li*17);
    for (let i=0;i<5;i++) {
      const base = r()*period, yy = VH*yf + r()*70 - 35;
      const xx = ((base - t*(6+li*9)) % (VW+150) + VW+150) % (VW+150) - 75;
      drawCloud(c, xx, yy, sc*(0.7+r()*.6), al);
    }
  }
}

/* a floating island: grass cap, dirt body, a rocky point, hanging roots */
function drawFloatIsland(c, cx, topY, w, opt) {
  opt = opt || {};
  const seed = opt.seed == null ? 3 : opt.seed;
  const r = srnd(seed);
  const depth = opt.depth || Math.round(w*.62);
  const grassH = opt.grassH || 7;
  const g1 = opt.grass || P.grass, g2 = opt.grass2 || P.grass2, g3 = opt.grass3 || P.grass3;
  const d1 = opt.dirt || P.dirt, d2 = opt.dirt2 || P.dirt2, d3 = opt.dirt3 || P.dirt3;

  /* the underside: a stack of shrinking rows ending in a blunt point */
  for (let i=0;i<depth;i++) {
    const k = i/depth;
    let hw = Math.round((w/2) * Math.pow(1-k, .72));
    hw += Math.round(Math.sin(i*.55+seed)*1.6*(1-k));
    if (hw < 1) break;
    const y = topY + grassH + i;
    c.fillStyle = k < .28 ? d1 : k < .62 ? d2 : d3;
    c.fillRect(Math.round(cx-hw), Math.round(y), hw*2, 1);
    c.fillStyle = rgba('#000000', .18);          /* rim shade on the right */
    c.fillRect(Math.round(cx+hw-Math.max(1,Math.round(hw*.18))), Math.round(y), Math.max(1,Math.round(hw*.18)), 1);
    if (i%7 === 3) pxDither(c, cx-hw+2, y, hw*2-4, 1, rgba(d3,.5), i);
  }
  /* embedded rocks */
  for (let i=0;i<Math.max(2,Math.round(w/34));i++) {
    const rx = cx + (r()-.5)*w*.7, ry = topY + grassH + 6 + r()*depth*.5, rr = 2+r()*3;
    pxEllipse(c, rx, ry, rr, rr*.75, P.stone2);
    pxEllipse(c, rx, ry-1, rr*.6, rr*.4, P.stone);
  }
  /* grass cap with a bumpy silhouette and a bright lip */
  for (let i=0;i<grassH;i++) {
    const hw = Math.round(w/2 - i*0.35);
    c.fillStyle = i === 0 ? P.grassLt : i < 3 ? g1 : i < 5 ? g2 : g3;
    c.fillRect(Math.round(cx-hw), Math.round(topY+i), hw*2, 1);
  }
  pxDither(c, cx-w/2+3, topY+3, w-6, 2, rgba(P.grassLt,.55), 0);
  /* tufts along the top edge */
  for (let i=0;i<Math.round(w/9);i++) {
    const tx = Math.round(cx - w/2 + 4 + r()*(w-8)), th = 1+Math.round(r()*2);
    c.fillStyle = P.grassLt; c.fillRect(tx, topY-th, 1, th);
    if (r() > .6) c.fillRect(tx+1, topY-Math.max(1,th-1), 1, Math.max(1,th-1));
  }
  /* hanging roots and vines */
  if (opt.vines !== false) {
    for (let i=0;i<Math.max(2,Math.round(w/26));i++) {
      const vx = Math.round(cx - w/2 + 6 + r()*(w-12));
      const vl = 6 + r()*18, off = Math.abs(vx-cx)/(w/2);
      const len = Math.round(vl*(1-off*.6));
      for (let j=0;j<len;j++) {
        c.fillStyle = j > len*.6 ? P.grass3 : P.grass2;
        c.fillRect(vx + Math.round(Math.sin(j*.4+i)*1.2), Math.round(topY+grassH+j), 1, 1);
      }
    }
  }
}

/* a leafy tree — trunk, three canopy lumps, highlight, dither, shadow */
function drawTree(c, x, groundY, s, seed, opt) {
  opt = opt || {};
  const r = srnd(seed || 1);
  const th = Math.round((14 + r()*6) * s);
  const tw2 = Math.max(2, Math.round(3*s));
  const leaf = opt.leaf || P.grass2, leafLt = opt.leafLt || P.grass, leafDk = opt.leafDk || P.grass3;
  c.globalAlpha = .22; pxEllipse(c, x+2, groundY+1, Math.round(9*s), Math.round(3*s), '#000000'); c.globalAlpha = 1;
  /* trunk with a lit left edge */
  c.fillStyle = P.wood2; c.fillRect(Math.round(x-tw2/2), Math.round(groundY-th), tw2, th);
  c.fillStyle = P.wood;  c.fillRect(Math.round(x-tw2/2), Math.round(groundY-th), 1, th);
  c.fillStyle = P.wood3; c.fillRect(Math.round(x+tw2/2)-1, Math.round(groundY-th), 1, th);
  /* a couple of branches */
  c.fillStyle = P.wood2;
  c.fillRect(Math.round(x-tw2/2-2*s), Math.round(groundY-th*.72), Math.round(2*s), 1);
  c.fillRect(Math.round(x+tw2/2), Math.round(groundY-th*.85), Math.round(2*s), 1);
  const cy = groundY - th - Math.round(4*s);
  const lumps = [[0,-2,11,9],[-8,2,8,6],[8,2,8,6],[-3,-7,7,5],[4,-6,7,5]];
  for (const [dx,dy,rx,ry] of lumps) pxEllipse(c, x+dx*s, cy+dy*s, Math.round(rx*s), Math.round(ry*s), leafDk);
  for (const [dx,dy,rx,ry] of lumps) pxEllipse(c, x+dx*s-1, cy+dy*s-1, Math.round(rx*s*.92), Math.round(ry*s*.92), leaf);
  for (const [dx,dy,rx,ry] of lumps) pxEllipse(c, x+dx*s-Math.round(2*s), cy+dy*s-Math.round(2*s), Math.round(rx*s*.5), Math.round(ry*s*.5), leafLt);
  pxDither(c, x-10*s, cy-4*s, 9*s, 6*s, rgba(leafLt,.5), 0);
  if (opt.fruit) for (let i=0;i<3;i++) {
    const fx = x + (r()-.5)*18*s, fy = cy + (r()-.3)*12*s;
    pxEllipse(c, fx, fy, Math.max(1,Math.round(1.5*s)), Math.max(1,Math.round(1.5*s)), opt.fruit);
  }
}
function drawBush(c,x,y,s,seed,col) {
  const r = srnd(seed||2);
  const a = col || P.grass2;
  c.globalAlpha = .2; pxEllipse(c,x+1,y+1,6*s,2*s,'#000'); c.globalAlpha = 1;
  pxEllipse(c,x,y-3*s,7*s,4*s,shade(a,-.2));
  pxEllipse(c,x-4*s,y-1*s,4*s,3*s,shade(a,-.2));
  pxEllipse(c,x+4*s,y-1*s,4*s,3*s,shade(a,-.2));
  pxEllipse(c,x-1,y-4*s,5*s,3*s,a);
  pxEllipse(c,x-2*s,y-5*s,2*s,1*s,shade(a,.3));
  if (r() > .5) { c.fillStyle = P.pink; c.fillRect(Math.round(x+2*s),Math.round(y-4*s),1,1); }
}
function drawRock(c,x,y,s,seed) {
  const r = srnd(seed||5);
  c.globalAlpha = .2; pxEllipse(c,x+1,y+1,6*s,2*s,'#000'); c.globalAlpha = 1;
  pxEllipse(c,x,y-3*s,6*s,4*s,P.stone2);
  pxEllipse(c,x-1,y-4*s,4*s,3*s,P.stone);
  pxEllipse(c,x-2*s,y-5*s,2*s,1*s,'#cfd9ee');
  pxEllipse(c,x+3*s,y-1*s,3*s,2*s,P.stone3);
  if (r() > .55) { c.fillStyle = P.cyan; c.fillRect(Math.round(x+2*s),Math.round(y-4*s),1,2); }
}
function drawWaterfall(c,x,y,w,h,t) {
  c.fillStyle = rgba('#6cc8ff',.75); c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  c.fillStyle = rgba('#b6ecff',.8);
  for (let i=0;i<w;i+=3) {
    const off = ((t*60 + i*13) % h);
    c.fillRect(Math.round(x+i), Math.round(y+off), 1, Math.min(6, h-off));
  }
  c.fillStyle = rgba('#ffffff',.6);
  for (let i=0;i<4;i++) c.fillRect(Math.round(x+((t*40+i*17)%w)), Math.round(y+h-2), 2, 2);
}

/* =========================================================================
   BUILDINGS — every base structure, drawn from rectangles so the same
   sawmill can be three sizes and three upgrade levels without new art.
   ========================================================================= */
function roofTri(c,cx,baseY,halfW,h,col,col2) {
  for (let i=0;i<h;i++) {
    const hw = Math.round(halfW*(1 - i/h));
    c.fillStyle = i < 2 ? (col2||shade(col,.3)) : col;
    c.fillRect(Math.round(cx-hw), Math.round(baseY-i), hw*2, 1);
  }
  c.fillStyle = shade(col,-.35);
  c.fillRect(Math.round(cx-halfW-1), Math.round(baseY), halfW*2+2, 1);
}
function planks(c,x,y,w,h,col) {
  c.fillStyle = col; c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  c.fillStyle = shade(col,-.22);
  for (let j=3;j<h;j+=4) c.fillRect(Math.round(x),Math.round(y+j),Math.round(w),1);
  c.fillStyle = shade(col,.22); c.fillRect(Math.round(x),Math.round(y),Math.round(w),1);
}
function window4(c,x,y,w,h,lit) {
  c.fillStyle = P.ink; c.fillRect(Math.round(x-1),Math.round(y-1),Math.round(w+2),Math.round(h+2));
  c.fillStyle = lit ? '#ffd23f' : '#8fd8ff';
  c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  c.fillStyle = lit ? '#fff0a8' : '#d8f4ff';
  c.fillRect(Math.round(x),Math.round(y),Math.round(w/2),Math.round(h/2));
  c.fillStyle = P.wood3;
  c.fillRect(Math.round(x+w/2),Math.round(y),1,Math.round(h));
  c.fillRect(Math.round(x),Math.round(y+h/2),Math.round(w),1);
}
/* type: house sawmill quarry well forge nest library gym */
function drawBuilding(c, type, cx, groundY, lvl, t, s) {
  s = s || 1; lvl = lvl || 1;
  const W = Math.round(30*s), H = Math.round(26*s + lvl*2*s);
  const L = Math.round(cx - W/2), Ty = Math.round(groundY - H);
  c.globalAlpha = .22; pxEllipse(c, cx+1, groundY+1, W*.55, 3*s, '#000'); c.globalAlpha = 1;
  const outline = (x,y,w,h) => { c.fillStyle = P.ink; c.fillRect(Math.round(x-1),Math.round(y-1),Math.round(w+2),Math.round(h+2)); };

  if (type === 'house') {
    outline(L, Ty+10*s, W, H-10*s);
    planks(c, L, Ty+10*s, W, H-10*s, P.wood);
    roofTri(c, cx, Ty+11*s, W/2+3*s, 11*s, P.red, '#ff8a92');
    window4(c, L+5*s, Ty+16*s, 7*s, 6*s, true);
    c.fillStyle = P.wood3; c.fillRect(Math.round(cx+3*s), Math.round(groundY-11*s), Math.round(8*s), Math.round(11*s));
    c.fillStyle = P.gold;  c.fillRect(Math.round(cx+9*s), Math.round(groundY-6*s), 1, 1);
    /* chimney + smoke */
    c.fillStyle = P.stone2; c.fillRect(Math.round(cx+7*s), Math.round(Ty+2*s), Math.round(5*s), Math.round(9*s));
    c.fillStyle = P.stone3; c.fillRect(Math.round(cx+7*s), Math.round(Ty+2*s), Math.round(5*s), 1);
  } else if (type === 'sawmill') {
    outline(L, Ty+8*s, W, H-8*s);
    planks(c, L, Ty+8*s, W, H-8*s, P.wood2);
    roofTri(c, cx, Ty+9*s, W/2+2*s, 9*s, '#7a4f2a', P.wood);
    /* the wheel, which actually turns */
    const wx = L-2*s, wy = groundY-10*s, rr = 9*s, a = t*1.4;
    c.fillStyle = P.ink; pxEllipse(c,wx,wy,rr+1,rr+1,P.ink);
    pxEllipse(c,wx,wy,rr,rr,P.wood3); pxEllipse(c,wx,wy,rr-3*s,rr-3*s,'#8fd8ff');
    for (let i=0;i<8;i++) {
      const aa = a + i*TAU/8;
      c.fillStyle = P.wood;
      c.fillRect(Math.round(wx+Math.cos(aa)*rr*.7)-1, Math.round(wy+Math.sin(aa)*rr*.7)-1, 3, 3);
    }
    for (let i=0;i<3;i++) { c.fillStyle = P.wood; c.fillRect(Math.round(L+8*s+i*5*s), Math.round(groundY-3*s), Math.round(4*s), Math.round(3*s)); }
  } else if (type === 'quarry') {
    outline(L, Ty+12*s, W, H-12*s);
    c.fillStyle = P.stone2; c.fillRect(L, Ty+12*s, W, H-12*s);
    pxDither(c, L, Ty+12*s, W, H-12*s, P.stone3, 0);
    c.fillStyle = P.stone; c.fillRect(L, Ty+12*s, W, 2*s);
    roofTri(c, cx, Ty+13*s, W/2+2*s, 8*s, P.stone3, P.stone2);
    /* mine mouth */
    c.fillStyle = P.ink; pxEllipse(c, cx, groundY-1, 8*s, 8*s, P.ink);
    c.fillStyle = P.shadow; pxEllipse(c, cx, groundY, 6*s, 6*s, '#0d0720');
    c.fillStyle = P.wood2;
    c.fillRect(Math.round(cx-9*s), Math.round(groundY-10*s), Math.round(2*s), Math.round(10*s));
    c.fillRect(Math.round(cx+7*s), Math.round(groundY-10*s), Math.round(2*s), Math.round(10*s));
    c.fillRect(Math.round(cx-9*s), Math.round(groundY-11*s), Math.round(18*s), Math.round(2*s));
    spr(c,'i_stone', cx+8*s, groundY-8*s, { center:true });
  } else if (type === 'well') {
    outline(L+4*s, Ty+14*s, W-8*s, H-14*s);
    c.fillStyle = P.stone2; c.fillRect(L+4*s, Ty+14*s, W-8*s, H-14*s);
    pxDither(c, L+4*s, Ty+14*s, W-8*s, H-14*s, P.stone3, 1);
    /* glowing water */
    const gl = .6+.4*Math.sin(t*2.2);
    c.fillStyle = P.purple2; c.fillRect(Math.round(L+6*s), Math.round(Ty+14*s), Math.round(W-12*s), Math.round(4*s));
    c.globalAlpha = gl; c.fillStyle = P.purple;
    c.fillRect(Math.round(L+6*s), Math.round(Ty+14*s), Math.round(W-12*s), Math.round(3*s));
    c.globalAlpha = 1;
    c.fillStyle = P.wood2;
    c.fillRect(Math.round(L+4*s), Math.round(Ty+2*s), Math.round(2*s), Math.round(13*s));
    c.fillRect(Math.round(L+W-6*s), Math.round(Ty+2*s), Math.round(2*s), Math.round(13*s));
    roofTri(c, cx, Ty+4*s, W/2, 7*s, P.purple2, P.purple);
    c.fillStyle = P.wood3; c.fillRect(Math.round(cx-1), Math.round(Ty+6*s), 2, Math.round(6*s));
    c.globalAlpha = .5; pxEllipse(c, cx, Ty+13*s, 10*s*gl, 5*s*gl, P.purple); c.globalAlpha = 1;
  } else if (type === 'forge') {
    outline(L, Ty+9*s, W, H-9*s);
    c.fillStyle = P.stone3; c.fillRect(L, Ty+9*s, W, H-9*s);
    pxDither(c, L, Ty+9*s, W, H-9*s, P.stone2, 0);
    roofTri(c, cx, Ty+10*s, W/2+2*s, 9*s, '#5b3a1b', P.wood2);
    /* forge mouth, breathing */
    const f = .7+.3*Math.sin(t*6.1);
    c.fillStyle = P.ink; c.fillRect(Math.round(cx-7*s), Math.round(groundY-11*s), Math.round(14*s), Math.round(11*s));
    c.fillStyle = P.red2; c.fillRect(Math.round(cx-6*s), Math.round(groundY-10*s), Math.round(12*s), Math.round(10*s));
    c.globalAlpha = f; c.fillStyle = P.orange;
    c.fillRect(Math.round(cx-5*s), Math.round(groundY-8*s), Math.round(10*s), Math.round(8*s));
    c.fillStyle = P.gold; c.fillRect(Math.round(cx-3*s), Math.round(groundY-5*s), Math.round(6*s), Math.round(5*s));
    c.globalAlpha = 1;
    spr(c,'anvil', cx+10*s, groundY-10*s, { center:true });
  } else if (type === 'nest') {
    outline(L+2*s, Ty+12*s, W-4*s, H-12*s);
    planks(c, L+2*s, Ty+12*s, W-4*s, H-12*s, '#d9a45c');
    roofTri(c, cx, Ty+13*s, W/2+2*s, 10*s, P.green2, P.green);
    /* straw nest with an egg in it */
    c.fillStyle = '#e0c060'; pxEllipse(c, cx, groundY-6*s, 9*s, 4*s, '#e0c060');
    c.fillStyle = '#c09a3a'; pxEllipse(c, cx, groundY-5*s, 8*s, 3*s, '#c09a3a');
    spr(c,'i_egg', cx, groundY-10*s, { center:true, scale:s });
    c.fillStyle = P.ink;
    for (let i=0;i<5;i++) c.fillRect(Math.round(cx-9*s+i*4*s), Math.round(groundY-7*s), Math.round(3*s), 1);
  } else if (type === 'library') {
    outline(L, Ty+9*s, W, H-9*s);
    c.fillStyle = '#e7dcc6'; c.fillRect(L, Ty+9*s, W, H-9*s);
    c.fillStyle = '#cbbfa4'; for (let j=0;j<4;j++) c.fillRect(L, Ty+(12+j*5)*s, W, 1);
    roofTri(c, cx, Ty+10*s, W/2+3*s, 10*s, P.blue2, P.blue);
    /* columns */
    c.fillStyle = '#fffdf5';
    c.fillRect(Math.round(L+3*s), Math.round(Ty+12*s), Math.round(3*s), Math.round(H-12*s));
    c.fillRect(Math.round(L+W-6*s), Math.round(Ty+12*s), Math.round(3*s), Math.round(H-12*s));
    /* shelves of little books */
    for (let i=0;i<5;i++) { c.fillStyle = [P.red,P.blue,P.green,P.gold,P.purple][i];
      c.fillRect(Math.round(L+9*s+i*3*s), Math.round(Ty+15*s), Math.round(2*s), Math.round(5*s)); }
    c.fillStyle = P.wood3; c.fillRect(Math.round(cx-4*s), Math.round(groundY-9*s), Math.round(8*s), Math.round(9*s));
    spr(c,'i_book', cx, Ty+3*s, { center:true, scale:s });
  } else if (type === 'gym') {
    outline(L+2*s, Ty+11*s, W-4*s, H-11*s);
    planks(c, L+2*s, Ty+11*s, W-4*s, H-11*s, P.wood2);
    roofTri(c, cx, Ty+12*s, W/2+2*s, 9*s, P.orange, '#ffc48a');
    /* a straw dummy that wobbles */
    const wob = Math.sin(t*3)*2*s;
    c.fillStyle = P.wood3; c.fillRect(Math.round(cx-1+wob*.3), Math.round(groundY-14*s), 2, Math.round(14*s));
    c.fillStyle = '#e0c060'; pxEllipse(c, cx+wob, groundY-16*s, 5*s, 5*s, '#e0c060');
    c.fillStyle = '#c09a3a'; pxEllipse(c, cx+wob, groundY-15*s, 4*s, 3*s, '#c09a3a');
    c.fillStyle = P.wood3; c.fillRect(Math.round(cx-7*s+wob), Math.round(groundY-13*s), Math.round(14*s), Math.round(2*s));
  }
  /* upgrade pips on the roof ridge */
  for (let i=0;i<Math.min(lvl,5);i++)
    spr(c, 'i_star', cx - (Math.min(lvl,5)*6*s)/2 + i*6*s + 3*s, Ty - 2*s, { center:true, scale:Math.max(1,Math.round(s*.6)) });
  return { x:L, y:Ty, w:W, h:H };
}

/* A home island with a real plateau: a grass disc seen at an angle, sitting
   on a cone of dirt. Everything can then stand *on* it at a believable
   depth instead of floating in front of a flat cut-out. */
function drawPlateau(c, cx, cy, rx, ry, depth, opt) {
  opt = opt || {};
  const r = srnd(opt.seed || 7);
  const g1 = opt.grass || P.grass, g2 = opt.grass2 || P.grass2, g3 = opt.grass3 || P.grass3;
  const d1 = opt.dirt || P.dirt, d2 = opt.dirt2 || P.dirt2, d3 = opt.dirt3 || P.dirt3;

  /* the cone underneath, widest where the disc is widest */
  for (let i=0;i<depth;i++) {
    const k = i/depth;
    let hw = Math.round(rx*Math.pow(1-k,.72) + Math.sin(i*.42+(opt.seed||7))*2*(1-k));
    if (hw < 1) break;
    const y = Math.round(cy + i);
    c.fillStyle = k < .16 ? d1 : k < .5 ? d2 : d3;
    c.fillRect(Math.round(cx-hw), y, hw*2, 1);
    c.fillStyle = rgba('#000000',.16);
    const sh = Math.max(1, Math.round(hw*.2));
    c.fillRect(Math.round(cx+hw-sh), y, sh, 1);
    c.fillStyle = rgba('#ffffff',.06);
    c.fillRect(Math.round(cx-hw), y, Math.max(1,Math.round(hw*.12)), 1);
    if (i % 9 === 4) pxDither(c, cx-hw+3, y, hw*2-6, 1, rgba(d3,.45), i);
    if (i % 17 === 8) { c.fillStyle = rgba(d3,.55); c.fillRect(Math.round(cx-hw+2), y, hw*2-4, 1); }
    if (i % 17 === 9) { c.fillStyle = rgba('#ffffff',.07); c.fillRect(Math.round(cx-hw+2), y, hw*2-4, 1); }
  }
  /* rocks poking out of the cone */
  for (let i=0;i<Math.max(3,Math.round(rx/26));i++) {
    const k = .1 + r()*.55;
    const hw = rx*Math.pow(1-k,.72);
    const x = cx + (r()-.5)*hw*1.5, y = cy + k*depth, rr = 2+r()*3;
    pxEllipse(c, x, y, rr, rr*.72, P.stone2);
    pxEllipse(c, x, y-1, rr*.6, rr*.38, P.stone);
  }
  /* the grass disc */
  for (let j=-ry;j<=ry;j++) {
    const k = 1-(j/ry)*(j/ry); if (k < 0) continue;
    const hw = Math.floor(rx*Math.sqrt(k));
    const y = Math.round(cy+j);
    const depthK = (j+ry)/(ry*2);             /* 0 at the back, 1 at the front */
    c.fillStyle = depthK < .1 ? g2 : depthK < .78 ? g1 : g2;
    c.fillRect(Math.round(cx-hw), y, hw*2, 1);
    if (depthK > .9) { c.fillStyle = g3; c.fillRect(Math.round(cx-hw), y, hw*2, 1); }
  }
  /* bright lip along the back edge, dark line along the front */
  for (let j=-ry;j<-ry+3;j++) {
    const k = 1-(j/ry)*(j/ry); if (k < 0) continue;
    const hw = Math.floor(rx*Math.sqrt(k));
    c.fillStyle = P.grassLt; c.fillRect(Math.round(cx-hw), Math.round(cy+j), hw*2, 1);
  }
  pxDither(c, cx-rx*.7, cy-ry*.4, rx*1.4, ry*1.1, rgba(P.grassLt,.4), 0);
  /* tufts around the whole rim */
  for (let i=0;i<Math.round(rx/5);i++) {
    const a = r()*TAU;
    const x = Math.round(cx + Math.cos(a)*rx*.97), y = Math.round(cy + Math.sin(a)*ry*.97);
    const h = 1 + Math.round(r()*2);
    c.fillStyle = P.grassLt; c.fillRect(x, y-h, 1, h);
  }
  /* roots hanging off the front rim */
  for (let i=0;i<Math.round(rx/18);i++) {
    const t2 = (r()-.5)*1.6;
    const x = Math.round(cx + Math.sin(t2)*rx*.9), y = Math.round(cy + Math.cos(t2)*ry*.92);
    const len = Math.round(6 + r()*16);
    for (let j=0;j<len;j++) {
      c.fillStyle = j > len*.6 ? P.grass3 : P.grass2;
      c.fillRect(x + Math.round(Math.sin(j*.4+i)*1.2), y+j, 1, 1);
    }
  }
}
