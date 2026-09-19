/* =========================================================================
   UTIL — the small vocabulary the rest of the game is written in.
   Virtual screen is a fixed 360x640 portrait panel. Everything draws into
   an offscreen canvas of exactly that size and gets blitted up with
   smoothing off, so a pixel is always a crisp square no matter the display.
   ========================================================================= */
const VW = 360, VH = 640;

const T = window.FONT_API;                      /* pixel type */
const txt   = (c,x,y,s,col,sc,sh) => T.drawText(c,x,y,String(s),col,sc||1,sh);
const ctxt  = (c,cx,y,s,col,sc,sh) => T.drawTextCentered(c,cx,y,String(s),col,sc||1,sh);
const tw    = (s,sc) => T.textWidth(String(s),sc||1);
const wrap  = (s,w,sc) => T.wrapText(String(s),w,sc||1);

/* Fit a string into a box: try the biggest scale that still wraps to a
   sensible number of lines. Answer text is written by humans and by me, so
   it ranges from "4" to a whole sentence, and both have to look deliberate. */
function fitText(str, maxW, maxH, maxScale) {
  for (let sc = maxScale || 2; sc >= 1; sc--) {
    const lines = wrap(str, maxW, sc);
    const lh = sc * 8 + (sc > 1 ? 2 : 3);
    if (lines.length * lh <= maxH || sc === 1) return { lines, scale:sc, lh };
  }
  return { lines:[String(str)], scale:1, lh:11 };
}
/* draw fitted text centred in a box */
function ctext(c, cx, cy, str, maxW, maxH, col, shadow, maxScale) {
  const f = fitText(str, maxW, maxH, maxScale);
  const top = Math.round(cy - (f.lines.length*f.lh)/2);
  f.lines.forEach((l,i) => ctxt(c, cx, top + i*f.lh, l, col, f.scale, shadow));
  return f;
}

/* ---- maths -------------------------------------------------------------- */
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const lerp  = (a,b,t) => a + (b-a)*t;
const inv   = (a,b,v) => b === a ? 0 : clamp((v-a)/(b-a),0,1);
const rnd   = (a,b) => a + Math.random()*(b-a);
const rndi  = (a,b) => Math.floor(a + Math.random()*(b-a+1));
const pick  = arr => arr[Math.floor(Math.random()*arr.length)];
const dist  = (x1,y1,x2,y2) => Math.hypot(x2-x1,y2-y1);
const TAU   = Math.PI*2;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}
/* a deterministic shuffle bag, so question pools never repeat until spent */
function Bag(items) {
  let pool = [];
  return { next() { if (!pool.length) pool = shuffle(items); return pool.pop(); },
           size: items.length, refill() { pool = shuffle(items); } };
}

/* ---- easing — bounce is the house style --------------------------------- */
const ease = {
  out:   t => 1 - Math.pow(1-t, 3),
  in:    t => t*t*t,
  inOut: t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  back:  t => { const c = 1.9; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); },
  elastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2,-9*t) * Math.sin((t*10-0.75)*(TAU/3)) + 1;
  },
  bounce(t) {
    const n = 7.5625, d = 2.75;
    if (t < 1/d) return n*t*t;
    if (t < 2/d) return n*(t-=1.5/d)*t + .75;
    if (t < 2.5/d) return n*(t-=2.25/d)*t + .9375;
    return n*(t-=2.625/d)*t + .984375;
  }
};
/* a 0..1 pulse that never sits still — used on anything that should breathe */
const pulse = (t,speed,amt) => 1 + Math.sin(t*(speed||4))*(amt||.04);

/* ---- colour ------------------------------------------------------------- */
function hex2rgb(h) {
  h = h.replace('#','');
  if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  const n = parseInt(h,16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
const rgb2hex = (r,g,b) =>
  '#' + [r,g,b].map(v => clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
function shade(h, amt) {                        /* amt<0 darker, >0 lighter */
  const [r,g,b] = hex2rgb(h);
  return amt < 0 ? rgb2hex(r*(1+amt), g*(1+amt), b*(1+amt))
                 : rgb2hex(r+(255-r)*amt, g+(255-g)*amt, b+(255-b)*amt);
}
const rgba = (h,a) => { const [r,g,b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };

/* the game palette — deliberately over-saturated, like a sticker sheet */
const P = {
  ink:'#1b1030', ink2:'#2e1b50', shadow:'#0d0720',
  white:'#fffdf5', bone:'#e7dcc6', grey:'#9a8fb5',
  sky1:'#2c7ff0', sky2:'#6cc8ff', sky3:'#b6ecff',
  dusk1:'#3b1e6e', dusk2:'#8b3fa8', dusk3:'#ff7a6b',
  grass:'#54d64a', grass2:'#35ad3c', grass3:'#218a33', grassLt:'#96f06a',
  dirt:'#b9773d', dirt2:'#8a5328', dirt3:'#5e3719',
  stone:'#9aa6c4', stone2:'#6b789c', stone3:'#434f74',
  wood:'#c08a4a', wood2:'#8a5a2c', wood3:'#5b3a1b',
  gold:'#ffd23f', gold2:'#f0a022', gold3:'#b3600f',
  red:'#ff4d5e', red2:'#c31f3f', green:'#3fe07a', green2:'#1d9a52',
  blue:'#49a7ff', blue2:'#2358c9', purple:'#a35cff', purple2:'#6a27c8',
  pink:'#ff5fb8', cyan:'#46ecd5', orange:'#ff9330', lime:'#c3ff4d'
};
const RARITY = {
  common:    { name:'COMMON',    col:'#b9c6dd', glow:'#e6f0ff' },
  rare:      { name:'RARE',      col:'#49a7ff', glow:'#a8dcff' },
  epic:      { name:'EPIC',      col:'#a35cff', glow:'#e0b6ff' },
  legendary: { name:'LEGENDARY', col:'#ffd23f', glow:'#fff0a8' }
};

/* ---- geometry ----------------------------------------------------------- */
const rect = (x,y,w,h) => ({x,y,w,h});
const hit  = (r,px,py) => px >= r.x && px <= r.x+r.w && py >= r.y && py <= r.y+r.h;

/* ---- canvas helpers ----------------------------------------------------- */
function surface(w,h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return c;
}
/* rounded pixel box: corners are literally clipped squares, not curves */
function pbox(c,x,y,w,h,fill,r) {
  r = r == null ? 2 : r;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  c.fillStyle = fill;
  c.fillRect(x+r, y, w-r*2, h);
  c.fillRect(x, y+r, r, h-r*2);
  c.fillRect(x+w-r, y+r, r, h-r*2);
  if (r > 1) { c.fillRect(x+1, y+1, r-1, r-1); c.fillRect(x+w-r, y+1, r-1, r-1);
               c.fillRect(x+1, y+h-r, r-1, r-1); c.fillRect(x+w-r, y+h-r, r-1, r-1); }
}
/* a panel with a hard outline, a lit top edge and a dark base — the single
   most useful shape in the whole game */
function panel(c,x,y,w,h,col,opt) {
  opt = opt || {};
  const r = opt.r == null ? 3 : opt.r;
  pbox(c, x-1, y-1, w+2, h+2, opt.line || P.ink, r+1);
  pbox(c, x, y, w, h, col, r);
  if (opt.flat) return;
  c.fillStyle = shade(col, .28);
  c.fillRect(Math.round(x)+r, Math.round(y)+1, Math.round(w)-r*2, 1);
  c.fillStyle = shade(col, -.3);
  c.fillRect(Math.round(x)+r, Math.round(y+h)-2, Math.round(w)-r*2, 1);
}
function hline(c,x,y,w,col) { c.fillStyle = col; c.fillRect(Math.round(x),Math.round(y),Math.round(w),1); }

/* a value bar with a notched pixel frame and a moving gloss */
function bar(c,x,y,w,h,frac,col,opt) {
  opt = opt || {};
  frac = clamp(frac,0,1);
  pbox(c,x-1,y-1,w+2,h+2,P.ink,2);
  pbox(c,x,y,w,h,opt.back || '#2a1f45',1);
  const fw = Math.round((w-2)*frac);
  if (fw > 0) {
    pbox(c,x+1,y+1,fw,h-2,col,1);
    c.fillStyle = shade(col,.45); c.fillRect(x+1,y+1,fw,1);
    c.fillStyle = shade(col,-.32); c.fillRect(x+1,y+h-2,fw,1);
    if (opt.shine != null) {                     /* travelling highlight */
      const sx = x+1 + ((opt.shine*(w+30))%(fw+30)) - 15;
      c.fillStyle = rgba('#ffffff',.35);
      for (let i=0;i<4;i++) { const px = Math.round(sx+i); if (px > x && px < x+fw) c.fillRect(px,y+1,1,h-2); }
    }
  }
  if (opt.ticks) { c.fillStyle = rgba(P.ink,.5);
    for (let i=1;i<opt.ticks;i++) c.fillRect(Math.round(x+ (w/opt.ticks)*i), y+1, 1, h-2); }
}

/* ---- persistence -------------------------------------------------------- */
const store = {
  get(k,d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k,v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k)   { try { localStorage.removeItem(k); } catch (e) {} }
};

/* ---- misc --------------------------------------------------------------- */
const today = () => new Date().toISOString().slice(0,10);
const commas = n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const plural = (n,s,p) => n === 1 ? s : (p || s+'s');
