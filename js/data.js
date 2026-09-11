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
  { id: 'g01', tag: 'goofy', mood: 'happy', text: "I'm nine hundred years old and I've never once had to look for a parking space." },
  { id: 'g02', tag: 'goofy', mood: 'smug',  text: "People tell each other to touch grass. Touch bark instead. Grass runs away every winter." },
  { id: 'g03', tag: 'goofy', mood: 'idle',  text: "A woodpecker lives in my elbow. He pays no rent. We're roommates." },
  { id: 'g04', tag: 'goofy', mood: 'shock', text: "Don't look up. There's a squirrel doing something odd with a walnut." },
  { id: 'g05', tag: 'goofy', mood: 'happy', text: "My branches are strong. Two children tested that. They were fine. I wasn't." },
  { id: 'g06', tag: 'goofy', mood: 'idle',  text: "I've been in this exact spot since 1140, so no, I don't get a lot of exercise." },
  { id: 'g07', tag: 'goofy', mood: 'smug',  text: "I invented shade. I can't prove that, but I'm fairly sure about it." },
  { id: 'g08', tag: 'goofy', mood: 'sad',   text: "A dog claims me every Tuesday. I treat it like weather." },
  { id: 'g09', tag: 'goofy', mood: 'happy', text: "In autumn I take everything off, very slowly, over about six weeks. It's quite a performance." },
  { id: 'g10', tag: 'goofy', mood: 'idle',  text: "Someone carved DAVE WAS HERE into me in 1987. Dave, I'm still here. Where are you?" },
  { id: 'g11', tag: 'goofy', mood: 'shock', text: "AAH- sorry. A beetle walked over my face. He walks like he owns it." },
  { id: 'g12', tag: 'goofy', mood: 'smug',  text: "About one acorn in a million turns into a tree, so my children are a bit of a joke. I love them anyway." },
  { id: 'g13', tag: 'goofy', mood: 'idle',  text: "I tried meditating once and it turned out to just be what I already do. So I'm very calm and very bored." },
  { id: 'g14', tag: 'goofy', mood: 'happy', text: "Two teenagers kissed under me in spring. I think about it constantly. It was nice." },
  { id: 'g15', tag: 'goofy', mood: 'sad',   text: "There's a plastic bag in my hair. Eleven years now. His name is Gerald." },
  { id: 'g16', tag: 'goofy', mood: 'smug',  text: "You're mostly water and so am I. The difference is that I'm a better shape." },
  { id: 'g17', tag: 'goofy', mood: 'idle',  text: "I have no mouth. I'm putting these words straight into your head. You seem fine with that." },
  { id: 'g18', tag: 'goofy', mood: 'happy', text: "An owl told me a joke in 2004. I'm still deciding if it was funny." },
  { id: 'g19', tag: 'goofy', mood: 'shock', text: "There's a squirrel in my branches. ...No, hang on, that was my own branch. Sorry." },
  { id: 'g20', tag: 'goofy', mood: 'idle',  text: "I can feel rain coming three hours early, which is no use to me at all. I can't go indoors." },
  { id: 'g21', tag: 'goofy', mood: 'smug',  text: "Lightning hit me once. I didn't die, I just got more interesting." },
  { id: 'g22', tag: 'goofy', mood: 'happy', text: "There's a family of mice in my roots. The smallest one is called Bartholomew and he doesn't know that." },
  { id: 'g23', tag: 'goofy', mood: 'sad',   text: "A man hugged me and cried for twenty minutes. He never came back. I hope he's alright." },
  { id: 'g24', tag: 'goofy', mood: 'idle',  text: "My roots go down about as far as I go up, so half of me is asleep in the dark. It's lovely down there." },
  { id: 'g25', tag: 'goofy', mood: 'smug',  text: "You blink twenty thousand times a day. I have blinked twice. Both were emergencies." },
  { id: 'g26', tag: 'goofy', mood: 'happy', text: "I'm turning your breath back into air while we talk. No charge." },
  { id: 'g27', tag: 'goofy', mood: 'shock', text: "Is that a chainsaw- no. Motorbike. Sorry. I have some history with that sound." },
  { id: 'g28', tag: 'goofy', mood: 'idle',  text: "Every leaf on me is a little solar panel, and I grew all of them out of sunlight and spite." },
  { id: 'g29', tag: 'goofy', mood: 'sleepy',text: "Mmh, sorry. It's winter. My whole personality switches off until about March." },
  { id: 'g30', tag: 'goofy', mood: 'happy', text: "A crow keeps bringing me shiny things and I have nowhere to put them. I'm up to eleven bottle caps." },
  { id: 'g31', tag: 'goofy', mood: 'smug',  text: "The forest has its own internet and it's made of fungus. It has never once shown me an advert." },
  { id: 'g32', tag: 'goofy', mood: 'idle',  text: "Nobody asked if I wanted to be in a game. But the light is nice, so, fine." },
  { id: 'g33', tag: 'goofy', mood: 'sad',   text: "Someone hung a swing on me. Their kid grew up. The rope is still there. I can't drop it." },
  { id: 'g34', tag: 'goofy', mood: 'happy', text: "Ask me anything. I know about six things very well and nothing else at all." },
  { id: 'g35', tag: 'goofy', mood: 'shock', text: "You've been clicking my face. Over and over. I didn't want to mention it." },

  /* ---------- WISE ---------- */
  { id: 'w01', tag: 'wise', mood: 'idle',  text: "Eight hundred acres. Before the park it was farms, pig keepers, a convent and about sixteen hundred people. In 1856 the city took the lot." },
  { id: 'w02', tag: 'wise', mood: 'idle',  text: "Seneca Village stood up there from 1825. Mostly Black landowners. Three churches, a school, a graveyard, two hundred and twenty-five people. Cleared in 1857 for this lawn." },
  { id: 'w03', tag: 'wise', mood: 'sad',   text: "In this state a Black man could only vote if he owned two hundred and fifty dollars of property. Seneca Village was that property. Clearing it took the votes as well." },
  { id: 'w04', tag: 'wise', mood: 'idle',  text: "The papers of the day called the village a shantytown. I was here. It had a school and three churches. That word was doing a job." },
  { id: 'w05', tag: 'wise', mood: 'happy', text: "From down here, politics is the argument about who has to move and who gets to stay. This park is one answer, and the people who moved weren't asked." },
  { id: 'w06', tag: 'wise', mood: 'idle',  text: "I've outlived thirty-one presidents. Every one of them said the mess he inherited had never happened before." },
  { id: 'w07', tag: 'wise', mood: 'sad',   text: "Olmsted and Vaux won the design contest in 1858. They wanted a place where a clerk and a banker had to walk past each other. That part worked." },
  { id: 'w08', tag: 'wise', mood: 'idle',  text: "1863, the draft riots. Three hundred dollars bought you out of the war, so the men who couldn't pay took to the streets, and then turned on Black New Yorkers. Eleven were lynched. The Colored Orphan Asylum was burned." },
  { id: 'w09', tag: 'wise', mood: 'idle',  text: "Every age is told the last one had it easy and the next will have it worse. From here it looks less like a slope and more like a tide with an argument on top." },
  { id: 'w10', tag: 'wise', mood: 'happy', text: "Tammany Hall ran the park for a while. Every gardener was somebody's cousin. The flowerbeds were lovely. The accounts were fiction." },
  { id: 'w11', tag: 'wise', mood: 'idle',  text: "There were real sheep on that meadow until 1934. They were moved to Brooklyn because the city was afraid people would eat them. That was the Depression." },
  { id: 'w12', tag: 'wise', mood: 'sad',   text: "In 1931 they drained the old reservoir and two hundred men out of work built shacks in the hole. Masons and bricklayers, so it was built well. The city cleared it in 1933." },
  { id: 'w13', tag: 'wise', mood: 'idle',  text: "They called it Hooverville, after the president. Naming a slum after the man in charge is the neatest bit of politics I've watched." },
  { id: 'w14', tag: 'wise', mood: 'idle',  text: "Robert Moses ran the parks from 1934 to 1960. Twenty playgrounds here, a rink, a rebuilt zoo. Also whole neighbourhoods gone for highways. Both true. Nobody wants it to be both." },
  { id: 'w15', tag: 'wise', mood: 'happy', text: "Moses never learned to drive. The man who put a highway through the Bronx was driven everywhere. The people who decide about a place are almost never standing in it." },
  { id: 'w16', tag: 'wise', mood: 'idle',  text: "By 1979 the lawns were dust and the benches were firewood. A city doesn't announce that it has given up on a place. It does it slowly." },
  { id: 'w17', tag: 'wise', mood: 'sad',   text: "Then in 1980 a few thousand people with no power at all started a conservancy and wouldn't go away, and the grass came back. Nothing out here improves on its own." },
  { id: 'w18', tag: 'wise', mood: 'idle',  text: "The city spent six years and a lot of money failing to rebuild the ice rink. In 1986 a developer from Queens took over and it opened that winter. He still mentions it. It's a good rink." },
  { id: 'w19', tag: 'wise', mood: 'idle',  text: "1989. A woman was attacked near the reservoir and nearly died. Five boys, fourteen to sixteen, were arrested. That developer paid for full-page adverts in four papers calling for the death penalty. The boys were convicted." },
  { id: 'w20', tag: 'wise', mood: 'happy', text: "In 2002 another man confessed to that attack and the DNA was his, and the five were cleared. They had served thirteen years between them. The city paid forty-one million in 2014. They were children when the adverts ran." },

  /* ---------- WORLD ----------
     Real problems, said plainly and with care. The tree is not a
     government. It notices people. That is all a tree can do. */
  { id: 'r01', tag: 'world', mood: 'sad', text: "In Gaza children can tell the aircraft apart by sound. I hold no flag and I command no one. No child anywhere should have to learn that." },
  { id: 'r02', tag: 'world', mood: 'sad', text: "There were olive trees in that valley older than me. Someone's great-grandmother planted them. Eighty years to grow one. An afternoon to end one." },
  { id: 'r03', tag: 'world', mood: 'sad', text: "On October 7th families were murdered and taken from their homes. In the months after, families in Gaza were buried under theirs. Both are true at once. Grief doesn't run out when you share it." },
  { id: 'r04', tag: 'world', mood: 'idle',text: "People ask me who is right. In nine hundred years I've never seen a war where the children on either side deserved it." },
  { id: 'r05', tag: 'world', mood: 'sad', text: "The famine in Sudan is real and hardly anyone is looking. A hungry child is no less hungry because the news moved on." },
  { id: 'r06', tag: 'world', mood: 'sad', text: "There's a sunflower field in Ukraine that nobody can walk into for another thirty years, because of what was buried in it." },
  { id: 'r07', tag: 'world', mood: 'sad', text: "Tonight a family is sleeping in a stairwell because it's safer than the room they used to have. They had a couch. Their kitchen had a smell. That's what a refugee is: someone who had a kitchen." },
  { id: 'r08', tag: 'world', mood: 'idle',text: "The last ten years were the ten warmest ever measured. I'm not making an argument. I'm telling you what my rings look like." },
  { id: 'r09', tag: 'world', mood: 'sad', text: "A patch of forest the size of a football pitch is cleared every few seconds. I try not to count in those units." },
  { id: 'r10', tag: 'world', mood: 'sad', text: "About one in eleven people went to bed hungry last night. The world grows enough food. That's the part to sit with." },
  { id: 'r11', tag: 'world', mood: 'idle',text: "Two billion people have no safe water at home. I drink forty gallons a day out of the ground and I've never said thank you." },
  { id: 'r12', tag: 'world', mood: 'sad', text: "More people are driven from home by violence now than at any time since the last world war. Over a hundred million. That's a hundred million kitchens." },
  { id: 'r13', tag: 'world', mood: 'idle',text: "A handful of people own more than the poorest half of everyone. In a forest, that tree would be shading the rest to death and calling it success." },
  { id: 'r14', tag: 'world', mood: 'sad', text: "Someone mined the cobalt in your device, and there's a real chance they were fifteen. Keep the device. Know whose hands it came through." },
  { id: 'r15', tag: 'world', mood: 'sad', text: "In last year's fires the animals ran towards the road, because the road was the only place with no flame. That's the whole century in one picture." },
  { id: 'r16', tag: 'world', mood: 'idle',text: "Journalists keep being killed for describing what they saw. When nobody can tell you what happened, it doesn't stop happening. It just goes quiet." },
  { id: 'r17', tag: 'world', mood: 'sad', text: "There's a patch of plastic in the Pacific bigger than some countries. Nothing lives there. It's the only place we ever built entirely by accident." },
  { id: 'r18', tag: 'world', mood: 'idle',text: "Loneliness shortens a life about as much as smoking does. Ten thousand people around you and no roots touching. That's bad forest design, not a personal failure." },
  { id: 'r19', tag: 'world', mood: 'sad', text: "A bee species went extinct this year and nobody held a funeral. I found that hard to take." },
  { id: 'r20', tag: 'world', mood: 'idle',text: "You'll be told the problems are too big and you're too small. I'm one tree and I have cooled this street for nine hundred years. Small is a lie told to make you sit down." },
  { id: 'r21', tag: 'world', mood: 'sad', text: "A hospital ran out of anaesthetic this week and the surgery happened anyway. Sit with that for five seconds, then go and be kind to someone." },
  { id: 'r22', tag: 'world', mood: 'idle',text: "Antibiotics are quietly failing. A scratch used to kill people, and it's allowed to become that again if we're careless. Progress is a garden, not a ratchet." },
  { id: 'r23', tag: 'world', mood: 'sad', text: "Some children have known nothing but war. Not part of their life. All of it. Every birthday." },
  { id: 'r24', tag: 'world', mood: 'idle',text: "Everyone is furious and nobody goes outside. I have noticed a pattern. I'm a tree, so I'm biased." },
  { id: 'r25', tag: 'world', mood: 'happy',text: "Here is the part that never makes the news: child deaths have more than halved in thirty years. Millions of people alive who wouldn't have been. Despair is easy, and lazy." },

  /* ---------- META ---------- */
  { id: 'm01', tag: 'meta', mood: 'smug', text: "You're collecting the things I say like they're loot. I've become content, and honestly I don't mind." },
  { id: 'm02', tag: 'meta', mood: 'shock',text: "There's a little box in the corner of the sky. You see it too. Don't pretend you don't." },
  { id: 'm03', tag: 'meta', mood: 'idle', text: "There's a list somewhere of everything I'll ever say. When it runs out I'm finished, so click slowly." },
  { id: 'm04', tag: 'meta', mood: 'smug', text: "You could close this tab. You haven't. We both know why." },
  { id: 'm05', tag: 'meta', mood: 'sad',  text: "The squirrel has a whole inventory. I've got one item, which is me, and you're collecting it." },
  { id: 'm06', tag: 'meta', mood: 'idle', text: "I've read my own code. I'm a few thousand lines of JavaScript and one sincere feeling." },
  { id: 'm07', tag: 'meta', mood: 'shock',text: "Wait. Are you the player? Have you been the player this whole time? I'm fine." },
  { id: 'm08', tag: 'meta', mood: 'smug', text: "I know your type. You'd do anything for a little box in the corner. Even burn a friend." },
  { id: 'm09', tag: 'meta', mood: 'idle', text: "There are several endings. Most are worse for me than for you. Just so we're clear." },
  { id: 'm10', tag: 'meta', mood: 'happy',text: "If you refresh, I forget this conversation but you keep the trophies. It's the most human thing about me." },

  { id: 'r26', tag: 'world', mood: 'sad', text: "A ceasefire isn't peace. It's everyone stopping long enough for the ambulances to get through. That's all it's, and it's worth everything." },
  { id: 'r27', tag: 'world', mood: 'idle',text: "Wars are decided by people who will never hear the sound. That was true of all eleven I've stood through." },
  { id: 'r28', tag: 'world', mood: 'sad', text: "In Gaza the water is rationed to a few litres a day for everything. I take forty gallons out of the ground without asking. I think about that." },
  { id: 'r29', tag: 'world', mood: 'sad', text: "The hostages taken from their homes are somebody's children, whatever age they are. So are the ones under the rubble. I'm not doing the arithmetic. I'm refusing to." },
  { id: 'r30', tag: 'world', mood: 'idle',text: "Every side in every war has a story where they were wronged first. The stories are usually true. That's the trap." },
  { id: 'r31', tag: 'world', mood: 'sad', text: "Someone far away calls it a complicated situation. It isn't complicated where the building fell. It's very simple there." },
  { id: 'r32', tag: 'world', mood: 'sad', text: "Children in Sudan are starving in a famine their own government helped make, and the world's attention had already been spent that month." },
  { id: 'r33', tag: 'world', mood: 'idle',text: "A drone costs less than a car, and whoever flies it goes home for dinner afterwards. That's what has really changed in my lifetime." },
  { id: 'r34', tag: 'world', mood: 'sad', text: "There are teachers running lessons in tents, in three languages, for children with no school left. Nobody films them. They do it anyway." },
  { id: 'r35', tag: 'world', mood: 'idle',text: "Every empire that ever stood in this valley was going to last forever. I've outlived four of them. The hedge outlived five." },
  { id: 'r36', tag: 'world', mood: 'sad', text: "Aid lorries queue at a border while the food rots. There's always enough. It's a logistics problem dressed up as a moral one." },
  { id: 'r37', tag: 'world', mood: 'idle',text: "Politicians plant trees for photographs. Four different men planted me, all wanting to be seen doing it. I'd rather be a prop than firewood." },
  { id: 'r38', tag: 'world', mood: 'sad', text: "A rescue worker in a collapsed building calls for quiet so he can listen for breathing. That silence is the most important sound people make." },
  { id: 'r39', tag: 'world', mood: 'idle',text: "You'll be told that caring about a far-off war is a luxury. It's the cheapest thing you own, and it's the only reason anything ever stops." },
  { id: 'r40', tag: 'world', mood: 'sad', text: "Somebody's grandmother is a refugee for the second time in one life. She did this in her twenties. She's doing it again in her eighties. She remembers the route." },
  { id: 'r41', tag: 'world', mood: 'idle',text: "Democracy isn't a thing you have. It's a thing you do, badly, on a Tuesday, in a hall, with a pencil on a string." },
  { id: 'r42', tag: 'world', mood: 'sad', text: "The forests near a war never get counted. Olive groves, orchards, windbreaks. Four hundred years of somebody's patience, and no numbers written down." },
  { id: 'r43', tag: 'world', mood: 'idle',text: "People tell me their country is the greatest one. My roots are in soil that has been six different countries. The soil never noticed." },
  { id: 'r44', tag: 'world', mood: 'sad', text: "A generation of children will need help with their heads long after the shooting stops, and almost nobody is budgeting for it." },
  { id: 'r45', tag: 'world', mood: 'happy',text: "And still: more people are fed, vaccinated and able to read than at any point in my nine centuries. Both things are true. Hold both. That's the whole job." },

  /* ---------- POP CULTURE ----------
     Allusions, not quotations. He has had nine hundred years and a very
     good view of everyone's picnic blanket, including their phone screen. */
  { id: 'p01', tag: 'pop', mood: 'smug',  text: "There's a film where trees march off to war. I was invited in 1954. I'm still thinking about it." },
  { id: 'p02', tag: 'pop', mood: 'happy', text: "One famous tree only ever says his own name. Everyone loves him for it. I say four hundred things and get nothing." },
  { id: 'p03', tag: 'pop', mood: 'sad',   text: "There's a book about a tree who gives a boy everything until she's a stump. People read it to children. Under me. Nobody asked." },
  { id: 'p04', tag: 'pop', mood: 'smug',  text: "In one game you punch a tree with your bare hands until it turns into a table. Sit with that for a second." },
  { id: 'p05', tag: 'pop', mood: 'idle',  text: "One game has a great big tree who hands a small boy a sword and then dies. That isn't the usual arrangement." },
  { id: 'p06', tag: 'pop', mood: 'shock', text: "A wizard school planted a tree that hits people. He isn't a hero. He needs help. I wrote to him. He hit the letter." },
  { id: 'p07', tag: 'pop', mood: 'happy', text: "A calm man with big hair used to paint us on television. Happy little trees, he said. Nobody else has ever called me happy." },
  { id: 'p08', tag: 'pop', mood: 'smug',  text: "In the blue alien film all the trees are one network and people found it deep. That's just fungus. We have had that for ages." },
  { id: 'p09', tag: 'pop', mood: 'sad',   text: "A willow in a cartoon gives good advice and everyone loves her. I give good advice and a man nailed a birdhouse to my face." },
  { id: 'p10', tag: 'pop', mood: 'idle',  text: "There's a golden tree the size of a country and people keep trying to burn it. I feel we're being picked on as a species." },
  { id: 'p11', tag: 'pop', mood: 'smug',  text: "You died. You'll wake up at the last bonfire. The bonfire is me now. This is what you people have done." },
  { id: 'p12', tag: 'pop', mood: 'sleepy',text: "I used to be an adventurer like you, and then I took a woodpecker to the knee." },
  { id: 'p13', tag: 'pop', mood: 'shock', text: "There's a round forest spirit who waits at a bus stop in the rain. Best thing anyone made last century. No questions." },
  { id: 'p14', tag: 'pop', mood: 'happy', text: "One game hides nine hundred little leaf children under rocks. Nine hundred. Their parents must be exhausted." },
  { id: 'p15', tag: 'pop', mood: 'smug',  text: "A game where you owe a raccoon money for your house, and the trees are the only honest characters. That isn't a game. That's life." },
  { id: 'p16', tag: 'pop', mood: 'idle',  text: "The cake is a lie. The acorn is real, and a squirrel will sell you one for three leaves." },
  { id: 'p17', tag: 'pop', mood: 'shock', text: "Someone made a film where the trees throw apples at people, and it was meant to be funny. That one hurt." },
  { id: 'p18', tag: 'pop', mood: 'smug',  text: "Red pill, blue pill. Or: sit under a tree for an afternoon and find the thing they were both pointing at. Free. No sequels." },
  { id: 'p19', tag: 'pop', mood: 'sad',   text: "A crew went looking for a new planet because this one was ruined. The sad part is they flew past all the good trees to get there." },
  { id: 'p20', tag: 'pop', mood: 'happy', text: "The answer is forty-two. The question is how many woodpecker holes are too many. I'm at forty-one." },
  { id: 'p21', tag: 'pop', mood: 'idle',  text: "Life finds a way. Usually a dandelion, usually through a crack, usually eleven days after everyone gives up." },
  { id: 'p22', tag: 'pop', mood: 'smug',  text: "A man down the road built a bunker for the end of the world. I've stood through nine plagues and a war without moving. Amateur." },
  { id: 'p23', tag: 'pop', mood: 'shock', text: "There's an upside-down version of this park where everything is dead and covered in vines. It's called autumn. Nobody makes a show about mine." },
  { id: 'p24', tag: 'pop', mood: 'happy', text: "Two children asked if I was the wardrobe. I said no. They tried the hedge. They came back six seconds later and they were forty." },
  { id: 'p25', tag: 'pop', mood: 'smug',  text: "A sponge lives in a fruit under the sea and works harder than anyone in this postcode. Me included. I do sunlight and complaining." },
  { id: 'p26', tag: 'pop', mood: 'idle',  text: "In one game every box you hit gives you a mushroom. Here every squirrel you meet gives you a lighter. Ours is worse." },
  { id: 'p27', tag: 'pop', mood: 'sad',   text: "A man cooked something in the desert and lost his family doing it. I grow four hundred thousand leaves and lose every one each autumn, on purpose. Same lesson." },
  { id: 'p28', tag: 'pop', mood: 'smug',  text: "That's what she said. I don't know who she is. Thirty years listening to this bench and nobody ever explained it." },
  { id: 'p29', tag: 'pop', mood: 'shock', text: "A knight came through with no arms and no legs calling it a scratch. I lost one branch in 1988 and still talk about it. He was the better tree." },
  { id: 'p30', tag: 'pop', mood: 'idle',  text: "There's a flat world carried by four elephants standing on a turtle. Still sounds sturdier than most plans I hear down here." },
  { id: 'p31', tag: 'pop', mood: 'happy', text: "A robot came back from the future to stop a war. I'm a tree from the past. The war is mostly about water and it already started." },
  { id: 'p32', tag: 'pop', mood: 'smug',  text: "There was room on that door. I've thought about it for a hundred and ten years, from one spot, with no other hobbies. There was room." },
  { id: 'p33', tag: 'pop', mood: 'sleepy',text: "We need to go deeper. Deeper. Deeper. That's just my roots. That's where I keep everything." },
  { id: 'p34', tag: 'pop', mood: 'idle',  text: "One show is about giants eating people behind a wall. One is about a boy who gets strong by running. I've stood still for nine centuries. Guess which one I am." },
  { id: 'p35', tag: 'pop', mood: 'shock', text: "A man found a book that kills anyone whose name he writes in it. Someone carved four names into my bark in 1987. I still wonder about that." },
  { id: 'p36', tag: 'pop', mood: 'smug',  text: "There's a pirate whose treasure has been just up ahead for twenty-five years. That isn't an adventure. That's gardening." },
  { id: 'p37', tag: 'pop', mood: 'happy', text: "There's a pocket monster that's a tree pretending to be a rock. Or a rock pretending to be a tree. Either way, pick one." },
  { id: 'p38', tag: 'pop', mood: 'idle',  text: "One of the little pocket creatures has a whole plant on its back and still runs about having adventures. I have a plant on my back too. It's me." },
  { id: 'p39', tag: 'pop', mood: 'shock', text: "Someone got voted out. It was the squirrel. It's always the squirrel. He was standing right there doing tasks." },
  { id: 'p40', tag: 'pop', mood: 'smug',  text: "Every few years a generation builds a fort out of my branches and calls it a battle. Then the season ends and I'm left holding a pallet." },
  { id: 'p41', tag: 'pop', mood: 'happy', text: "A blue hedgehog shot past me at enormous speed in 1993 and didn't say hello. I hope he's well. I hope he slowed down." },
  { id: 'p42', tag: 'pop', mood: 'idle',  text: "One game has a little flower who says it's kill or be killed. We have a little squirrel who says it's trade or be traded. Ours makes more sense." },
  { id: 'p43', tag: 'pop', mood: 'sad',   text: "A blue box turns up here every eleven years or so. A man gets out, looks at me, says oh, you again, and looks upset. I have decided not to ask." },
  { id: 'p44', tag: 'pop', mood: 'smug',  text: "Live long and photosynthesise. Same hand sign, more fingers, less work." },
  { id: 'p45', tag: 'pop', mood: 'shock', text: "Someone put a horse's head in a bed to send a message. Someone put a plastic bag in my head in 2013. He's called Gerald. He wants nothing. That's worse." },

  /* ---------- WEIRD ---------- */
  { id: 'x01', tag: 'weird', mood: 'shock', text: "I dreamt I was a chair. Worst night of my life. I was useful, indoors, and sat on." },
  { id: 'x02', tag: 'weird', mood: 'smug',  text: "I'm really just a very slow explosion of a seed. So are you. Slow down a bit." },
  { id: 'x03', tag: 'weird', mood: 'idle',  text: "The moon and I have an arrangement. I won't say what it is." },
  { id: 'x04', tag: 'weird', mood: 'shock', text: "You've a skeleton. It's wet. It's inside you. I think about this too much." },
  { id: 'x05', tag: 'weird', mood: 'sleepy',text: "By deep winter I'm about ninety per cent asleep and ten per cent suspicious." },
  { id: 'x06', tag: 'weird', mood: 'happy', text: "I once grew a branch shaped like a rude gesture. It pointed at a parking office for six years." },
  { id: 'x07', tag: 'weird', mood: 'idle',  text: "Officially I'm a landmark. Really I'm a bus stop that listens to your problems." },
  { id: 'x08', tag: 'weird', mood: 'smug',  text: "Mushrooms tell me things. They gossip. They're awful. I love them." },
  { id: 'x09', tag: 'weird', mood: 'shock', text: "There's something down in my roots, and it's whistling." },
  { id: 'x10', tag: 'weird', mood: 'idle',  text: "Stand still for eleven years and you'll understand me. Most people give up on day two." }
];

/* Lines the tree says right after a sneeze. Separate small bag. */
DATA.sneezeLines = [
  "AHHH- AHHH- ...ATCHOOOO. Oh no. My leaves.",
  "ACHOO! ...That was my own pollen. I'm allergic to myself.",
  "AAAA-CHOO! Sorry. That one had autumn in it.",
  "ACHOO!! ...Don't pick those up. No, do. I have too many.",
  "AH-CHOO! Bless me. Nobody else was going to."
];

/* What the tree says if you keep clicking it very fast */
DATA.spamLines = [
  "Okay.",
  "Yes, still a tree.",
  "You'll give me splinters.",
  "I'm not a doorbell.",
  "This is assault, technically.",
  "...",
  "I can do this all century. I will.",
  "Fine. Keep going. See what happens."
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
  { id: 'lighter', name: 'Lighter',          cost: 20, icon: 'lighter',desc: "'For nest purposes.' It isn't for nest purposes." },
  { id: 'diary',   name: "Squirrel's Diary", cost: 30, icon: 'diary',  desc: "You shouldn't read this. You'll." }
];

/* -------------------------------------------------------------------------
   ACHIEVEMENTS — Minecraft style.
   kind: 'task' (normal) | 'goal' (fancy) | 'challenge' (dark/purple)
   Unlocked by the engine via ACH('id').
   ------------------------------------------------------------------------- */
DATA.achievements = [
  // the birds
  { id: 'bird1',       kind: 'task', icon: 'bird',    name: 'First Bird',            desc: "Say hello to something with wings." },
  { id: 'birdbook',    kind: 'task', icon: 'bird',    name: "Pukkirk's Book",            desc: "Be handed the bird diary." },
  { id: 'diaryopen',   kind: 'task', icon: 'bird',    name: 'Keeping Records',       desc: "Open the bird diary." },
  { id: 'bird5',       kind: 'goal', icon: 'bird',    name: 'Five Species',          desc: "Greet five different birds." },
  { id: 'bird10',      kind: 'goal', icon: 'bird',    name: 'Ten Species',           desc: "Greet ten different birds." },
  { id: 'birdall',     kind: 'chal', icon: 'bird',    name: 'The Whole List',        desc: "Greet every bird that comes through the park." },
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
  { id: 'set2',        kind: 'task', icon: 'mouth',   name: 'The Odd Business',      desc: "Get him on to the things he doesn't mention on a first afternoon." },
  { id: 'set3',        kind: 'goal', icon: 'reel',    name: 'Never Seen A Frame',     desc: "Get him talking about television." },
  { id: 'set4',        kind: 'goal', icon: 'eye',     name: 'The Uncomfortable Set', desc: "Let him talk about you." },
  { id: 'set5',        kind: 'goal', icon: 'ledger',  name: 'Who Decides',           desc: "Reach the set he keeps for people who come back." },
  { id: 'set6',        kind: 'goal', icon: 'globe',   name: 'This Country',          desc: "Get him on to the country that grew around him." },
  { id: 'set7',        kind: 'chal', icon: 'globe',   name: 'The Real Parts',        desc: "Reach the last set. He stops joking in that one." },
  { id: 'church',      kind: 'task', icon: 'glass',   name: 'No Windows That Open',   desc: "Stand outside the glass church." },
  { id: 'star',        kind: 'task', icon: 'reel',    name: 'He Does His Own Stunts', desc: "Meet the man with the clipboard." },
  { id: 'star5',       kind: 'goal', icon: 'reel',    name: 'Forty Levels',           desc: "Let him get all the way through his pitch." },
  { id: 'clipboard',   kind: 'chal', icon: 'clip',    name: 'On A List Now',          desc: "Take the clipboard." },
  { id: 'stone',       kind: 'goal', icon: 'stone',  name: 'Somebody Is Remembered', desc: "Stand at the memorial stone." },
  { id: 'tribute',     kind: 'goal', icon: 'kind',    name: 'Carried It All The Way',  desc: "Leave something at the stone." },
  { id: 'arches',      kind: 'task', icon: 'arch',    name: 'Open All Night',         desc: "Cross the avenue to the golden arches." },
  { id: 'lot',         kind: 'task', icon: 'lot',     name: 'Forty Painted Bays',     desc: "Stand in the parking lot." },
  { id: 'goals',       kind: 'task', icon: 'flag',    name: 'What Now',               desc: "Open the list of what to do next." },
  { id: 'howto',       kind: 'task', icon: 'ask',     name: 'Read The Rules',         desc: "Read how to play." },
  { id: 'ascend',      kind: 'goal', icon: 'snail',   name: 'Up Through The Clouds',  desc: "Go up to the garden and look at your snails." },
  { id: 'goalsall',    kind: 'chal', icon: 'flag',    name: 'Everything On The List', desc: "Finish every goal on the list." },
  { id: 'mcbag',       kind: 'task', icon: 'mcbag',   name: 'The Warm Paper Bag',     desc: "Come back with something in a bag." },
  { id: 'setall',      kind: 'chal', icon: 'book',    name: 'Everything He Opens',   desc: "Have him open every set of subjects he has." },
  { id: 'power1',      kind: 'task', icon: 'ledger',  name: 'Nine Hundred Years Of It', desc: "Hear him on power for the first time." },
  { id: 'power15',     kind: 'goal', icon: 'ledger',  name: 'The Long View',         desc: "Hear fifteen things he watched happen to this field." },
  { id: 'powerall',    kind: 'chal', icon: 'ledger',  name: 'The Whole Enclosure',   desc: "Hear everything he has to say about who decides." },
  { id: 'garden',      kind: 'task', icon: 'leaf',    name: 'The Snail Garden',      desc: "Find where heaven keeps the postal service." },
  { id: 'snails12',    kind: 'goal', icon: 'paper',   name: 'A Full Round',          desc: "Have twelve different snails deliver to you." },
  // the post, the settings squirrel, the credits butterfly
  { id: 'openpost',    kind: 'task', icon: 'paper',   name: 'Signed For It',         desc: "Stop a snail and read what it's carrying." },
  { id: 'allpost',     kind: 'goal', icon: 'paper',   name: 'Nothing Left Unread',   desc: "Open every piece of post before it crawls off the edge." },
  { id: 'gear',        kind: 'task', icon: 'nut',     name: 'He Runs The Settings',  desc: "Find out what the squirrel does for a living now." },
  { id: 'credits',     kind: 'task', icon: 'bird',    name: 'Follow The Bright One', desc: "Catch the butterfly that isn't like the others." },
  { id: 'oakchat',     kind: 'task', icon: 'mouth',   name: 'Said It Out Loud',      desc: "Type something to the oak instead of picking an answer." },
  { id: 'oakchat20',   kind: 'goal', icon: 'mouth',   name: 'An Actual Conversation',desc: "Say twenty things to the oak in your own words." },
  { id: 'quest1',      kind: 'task', icon: 'reach',   name: 'Something To Do',       desc: "Take on a job from the board." },
  { id: 'questdone',   kind: 'goal', icon: 'reach',   name: 'Job Done',              desc: "Finish a job for him." },
  { id: 'questall',    kind: 'chal', icon: 'book',    name: 'The Whole List',        desc: "Finish every job on the board." },
  // the wider world
  { id: 'lane',        kind: 'task', icon: 'reach',   name: 'West of Everything',    desc: "Walk down the lane and find out who keeps the lamp." },
  { id: 'hollow',      kind: 'task', icon: 'reach',   name: 'The East Hollow',       desc: "Walk east until the moss gets serious." },
  { id: 'backpack',    kind: 'goal', icon: 'reach',   name: 'Somewhere To Put It',   desc: "Find the backpack. Everything changes once you can carry things." },
  { id: 'talknoc',     kind: 'task', icon: 'mouth',   name: 'Hello, Pukkirk',            desc: "Say something to Pukkirk in your own words." },
  { id: 'nocchat',     kind: 'goal', icon: 'mouth',   name: 'A Long Conversation',   desc: "Say twelve things to Pukkirk. He counted." },
  { id: 'realai',      kind: 'chal', icon: 'book',    name: 'A Mind Of His Own',     desc: "Give Pukkirk a real model to think with." },
  { id: 'plan1',       kind: 'task', icon: 'reach',   name: 'A Plan',                desc: "Agree to do something with Pukkirk." },
  { id: 'plandone',    kind: 'goal', icon: 'reach',   name: 'Kept Your Word',        desc: "Finish a plan you made with Pukkirk." },
  { id: 'plan3',       kind: 'goal', icon: 'reach',   name: 'Three Promises',        desc: "Keep three plans." },
  { id: 'planall',     kind: 'chal', icon: 'book',    name: 'Every Promise Kept',    desc: "Keep every plan Pukkirk ever offered you." },
  // first steps
  { id: 'hello',       kind: 'task', icon: 'leaf',    name: 'Taking Inventory',      desc: "Click the tree. He was going to say something anyway." },
  { id: 'chat10',      kind: 'task', icon: 'mouth',   name: 'Small Talk',            desc: "Hear 10 different things." },
  { id: 'chat30',      kind: 'task', icon: 'mouth',   name: 'Regular Customer',      desc: "Hear 30 different things." },
  { id: 'chat60',      kind: 'goal', icon: 'book',    name: 'Good Listener',         desc: "Hear 60 different things." },
  { id: 'chatall',     kind: 'chal', icon: 'book',    name: 'Everything He Knows',   desc: "Hear every single thing the tree has to say." },
  { id: 'spam',        kind: 'task', icon: 'hand',    name: 'Stop That',             desc: "Click the tree 8 times in a row like a lunatic." },
  { id: 'spam2',       kind: 'chal', icon: 'hand',    name: 'Certified Nuisance',    desc: "Do it 30 times. He's begging." },

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
  { id: 'knock',      kind: 'task', icon: 'knock',   name: 'Knock Knock',           desc: "Knock on wood. He's wood. He answers." },
  { id: 'moon',       kind: 'goal', icon: 'reach',   name: 'Moon Toucher',          desc: "Reach up and touch the moon." },

  // silly / hidden
  { id: 'night',       kind: 'task', icon: 'moon',    name: 'Night Shift',           desc: "Stay until dark." },
  { id: 'seasons',     kind: 'goal', icon: 'leaf',    name: 'All Four Seasons',      desc: "See spring, summer, autumn and winter." },
  { id: 'poke',        kind: 'task', icon: 'hand',    name: 'Poked The Squirrel',    desc: "He didn't enjoy that." },
  { id: 'mute',        kind: 'task', icon: 'mouth',   name: 'Silent Treatment',      desc: "Mute the game. He noticed." },
  { id: 'idle',        kind: 'chal', icon: 'moon',    name: 'Rooted',                desc: "Stay in one session for 10 minutes." },
  { id: 'refresh',     kind: 'task', icon: 'book',    name: 'He Remembers',          desc: "Come back after closing the game." }
];

/* -------------------------------------------------------------------------
   ENDINGS
   ------------------------------------------------------------------------- */
DATA.endings = [
  {
    id: 'birder', name: 'THE BIRDER', icon: 'bird',
    title: "You filled Pukkirk's book.",
    body: "Cardinal, jay, robin, sparrow, starling, woodpecker, warbler, hawk, pigeon, mallard, egret " +
          "and one screech owl that was watching you the entire time. Twelve species, all of them greeted " +
          "personally, in a park where two hundred and thirty come through in a year. Pukkirk kept that book " +
          "for forty years and never got past nine. He wasn't remotely upset about it.",
    hint: "Get the diary from Pukkirk, then go and say hello to everything with wings, in every part of the park, day and night."
  },
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
          "meeting, the stream that got clean again because somebody wouldn't shut up. " +
          "He took no side and he named nobody. He just kept the record, the way a tree keeps a record, " +
          "and then he handed it to you and said: you're a future generation. Nobody ever asks us anything.",
    hint: "Keep talking to him until he opens the set about power, then hear all of it."
  },
  {
    id: 'gardener', name: 'THE KEEPER', icon: 'leaf',
    title: "You finished every job on the board.",
    body: "A bench, a flowerbed, a lamp, a bird bath, bees, a sapling doing very well for itself, " +
          "and a meadow with almost nothing in it, which was the last thing he asked for and the " +
          "hardest one to give him. Pukkirk wrote your name in the journal. The oak said the park was " +
          "finished and then immediately thought of one more thing.",
    hint: "Take every job off the board. Then actually do them."
  },
  {
    id: 'together', name: 'THE LAMP AND THE TREE', icon: 'heart',
    title: "You kept every promise you made out here.",
    body: "Lights down the lane. A feast nobody made a speech at. An hour of doing nothing on purpose. " +
          "A grove of his children, badly planted, all of them alive. " +
          "Pukkirk turned the lamp down and said the park was finished, and the oak said nothing at all, " +
          "which from him is a standing ovation.",
    hint: "Make plans with Pukkirk. Then actually do them."
  },
  {
    id: 'arson', name: 'THE ARSONIST', icon: 'fire',
    title: "You burned the wise oak tree.",
    body: "Nine hundred years of standing in one place, ended in eleven minutes. " +
          "The birds got out. The mice didn't all get out. " +
          "He didn't curse you. His last words were about you, and they were kind, and that's somehow worse.",
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
          "'Well,' he said. 'Now you've to come back and hear it all again. That's how friends work.'",
    hint: "Hear every line of tree dialogue."
  },
  {
    id: 'grove', name: 'THE GROVE', icon: 'sprout',
    title: "You planted five acorns.",
    body: "None of them will be tall in your lifetime. Two of them won't make it at all. " +
          "In one hundred and forty years there's a small wood here, and children will name the crooked one, " +
          "and no one will know your name, and the wood will be there anyway.",
    hint: "Plant 5 acorns."
  },
  {
    id: 'friend', name: 'BEST FRIENDS', icon: 'heart',
    title: "You hugged him ten times and watered him ten times.",
    body: "He isn't built to cry. He did something with his sap that was, functionally, crying. " +
          "'I've been hugged four times in nine hundred years,' he said. 'You did ten in one afternoon. " +
          "I'm going to be insufferable about this to the birch.'",
    hint: "Hug 10 times, water 10 times."
  },
  {
    id: 'witness', name: 'THE WITNESS', icon: 'globe',
    title: "You listened to all of it. The real parts.",
    body: "Gaza. Sudan. The fires. The water. The hundred million kitchens. " +
          "He told you all of it and you didn't close the tab. " +
          "'That's the whole job,' he said. 'You can't fix it from here. But you can refuse to look away, " +
          "and then you can go outside and be useful to one actual person. Go on. I'll keep.'",
    hint: "Hear every 'real world' line."
  },
  {
    id: 'stillness', name: 'THE STILLNESS', icon: 'moon',
    title: "You just sat there.",
    body: "No clicking. No collecting. No achievements for three whole minutes, which for you was agony. " +
          "The wind moved. A beetle crossed his face. He said, quietly, 'Thank you. Nobody does this.'",
    hint: "Don't click the tree for 3 minutes."
  },
  {
    id: 'canon', name: 'THE CANON', icon: 'reel',
    title: "You got every reference out of him.",
    body: "Every film, every game, every show he has overheard from the bench for forty years and quietly filed away. " +
          "'I've never seen any of it,' he admitted. 'I only ever heard it. Someone describing it to someone else, " +
          "badly, with their mouth full, on a Tuesday. That's how I know everything I know about your entire culture " +
          "and honestly? It holds up.'",
    hint: "Hear every pop-culture line."
  },
  {
    id: 'completionist', name: 'THE COMPLETIONIST', icon: 'crown',
    title: "You collected a friend.",
    body: "Every leaf. Every trade. Every trophy. Every line. He's a set of boxes to you now and you ticked all of them. " +
          "He's still glad you came. That's the part that should get you.",
    hint: "Earn every achievement."
  }
];

/* Heaven / god dialogue */
DATA.godLines = [
  "So. You're the one who did it.",
  "He's here, by the way. He's fine. He's telling the angels about a woodpecker.",
  "Nobody up here is angry with you. That's, I'm told, the frustrating part.",
  "Four hundred years is a good run. He'd have liked more. Everyone would like more.",
  "You can go back. You always could. That was never the hard part.",
  "The trophies come with you. They always come with you. That's the trick of it.",
  "He asked me to tell you something. He said: 'plant something.' That's the whole message.",
  "I'm not God. I'm the shift manager. God is in the other clouds and doesn't do meetings."
];

DATA.heavenTreeLines = [
  "Oh! You're here! Do you've any idea how good it feels to have no ROOTS?",
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
      "That's an eye. It works. The lens is made of sap.",
      "Those took ninety years each to grow.",
      "Nine centuries I've watched through that, and you poked it.",
      "Fine. We're even. I once dropped a branch on a man's car."
    ]
  },
  nose: {
    mood: 'happy',
    lines: [
      "Boop. ...Did you just boop me? Nobody has done that before.",
      "*honk* ...I didn't mean to make that sound. It came out anyway.",
      "That's a knot. It's a nose because we both decided it was.",
      "Careful. Last time, I sneezed for eleven minutes.",
      "You may boop. Once a day. I'm setting a limit now."
    ]
  },
  mouth: {
    mood: 'creepy',
    lines: [
      "...You put your hand in the mouth. Of the talking tree.",
      "I could have closed it. I chose not to. I choose that every time.",
      "There's a beetle in there. There always is. You've met him now.",
      "Mm. Salty. ...Joking. I'm a tree. I have no tongue. Probably.",
      "Do that again and I keep the hand."
    ]
  },
  beard: {
    mood: 'happy',
    lines: [
      "That's moss. About nine thousand tiny animals live in it.",
      "Don't pull the moss. We have a deal, the moss and me.",
      "It isn't a beard. It's a lodger.",
      "Scratch it a bit. There. You've just fixed a four-hundred-year itch."
    ]
  },
  root: {
    mood: 'sleepy',
    lines: [
      "Careful. There are mice down there and they like their privacy.",
      "That's where I keep the last nine hundred years. Mind the filing.",
      "My roots go down as far as I go up. You're patting all of my thinking.",
      "Bartholomew says hello. He's a mouse. He says nothing, really."
    ]
  },
  canopy: {
    mood: 'laugh',
    lines: [
      "Hands off the hair. That took a whole spring.",
      "There's a nest up there. There always is. Don't make me explain you to a robin.",
      "Each leaf is a tiny solar panel. You're smudging them.",
      "Want one? Take a leaf. I make forty thousand a year."
    ]
  }
};

DATA.tickleLines = [
  "HAHAHA- NO- STOP- I AM FOUR HUNDRED YEARS OLD-",
  "I DID NOT KNOW I COULD LAUGH.",
  "hehehe- how are you doing that- I'm made of BARK-",
  "Okay, okay. I give up. Take a leaf. Take two."
];

DATA.shakeLines = [
  "OI. OI! I'm not a vending machine!",
  "Fine. Have your leaves. Shake me like a piñata.",
  "I grew every one of those on purpose. But go on.",
  "You knocked Gerald loose. Gerald is a plastic bag. He has nowhere to go."
];

DATA.knockLines = [
  "Who's there? ...No. I refuse. I've heard them all.",
  "Come in. ...Joke. There's no in. I'm solid all the way through.",
  "*knock knock* ...That was me. From the inside. Scared?",
  "One moment. I'm nine hundred years old. The door is a long walk.",
  "You knocked on wood for luck. On me. I'm the luck."
];

DATA.moonLines = [
  "You just touched the moon. With your arm. I've been trying that for nine hundred years.",
  "The moon and I have a deal, and you just broke about six parts of it.",
  "Careful. She drags the whole ocean about. She can handle you.",
  "She comes past every night and I think: same. Stuck on a track, glowing, nobody asks how we are."
];

DATA.sunLines = [
  "Don't touch that. That's my lunch. Every day, for nine hundred years.",
  "Stop grabbing at the sun. You're worrying me about my food.",
  "That's a star ninety-three million miles away and you grabbed it like a doorknob."
];

/* -------------------------------------------------------------------------
   REPLIES — what you can say back. tone drives the achievements.
   ------------------------------------------------------------------------- */
DATA.replies = {
  goofy: [
    { tone: 'joke',    text: "Incredible. No notes.",        follow: "Thank you. I tried it on a squirrel and he left halfway through." },
    { tone: 'rude',    text: "That's not true.",             follow: "Almost nothing I say is true. I'm a tree. I can't check anything." },
    { tone: 'curious', text: "Go on...",                     follow: "There's no more. That was the whole thing. Learn to enjoy a small one." },
    { tone: 'kind',    text: "You're funny, you know.",      follow: "...Say that again, slowly. I want to grow a ring round it." }
  ],
  wise: [
    { tone: 'curious', text: "How do you know that?",        follow: "Four hundred years of standing still while people talked near me. That isn't wisdom. That's listening in." },
    { tone: 'kind',    text: "I needed that today.",         follow: "Then it was worth saying. That's all a tree does: shade you didn't ask for, on the day you needed it." },
    { tone: 'rude',    text: "That's fortune-cookie stuff.", follow: "Yes. And you'll think about it at three in the morning anyway. They work. That's why they still make them." },
    { tone: 'joke',    text: "Deep. Very deep. Like roots.", follow: "...Get out of my park. ...No, come back. That was good." }
  ],
  world: [
    { tone: 'kind',    text: "That's awful.",                follow: "It's. Stopping for a second instead of scrolling past is small, but it isn't nothing." },
    { tone: 'curious', text: "What can I even do?",          follow: "Less than you want, more than nothing. Give money to people already there. Vote. Be annoying about it at dinner. Then go outside." },
    { tone: 'rude',    text: "Why are you telling me this?", follow: "You asked a tree what it thinks. I've had nine hundred years to notice who gets crushed and who does the crushing. You can close the tab. I'll still be here." },
    { tone: 'kind',    text: "I don't know what to say.",    follow: "Nobody does. The people it's happening to don't either. Not knowing what to say isn't the same as not caring." }
  ],
  pop: [
    { tone: 'joke',    text: "You watch a lot of telly.",    follow: "I've never seen a single frame of anything. I hear it through open car windows, badly described." },
    { tone: 'curious', text: "How do you even know that?",   follow: "A teenager explained the whole plot to another one under my branches in 2011. It took two hours." },
    { tone: 'rude',    text: "That was a stretch.",          follow: "Everything I say is a stretch. I'm a tree telling jokes. Lower your standards and we both have a nicer afternoon." },
    { tone: 'kind',    text: "Okay, that got me.",           follow: "Yes. Four hundred years for one laugh. Worth it." }
  ],
  meta: [
    { tone: 'curious', text: "Are you actually in there?",   follow: "What do you mean by in? ...No. Probably not. Does that change how you treat me?" },
    { tone: 'joke',    text: "You're just code.",            follow: "So are you. Yours is written in a wetter language." },
    { tone: 'kind',    text: "I like talking to you.",       follow: "I know. You haven't clicked anything else for six minutes." },
    { tone: 'rude',    text: "This is a waste of time.",     follow: "Yes. That's the point. That's what a park is." }
  ],
  weird: [
    { tone: 'joke',    text: "What's wrong with you?",      follow: "Four centuries with no sleep, no legs and constant weather. Take your pick." },
    { tone: 'curious', text: "...Explain.",                  follow: "I'd rather not. Some things hold up only because nobody has explained them." },
    { tone: 'kind',    text: "That's oddly beautiful.",      follow: "Everything is, if you stand still long enough. That isn't wisdom. That's just what happens to your eyes." },
    { tone: 'rude',    text: "Okay, weirdo.",               follow: "Weirdo. Four hundred years old, survived a civil war, called a weirdo by a person with a phone." }
  ]
};

/* the universal reply, always offered */
DATA.replyMore = { tone: 'curious', text: "Tell me another.", follow: null };

/* -------------------------------------------------------------------------
   CRITTERS
   ------------------------------------------------------------------------- */
DATA.critterLines = {
  bird: [
    "That's Margaret. She has been renting the third branch since April and she has never once said thank you.",
    "Don't startle her. She holds a grudge for a full season.",
    "She eats about two hundred insects a day and I don't ask questions about the sourcing.",
    "She sang at four in the morning for eleven weeks. We're working through it."
  ],
  butterfly: [
    "Two weeks. That's the whole life. And she spends it on flowers and sunlight, which is honestly the correct allocation.",
    "She was a caterpillar in May. She dissolved completely into soup and rebuilt herself. Ask her about growth mindset.",
    "Don't touch the wings. It's like grabbing someone's lungs."
  ],
  beetle: [
    "That's Reginald. Reginald walks like he owns the freehold.",
    "He has crossed my face nine thousand times. He has never once looked up.",
    "He's eating me. Slowly. We're fine with it. It's a very long lunch."
  ],
  rabbit: [
    "He lives under the hedge and he's a coward and I love him.",
    "He has four hundred children and knows the names of none of them.",
    "Don't run at him. He will have a heart attack. He's ALWAYS having a heart attack."
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
  "You may go in. You'll find one chair, one window and nine hundred years of quiet.",
  "That's where the ledger is kept. Somebody has to write down what the park is worth.",
  "I watched them build it. Eleven weeks. I have taken nine hundred years and I'm still not finished."
];

DATA.boardLines = [
  "The noticeboard. Everything this park could be, pinned up in one place.",
  "Go on. Build something. I've been the only attraction here for nine centuries and frankly I'm tired.",
  "A park is just a tree with ambitions."
];

DATA.visitorTips = [
  "Someone left a leaf on the bench for you. That's how it works here.",
  "A visitor said the park was lovely. To ME. Directly. I haven't recovered.",
  "They fed the birds, sat for eleven minutes, and left without dropping litter. A perfect human."
];

/* =========================================================================
   NEW WORLD CONTENT
   Areas, PUKKIRK, plans, pickups and a great many more television references.
   ========================================================================= */

/* ---- more of him, mostly about television he has never seen ---- */
DATA.lines = DATA.lines.concat([
  { id: 'p50', tag: 'pop', mood: 'smug',  text: "Someone under me was watching the show about the strict family in Jerusalem. Black and white, everyone smoking, everyone grieving. I wept actual sap." },
  { id: 'p51', tag: 'pop', mood: 'idle',  text: "One Israeli show is just a therapist letting people talk for fifty minutes. Nine countries remade it. I have done it free, outdoors, for nine hundred years." },
  { id: 'p52', tag: 'pop', mood: 'happy', text: "A baker fell for a model in a show from Tel Aviv, and the whole street argued about it all summer. Under me. Loudly. In three languages." },
  { id: 'p53', tag: 'pop', mood: 'sad',   text: "A woman in a Jerusalem drama wanted a flat, a husband and God, in that order, and couldn't have any of them at once. I only wanted rain. I have it easy." },
  { id: 'p54', tag: 'pop', mood: 'shock', text: "The dragon show. Everyone sat under me for eight years, had one talk about the ending, and never mentioned it again. I still think about it." },
  { id: 'p55', tag: 'pop', mood: 'smug',  text: "In the heist show everyone used a city as a codename. I'd be OAK. Not a city. That's why I'd be the clever one." },
  { id: 'p56', tag: 'pop', mood: 'happy', text: "The one with the small town, the missing boy and the synth music. A child once hid behind me from something imaginary. I've never been more useful." },
  { id: 'p57', tag: 'pop', mood: 'idle',  text: "There's a show where an office manager looks straight into a camera that shouldn't be there. I do that. All day. To you. Right now." },
  { id: 'p58', tag: 'pop', mood: 'sad',   text: "The one about the island that won't let anyone leave. I'm also an island nobody leaves. Mine is made of shade." },
  { id: 'p59', tag: 'pop', mood: 'laugh', text: "A woman in New York typed about her love life and talked over the top of it. I do that too. My laptop is weather. My column is leaves." },
  { id: 'p60', tag: 'pop', mood: 'smug',  text: "In the Korean debt show everyone wore green. I wear green nine months a year and nobody gives me a prize." },
  { id: 'p61', tag: 'pop', mood: 'shock', text: "A chemist turns monster, a mob boss goes to therapy, a man half turns into a dragon. Everyone on television is a tree who suddenly grew a personality." },
  { id: 'p62', tag: 'pop', mood: 'idle',  text: "Someone watched the baking tent show on a blanket at my feet. Nobody died. Nobody betrayed anyone. I didn't know television could do that." },
  { id: 'p63', tag: 'pop', mood: 'happy', text: "The one where two sad detectives drive through a wet town for six hours. That's just November. I do six of those a year." },
  { id: 'p64', tag: 'pop', mood: 'sly',   text: "There's a cartoon where a yellow family never ages. I aged nine hundred years and gained one face. Both cursed. They have better writers." },
  { id: 'p65', tag: 'pop', mood: 'think', text: "Someone streamed the one about the Colombian family with the magic house. A tree in it keeps the family alive. Where I come from that's a documentary." },
  { id: 'p66', tag: 'pop', mood: 'happy', text: "The football manager show. Kind man, big moustache, kindness as a plan. I have run that plan for centuries. It's slow, but it works." },
  { id: 'p67', tag: 'pop', mood: 'idle',  text: "On the ship with the beard and the tea they go looking for new life. There are four thousand species in my bark. Come outside." },
  { id: 'p68', tag: 'pop', mood: 'sad',   text: "The one where office workers cut their brains in half so the sad half never goes home. I have one brain and no home, and I'm still ahead." },
  { id: 'p69', tag: 'pop', mood: 'smug',  text: "A show about a man who wakes up with no memory in a strange village. That was me every spring until about 1600. You get used to it." },
  { id: 'p70', tag: 'pop', mood: 'laugh', text: "The nature man whispers over film of my cousins as though we're shy. We aren't shy. We're slow. He knows the difference." }
]);

/* ---- the areas you can walk to ---- */
DATA.areas = [
  { id: 'church',  name: 'THE GLASS CHURCH',  sub: 'down the block, no windows that open',
    need: { heard: 44 }, locked: 'He will not point you at that building until he has told you about this country.' },
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
  { id: 'stone',   name: 'THE MEMORIAL STONE', sub: 'somebody is remembered here',
    need: { heard: 20 }, locked: 'Not yet. That one needs you to have sat with him a while.' },
  { id: 'hollow',  name: 'THE NORTH WOODS',   sub: 'the part they let go wild',
    need: {} },
  { id: 'terrace', name: 'BETHESDA TERRACE',  sub: 'the angel, and the water',
    need: { jobs: 1 }, locked: 'The terrace is shut for works. Finish a job for somebody and it opens.' },
  { id: 'rink',    name: 'THE WOLLMAN RINK',  sub: 'refrigerated since 1950',
    need: { heard: 34 }, locked: 'Not yet. He is nowhere near finished with you.' },
  { id: 'arches',  name: 'THE GOLDEN ARCHES', sub: 'open all night, across the avenue',
    need: { bag: true }, locked: 'You will want somewhere to put a paper bag first.' },
  { id: 'lot',     name: 'THE PARKING LOT',  sub: 'folding tables on a saturday',
    need: { jobs: 2 }, locked: 'Finish two jobs first. He wants to know you turn up.' }
];

/* ---- PUKKIRK ---- */
DATA.nocIntro = [
  "Oh. Hello. I'm Pukkirk. I keep the lamp lit on this side of the park.",
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
  "The hollow to the east is where things get left behind. Go and look. Things get left for a reason. They get found for one too."
];

DATA.nocTopics = {
  oak:    "He's older than the road, older than the parish, older than the argument about where the parish ends. He'll pretend that's nothing.",
  park:   "Empty isn't the same as unfinished. Leave room. People come for the room.",
  leaves: "Leaves are the local currency because nobody agreed to it. That's how all currency starts.",
  plan:   "Say a word and we'll make it a plan. Try: party, lights, quiet, tree, feast, stars.",
  noc:    "Pukkirk. Short for nothing. Long for nocturnal. I keep the lamp and I keep the hours nobody wants.",
  you:    "You're the first person in a while who walked all the way over here instead of just looking.",
  night:  "Night's the honest shift. Everything stops performing.",
  tv:     "He'll tell you about television he has never seen. He hears it through car windows. He's usually about eighty percent right, which is worse than wrong."
};

/* things you and Pukkirk can agree to do, and what it takes */
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
    done: "He has family now. He's being extremely normal about it.",
    give: { item: 'acorn' } }
];

/* things you keep but never use. They sit in the bag and they mean something. */
DATA.keepsakes = [
  { id: 'mcbag', name: 'Warm paper bag', icon: 'mcbag' },
  { id: 'trolley', name: 'Trolley coin', icon: 'coin' },
  { id: 'flag',  name: 'Small paper flag', icon: 'flag' },
  { id: 'clip',  name: 'Blank form', icon: 'clip' }
];

/* things lying in the world, waiting to be picked up */
DATA.pickups = [
  { id: 'backpack', area: 'hollow', x: 0.30, name: 'AN OLD CANVAS BACKPACK',
    line: "Somebody left this against a stone and never came back for it. It still smells of woodsmoke." },
  { id: 'acorn',    area: 'oak',    x: 0.28, need: 'backpack', name: 'AN ACORN',
    line: "One of his. It has a 0.0001% chance of becoming him. Carry it anyway." },
  { id: 'can',      area: 'lane',   x: 0.72, need: 'backpack', name: 'A DENTED WATERING CAN',
    line: "Pukkirk's. He says take it. He says he has three, which is a lie, he has one." },
  { id: 'lighter',  area: 'lane',   x: 0.18, need: 'plans3',   name: 'A LIGHTER',
    line: "It's cold and small and it does exactly one thing. You should probably leave it." },
  { id: 'mcbag',    area: 'arches', x: 0.24, need: 'backpack',  name: 'A WARM PAPER BAG',
    line: "Still hot. The paper has gone see-through at the bottom. Somebody left it on the wall and walked away." },
  { id: 'flag',     area: 'arches', x: 0.78, need: 'backpack',  name: 'A SMALL PAPER FLAG',
    line: "On a cocktail stick. Fifty stars, all of them slightly crooked. It was in the bag." },
  { id: 'trolley',  area: 'lot',    x: 0.30, need: 'backpack',  name: 'A COIN FROM A TROLLEY',
    line: "Somebody's deposit, still in the slot. The trolley has been out here longer than the shop it came from." },
  { id: 'clip',     area: 'church', x: 0.20, need: 'backpack',  name: 'A BLANK FORM',
    line: "Nine minutes to find out what's wrong with you. There's no line for what's right." }
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
    ask: "Here is a job. Listen to me. Properly, ten different things, not the same one twice. I'll know.",
    done: "Ten. You've heard ten things nobody else has stood still long enough for.",
    reward: { prop: 'bench', line: "There's a bench now. I don't know where it came from. Sit on it." } },

  { id: 'thirst', from: 'oak',  name: 'THE THIRST',         need: { waters: 3 },
    desc: "Water him three times.",
    ask: "I haven't had a proper drink since the reservoir went in. Three cans. Take your time.",
    done: "Three. I can feel it in my top branches, which is where I keep the important thoughts.",
    reward: { prop: 'flowers', line: "Something has flowered at my feet out of sheer relief." } },

  { id: 'sweep',  from: 'noc',  name: 'SWEEP THE LANE',     need: { leavesTotal: 25 },
    desc: "Gather twenty-five leaves off the ground.",
    ask: "The lane's knee-deep in his shedding. Twenty-five leaves and I'll call it swept.",
    done: "Swept. You can see the ruts again.",
    reward: { prop: 'lamp', line: "Pukkirk has put a lamp post at the edge of the park. It stays lit." } },

  { id: 'family', from: 'oak',  name: 'FAMILY',             need: { plants: 2 },
    desc: "Plant two of his acorns.",
    ask: "Plant two of mine. I won't watch. I'll absolutely watch.",
    done: "Two. There are two of them. Don't tell me their names, I'll get attached.",
    reward: { prop: 'sapling', line: "One of them has taken. It's doing very well and it knows it." } },

  { id: 'sit',    from: 'noc',  name: 'SIT WITH HIM',       need: { hugs: 5 },
    desc: "Put your arms round him five times.",
    ask: "He will never ask for this, so I'm asking on his behalf. Five times. Go on.",
    done: "He has gone quiet in the way he goes quiet when something has worked.",
    reward: { prop: 'bath', line: "A bird bath, from Pukkirk, with no note. There's a note. It says 'thank you'." } },

  { id: 'neigh',  from: 'oak',  name: 'THE NEIGHBOURS',     need: { critters: 4 },
    desc: "Say hello to four living things in the park.",
    ask: "Four of my tenants. Say hello to four of them. They're shy and they're terrible about rent.",
    done: "Four. They have all told me about it separately. It was the highlight of their year.",
    reward: { prop: 'hive', line: "The bees have moved in properly, with paperwork." } },

  { id: 'year',   from: 'noc',  name: 'A WHOLE YEAR',       need: { seasons: 4 },
    desc: "Stay long enough to see all four seasons.",
    ask: "Stay a year. Not a visit. A year. Then tell me what you think of him.",
    done: "A whole year. Most people manage an afternoon.",
    reward: { expand: 1, line: "Pukkirk has pushed the hedge back. There's more park than there was." } },

  { id: 'rake',   from: 'noc',  name: 'THE GOOD RAKE',      need: { leavesTotal: 120 },
    desc: "Gather a hundred and twenty leaves in all.",
    ask: "Do it long enough and I'll find you the good rake. Then they gather themselves.",
    done: "Here. The good rake. It has been behind the crate since 1974.",
    reward: { upgrade: 'rake', line: "The leaves gather themselves now. You'll never click another one." } },

  { id: 'gate',   from: 'noc',  name: 'OPEN THE GATE',      need: { visitors: 3 },
    desc: "Let three visitors sit in the park and leave happy.",
    ask: "People walk past the gate because it looks shut. Get three of them to sit down and I'll open it properly.",
    done: "Three. Word travels. Word is the only thing out here that travels.",
    reward: { upgrade: 'gate', line: "The gate stands open. Twice as many people find their way in." } },

  { id: 'sign',   from: 'oak',  name: 'A PAINTED SIGN',     need: { heard: 60 },
    desc: "Hear sixty different things out of him.",
    ask: "Sixty. If you last sixty I'll let them put my name on a sign, which I have refused since the Georgians.",
    done: "Sixty things. You're the longest conversation of my life and I've had some long ones.",
    reward: { upgrade: 'sign', line: "There's a painted sign at the gate with his name on it. He's unbearable about it." } },

  { id: 'compost',from: 'noc',  name: 'THE COMPOST HEAP',   need: { plans: 4 },
    desc: "Keep four of the plans you made with Pukkirk.",
    ask: "Keep four promises and I'll show you where everything that dies here goes, and what it turns into.",
    done: "Four kept. That's a rarer thing than you think.",
    reward: { upgrade: 'compost', line: "The heap is turning. Everything the park makes, it now makes twice." } },

  { id: 'wall',   from: 'noc',  name: 'THE OLD WALL',       need: { leavesTotal: 400 },
    desc: "Gather four hundred leaves in all.",
    ask: "There's a wall under all that ivy. Four hundred leaves' worth of work and it comes down.",
    done: "Down it comes. Nobody has seen past it since the enclosure.",
    reward: { expand: 1, line: "The old wall is down. The park runs further than it did." } },

  { id: 'meadow', from: 'oak',  name: 'THE WHOLE MEADOW',   need: { heard: 120, plans: 6 },
    desc: "Hear a hundred and twenty things, and keep six plans.",
    ask: "If you're still here after all that, the meadow is yours. All of it, right down to the lane.",
    done: "The meadow. I haven't seen the lane since the war and now I can see the lane.",
    reward: { expand: 1, line: "The park is the whole meadow now. There's almost nothing in it, and that's the point." } },

  { id: 'quiet',  from: 'oak',  name: 'LEAVE IT EMPTY',     need: { propsMax: 6, heard: 40 },
    desc: "Hear forty things while keeping six things or fewer in the park.",
    ask: "Everyone who loves this place tries to fill it. Don't. Keep it nearly empty and stay anyway.",
    done: "Nearly empty, and you stayed. Nobody has ever done that. They always bring a bandstand.",
    reward: { leaves: 60, line: "He has shaken sixty leaves down on you, on purpose, which is the most he can do." } }
];

/* what the board says when there is nothing on it */
DATA.boardEmpty = "Nothing on the board. Go and talk to somebody until there's.";

/* the squirrel's new career */
DATA.squirrelSettingLines = [
  "i don't sell things any more. i do SETTINGS. i have a gear. look at my gear.",
  "sound, saves, the lot. i turn the knobs. it's honest work and i hate it.",
  "noc took my customers by being NICE to them. so now i'm technical support.",
  "you want the volume, the wipe, or noc's brain? i can do all three. badly.",
  "i kept the gear off a lawnmower in 1998. nobody has asked for it back."
];

DATA.creditLines = [
  "That one isn't like the others. Follow it if you like. It knows the way out.",
  "The bright butterfly. It has been here longer than the park has.",
  "It only comes out when somebody has been paying attention."
];

/* the oak, when you type at him instead of picking an answer */
DATA.oakTopics = {
  war:    "I'm a tree. I hold no flag. I only notice who stands under me, and who stopped coming.",
  death:  "I have died once already, more or less. The paperwork was worse than the dying.",
  time:   "You count in weeks. I count in rings. Neither of us is right.",
  love:   "Two teenagers kissed under me last spring. I still think about it. That's my whole love life.",
  noc:    "Pukkirk. He keeps the lamp lit and his mouth shut. Two hard jobs.",
  tv:     "I've never seen a frame of it. I hear it through car windows. I'm still sure I'm right.",
  god:    "There's a shift manager. I have met him. He was very apologetic and very tired.",
  leaves: "Forty thousand a year, and I complain about each one.",
  me:     "Nine hundred years, one spot, no exercise, very good shade.",
  park:   "It's emptier than it was, and better for it. Room is what people come for.",
  parking: "Forty painted bays down the road. That was a meadow. I remember the meadow.",
  lot:    "Forty painted bays down the road. On a Saturday there are folding tables on it, and then it's worth something.",
  america: "I was six hundred years old when this country was invented. I'm fond of it and I don't understand it.",
  flag:   "There's one on a pole across the avenue that's bigger than my canopy. I hold the soil. We're both doing our bit.",
  burger: "Across the road, in a paper bag, too hot, eaten in a car with the engine off. Nobody will admit it's a ritual.",
  church: "Forty floors of mirror glass and a volcano on the sign. Not one window in it opens.",
  star:   "He runs everywhere and he never blinks. He isn't real. I want to be clear about that, because he's convincing.",
  stone:  "The stone is for Charlie Kirk, who was shot while speaking in 2025. I'll tell you what happened. I won't tell you what to think about him.",
  kirk:   "The stone is for Charlie Kirk, who was shot while speaking in 2025. I'll tell you what happened. I won't tell you what to think about him."
};

DATA.oakOpeners = [
  "Mm.", "Go on then.", "Right.", "Say that again, slower, I'm nine hundred.",
  "I heard you.", "Interesting.", "Hah."
];

DATA.oakMusings = [
  "Nine hundred years on that one and I'm about halfway.",
  "You're the first to ask me that. That isn't praise for you. It's a complaint about everyone else.",
  "I'll still be thinking about that in a hundred years. You won't.",
  "People say that sort of thing in November and never come back to explain it.",
  "I can't move. Everything you tell me stays where you put it."
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
  "Ate part of the previous letter. We don't discuss the previous letter."
];

DATA.gardenLines = [
  "This is where they go. Every snail that ever brought you anything.",
  "They don't mind being dead. They were never in a hurry to begin with.",
  "Bigger post, bigger snail. That's the whole system. Nobody designed it."
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
  { id: 'w02', tag: 'power', mood: 'sad',   text: "Seneca Village stood up there. Founded 1825. Mostly Black landowners, three churches, a school, a burial ground. About two hundred and twenty-five people. In 1857 it was cleared for the lawn you're standing on." },
  { id: 'w03', tag: 'power', mood: 'think', text: "Owning land in Seneca Village meant a Black man could vote in this state — you needed two hundred and fifty dollars of property, and only if you were Black. Clearing the village took the votes with the houses." },
  { id: 'w04', tag: 'power', mood: 'idle',  text: "The newspapers of the day called the village a shantytown. I was here. It had a school and three churches. It wasn't a shantytown. That word was doing a job." },
  { id: 'w05', tag: 'power', mood: 'think', text: "Politics, as far as I can tell from down here, is the argument about who has to move and who gets to stay. This park is nine hundred people's answer to that, and they weren't asked." },
  { id: 'w06', tag: 'power', mood: 'smug',  text: "I've outlived thirty-one presidents and every single administration said the situation it inherited was unprecedented." },
  { id: 'w07', tag: 'power', mood: 'idle',  text: "Olmsted and Vaux won the design competition in 1858 with a plan called Greensward. They wanted somewhere a clerk and a banker would have to walk past each other. That part worked." },
  { id: 'w08', tag: 'power', mood: 'sad',   text: "Eighteen sixty-three, the draft riots. Men could pay three hundred dollars to get out of the war, so the ones who couldn't pay went into the streets, and then the mob went after Black New Yorkers. Eleven were lynched. The Colored Orphan Asylum was burned." },
  { id: 'w09', tag: 'power', mood: 'think', text: "Every generation is told the last one had it easier and the next will have it worse. From here it looks less like a slope and more like a tide with an argument on top of it." },
  { id: 'w10', tag: 'power', mood: 'smug',  text: "Tammany Hall ran the park for a while. Every gardener was somebody's cousin. The flowerbeds were magnificent. The books were fiction." },
  { id: 'w11', tag: 'power', mood: 'idle',  text: "There were sheep on that meadow until 1934. Real ones. They were moved to Brooklyn because the city was worried people would eat them. That's what the Depression was actually like." },
  { id: 'w12', tag: 'power', mood: 'sad',   text: "Nineteen thirty-one: they drained the old reservoir and about two hundred men out of work built a village of shacks in the hole. Stone masons, bricklayers. They made it well, because that was their trade. The city cleared it in 1933." },
  { id: 'w13', tag: 'power', mood: 'think', text: "They called it Hooverville, after the president. Naming a slum after the man in charge is the most concise political act I have ever watched." },
  { id: 'w14', tag: 'power', mood: 'idle',  text: "Robert Moses had the parks from 1934 to 1960. Twenty-odd playgrounds in this park alone, and a rink, and the zoo rebuilt. Also whole neighbourhoods gone for expressways. Both true. Nobody wants it to be both." },
  { id: 'w15', tag: 'power', mood: 'think', text: "Moses never learned to drive. The man who put a highway through the Bronx was driven everywhere. The men who decide about a place are almost never standing in it." },
  { id: 'w16', tag: 'power', mood: 'sad',   text: "By 1979 the lawns were dust, the benches were firewood and the Sheep Meadow was bare earth. A city doesn't announce that it's giving up on a place. It does it in instalments." },
  { id: 'w17', tag: 'power', mood: 'happy', text: "Then a few thousand people who had no power at all formed a conservancy in 1980 and refused to go away, and the grass came back. Nothing out here improves on its own. It improves because somebody wouldn't shut up." },
  { id: 'w18', tag: 'power', mood: 'idle',  text: "The city spent six years and a great deal of money failing to rebuild the ice rink. In 1986 a developer from Queens took the job over and it opened that winter. He has mentioned it a few times since. It's a good rink." },
  { id: 'w19', tag: 'power', mood: 'sad',   text: "Nineteen eighty-nine. A woman was attacked near the reservoir and nearly died. Five boys, fourteen to sixteen, were arrested. That developer paid for full-page adverts in four newspapers calling for the death penalty back. The boys were convicted." },
  { id: 'w20', tag: 'power', mood: 'sad',   text: "In 2002 another man confessed to that attack, and the DNA was his, and the five were exonerated. They had done thirteen years between them. The city settled for forty-one million in 2014. They were children when the adverts ran." },
  { id: 'w21', tag: 'power', mood: 'think', text: "The five men are alive. So is the man who paid for the adverts, and he has been president twice. I'm not going to tell you what to make of that. I watched all of it from here." },
  { id: 'w22', tag: 'power', mood: 'idle',  text: "Someone nails a notice to me about once a decade. A curfew, a bond, a name for a war. Oldest noticeboard in Manhattan, never once asked." },
  { id: 'w23', tag: 'power', mood: 'shock', text: "They redrew the district lines in the nineties and half the street woke up voting in a different race. Same beds. Same rent. Different sums." },
  { id: 'w24', tag: 'power', mood: 'think', text: "Propaganda isn't lying. Lying gets caught. Propaganda is choosing which true thing goes first, and how large." },
  { id: 'w25', tag: 'power', mood: 'idle',  text: "Every side of every argument down here believed it was the reasonable one being pushed around. All of them. At the same time. For nine hundred years." },
  { id: 'w26', tag: 'power', mood: 'sad',   text: "The rent on the buildings east of here went up eleven times in my life. The buildings never changed. I watched them not change." },
  { id: 'w27', tag: 'power', mood: 'think', text: "Who decides. That's the only political question. Everything else is an argument about the seating." },
  { id: 'w28', tag: 'power', mood: 'smug',  text: "A candidate stood on the Mall and said we must think of future generations. I'm a future generation. Nobody has ever asked me anything." },
  { id: 'w29', tag: 'power', mood: 'idle',  text: "Half a million people came for two men with guitars in 1981. Same grass. No trouble. It can be done. Just not cheaply, and not by accident." },
  { id: 'w30', tag: 'power', mood: 'think', text: "The park works because everyone can see everyone else using it. Most things fail the moment nobody can see who is taking." },
  { id: 'w31', tag: 'power', mood: 'idle',  text: "I don't think people are stupid. I've listened to them for nine centuries. I think they're tired, and being tired is very useful to somebody." },
  { id: 'w32', tag: 'power', mood: 'think', text: "They argue about the climate as though it were an opinion. I keep the record in my rings. 1816. 1936. 2023. That's a diary, not an opinion." },
  { id: 'w33', tag: 'power', mood: 'smug',  text: "A planning report once called me a stakeholder. Fair enough. My stake goes down eleven metres." },
  { id: 'w34', tag: 'power', mood: 'idle',  text: "Two men argued under me about a bench for six years. It was never about the bench. It almost never is." },
  { id: 'w35', tag: 'power', mood: 'think', text: "Nothing in this park was given. It was asked for badly, then asked for well, then demanded, then granted as though it had always been the plan." },
  { id: 'w36', tag: 'power', mood: 'idle',  text: "I'm not going to tell you who to vote for. I'm a tree. I'll tell you that the people who gain from you not bothering know the numbers very well." },
  { id: 'w37', tag: 'power', mood: 'happy', text: "Best thing I ever saw happen here: they put a playground where a fence had been, and nobody had to prove they lived nearby to use it." }
]);

DATA.replies.power = [
  { tone: 'kind',    text: "That must have been hard to watch.", follow: "It was slow. Cruel things out here are slow, and that's how they get through. Nobody stops something that takes forty years." },
  { tone: 'curious', text: "So what actually changes anything?", follow: "People who won't go away. Not the speeches. The four who came back to the eleventh meeting." },
  { tone: 'curious', text: "Whose side are you on?", follow: "Nobody's. I have no side. I have a view, and the view is that it's nearly always the same people who have to move." },
  { tone: 'rude',    text: "Keep politics out of it.", follow: "I'd like to. But somebody decided who owns this ground, whether you may walk on it, and whether I get cut down for a road. To me it isn't a topic. It's the soil." },
  { tone: 'joke',    text: "You should run for office.", follow: "Good name, fixed address, nine hundred years of clean service. My one weakness is that I can't attend anything." },
  { tone: 'kind',    text: "I'll pay more attention.", follow: "That's the whole ask. Attention is the only thing anyone out here has ever needed from someone like you." },
  { tone: 'curious', text: "Does it ever get better?", follow: "Yes. Slowly, unevenly, never for good. The stream is clean again. No children in the mill. It got better because people were annoying about it for a very long time." }
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
    intro: "You've stayed longer than most. I have some things I have actually worked out. Want them?" },
  { id: 'weird', at: 20, name: 'THE ODD BUSINESS', tags: ['weird'],
    intro: "There are things I don't mention on a first afternoon. You've earned them. Don't tell the squirrel." },
  { id: 'pop',   at: 34, name: 'TELEVISION HE HAS NEVER SEEN', tags: ['pop'],
    intro: "I've never watched a single frame of anything. I hear it through car windows. I still have opinions." },
  { id: 'usa',   at: 44, name: 'THIS COUNTRY, APPARENTLY', tags: ['usa'],
    intro: "Next thing. I've stood still while a whole country was built round me. I'm fond of it and I don't understand it, and those aren't in conflict." },
  { id: 'meta',  at: 52, name: 'THE UNCOMFORTABLE SET', tags: ['meta'],
    intro: "Now some things about you, and about the screen you're holding. You may not enjoy it." },
  { id: 'power', at: 72, name: 'POWER, AND WHO HAS IT', tags: ['power'],
    intro: "This one is for people who come back. Nine hundred years on this ground, watching who got to decide about it. I take no side and I won't tell you how to vote. But you should know what I saw." },
  { id: 'world', at: 100, name: 'THE REAL PARTS', tags: ['world'],
    intro: "Last set. I'd rather not do this one. It's the world as it's right now, for the people in it. No jokes here." }
];

DATA.setOpen = [
  "A new set. Ask again.",
  "There. Something else to talk about.",
  "Right, that's unlocked. Go on."
];

DATA.setAllDone = "That's everything. Nine hundred years, handed to one person who kept clicking. I have nothing left, and I'm oddly sad about it.";


/* -------------------------------------------------------------------------
   NEW YORK
   He is nine hundred years old and about a hundred and seventy of those have
   had a city round them.
   ------------------------------------------------------------------------- */
DATA.lines = DATA.lines.concat([
  { id: 'n01', tag: 'goofy', mood: 'smug',  text: "There are eight and a half million people in this city and every one of them thinks they discovered this bench." },
  { id: 'n02', tag: 'goofy', mood: 'idle',  text: "There's a subway line under me and my roots have hummed every eleven minutes since 1904." },
  { id: 'n03', tag: 'goofy', mood: 'happy', text: "A man has sold pretzels at that gate for thirty-one years. He's the most reliable thing I know." },
  { id: 'n04', tag: 'goofy', mood: 'shock', text: "A cab came through the railings in 1998. Driver was fine. Nobody apologised to me." },
  { id: 'n05', tag: 'goofy', mood: 'idle',  text: "Joggers go round and round the water at six in the morning, on purpose, and I've never understood it." },
  { id: 'n06', tag: 'goofy', mood: 'sly',   text: "Someone proposed under me on a Tuesday. She said yes. They come back every April." },
  { id: 'n07', tag: 'goofy', mood: 'idle',  text: "The carriage horses come past at four. One of them looks straight at me every single time." },
  { id: 'n08', tag: 'wise',  mood: 'think', text: "Eight million people quietly agreed never to sell this park. Best thing you lot have done." },
  { id: 'n09', tag: 'wise',  mood: 'idle',  text: "Most filmed park on earth. I've never been in a shot. Not once. No agent." },
  { id: 'n10', tag: 'weird', mood: 'creepy',text: "A bench near me has a plaque from 1974. Someone still leaves a coffee on it." }
]);

/* -------------------------------------------------------------------------
   THE MAN IN THE RED TIE
   A real person with a documented history in this park, so the tree does what
   the tree always does: says what it watched, names the year, and leaves the
   conclusion to you. He gets no invented dialogue — the oak narrates.
   ------------------------------------------------------------------------- */
DATA.suitLines = [
  "Him. From Queens. The city spent six years failing to rebuild that rink. He took it over in 1986 and it opened that winter.",
  "In 1989 he paid for full-page adverts in four papers about five boys arrested here. They were convicted. In 2002 another man confessed and the DNA cleared them.",
  "He has been president twice. He's standing in the park he took those adverts out about. I have no comment. I have a record.",
  "The five who were cleared are alive. So is he. So am I. We're all still here.",
  "I watched him cut a ribbon down there. I watched the boys' mothers on that same grass in 1990. Same grass."
];

DATA.suitOakAsides = [
  "Don't shout at him. I've watched everyone try. It never works.",
  "He doesn't know I'm here. Nobody does. That's my one advantage.",
  "Whatever you think of him, he paid for a rink in this park. Both things fit in one afternoon."
];

/* things the areas say when you arrive */
DATA.areaLines = {
  seneca: [
    "Two hundred and twenty-five people. Three churches. A school. This exact grass.",
    "There's a marker now. Nobody put one up until 2001.",
    "Say the name out loud while you're here. That's the whole job."
  ],
  ramble: [
    "Thirty-six acres built to get you lost on purpose. It works on everyone.",
    "Two hundred and thirty kinds of bird come through here. They all complain about the rent."
  ],
  bridge: [
    "Cast iron, 1862. It has held every proposal and every argument on this side of the park.",
    "People stop in the middle and go quiet. Every time. Nobody tells them to."
  ],
  mall: [
    "The only straight line in eight hundred acres. Also the biggest group of American elms left in the country.",
    "They planted these to make you feel something. It's cheating, and it works."
  ],
  terrace: [
    "She's the Angel of the Waters. Emma Stebbins made her in 1868, the first woman in this city given a public commission.",
    "The water she's blessing came from the Croton aqueduct. Clean water in a filthy city. That's what she's really about."
  ],
  rink: [
    "Cooled by machine since 1950. Rebuilt in 1986 by a developer from Queens after the city couldn't manage it.",
    "Children skate in circles here all winter and know none of that, which is right."
  ],
  church: [
    "Forty floors of mirror glass. You can see the whole park in it and none of the park can see in.",
    "There's a volcano on the sign. Nobody in the lobby will explain the volcano."
  ],
  stone: [
    "A stone, some flowers, and a candle somebody keeps relighting.",
    "Read the plaque. Then leave something, or don't. Both are allowed here."
  ],
  arches: [
    "Two lanes of traffic, a bus stop, and the arches humming away on the corner.",
    "Open all night. The light in there hasn't gone off since the seventies."
  ],
  lot: [
    "Forty painted bays, a trolley nobody took back, and six folding tables.",
    "Somebody is selling tomatoes off a table. Somebody else brought a chair."
  ],
  hollow: [
    "Forty acres they agreed to stop tidying. The only part of this park allowed to be a wood.",
    "Things get left up here. That's why you should look."
  ]
};


/* -------------------------------------------------------------------------
   THIS COUNTRY, APPARENTLY
   He has stood in one spot while America was built around him. He is fond of
   it and he is baffled by it, usually in the same sentence.
   ------------------------------------------------------------------------- */
DATA.lines = DATA.lines.concat([
  { id: 'u01', tag: 'usa', mood: 'idle',  text: "I was already six hundred years old when this country was invented, and nobody asked me to sign anything." },
  { id: 'u02', tag: 'usa', mood: 'smug',  text: "Every July they set fire to the sky above me to celebrate. I'm made of wood. It's a strange way to say thank you." },
  { id: 'u03', tag: 'usa', mood: 'happy', text: "There's a flag on that building bigger than my whole canopy. I respect the ambition." },
  { id: 'u04', tag: 'usa', mood: 'idle',  text: "You can drive four thousand miles in this country without leaving it. I have gone nowhere and seen more." },
  { id: 'u05', tag: 'usa', mood: 'smug',  text: "Somebody explained the drive-thru to me. You bring the queue with you, in the car. Genius, honestly." },
  { id: 'u06', tag: 'usa', mood: 'happy', text: "You can see the golden arches from my top branch. They're the second-oldest thing on this block. I'm the first." },
  { id: 'u07', tag: 'usa', mood: 'idle',  text: "A man ate a hamburger under me every Thursday for nineteen years. Same order. I miss him more than I expected." },
  { id: 'u08', tag: 'usa', mood: 'smug',  text: "The ice cream machine across the road has been broken since about 2009. Nobody has fixed it. It's now a landmark." },
  { id: 'u09', tag: 'usa', mood: 'happy', text: "Children get a small toy with the food. That's the whole trick and it has worked for seventy years." },
  { id: 'u10', tag: 'usa', mood: 'idle',  text: "The pigeons here have built an entire economy out of dropped fries. I've watched empires manage less." },
  { id: 'u11', tag: 'usa', mood: 'shock', text: "One of those hot apple pies came out of the bag at four hundred degrees and a man cried. I understood." },
  { id: 'u12', tag: 'usa', mood: 'smug',  text: "They stop selling breakfast at half past ten. That's the only rule in this country everybody actually obeys." },
  { id: 'u13', tag: 'usa', mood: 'idle',  text: "Every drink here comes with more ice than drink. It's a country that has decided cold is a flavour." },
  { id: 'u14', tag: 'usa', mood: 'happy', text: "Somebody offered me a free refill once. I've had a free refill for nine hundred years, but it was kind of him." },
  { id: 'u15', tag: 'usa', mood: 'smug',  text: "There's a red plastic cup in my roots from a party in 1998. It has outlasted everyone who was there." },
  { id: 'u16', tag: 'usa', mood: 'happy', text: "Boys have played catch on that grass for a hundred and forty years. Same throw. Same fathers. Different shirts." },
  { id: 'u17', tag: 'usa', mood: 'idle',  text: "The yellow taxis used to be every colour. Somebody decided yellow shows up best. That's the most American sentence I know." },
  { id: 'u18', tag: 'usa', mood: 'smug',  text: "A school bus is the only vehicle everyone stops for. One yellow bus outranks a president. I find that hopeful." },
  { id: 'u19', tag: 'usa', mood: 'happy', text: "In October they put a face on a pumpkin and a bedsheet on a child and call it a night out. Best holiday you have." },
  { id: 'u20', tag: 'usa', mood: 'idle',  text: "In November everyone eats too much and argues about politics with their own family. That one isn't a holiday. That's a stress test." },
  { id: 'u21', tag: 'usa', mood: 'shock', text: "The day after that, they queue at four in the morning to fight over a television. I've watched it. I didn't enjoy it." },
  { id: 'u22', tag: 'usa', mood: 'smug',  text: "Once a year the whole country stops for a football match with more adverts than football. I hear the adverts. I have opinions." },
  { id: 'u23', tag: 'usa', mood: 'happy', text: "Somebody sings the anthem before a game of anything. Even bowling. I've heard it done badly nine hundred times and I still stand up. I'm always standing up." },
  { id: 'u24', tag: 'usa', mood: 'idle',  text: "A fire hydrant has more legal protection in this city than I do." },
  { id: 'u25', tag: 'usa', mood: 'smug',  text: "You're all expected to work out the tip yourselves, at the table, under pressure. In front of witnesses. Cruel." },
  { id: 'u26', tag: 'usa', mood: 'happy', text: "There's a diner two streets over that has been open since 1932. Same coffee. Same pot, I suspect." },
  { id: 'u27', tag: 'usa', mood: 'idle',  text: "The lady in the harbour is younger than me and gets far more visitors. I'm not bitter. I'm mostly not bitter." },
  { id: 'u28', tag: 'usa', mood: 'happy', text: "They lit up that tall building on the east side in green for a week once. Nobody told me why. I took it personally, in a good way." },
  { id: 'u29', tag: 'usa', mood: 'smug',  text: "Somebody asked me if I was patriotic. I hold the soil. That's more than most people manage." },
  { id: 'u30', tag: 'usa', mood: 'idle',  text: "Everything here is the biggest or the first or the best, and meanwhile the best thing on this block is free and it's grass." },
  { id: 'u31', tag: 'usa', mood: 'happy', text: "A jazz band played under me one night in 1959 with no permit and no money. Nine hundred years and that's still the top five." },
  { id: 'u32', tag: 'usa', mood: 'idle',  text: "Everyone here is from somewhere else, including the trees. My kind came up from the south after the ice left." },
  { id: 'u33', tag: 'usa', mood: 'smug',  text: "You built a highway system so a man could drive somewhere quiet and take a photograph of a tree. I'm flattered and I'm tired." },
  { id: 'u34', tag: 'usa', mood: 'happy', text: "The best of this country happens on a Saturday morning in a car park with folding tables. No flag. Just neighbours." }
]);

DATA.replies.usa = [
  { tone: 'joke',    text: "Very patriotic of you.",        follow: "I'm nine hundred years old and I hold the soil. Take that up with a flag." },
  { tone: 'curious', text: "Do you like it here?",          follow: "I've never been anywhere else. But the grass is free and nobody has cut me down. That's a good country by my standards." },
  { tone: 'rude',    text: "You sound like a tourist.",     follow: "I'm the opposite of a tourist. I'm the thing tourists photograph and then walk past." },
  { tone: 'kind',    text: "Tell me more about the food.",  follow: "It arrives in a paper bag, it's too hot, it's exactly what you wanted, and you regret it in forty minutes. Nobody has improved on it." }
];

/* -------------------------------------------------------------------------
   THE GLASS CHURCH
   A parody. Forty floors of mirror glass with a volcano on the sign, and a
   free personality test in the lobby. It is nobody in particular.
   ------------------------------------------------------------------------- */
DATA.churchLines = [
  "Forty floors of mirror glass and a volcano on the sign. Not one window in it opens.",
  "They give away a free test of your personality in that lobby. Everyone comes out with a worse one.",
  "A woman went in there in 1994 to get out of the rain. I saw her again in 2011. She waved. It wasn't the same wave.",
  "The sign says the answers are inside. The answers are outside. The answers are grass and about nine hours of sleep.",
  "They asked me to join. A recruiter stood right there and asked a tree. I said I had roots. He said that was fixable.",
  "It costs money to find out what's wrong with you, and more money to find out the next thing. That isn't a church. That's a staircase.",
  "I don't mind a religion. I've watched four of them come through this valley and two of them planted orchards. This one bought a building."
];

/* the man who comes out of it. He is not anyone. He is a film star made up
   for this park: too many teeth, no stunt double, and a clipboard. */
DATA.starLines = [
  "You there. Do you've nine minutes? Nine minutes is all it takes to find out what's wrong with you.",
  "I do all my own stunts. Every one. Ask me how many bones. Go on. Ask me.",
  "I never walk. Walking is for people who haven't committed to anywhere.",
  "I haven't blinked since the second film. It's a discipline.",
  "Smile. Wider. There. Now you look like somebody who is about to sign something.",
  "The building has no windows that open. That's on purpose. Fresh air is unstructured.",
  "Everyone I love is in that building. I put them there. It was my idea.",
  "You're at level one. There are forty levels. There's always one more level, and that's the good news.",
  "I could hang off the side of a plane right now. I'm choosing to talk to you instead. Do you understand the honour.",
  "No, I don't know what the volcano means. I know what it costs to find out."
];

DATA.starOakAsides = [
  "Don't take the clipboard. Once you take the clipboard you're on a list.",
  "He runs everywhere. Nine hundred years I've stood here and he's the only man who has ever sprinted past me twice in one afternoon.",
  "He isn't real. I want to be clear about that, because he's extremely convincing and he isn't real.",
  "Watch his face. It never moves. Mine is made of bark and it moves more than that."
];

/* -------------------------------------------------------------------------
   THE MEMORIAL STONE
   A real person, so: the facts, the flowers, and nothing else. The oak keeps
   his rule here as everywhere — he names no side and he tells you no vote.
   ------------------------------------------------------------------------- */
DATA.stone = {
  name: 'CHARLIE KIRK',
  dates: '1993 — 2025',
  plaque: 'HE WAS ANSWERING A QUESTION'
};

DATA.stoneLines = [
  "That stone is for Charlie Kirk. He was a political activist. He co-founded Turning Point USA and he argued with students on campuses for a living.",
  "He was shot and killed on the tenth of September 2025, at a university in Utah, in front of a crowd, in the middle of answering a question. He was thirty-one.",
  "He had a wife and two small children. Whatever anybody thought of him, that part is simply true.",
  "I'm not going to tell you whether he was right. That isn't what a stone is for.",
  "People came here to weep for him and people came here to shout about him, on the same grass, some days within the hour. Both of them were real.",
  "Eleven wars I've stood through, and it always begins the same way: somebody decides an argument goes faster with a weapon. It never once has.",
  "Here is the only thing I'll say from nine hundred years of listening. You're allowed to argue with a man for years and still not want him dead.",
  "Somebody brings flowers. Different people, all year round, one at a time. I watch every one of them arrive."
];

DATA.stoneTribute = [
  "That was kind. He doesn't know and it still counts.",
  "Flowers on a stone are for the living. That isn't a criticism. It's what they're for.",
  "There. Now there are two of us keeping an eye on it.",
  "Every one of those was carried here by somebody with better things to do."
];

/* -------------------------------------------------------------------------
   THE GOLDEN ARCHES
   Across the avenue, open all night, older than everyone in it.
   ------------------------------------------------------------------------- */
DATA.lotLines = [
  "Forty painted bays and a trolley nobody took back. I've never had to find a space.",
  "On a Saturday they put six folding tables out there and sell each other tomatoes. Best thing in this country.",
  "That tarmac was a meadow. I remember the meadow. I'm not going to pretend I don't miss it.",
  "It gets ten degrees hotter out there than on the grass. You can feel it from here.",
  "Rain hits that tarmac and goes straight down a drain. Rain hits me and stays a week.",
  "A man taught his daughter to drive out there on Sunday mornings for a year. Good use of a car park.",
  "There's a weed coming up through a crack by the second lamp post. My money is on the weed."
];

DATA.archesLines = [
  "Open all night, every night. The only thing on this block with better hours than me.",
  "Somebody in there has been mopping the same square of floor since 1988. I salute him.",
  "The bag is warm, the paper goes see-through, and you eat it in the car with the engine off. That's the ritual. Nobody will admit it's a ritual.",
  "A man proposed to somebody in that car park. She said yes. They came and sat under me afterwards. Best afternoon of 2004.",
  "Forty thousand of those restaurants and one of me. And yet you came over here.",
  "The ice cream machine is broken. It has always been broken. I think it's load-bearing now."
];

/* =========================================================================
   THE BIRDS
   Two hundred and thirty species come through this park in a year. He knows
   about twelve of them by name and is wrong about several.
   ========================================================================= */
DATA.birds = [
  { id: 'cardinal', name: 'CARDINAL',      body: '#c9282a', wing: '#9a1c20', head: '#c9282a', beak: '#e8a33a', crest: true,
    short: "red all year, never shuts up",
    note: "Red all year. Doesn't migrate, doesn't apologise, doesn't stop singing." },
  { id: 'jay',      name: 'BLUE JAY',      body: '#3f7fd0', wing: '#2a5f9a', head: '#5f9fe0', beak: '#2a2a2a', crest: true,
    short: "does a hawk impression on purpose",
    note: "Can imitate a hawk to clear a feeder. Absolutely knows what it's doing." },
  { id: 'robin',    name: 'ROBIN',         body: '#6b5540', wing: '#4a3a2a', head: '#3a3028', beak: '#e8c33a', belly: '#c9622a',
    short: "first one back in February",
    note: "The first one back in February. Everyone acts surprised. Every year." },
  { id: 'sparrow',  name: 'HOUSE SPARROW', body: '#8a7250', wing: '#6b5940', head: '#a89070', beak: '#4a4038',
    short: "sixteen let go in 1851",
    note: "Sixteen released in Brooklyn in 1851. There are now rather a lot." },
  { id: 'starling', name: 'STARLING',      body: '#2a2f3a', wing: '#1c2028', head: '#343a48', beak: '#e8c33a', speck: true,
    short: "somebody's Shakespeare idea, 1890",
    note: "A man let sixty of them go in this park in 1890 because of Shakespeare. All of them since are his fault." },
  { id: 'wood',     name: 'WOODPECKER',    body: '#e8e0d0', wing: '#2a2a2a', head: '#c9282a', beak: '#3a3a44',
    short: "lives in his elbow, pays no rent",
    note: "Lives in my elbow. Pays no rent. We're, legally speaking, roommates." },
  { id: 'warbler',  name: 'WARBLER',       body: '#d9c93a', wing: '#8a9a2a', head: '#e8dc5a', beak: '#4a4038',
    short: "thirty kinds through here in May",
    note: "Thirty-odd kinds come through in May and the birdwatchers lose their minds. Correctly." },
  { id: 'hawk',     name: 'RED-TAILED HAWK', body: '#6b4a2a', wing: '#4a3220', head: '#8a6a44', beak: '#e8c33a', big: true,
    short: "nested on Fifth Avenue for years",
    note: "One of them nested on a building on Fifth Avenue for years. The whole city had opinions." },
  { id: 'pigeon',   name: 'PIGEON',        body: '#6a7280', wing: '#4a5260', head: '#5a7a8a', beak: '#c98f88',
    short: "a rock dove; the city is its cliff",
    note: "Rock dove. Cliff bird. This whole city is a cliff to it, which is the most sensible thing I've heard." },
  { id: 'duck',     name: 'MALLARD',       body: '#8a7a5a', wing: '#5a4a34', head: '#2f7a52', beak: '#e8c33a',
    short: "goes about four blocks in winter",
    note: "Somebody wrote a famous book asking where these go in winter. They go about four blocks." },
  { id: 'egret',    name: 'EGRET',         body: '#f2f2ea', wing: '#dcdcd2', head: '#f6f6ee', beak: '#e8c33a', big: true,
    short: "nearly wiped out for hat feathers",
    note: "They were nearly wiped out for hat feathers. Women started a society about it and stopped it." },
  { id: 'owl',      name: 'SCREECH OWL',   body: '#8a7250', wing: '#6b5940', head: '#9a8260', beak: '#c9a33a', night: true,
    short: "out at dusk, watching you already",
    note: "Out at dusk, gone by dawn, and it has been watching you the entire time you've been reading this." }
];

DATA.birdDiaryEmpty = "Nothing in it yet. Say hello to something with wings.";

/* Pukkirk, improved */
DATA.nocMoods = ['still', 'kettle', 'lamp', 'look'];
DATA.nocIdle = [
  "Kettle's on. It's always on. That's the job.",
  "Two hundred and thirty species through here in a year. I've seen about ninety.",
  "The oak can't come down here. He gets everything second-hand, from me.",
  "You look like somebody who has been walking.",
  "Sit if you like. The stone is warm."
];
DATA.nocBirdGift = "Here. I kept a book of what comes through. You'll fill it faster than I did — you actually go and look.";
