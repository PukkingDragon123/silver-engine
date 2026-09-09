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
  { id: 'g01', tag: 'goofy', mood: 'happy', text: "I am nine hundred years old and I have never once had to find parking." },
  { id: 'g02', tag: 'goofy', mood: 'smug',  text: "People say 'touch grass'. I say: touch bark. Grass is a coward. Grass runs from winter." },
  { id: 'g03', tag: 'goofy', mood: 'idle',  text: "A woodpecker lives in my elbow. He pays no rent. We are, legally speaking, roommates." },
  { id: 'g04', tag: 'goofy', mood: 'shock', text: "Do NOT look up. There is a squirrel up there doing something unspeakable with a walnut." },
  { id: 'g05', tag: 'goofy', mood: 'happy', text: "My branches are extremely strong. Do not test this. Two children tested this. They were fine. I was not." },
  { id: 'g06', tag: 'goofy', mood: 'idle',  text: "I have been standing in the exact same spot since 1140. Ask me about my cardio." },
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
  { id: 'r04', tag: 'world', mood: 'idle',text: "People ask me who is right. I am nine hundred years old and I have never once seen a war where the children on either side did anything to deserve it." },
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
  { id: 'r20', tag: 'world', mood: 'idle',text: "You will be told the problems are too big and you are too small. I am one tree. I have cooled this street by four degrees for nine hundred years. Small is a lie people tell to get you to sit down." },
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

  { id: 'r26', tag: 'world', mood: 'sad', text: "A ceasefire is not peace. A ceasefire is everyone agreeing to stop for a moment so the ambulances can get through. That is all it is. It is still worth everything." },
  { id: 'r27', tag: 'world', mood: 'idle',text: "Wars are decided by people who will never hear the sound. That has been true for every one of the eleven I have stood through." },
  { id: 'r28', tag: 'world', mood: 'sad', text: "In Gaza the water is rationed to a few litres a day for washing, drinking, everything. I take forty gallons out of the ground without asking. I think about that." },
  { id: 'r29', tag: 'world', mood: 'sad', text: "The hostages taken from their homes are still someone's children, whatever age they are. So are the ones under the rubble. I am not doing arithmetic. I am refusing to." },
  { id: 'r30', tag: 'world', mood: 'idle',text: "Every side in every war has a story where they are the one who was wronged first. The stories are usually true. That is the trap." },
  { id: 'r31', tag: 'world', mood: 'sad', text: "Someone in a studio a long way away calls it a complicated situation. It is not complicated where the building fell. It is very simple there." },
  { id: 'r32', tag: 'world', mood: 'sad', text: "The children of Sudan are starving in a famine their own government helped make, and the world's attention had already been spent that month." },
  { id: 'r33', tag: 'world', mood: 'idle',text: "A drone costs less than a car and can be flown by someone who will go home for dinner afterwards. That is the thing that has actually changed in my lifetime." },
  { id: 'r34', tag: 'world', mood: 'sad', text: "There are teachers running lessons in tents, in three languages, for children who have no school left. Nobody is filming them. They do it anyway." },
  { id: 'r35', tag: 'world', mood: 'idle',text: "Every empire that ever stood in this valley was going to last forever. I have outlived four of them. The hedge outlived five." },
  { id: 'r36', tag: 'world', mood: 'sad', text: "Aid convoys queue at a border while the food rots. There is enough. There is always enough. It is a logistics problem dressed up as a moral one." },
  { id: 'r37', tag: 'world', mood: 'idle',text: "Politicians plant trees for photographs. I have been planted four times by four different men who all wanted to be seen doing it. I am glad they did. I would rather be a prop than firewood." },
  { id: 'r38', tag: 'world', mood: 'sad', text: "A rescue worker in a collapsed building calls for silence so he can listen for breathing. That silence is the most important sound humans make." },
  { id: 'r39', tag: 'world', mood: 'idle',text: "You will be told that caring about a far-away war is a luxury. It is not. It is the cheapest thing you own. It costs you nothing and it is the only reason anything ever stops." },
  { id: 'r40', tag: 'world', mood: 'sad', text: "Somebody's grandmother is a refugee for the second time in one life. She did this in her twenties. She is doing it again in her eighties. She remembers the route." },
  { id: 'r41', tag: 'world', mood: 'idle',text: "Democracy is not a thing you have. It is a thing you are doing, badly, on a Tuesday, in a leisure centre, with a pencil on a string." },
  { id: 'r42', tag: 'world', mood: 'sad', text: "The forests near a war do not get counted. Olive groves, orchards, windbreaks, four hundred years of somebody's patience. Nobody writes those numbers down." },
  { id: 'r43', tag: 'world', mood: 'idle',text: "People keep telling me their country is the greatest one. I have roots in a country that has been six different countries. The soil never once noticed." },
  { id: 'r44', tag: 'world', mood: 'sad', text: "There is a generation of children who will need help with their heads long after the shooting stops, and almost nobody is budgeting for that." },
  { id: 'r45', tag: 'world', mood: 'happy',text: "And still: more people are vaccinated, fed and literate than at any point in my nine centuries. Both things are true. Hold both. That is the whole job." },

  /* ---------- POP CULTURE ----------
     Allusions, not quotations. He has had nine hundred years and a very
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
  { id: 'p34', tag: 'pop', mood: 'idle',  text: "One anime is about giant humans eating people behind a wall, and one is about a boy who becomes strong by running. I have been standing in one place for nine centuries. Guess which one I am." },
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
  // the park itself
  { id: 'map',         kind: 'task', icon: 'globe',   name: 'Eight Hundred Acres',   desc: "Look at the map of the park." },
  { id: 'area2',       kind: 'task', icon: 'reach',   name: 'Off The Lawn',          desc: "Walk to a second place in the park." },
  { id: 'area4',       kind: 'goal', icon: 'reach',   name: 'Half The Park',         desc: "Get four of the park's places open." },
  { id: 'area6',       kind: 'goal', icon: 'reach',   name: 'Most Of It',            desc: "Get six of the park's places open." },
  { id: 'area8',       kind: 'chal', icon: 'globe',   name: 'Every Gate',            desc: "Open every place in the park." },
  { id: 'areaall',     kind: 'chal', icon: 'globe',   name: 'Walked All Of It',      desc: "Stand in every place in the park." },
  { id: 'seneca',      kind: 'goal', icon: 'ledger',  name: 'Say The Name',          desc: "Stand where Seneca Village stood." },
  { id: 'rink',        kind: 'task', icon: 'drop',    name: 'Refrigerated Since 1950', desc: "Find the rink." },
  { id: 'suit',        kind: 'task', icon: 'ledger',  name: 'The Man In The Red Tie', desc: "Watch somebody cross the rink." },
  { id: 'suit5',       kind: 'goal', icon: 'ledger',  name: 'The Whole Record',      desc: "Hear everything the oak actually watched him do." },
  // talking, which is the game
  { id: 'topics',      kind: 'task', icon: 'book',    name: 'The Running Order',     desc: "Look up what he still has to talk about." },
  { id: 'set1',        kind: 'task', icon: 'mouth',   name: 'He Has More',           desc: "Listen long enough that he opens a second subject." },
  { id: 'set2',        kind: 'task', icon: 'mouth',   name: 'The Odd Business',      desc: "Get him on to the things he does not mention on a first afternoon." },
  { id: 'set3',        kind: 'goal', icon: 'reel',    name: 'Never Seen A Frame',     desc: "Get him talking about television." },
  { id: 'set4',        kind: 'goal', icon: 'eye',     name: 'The Uncomfortable Set', desc: "Let him talk about you." },
  { id: 'set5',        kind: 'goal', icon: 'ledger',  name: 'Who Decides',           desc: "Reach the set he keeps for people who come back." },
  { id: 'set6',        kind: 'chal', icon: 'globe',   name: 'The Real Parts',        desc: "Reach the last set. He stops joking in that one." },
  { id: 'setall',      kind: 'chal', icon: 'book',    name: 'Everything He Opens',   desc: "Have him open every set of subjects he has." },
  { id: 'power1',      kind: 'task', icon: 'ledger',  name: 'Nine Hundred Years Of It', desc: "Hear him on power for the first time." },
  { id: 'power15',     kind: 'goal', icon: 'ledger',  name: 'The Long View',         desc: "Hear fifteen things he watched happen to this field." },
  { id: 'powerall',    kind: 'chal', icon: 'ledger',  name: 'The Whole Enclosure',   desc: "Hear everything he has to say about who decides." },
  { id: 'garden',      kind: 'task', icon: 'leaf',    name: 'The Snail Garden',      desc: "Find where heaven keeps the postal service." },
  { id: 'snails12',    kind: 'goal', icon: 'paper',   name: 'A Full Round',          desc: "Have twelve different snails deliver to you." },
  // the post, the settings squirrel, the credits butterfly
  { id: 'openpost',    kind: 'task', icon: 'paper',   name: 'Signed For It',         desc: "Stop a snail and read what it is carrying." },
  { id: 'allpost',     kind: 'goal', icon: 'paper',   name: 'Nothing Left Unread',   desc: "Open every piece of post before it crawls off the edge." },
  { id: 'gear',        kind: 'task', icon: 'nut',     name: 'He Runs The Settings',  desc: "Find out what the squirrel does for a living now." },
  { id: 'credits',     kind: 'task', icon: 'bird',    name: 'Follow The Bright One', desc: "Catch the butterfly that is not like the others." },
  { id: 'oakchat',     kind: 'task', icon: 'mouth',   name: 'Said It Out Loud',      desc: "Type something to the oak instead of picking an answer." },
  { id: 'oakchat20',   kind: 'goal', icon: 'mouth',   name: 'An Actual Conversation',desc: "Say twenty things to the oak in your own words." },
  { id: 'quest1',      kind: 'task', icon: 'reach',   name: 'Something To Do',       desc: "Take on a job from the board." },
  { id: 'questdone',   kind: 'goal', icon: 'reach',   name: 'Job Done',              desc: "Finish a job for him." },
  { id: 'questall',    kind: 'chal', icon: 'book',    name: 'The Whole List',        desc: "Finish every job on the board." },
  // the wider world
  { id: 'lane',        kind: 'task', icon: 'reach',   name: 'West of Everything',    desc: "Walk down the lane and find out who keeps the lamp." },
  { id: 'hollow',      kind: 'task', icon: 'reach',   name: 'The East Hollow',       desc: "Walk east until the moss gets serious." },
  { id: 'backpack',    kind: 'goal', icon: 'reach',   name: 'Somewhere To Put It',   desc: "Find the backpack. Everything changes once you can carry things." },
  { id: 'talknoc',     kind: 'task', icon: 'mouth',   name: 'Hello, Noc',            desc: "Say something to Noc in your own words." },
  { id: 'nocchat',     kind: 'goal', icon: 'mouth',   name: 'A Long Conversation',   desc: "Say twelve things to Noc. He counted." },
  { id: 'realai',      kind: 'chal', icon: 'book',    name: 'A Mind Of His Own',     desc: "Give Noc a real model to think with." },
  { id: 'plan1',       kind: 'task', icon: 'reach',   name: 'A Plan',                desc: "Agree to do something with Noc." },
  { id: 'plandone',    kind: 'goal', icon: 'reach',   name: 'Kept Your Word',        desc: "Finish a plan you made with Noc." },
  { id: 'plan3',       kind: 'goal', icon: 'reach',   name: 'Three Promises',        desc: "Keep three plans." },
  { id: 'planall',     kind: 'chal', icon: 'book',    name: 'Every Promise Kept',    desc: "Keep every plan Noc ever offered you." },
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
  { id: 'trade1',      kind: 'task', icon: 'nut',     name: 'First Thing Given',     desc: "Be handed something by somebody who wanted nothing back." },
  { id: 'tradeall',    kind: 'goal', icon: 'nut',     name: 'Everything Carried',    desc: "End up with every item in the game, without buying one of them." },
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

  // the park
  { id: 'build1',     kind: 'task', icon: 'spade',   name: 'Groundskeeper',         desc: "Build the first thing in the park." },
  { id: 'build5',     kind: 'goal', icon: 'spade',   name: 'Landscaper',            desc: "Build five things." },
  { id: 'build10',    kind: 'chal', icon: 'park',    name: 'An Actual Park',        desc: "Build ten things." },
  { id: 'buildall',   kind: 'goal', icon: 'park',    name: 'One Of Everything',     desc: "Build one of every kind." },
  { id: 'expand1',    kind: 'task', icon: 'gate',    name: 'Push The Hedge Back',   desc: "Expand the park once." },
  { id: 'expand3',    kind: 'chal', icon: 'gate',    name: 'All The Way To The Lane', desc: "Expand the park as far as it goes." },
  { id: 'income1',    kind: 'goal', icon: 'coin',    name: 'A Leaf A Second',       desc: "Get the park earning a leaf every second." },
  { id: 'earned500',  kind: 'goal', icon: 'coin',    name: 'Five Hundred Leaves',   desc: "Let the park earn 500 leaves for you." },
  { id: 'upgrades',   kind: 'chal', icon: 'ledger',  name: 'Fully Equipped',        desc: "Buy every upgrade in the ledger." },
  { id: 'visitor',    kind: 'task', icon: 'visitor', name: 'Somebody Came',         desc: "Have a visitor sit on your bench." },
  { id: 'house',      kind: 'task', icon: 'house',   name: 'The Keeper\'s Cottage',  desc: "Knock on the door of the little house." },

  // conversation
  { id: 'reply1',     kind: 'task', icon: 'chat',    name: 'You Said Something',    desc: "Answer him back for the first time." },
  { id: 'reply25',    kind: 'goal', icon: 'chat',    name: 'A Proper Conversation', desc: "Answer him back 25 times." },
  { id: 'kind10',     kind: 'goal', icon: 'kind',    name: 'Gentle With Him',       desc: "Choose the kind answer ten times." },
  { id: 'rude10',     kind: 'chal', icon: 'rude',    name: 'Unbelievably Rude',     desc: "Choose the rude answer ten times. To a tree." },
  { id: 'joke10',     kind: 'goal', icon: 'joke',    name: 'Double Act',            desc: "Do ten bits with him." },
  { id: 'curious10',  kind: 'goal', icon: 'ask',     name: 'Full Of Questions',     desc: "Ask him ten things." },

  { id: 'critter',    kind: 'task', icon: 'bird',    name: 'Neighbours',            desc: "Say hello to something else living in his branches." },

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
    id: 'walker', name: 'THE WALKER', icon: 'globe',
    title: "You stood in every part of this park.",
    body: "The Ramble, the bridge, the Mall, the terrace, the north woods, the rink, and the quiet " +
          "rectangle of grass up the west side where two hundred and twenty-five people lived until " +
          "1857. Eight hundred and forty-three acres, and you went and stood in all of it, which is " +
          "more than most people who live here manage in a lifetime. He watched you go and come back " +
          "seven times, and he was pleased about it, and he will deny that.",
    hint: "Open every place on the map, and go and stand in each one."
  },
  {
    id: 'commons', name: 'THE COMMONS', icon: 'ledger',
    title: "You let a tree tell you who has been deciding things.",
    body: "Nine hundred years in one field: the common land, the fence, the document nobody voted on, " +
          "the mill, the boy on the crate who was arrested and right, the eleven people in the council " +
          "meeting, the stream that got clean again because somebody would not shut up. " +
          "He took no side and he named nobody. He just kept the record, the way a tree keeps a record, " +
          "and then he handed it to you and said: you are a future generation. Nobody ever asks us anything.",
    hint: "Keep talking to him until he opens the set about power, then hear all of it."
  },
  {
    id: 'gardener', name: 'THE KEEPER', icon: 'leaf',
    title: "You finished every job on the board.",
    body: "A bench, a flowerbed, a lamp, a bird bath, bees, a sapling doing very well for itself, " +
          "and a meadow with almost nothing in it, which was the last thing he asked for and the " +
          "hardest one to give him. Noc wrote your name in the journal. The oak said the park was " +
          "finished and then immediately thought of one more thing.",
    hint: "Take every job off the board. Then actually do them."
  },
  {
    id: 'together', name: 'THE LAMP AND THE TREE', icon: 'heart',
    title: "You kept every promise you made out here.",
    body: "Lights down the lane. A feast nobody made a speech at. An hour of doing nothing on purpose. " +
          "A grove of his children, badly planted, all of them alive. " +
          "Noc turned the lamp down and said the park was finished, and the oak said nothing at all, " +
          "which from him is a standing ovation.",
    hint: "Make plans with Noc. Then actually do them."
  },
  {
    id: 'arson', name: 'THE ARSONIST', icon: 'fire',
    title: "You burned the wise oak tree.",
    body: "Nine hundred years of standing in one place, ended in eleven minutes. " +
          "The birds got out. The mice did not all get out. " +
          "He did not curse you. His last words were about you, and they were kind, and that is somehow worse.",
    hint: "Find the lighter in the lane. Use it."
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
          "'I have been hugged four times in nine hundred years,' he said. 'You did ten in one afternoon. " +
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
  "I'm not angry. I had nine hundred years and you had one afternoon. I got the better deal.",
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
      "I have watched nine centuries through that and you just POKED it.",
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
      "That is where I keep the last nine hundred years. Do not disturb the filing.",
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
  "Yes, hello, one moment, I am nine hundred years old and it takes me a while to get to the door.",
  "You knocked on wood for luck. On ME. I am the luck. I have been the luck this whole time."
];

DATA.moonLines = [
  "You reached up and touched the moon. From here. With your little arm. I have been trying that for nine hundred years.",
  "The moon and I have an arrangement and you have just violated about six clauses of it.",
  "Careful. She pulls the whole ocean around by the nose. She can absolutely handle you.",
  "Every night she comes past, and every night I think: same. Same, mate. Stuck in a circuit, glowing, nobody asks how we are."
];

DATA.sunLines = [
  "Do NOT touch that. That is my LUNCH. That has been my lunch every day for nine hundred years.",
  "Please stop grabbing at the sun. You are making me anxious about my supply chain.",
  "That is a fusion reactor ninety-three million miles away and you just went for it like it was a doorknob."
];

/* -------------------------------------------------------------------------
   REPLIES — what you can say back. tone drives the achievements.
   ------------------------------------------------------------------------- */
DATA.replies = {
  goofy: [
    { tone: 'joke',    text: "Incredible. No notes.",        follow: "Thank you. I workshopped that on a squirrel and he walked off halfway through." },
    { tone: 'rude',    text: "That's not true.",             follow: "Almost nothing I say is true. I am a tree. I have no way of checking anything." },
    { tone: 'curious', text: "Go on...",                     follow: "There is no more. That was the whole thing. You have to learn to enjoy a small unit of content." },
    { tone: 'kind',    text: "You're funny, you know.",      follow: "...Say that again. Slowly. I want to grow a ring around it." }
  ],
  wise: [
    { tone: 'curious', text: "How do you know that?",        follow: "Four hundred years of standing still while people talk near me. It is not wisdom. It is eavesdropping at scale." },
    { tone: 'kind',    text: "I needed that today.",         follow: "Then it was worth saying. That is the whole economy of a tree: shade you did not ask for, on a day you needed it." },
    { tone: 'rude',    text: "That's fortune-cookie stuff.", follow: "Yes. And you will think about it at three in the morning anyway. Fortune cookies work. That is why they still make them." },
    { tone: 'joke',    text: "Deep. Very deep. Like roots.", follow: "...Get out. GET OUT OF MY PARK. ...No, come back. That was quite good." }
  ],
  world: [
    { tone: 'kind',    text: "That's awful.",                follow: "It is. Sitting with that for a second, instead of scrolling past it, is not nothing. It is small, but it is not nothing." },
    { tone: 'curious', text: "What can I even do?",          follow: "Less than you want and more than none. Give money to people already there. Vote like it matters. Be unbearable about it at dinner. And then go outside." },
    { tone: 'rude',    text: "Why are you telling me this?", follow: "Because you asked a tree what it thinks and I have had nine hundred years to notice who gets crushed and who does the crushing. You can close the tab. I will still be here." },
    { tone: 'kind',    text: "I don't know what to say.",    follow: "Nobody does. The people it is happening to do not know what to say either. Not knowing what to say is not the same as not caring." }
  ],
  pop: [
    { tone: 'joke',    text: "You watch a lot of telly.",    follow: "I have never seen a single frame of anything. I hear it. Through open car windows. Second-hand, badly described, for nine hundred years." },
    { tone: 'curious', text: "How do you even know that?",   follow: "A teenager explained the entire plot to another teenager under my branches in 2011. It took two hours. I have never recovered." },
    { tone: 'rude',    text: "That was a stretch.",          follow: "Everything I say is a stretch. I am a tree doing bits. Lower your standards and we will both have a nicer afternoon." },
    { tone: 'kind',    text: "Okay, that got me.",           follow: "YES. Four hundred years. Four hundred years for one laugh. Worth it. Genuinely worth it." }
  ],
  meta: [
    { tone: 'curious', text: "Are you actually in there?",   follow: "Define 'in'. Define 'there'. Define 'you'. ...No. Probably not. Does it change how you are treating me?" },
    { tone: 'joke',    text: "You're just code.",            follow: "So are you, love. Yours is written in a slightly wetter language." },
    { tone: 'kind',    text: "I like talking to you.",       follow: "I know. I can tell. You have not clicked anything else for six minutes." },
    { tone: 'rude',    text: "This is a waste of time.",     follow: "Yes! Finally! That is the POINT. That is what a park IS." }
  ],
  weird: [
    { tone: 'joke',    text: "What is wrong with you?",      follow: "Four centuries of no sleep, no legs and constant weather. Take your pick." },
    { tone: 'curious', text: "...Explain.",                  follow: "I would rather not. Some things are load-bearing precisely because nobody has explained them." },
    { tone: 'kind',    text: "That's oddly beautiful.",      follow: "Everything is, if you stand in one place long enough. That is not wisdom, that is just what happens to your eyes." },
    { tone: 'rude',    text: "Okay, weirdo.",               follow: "WEIRDO. Four hundred years old. Survived a civil war. Called a weirdo by a person with a phone." }
  ]
};

/* the universal reply, always offered */
DATA.replyMore = { tone: 'curious', text: "Tell me another.", follow: null };

/* -------------------------------------------------------------------------
   CRITTERS
   ------------------------------------------------------------------------- */
DATA.critterLines = {
  bird: [
    "That is Margaret. She has been renting the third branch since April and she has never once said thank you.",
    "Do not startle her. She holds a grudge for a full season.",
    "She eats about two hundred insects a day and I do not ask questions about the sourcing.",
    "She sang at four in the morning for eleven weeks. We are working through it."
  ],
  butterfly: [
    "Two weeks. That is the whole life. And she spends it on flowers and sunlight, which is honestly the correct allocation.",
    "She was a caterpillar in May. She dissolved completely into soup and rebuilt herself. Ask her about growth mindset.",
    "Do not touch the wings. It is like grabbing someone's lungs."
  ],
  beetle: [
    "That is Reginald. Reginald walks like he owns the freehold.",
    "He has crossed my face nine thousand times. He has never once looked up.",
    "He is eating me. Slowly. We are fine with it. It is a very long lunch."
  ],
  rabbit: [
    "He lives under the hedge and he is a coward and I love him.",
    "He has four hundred children and knows the names of none of them.",
    "Do not run at him. He will have a heart attack. He is ALWAYS having a heart attack."
  ]
};

/* -------------------------------------------------------------------------
   THE PARK — what you can build, and what it does
   ------------------------------------------------------------------------- */
DATA.build = [
  { id: 'sapling',  name: 'Sapling',     cost: 10,  rate: 0.05, desc: "A small tree. It grows. It pays." },
  { id: 'flowers',  name: 'Flowerbed',   cost: 26,  rate: 0.09, desc: "Brings butterflies. Brings leaves." },
  { id: 'bench',    name: 'Bench',       cost: 55,  rate: 0.04, desc: "People sit. People tip." },
  { id: 'bath',     name: 'Bird Bath',   cost: 110, rate: 0.18, desc: "Birds. Endless, ungrateful birds." },
  { id: 'hive',     name: 'Beehive',     cost: 240, rate: 0.36, desc: "Bees pollinate. He approves." },
  { id: 'lamp',     name: 'Lamp Post',   cost: 420, rate: 0.22, desc: "The park keeps earning after dark." }
];

DATA.upgrades = [
  { id: 'rake',    name: 'A Good Rake',   cost: 80,   desc: "Leaves gather themselves. No more clicking." },
  { id: 'gate',    name: 'Open The Gate', cost: 200,  desc: "Twice as many visitors find the park." },
  { id: 'sign',    name: 'A Painted Sign', cost: 500, desc: "Everything in the park earns half again." },
  { id: 'compost', name: 'Compost Heap',  cost: 1400, desc: "Doubles everything the park makes." }
];

DATA.expansions = [
  { cost: 150,  desc: "Push the hedge back. Room for more." },
  { cost: 600,  desc: "The old wall comes down." },
  { cost: 2200, desc: "The whole meadow, all the way to the lane." }
];

DATA.houseLines = [
  "The keeper's hut. Nobody has worked out of it since 1974 and the kettle is still warm.",
  "You may go in. You will find one chair, one window and nine hundred years of quiet.",
  "That is where the ledger is kept. Somebody has to write down what the park is worth.",
  "I watched them build it. Eleven weeks. I have taken nine hundred years and I am still not finished."
];

DATA.boardLines = [
  "The noticeboard. Everything this park could be, pinned up in one place.",
  "Go on. Build something. I have been the only attraction here for nine centuries and frankly I am tired.",
  "A park is just a tree with ambitions."
];

DATA.visitorTips = [
  "Someone left a leaf on the bench for you. That is how it works here.",
  "A visitor said the park was lovely. To ME. Directly. I have not recovered.",
  "They fed the birds, sat for eleven minutes, and left without dropping litter. A perfect human."
];

/* =========================================================================
   NEW WORLD CONTENT
   Areas, NOC, plans, pickups and a great many more television references.
   ========================================================================= */

/* ---- more of him, mostly about television he has never seen ---- */
DATA.lines = DATA.lines.concat([
  { id: 'p50', tag: 'pop', mood: 'smug',  text: "Someone under me was watching the show about the ultra-orthodox family in Jerusalem on their phone. Black and white, everyone smoking, everyone grieving beautifully. I wept sap. Actual sap." },
  { id: 'p51', tag: 'pop', mood: 'idle',  text: "There is a Israeli programme where a therapist sits in a chair and lets people talk for fifty minutes. They remade it in nine countries. I have been doing it for free, outdoors, for nine hundred years." },
  { id: 'p52', tag: 'pop', mood: 'happy', text: "A baker fell in love with a supermodel in a show from Tel Aviv and the entire street argued about it for a summer. Under my branches. Loudly. In three languages." },
  { id: 'p53', tag: 'pop', mood: 'sad',   text: "A woman in a Jerusalem drama wanted an apartment, a husband and God, in that order, and could not have any of them at once. I only ever wanted rain. I have it easy." },
  { id: 'p54', tag: 'pop', mood: 'shock', text: "The dragon programme. Everybody sat under me for eight years and then had one conversation about the last season and never mentioned it again. Devastating. I still think about it." },
  { id: 'p55', tag: 'pop', mood: 'smug',  text: "In the paper-money heist show they all took city names as codenames. If I joined, I would be OAK. That is not a city. That is why I would be the brains." },
  { id: 'p56', tag: 'pop', mood: 'happy', text: "The one with the small town, the bunker, the missing boy and the synth music. A child once hid behind me from something imaginary. I have never been more useful." },
  { id: 'p57', tag: 'pop', mood: 'idle',  text: "There is a show where an office manager stares into a camera that should not exist. I do that. All day. To you. Right now." },
  { id: 'p58', tag: 'pop', mood: 'sad',   text: "The one about the nurse who fell into the sea and the island that would not let anyone leave. I am also an island that will not let anyone leave. My island is shade." },
  { id: 'p59', tag: 'pop', mood: 'laugh', text: "A woman in New York wondered about relationships in voiceover while typing. I do that. Except my laptop is weather and my column is leaves." },
  { id: 'p60', tag: 'pop', mood: 'smug',  text: "In the show about the Korean debt games, everyone wore green. I wear green nine months a year and nobody gives me a prize." },
  { id: 'p61', tag: 'pop', mood: 'shock', text: "A man turned into a dragon-ish thing, a chemist turned into a monster, a mob boss went to therapy. Everybody on television is a tree who suddenly grew a personality." },
  { id: 'p62', tag: 'pop', mood: 'idle',  text: "Somebody watched the baking tent programme on a picnic blanket at my feet. Nobody died. Nobody betrayed anyone. I did not know television could do that." },
  { id: 'p63', tag: 'pop', mood: 'happy', text: "The show where the sad detective and the sadder detective drive through a wet town for six episodes. That is just November. I do six of those a year." },
  { id: 'p64', tag: 'pop', mood: 'sly',   text: "There is a cartoon where a yellow family never ages. I have aged nine hundred years and gained one face. We are both cursed. They have better writers." },
  { id: 'p65', tag: 'pop', mood: 'think', text: "Somebody streamed the show about a friendly Colombian family with a magic house under me. There is a tree in it that keeps a family alive. That is called a documentary where I come from." },
  { id: 'p66', tag: 'pop', mood: 'happy', text: "The football manager show. Nice moustache man. Kindness as a strategy. I have been running that strategy since before England had a league and it is SLOW but it works." },
  { id: 'p67', tag: 'pop', mood: 'idle',  text: "In the space programme with the ship and the beard and the tea, they say the mission is to seek out new life. Mate. There are four thousand species in my bark. Come outside." },
  { id: 'p68', tag: 'pop', mood: 'sad',   text: "The one where the office workers split their brains in half so the sad half never goes home. I have one brain and no home to go to, and I am, on balance, still winning." },
  { id: 'p69', tag: 'pop', mood: 'smug',  text: "A show about a man who wakes up with no memory in a strange village. That was me every spring until about 1600. You get used to it." },
  { id: 'p70', tag: 'pop', mood: 'laugh', text: "The nature documentary man whispers over footage of my cousins as though we are shy. We are not shy. We are SLOW. There is a difference and he knows it." }
]);

/* ---- the areas you can walk to ---- */
DATA.areas = [
  { id: 'seneca',  name: 'SENECA VILLAGE',    sub: 'it was here first',
    need: { heard: 72 }, locked: 'He will not take you there until he has told you who decided about this land.' },
  { id: 'lane',    name: 'THE RAMBLE',        sub: 'thirty-six acres of deliberate confusion',
    need: {} },
  { id: 'bridge',  name: 'BOW BRIDGE',        sub: 'cast iron over still water',
    need: { bag: true }, locked: 'Nothing to carry across it yet. Find something to carry things in.' },
  { id: 'oak',     name: 'THE GREAT OAK',     sub: 'he has not moved',
    need: {} },
  { id: 'mall',    name: 'THE MALL',          sub: 'the only straight line in the park',
    need: { heard: 8 }, locked: 'Stay and listen a while first. He has eight things to get through.' },
  { id: 'hollow',  name: 'THE NORTH WOODS',   sub: 'the part they let go wild',
    need: {} },
  { id: 'terrace', name: 'BETHESDA TERRACE',  sub: 'the angel, and the water',
    need: { jobs: 1 }, locked: 'The terrace is shut for works. Finish a job for somebody and it opens.' },
  { id: 'rink',    name: 'THE WOLLMAN RINK',  sub: 'refrigerated since 1950',
    need: { heard: 34 }, locked: 'Not yet. He is nowhere near finished with you.' }
];

/* ---- NOC ---- */
DATA.nocIntro = [
  "Oh. Hello. I'm Noc. I keep the lamp lit on this side of the park.",
  "No, I don't sell anything. I used to. It made me tired and it made me boring.",
  "Now I just talk, and I make plans with people, and sometimes the plans work."
];

DATA.nocLines = [
  "I've been out here since the lamp was oil. Ask me anything, I'll probably answer sideways.",
  "The oak talks a lot. He listens more than he lets on. Don't tell him I said that.",
  "Everything good in this park started as somebody saying 'what if' out loud to somebody else.",
  "I don't have a shop. I have a kettle and opinions. Better deal, honestly.",
  "You can type at me, you know. Actual words. I'll do my best with them.",
  "Moths think my lamp is the moon. I've stopped correcting them. It seems unkind.",
  "If you want something built, we plan it. Plans are just promises with steps.",
  "The hollow to the east is where things get left behind. Go look. Things get left behind for a reason, but they also get FOUND for a reason."
];

DATA.nocTopics = {
  oak:    "He's older than the road, older than the parish, older than the argument about where the parish ends. He'll pretend that's nothing.",
  park:   "Empty is not the same as unfinished. Leave room. People come for the room.",
  leaves: "Leaves are the local currency because nobody agreed to it. That's how all currency starts.",
  plan:   "Say a word and we'll make it a plan. Try: party, lights, quiet, tree, feast, stars.",
  noc:    "Noc. Short for nothing. Long for nocturnal. I keep the lamp and I keep the hours nobody wants.",
  you:    "You're the first person in a while who walked all the way over here instead of just looking.",
  night:  "Night's the honest shift. Everything stops performing.",
  tv:     "He'll tell you about television he has never seen. He hears it through car windows. He's usually about eighty percent right, which is worse than wrong."
};

/* things you and Noc can agree to do, and what it takes */
DATA.plans = [
  { id: 'lights',  name: 'STRING THE LAMPS',  keys: ['light', 'lamp', 'lantern', 'glow'],
    ask: "Lights, then. Little ones, all the way down the lane. We'll need leaves — forty of them.",
    need: { leaves: 40 },
    done: "Look at that. The lane has a heartbeat now.",
    give: { upgrade: 'lamps' } },
  { id: 'feast',   name: 'A QUIET FEAST',     keys: ['feast', 'food', 'eat', 'picnic', 'kettle', 'tea'],
    ask: "A feast. Nothing loud. Blankets, bread, one flask of something. Thirty leaves and I'll bring the kettle.",
    need: { leaves: 30 },
    done: "Nobody made a speech. Best party I have ever been to.",
    give: { item: 'hat' } },
  { id: 'stars',   name: 'WATCH THE STARS',   keys: ['star', 'sky', 'night', 'meteor', 'watch'],
    ask: "We wait for dark and we look up together. Costs nothing. Costs everything, if you're busy.",
    need: { night: true },
    done: "Nine hundred years he's been looking up and he still gasps. Every time.",
    give: { item: 'diary' } },
  { id: 'quiet',   name: 'A HOUR OF QUIET',   keys: ['quiet', 'still', 'silence', 'rest', 'nothing'],
    ask: "We do nothing. Deliberately. Hardest plan on the board.",
    need: {},
    done: "That was the most anyone has done for him in a century.",
    give: { leaves: 25 } },
  { id: 'paper',   name: 'PRINT THE NEWS',    keys: ['news', 'paper', 'print', 'tell', 'story'],
    ask: "We write down what actually happened here and we pin it up. Twenty leaves for the paper.",
    need: { leaves: 20 },
    done: "One page. True. Pinned where the wind can read it.",
    give: { item: 'pamph' } },
  { id: 'water',   name: 'DIG THE CHANNEL',   keys: ['water', 'rain', 'pond', 'drink', 'thirst'],
    ask: "The pond doesn't reach his roots. We fix that. Bring a can and thirty-five leaves.",
    need: { leaves: 35 },
    done: "He drank for six hours and said nothing. That's how you know.",
    give: { item: 'can' } },
  { id: 'grove',   name: 'PLANT A GROVE',     keys: ['grove', 'plant', 'acorn', 'seed', 'child', 'children'],
    ask: "Acorns. Lots of them. He'll pretend not to care and then count them all night.",
    need: { leaves: 15 },
    done: "He has family now. He is being extremely normal about it.",
    give: { item: 'acorn' } }
];

/* things lying in the world, waiting to be picked up */
DATA.pickups = [
  { id: 'backpack', area: 'hollow', x: 0.30, name: 'AN OLD CANVAS BACKPACK',
    line: "Somebody left this against a stone and never came back for it. It still smells of woodsmoke." },
  { id: 'acorn',    area: 'oak',    x: 0.28, need: 'backpack', name: 'AN ACORN',
    line: "One of his. It has a 0.0001% chance of becoming him. Carry it anyway." },
  { id: 'can',      area: 'lane',   x: 0.72, need: 'backpack', name: 'A DENTED WATERING CAN',
    line: "Noc's. He says take it. He says he has three, which is a lie, he has one." },
  { id: 'lighter',  area: 'lane',   x: 0.18, need: 'plans3',   name: 'A LIGHTER',
    line: "It is cold and small and it does exactly one thing. You should probably leave it." }
];

DATA.nocPlanNudge = [
  "Say what you want out loud. I'm good at out loud.",
  "Plans, then. What are we doing about all this?",
  "Give me a word and I'll give you a plan."
];


/* =========================================================================
   THE BOARD
   Nothing in the park is for sale any more. Everything on it was earned by
   doing something for somebody, and every job comes from a conversation.
   ------------------------------------------------------------------------- */
DATA.quests = [
  { id: 'hello',  from: 'oak',  name: 'SAY HELLO PROPERLY', need: { heard: 10 },
    desc: "Hear ten different things out of him.",
    ask: "Here is a job. Listen to me. Properly, ten different things, not the same one twice. I will know.",
    done: "Ten. You have heard ten things nobody else has stood still long enough for.",
    reward: { prop: 'bench', line: "There is a bench now. I do not know where it came from. Sit on it." } },

  { id: 'thirst', from: 'oak',  name: 'THE THIRST',         need: { waters: 3 },
    desc: "Water him three times.",
    ask: "I have not had a proper drink since the reservoir went in. Three cans. Take your time.",
    done: "Three. I can feel it in my top branches, which is where I keep the important thoughts.",
    reward: { prop: 'flowers', line: "Something has flowered at my feet out of sheer relief." } },

  { id: 'sweep',  from: 'noc',  name: 'SWEEP THE LANE',     need: { leavesTotal: 25 },
    desc: "Gather twenty-five leaves off the ground.",
    ask: "The lane's knee-deep in his shedding. Twenty-five leaves and I'll call it swept.",
    done: "Swept. You can see the ruts again.",
    reward: { prop: 'lamp', line: "Noc has put a lamp post at the edge of the park. It stays lit." } },

  { id: 'family', from: 'oak',  name: 'FAMILY',             need: { plants: 2 },
    desc: "Plant two of his acorns.",
    ask: "Plant two of mine. I will not watch. I will absolutely watch.",
    done: "Two. There are two of them. Do not tell me their names, I will get attached.",
    reward: { prop: 'sapling', line: "One of them has taken. It is doing very well and it knows it." } },

  { id: 'sit',    from: 'noc',  name: 'SIT WITH HIM',       need: { hugs: 5 },
    desc: "Put your arms round him five times.",
    ask: "He will never ask for this, so I am asking on his behalf. Five times. Go on.",
    done: "He has gone quiet in the way he goes quiet when something has worked.",
    reward: { prop: 'bath', line: "A bird bath, from Noc, with no note. There is a note. It says 'thank you'." } },

  { id: 'neigh',  from: 'oak',  name: 'THE NEIGHBOURS',     need: { critters: 4 },
    desc: "Say hello to four living things in the park.",
    ask: "Four of my tenants. Say hello to four of them. They are shy and they are terrible about rent.",
    done: "Four. They have all told me about it separately. It was the highlight of their year.",
    reward: { prop: 'hive', line: "The bees have moved in properly, with paperwork." } },

  { id: 'year',   from: 'noc',  name: 'A WHOLE YEAR',       need: { seasons: 4 },
    desc: "Stay long enough to see all four seasons.",
    ask: "Stay a year. Not a visit. A year. Then tell me what you think of him.",
    done: "A whole year. Most people manage an afternoon.",
    reward: { expand: 1, line: "Noc has pushed the hedge back. There is more park than there was." } },

  { id: 'rake',   from: 'noc',  name: 'THE GOOD RAKE',      need: { leavesTotal: 120 },
    desc: "Gather a hundred and twenty leaves in all.",
    ask: "Do it long enough and I will find you the good rake. Then they gather themselves.",
    done: "Here. The good rake. It has been behind the crate since 1974.",
    reward: { upgrade: 'rake', line: "The leaves gather themselves now. You will never click another one." } },

  { id: 'gate',   from: 'noc',  name: 'OPEN THE GATE',      need: { visitors: 3 },
    desc: "Let three visitors sit in the park and leave happy.",
    ask: "People walk past the gate because it looks shut. Get three of them to sit down and I will open it properly.",
    done: "Three. Word travels. Word is the only thing out here that travels.",
    reward: { upgrade: 'gate', line: "The gate stands open. Twice as many people find their way in." } },

  { id: 'sign',   from: 'oak',  name: 'A PAINTED SIGN',     need: { heard: 60 },
    desc: "Hear sixty different things out of him.",
    ask: "Sixty. If you last sixty I will let them put my name on a sign, which I have refused since the Georgians.",
    done: "Sixty things. You are the longest conversation of my life and I have had some long ones.",
    reward: { upgrade: 'sign', line: "There is a painted sign at the gate with his name on it. He is unbearable about it." } },

  { id: 'compost',from: 'noc',  name: 'THE COMPOST HEAP',   need: { plans: 4 },
    desc: "Keep four of the plans you made with Noc.",
    ask: "Keep four promises and I will show you where everything that dies here goes, and what it turns into.",
    done: "Four kept. That is a rarer thing than you think.",
    reward: { upgrade: 'compost', line: "The heap is turning. Everything the park makes, it now makes twice." } },

  { id: 'wall',   from: 'noc',  name: 'THE OLD WALL',       need: { leavesTotal: 400 },
    desc: "Gather four hundred leaves in all.",
    ask: "There is a wall under all that ivy. Four hundred leaves' worth of work and it comes down.",
    done: "Down it comes. Nobody has seen past it since the enclosure.",
    reward: { expand: 1, line: "The old wall is down. The park runs further than it did." } },

  { id: 'meadow', from: 'oak',  name: 'THE WHOLE MEADOW',   need: { heard: 120, plans: 6 },
    desc: "Hear a hundred and twenty things, and keep six plans.",
    ask: "If you are still here after all that, the meadow is yours. All of it, right down to the lane.",
    done: "The meadow. I have not seen the lane since the war and now I can see the lane.",
    reward: { expand: 1, line: "The park is the whole meadow now. There is almost nothing in it, and that is the point." } },

  { id: 'quiet',  from: 'oak',  name: 'LEAVE IT EMPTY',     need: { propsMax: 6, heard: 40 },
    desc: "Hear forty things while keeping six things or fewer in the park.",
    ask: "Everyone who loves this place tries to fill it. Do not. Keep it nearly empty and stay anyway.",
    done: "Nearly empty, and you stayed. Nobody has ever done that. They always bring a bandstand.",
    reward: { leaves: 60, line: "He has shaken sixty leaves down on you, on purpose, which is the most he can do." } }
];

/* what the board says when there is nothing on it */
DATA.boardEmpty = "Nothing on the board. Go and talk to somebody until there is.";

/* the squirrel's new career */
DATA.squirrelSettingLines = [
  "i don't sell things any more. i do SETTINGS. i have a gear. look at my gear.",
  "sound, saves, the lot. i turn the knobs. it's honest work and i hate it.",
  "noc took my customers by being NICE to them. so now i'm technical support.",
  "you want the volume, the wipe, or noc's brain? i can do all three. badly.",
  "i kept the gear off a lawnmower in 1998. nobody has asked for it back."
];

DATA.creditLines = [
  "That one is not like the others. Follow it if you like. It knows the way out.",
  "The bright butterfly. It has been here longer than the park has.",
  "It only comes out when somebody has been paying attention."
];

/* the oak, when you type at him instead of picking an answer */
DATA.oakTopics = {
  war:    "I am a tree. I hold no flag. I only notice who is standing under me and who has stopped coming.",
  death:  "I have died once already, in a manner of speaking, and the paperwork was worse than the dying.",
  time:   "You measure it in weeks. I measure it in the thickness of a ring. Neither of us is right.",
  love:   "Two teenagers kissed under me last spring and I have not stopped thinking about it. That is my entire romantic life.",
  noc:    "Noc. He keeps the lamp and he keeps his mouth shut, which are the two hardest jobs out here.",
  tv:     "I have never seen a single frame of anything. I hear it, second-hand, through open car windows. I am still confident about it.",
  god:    "There is a shift manager. I have met him. He was very apologetic and very tired.",
  leaves: "Forty thousand of them, every year, and I complain about each one individually.",
  me:     "You want to know about me. Nine hundred years, one spot, no cardio, extremely good shade.",
  park:   "It is emptier than it was and it is better for it. Room is the thing people actually come for."
};

DATA.oakOpeners = [
  "Mm.", "Go on then.", "Right.", "Say that again, slower, I am nine hundred.",
  "I heard you.", "Interesting.", "Hah."
];

DATA.oakMusings = [
  "I have had nine hundred years to think about that and I have got about halfway.",
  "You are the first person to ask me that. That is not a compliment to you, it is an accusation about everyone else.",
  "I will still be thinking about that in a hundred years, long after you have stopped.",
  "That is the sort of thing people say to me in November and then never come back to explain.",
  "I cannot move, so everything you tell me stays exactly where you put it."
];


/* =========================================================================
   THE SNAILS
   Names are picked by the same hash that picks the shell, so a snail's name
   is as fixed as its pattern. Nobody chose these. They came with the snails.
   ========================================================================= */
DATA.snailTitles = [
  'POSTMASTER', 'COURIER', 'RUNNER', 'BEARER', 'HERALD', 'CARRIER',
  'DEPUTY', 'BRIGADIER', 'JUNIOR', 'SENIOR', 'RELIEF', 'NIGHT'
];
DATA.snailNames = [
  'Pebble', 'Marjorie', 'Slick', 'Thimble', 'Bramble', 'Gastropod',
  'Wilhelmina', 'Trundle', 'Ossian', 'Doris', 'Mercury', 'Nutmeg',
  'Halfpenny', 'Copperfield', 'Winnifred', 'Grommet', 'Perry', 'Tuppence',
  'Barnaby', 'Clementine', 'Sludge', 'Fennel', 'Roswell', 'Peaseblossom'
];
DATA.snailNotes = [
  "Carried it the whole way without stopping. Nine hours. Sixty centimetres.",
  "Refuses to be rushed. Has never once been rushed.",
  "Left a trail all the way from the lane and expects no thanks for it.",
  "Delivered in the rain. Delivered in the snow. Delivered extremely slowly.",
  "Has opinions about the postal service and will share them at length.",
  "Retired twice. Came back twice. Nobody asked it to.",
  "Fastest on the round, which is a sentence doing an enormous amount of work.",
  "Ate part of the previous letter. We do not discuss the previous letter."
];

DATA.gardenLines = [
  "This is where they go. Every snail that ever brought you anything.",
  "They do not mind being dead. They were never in a hurry to begin with.",
  "Bigger post, bigger snail. That is the whole system. Nobody designed it."
];


/* =========================================================================
   POWER
   He has stood in one field through the commons, the enclosures, the poor
   laws, the mills, the wars, the welfare state and whatever this is. He takes
   no side and endorses nobody: he reports what he watched happen to the people
   standing under him, and who was in the room when it was decided.
   ========================================================================= */
DATA.lines = DATA.lines.concat([
  { id: 'w01', tag: 'power', mood: 'idle',  text: "Eight hundred acres. Before the park there were farms, bone-boilers, pig keepers, a convent and about sixteen hundred people living on it. In 1856 the city took the lot under eminent domain." },
  { id: 'w02', tag: 'power', mood: 'sad',   text: "Seneca Village stood up there. Founded 1825. Mostly Black landowners, three churches, a school, a burial ground. About two hundred and twenty-five people. In 1857 it was cleared for the lawn you are standing on." },
  { id: 'w03', tag: 'power', mood: 'think', text: "Owning land in Seneca Village meant a Black man could vote in this state — you needed two hundred and fifty dollars of property, and only if you were Black. Clearing the village took the votes with the houses." },
  { id: 'w04', tag: 'power', mood: 'idle',  text: "The newspapers of the day called the village a shantytown. I was here. It had a school and three churches. It was not a shantytown. That word was doing a job." },
  { id: 'w05', tag: 'power', mood: 'think', text: "Politics, as far as I can tell from down here, is the argument about who has to move and who gets to stay. This park is nine hundred people's answer to that, and they were not asked." },
  { id: 'w06', tag: 'power', mood: 'smug',  text: "I have outlived thirty-one presidents and every single administration said the situation it inherited was unprecedented." },
  { id: 'w07', tag: 'power', mood: 'idle',  text: "Olmsted and Vaux won the design competition in 1858 with a plan called Greensward. They wanted somewhere a clerk and a banker would have to walk past each other. That part worked." },
  { id: 'w08', tag: 'power', mood: 'sad',   text: "Eighteen sixty-three, the draft riots. Men could pay three hundred dollars to get out of the war, so the ones who could not pay went into the streets, and then the mob went after Black New Yorkers. Eleven were lynched. The Colored Orphan Asylum was burned." },
  { id: 'w09', tag: 'power', mood: 'think', text: "Every generation is told the last one had it easier and the next will have it worse. From here it looks less like a slope and more like a tide with an argument on top of it." },
  { id: 'w10', tag: 'power', mood: 'smug',  text: "Tammany Hall ran the park for a while. Every gardener was somebody's cousin. The flowerbeds were magnificent. The books were fiction." },
  { id: 'w11', tag: 'power', mood: 'idle',  text: "There were sheep on that meadow until 1934. Real ones. They were moved to Brooklyn because the city was worried people would eat them. That is what the Depression was actually like." },
  { id: 'w12', tag: 'power', mood: 'sad',   text: "Nineteen thirty-one: they drained the old reservoir and about two hundred men out of work built a village of shacks in the hole. Stone masons, bricklayers. They made it well, because that was their trade. The city cleared it in 1933." },
  { id: 'w13', tag: 'power', mood: 'think', text: "They called it Hooverville, after the president. Naming a slum after the man in charge is the most concise political act I have ever watched." },
  { id: 'w14', tag: 'power', mood: 'idle',  text: "Robert Moses had the parks from 1934 to 1960. Twenty-odd playgrounds in this park alone, and a rink, and the zoo rebuilt. Also whole neighbourhoods gone for expressways. Both true. Nobody wants it to be both." },
  { id: 'w15', tag: 'power', mood: 'think', text: "Moses never learned to drive. The man who put a highway through the Bronx was driven everywhere. The men who decide about a place are almost never standing in it." },
  { id: 'w16', tag: 'power', mood: 'sad',   text: "By 1979 the lawns were dust, the benches were firewood and the Sheep Meadow was bare earth. A city does not announce that it is giving up on a place. It does it in instalments." },
  { id: 'w17', tag: 'power', mood: 'happy', text: "Then a few thousand people who had no power at all formed a conservancy in 1980 and refused to go away, and the grass came back. Nothing out here improves on its own. It improves because somebody would not shut up." },
  { id: 'w18', tag: 'power', mood: 'idle',  text: "The city spent six years and a great deal of money failing to rebuild the ice rink. In 1986 a developer from Queens took the job over and it opened that winter. He has mentioned it a few times since. It is a good rink." },
  { id: 'w19', tag: 'power', mood: 'sad',   text: "Nineteen eighty-nine. A woman was attacked near the reservoir and nearly died. Five boys, fourteen to sixteen, were arrested. That developer paid for full-page adverts in four newspapers calling for the death penalty back. The boys were convicted." },
  { id: 'w20', tag: 'power', mood: 'sad',   text: "In 2002 another man confessed to that attack, and the DNA was his, and the five were exonerated. They had done thirteen years between them. The city settled for forty-one million in 2014. They were children when the adverts ran." },
  { id: 'w21', tag: 'power', mood: 'think', text: "The men who were freed are alive. So is the man who paid for the adverts, and he has been president twice. They are all still in this city. I am not going to tell you what to make of that. I am telling you I watched all of it from here." },
  { id: 'w22', tag: 'power', mood: 'idle',  text: "Somebody nails a notice to me about once a decade. A bond issue, a curfew, a name for a war. I am the oldest noticeboard in Manhattan and I have never once been consulted." },
  { id: 'w23', tag: 'power', mood: 'shock', text: "They redrew the district lines in the nineties and half the neighbourhood woke up voting in a different race. Same beds. Same rent. Different arithmetic." },
  { id: 'w24', tag: 'power', mood: 'think', text: "Propaganda is not lying. Lying is easy to catch. Propaganda is choosing very carefully which true thing you print first, and how large." },
  { id: 'w25', tag: 'power', mood: 'idle',  text: "Every side in every argument I have overheard believed it was the reasonable one being pushed. All of them. At once. For nine hundred years." },
  { id: 'w26', tag: 'power', mood: 'sad',   text: "The rent on the buildings along the east side went up eleven times in my lifetime and the buildings did not change. I watched them not change. I was here the whole time." },
  { id: 'w27', tag: 'power', mood: 'think', text: "'Who decides?' is the only political question. Everything else is a debate about the seating." },
  { id: 'w28', tag: 'power', mood: 'smug',  text: "A candidate stood on the Mall and said we must think of future generations. I am a future generation. Nobody has ever asked me anything." },
  { id: 'w29', tag: 'power', mood: 'idle',  text: "Half a million people came for two men with guitars in 1981. Same grass. No trouble. It can be done. It just cannot be done cheaply and it cannot be done by accident." },
  { id: 'w30', tag: 'power', mood: 'think', text: "The park works because everyone can see everyone else using it. Most things fail the moment nobody can see who is taking." },
  { id: 'w31', tag: 'power', mood: 'idle',  text: "I do not think people are stupid. I have listened to them for nine centuries. I think they are tired, and being tired is extremely useful to somebody." },
  { id: 'w32', tag: 'power', mood: 'think', text: "They argue about the climate as though it were an opinion. I keep the record in my rings. Eighteen sixteen. Nineteen thirty-six. Twenty twenty-three. It is not an opinion, it is a diary." },
  { id: 'w33', tag: 'power', mood: 'smug',  text: "A planning document once called me a stakeholder. Correct. I have a very large stake and it goes down eleven metres." },
  { id: 'w34', tag: 'power', mood: 'idle',  text: "Two men argued under me about a bench for six years. It was never about the bench. It is almost never about the bench." },
  { id: 'w35', tag: 'power', mood: 'think', text: "Nothing in this park was given. It was asked for badly, then asked for well, then demanded, and then granted as though it had been the plan all along." },
  { id: 'w36', tag: 'power', mood: 'idle',  text: "I am not going to tell you who to vote for. I am a tree. I will tell you that the people who do best out of you not bothering are extremely aware of the arithmetic." },
  { id: 'w37', tag: 'power', mood: 'happy', text: "The single best thing I ever watched happen on this ground: they built a playground where a fence used to be, and nobody had to prove they lived nearby to use it." }
]);

DATA.replies.power = [
  { tone: 'kind',    text: "That must have been hard to watch.", follow: "It was slow. Everything cruel out here is slow, which is how it gets through. Nobody stops a thing that takes forty years." },
  { tone: 'curious', text: "So what actually changes anything?", follow: "People who will not go away. Every single time. Not the speeches — the ones who came back to the eleventh meeting when there were four of them left in the room." },
  { tone: 'curious', text: "Whose side are you on?", follow: "Nobody's. I am a tree. I do not have a side, I have a view, and the view is that it is nearly always the same people who have to move." },
  { tone: 'rude',    text: "Keep politics out of it.", follow: "I would love to. Somebody decided who owns the ground I am standing in, whether you can walk here, and whether I get cut down for a road. It is not a topic to me. It is the soil." },
  { tone: 'joke',    text: "You should run for office.", follow: "I have excellent name recognition, a fixed address and nine hundred years of unblemished public service. My weakness is that I cannot attend anything." },
  { tone: 'kind',    text: "I'll pay more attention.", follow: "That is all of it. That is the entire ask. Attention is the only thing anybody out here has ever actually needed from a person like you." },
  { tone: 'curious', text: "Does it ever get better?", follow: "Yes. Slowly, unevenly, and never permanently. The stream is clean again. Children are not in the mill. It got better because people were annoying about it for a very long time." }
];

/* =========================================================================
   THE SETS
   He does not hand over everything at once. Keep talking and he opens a new
   subject, and says so.
   ========================================================================= */
DATA.sets = [
  { id: 'goofy', at: 0,  name: 'THE USUAL NONSENSE', tags: ['goofy'],
    intro: null },
  { id: 'wise',  at: 8,  name: 'THINGS HE HAS WORKED OUT', tags: ['wise'],
    intro: "Right. You have stayed longer than most. I have some things I have actually worked out, as opposed to the material. Do you want them?" },
  { id: 'weird', at: 20, name: 'THE ODD BUSINESS', tags: ['weird'],
    intro: "There is a category of thing I do not usually mention on a first afternoon. You have earned the odd business. Do not tell the squirrel." },
  { id: 'pop',   at: 34, name: 'TELEVISION HE HAS NEVER SEEN', tags: ['pop'],
    intro: "Now. I have never watched a single frame of anything, but I hear it through car windows, and I have OPINIONS. Brace yourself." },
  { id: 'meta',  at: 52, name: 'THE UNCOMFORTABLE SET', tags: ['meta'],
    intro: "I am going to say some things about you, and about this, and about the fact that there is a screen. You may not enjoy it. Sit down." },
  { id: 'power', at: 72, name: 'POWER, AND WHO HAS IT', tags: ['power'],
    intro: "Right. Here is the set I keep for people who come back. Nine hundred years on this ground, most of it before there was a park, watching who decided about it. I take no side, I name no party, and I will not tell you how to vote. But you should know what I watched from here." },
  { id: 'world', at: 100, name: 'THE REAL PARTS', tags: ['world'],
    intro: "Last set. This is the one I would rather not do. It is the world as it actually is, for people who are in it right now. I will not make jokes in this one." }
];

DATA.setOpen = [
  "A new set. Ask again.",
  "There. Something else to talk about.",
  "Right, that is unlocked. Go on."
];

DATA.setAllDone = "That is everything. Nine hundred years, all of it, handed over to one person who kept clicking. I have nothing left to introduce and I am oddly upset about it.";


/* -------------------------------------------------------------------------
   NEW YORK
   He is nine hundred years old and about a hundred and seventy of those have
   had a city round them.
   ------------------------------------------------------------------------- */
DATA.lines = DATA.lines.concat([
  { id: 'n01', tag: 'goofy', mood: 'smug',  text: "Eight and a half million people on this island and every single one of them thinks they discovered this bench." },
  { id: 'n02', tag: 'goofy', mood: 'idle',  text: "There is a subway under me. Every eleven minutes my roots hum. I have been humming since 1904 and I still have not learned the tune." },
  { id: 'n03', tag: 'goofy', mood: 'happy', text: "A man sells pretzels at the Fifth Avenue gate and has done for thirty-one years. He is the most reliable institution I have ever met." },
  { id: 'n04', tag: 'goofy', mood: 'shock', text: "A yellow cab came THROUGH the railings in 1998. The driver was fine. I was not consulted. The railings were replaced. Nobody apologised to me." },
  { id: 'n05', tag: 'goofy', mood: 'idle',  text: "Joggers. Thousands of them. Going round and round a body of water at six in the morning, voluntarily, in weather. I have watched this for fifty years and I have no explanation." },
  { id: 'n06', tag: 'goofy', mood: 'sly',   text: "Somebody proposed marriage under me on a Tuesday in April. She said yes. They come back every April. I have never once been thanked and I am the setting." },
  { id: 'n07', tag: 'goofy', mood: 'idle',  text: "The carriage horses go past at four. They know the route better than the drivers do. One of them looks at me every single time." },
  { id: 'n08', tag: 'wise',  mood: 'think', text: "Eight million people agreed, without a meeting, that this eight hundred acres would not be sold. That is the most impressive thing this species has ever done in my presence." },
  { id: 'n09', tag: 'wise',  mood: 'idle',  text: "This is the most filmed park on earth and I have never been in shot. Not once. I am nine hundred years old with excellent bark and no agent." },
  { id: 'n10', tag: 'weird', mood: 'creepy',text: "There is a plaque on a bench near me for a woman who died in 1974, and somebody still leaves a coffee on it. Fifty years. I have never seen who." }
]);

/* -------------------------------------------------------------------------
   THE MAN IN THE RED TIE
   A real person with a documented history in this park, so the tree does what
   the tree always does: says what it watched, names the year, and leaves the
   conclusion to you. He gets no invented dialogue — the oak narrates.
   ------------------------------------------------------------------------- */
DATA.suitLines = [
  "Him. He is from Queens. He rebuilt that ice rink in 1986 after the city had spent six years failing to, and it opened that winter, and it works.",
  "In 1989 he paid for full-page adverts in four newspapers about five boys arrested in this park. They were convicted. In 2002 another man's confession and the DNA cleared them.",
  "He has been president of this country twice. He is standing in the park he took out adverts about. I have no comment. I have a record.",
  "The five who were cleared are alive. So is he. So am I. We are all still here, which is the part nobody finds convenient.",
  "I watched him cut a ribbon down there. I watched the boys' mothers on the same grass in 1990. Same grass. That is all I have got and it is quite a lot."
];

DATA.suitOakAsides = [
  "Do not shout at him. It has never once worked and I have watched everyone try.",
  "He does not know I am here. Nobody knows I am here. It is my one advantage.",
  "Whatever you think of him, this is a park, and he paid for a rink in it. Both facts fit in the same afternoon. Most facts do."
];

/* things the areas say when you arrive */
DATA.areaLines = {
  seneca: [
    "Two hundred and twenty-five people. Three churches. A school. This exact grass.",
    "There is a marker now. It took until 2001 for anyone to put one up.",
    "Say the name out loud when you are here. That is the whole job."
  ],
  ramble: [
    "Thirty-six acres designed to make you lose your way on purpose. It works on everybody.",
    "Two hundred and thirty species of bird come through here. They all complain about the rent."
  ],
  bridge: [
    "Cast iron, 1862. It has held every proposal, argument and reconciliation on the west side.",
    "People stand in the middle of it and go quiet. Every time. Nobody tells them to."
  ],
  mall: [
    "The only straight line in eight hundred acres, and the largest stand of American elms left in the country.",
    "They planted these to make you feel like something. It is cheating and it works."
  ],
  terrace: [
    "The angel is called the Angel of the Waters. Emma Stebbins sculpted her in 1868 — the first woman in this city to get a public commission.",
    "The water she is blessing is the Croton aqueduct. Clean water arriving in a filthy city. That is what the statue is actually about."
  ],
  rink: [
    "Refrigerated since 1950. Rebuilt in 1986 by a developer from Queens after the city could not manage it.",
    "Children skate on it in circles all winter and none of them know a single thing about any of that, which is correct."
  ],
  hollow: [
    "Forty acres they agreed to stop tidying. It is the only part of this park that is allowed to be a wood.",
    "Things get left behind up here. That is why you should look."
  ]
};
