/* =========================================================================
   AVATAR — you, made of about four hundred pixels.

   The body is painted procedurally so hair colour, shirt colour and skin
   tone are live values rather than twelve hand-drawn variants. Each finished
   pose is then stamped with a hard outline (draw the silhouette four times,
   one pixel out, then the art on top) which is what gives everything that
   sticker look.
   ========================================================================= */
const AV = (() => {
  const W = 26, H = 34, FEET = H-2;
  const cache = new Map();

  const SKINS  = ['#ffd2ab','#f0b184','#d18a5c','#a86238','#7a4526','#5a3320'];
  const HAIRS  = ['#3a2a1e','#6b4423','#c98b3a','#ffd23f','#e0523a','#ff5fb8','#a35cff','#49a7ff','#3fe07a','#e7dcc6','#1b1030','#46ecd5'];
  const SHIRTS = ['#ff4d5e','#49a7ff','#3fe07a','#ffd23f','#a35cff','#ff5fb8','#46ecd5','#ff9330','#fffdf5','#2e1b50'];
  const PANTS  = ['#2358c9','#434f74','#8a5a2c','#1b1030','#6a27c8','#1d9a52'];
  const STYLES = ['short','long','spike','bun','curly','buzz'];
  const TOPS   = ['plain','stripe','hoodie'];

  const defaults = () => ({
    body:1, skin:0, hair:0, hairCol:1, shirt:0, shirtCol:0, pants:0, top:0
  });

  /* ---- the painter. everything positions off the feet ------------------- */
  function paint(c, cfg, pose, f) {
    const skin = SKINS[cfg.skin % SKINS.length];
    const skinD = shade(skin,-.22), skinL = shade(skin,.22);
    const hair = HAIRS[cfg.hairCol % HAIRS.length];
    const hairD = shade(hair,-.3), hairL = shade(hair,.3);
    const shirt = SHIRTS[cfg.shirtCol % SHIRTS.length];
    const shirtD = shade(shirt,-.25), shirtL = shade(shirt,.28);
    const pant = PANTS[cfg.pants % PANTS.length], pantD = shade(pant,-.28);
    const slim = cfg.body === 0;                       /* silhouette width */
    const cx = Math.round(W/2);
    const R = (x,y,w,h,col) => { c.fillStyle = col; c.fillRect(Math.round(cx+x), Math.round(FEET+y), Math.round(w), Math.round(h)); };

    /* pose offsets: body bob, lean, leg split, arm angle */
    let bob = 0, lean = 0, legA = 0, legB = 0, armA = 0, armB = 0, headT = 0, squash = 0;
    if (pose === 'idle')  { bob = f === 1 ? -1 : 0; armA = f === 1 ? -1 : 0; }
    else if (pose === 'walk') {
      const k = f % 4;
      bob  = (k === 1 || k === 3) ? -1 : 0;
      legA = [0,-2,0,2][k]; legB = -legA;
      armA = [0,2,0,-2][k]; armB = -armA;
    } else if (pose === 'dance') {
      lean = f % 2 ? 2 : -2; bob = f % 2 ? -2 : 0;
      armA = -7; armB = -7; headT = f % 2 ? -1 : 1; legA = f % 2 ? -1 : 1; legB = -legA;
    } else if (pose === 'cheer') { bob = -2; armA = -9; armB = -9; }
    else if (pose === 'wave')    { armB = -8; bob = f === 1 ? -1 : 0; }
    else if (pose === 'sit')     { bob = 4; legA = 0; legB = 0; }
    else if (pose === 'sleep')   { bob = 0; }
    else if (pose === 'attack')  { lean = 3; armB = -6; bob = -1; }
    else if (pose === 'hurt')    { lean = -3; bob = 1; squash = 1; }

    /* --- sleeping is drawn lying down, so it gets its own little routine -- */
    if (pose === 'sleep') {
      const yy = -6;
      R(-11,yy+4,22,6,shirt); R(-11,yy+8,22,2,shirtD);
      R(6,yy+4,6,6,pant); R(9,yy+9,4,2,pantD);
      /* head on the left, hair spread on the ground */
      R(-16,yy+1,8,8,skin); R(-16,yy+1,8,2,skinL); R(-16,yy+7,8,2,skinD);
      R(-18,yy,10,3,hair); R(-18,yy+3,3,6,hair); R(-18,yy,10,1,hairL);
      R(-13,yy+4,1,1,P.ink); R(-11,yy+4,1,1,P.ink);   /* closed eyes: dashes */
      R(-13,yy+4,2,1,P.ink); R(-10,yy+4,2,1,P.ink);
      R(-1,yy+3,3,1,shirtL);
      return;
    }

    const y0 = bob;                                    /* feet stay planted */
    /* --- legs ------------------------------------------------------------ */
    if (pose === 'sit') {
      R(-6+lean,-8+y0,5,7,pant); R(1+lean,-8+y0,5,7,pant);
      R(-6+lean,-2+y0,5,2,pantD); R(1+lean,-2+y0,5,2,pantD);
      R(-8+lean,-2+y0,4,2,'#2e1b50'); R(4+lean,-2+y0,4,2,'#2e1b50');
    } else {
      R(-5+lean+legA*0.4,-8+y0,4,6,pant);  R(1+lean+legB*0.4,-8+y0,4,6,pant);
      R(-5+lean+legA*0.4,-4+y0,4,2,pantD); R(1+lean+legB*0.4,-4+y0,4,2,pantD);
      R(-6+lean+legA*0.6,-2+y0,5,2,'#2e1b50'); R(1+lean+legB*0.6,-2+y0,5,2,'#2e1b50');
      R(-6+lean+legA*0.6,-2+y0,5,1,'#4a3a70'); R(1+lean+legB*0.6,-2+y0,5,1,'#4a3a70');
    }
    /* --- torso ----------------------------------------------------------- */
    const bw = slim ? 9 : 11, bx = -Math.floor(bw/2) + lean;
    R(bx,-17+y0+squash,bw,10-squash,shirt);
    R(bx,-17+y0+squash,bw,2,shirtL);
    R(bx,-9+y0,bw,2,shirtD);
    if (cfg.top === 1) { R(bx,-14+y0,bw,2,shirtL); R(bx,-11+y0,bw,1,shirtL); }
    if (cfg.top === 2) {                              /* hoodie: hood + pocket */
      R(bx-1,-18+y0,bw+2,3,shirtD);
      R(bx+2,-12+y0,bw-4,3,shirtD);
      R(cx*0-0+lean,-19+y0,1,2,shirtL);
    }
    /* --- arms ------------------------------------------------------------ */
    const aw = 3;
    R(bx-aw,-16+y0+armA*0.5,aw,7,shirtD);
    R(bx+bw,-16+y0+armB*0.5,aw,7,shirtD);
    R(bx-aw,-10+y0+armA,aw,3,skin);                   /* hands */
    R(bx+bw,-10+y0+armB,aw,3,skin);
    /* --- head ------------------------------------------------------------ */
    const hy = -27+y0, hx = lean + headT;
    R(hx-5,hy,10,10,skin);
    R(hx-5,hy,10,1,skinL); R(hx-5,hy+9,10,1,skinD);
    R(hx-6,hy+2,1,6,skin); R(hx+5,hy+2,1,6,skin);     /* ears */
    R(hx-6,hy+4,1,2,skinD); R(hx+5,hy+4,1,2,skinD);
    /* eyes — a white, a pupil, a glint */
    const blink = pose === 'blink';
    if (blink) { R(hx-4,hy+5,3,1,P.ink); R(hx+1,hy+5,3,1,P.ink); }
    else {
      R(hx-4,hy+4,3,3,'#ffffff'); R(hx+1,hy+4,3,3,'#ffffff');
      R(hx-3,hy+5,2,2,P.ink);     R(hx+2,hy+5,2,2,P.ink);
      R(hx-3,hy+5,1,1,'#ffffff'); R(hx+2,hy+5,1,1,'#ffffff');
    }
    R(hx-5,hy+7,2,1,rgba('#ff8090',.6)); R(hx+3,hy+7,2,1,rgba('#ff8090',.6));  /* blush */
    if (pose === 'cheer' || pose === 'dance') { R(hx-2,hy+8,4,2,'#8a2a3a'); R(hx-1,hy+8,2,1,'#ff97a4'); }
    else if (pose === 'hurt') { R(hx-2,hy+8,4,1,'#8a2a3a'); R(hx-2,hy+7,1,1,'#8a2a3a'); R(hx+1,hy+7,1,1,'#8a2a3a'); }
    else R(hx-1,hy+8,3,1,'#8a2a3a');
    /* --- hair ------------------------------------------------------------ */
    const st = STYLES[cfg.hair % STYLES.length];
    R(hx-5,hy-1,10,3,hair); R(hx-6,hy+1,1,3,hair); R(hx+5,hy+1,1,3,hair);
    R(hx-5,hy-1,10,1,hairL);
    if (st === 'short') { R(hx-5,hy+2,3,2,hair); R(hx+3,hy+2,2,1,hairD); }
    else if (st === 'buzz') { R(hx-5,hy-1,10,2,hairD); R(hx-5,hy-1,10,1,hair); }
    else if (st === 'long') {
      R(hx-7,hy+1,2,11,hair); R(hx+5,hy+1,2,11,hair);
      R(hx-7,hy+10,2,2,hairD); R(hx+5,hy+10,2,2,hairD);
      R(hx-7,hy+1,1,7,hairL);
    } else if (st === 'spike') {
      for (let i=0;i<5;i++) { R(hx-5+i*2,hy-2-(i%2?2:1),2,3,hair); R(hx-5+i*2,hy-2-(i%2?2:1),1,1,hairL); }
      R(hx-6,hy+1,2,3,hair);
    } else if (st === 'bun') {
      R(hx-2,hy-5,5,4,hair); R(hx-2,hy-5,5,1,hairL); R(hx-3,hy-4,1,2,hairD); R(hx+3,hy-4,1,2,hairD);
      R(hx+5,hy+2,2,5,hair);
    } else if (st === 'curly') {
      R(hx-7,hy,3,3,hair); R(hx+4,hy,3,3,hair); R(hx-4,hy-3,4,3,hair); R(hx+1,hy-3,4,3,hair);
      R(hx-7,hy+2,2,4,hair); R(hx+5,hy+2,2,4,hair); R(hx-4,hy-3,2,1,hairL);
    }
  }

  /* outline pass — the thing that makes it pop off the background */
  function render(cfg, pose, f) {
    const key = [cfg.body,cfg.skin,cfg.hair,cfg.hairCol,cfg.shirtCol,cfg.pants,cfg.top,pose,f].join(',');
    if (cache.has(key)) return cache.get(key);
    const base = surface(W,H), b = base.getContext('2d');
    paint(b, cfg, pose, f);
    const sil = surface(W,H), s = sil.getContext('2d');
    s.drawImage(base,0,0); s.globalCompositeOperation = 'source-in';
    s.fillStyle = P.ink; s.fillRect(0,0,W,H);
    const out = surface(W,H), o = out.getContext('2d');
    o.drawImage(sil,-1,0); o.drawImage(sil,1,0); o.drawImage(sil,0,-1); o.drawImage(sil,0,1);
    o.drawImage(base,0,0);
    if (cache.size > 260) cache.clear();
    cache.set(key,out);
    return out;
  }

  return {
    W, H, SKINS, HAIRS, SHIRTS, PANTS, STYLES, TOPS, defaults, render,
    /* draw with feet at (x,y) */
    draw(c, x, y, cfg, pose, f, opt) {
      opt = opt || {};
      const img = render(cfg, pose||'idle', f||0);
      const sc = opt.scale || 1;
      const dx = Math.round(x - (W/2)*sc), dy = Math.round(y - (H-2)*sc);
      if (opt.shadow !== false) {
        c.globalAlpha = .22;
        pxEllipse(c, Math.round(x), Math.round(y), Math.round(7*sc), Math.round(2.5*sc), '#000');
        c.globalAlpha = 1;
      }
      if (opt.alpha != null) c.globalAlpha = opt.alpha;
      if (opt.flip) { c.save(); c.translate(dx+W*sc, dy); c.scale(-1,1); c.drawImage(img,0,0,W*sc,H*sc); c.restore(); }
      else c.drawImage(img, dx, dy, W*sc, H*sc);
      c.globalAlpha = 1;
      if (opt.glow) {
        c.globalAlpha = .3 + .2*Math.sin(performance.now()/180);
        c.globalCompositeOperation = 'lighter';
        c.drawImage(img, dx, dy-1, W*sc, H*sc);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
    },
    randomCfg() {
      return { body:rndi(0,1), skin:rndi(0,SKINS.length-1), hair:rndi(0,STYLES.length-1),
               hairCol:rndi(0,HAIRS.length-1), shirt:0, shirtCol:rndi(0,SHIRTS.length-1),
               pants:rndi(0,PANTS.length-1), top:rndi(0,2) };
    }
  };
})();
