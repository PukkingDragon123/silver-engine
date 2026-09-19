/* =========================================================================
   SHEET — the small amount of real DOM the game allows itself.

   Everything else is canvas, but getting a page of revision notes into the
   game through a pixel keyboard would be cruel, so text entry borrows the
   platform's own textarea, file picker and date field, dressed to match.
   ========================================================================= */
const Sheet = (() => {
  const host = () => document.getElementById('sheet');
  const body = () => document.getElementById('shbody');
  let openNow = false;

  function close() { const h = host(); if (h) h.classList.remove('on'); openNow = false; }
  const isOpen = () => openNow;

  function show(html, wire) {
    const h = host(), b = body();
    if (!h || !b) return;
    b.innerHTML = html;
    h.classList.add('on');
    openNow = true;
    wire(b);
  }

  /* read a dropped or picked file as text; binary formats are refused
     honestly rather than pasted in as mojibake */
  function readFile(file) {
    return new Promise((res, rej) => {
      const name = (file.name||'notes').toLowerCase();
      if (/\.(pdf|docx?|pptx?|xlsx?|zip|png|jpe?g|gif|mp[34]|heic)$/.test(name))
        return rej(new Error(file.name + ' is not plain text — open it, select all, and paste instead.'));
      if (file.size > 400000) return rej(new Error('That file is over 400 KB. Paste the part you need.'));
      const r = new FileReader();
      r.onload = () => res(String(r.result||''));
      r.onerror = () => rej(new Error('Could not read that file.'));
      r.readAsText(file);
    });
  }

  return {
    isOpen, close,

    /* --- add study material -------------------------------------------- */
    addMaterial(done) {
      show(`
        <h3>FEED THE TUTOR</h3>
        <p>Paste your notes, a syllabus, a past paper, a textbook chapter — anything you
           are being tested on. The tutor reads it to build your plan and to make levels.</p>
        <label for="shname">WHAT IS THIS?</label>
        <input type="text" id="shname" maxlength="40" placeholder="Biology — cell division">
        <label for="shtext">PASTE IT HERE</label>
        <textarea id="shtext" placeholder="Paste your notes..."></textarea>
        <div class="drop" id="shdrop">or tap to pick a .txt / .md / .csv file</div>
        <input type="file" id="shfile" accept=".txt,.md,.markdown,.csv,.json,.rtf,text/*" hidden>
        <div class="files" id="shmsg"></div>
        <div class="row">
          <button id="shadd">ADD IT</button>
          <button class="ghost" id="shcancel">CANCEL</button>
        </div>`, b => {
        const ta = b.querySelector('#shtext'), nm = b.querySelector('#shname');
        const msg = b.querySelector('#shmsg'), drop = b.querySelector('#shdrop');
        const file = b.querySelector('#shfile');
        drop.onclick = () => file.click();
        file.onchange = async () => {
          const f = file.files && file.files[0];
          if (!f) return;
          try {
            const text = await readFile(f);
            ta.value = text;
            if (!nm.value) nm.value = f.name.replace(/\.[^.]+$/,'').slice(0,40);
            msg.textContent = f.name + ' loaded — ' + text.length.toLocaleString() + ' characters';
            msg.style.color = '#3fe07a';
          } catch (e) { msg.textContent = e.message; msg.style.color = '#ff4d5e'; }
        };
        ['dragover','dragenter'].forEach(ev => drop.addEventListener(ev, e => {
          e.preventDefault(); drop.classList.add('hot'); }));
        ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => {
          e.preventDefault(); drop.classList.remove('hot'); }));
        drop.addEventListener('drop', async e => {
          const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
          if (!f) return;
          try { ta.value = await readFile(f); if (!nm.value) nm.value = f.name.slice(0,40);
                msg.textContent = f.name + ' loaded'; msg.style.color = '#3fe07a'; }
          catch (err) { msg.textContent = err.message; msg.style.color = '#ff4d5e'; }
        });
        b.querySelector('#shcancel').onclick = close;
        b.querySelector('#shadd').onclick = () => {
          const text = ta.value.trim();
          if (text.length < 40) { msg.textContent = 'That is too short to work with — give it a few sentences.';
                                  msg.style.color = '#ff4d5e'; return; }
          AI.addMaterial(nm.value.trim() || 'notes', text);
          close(); done && done();
        };
        setTimeout(() => ta.focus(), 60);
      });
    },

    /* --- set the exam date ---------------------------------------------- */
    examDate(done) {
      const cur = AI.material().examDate || '';
      show(`
        <h3>WHEN IS THE EXAM?</h3>
        <p>Everything the tutor plans works backwards from this date. You can change it later.</p>
        <label for="shdate">EXAM DATE</label>
        <input type="date" id="shdate" value="${cur}">
        <label for="shsubj">SUBJECT</label>
        <input type="text" id="shsubj" maxlength="40" placeholder="Biology" value="${(AI.material().subject||'').replace(/"/g,'&quot;')}">
        <div class="row">
          <button id="shok">SET IT</button>
          <button class="ghost" id="shcancel">CANCEL</button>
        </div>`, b => {
        b.querySelector('#shcancel').onclick = close;
        b.querySelector('#shok').onclick = () => {
          const a = AI.material();
          a.examDate = b.querySelector('#shdate').value || '';
          a.subject = b.querySelector('#shsubj').value.trim();
          S.save(); close(); done && done();
        };
      });
    },

    /* --- ask the tutor something ---------------------------------------- */
    askBox(done) {
      show(`
        <h3>ASK THE TUTOR</h3>
        <p>Anything you are stuck on. It has read everything you have given it.</p>
        <label for="shq">YOUR QUESTION</label>
        <textarea id="shq" style="min-height:110px" placeholder="Why does mitosis need to make identical cells?"></textarea>
        <div class="row">
          <button id="shok">ASK</button>
          <button class="ghost" id="shcancel">CANCEL</button>
        </div>`, b => {
        const q = b.querySelector('#shq');
        b.querySelector('#shcancel').onclick = close;
        b.querySelector('#shok').onclick = () => {
          const v = q.value.trim();
          if (!v) return;
          close(); done && done(v);
        };
        setTimeout(() => q.focus(), 60);
      });
    }
  };
})();
