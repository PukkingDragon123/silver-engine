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

**Play it:** open `index.html` in any browser. It fills the window. No build
step, no dependencies, no server required.

There is no interface. Not one HTML element you can see. Every word in the
game — his dialogue, your replies, the menus, the trophy plaques — is drawn on
the canvas in a 5x7 bitmap font written for it. The leaf tally hangs on a little
wooden sign, the sound switch is a pixel speaker in the corner, the things you
own lie about on the grass, and the menus are wooden boards nailed up in the
park.

## Talking to him

He speaks in a **cartoon balloon** over his own head — fat black outline, white
belly, a tail of shrinking bubbles pointing at him — and **you answer**. Every line offers
you two replies drawn from a pool that matches what he just said — kind,
curious, rude, or a bit of a joke — plus "tell me another". He has a different
comeback for each, and the game quietly keeps score of which kind of person you
are being.

## What you do

- **Click the tree.** He never repeats himself — every line is drawn from a
  shuffled bag, so you hear all 145 of them before you hear any of them twice.
  45 of those are war and politics — Gaza, Sudan, Ukraine, famine, displacement,
  ceasefires, aid convoys, press freedom, the arithmetic nobody should be doing
  — and another 45 are pop-culture references picked up by eavesdropping on the bench:
  marching tree armies, the talking tree who only says his own name, the
  game where you punch a tree until it becomes furniture, the wizarding school
  tree that hits people, the man with the excellent hair who called us happy.
- **He is not one big button.** Poke him in the eye, boop his nose, put your
  hand in his mouth, scratch his moss, pat his roots, or grab a handful of
  canopy — each gets its own reaction. **Press and hold** the trunk to hug him.
  Knock three times at an even tempo and he answers the door. Grab the trunk
  and waggle to shake the leaves out of him. Scrub the cursor over him fast
  enough and you find out bark has nerve endings. Reach up and touch the moon.
- **Everything you own is a thing you drag.** The watering can, the acorn, the
  mushroom hat, the damp newspaper, the diary and the lighter all lie on the
  grass. Drag the can onto him to water him, the acorn onto bare ground to
  plant it, the hat onto his head, the lighter onto him — or into the pond.
- **He has neighbours.** Birds nest in the canopy and take off when you get too
  close, butterflies drift across, a beetle called Reginald walks the trunk, and
  a rabbit lives under the hedge. Click any of them and he will tell you about
  them. When the tree burns, they all leave.
- **Wait for the sneeze.** He is allergic to his own pollen. Leaves go
  everywhere. Pick them up off the grass.
- **Trade with the squirrel.** Leaves buy acorns, a watering can, a mushroom
  hat, a damp newspaper, his diary, and a lighter.
- **Be kind, or don't.** Hug him. Water him. Plant acorns. Or flick the
  lighter and watch him ask you not to.
- **If the tree dies, you wake up somewhere very bright.** Talk to the ghost.
  Talk to management. Walk the hall. Reincarnate. Your trophies come with you.

## Cinematics

Six of them, all letterboxed and captioned, all skippable with a click.

- **The opening.** The wood, then the tree, then the camera pushes right into
  his face and his eyes snap open. He was asleep. You woke him.
- **The handover.** The squirrel gives you the lighter "for nest purposes",
  then a slow shot of the tree, chatting away, who does not know you have it.
- **The burning.** The camera pushes into his face while the fire climbs the
  trunk and his expression goes from grief to sleep, the trunk snaps and falls,
  the ash settles over the stump, something bright lifts out of the wood and
  rises on radiating light, the clouds rush past, and a winged ghost tree
  descends onto a cloud in heaven.
- **The pond.** The lighter turning over in the air, the splash, and his face
  when he realises what you just did.
- **The grove.** A hundred and forty years of day and night while five acorns
  grow into a wood.
- **Reincarnation.** A dive back down through the clouds, a landing, and the
  tree growing from a seedling to full height in one continuous shot at dawn.

## The park

The tree is not the only thing here. Leaves are a currency, and the park is a
business.

**Build** at the noticeboard: saplings, flowerbeds, benches, a bird bath, a
beehive, a lamp post. Everything you build produces leaves, forever, at its own
rate — saplings grow and earn more as they age, and the lamp post is the only
reason the park keeps earning after dark. Benches bring **visitors**, little
pixel people who walk in, sit for a while, leave a tip and wander off happy.

**Upgrade** at the keeper's cottage, where the ledger is kept: a rake so the
leaves gather themselves, an open gate for twice the visitors, a painted sign
for half again on everything, a compost heap that doubles the lot.

**Expand** the park three times and the hedges get pushed back, the plot count
grows, and eventually you can see all the way to the lane. He has not seen the
lane since the war.

## The Hall of Trophies

**You cannot get in until you die.** Death is not the end of the collection. In heaven there is a marble gallery
under vaulted arches, with a red carpet running away into the light and a
plinth for every one of the **77 achievements** — each with its own carved
trophy on a gold mount: a stone tissue for the sneeze, a leaf vault for the
hoarder, a lighter sinking into water for the one who threw it away, a film
reel for the whole canon. Chandeliers burn overhead, a skylight throws shafts
down the length of it, tier-coloured spotlights pick out each earned trophy,
and the polished marble carries their reflections. Unearned plinths stand
shrouded under cloth behind a velvet rope.

Drag the hall left and right to walk it. Lift a trophy off its plinth and drop
it on another to rearrange the collection; your arrangement is remembered.
Achievements arrive in Minecraft-style corner popups in three tiers — plain
achievements, gold goals, and purple challenges. They are **delivered by a
snail**, who crawls in from the left carrying an unrolled scroll with your news
on it, leaves a slime trail across the grass, and eventually reaches the other
side. Poke him and he hurries. There are **9 endings**, each with its own
card and a hint for the ones you haven't found.

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
| Click the noticeboard | Build something |
| Click the cottage | The ledger, and upgrades |
| Press and hold the trunk | Hug him |
| Drag an item onto him | Use it |
| Click the squirrel | Chat and open his shop |
| `Space` | Talk / skip |
| `M` | Sound on/off (or click the speaker) |
| Drag in the hall | Scroll the gallery; drag a trophy to rearrange |
| Arrows / wheel | Scroll the hall |
| `Shift`+`R` | Erase everything |
| `Esc` | Close panels / leave the hall |

## How it is built

Plain HTML, CSS and JavaScript. No frameworks, no bundler, no image or audio
files — every sprite is drawn with `fillRect` calls on a 256×192 canvas that is
scaled up with `image-rendering: pixelated`, and every sound is synthesised
with the Web Audio API.

The world is rendered at a fixed 192 logical pixels tall and a width that
follows the window's aspect ratio, so it fills any screen without bars. The
tree's geometry is authored around a centre line and re-positioned whenever the
window changes.

```
index.html                page shell
js/font.js                the 5x7 bitmap font and the text layout
css/style.css             chunky pixel-adjacent interface
js/data.js                all the writing: dialogue, achievements, endings, shop, park
js/sprites.js             the pixel renderer — forest, tree, face, fire, hall, heaven
js/audio.js               tiny WebAudio chiptune engine
js/game.js                state, interactions, achievements, endings, cinematics, loop
tools/build-artifact.mjs  inlines everything into dist/wise-oak-tree.html
```

The scene is built in depth like the photograph it is chasing: framing foliage
hanging into the top of frame, a cached sky gradient on a full day/night cycle,
misty background woods fading into a pale bloom, god rays, drifting dust motes
and fireflies, then the tree, then bushes in the foreground.

Every solid thing in the foreground — tree, squirrel, fallen leaves, saplings —
is composited into one layer and given a single dark contour: the layer is
tinted to a silhouette, stamped at eight offsets, and the layer goes back on
top. One clean pixel-art edge, no gaps, no per-sprite bookkeeping. Trophies get
the same treatment individually, cached after the first draw.

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
