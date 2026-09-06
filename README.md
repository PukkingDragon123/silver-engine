# THE WISE OAK TREE

A very goofy 2D pixel-art game about a four-hundred-year-old oak tree who will
talk to you about absolutely anything. He sneezes. He drops leaves. There is a
squirrel running an unlicensed goods operation out of a hollow. There is a
lighter for sale, and the squirrel insists it is for nest purposes.

It is a joke game that is not entirely a joke. In between the bits about the
woodpecker living in his elbow, the tree talks about Gaza, Sudan, Ukraine,
famine, displacement, the fires, and the water — plainly, without taking a
side, and always centred on the people it happens to. He is a tree. He holds
no flag. He just notices.

**Play it:** open `index.html` in any browser. No build step, no dependencies,
no server required.

## What you do

- **Click the tree.** He never repeats himself — every line is drawn from a
  shuffled bag, so you hear all 100 of them before you hear any of them twice.
- **Wait for the sneeze.** He is allergic to his own pollen. Leaves go
  everywhere. Pick them up off the grass.
- **Trade with the squirrel.** Leaves buy acorns, a watering can, a mushroom
  hat, a damp newspaper, his diary, and a lighter.
- **Be kind, or don't.** Hug him. Water him. Plant acorns. Or flick the
  lighter and watch him ask you not to.
- **If the tree dies, you wake up somewhere very bright.** Talk to the ghost.
  Talk to management. Reincarnate. Your trophies come with you.

## Collect everything

**49 achievements** in Minecraft-style corner popups, in three tiers — plain
achievements, gold goals, and purple challenges. **8 endings**, each with its
own card, and a hint in the endings panel for the ones you haven't found.

Endings include burning him down, throwing the lighter in the pond, hearing
every word he has, planting a wood, and sitting with him for three minutes
without clicking on anything at all.

Everything is saved to `localStorage`. Trophies and endings survive death,
reincarnation, and closing the tab. There is an erase button if you want him
to forget you.

## Controls

| Input | Does |
| --- | --- |
| Click the tree | Talk (click again to skip the typing) |
| Click a fallen leaf | Pick it up |
| Click the squirrel | Chat and open his shop |
| `Space` | Talk / skip |
| `T` / `E` | Trophy room / endings |
| `Esc` | Close panels |

## How it is built

Plain HTML, CSS and JavaScript. No frameworks, no bundler, no image or audio
files — every sprite is drawn with `fillRect` calls on a 256×192 canvas that is
scaled up with `image-rendering: pixelated`, and every sound is synthesised
with the Web Audio API.

```
index.html        page shell
css/style.css     chunky pixel-adjacent interface
js/data.js        all the writing: dialogue, achievements, endings, shop
js/sprites.js     the pixel renderer — tree, seasons, day/night, fire, heaven
js/audio.js       tiny WebAudio chiptune engine
js/game.js        state, interactions, achievements, endings, game loop
```

The tree is procedurally drawn: the canopy is a fixed set of blobs rendered in
three silhouette passes so it reads as one crown, the sky is a cached gradient
on a full day/night cycle, the four seasons repaint the whole scene (winter
strips him to bare snowy twigs), and fire eats the canopy blob by blob from the
inside out.

Opening the page with `?debug=1` exposes a `window.OAK` handle used by the
automated smoke tests to reach the late game without playing for an hour.

## A note on the serious lines

They are deliberately written to sit alongside the jokes rather than replace
them, and to describe civilians rather than argue politics. The tree's position
on every war he mentions is the same one: no child anywhere chose it.
