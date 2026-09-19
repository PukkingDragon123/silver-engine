/* =========================================================================
   UI — immediate-mode pixel widgets. A scene calls UI.btn(...) while it
   draws and gets back true on the frame the button is released, so there is
   no widget tree to keep in sync with anything.
   ========================================================================= */
const UI = (() => {
  const press = new Map();          /* id -> 0..1 squash */
  let held = null, toasts = [], time = 0;

  function id(x,y,label) { return label + '@' + Math.round(x) + ',' + Math.round(y); }

  const api = {
    frame(dt) {
      time += dt;
      for (const [k,v] of press) {
        const target = (held === k) ? 1 : 0;
        const nv = lerp(v, target, 1 - Math.pow(0.0008, dt));
        if (nv < .002 && target === 0) press.delete(k); else press.set(k, nv);
      }
      for (let i=toasts.length-1;i>=0;i--) { toasts[i].t += dt; if (toasts[i].t > toasts[i].life) toasts.splice(i,1); }
      /* Keep the held button alive through the frame that reports the
         release. UI.frame runs before the scene draws, so clearing it the
         moment the pointer lifts threw away every press that lasted longer
         than one frame — which is every real press by a real finger. */
      if (!Input.down && !Input.justUp) held = null;
    },
    toast(msg, col, icon) { toasts.unshift({ msg, col:col||P.white, icon, t:0, life:2.1 }); if (toasts.length > 4) toasts.pop(); },

    /* --- the workhorse ---------------------------------------------------- */
    btn(c, x, y, w, h, label, opt) {
      opt = opt || {};
      const k = id(x,y,label||opt.key||'b');
      const r = rect(x,y,w,h);
      const over = hit(r, Input.x, Input.y);
      if (over && Input.justDown && !opt.disabled) { held = k; press.set(k,.4); SFX.play('tap'); }
      const p = press.get(k) || 0;
      const lift = opt.disabled ? 0 : Math.round(4*(1-p));
      const base = opt.col || P.green2, face = opt.col2 || shade(base,.35);
      const dim = opt.disabled ? .45 : 1;
      c.globalAlpha = dim;
      pbox(c, x-1, y-1+ (4-lift), w+2, h+2+lift, P.ink, 4);            /* skirt */
      pbox(c, x, y+(4-lift), w, h, shade(base,-.25), 3);
      pbox(c, x, y+(4-lift), w, h-3, face, 3);
      c.fillStyle = shade(face,.35); c.fillRect(x+3, y+(4-lift)+1, w-6, 1);
      if (opt.glow) {
        c.globalAlpha = dim * (.25+.25*Math.sin(time*6));
        pbox(c, x-2, y-2+(4-lift), w+4, h+4, opt.glow, 5); c.globalAlpha = dim;
      }
      const ty = y + (4-lift) + Math.round((h-3-7*(opt.scale||1))/2);
      let tx = x + w/2;
      if (opt.icon) {
        const iw = 12*(opt.iscale||1);
        const total = iw + 3 + tw(label||'', opt.scale||1);
        tx = x + w/2 + iw/2 + 2;
        spr(c, opt.icon, x + w/2 - total/2, ty + (7*(opt.scale||1))/2 - 6*(opt.iscale||1), { scale:opt.iscale||1 });
      }
      if (label) ctxt(c, tx, ty, label, opt.txt || P.white, opt.scale||1, opt.shadow===false?null:rgba(P.ink,.7));
      c.globalAlpha = 1;
      const clicked = over && Input.justUp && held === k && !opt.disabled;
      if (clicked) { held = null; if (opt.sound !== false) SFX.play(opt.sound || 'tap'); }
      return clicked;
    },

    /* a button whose label is a whole sentence — used for every answer */
    btnWrap(c, x, y, w, h, label, opt) {
      opt = opt || {};
      const k = id(x,y,(opt.key||'') + label);
      const r = rect(x,y,w,h);
      const over = hit(r, Input.x, Input.y);
      if (over && Input.justDown && !opt.disabled) { held = k; press.set(k,.4); SFX.play('tap'); }
      const p = press.get(k) || 0;
      const lift = opt.disabled ? 0 : Math.round(4*(1-p));
      const base = opt.col || '#3a2a5e', face = opt.col2 || '#5a4790';
      c.globalAlpha = opt.disabled ? .5 : 1;
      pbox(c, x-1, y-1+(4-lift), w+2, h+2+lift, P.ink, 4);
      pbox(c, x, y+(4-lift), w, h, shade(base,-.25), 3);
      pbox(c, x, y+(4-lift), w, h-3, face, 3);
      c.fillStyle = shade(face,.32); c.fillRect(x+3, y+(4-lift)+1, w-6, 1);
      ctext(c, x+w/2, y+(4-lift)+(h-3)/2, label, w-16, h-14, opt.txt || P.white, rgba(P.ink,.7), opt.maxScale || 2);
      c.globalAlpha = 1;
      const clicked = over && Input.justUp && held === k && !opt.disabled;
      if (clicked) { held = null; SFX.play('tap'); }
      return clicked;
    },

    /* a bare tappable area (sprites, map nodes, buildings) */
    zone(x,y,w,h,key) {
      const k = id(x,y,key||'z');
      const r = rect(x,y,w,h), over = hit(r, Input.x, Input.y);
      if (over && Input.justDown) { held = k; }
      return { over, down: held === k, click: over && Input.justUp && held === k };
    },

    /* --- chrome ---------------------------------------------------------- */
    back(c, label) {
      return api.btn(c, 8, 8, 44, 24, label || '<', { col:'#4a3a70', col2:'#6b56a0', scale:1 });
    },
    topBar(c, opt) {
      opt = opt || {};
      const h = 26;
      pbox(c, -2, -2, VW+4, h+2, rgba(P.ink,.88), 3);
      hline(c, 0, h, VW, rgba(P.purple,.55));
      const items = opt.items || [['i_coin', S.d.coins], ['i_wood', Math.floor(S.d.wood)],
                                  ['i_stone', Math.floor(S.d.stone)], ['i_essence', Math.floor(S.d.essence)]];
      let x = 6;
      for (const [ic,val] of items) {
        spr(c, ic, x, 7, { scale:1 });
        const s = commas(val);
        txt(c, x+13, 10, s, P.white, 1, P.shadow);
        x += 15 + tw(s,1) + 9;
      }
      /* rank chip on the right */
      const rk = S.rank(), lbl = rk.name + ' ' + S.d.trophies;
      const bw = tw(lbl,1) + 20;
      pbox(c, VW-bw-6, 4, bw, 18, rgba(rk.col,.22), 3);
      pbox(c, VW-bw-6, 4, bw, 18, 'rgba(0,0,0,0)', 3);
      spr(c, 'i_trophy', VW-bw-2, 7);
      txt(c, VW-bw+11, 10, lbl, rk.col, 1, P.shadow);
      return h;
    },
    levelChip(c, x, y) {
      const need = S.xpNeed(S.d.lvl), f = S.d.xp/need;
      panel(c, x, y, 96, 22, '#2e1b50');
      txt(c, x+5, y+4, 'LV ' + S.d.lvl, P.gold, 1, P.shadow);
      bar(c, x+5, y+14, 86, 4, f, P.cyan, { shine:time*.6 });
      return 22;
    },
    stars(c, cx, y, n, max, s) {
      s = Math.max(1, Math.round(s || 1)); max = max || 3;   /* whole pixels only */
      const step = 12*s + 1;
      for (let i=0;i<max;i++) {
        const x = cx - (max*step)/2 + i*step + step/2;
        if (i < n) spr(c, 'i_star', x, y, { center:true, scale:s });
        else { c.globalAlpha = .28; spr(c, 'i_star', x, y, { center:true, scale:s, tint:'#000' }); c.globalAlpha = 1; }
      }
    },
    /* scrolling banner used on every screen header */
    header(c, y, title, sub, col) {
      pbox(c, 12, y, VW-24, sub ? 34 : 24, rgba(P.ink,.8), 3);
      ctxt(c, VW/2, y+5, title, col || P.gold, 2, P.shadow);
      if (sub) ctxt(c, VW/2, y+22, sub, P.grey, 1);
    },
    drawToasts(c) {
      for (let i=0;i<toasts.length;i++) {
        const t = toasts[i];
        const k = t.t/t.life;
        const slide = k < .12 ? ease.back(k/.12) : 1;
        const a = k > .78 ? 1-(k-.78)/.22 : 1;
        const w = tw(t.msg,1) + 22 + (t.icon?14:0);
        const x = VW/2 - w/2, y = 148 + i*22 - (1-slide)*20;
        c.globalAlpha = a;
        panel(c, x, y, w, 18, '#2e1b50');
        if (t.icon) spr(c, t.icon, x+5, y+3);
        txt(c, x + (t.icon?20:11), y+6, t.msg, t.col, 1, P.shadow);
        c.globalAlpha = 1;
      }
    },

    /* --- battle-style card ------------------------------------------------ */
    card(c, x, y, w, h, opt) {
      opt = opt || {};
      const el = CONTENT.ELEM[opt.el || 'arcane'];
      const tilt = opt.tilt || 0;
      c.save();
      c.translate(Math.round(x+w/2), Math.round(y+h/2));
      if (tilt) c.rotate(tilt);
      if (opt.scale && opt.scale !== 1) c.scale(opt.scale, opt.scale);
      c.translate(-Math.round(w/2), -Math.round(h/2));
      pbox(c, -2, -2, w+4, h+4, P.ink, 4);
      pbox(c, 0, 0, w, h, shade(el.col2,-.35), 3);
      pbox(c, 2, 2, w-4, h-4, el.col2, 2);
      pbox(c, 2, 2, w-4, Math.round(h*.44), shade(el.col,.1), 2);
      /* corner pips */
      c.fillStyle = shade(el.col,.5); c.fillRect(3,3,3,1); c.fillRect(3,3,1,3);
      c.fillRect(w-6,h-4,3,1); c.fillRect(w-4,h-6,1,3);
      if (opt.dim) { c.globalAlpha = .55; c.fillStyle = P.shadow; c.fillRect(0,0,w,h); c.globalAlpha = 1; }
      c.restore();
    },
    get time() { return time; }
  };
  return api;
})();
