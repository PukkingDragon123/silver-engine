/* =========================================================================
   CAT — you, and every other cat in Aetheria.

   Painted procedurally at a fixed 30x40 grid so fur colour, markings, eye
   colour and outfit are live values rather than forty hand-drawn variants.
   Each finished pose is stamped with a hard outline (the silhouette drawn
   four times, one pixel out, then the art on top), which is what gives
   everything the sticker look.

   Proportions are deliberately cartoony: a big round head on a small body,
   and a tail that never stops moving.
   ========================================================================= */
const AV = (() => {
  const W = 30, H = 40, FEET = H - 2;
  const cache = new Map();

  /* coats, chosen to read at a glance against grass and against night sky */
  const FURS = ['#f4a742','#e7dcc6','#8a6a4f','#4a3b33','#2a2436','#f0e9df',
                '#d9773f','#9aa6c4','#c9b08a','#5a4a72','#e0a9c8','#7fb3a0'];
  const MARKS = ['#c47a20','#c2b498','#5f4635','#1f1a24','#14121c','#cfc6bb',
                 '#a8501f','#6b789c','#a08a5c','#3a3050','#b87a9c','#4f8272'];
  const EYES = ['#3fe07a','#ffd23f','#49a7ff','#a35cff','#46ecd5','#ff9330','#e7dcc6'];
  const PATTERNS = ['solid','tabby','tuxedo','calico','siamese','spotted'];
  const SHIRTS = ['#ff4d5e','#49a7ff','#3fe07a','#ffd23f','#a35cff','#ff5fb8',
                  '#46ecd5','#ff9330','#fffdf5','#2e1b50'];
  const OUTFITS = ['scarf','hoodie','cape','satchel'];

  const defaults = () => ({ fur:0, mark:0, pattern:1, eyes:0, shirtCol:0, outfit:0, body:1 });

  /* ---------------------------------------------------------------------- */
  function paint(c, cfg, pose, f) {
    const fur  = FURS[cfg.fur % FURS.length];
    const furD = shade(fur,-.24), furL = shade(fur,.26), furX = shade(fur,-.42);
    const mark = MARKS[cfg.mark % MARKS.length];
    const belly = shade(fur,.42);
    const eye  = EYES[cfg.eyes % EYES.length];
    const shirt = SHIRTS[cfg.shirtCol % SHIRTS.length];
    const shirtD = shade(shirt,-.28), shirtL = shade(shirt,.3);
    const pat = PATTERNS[cfg.pattern % PATTERNS.length];
    const outfit = OUTFITS[cfg.outfit % OUTFITS.length];
    const cx = Math.round(W/2);
    const R = (x,y,w,h,col) => { if (w<=0||h<=0) return; c.fillStyle = col;
      c.fillRect(Math.round(cx+x), Math.round(FEET+y), Math.round(w), Math.round(h)); };

    /* ---- pose offsets ------------------------------------------------- */
    let bob=0, lean=0, legA=0, legB=0, armA=0, armB=0, headT=0, headB=0, tail=0, squash=0, ear=0;
    const wob = Math.sin(f*1.7)*0;
    if (pose === 'idle')  { bob = f===1?-1:0; tail = f===1?2:-1; headB = f===1?-1:0; }
    else if (pose === 'walk') {
      const k = f%4;
      bob  = (k===1||k===3) ? -1 : 0;
      legA = [0,-2,0,2][k]; legB = -legA;
      armA = [0,2,0,-2][k]; armB = -armA;
      tail = [2,0,-2,0][k];
    } else if (pose === 'run') {
      const k = f%4;
      bob = (k%2)?-2:0; lean = 2;
      legA = [3,-3,3,-3][k]; legB = -legA; armA = -legA; armB = legA; tail = 4;
    } else if (pose === 'dance') {
      lean = f%2?2:-2; bob = f%2?-2:0; armA=-8; armB=-8;
      headT = f%2?-1:1; legA = f%2?-1:1; legB=-legA; tail = f%2?4:-4; ear = f%2?-1:0;
    } else if (pose === 'cheer') { bob=-2; armA=-10; armB=-10; tail=4; ear=-1; }
    else if (pose === 'wave')    { armB=-9; bob = f===1?-1:0; tail=2; }
    else if (pose === 'sit')     { bob=5; tail=3; squash=1; }
    else if (pose === 'attack')  { lean=3; armB=-7; bob=-1; tail=-4; ear=-1; }
    else if (pose === 'hurt')    { lean=-3; bob=1; squash=2; ear=2; tail=-2; }
    else if (pose === 'dig')     { lean=2; armA=-4; armB=4; bob = f%2?-1:0; tail = f%2?2:-2; }

    /* ---- sleeping is a curled-up ball, so it gets its own routine ----- */
    if (pose === 'sleep') {
      const y = -9;
      R(-12,y+2,24,9,fur); R(-12,y+9,24,2,furD); R(-12,y+2,24,1,furL);
      if (pat === 'tabby') { R(-8,y+2,2,8,mark); R(-2,y+2,2,8,mark); R(4,y+2,2,8,mark); }
      R(-13,y+1,9,9,fur);                          /* head tucked in */
      R(-13,y+1,9,2,furL); R(-13,y+8,9,2,furD);
      R(-13,y-2,3,4,fur); R(-8,y-2,3,4,fur);       /* ears */
      R(-12,y-1,1,2,shade(mark,.2)); R(-7,y-1,1,2,shade(mark,.2));
      R(-11,y+5,3,1,P.ink); R(-6,y+5,3,1,P.ink);   /* closed eyes */
      R(-9,y+7,2,1,'#c2707f');
      R(8,y+1,5,3,fur); R(11,y-1,3,4,fur);         /* tail wrapped round */
      R(8,y+1,5,1,furL);
      return;
    }

    const y0 = bob;
    /* ---- tail (behind everything) -------------------------------------- */
    {
      const tx = 6 + lean, ty = -13 + y0;
      R(tx,ty,4,3,furD);
      R(tx+3,ty-2+tail*0.5,4,3,fur);
      R(tx+6,ty-5+tail,4,3,fur);
      R(tx+8,ty-9+tail*1.4,3,4,fur);
      R(tx+8,ty-9+tail*1.4,3,1,furL);
      if (pat === 'tabby')   { R(tx+3,ty-2+tail*0.5,4,1,mark); R(tx+8,ty-8+tail*1.4,3,1,mark); }
      if (pat === 'siamese') { R(tx+8,ty-9+tail*1.4,3,4,mark); }
      if (pat === 'tuxedo')  { R(tx+8,ty-6+tail*1.4,3,1,belly); }
    }

    /* ---- legs and paws -------------------------------------------------- */
    if (pose === 'sit') {
      R(-6+lean,-7+y0,5,7,fur); R(1+lean,-7+y0,5,7,fur);
      R(-7+lean,-3+y0,7,3,fur); R(0+lean,-3+y0,7,3,fur);
      R(-7+lean,-1+y0,7,1,furD); R(0+lean,-1+y0,7,1,furD);
      if (pat === 'tuxedo' || pat === 'siamese') { R(-7+lean,-3+y0,7,3,pat==='tuxedo'?belly:mark);
                                                   R(0+lean,-3+y0,7,3,pat==='tuxedo'?belly:mark); }
    } else {
      const lx = -5+lean+legA*.4, rx = 1+lean+legB*.4;
      R(lx,-9+y0,4,6,fur);  R(rx,-9+y0,4,6,fur);
      R(lx,-5+y0,4,2,furD); R(rx,-5+y0,4,2,furD);
      const px = -6+lean+legA*.6, qx = 1+lean+legB*.6;
      const pawCol = pat === 'tuxedo' ? belly : pat === 'siamese' ? mark : fur;
      R(px,-3+y0,6,3,pawCol); R(qx,-3+y0,6,3,pawCol);
      R(px,-1+y0,6,1,shade(pawCol,-.3)); R(qx,-1+y0,6,1,shade(pawCol,-.3));
      R(px+1,-3+y0,1,1,shade(pawCol,.4)); R(qx+1,-3+y0,1,1,shade(pawCol,.4));
    }

    /* ---- torso ---------------------------------------------------------- */
    const bw = cfg.body === 0 ? 11 : 13, bx = -Math.floor(bw/2) + lean;
    const ty0 = -20 + y0 + squash;
    R(bx,ty0,bw,12-squash,fur);
    R(bx,ty0,bw,2,furL);
    R(bx,ty0+10-squash,bw,2,furD);
    R(bx+3,ty0+3,bw-6,8-squash,belly);            /* chest floof */
    if (pat === 'tabby') { R(bx,ty0+2,bw,1,mark); R(bx,ty0+5,bw,1,mark); R(bx,ty0+8,bw,1,mark); }
    if (pat === 'tuxedo') { R(bx+2,ty0+1,bw-4,10-squash,belly); }
    if (pat === 'calico') { R(bx,ty0,5,6,mark); R(bx+bw-4,ty0+5,4,5,mark); }
    if (pat === 'spotted') { R(bx+2,ty0+2,2,2,mark); R(bx+7,ty0+4,2,2,mark); R(bx+4,ty0+8,2,2,mark); }

    /* ---- outfit --------------------------------------------------------- */
    if (outfit === 'scarf') {
      R(bx-1,ty0+1,bw+2,3,shirt); R(bx-1,ty0+1,bw+2,1,shirtL);
      R(bx+bw-3,ty0+3,3,6,shirt); R(bx+bw-3,ty0+8,3,1,shirtD);
    } else if (outfit === 'hoodie') {
      R(bx-1,ty0,bw+2,4,shirtD);
      R(bx,ty0+3,bw,8-squash,shirt); R(bx,ty0+3,bw,1,shirtL);
      R(bx+3,ty0+7,bw-6,3,shirtD);
    } else if (outfit === 'cape') {
      R(bx-2,ty0+1,bw+4,2,shirt);
      R(bx+bw,ty0+2,3,11,shirtD); R(bx+bw,ty0+2,3,1,shirt);
    } else if (outfit === 'satchel') {
      R(bx,ty0+2,bw,2,shirtD);
      R(bx+bw-4,ty0+5,5,5,shirt); R(bx+bw-4,ty0+5,5,1,shirtL);
      R(bx+bw-3,ty0+7,3,1,shirtD);
    }

    /* ---- front paws / arms ---------------------------------------------- */
    const aw = 4;
    R(bx-aw+1,-18+y0+armA*.5,aw,7,fur);
    R(bx+bw-1,-18+y0+armB*.5,aw,7,fur);
    const mitt = pat === 'tuxedo' ? belly : pat === 'siamese' ? mark : fur;
    R(bx-aw+1,-12+y0+armA,aw,3,mitt);
    R(bx+bw-1,-12+y0+armB,aw,3,mitt);
    R(bx-aw+1,-10+y0+armA,aw,1,shade(mitt,-.3));
    R(bx+bw-1,-10+y0+armB,aw,1,shade(mitt,-.3));

    /* ---- head ------------------------------------------------------------ */
    const hx = lean + headT, hy = -34 + y0 + headB;
    /* ears, drawn first so the head overlaps their base */
    const earCol = pat === 'siamese' ? mark : fur;
    for (const side of [-1,1]) {
      const ex = side < 0 ? hx-8 : hx+3;
      const tilt = side < 0 ? ear : -ear;
      R(ex,hy-6+tilt,5,3,earCol);
      R(ex+ (side<0?0:1),hy-4+tilt,4,3,earCol);
      R(ex+1,hy-5+tilt,3,3,shade('#f0a0b0',.1));   /* inner ear */
      R(ex+ (side<0?0:1),hy-6+tilt,5,1,shade(earCol,.3));
    }
    /* the skull is built row by row so the corners round off — a square
       head is the single fastest way to stop reading as a cat */
    R(hx-6,hy,13,1,fur);
    R(hx-7,hy+1,15,1,fur);
    R(hx-8,hy+2,16,9,fur);
    R(hx-7,hy+11,15,1,fur);
    R(hx-6,hy+12,13,1,fur);
    R(hx-4,hy+13,9,1,fur);
    R(hx-9,hy+4,1,6,fur); R(hx+8,hy+4,1,6,fur);    /* cheek floof */
    R(hx-6,hy,13,2,furL);
    R(hx-6,hy+12,13,1,furD); R(hx-4,hy+13,9,1,furD);
    if (pat === 'tabby') {
      R(hx-5,hy,2,3,mark); R(hx-1,hy,2,3,mark); R(hx+3,hy,2,3,mark);
      R(hx-8,hy+3,2,1,mark); R(hx+7,hy+3,2,1,mark);
    }
    if (pat === 'siamese') { R(hx-5,hy+6,10,7,mark); R(hx-4,hy+13,9,1,mark); }
    if (pat === 'calico')  { R(hx-7,hy+1,6,5,mark); R(hx+4,hy+8,4,4,mark); }
    if (pat === 'spotted') { R(hx-6,hy+2,2,2,mark); R(hx+4,hy+3,2,2,mark); }
    if (pat === 'tuxedo')  { R(hx-3,hy+5,6,8,belly); }

    /* eyes — big, with a highlight and a slit pupil */
    const blink = pose === 'blink';
    const ex1 = hx-7, ex2 = hx+2;
    if (blink) { R(ex1,hy+5,5,1,P.ink); R(ex2,hy+5,5,1,P.ink);
                 R(ex1,hy+4,1,1,P.ink); R(ex2+4,hy+4,1,1,P.ink); }
    else for (const ex of [ex1,ex2]) {
      /* a rounded eye: mostly iris, a one-pixel slit, one white glint */
      R(ex+1,hy+3,3,1,P.ink);
      R(ex,hy+4,5,3,eye);
      R(ex+1,hy+7,3,1,eye);
      R(ex,hy+4,5,1,shade(eye,.35));
      R(ex+2,hy+4,1,4,P.ink);                        /* the slit */
      R(ex+1,hy+4,1,1,'#ffffff');
      R(ex+3,hy+6,1,1,shade(eye,-.45));
    }
    /* muzzle, nose and a proper cat mouth */
    const muz = pat === 'siamese' ? shade(mark,.35) : belly;
    R(hx-4,hy+8,8,4,muz);
    R(hx-3,hy+12,7,1,muz);
    R(hx-3,hy+12,7,1,shade(muz,-.2));
    R(hx-1,hy+8,3,2,'#e07a8a'); R(hx-1,hy+8,2,1,'#ff9aa8');
    if (pose === 'cheer' || pose === 'dance') {
      R(hx-2,hy+10,5,4,'#8a2a3a'); R(hx-1,hy+11,3,2,'#ff97a4'); R(hx-2,hy+10,5,1,P.ink);
    } else if (pose === 'hurt') {
      R(hx-2,hy+10,5,3,'#8a2a3a'); R(hx-2,hy+10,5,1,P.ink);
    } else if (pose === 'attack') {
      R(hx-3,hy+10,7,3,'#8a2a3a'); R(hx-3,hy+10,7,1,P.ink);
      R(hx-2,hy+10,1,2,'#ffffff'); R(hx+2,hy+10,1,2,'#ffffff');   /* fangs */
    } else {
      R(hx,hy+10,1,1,P.ink);
      R(hx-3,hy+11,3,1,P.ink); R(hx+1,hy+11,3,1,P.ink);
      R(hx-4,hy+10,1,1,P.ink); R(hx+4,hy+10,1,1,P.ink);
    }
    /* whiskers */
    const wcol = rgba('#ffffff',.85);
    R(hx-12,hy+8,4,1,wcol); R(hx-13,hy+10,5,1,wcol);
    R(hx+9,hy+8,4,1,wcol);  R(hx+9,hy+10,5,1,wcol);
    /* a bit of forehead floof so the silhouette is not a plain dome */
    R(hx-3,hy-1,2,2,furL); R(hx,hy-2,2,3,furL); R(hx+3,hy-1,2,2,furL);
  }

  /* outline pass — the thing that makes a cat pop off the background */
  function render(cfg, pose, f) {
    const key = [cfg.fur,cfg.mark,cfg.pattern,cfg.eyes,cfg.shirtCol,cfg.outfit,cfg.body,pose,f].join(',');
    if (cache.has(key)) return cache.get(key);
    const base = surface(W,H), b = base.getContext('2d');
    paint(b, cfg, pose, f);
    const sil = surface(W,H), s = sil.getContext('2d');
    s.drawImage(base,0,0); s.globalCompositeOperation = 'source-in';
    s.fillStyle = P.ink; s.fillRect(0,0,W,H);
    const out = surface(W,H), o = out.getContext('2d');
    o.drawImage(sil,-1,0); o.drawImage(sil,1,0); o.drawImage(sil,0,-1); o.drawImage(sil,0,1);
    o.drawImage(base,0,0);
    if (cache.size > 300) cache.clear();
    cache.set(key,out);
    return out;
  }

  return {
    W, H, FURS, MARKS, EYES, PATTERNS, SHIRTS, OUTFITS, defaults, render,
    /* aliases kept so older call sites keep working */
    get SKINS() { return FURS; }, get HAIRS() { return MARKS; },
    get STYLES() { return PATTERNS; }, get PANTS() { return MARKS; },
    get TOPS() { return OUTFITS; },

    /* draw with paws at (x,y). scale is forced to a whole number so a cat
       is never resampled onto half a pixel. */
    draw(c, x, y, cfg, pose, f, opt) {
      opt = opt || {};
      const img = render(cfg, pose||'idle', f||0);
      const sc = Math.max(1, Math.round(opt.scale || 1));
      const squash = opt.squash || 1;               /* cartoon squash & stretch */
      const dw = Math.round(W*sc*squash), dh = Math.round(H*sc*(2-squash));
      const dx = Math.round(x - dw/2), dy = Math.round(y - dh + 2*sc);
      if (opt.shadow !== false) {
        c.globalAlpha = .24;
        pxEllipse(c, Math.round(x), Math.round(y), Math.round(8*sc), Math.round(2.5*sc), '#000');
        c.globalAlpha = 1;
      }
      if (opt.alpha != null) c.globalAlpha = opt.alpha;
      if (opt.flip) { c.save(); c.translate(dx+dw, dy); c.scale(-1,1); c.drawImage(img,0,0,dw,dh); c.restore(); }
      else c.drawImage(img, dx, dy, dw, dh);
      c.globalAlpha = 1;
      if (opt.glow) {
        c.globalAlpha = .3 + .2*Math.sin(performance.now()/180);
        c.globalCompositeOperation = 'lighter';
        c.drawImage(img, dx, dy-1, dw, dh);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
    },
    randomCfg() {
      return { fur:rndi(0,FURS.length-1), mark:rndi(0,MARKS.length-1),
               pattern:rndi(0,PATTERNS.length-1), eyes:rndi(0,EYES.length-1),
               shirtCol:rndi(0,SHIRTS.length-1), outfit:rndi(0,OUTFITS.length-1), body:rndi(0,1) };
    }
  };
})();
