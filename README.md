# THE WISE OAK TREE

A very goofy 2D pixel-art game about a **nine-hundred-year-old** oak tree who
will talk to you about absolutely anything. He sneezes. He drops leaves. He is
asleep when you arrive, and you have to wake him. There is a squirrel who used
to run an unlicensed goods operation and has been put out of business by
somebody being nice to people. There is a lighter lying in the grass in the
lane, and nobody will stop you picking it up.

**He is asleep when you arrive, and nothing wakes him but you.** There is no
main menu — there is the wood, at night, filling the whole window, with him
snoring in the middle of it and one line of pixels asking you in. Tap anywhere
and the camera pushes through the trees into the game; nothing swaps, nothing
fades between screens, and there is no opening cutscene. You land in front of a
sleeping tree in an empty field, and the only instruction is **poke him**.

**The park starts as one tree in grass.** No noticeboard, no cottage, no
hedges, no undergrowth, no bushes, nothing. The board turns up once he has
actually told you something. The cottage turns up once there is anything in the
park worth writing down. Everything else arrives as you earn it, and everything
arrives with a puff of dust and a bounce.

**The park is Central Park.** He is standing in the middle of eight hundred and
forty-three acres of Manhattan, and he was standing there before any of it was
a park. Signposts at the edges of the frame walk you west and east through
**eleven places**, and most of them are shut when you arrive:

| | Place | Opens on |
| --- | --- | --- |
| 1 | The Glass Church | 44 things heard |
| 2 | Seneca Village | 72 things heard |
| 3 | The Ramble | open — **Noc** keeps the lamp here |
| 4 | Bow Bridge | finding something to carry things in |
| 5 | **The Great Oak** | you start here |
| 6 | The Mall | 8 things heard |
| 7 | The Memorial Stone | 20 things heard |
| 8 | The North Woods | open — the backpack is up here |
| 9 | Bethesda Terrace | one job finished |
| 10 | The Wollman Rink | 34 things heard |
| 11 | The Golden Arches | finding something to carry things in |

Nothing is bought: every gate opens on something you did, and almost all of it
is listening. There is a map scroll in your backpack showing what is open, what
is shut, and what each shut one still wants. **Nobody in this game sells
anything.**

It is a joke game that is not entirely a joke. In between the bits about the
woodpecker living in his elbow, the tree talks about Gaza, Sudan, Ukraine,
famine, displacement, the fires, and the water — plainly, without taking a
side, and always centred on the people it happens to. He is a tree. He holds
no flag. He just notices.

**Play it:** open `index.html` in any browser. No build step, no dependencies,
no server required.

**It works on a phone.** The world is 192 logical pixels tall, and the scale is
now chosen to satisfy both dimensions, so on a tall screen the picture sits as a
band in the middle instead of overflowing the sides. Touch is wired for taps,
drags and panning; tap targets have finger-sized slop; the talk sign is big
enough to use one-handed; and the keyboard for typing at him is raised by the
tap itself, with the usable height tracked through `visualViewport` so the panel
does not end up behind it.

Almost nothing is interface. Every word in the world — his dialogue, your
replies, the menus, the signposts, the trophy plaques — is drawn on the canvas
in a 5x7 bitmap font written for it. There is no leaf tally in the corner any
more; the only permanent things on screen are the sound switch and, once you
have found it, your bag. The two exceptions are the talk box you type into and
the backpack panel, because both of them need real text you can select.

## He cannot follow you

**He is a tree.** He is rooted in one place, so he only ever speaks where he is
standing. Walk to any other part of the park and the voice you get is your own:
short observations, in your own balloon. Anything worth telling him — the man
crossing the rink, say — is **saved up and brought out next time you are back
under him**, which is how a tree would actually learn anything.

**Typing is just the other way of talking to him.** There is no chat window and
no log: a strip of paper sits at the bottom of the world whenever there is
somebody in front of you, and you type on it. Your words go up in your own
balloon, his answer comes back in his, and the screen never changes. Tapping
**TALK TO HIM** and typing a question are the same act, equally available. When
Noc turns something you said into a plan, agreeing to it is just one of the
replies under the balloon.

## The birds

Twelve species come through the park, each with its own colours, crest, size and
beak, and each turning up only where and when it should — the mallards and
egrets at the water, pigeons on the Mall, hawks over the north woods, and a
screech owl that only appears after dark. Greet one and it goes in the book.

**Noc gives you the book.** Come back to the Ramble a second time and he hands
over the bird diary he has kept for forty years, and after that every new
species arrives as post. Filling it is its own ending; Noc never got past nine.

## Talking is the game

**He says things plainly.** Every one of his 267 lines is written to be short
and direct: one or two sentences, ordinary words, the point first. He is still
vain and dry and nine hundred years old, he just does not make you work for it.
The live typed conversation is held to the same rule, whether it is answered by
the local brain or by the API.

**Everything else in the park is a side effect of keeping him talking.** There
is one thumb-sized wooden sign under him and it always says the thing you can
do next — POKE HIM, TALK TO HIM, GO ON, TELL ME ANOTHER — so the whole
conversation can be had with a single thumb on a phone. Above it he keeps a
running count of how much further it is to the next subject.

**He does not hand over nine hundred years at once.** There are eight **sets**
of things he will talk about, and he opens them himself, one at a time, when
you have listened to enough of the last one:

| | Set | Opens at |
| --- | --- | --- |
| 1 | The usual nonsense | from the start |
| 2 | Things he has worked out | 8 things heard |
| 3 | The odd business | 20 |
| 4 | Television he has never seen | 34 |
| 5 | **This country, apparently** | 44 |
| 6 | The uncomfortable set — about you, and the screen | 52 |
| 7 | **Power, and who has it** | 72 |
| 8 | The real parts | 100 |

He stops mid-conversation to introduce each one, a snail brings the news, and
the pool of things he can say grows. Nothing from a set he has not opened will
ever come up. **Every new thing he tells you shakes a leaf loose** — listening
is how you earn, so the currency comes out of the conversation rather than out
of the park.

The backpack is one line per thing with a count beside it — leaves, what you
are carrying, and a way into the map, the topics, the bird diary, your jobs and
your plans. The long lists live in their own scrolls instead of sprawling down
the bag.

## This country, apparently

The fifth set is the American one: thirty-four lines about the country that got
built around a tree that was already six hundred years old when it was invented.
The drive-thru, breakfast stopping at half past ten, the ice cream machine that
has been broken since about 2009, the pigeons running an economy on dropped
fries, the school bus that outranks a president, the flag that is bigger than
his canopy, and the Saturday-morning car park with folding tables that he thinks
is the best of it. He is fond of the place and he does not understand it, and he
does not think those are in conflict.

Three of the eleven places on the map came with that set:

- **THE GOLDEN ARCHES** — across two lanes of traffic, open all night, cars
  looping past a crossing under a flag on a pole. There is a warm paper bag on
  the wall and a small paper flag on a cocktail stick, and both go in your bag
  and stay there.
- **THE GLASS CHURCH** — forty floors of mirror glass down the block with a
  volcano on the sign, the park reflected back at the park, one window somebody
  has covered over, and a free personality test in the lobby. **THE STAR**
  comes out of it: a film star who runs everywhere, never blinks, does all his
  own stunts and holds a clipboard out at you. Take the clipboard and you are
  level one of forty. He is invented for this park and the oak says so out
  loud — *"He is not real. I want to be clear about that, because he is
  extremely convincing and he is not real."*
- **THE MEMORIAL STONE** — below.

## The memorial stone

There is a stone in the park for **Charlie Kirk**, a real person: a political
activist who co-founded Turning Point USA and was shot and killed on 10
September 2025 while speaking at a university in Utah. He was thirty-one. The
stone carries his name, his dates, and the line HE WAS ANSWERING A QUESTION.

The square is deliberately the quietest place on the map — no critters, no
butterflies, nothing fluttering over it. A candle in a jar that somebody keeps
relighting, flowers along the foot of it, two young trees planted either side,
and one more flower for every tribute you leave. Click the stone to read it;
click it again to leave something of your own.

The oak keeps exactly the rule he keeps everywhere else. He tells you what
happened, with the date attached, when you get back under him. He does not tell
you whether the man was right, because **that is not what a stone is for**. What
he does say, out of nine hundred years and eleven wars, is this: *"You are
allowed to argue with a man for years and still not want him dead."*

## Power, and who has it

The seventh set is the political one, and it is the one only a tree that was here
first can do: he watched the city take eight hundred acres by eminent domain in
1856, and he watched **Seneca Village** — founded 1825, mostly Black
landowners, three churches, a school, about two hundred and twenty-five people
— cleared in 1857 for the lawn you are standing on. He watched the draft riots,
Tammany Hall's gardeners, the sheep on the meadow until 1934, the two hundred
out-of-work stonemasons who built a village of shacks in the drained reservoir
in 1931, Robert Moses building twenty playgrounds and taking whole
neighbourhoods for expressways, the park falling apart by 1979, and a few
thousand people with no power at all bringing the grass back after 1980.

Every date in that set is a real one. **He takes no side and endorses nobody.**
He names no party, he will not tell you how to vote, and he says so out loud.
What he does is keep the record: who was in the room when it was decided, and
who had to move afterwards. Hearing all of it is its own ending.

## The man in the red tie

Somebody crosses the Wollman Rink occasionally, with two people beside him.
He is drawn, and he is named in the oak's lines, because he has a real and
documented history with this specific park: he took over the rink's stalled
reconstruction in 1986 after the city had spent six years failing, and it
opened that winter; and in 1989 he paid for full-page newspaper adverts about
five teenagers arrested in this park, who were convicted, and who were
exonerated in 2002 when another man's confession and the DNA cleared them.

**He is never given a line.** The oak narrates, with years attached, and stops.
No invented quotes, no speech put in a living person's mouth, and no
instruction about what to conclude — the tree's whole method is that it says
what it watched and leaves the rest to you.

## Talking to him

He speaks in a **cartoon balloon** over his own head — fat black outline, white
belly, a tail of shrinking bubbles pointing at him — and **you answer**. Every line offers
you two replies drawn from a pool that matches what he just said — kind,
curious, rude, or a bit of a joke — plus "tell me another". He has a different
comeback for each, and the game quietly keeps score of which kind of person you
are being.

## What you do

- **Click the tree.** He never repeats himself — every line is drawn from a
  shuffled bag of the subjects he has opened, so you hear all 267 of them before you hear any of them twice.
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
scroll unrolls in front of whoever is standing there — Noc in the lane, the
oak everywhere else. You type straight onto the paper. The oak also offers it as a reply option every time he
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

It opens like a scroll, because it is one, and it is **drawn on the canvas in
the game's own 5x7 bitmap font at logical resolution** — not a web panel
floating over the art. The wax seal cracks and drops through, the paper
unrolls in fifteen discrete steps to exactly the height of what is written on
it, the lower rod rides down with it, and the words are inked on once there is
room to hold them. Closing rolls it back up.

**Every panel in the game is that same object**: the backpack, the talk box,
the settings, the board, the journal, the trophy room, the endings list, the
credits and the ending cards. One scroll widget, laid out from a list of
items, measured in logical pixels, with turned rods, laid paper, fold creases
and a seal. Nothing in the game is a browser-font rectangle sitting on top of
the world.

The only DOM left besides the canvas is **one transparent input**, which
exists solely to raise a phone keyboard and collect keystrokes; every
character it catches is redrawn in pixels on the paper, with a blinking block
caret.

**Every achievement has its own snail, and it is always the same snail.** The
shell palette, the pattern on it (bands, spots, spiral, chevron, marbled,
pearl), the body colour, the length of its eye stalks and its name are all
derived from the achievement's id by a fixed hash, so the snail that brings
you *Good Listener* will be that snail forever. **Size comes from the tier**: a
plain task sends a small one, a goal a bigger one, a challenge one wearing a
purple ribbon, and an ending sends something the size of a dinner plate in a
gold crown. Bigger parcels travel slower. The card names the animal that
carried it.

The round only runs while you are in the park, so nothing is ever delivered to
an empty screen.

Miss him and he crawls off the far edge with it. It is not lost — unopened post
piles up in your bag until you get round to it.

## The snail garden

**When you die, you find out where they all went.** Heaven has a sign for it
next to the Hall of Trophies. The garden is a still, bright pool under a white
sky, and every snail that ever delivered to you is out there on its own lily
pad among the reeds — at the size its news deserved, in the shell it was born
with, still crawling and still getting nowhere. The grandest post is at the
head of the round; drag or scroll to walk the water. Click one and it hands you
its parcel again.

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

## Cartooning

Everything that happens, happens like a cartoon. He **squashes and stretches**
on a spring hinged at his roots — a poke squashes him, waking and sneezing
stretch him tall, and it overshoots on the way back the way rubber does. Every
part of him answers with a **hand-lettered noise** in a spiky burst: OW! for an
eye, BOOP for the nose, NOM for the mouth, RUSTLE for the canopy, TAP TAP for a
root, SQUEEZE for a hug, AH-CHOO! for a sneeze, HEEHEE when tickled. Impacts
throw a broken ink ring and a radiating cross of lines. Dust puffs at his roots
when he moves, under the rabbit when it thumps, behind the squirrel when it
scurries, and under anything that has just arrived. Travelling kicks up dust
and speed lines at the frame edge. A poke in the eye raises a sweat drop.

## The park

The tree is not the only thing here. Leaves are a currency, and the park is a
business — but it opens completely bare and fills in only as you earn it. There
are two plots before any expansion, they are far apart, and the undergrowth,
bushes, hedges and vines each appear only once the park has enough in it to
justify them.

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
plinth for every one of the **134 achievements** — each with its own carved
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
side. Poke him and he hurries. There are **14 endings**, each with its own
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
