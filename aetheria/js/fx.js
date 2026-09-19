/* =========================================================================
   FX — particles, popups, shakes and flashes. Nothing in this game happens
   quietly: every hit throws sparks, every correct answer throws stars.
   ========================================================================= */
const FX = (() => {
  let parts = [], floats = [], rings = [], shakeT = 0, shakeAmt = 0, flashT = 0, flashCol = '#fff', slowT = 0;

  function spawn(o) {
    parts.push(Object.assign({
      x:0, y:0, vx:0, vy:0, g:0, life:.6, t:0, size:2, col:P.white,
      kind:'px', spin:0, rot:0, drag:1, fade:true
    }, o));
  }

  const api = {
    /* --- emitters -------------------------------------------------------- */
    burst(x,y,n,col,opt) {
      opt = opt || {};
      for (let i=0;i<n;i++) {
        const a = opt.dir != null ? opt.dir + rnd(-opt.spread||-.7, opt.spread||.7) : rnd(0,TAU);
        const sp = rnd(opt.minSpeed||30, opt.speed||110);
        spawn({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:opt.g == null ? 130 : opt.g,
                life:rnd(.3,opt.life||.75), size:opt.size || rndi(1,3),
                col: Array.isArray(col) ? pick(col) : col, kind:opt.kind || 'px', drag:opt.drag||.94 });
      }
    },
    spark(x,y,n,col) { api.burst(x,y,n,col||[P.gold,P.white,P.orange],{speed:150,g:220,size:2,kind:'trail'}); },
    stars(x,y,n,col) {
      for (let i=0;i<n;i++) {
        const a = rnd(0,TAU), sp = rnd(25,95);
        spawn({ x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-30, g:70, life:rnd(.55,1.05),
                size:rndi(3,5), col:col || pick([P.gold,P.white,P.cyan]), kind:'star', spin:rnd(-9,9), drag:.96 });
      }
    },
    dust(x,y,n,col) {
      for (let i=0;i<(n||5);i++)
        spawn({ x:x+rnd(-4,4), y, vx:rnd(-18,18), vy:rnd(-24,-6), g:40, life:rnd(.3,.6),
                size:rndi(1,2), col:col||'#e9dfc0', kind:'px', drag:.9 });
    },
    confetti(x,y,n) {
      for (let i=0;i<n;i++)
        spawn({ x:x+rnd(-30,30), y:y+rnd(-10,10), vx:rnd(-70,70), vy:rnd(-190,-70), g:230,
                life:rnd(1,1.9), size:rndi(2,4), col:pick([P.gold,P.pink,P.cyan,P.lime,P.blue,P.red,P.white]),
                kind:'flake', spin:rnd(-12,12), drag:.98 });
    },
    leaves(x,y,n) {
      for (let i=0;i<n;i++)
        spawn({ x:x+rnd(-8,8), y:y+rnd(-6,6), vx:rnd(-40,40), vy:rnd(-70,-20), g:55,
                life:rnd(.9,1.7), size:3, col:pick([P.grass,P.grass2,P.grassLt,P.lime]),
                kind:'flake', spin:rnd(-7,7), drag:.97 });
    },
    smoke(x,y,n,col) {
      for (let i=0;i<(n||4);i++)
        spawn({ x:x+rnd(-3,3), y:y+rnd(-2,2), vx:rnd(-10,10), vy:rnd(-26,-12), g:-6,
                life:rnd(.6,1.2), size:rndi(2,4), col:col||'#c9c2dd', kind:'soft', drag:.97 });
    },
    trail(x,y,col) { spawn({ x,y, vx:rnd(-8,8), vy:rnd(-8,8), g:0, life:.3, size:2, col, kind:'px', drag:.9 }); },

    /* --- readouts -------------------------------------------------------- */
    float(x,y,text,col,opt) {
      opt = opt || {};
      floats.push({ x, y, text:String(text), col:col||P.white, t:0,
                    life:opt.life||1.1, scale:opt.scale||1, vy:opt.vy||-34,
                    pop:opt.pop !== false, shake:opt.shake||0 });
    },
    ring(x,y,col,opt) {
      opt = opt || {};
      rings.push({ x, y, col, t:0, life:opt.life||.45, r0:opt.r0||4, r1:opt.r1||42, w:opt.w||2, kind:opt.kind||'ring' });
    },
    shake(amt,dur) { shakeAmt = Math.max(shakeAmt, amt); shakeT = Math.max(shakeT, dur||.28); },
    flash(col,dur) { flashCol = col || '#fff'; flashT = dur || .12; },
    slow(dur) { slowT = Math.max(slowT, dur || .18); },

    /* --- pump ------------------------------------------------------------ */
    get timeScale() { return slowT > 0 ? .32 : 1; },
    update(dt) {
      if (slowT > 0) slowT -= dt;
      for (let i=parts.length-1;i>=0;i--) {
        const p = parts[i];
        p.t += dt;
        if (p.t >= p.life) { parts.splice(i,1); continue; }
        p.vy += p.g*dt; p.vx *= Math.pow(p.drag,dt*60); p.vy *= Math.pow(p.drag,dt*60);
        p.x += p.vx*dt; p.y += p.vy*dt; p.rot += p.spin*dt;
      }
      for (let i=floats.length-1;i>=0;i--) {
        const f = floats[i]; f.t += dt;
        if (f.t >= f.life) { floats.splice(i,1); continue; }
        f.y += f.vy*dt; f.vy *= .93;
      }
      for (let i=rings.length-1;i>=0;i--) { rings[i].t += dt; if (rings[i].t >= rings[i].life) rings.splice(i,1); }
      if (shakeT > 0) { shakeT -= dt; if (shakeT <= 0) shakeAmt = 0; }
      if (flashT > 0) flashT -= dt;
      if (parts.length > 700) parts.splice(0, parts.length-700);
    },

    /* the camera offset every scene applies before drawing the world */
    shakeOffset() {
      if (shakeT <= 0) return [0,0];
      const a = shakeAmt * (shakeT/.28);
      return [Math.round(rnd(-a,a)), Math.round(rnd(-a,a))];
    },

    drawParts(c) {
      for (const p of parts) {
        const k = 1 - p.t/p.life;
        const s = Math.max(1, Math.round(p.size * (p.kind === 'soft' ? (0.6+ (1-k)) : k < .3 ? k/.3 : 1)));
        c.globalAlpha = p.kind === 'soft' ? k*.5 : (p.fade && k < .35 ? k/.35 : 1);
        c.fillStyle = p.col;
        const x = Math.round(p.x), y = Math.round(p.y);
        if (p.kind === 'star') {
          const r = Math.max(1, Math.round(s*k));
          c.fillRect(x-r, y, r*2+1, 1); c.fillRect(x, y-r, 1, r*2+1);
          c.fillRect(x-1,y-1,3,3);
        } else if (p.kind === 'flake') {
          const w = Math.max(1, Math.round(Math.abs(Math.cos(p.rot))*s)+1);
          c.fillRect(x-(w>>1), y-1, w, 2);
        } else if (p.kind === 'trail') {
          c.fillRect(x, y, s, s);
          c.globalAlpha *= .4;
          c.fillRect(Math.round(x-p.vx*.025), Math.round(y-p.vy*.025), Math.max(1,s-1), Math.max(1,s-1));
        } else {
          c.fillRect(x-(s>>1), y-(s>>1), s, s);
        }
      }
      c.globalAlpha = 1;
      for (const r of rings) {
        const k = r.t/r.life, rad = Math.round(lerp(r.r0, r.r1, ease.out(k)));
        c.globalAlpha = 1-k;
        c.strokeStyle = r.col; c.lineWidth = r.w;
        if (r.kind === 'ring') { c.beginPath(); c.arc(r.x, r.y, rad, 0, TAU); c.stroke(); }
        else {                                      /* a squashed shockwave */
          c.beginPath(); c.ellipse(r.x, r.y, rad, Math.max(1,rad*.4), 0, 0, TAU); c.stroke();
        }
      }
      c.globalAlpha = 1;
    },
    drawFloats(c) {
      for (const f of floats) {
        const k = f.t/f.life;
        let sc = f.scale;
        if (f.pop) sc *= k < .22 ? lerp(.3, 1.25, ease.back(k/.22)) : lerp(1.25, 1, ease.out(inv(.22,.5,k)));
        sc = Math.max(1, Math.round(sc));
        c.globalAlpha = k > .7 ? 1-(k-.7)/.3 : 1;
        const jx = f.shake ? rnd(-f.shake,f.shake) : 0;
        ctxt(c, f.x+jx, f.y, f.text, f.col, sc, P.ink);
        c.globalAlpha = 1;
      }
    },
    drawFlash(c) {
      if (flashT <= 0) return;
      c.globalAlpha = clamp(flashT/.12,0,1)*.8; c.fillStyle = flashCol;
      c.fillRect(0,0,VW,VH); c.globalAlpha = 1;
    },
    clear() { parts = []; floats = []; rings = []; shakeT = 0; flashT = 0; slowT = 0; },
    get count() { return parts.length; }
  };
  return api;
})();

/* -------------------------------------------------------------------------
   TWEEN — a one-shot value with an easing curve. Menus, cards and chests
   are all built out of these.
   ------------------------------------------------------------------------- */
function Tween(from,to,dur,fn) {
  return { v:from, from, to, dur, t:0, fn:fn||ease.out, done:false,
    step(dt) {
      if (this.done) return this.v;
      this.t += dt;
      const k = clamp(this.t/this.dur,0,1);
      this.v = lerp(this.from, this.to, this.fn(k));
      if (k >= 1) { this.done = true; this.v = this.to; }
      return this.v;
    },
    reset(from,to,dur) { this.from = from; this.to = to; this.v = from; this.t = 0; this.dur = dur||this.dur; this.done = false; return this; }
  };
}
