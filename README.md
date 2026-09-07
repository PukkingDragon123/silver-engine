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
  Talk to management. Walk the hall. Reincarnate. Your trophies come with you.

## Cinematics

Dying and coming back are not cuts to black. Burning him plays a six-shot
sequence: the camera pushes into his face while the fire climbs the trunk and
his expression goes from grief to sleep, the trunk snaps and falls, the ash
settles over the stump, something bright lifts out of the wood and rises, the
clouds rush past, and a winged ghost tree descends onto a cloud in heaven.
Reincarnating dives back down through the clouds, lands, and grows the tree
from a seedling to full height in one continuous shot. Letterbox bars and
captions throughout; click to skip a beat.

## The Hall of Trophies

Death is not the end of the collection. In heaven there is a marble gallery
under vaulted arches, with a red carpet running away into the light and a
plinth for every one of the **49 achievements** — each with its own carved
trophy: a stone tissue for the sneeze, a leaf vault for the hoarder, a lighter
sinking into water for the one who threw it away. Unearned plinths stand
shrouded.

Drag the hall left and right to walk it. Lift a trophy off its plinth and drop
it on another to rearrange the collection; your arrangement is remembered.
Achievements arrive in Minecraft-style corner popups in three tiers — plain
achievements, gold goals, and purple challenges — and there are **8 endings**,
each with its own card and a hint for the ones you haven't found.

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
| `T` | Hall of Trophies (`E` for endings, `T` again to leave) |
| Drag in the hall | Scroll the gallery; drag a trophy to rearrange |
| Arrows / wheel | Scroll the hall |
| `Esc` | Close panels / leave the hall |

## How it is built

Plain HTML, CSS and JavaScript. No frameworks, no bundler, no image or audio
files — every sprite is drawn with `fillRect` calls on a 256×192 canvas that is
scaled up with `image-rendering: pixelated`, and every sound is synthesised
with the Web Audio API.

```
index.html                page shell
css/style.css             chunky pixel-adjacent interface
js/data.js                all the writing: dialogue, achievements, endings, shop
js/sprites.js             the pixel renderer — forest, tree, face, fire, hall, heaven
js/audio.js               tiny WebAudio chiptune engine
js/game.js                state, interactions, achievements, endings, cinematics, loop
tools/build-artifact.mjs  inlines everything into dist/wise-oak-tree.html
```

The scene is built in depth like the photograph it is chasing: framing foliage
hanging into the top of frame, a cached sky gradient on a full day/night cycle,
misty background woods fading into a pale bloom, god rays, drifting dust motes
and fireflies, then the tree, then bushes in the foreground.

The face is drawn feature by feature under a single light direction — a heavy
lit brow with deep shadow beneath, amber eyes with a real iris and a moving
highlight, a nose with a lit side and a shadow side, and a mouth that has eight
shapes. Twelve expressions, and he drifts between them on his own. Every so
often he stops performing, the vignette closes in, and he simply looks at you
with the wrong number of teeth. Sometimes something else blinks awake in the
branches behind him.

The whole scene renders 1:1 into an offscreen buffer and is then blitted through
a camera (pan, push-in, shake), because scaling the context directly leaves
seams between the 1px rows every sprite is built from. Fire eats the canopy blob
by blob from the inside out, charring the leaves ahead of the front, while the
firelight picks out the lit side of his face.

Opening the page with `?debug=1` exposes a `window.OAK` handle used by the
automated smoke tests to reach the late game without playing for an hour.

## A note on the serious lines

They are deliberately written to sit alongside the jokes rather than replace
them, and to describe civilians rather than argue politics. The tree's position
on every war he mentions is the same one: no child anywhere chose it.
