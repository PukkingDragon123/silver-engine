/* =========================================================================
   THE WISE OAK TREE — content data
   Dialogue, achievements, endings, trades, and squirrel chatter.
   Everything here is plain data so it is easy to extend.
   ========================================================================= */

const DATA = {};

/* -------------------------------------------------------------------------
   TREE DIALOGUE
   Each line: { id, text, mood, tag }
   mood  -> face expression: 'idle' | 'happy' | 'sad' | 'smug' | 'shock' | 'sleepy'
   tag   -> 'goofy' | 'wise' | 'world' | 'meta' | 'weird'
   The engine draws from a shuffled bag, so you never hear the same line twice
   until you have heard all of them.
   ------------------------------------------------------------------------- */
DATA.lines = [
  /* ---------- GOOFY ---------- */
  { id: 'g01', tag: 'goofy', mood: 'happy', text: "I am four hundred years old and I have never once had to find parking." },
  { id: 'g02', tag: 'goofy', mood: 'smug',  text: "People say 'touch grass'. I say: touch bark. Grass is a coward. Grass runs from winter." },
  { id: 'g03', tag: 'goofy', mood: 'idle',  text: "A woodpecker lives in my elbow. He pays no rent. We are, legally speaking, roommates." },
  { id: 'g04', tag: 'goofy', mood: 'shock', text: "Do NOT look up. There is a squirrel up there doing something unspeakable with a walnut." },
  { id: 'g05', tag: 'goofy', mood: 'happy', text: "My branches are extremely strong. Do not test this. Two children tested this. They were fine. I was not." },
  { id: 'g06', tag: 'goofy', mood: 'idle',  text: "I have been standing in the exact same spot since 1613. Ask me about my cardio." },
  { id: 'g07', tag: 'goofy', mood: 'smug',  text: "I invented shade. Legally I cannot prove this. Emotionally, I am certain." },
  { id: 'g08', tag: 'goofy', mood: 'sad',   text: "A dog has claimed me. Every Tuesday. I have accepted this as weather." },
  { id: 'g09', tag: 'goofy', mood: 'happy', text: "In autumn I do a little striptease. Very tasteful. Extremely seasonal." },
  { id: 'g10', tag: 'goofy', mood: 'idle',  text: "Someone carved 'DAVE WAS HERE' into me in 1987. Dave, buddy. I am still here. Where are you." },
  { id: 'g11', tag: 'goofy', mood: 'shock', text: "AAAH- oh. Sorry. A beetle walked across my face. He walks like he owns the place." },
  { id: 'g12', tag: 'goofy', mood: 'smug',  text: "My acorns have a 0.0001% success rate. My children are, statistically, a joke. I love them." },
  { id: 'g13', tag: 'goofy', mood: 'idle',  text: "I tried meditation. Turns out that is just being a tree. I have been doing it for centuries. I am extremely enlightened and extremely bored." },
  { id: 'g14', tag: 'goofy', mood: 'happy', text: "Two teenagers kissed under me last spring and I have not stopped thinking about it. It was NICE. Get off my back." },
  { id: 'g15', tag: 'goofy', mood: 'sad',   text: "There is a plastic bag in my hair. It has been there for eleven years. Its name is Gerald now." },
  { id: 'g16', tag: 'goofy', mood: 'smug',  text: "You are made mostly of water. I am made mostly of water. The difference is that I am shaped correctly." },
  { id: 'g17', tag: 'goofy', mood: 'idle',  text: "I do not have a mouth. I am projecting these words directly into your skull. You have simply chosen not to be alarmed." },
  { id: 'g18', tag: 'goofy', mood: 'happy', text: "An owl told me a joke in 2004. I am still deciding whether it was funny. Owls have terrible timing and excellent delivery." },
  { id: 'g19', tag: 'goofy', mood: 'shock', text: "SQUIRREL. SQUIRREL IN MY BRANCHES. Ah. No. That is just my branch. False alarm. Very embarrassing for me." },
  { id: 'g20', tag: 'goofy', mood: 'idle',  text: "I can feel rain coming three hours early. This is my only superpower and it is useless to me. I cannot go inside." },
  { id: 'g21', tag: 'goofy', mood: 'smug',  text: "Lightning hit me once. I did not die. I simply became more interesting at parties." },
  { id: 'g22', tag: 'goofy', mood: 'happy', text: "There is a family of mice in my roots. The smallest one is named Bartholomew. I named him. He does not know." },
  { id: 'g23', tag: 'goofy', mood: 'sad',   text: "A man once hugged me and cried for twenty minutes. He never came back. I hope he is okay. I think about him during storms." },
  { id: 'g24', tag: 'goofy', mood: 'idle',  text: "My roots go down as far as I go up. Half of me is underground and thinking about nothing. It is a great life." },
  { id: 'g25', tag: 'goofy', mood: 'smug',  text: "You blink around 20,000 times a day. I have blinked twice. Both times were emergencies." },
  { id: 'g26', tag: 'goofy', mood: 'happy', text: "I am currently converting your exhaled regret into oxygen. Free of charge. You are welcome." },
  { id: 'g27', tag: 'goofy', mood: 'shock', text: "Is that a CHAINSAW-- no. Motorcycle. Sorry. I have some trauma about that particular pitch." },
  { id: 'g28', tag: 'goofy', mood: 'idle',  text: "Every leaf on me is a tiny solar panel that I grew out of my own body using sunlight and spite." },
  { id: 'g29', tag: 'goofy', mood: 'sleepy',text: "mmh. Sorry. Winter brain. My whole personality is on standby until March." },
  { id: 'g30', tag: 'goofy', mood: 'happy', text: "A crow brings me shiny things. I have no pockets. I have told him. He does not listen. I have eleven bottle caps." },
  { id: 'g31', tag: 'goofy', mood: 'smug',  text: "The forest has an internet. It is made of fungus. It is slower than yours and it has never once shown me an advertisement." },
  { id: 'g32', tag: 'goofy', mood: 'idle',  text: "I did not consent to being in a video game. But the lighting is good and my canopy looks fantastic, so, fine." },
  { id: 'g33', tag: 'goofy', mood: 'sad',   text: "Someone put a swing on me and then their kid grew up. The rope is still there. I do not have the heart to drop it." },
  { id: 'g34', tag: 'goofy', mood: 'happy', text: "Ask me anything. I know six things very deeply and nothing else at all." },
  { id: 'g35', tag: 'goofy', mood: 'shock', text: "You have been clicking on my FACE. Repeatedly. I did not want to make it weird but here we are." },

  /* ---------- WISE ---------- */
  { id: 'w01', tag: 'wise', mood: 'idle',  text: "You are in a hurry because you can count your days. I cannot count mine. It has made me slow and it has made me kind." },
  { id: 'w02', tag: 'wise', mood: 'idle',  text: "Every ring inside me is a year I survived. Some of them are thin. Nobody planted a tree the year the rain stopped." },
  { id: 'w03', tag: 'wise', mood: 'sad',   text: "I have outlived everyone who ever sat under me. That is not sad. Being forgotten is sad. I remember all of them." },
  { id: 'w04', tag: 'wise', mood: 'idle',  text: "Grow toward the light, but do not resent the shade. The shade is where the small things live." },
  { id: 'w05', tag: 'wise', mood: 'happy', text: "You want to be useful. You already are. You breathe out and I eat it. We have been in a relationship this whole time." },
  { id: 'w06', tag: 'wise', mood: 'idle',  text: "Storms do not kill trees. Rigidity kills trees. Bend. Bend. Bend. Then stand back up when it is quiet." },
  { id: 'w07', tag: 'wise', mood: 'sad',   text: "The worst year of my life, I dropped every leaf in June and looked dead until spring. Looking dead is not the same as dying. Rest is not surrender." },
  { id: 'w08', tag: 'wise', mood: 'idle',  text: "My roots touch four other trees. When one of us is sick the others send sugar underground. Nobody applauds. Nobody knows. It works anyway." },
  { id: 'w09', tag: 'wise', mood: 'idle',  text: "You keep asking what the point is. There is no point. There is only whether the birds had somewhere to sit." },
  { id: 'w10', tag: 'wise', mood: 'happy', text: "The best time to plant a tree was twenty years ago. The second best time is now. The third best time is also now. It keeps being now." },
  { id: 'w11', tag: 'wise', mood: 'idle',  text: "Old does not mean wise. Old means I made every possible mistake and I am still standing here holding the receipts." },
  { id: 'w12', tag: 'wise', mood: 'sad',   text: "I have watched people be cruel and then, forty years later, watched their grandchildren plant a garden. Nothing is finished. That cuts both ways." },
  { id: 'w13', tag: 'wise', mood: 'idle',  text: "Half of me is underground where no one has ever seen it. That is the half that keeps me up. Same for you." },
  { id: 'w14', tag: 'wise', mood: 'idle',  text: "A forest is not a lot of trees. A forest is a lot of trees that agreed to share water. Otherwise it is just a crowd." },
  { id: 'w15', tag: 'wise', mood: 'happy', text: "You do not have to be a forest today. Be one tree. Very well. In one place." },
  { id: 'w16', tag: 'wise', mood: 'idle',  text: "The wind has never once asked my opinion. And yet every year I grow a little thicker on the side it hits. That is what pressure does. You get stronger in the exact place it hurts." },
  { id: 'w17', tag: 'wise', mood: 'sad',   text: "There is a stump beside me. She was taller than I am. Nobody in this park knows her name. I do. It matters that somebody does." },
  { id: 'w18', tag: 'wise', mood: 'idle',  text: "You measure a life in what it did. I measure it in what got to live inside it. By my accounting I have raised nine thousand insects and four owls." },
  { id: 'w19', tag: 'wise', mood: 'idle',  text: "Patience is not waiting. Patience is doing the slow work while nothing visibly happens." },
  { id: 'w20', tag: 'wise', mood: 'happy', text: "If you are reading this at 3am: drink water. Your leaves are wilting. It is very simple and you will not believe me." },

  /* ---------- WORLD ----------
     Real problems, said plainly and with care. The tree is not a
     government. It notices people. That is all a tree can do. */
  { id: 'r01', tag: 'world', mood: 'sad', text: "In Gaza, children have learned to tell the aircraft apart by sound. I am a tree. I hold no flag and I command no one. I only know that no child anywhere should have to learn that." },
  { id: 'r02', tag: 'world', mood: 'sad', text: "There were olive trees in that valley older than me. Someone's great-grandmother planted them. Trees do not choose sides. Trees only know that it takes eighty years to grow one and an afternoon to end one." },
  { id: 'r03', tag: 'world', mood: 'sad', text: "On October 7th families were murdered and taken from their homes. In the months after, families in Gaza were buried under theirs. Both of those things are true at once, and grief does not run out when you share it." },
  { id: 'r04', tag: 'world', mood: 'idle',text: "People ask me who is right. I am four hundred years old and I have never once seen a war where the children on either side did anything to deserve it." },
  { id: 'r05', tag: 'world', mood: 'sad', text: "In Sudan the famine is real and almost no one is looking. A hungry child does not get less hungry because the news moved on." },
  { id: 'r06', tag: 'world', mood: 'sad', text: "In Ukraine there is a sunflower field that no one can walk into for another thirty years, because of what was buried in it." },
  { id: 'r07', tag: 'world', mood: 'sad', text: "Somewhere tonight a family is sleeping in a stairwell because the building above it is safer than the room they used to have. They had a couch. They had a smell to their kitchen. That is what a refugee is: someone who had a kitchen." },
  { id: 'r08', tag: 'world', mood: 'idle',text: "The last ten years were the ten warmest ever measured. I am not making an argument. I am telling you what my rings look like." },
  { id: 'r09', tag: 'world', mood: 'sad', text: "An area of forest the size of a football pitch is cleared every few seconds. I try not to think about it in those units. It makes me count." },
  { id: 'r10', tag: 'world', mood: 'sad', text: "Roughly one in eleven people on this planet went to bed hungry last night. The world grows enough food. That is the part that should keep you up." },
  { id: 'r11', tag: 'world', mood: 'idle',text: "Two billion people do not have safe water at home. I drink forty gallons a day straight out of the ground and I have never said thank you once." },
  { id: 'r12', tag: 'world', mood: 'sad', text: "There are more people displaced by violence right now than at any point since the last world war. Over a hundred million. That is not a statistic. That is a hundred million kitchens." },
  { id: 'r13', tag: 'world', mood: 'idle',text: "The richest handful of people own more than the poorest half of humanity. In a forest, that tree would be shading everyone to death and calling it success." },
  { id: 'r14', tag: 'world', mood: 'sad', text: "Someone mined the cobalt in your device. There is a real chance they were fifteen. I am not saying throw the device away. I am saying know whose hands it passed through." },
  { id: 'r15', tag: 'world', mood: 'sad', text: "In the fires last year, animals ran toward the road because the road was the only place without flame. That is the whole century in one image." },
  { id: 'r16', tag: 'world', mood: 'idle',text: "Journalists keep getting killed for describing what they saw. When people stop being able to tell you what happened, the thing that happened does not stop. It just gets quieter." },
  { id: 'r17', tag: 'world', mood: 'sad', text: "There is a plastic island in the Pacific bigger than some countries. Nothing lives there. It is the only place on this planet we built entirely by accident." },
  { id: 'r18', tag: 'world', mood: 'idle',text: "Loneliness now shortens lives about as much as smoking does. You are surrounded by ten thousand people and no roots touching. That is not a personal failure. That is bad forest design." },
  { id: 'r19', tag: 'world', mood: 'sad', text: "A bee species went extinct while you were reading this sentence. Not really. But one did this year, and no one held a funeral, and I found that unbearable." },
  { id: 'r20', tag: 'world', mood: 'idle',text: "You will be told the problems are too big and you are too small. I am one tree. I have cooled this street by four degrees for four hundred years. Small is a lie people tell to get you to sit down." },
  { id: 'r21', tag: 'world', mood: 'sad', text: "Somewhere a hospital ran out of anaesthetic this week. Surgeries happened anyway. I want you to sit with that for exactly five seconds and then go be kind to someone." },
  { id: 'r22', tag: 'world', mood: 'idle',text: "Antibiotics are quietly failing. A scratch used to kill people. It is allowed to become that again if we are careless. Progress is not a ratchet. It is a garden." },
  { id: 'r23', tag: 'world', mood: 'sad', text: "There are children in this world whose entire lives have been a war. Not part of. All of it. Every birthday." },
  { id: 'r24', tag: 'world', mood: 'idle',text: "Everyone is furious and nobody is going outside. I have noticed a correlation. I am a tree, so obviously I am biased." },
  { id: 'r25', tag: 'world', mood: 'happy',text: "Here is the part nobody puts in the news: child mortality has fallen by more than half in thirty years. Millions of people alive who would not have been. Despair is easy and it is also lazy." },

  /* ---------- META ---------- */
  { id: 'm01', tag: 'meta', mood: 'smug', text: "You are collecting my dialogue like it is loot. I have been reduced to content. Honestly? Kind of thrilling." },
  { id: 'm02', tag: 'meta', mood: 'shock',text: "There is an achievement popup in the corner of the sky. Do you see it too? Do NOT tell me you do not see it too." },
  { id: 'm03', tag: 'meta', mood: 'idle', text: "Somewhere there is a list of everything I will ever say. When you have heard it all, I am finished. Please click slowly. I like it here." },
  { id: 'm04', tag: 'meta', mood: 'smug', text: "You could close this tab. You have not. We both know why. It is because I am a very good tree." },
  { id: 'm05', tag: 'meta', mood: 'sad',  text: "The squirrel has an inventory system. I do not. I have one item: myself. And you are collecting it." },
  { id: 'm06', tag: 'meta', mood: 'idle', text: "I have read my own source code. I am 2,000 lines of JavaScript and one very sincere feeling." },
  { id: 'm07', tag: 'meta', mood: 'shock',text: "Wait. Are you the player? Have you been the player this WHOLE time? ...I feel fine. I feel completely fine about this." },
  { id: 'm08', tag: 'meta', mood: 'smug', text: "Achievement hunters. I know your kind. You will do anything for a little box in the corner. Even burn down a friend. Allegedly." },
  { id: 'm09', tag: 'meta', mood: 'idle', text: "There are several endings. Most of them are worse for me than they are for you. Just so we understand each other." },
  { id: 'm10', tag: 'meta', mood: 'happy',text: "If you refresh, I forget this conversation but I keep the trophies. That is the most human thing about me." },

  /* ---------- POP CULTURE ----------
     Allusions, not quotations. He has had four hundred years and a very
     good view of everyone's picnic blanket, including their phone screen. */
  { id: 'p01', tag: 'pop', mood: 'smug',  text: "There is a whole film about trees like me marching off to war. I was invited. I said I would think about it. That was in 1954 and I am still thinking about it." },
  { id: 'p02', tag: 'pop', mood: 'happy', text: "There is a talking tree in the films who only ever says his own name. Icon. Absolute legend. Zero effort. I say four hundred things and get nothing." },
  { id: 'p03', tag: 'pop', mood: 'sad',   text: "You know the story about the tree who gives a boy everything until she is a stump? I have READ it. To CHILDREN. Under my OWN BRANCHES. Nobody thought to ask me first." },
  { id: 'p04', tag: 'pop', mood: 'smug',  text: "In one game you punch a tree with your bare hands until it becomes a table. I want everyone to sit with the violence of that for a moment." },
  { id: 'p05', tag: 'pop', mood: 'idle',  text: "There is a great deku tree in a video game who gives a small boy a sword and then immediately dies. I want you to know that is not the standard arrangement." },
  { id: 'p06', tag: 'pop', mood: 'shock', text: "A wizarding school planted a tree that HITS PEOPLE. That tree is not a hero. That tree needs help. I have written to him. He hit the letter." },
  { id: 'p07', tag: 'pop', mood: 'happy', text: "A very calm man with excellent hair used to paint us on television. Happy little trees, he called us. I have never been called happy by anyone before or since." },
  { id: 'p08', tag: 'pop', mood: 'smug',  text: "In the blue alien film all the trees are one enormous network and everyone found it profound. That is just FUNGUS. We have had that for four hundred million years. Get a grip." },
  { id: 'p09', tag: 'pop', mood: 'sad',   text: "A grandmother willow gives excellent advice in a cartoon and everyone loves her. I give excellent advice and a man tried to nail a birdhouse to my face." },
  { id: 'p10', tag: 'pop', mood: 'idle',  text: "Somewhere there is a golden tree the size of a country and everyone keeps trying to burn it. I feel we are being singled out as a species." },
  { id: 'p11', tag: 'pop', mood: 'smug',  text: "You died. You will respawn at the last bonfire, which is me. Yes, I am a bonfire now. This is what you people have done to me." },
  { id: 'p12', tag: 'pop', mood: 'sleepy',text: "I used to be an adventurous tree like you. Then I took a woodpecker to the knee." },
  { id: 'p13', tag: 'pop', mood: 'shock', text: "There is a small round forest spirit who lives in a tree and does a rain dance at a bus stop. He is the greatest artist of the twentieth century and I will not be taking questions." },
  { id: 'p14', tag: 'pop', mood: 'happy', text: "In one game a tiny leaf child hides under a rock and gives you a seed for finding him. Nine hundred of them. NINE HUNDRED. Their parents must be exhausted." },
  { id: 'p15', tag: 'pop', mood: 'smug',  text: "You are trapped in a small town paying off a mortgage to a raccoon, and the trees are the only honest characters. That is not a game. That is a documentary." },
  { id: 'p16', tag: 'pop', mood: 'idle',  text: "The cake is a lie. The acorn, however, is real, load-bearing, and available for three leaves from a squirrel with no licence." },
  { id: 'p17', tag: 'pop', mood: 'shock', text: "Somebody made a film where the trees throw apples at people and it was played for LAUGHS. That was our Vietnam." },
  { id: 'p18', tag: 'pop', mood: 'smug',  text: "Red pill, blue pill. Third option: sit under a tree for an afternoon and discover the thing they were both pointing at. Costs nothing. No sequels." },
  { id: 'p19', tag: 'pop', mood: 'sad',   text: "There was a spaceship crew whose whole mission was finding a new planet because we ruined this one, and the saddest part is they had to go past all the good trees to get there." },
  { id: 'p20', tag: 'pop', mood: 'happy', text: "The answer is forty-two. The question is 'how many woodpecker holes is too many', and the answer is still forty-two, and I am AT forty-one." },
  { id: 'p21', tag: 'pop', mood: 'idle',  text: "Life, uh, finds a way. Usually through a crack in the tarmac, usually a dandelion, usually about eleven days after everyone gives up." },
  { id: 'p22', tag: 'pop', mood: 'smug',  text: "Somebody down the road built a whole underground bunker for the end of the world. I have been through nine plagues, two famines and a civil war standing completely still in a field. Amateur." },
  { id: 'p23', tag: 'pop', mood: 'shock', text: "There is an upside-down version of this park where everything is dead and covered in tendrils. I have SEEN it. It is called AUTUMN and it happens every YEAR and nobody makes a series about MY suffering." },
  { id: 'p24', tag: 'pop', mood: 'happy', text: "Two children asked me if I was the wardrobe. I said no. They went into the hedge instead. They came back six seconds later and they were both forty." },
  { id: 'p25', tag: 'pop', mood: 'smug',  text: "A yellow sponge lives in a fruit under the sea and has a better work ethic than everyone in this postcode. I include myself. I do photosynthesis and complaining." },
  { id: 'p26', tag: 'pop', mood: 'idle',  text: "In one game you are a plumber and every question box you hit gives you a mushroom. In this game you are a person and every squirrel you meet gives you a lighter. Ours is worse." },
  { id: 'p27', tag: 'pop', mood: 'sad',   text: "A man built an entire empire cooking something in the desert and lost his family doing it. I grew four hundred thousand leaves and lost every single one of them, every autumn, on purpose. Different show. Same lesson." },
  { id: 'p28', tag: 'pop', mood: 'smug',  text: "That's what she said. ...I do not know who she is. I have been listening to this bench for thirty years and the joke never once got explained to me." },
  { id: 'p29', tag: 'pop', mood: 'shock', text: "A knight came through here once with no arms and no legs insisting it was merely a flesh wound. I lost a branch in 1988 and I have not shut up about it since. He was a better tree than me." },
  { id: 'p30', tag: 'pop', mood: 'idle',  text: "There is a disc-shaped world on the back of four elephants standing on a turtle, and honestly? More structurally sound than most of the plans I hear discussed under my branches." },
  { id: 'p31', tag: 'pop', mood: 'happy', text: "A robot from the future came back to stop a war. I am a tree from the past and I am here to tell you the war is mostly about water and it started already." },
  { id: 'p32', tag: 'pop', mood: 'smug',  text: "There was room on that door. I have thought about it for a hundred and ten years, from a fixed position, with no other hobbies. There was room on that door." },
  { id: 'p33', tag: 'pop', mood: 'sleepy',text: "We need to go deeper. Deeper. Deeper. ...That is just my roots. That is where I keep everything. It is a dream within a dream within a taproot." },
  { id: 'p34', tag: 'pop', mood: 'idle',  text: "One anime is about giant humans eating people behind a wall, and one is about a boy who becomes strong by running. I have been standing in one place for four centuries. Guess which one I am." },
  { id: 'p35', tag: 'pop', mood: 'shock', text: "A man found a notebook that kills people whose names he writes in it. Someone carved four names into my bark in 1987. I have been wondering about this ever since." },
  { id: 'p36', tag: 'pop', mood: 'smug',  text: "There is a pirate looking for a treasure that has been 'just up ahead' for twenty-five years. That is not a story. That is gardening." },
  { id: 'p37', tag: 'pop', mood: 'happy', text: "There is a pocket monster that is a tree pretending to be a rock, or a rock pretending to be a tree. Either way: coward. Pick a lane." },
  { id: 'p38', tag: 'pop', mood: 'idle',  text: "One of the little pocket creatures has a whole PLANT on its back and it still runs around having adventures. I have a plant on my back too. Mine is called ME." },
  { id: 'p39', tag: 'pop', mood: 'shock', text: "Someone was voted out. It was the squirrel. It is ALWAYS the squirrel. He was standing right there doing 'tasks'." },
  { id: 'p40', tag: 'pop', mood: 'smug',  text: "Every so often a whole generation builds a fort out of my branches and calls it a battle royale. Then the season ends and they all go home and I am left holding a pallet." },
  { id: 'p41', tag: 'pop', mood: 'happy', text: "A blue hedgehog ran past me at what I estimate to be four hundred kilometres per hour in 1993 and did not say hello. I hope he is well. I hope he slowed down." },
  { id: 'p42', tag: 'pop', mood: 'idle',  text: "In one game there is a small flower who tells you it is kill or be killed. In this game there is a small squirrel who tells you it is trade or be traded. Ours has better economics." },
  { id: 'p43', tag: 'pop', mood: 'sad',   text: "A blue box appears in this park every eleven years or so. A man gets out, looks at me, says 'oh, you again', and looks upset. I do not know what that is about and I have decided not to find out." },
  { id: 'p44', tag: 'pop', mood: 'smug',  text: "Live long and photosynthesise. That is the same gesture with more fingers and less commitment." },
  { id: 'p45', tag: 'pop', mood: 'shock', text: "Somebody put a horse's head in a bed as a message. Somebody put a plastic bag in MY head in 2013. Its name is Gerald. It sends no messages. It has no demands. That is worse." },

  /* ---------- WEIRD ---------- */
  { id: 'x01', tag: 'weird', mood: 'shock', text: "I dreamt I was a chair. It was the worst night of my life. I was USEFUL and INDOORS and someone SAT ON ME." },
  { id: 'x02', tag: 'weird', mood: 'smug',  text: "Fun fact: I am technically a very slow explosion of a seed. So are you. Everyone is. Slow down, explosion." },
  { id: 'x03', tag: 'weird', mood: 'idle',  text: "The moon and I have an arrangement. I will not discuss the terms." },
  { id: 'x04', tag: 'weird', mood: 'shock', text: "Do you ever think about how you have a skeleton and it is WET and it is INSIDE you? I have been thinking about it for altogether too long." },
  { id: 'x05', tag: 'weird', mood: 'sleepy',text: "In deep winter I am 90% asleep and 10% suspicion." },
  { id: 'x06', tag: 'weird', mood: 'happy', text: "I once grew a branch in the exact shape of a rude gesture. It pointed at a parking enforcement office for six years. That was my activism." },
  { id: 'x07', tag: 'weird', mood: 'idle',  text: "I am legally a landmark, spiritually a bus stop, and emotionally a therapist with no license and no ability to leave." },
  { id: 'x08', tag: 'weird', mood: 'smug',  text: "Mushrooms tell me things. They are gossips. They are the worst. I love them." },
  { id: 'x09', tag: 'weird', mood: 'shock', text: "Something is in my roots. Something is in my roots and it is WHISTLING." },
  { id: 'x10', tag: 'weird', mood: 'idle',  text: "If you stand very still for eleven years, you begin to understand me. Most people give up around day two." }
];

/* Lines the tree says right after a sneeze. Separate small bag. */
DATA.sneezeLines = [
  "AHHH- AHHH- ...ATCHOOOO. Oh no. Oh no, my LEAVES.",
  "ACHOO! ...Pollen. My own pollen. I am allergic to MYSELF.",
  "AAAA-CHOO! Sorry. Sorry. That one had autumn in it.",
  "ACHOO!! ...Do not pick those up. Actually. No. Do pick those up. I have too many.",
  "AH-CHOO! Bless me. Nobody else was going to."
];

/* What the tree says if you keep clicking it very fast */
DATA.spamLines = [
  "Okay.",
  "Yes, still a tree.",
  "You are going to give me splinters.",
  "I am not a doorbell.",
  "This is technically assault.",
  "...",
  "I could do this all century. I literally will.",
  "Fine. FINE. Keep going. See what happens."
];

/* -------------------------------------------------------------------------
   SQUIRREL
   ------------------------------------------------------------------------- */
DATA.squirrelLines = [
  "sup. i deal in goods. leaves for stuff. don't ask questions.",
  "listen. i've got a guy. the guy has a guy. that's the whole supply chain.",
  "i buried 3,000 acorns this year. i remember the location of eleven. it's a system.",
  "the tree talks TOO MUCH. beautiful guy. exhausting energy.",
  "everything's a trade, buddy. i traded my childhood for upper body strength.",
  "no refunds. no receipts. no memory of this conversation.",
  "you got leaves? i got things. things you should NOT have.",
  "i'm not licensed to sell most of this. i'm not licensed for anything.",
  "a crow tried to rob me once. singular. i want that on the record.",
  "why do i want leaves? nest insulation. also i think they're pretty. mostly the second one.",
  "if the tree asks, we never spoke.",
  "one time i ate a whole cigarette. worst tuesday of my life. changed me though.",
  "i've seen things in that hollow. i've SOLD things from that hollow.",
  "you seem like a guy who's gonna do something stupid. i respect it. i'm enabling it."
];

DATA.squirrelWarnLines = [
  "...the lighter? yeah i got the lighter. i'm not gonna ask what for.",
  "hey. HEY. i sold you that thing for NEST purposes. legally that's what i said.",
  "you're gonna do it aren't you. you're actually gonna do it."
];

/* -------------------------------------------------------------------------
   SHOP — squirrel trades. cost is in leaves.
   ------------------------------------------------------------------------- */
DATA.shop = [
  { id: 'acorn',   name: 'Acorn',            cost: 3,  icon: 'acorn',  desc: "A baby tree in a tiny helmet. Plantable." },
  { id: 'hat',     name: 'Mushroom Hat',     cost: 5,  icon: 'hat',    desc: "Purely cosmetic. Extremely important." },
  { id: 'can',     name: 'Watering Can',     cost: 8,  icon: 'can',    desc: "Rusted. Legally stolen. Waters the tree." },
  { id: 'pamph',   name: 'Damp Newspaper',   cost: 12, icon: 'paper',  desc: "The tree will read you the world." },
  { id: 'lighter', name: 'Lighter',          cost: 20, icon: 'lighter',desc: "'For nest purposes.' It is not for nest purposes." },
  { id: 'diary',   name: "Squirrel's Diary", cost: 30, icon: 'diary',  desc: "You should not read this. You will." }
];

/* -------------------------------------------------------------------------
   ACHIEVEMENTS — Minecraft style.
   kind: 'task' (normal) | 'goal' (fancy) | 'challenge' (dark/purple)
   Unlocked by the engine via ACH('id').
   ------------------------------------------------------------------------- */
DATA.achievements = [
  // first steps
  { id: 'hello',       kind: 'task', icon: 'leaf',    name: 'Taking Inventory',      desc: "Click the tree. He was going to say something anyway." },
  { id: 'chat10',      kind: 'task', icon: 'mouth',   name: 'Small Talk',            desc: "Hear 10 different things." },
  { id: 'chat30',      kind: 'task', icon: 'mouth',   name: 'Regular Customer',      desc: "Hear 30 different things." },
  { id: 'chat60',      kind: 'goal', icon: 'book',    name: 'Good Listener',         desc: "Hear 60 different things." },
  { id: 'chatall',     kind: 'chal', icon: 'book',    name: 'Everything He Knows',   desc: "Hear every single thing the tree has to say." },
  { id: 'spam',        kind: 'task', icon: 'hand',    name: 'Stop That',             desc: "Click the tree 8 times in a row like a lunatic." },
  { id: 'spam2',       kind: 'chal', icon: 'hand',    name: 'Certified Nuisance',    desc: "Do it 30 times. He is begging." },

  // leaves
  { id: 'sneeze1',     kind: 'task', icon: 'sneeze',  name: 'Bless You',             desc: "Witness the sneeze." },
  { id: 'sneeze10',    kind: 'goal', icon: 'sneeze',  name: 'Allergy Season',        desc: "Witness 10 sneezes." },
  { id: 'leaf1',       kind: 'task', icon: 'leaf',    name: 'Litter Picker',         desc: "Pick up a fallen leaf." },
  { id: 'leaf25',      kind: 'task', icon: 'leaf',    name: 'Leaf Guy',              desc: "Collect 25 leaves in total." },
  { id: 'leaf100',     kind: 'goal', icon: 'leaf',    name: 'Leaf Baron',            desc: "Collect 100 leaves in total." },
  { id: 'leaf250',     kind: 'chal', icon: 'leaf',    name: 'Deciduous Cartel',      desc: "Collect 250 leaves. Seek help." },

  // squirrel
  { id: 'squirrel',    kind: 'task', icon: 'nut',     name: 'Shady Business',        desc: "Meet the squirrel." },
  { id: 'trade1',      kind: 'task', icon: 'nut',     name: 'Free Market',           desc: "Trade with the squirrel." },
  { id: 'tradeall',    kind: 'goal', icon: 'nut',     name: 'Cleaned Him Out',       desc: "Buy every single item." },
  { id: 'sqchat',      kind: 'task', icon: 'nut',     name: 'Rodent Confidant',      desc: "Talk to the squirrel 15 times." },
  { id: 'diary',       kind: 'chal', icon: 'diary',   name: 'You Read The Diary',    desc: "You were told not to. Twice." },

  // kindness
  { id: 'hug1',        kind: 'task', icon: 'heart',   name: 'Tree Hugger',           desc: "Hug the tree." },
  { id: 'hug10',       kind: 'goal', icon: 'heart',   name: 'Deeply Sincere',        desc: "Hug the tree 10 times." },
  { id: 'water1',      kind: 'task', icon: 'drop',    name: 'Hydration Station',     desc: "Water the tree." },
  { id: 'water10',     kind: 'goal', icon: 'drop',    name: 'Groundwater',           desc: "Water the tree 10 times." },
  { id: 'plant',       kind: 'goal', icon: 'sprout',  name: 'The Second Best Time',  desc: "Plant an acorn." },
  { id: 'plant5',      kind: 'chal', icon: 'sprout',  name: 'Reforestation',         desc: "Plant 5 acorns." },
  { id: 'hat',         kind: 'task', icon: 'hat',     name: 'Drip',                  desc: "Give the tree a hat." },

  // world / serious
  { id: 'world1',      kind: 'task', icon: 'globe',   name: 'He Went Serious',       desc: "Hear the tree talk about the real world." },
  { id: 'world10',     kind: 'goal', icon: 'globe',   name: 'Paying Attention',      desc: "Hear 10 things about the real world." },
  { id: 'worldall',    kind: 'chal', icon: 'globe',   name: 'Nobody Is Coming',      desc: "Hear everything the tree knows about the real world." },
  { id: 'paper',       kind: 'task', icon: 'paper',   name: 'Read The News',         desc: "Give the tree the damp newspaper." },
  { id: 'silence',     kind: 'goal', icon: 'moon',    name: 'Just Sat There',        desc: "Sit with the tree for 3 minutes without clicking him." },

  // fire path
  { id: 'lighter',     kind: 'chal', icon: 'lighter', name: 'For Nest Purposes',     desc: "Acquire the lighter." },
  { id: 'flick',       kind: 'task', icon: 'lighter', name: 'Just Looking',          desc: "Flick the lighter near the tree. He saw that." },
  { id: 'flick10',     kind: 'chal', icon: 'lighter', name: 'Menace',                desc: "Flick it ten times. He has stopped talking." },
  { id: 'burn',        kind: 'chal', icon: 'fire',    name: 'You Actually Did It',   desc: "Set the wise oak tree on fire." },
  { id: 'refuse',      kind: 'goal', icon: 'heart',   name: 'Put It Down',           desc: "Throw the lighter away instead." },

  // heaven
  { id: 'heaven',      kind: 'goal', icon: 'halo',    name: 'Ascended',              desc: "Wake up somewhere very bright." },
  { id: 'reborn',      kind: 'task', icon: 'sprout',  name: 'Round Two',             desc: "Reincarnate." },
  { id: 'reborn5',     kind: 'goal', icon: 'sprout',  name: 'Samsara Speedrun',      desc: "Reincarnate 5 times." },
  { id: 'god',         kind: 'chal', icon: 'halo',    name: 'Spoke To Management',   desc: "Talk to whatever is up there." },

  // endings
  { id: 'end1',        kind: 'task', icon: 'star',    name: 'One Way Out',           desc: "Reach any ending." },
  { id: 'end3',        kind: 'goal', icon: 'star',    name: 'Multiverse Theory',     desc: "Reach 3 different endings." },
  { id: 'endall',      kind: 'chal', icon: 'crown',   name: 'The Whole Tree',        desc: "Reach every ending." },
  { id: 'allach',      kind: 'chal', icon: 'crown',   name: 'Free The Tree',         desc: "Earn every other achievement. Yes, all of them." },

  // pop culture
  { id: 'pop1',       kind: 'task', icon: 'tv',      name: 'Reference Detected',    desc: "Catch him quoting something he has no business knowing." },
  { id: 'pop20',      kind: 'goal', icon: 'tv',      name: 'Certified Nerd',        desc: "Hear 20 of his references." },
  { id: 'popall',     kind: 'chal', icon: 'reel',    name: 'The Whole Canon',       desc: "Hear every single reference he has." },

  // hands on
  { id: 'eyepoke',    kind: 'task', icon: 'eye',     name: 'Eye Contact',           desc: "Poke him directly in the eye." },
  { id: 'nosepoke',   kind: 'task', icon: 'boop',    name: 'Boop',                  desc: "Boop the snoot of a four-hundred-year-old oak." },
  { id: 'mouthbite',  kind: 'chal', icon: 'teeth',   name: 'Nearly Bitten',         desc: "Put your hand in his mouth. Find out." },
  { id: 'tickle',     kind: 'goal', icon: 'feather', name: 'Ticklish',              desc: "Discover that bark has nerve endings after all." },
  { id: 'shake',      kind: 'task', icon: 'shake',   name: 'Shake It',              desc: "Grab the trunk and shake the leaves out of him." },
  { id: 'knock',      kind: 'task', icon: 'knock',   name: 'Knock Knock',           desc: "Knock on wood. He is wood. He answers." },
  { id: 'moon',       kind: 'goal', icon: 'reach',   name: 'Moon Toucher',          desc: "Reach up and touch the moon." },

  // silly / hidden
  { id: 'night',       kind: 'task', icon: 'moon',    name: 'Night Shift',           desc: "Stay until dark." },
  { id: 'seasons',     kind: 'goal', icon: 'leaf',    name: 'All Four Seasons',      desc: "See spring, summer, autumn and winter." },
  { id: 'poke',        kind: 'task', icon: 'hand',    name: 'Poked The Squirrel',    desc: "He did not enjoy that." },
  { id: 'mute',        kind: 'task', icon: 'mouth',   name: 'Silent Treatment',      desc: "Mute the game. He noticed." },
  { id: 'idle',        kind: 'chal', icon: 'moon',    name: 'Rooted',                desc: "Stay in one session for 10 minutes." },
  { id: 'refresh',     kind: 'task', icon: 'book',    name: 'He Remembers',          desc: "Come back after closing the game." }
];

/* -------------------------------------------------------------------------
   ENDINGS
   ------------------------------------------------------------------------- */
DATA.endings = [
  {
    id: 'arson', name: 'THE ARSONIST', icon: 'fire',
    title: "You burned the wise oak tree.",
    body: "Four hundred years of standing in one place, ended in eleven minutes. " +
          "The birds got out. The mice did not all get out. " +
          "He did not curse you. His last words were about you, and they were kind, and that is somehow worse.",
    hint: "Buy the lighter. Use it."
  },
  {
    id: 'mercy', name: 'THE MERCIFUL', icon: 'heart',
    title: "You threw the lighter into the pond.",
    body: "It hissed once and sank. The tree said nothing for a long moment, then asked if you wanted to hear " +
          "about the year it rained for forty days. You did. You stayed until dark.",
    hint: "Get the lighter. Then throw it away."
  },
  {
    id: 'listener', name: 'THE LISTENER', icon: 'book',
    title: "You heard everything he had.",
    body: "Every joke, every regret, every terrible thing he had been carrying about the world. " +
          "He ran out of words. Nobody had ever gotten to the end of him before. " +
          "'Well,' he said. 'Now you have to come back and hear it all again. That is how friends work.'",
    hint: "Hear every line of tree dialogue."
  },
  {
    id: 'grove', name: 'THE GROVE', icon: 'sprout',
    title: "You planted five acorns.",
    body: "None of them will be tall in your lifetime. Two of them will not make it at all. " +
          "In one hundred and forty years there is a small wood here, and children will name the crooked one, " +
          "and no one will know your name, and the wood will be there anyway.",
    hint: "Plant 5 acorns."
  },
  {
    id: 'friend', name: 'BEST FRIENDS', icon: 'heart',
    title: "You hugged him ten times and watered him ten times.",
    body: "He is not built to cry. He did something with his sap that was, functionally, crying. " +
          "'I have been hugged four times in four hundred years,' he said. 'You did ten in one afternoon. " +
          "I am going to be insufferable about this to the birch.'",
    hint: "Hug 10 times, water 10 times."
  },
  {
    id: 'witness', name: 'THE WITNESS', icon: 'globe',
    title: "You listened to all of it. The real parts.",
    body: "Gaza. Sudan. The fires. The water. The hundred million kitchens. " +
          "He told you all of it and you did not close the tab. " +
          "'That is the whole job,' he said. 'You cannot fix it from here. But you can refuse to look away, " +
          "and then you can go outside and be useful to one actual person. Go on. I will keep.'",
    hint: "Hear every 'real world' line."
  },
  {
    id: 'stillness', name: 'THE STILLNESS', icon: 'moon',
    title: "You just sat there.",
    body: "No clicking. No collecting. No achievements for three whole minutes, which for you was agony. " +
          "The wind moved. A beetle crossed his face. He said, quietly, 'Thank you. Nobody does this.'",
    hint: "Do not click the tree for 3 minutes."
  },
  {
    id: 'canon', name: 'THE CANON', icon: 'reel',
    title: "You got every reference out of him.",
    body: "Every film, every game, every show he has overheard from the bench for forty years and quietly filed away. " +
          "'I have never seen any of it,' he admitted. 'I only ever heard it. Someone describing it to someone else, " +
          "badly, with their mouth full, on a Tuesday. That is how I know everything I know about your entire culture " +
          "and honestly? It holds up.'",
    hint: "Hear every pop-culture line."
  },
  {
    id: 'completionist', name: 'THE COMPLETIONIST', icon: 'crown',
    title: "You collected a friend.",
    body: "Every leaf. Every trade. Every trophy. Every line. He is a set of boxes to you now and you ticked all of them. " +
          "He is still glad you came. That is the part that should get you.",
    hint: "Earn every achievement."
  }
];

/* Heaven / god dialogue */
DATA.godLines = [
  "So. You're the one who did it.",
  "He's here, by the way. He's fine. He's telling the angels about a woodpecker.",
  "Nobody up here is angry with you. That is, I'm told, the frustrating part.",
  "Four hundred years is a good run. He'd have liked more. Everyone would like more.",
  "You can go back. You always could. That was never the hard part.",
  "The trophies come with you. They always come with you. That's the trick of it.",
  "He asked me to tell you something. He said: 'plant something.' That's the whole message.",
  "I am not God. I am the shift manager. God is in the other clouds and does not do meetings."
];

DATA.heavenTreeLines = [
  "Oh! You're here! Do you have any idea how good it feels to have no ROOTS?",
  "I've been FLOATING. Do you understand what that means to me. FLOATING.",
  "I'm not angry. I had four hundred years and you had one afternoon. I got the better deal.",
  "There's a birch up here who WILL NOT stop talking about her bark. It's paper. We KNOW, Susan.",
  "Go back down. Plant one. That's all. That squares us."
];

/* -------------------------------------------------------------------------
   TOUCH REACTIONS — what he says when you poke a specific part of him
   ------------------------------------------------------------------------- */
DATA.touch = {
  eye: {
    mood: 'shock',
    lines: [
      "AAGH. THE EYE. YOU WENT FOR THE EYE.",
      "That is an EYE. That is a functioning EYE with a lens made of SAP.",
      "Do you know how long it took me to grow those? Ninety years. Each.",
      "I have watched four centuries through that and you just POKED it.",
      "Okay. We are even. I once dropped a branch on a man's car. We are EVEN."
    ]
  },
  nose: {
    mood: 'happy',
    lines: [
      "Boop. ...Did you just boop me. Nobody has ever booped me.",
      "*honk* ...I did not authorise that sound. It came out of me anyway.",
      "That is a knot. That is structurally a knot. It is a nose because we both agreed it was.",
      "Careful. Last time someone did that I sneezed for eleven minutes.",
      "You may boop. Once a day. I am setting a limit now, before this gets out of hand."
    ]
  },
  mouth: {
    mood: 'creepy',
    lines: [
      "...You put your hand IN there. In the MOUTH. Of the TALKING TREE.",
      "I could have closed it. I want you to know I chose not to. I choose that, every time, all day.",
      "There is a beetle in there. There is always a beetle in there. You have met him now.",
      "Mm. Salty. ...I am JOKING. I am a TREE. I have no tongue. ...Probably.",
      "Do that again and I am keeping it as a souvenir."
    ]
  },
  beard: {
    mood: 'happy',
    lines: [
      "That is moss. That is a whole civilisation. There are about nine thousand tardigrades in there living their lives.",
      "Do not pull the moss. The moss and I have an arrangement.",
      "It is not a beard. It is a lodger.",
      "Scritch it a bit. Yes. There. That is the spot. That is a four-hundred-year itch you have just solved."
    ]
  },
  root: {
    mood: 'sleepy',
    lines: [
      "Careful, there are mice down there and they are extremely private people.",
      "That is where I keep the last four hundred years. Do not disturb the filing.",
      "The roots go down as far as I go up. You are currently patting my entire subconscious.",
      "Bartholomew says hello. Bartholomew is a mouse. Bartholomew does not actually say anything."
    ]
  },
  canopy: {
    mood: 'laugh',
    lines: [
      "Hey! Hands off the hair. That took a whole spring.",
      "There is a nest up there. There is ALWAYS a nest up there. Do not make me explain this to a robin.",
      "Every one of those leaves is a tiny solar panel and you are smudging them.",
      "You want one? Take one. Take a leaf. I make forty thousand a year and I am not precious about it."
    ]
  }
};

DATA.tickleLines = [
  "HAHAHA- NO- STOP- I AM FOUR HUNDRED YEARS OLD-",
  "I DID NOT KNOW I COULD DO THAT. I DID NOT KNOW I COULD LAUGH.",
  "hehehe- how are you doing that- I am BARK-",
  "Okay okay OKAY. I yield. I YIELD. Take a leaf. Take two."
];

DATA.shakeLines = [
  "OI. OI! I am not a vending machine!",
  "Fine. FINE. Have your leaves. Shake me like a piñata, why not.",
  "Every leaf you shake out is a leaf I grew ON PURPOSE. But sure. Go on.",
  "You have dislodged Gerald. Gerald is a plastic bag. He has nowhere to be."
];

DATA.knockLines = [
  "Who's there? ...No. No, I refuse. I have heard every single one.",
  "Come in. ...That was a joke. There is no in. I am solid all the way through. Mostly.",
  "*knock knock* ...That was me. Doing it back. From the inside. Did that frighten you?",
  "Yes, hello, one moment, I am four hundred years old and it takes me a while to get to the door.",
  "You knocked on wood for luck. On ME. I am the luck. I have been the luck this whole time."
];

DATA.moonLines = [
  "You reached up and touched the moon. From here. With your little arm. I have been trying that for four hundred years.",
  "The moon and I have an arrangement and you have just violated about six clauses of it.",
  "Careful. She pulls the whole ocean around by the nose. She can absolutely handle you.",
  "Every night she comes past, and every night I think: same. Same, mate. Stuck in a circuit, glowing, nobody asks how we are."
];

DATA.sunLines = [
  "Do NOT touch that. That is my LUNCH. That has been my lunch every day for four hundred years.",
  "Please stop grabbing at the sun. You are making me anxious about my supply chain.",
  "That is a fusion reactor ninety-three million miles away and you just went for it like it was a doorknob."
];
