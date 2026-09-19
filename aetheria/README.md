# AETHERIA — SKY SCHOLARS

A cozy pixel-art **study RPG about cats**, built to get you through an exam.
You make a cat, you live on a floating island, you dig a mine underneath it,
and every question you answer is a claw swipe.

**Play it:** open `aetheria/index.html` in any browser. No build step, no
dependencies, no server. Portrait-first, works with a thumb. Everything saves
to `localStorage`.

Single-file copy at `dist/aetheria.html` — rebuild with
`node tools/build-artifact.mjs`.

---

## The tutor

The headline feature, and the reason this is a study app and not just a game.
Published as an Artifact, the page can ask Claude questions directly, so the
cat tutor does four things:

- **Reads your material.** Paste a chapter, a syllabus, a past paper, your own
  messy notes, or drop in a `.txt` / `.md` / `.csv` file.
- **Builds a dated revision plan.** Give it an exam date and it works backwards:
  one session a day, each naming one specific topic from *your* notes, building
  from recall to application to mixed practice, with two review days before the
  exam and the day before left light.
- **Turns your notes into a playable world.** It generates eighteen questions,
  six matching pairs and an ordered sequence, and installs them as a real island
  on the adventure map — battles, matching, sequences, a boss. Your own biology
  notes become a place you fight through.
- **Explains why you were wrong.** Get a question wrong in battle and a
  **WHY WAS THAT WRONG?** button appears. There's a **HINT** button too, which
  nudges without giving the answer away.
- **Retunes around your weak spots.** It reads which cards you keep missing,
  groups them into themes rather than a list, and rewrites your plan and your
  drill around them.

Opened straight off disk there is no Claude to ask, so every one of those says
so plainly and the rest of the game carries on.

## The labs

The Gizmo half: things you drive, not quizzes with pictures.

| Lab | What you do |
|---|---|
| **CELL DIVISION** | Step a cell through all six phases. Chromosomes condense, line up, get dragged apart by spindle fibres, and the cell pinches in two. |
| **FORCE AND MOTION** | Set force and mass, release the crate, watch `a = F/m` in the readout and in how fast it goes. Toggle friction and find out what it costs you. |
| **FRACTION BAR** | Cut a bar into any number of parts, shade any number, and see the fraction, the decimal and the percentage at once. A second bar to compare against. |

Every lab then asks a question **about the state you left it in** — so the
answer changes every time and cannot be memorised.

## The adventure

A shelf of worlds, each a winding trail of ten stops climbing into the sky.

**Battle is a card game.** Each question deals a hand of four attack cards, one
per answer; only the true one connects. Fast answers multiply the damage and
crit, combos compound, **five answers buys a relic** from a three-way draft, and
a full **FOCUS** bar spends on an ultimate with a full-screen cut-in of your own
cat. Eggs hatch mid-fight and the pet joins in. Maths rounds sometimes drop the
cards and hand you a number pad.

Between fights: matching, sequencing, a graph lab with a ghost line to read
gradient and intercept off, and timing-bar chopping and mining.

## THE DEEP

A side-view mining world under the island. Gravity, jumping, digging, block
placing, ore veins that get richer the further down you go, and darkness you
need torches to see through.

- Dirt, stone, copper, silver and crystal, each taking more hits than the last.
- Caves with their own wall layer behind them, so daylight never leaks
  through solid rock.
- **Rune doors and buried chests only open for a correct answer.**
- Cave creatures ambush you with a question — right and you drive it off, wrong
  and it bites.
- Surface with your haul, or black out down there and lose half of it.

## The base

Eight buildings on eight plots: **Cottage, Sawmill, Quarry, Mana Well, Forge,
Nestry, Library, Training**. Producers keep working with the tab shut. The Forge
turns materials into Blade / Plate / Charm gear. The workshop crafts Elixirs,
Rune Bombs, Hourglasses and Lenses on a timer, to spend mid-battle.

## Ranks

Nine ranks from Sprout to Legend. Trophies won and lost, a ladder of rival cats
whose scores drift while you're away, and a duel mode where you race a rival's
answer timer.

## The cats

Your cat is painted procedurally at a fixed 30x40 grid, so fur, markings, eye
colour and outfit are live values rather than forty hand-drawn variants. Six
coat patterns (solid, tabby, tuxedo, calico, siamese, spotted), twelve coats,
twelve marking colours, seven eye colours, four outfits, two builds. Every
finished pose is stamped with a hard outline — the silhouette drawn four times,
one pixel out, then the art on top — which is what gives everything the sticker
look. Rivals on the ladder are cats too.

## How it is built

No libraries, no build step, no image files. The canvas is exactly 360x640
device pixels and CSS blows it up with `image-rendering: pixelated`.

```
js/font.js     a 5x7 bitmap font — every word on screen is drawn from it
js/util.js     maths, easing, palette, pixel panels, bars, text fitting
js/audio.js    a chiptune box: oscillators, envelopes, a two-bar island loop
js/fx.js       particles, damage popups, shockwaves, screen shake, tweens
js/art.js      hand-placed sprite grids + procedural islands, trees, buildings
js/avatar.js   your cat, painted from live colours and outlined
js/content.js  question banks, monsters, attack cards, relics
js/paste.js    the one sheet of real DOM: pasting and uploading material
js/state.js    the save file, economy, rank ladder, offline production
js/ui.js       immediate-mode pixel widgets
js/ai.js       the tutor, against the artifact `sample` capability
js/game.js     canvas, input, scene stack, transition wipe
js/*.js        one file per scene: creator island study lab build map
               battle minigames chest dex deep
```

**One grid, whole-number zoom.** Every sprite is authored on a 16px grid and only
ever drawn at a whole-number scale. Fractional zoom resamples art onto
half-pixels, which is exactly what makes pixel art look mushy, so `spr()` and
`AV.draw()` round the scale and the island picks between two sizes rather than a
continuous one.

Small things — icons, monsters, pets, props — are hand-placed pixels written as
character grids with a palette per sprite. Big things — islands, trees,
buildings, the whole mine — are assembled from 1px rectangles by arithmetic.

Everything is drawn: the resource counters, the rank chip, the plan, the
keyboard. The only DOM you ever see is the title-card button that unlocks
audio, and the sheet for pasting your notes in.
