# AETHERIA — SKY SCHOLARS

A cozy pixel-art **study RPG** that is trying very hard to be a ranked mobile
game. You make a character, you live on a floating island, and every question
you answer is a sword swing.

**Play it:** open `aetheria/index.html` in any browser. No build step, no
dependencies, no server. It is portrait-first and works with a thumb, but a
mouse is fine. Everything saves to `localStorage`.

There is a single-file copy at `dist/aetheria.html` for hosts that cannot load
sibling files — rebuild it with `node tools/build-artifact.mjs`.

---

## The loop

1. **Make yourself.** Gender, build, skin, hair style, hair colour, shirt style,
   shirt colour, trousers, and a name you type on a pixel keyboard. Your
   character is drawn procedurally, so the hair colour you pick is the hair
   colour in the battle cut-in.
2. **Live on the island.** The main menu is not a menu. It is a floating island
   with a plateau you can see the depth of. Your character wanders about on
   their own — walking, sitting, dancing, cheering, falling asleep with little
   Zs coming off them — and your pet trots along behind.
3. **Go on an adventure.** A shelf of worlds, and inside each one a winding
   trail of stops climbing into the sky. Battles, elites, a boss, and the
   mini games in between.
4. **Come home with the loot.** Chests, eggs, wood, stone, essence. Build,
   upgrade, forge armour, craft items, hatch pets.
5. **Climb.** Trophies move you up nine ranks. Rivals on the ladder drift up
   and down while you are away, so the board is never the same twice.

## Battle: your answer is the attack

Each question deals you a **hand of four attack cards** — Ember Slash, Frost
Lance, Rune Bolt, Quake Fist — one per answer. Only the true one connects.

- **Speed is damage.** The faster you answer, the bigger the multiplier. Answer
  in the first fifth of the timer and it crits.
- **Combos compound.** Every correct answer in a row raises the multiplier.
  One wrong answer resets it and the monster hits you.
- **Five answers buys a relic.** A three-way draft with animated icons —
  Sharp Focus, Thorn Aura, Study Glasses, Lucky Die, Perfect Recall. They stack
  for the rest of the run, Slay-the-Spire style.
- **The FOCUS bar fills as you go.** When it is full you can spend it on an
  **ULTIMATE**: speed lines, a full-screen cut-in of your own character, and a
  number the monster does not enjoy.
- **Eggs hatch mid-fight.** Every correct answer warms the egg in your pack.
  When it is hot enough it cracks open in the middle of the battle and the pet
  starts attacking alongside you.
- **Some rounds are type-it-in.** Maths questions occasionally drop the cards
  and hand you a number pad instead.
- **Elites and bosses** telegraph a heavy strike a few turns out. Being correct
  on the turn it lands halves it.

## The mini games

| Stop | What it is |
|---|---|
| **MATCH-UP** | Six pairs, sixty seconds, three seconds off the clock for every miss |
| **SEQUENCE** | Put the stages in order — mitosis, the steps of solving an equation, sizes. It checks itself the moment the last one lands, and sends only the wrong ones back |
| **GRAPH LAB** | A ghost line and two labelled points. Read off the gradient and the intercept and drag your line onto it |
| **CHOPPING / MINING** | A timing bar with a gold perfect zone. Every third clean hit throws a bonus question at you for extra materials |

## The base

Eight buildings on eight plots: **Cottage, Sawmill, Quarry, Mana Well, Forge,
Nestry, Library, Training**. Producers keep working with the tab shut and put a
bubble over their head when they have something for you. The Forge turns
materials into **Blade / Plate / Charm** gear that carries into every fight.
The workshop crafts consumables on a timer — Elixir, Rune Bomb, Hourglass,
Lens — and you can spend them mid-battle.

## Chests

Clash-style. Answer a question to unlock the lid (get it right and the chest is
richer), **swipe your thumb across it three times** to crack it open, then flip
the rewards over one at a time — rays, rarity flash, confetti. Common, rare,
epic and legendary.

## The study part, which is the actual point

- **144 questions** across six subjects: algebra, straight-line graphs,
  fractions and percentages, cells and mitosis, atoms and bonding, forces and
  motion.
- **The DEX** remembers every card you have met and how often you got it right.
  Tap one to flip it over.
- **REVIEW** builds a ten-card quickfire weighted towards the ones you keep
  getting wrong. No monsters, just the cards.
- **CUSTOM LESSONS** let you type your own term/answer pairs — tonight's
  homework, French vocab, whatever — and take them into a real battle against a
  real monster. Wrong options are generated from the other cards in your deck.
- **A daily goal** of twenty questions, a day streak, and a chest for finishing.

## How it is built

No libraries, no build step, no images. The canvas is exactly 360x640 device
pixels and CSS blows it up with `image-rendering: pixelated`, so a game pixel is
always a clean square.

```
js/font.js     a 5x7 bitmap font — every word on screen is drawn from it
js/util.js     maths, easing, palette, pixel panels and bars
js/audio.js    a chiptune box: oscillators, envelopes, a two-bar island loop
js/fx.js       particles, damage popups, shockwaves, screen shake, tweens
js/art.js      hand-placed sprite grids + procedural islands, trees, buildings
js/avatar.js   your character, painted from live colours and outlined
js/content.js  the question banks, monsters, attack cards and relics
js/state.js    the save file, the economy, the rank ladder, offline production
js/ui.js       immediate-mode pixel widgets
js/game.js     canvas, input, scene stack, transition wipe
js/*.js        one file per scene: creator island build map battle minigames chest dex
```

Small things — icons, monsters, pets, props — are hand-placed pixels written as
character grids with a palette per sprite. Big things — islands, trees,
buildings — are assembled from 1px rectangles by arithmetic, which is why a
sawmill can be three sizes and six upgrade levels without new art.

Everything is drawn: the resource counters, the rank chip, the trophy plaques,
the keyboard. There is exactly one HTML element you can see, and it is the
button on the title card that unlocks the audio context.
