# THE WISE OAK TREE

A very goofy 2D pixel-art game about a **nine-hundred-year-old** oak tree who
will talk to you about absolutely anything. He sneezes. He drops leaves. He is
asleep when you arrive, and you have to wake him. There is a squirrel who used
to run an unlicensed goods operation and has been put out of business by
somebody being nice to people. There is a lighter lying in the grass in the
lane, and nobody will stop you picking it up.

**He is asleep when you arrive, and nothing wakes him but you.** The main menu
is the wood itself at night, with him snoring in the middle of it; you walk in
and poke him.

The park is three places wide. Signposts at the left and right edges of the
frame walk you **west to the lane**, where **Noc** keeps the lamp lit, and
**east to the hollow**, where things get left behind. **Nobody in this game
sells anything.** You type at Noc and at the oak, in your own words, and what
you get out of the park you get by doing jobs for the two of them.

It is a joke game that is not entirely a joke. In between the bits about the
woodpecker living in his elbow, the tree talks about Gaza, Sudan, Ukraine,
famine, displacement, the fires, and the water — plainly, without taking a
side, and always centred on the people it happens to. He is a tree. He holds
no flag. He just notices.

**Play it:** open `index.html` in any browser. It fills the window. No build
step, no dependencies, no server required.

Almost nothing is interface. Every word in the world — his dialogue, your
replies, the menus, the signposts, the trophy plaques — is drawn on the canvas
in a 5x7 bitmap font written for it. There is no leaf tally in the corner any
more; the only permanent things on screen are the sound switch and, once you
have found it, your bag. The two exceptions are the talk box you type into and
the backpack panel, because both of them need real text you can select.

## Talking to him

He speaks in a **cartoon balloon** over his own head — fat black outline, white
belly, a tail of shrinking bubbles pointing at him — and **you answer**. Every line offers
you two replies drawn from a pool that matches what he just said — kind,
curious, rude, or a bit of a joke — plus "tell me another". He has a different
comeback for each, and the game quietly keeps score of which kind of person you
are being.

## What you do

- **Click the tree.** He never repeats himself — every line is drawn from a
  shuffled bag, so you hear all 186 of them before you hear any of them twice.
  45 of those are war and politics — Gaza, Sudan, Ukraine, famine, displacement,
  ceasefires, aid convoys, press freedom, the arithmetic nobody should be doing
  — and another 66 are pop-culture references picked up by eavesdropping on the bench —
  mostly television he has never actually seen, from the dragon show and the
  chemistry teacher to the Jerusalem family drama, the Israeli therapist show
  that got remade in nine countries, and the baker who fell for a supermodel:
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

## Talking in your own words

**Both of them will answer anything you type.** Click Noc, or press `T`, and a
talk box opens on whoever is standing in front of you — Noc in the lane, the
oak everywhere else. The oak also offers it as a reply option every time he
speaks: *"let me say something myself"*.

They are not the same voice. Noc is quiet and consoling and turns what you say
into plans. The oak is nine hundred years old, vain, and has never seen a
single frame of television but will tell you about it anyway.

By default each of them thinks with a small associative brain built into the
game — it reads your sentence for subject, mood and intent and answers out of
that character's own vocabulary, and it works offline with no setup at all. If
you want real models behind them, add an Anthropic API key (in the squirrel's
settings, or type `/key sk-ant-...` into the talk box) and their replies come
from the Claude API instead, with the local brains still catching every failure
so neither of them ever goes quiet. The key is kept in your browser's
`localStorage` and is sent nowhere except Anthropic. `/nokey` clears it,
`/model` switches model, `/forget` wipes that conversation, `/jobs` and
`/plans` list what you have taken on.

**Plans** are the thing he actually does. Say what you want — lights, a feast,
the stars, an hour of quiet, the news, water, a grove — and he turns it into a
plan with a cost and a condition. Agree to it, come back when you can afford
it, and he does his half. Keeping a plan is how you get most of the things you
own. Keep all seven and there is an ending in it.

## The board

There is no shop and nothing to buy. Everything in the park arrived because
somebody asked you for something and you did it. The noticeboard is **the
board**: 14 jobs, seven from the oak and seven from Noc, each one a thing you
can only finish by playing — hear ten different things out of him, water him
three times, plant two of his acorns, say hello to four living creatures, stay
long enough to see all four seasons, get three visitors to sit down and leave
happy. Take a job and the person who wanted it tells you why.

Finishing one builds the park for you: a bench, a flowerbed, a lamp post, a
bird bath, bees, a sapling, the good rake, the open gate, the painted sign, the
compost heap, and three separate pushes of the hedge. The last job on the list
asks you to stop building and **leave it nearly empty**, and finishing every
job is its own ending.

The keeper's cottage holds **the journal** — what the park is and what it
makes, with no prices in it anywhere.

## The post

Achievements are not popups. They come by **snail**, and the snail does not
read them out. He crawls in from the left with the parcel strapped across his
shell — a rolled scroll, a ribbon in the tier's colour, an unbroken wax seal
and the trophy tied on top in miniature — and if you want to know what is in
it you have to **stop him and open it**. Then you get the full card: the carved
trophy at proper size, the tier, the name and what you did.

Miss him and he crawls off the far edge with it. It is not lost — unopened post
piles up in your bag until you get round to it.

## The settings, and the credits

There is still no interface for either. **The squirrel** used to run an
unlicensed goods operation out of a hollow; Noc put him out of business by
being nice to people, so he carries a gear now and keeps the settings — sound,
the API key, the trophy room, and the erase button. Click him.

**The credits** belong to the one butterfly that is not like the others. It is
brighter than the rest, it carries its own light so you can find it after dark,
and it sparkles. Catch it.

## The backpack

There is no shop, so there is nothing to buy. There is a **canvas backpack**
lying against a stone in the east hollow, and until you find it you cannot
carry anything at all. Once you have it, a bag appears in the bottom-left
corner (or press `B`). Everything you pick up and everything Noc gives you
lives in it, along with your leaves and the plans you have made. Take a thing
out of the bag and you are holding it; drop it on him to use it.

## The park

The tree is not the only thing here. Leaves are a currency, and the park is a
business — a quieter and emptier one than it used to be. There are fewer plots
and they are further apart, and the space between them has been filled with
bushes, ferns, tall grass, mushroom rings, hanging vines and fireflies rather
than with more things to click.

Everything in it produces leaves, forever, at its own rate — saplings grow and
earn more as they age, and the lamp post is the only reason the park keeps
earning after dark. Benches bring **visitors**, little pixel people who walk
in, sit for a while, leave a tip and wander off happy. The rake makes the
leaves gather themselves; the gate doubles the visitors; the sign and the
compost heap multiply the lot.

None of it is for sale. All of it comes off the board. Leaves are still a
currency, but the only person who takes them is Noc, and all he sells is a
promise.

## The Hall of Trophies

**You cannot get in until you die.** Death is not the end of the collection. In heaven there is a marble gallery
under vaulted arches, with a red carpet running away into the light and a
plinth for every one of the **96 achievements** — each with its own carved
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
side. Poke him and he hurries. There are **11 endings**, each with its own
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
| Click the cottage | The journal — what the park is |
| Press and hold the trunk | Hug him |
| Drag an item onto him | Use it |
| Click the squirrel | The settings — he carries the gear now |
| Click the bright butterfly | The credits |
| Click a snail | Open the post it is carrying |
| Click the noticeboard | The board — take a job |
| Click a signpost, or `←` / `→` | Walk west to the lane or east to the hollow |
| Click Noc, or `T` | Open the talk box — Noc in the lane, the oak elsewhere |
| Click the bag, or `B` | Open the backpack |
| Click a thing lying in the grass | Put it in your bag |
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
