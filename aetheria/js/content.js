/* =========================================================================
   CONTENT — the part that actually teaches you something.

   Questions are stored as flat arrays [prompt, correct, w1, w2, w3] because
   there are a few hundred of them and object literals would triple the file.
   Everything is expanded once at load.
   ========================================================================= */
const CONTENT = (() => {

  /* ==== ENEMIES ========================================================== */
  const ENEMIES = {
    slime:   { spr:'m_slime',  name:'GLOOP',        hp:40,  atk:6,  el:'nature' },
    slimeB:  { spr:'m_slime',  name:'BRINE GLOOP',  hp:52,  atk:7,  el:'water',  swap:{ b:'#49a7ff', l:'#a8dcff', d:'#2358c9', k:'#0d2a4a' } },
    bat:     { spr:'m_bat',    name:'NIGHT FLIT',   hp:46,  atk:8,  el:'arcane' },
    batB:    { spr:'m_bat',    name:'EMBER FLIT',   hp:58,  atk:10, el:'fire',   swap:{ b:'#ff9330', l:'#ffd23f', d:'#c35a10', k:'#4a1a00' } },
    shroom:  { spr:'m_shroom', name:'CAPTAIN CAP',  hp:62,  atk:9,  el:'nature' },
    shroomB: { spr:'m_shroom', name:'SPORE BARON',  hp:78,  atk:11, el:'arcane', swap:{ r:'#a35cff', d:'#6a27c8', m:'#3a1a5a' } },
    golem:   { spr:'m_golem',  name:'QUARRY GOLEM', hp:96,  atk:12, el:'stone', guard:true },
    golemB:  { spr:'m_golem',  name:'PRISM GOLEM',  hp:120, atk:14, el:'arcane', guard:true, swap:{ b:'#a35cff', l:'#e0b6ff', d:'#6a27c8', w:'#ffd23f' } },
    wisp:    { spr:'m_wisp',   name:'SKY WISP',     hp:70,  atk:11, el:'storm' },
    wispB:   { spr:'m_wisp',   name:'STORM WISP',   hp:88,  atk:13, el:'storm',  swap:{ b:'#ffd23f', l:'#fff0a8', d:'#f0a022', k:'#6b4a00' } },
    wyrm:    { spr:'m_wyrm',   name:'TOME WYRM',    hp:110, atk:13, el:'arcane' },
    seraph:  { spr:'m_seraph', name:'THE EXAMINER', hp:190, atk:16, el:'void',  boss:true },
    seraphB: { spr:'m_seraph', name:'FINAL PAPER',  hp:260, atk:19, el:'void',  boss:true, swap:{ b:'#a35cff', l:'#e0b6ff', d:'#6a27c8' } }
  };

  /* ==== ATTACK CARDS ===================================================== */
  const ELEM = {
    fire:   { col:'#ff9330', col2:'#ff4d5e', icon:'i_flame', name:'FIRE' },
    water:  { col:'#49a7ff', col2:'#2358c9', icon:'i_flask', name:'TIDE' },
    nature: { col:'#3fe07a', col2:'#1d9a52', icon:'i_paw',   name:'WILD' },
    arcane: { col:'#a35cff', col2:'#6a27c8', icon:'i_essence', name:'ARCANE' },
    storm:  { col:'#ffd23f', col2:'#f0a022', icon:'i_bolt',  name:'STORM' },
    stone:  { col:'#9aa6c4', col2:'#6b789c', icon:'i_stone', name:'STONE' },
    void:   { col:'#ff5fb8', col2:'#a3157a', icon:'i_star',  name:'VOID' }
  };
  const CARDS = [
    { n:'EMBER SLASH',  el:'fire',   d:9 },  { n:'CINDER FANG', el:'fire',   d:11 },
    { n:'BLAZE ARC',    el:'fire',   d:13 }, { n:'TIDE CUT',    el:'water',  d:9 },
    { n:'FROST LANCE',  el:'water',  d:12 }, { n:'THORN WHIP',  el:'nature', d:10 },
    { n:'BLOOM BURST',  el:'nature', d:12 }, { n:'RUNE BOLT',   el:'arcane', d:11 },
    { n:'STAR SHARD',   el:'arcane', d:14 }, { n:'VOLT STRIKE', el:'storm',  d:10 },
    { n:'GALE EDGE',    el:'storm',  d:12 }, { n:'QUAKE FIST',  el:'stone',  d:13 }
  ];

  /* ==== ROGUELIKE RELICS — drafted every five answers ==================== */
  const POWERS = [
    { id:'focus',   n:'SHARP FOCUS',   d:'+30% attack damage',            icon:'i_sword',   col:'#ff4d5e' },
    { id:'wind',    n:'SECOND WIND',   d:'Heal 18 HP right now',          icon:'i_heart',   col:'#3fe07a' },
    { id:'combo',   n:'COMBO ENGINE',  d:'Combo climbs twice as fast',    icon:'i_bolt',    col:'#ffd23f' },
    { id:'time',    n:'TIME DILATION', d:'+4 seconds on every question',  icon:'i_clock',   col:'#46ecd5' },
    { id:'thorn',   n:'THORN AURA',    d:'Wrong answers hurt them too',   icon:'i_flame',   col:'#ff9330' },
    { id:'lucky',   n:'LUCKY DIE',     d:'25% chance to double a hit',    icon:'i_star',    col:'#a35cff' },
    { id:'glasses', n:'STUDY GLASSES', d:'Burns away one wrong option',   icon:'i_book',    col:'#49a7ff' },
    { id:'iron',    n:'IRON SKIN',     d:'Take 30% less damage',          icon:'i_shield',  col:'#9aa6c4' },
    { id:'warm',    n:'EGG WARMTH',    d:'Eggs hatch twice as fast',      icon:'i_egg',     col:'#ff5fb8' },
    { id:'gold',    n:'GOLD TOOTH',    d:'+60% coins from this run',      icon:'i_coin',    col:'#ffd23f' },
    { id:'link',    n:'SOUL LINK',     d:'Your pet strikes twice',        icon:'i_paw',     col:'#c3ff4d' },
    { id:'over',    n:'OVERCLOCK',     d:'Focus meter fills 60% faster',  icon:'i_essence', col:'#a35cff' },
    { id:'vamp',    n:'INK SIPHON',    d:'Heal 3 HP per correct answer',  icon:'i_flask',   col:'#3fe07a' },
    { id:'crit',    n:'PERFECT RECALL',d:'Fast answers hit much harder',  icon:'i_clock',   col:'#ff5fb8' }
  ];

  /* ==== QUESTION BANKS =================================================== */
  /* [prompt, correct, wrong, wrong, wrong] */
  const Q = {};

  Q.algebra = [
    ['Solve: 2x + 6 = 14','x = 4','x = 5','x = 10','x = 3'],
    ['Solve: 5x = 45','x = 9','x = 8','x = 40','x = 50'],
    ['Solve: x / 3 = 7','x = 21','x = 10','x = 4','x = 3.5'],
    ['Solve: 3x - 5 = 16','x = 7','x = 6','x = 11','x = 21'],
    ['Expand: 3(x + 4)','3x + 12','3x + 4','x + 12','3x + 7'],
    ['Expand: 2(3x - 5)','6x - 10','6x - 5','5x - 10','6x + 10'],
    ['Simplify: 4a + 3a - 2a','5a','9a','7a','2a'],
    ['Factorise: 6x + 9','3(2x + 3)','6(x + 9)','3(2x + 9)','9(x + 6)'],
    ['If x = 5, what is 2x squared?','50','100','20','25'],
    ['Solve: 2(x + 3) = 18','x = 6','x = 9','x = 12','x = 7'],
    ['Solve: x squared = 49 (positive root)','x = 7','x = 24.5','x = 98','x = 14'],
    ['Simplify: x^3 x x^4','x^7','x^12','x^1','2x^7'],
    ['Solve: 7 - x = 2','x = 5','x = 9','x = -5','x = 14'],
    ['Rearrange y = x + 4 to make x the subject','x = y - 4','x = y + 4','x = 4 - y','x = 4y'],
    ['Solve: 4x + 2 = 2x + 10','x = 4','x = 2','x = 6','x = 3'],
    ['Expand: (x + 2)(x + 3)','x^2 + 5x + 6','x^2 + 6x + 5','x^2 + 6','x^2 + 5x + 5'],
    ['Factorise: x^2 + 7x + 12','(x + 3)(x + 4)','(x + 2)(x + 6)','(x + 12)(x + 1)','(x + 5)(x + 2)'],
    ['Solve: 9 = 3x','x = 3','x = 27','x = 6','x = 12'],
    ['Simplify: 12x / 4','3x','8x','48x','3'],
    ['If 5x - 3 = 22, what is x?','x = 5','x = 4','x = 19','x = 25'],
    ['Simplify: 3(2x + 1) + 2x','8x + 3','6x + 3','8x + 1','5x + 3'],
    ['Solve: x/2 + 3 = 8','x = 10','x = 5','x = 22','x = 2.5'],
    ['What is the coefficient of x in 7x - 2?','7','-2','x','5'],
    ['Solve: -3x = 12','x = -4','x = 4','x = -36','x = 9']
  ];

  Q.graphs = [
    ['Gradient of y = 3x + 2','3','2','5','1/3'],
    ['y-intercept of y = 3x + 2','2','3','0','-2'],
    ['Gradient of the line through (0,1) and (2,7)','3','2','6','1/3'],
    ['Gradient of y = -2x + 5','-2','2','5','-5'],
    ['What kind of line is y = 4?','Horizontal','Vertical','Diagonal','A curve'],
    ['What kind of line is x = -3?','Vertical','Horizontal','Diagonal','A parabola'],
    ['What is the point (0,0) called?','The origin','The intercept','The vertex','The gradient'],
    ['On y = 2x - 1, what is y when x = 3?','5','6','7','2'],
    ['Which line is parallel to y = 5x - 2?','y = 5x + 7','y = -5x - 2','y = 2x - 5','y = x + 5'],
    ['The gradient formula is...','(y2 - y1)/(x2 - x1)','(x2 - x1)/(y2 - y1)','y2 - y1','x1 x y1'],
    ['Which line is steeper?','y = 4x','y = 2x','y = x + 9','y = 0.5x'],
    ['What shape is the graph of y = x^2?','A parabola','A straight line','A circle','A hyperbola'],
    ['A line with negative gradient...','Falls left to right','Rises left to right','Is horizontal','Is vertical'],
    ['y-intercept of y = -x + 6','6','-1','-6','1'],
    ['Gradient through (1,2) and (3,8)','3','2','6','1/3'],
    ['On y = 0.5x + 1, what is y when x = 4?','3','2','5','9'],
    ['A line perpendicular to gradient 2 has gradient...','-1/2','2','-2','1/2'],
    ['On a distance-time graph, the gradient is...','Speed','Distance','Time','Acceleration'],
    ['A flat line on a distance-time graph means...','Stationary','Speeding up','Constant speed','Going back'],
    ['In y = mx + c, what is c?','The y-intercept','The gradient','The x value','The origin'],
    ['Where does y = 2x - 6 cross the x-axis?','x = 3','x = -6','x = 6','x = -3'],
    ['On a velocity-time graph, gradient is...','Acceleration','Distance','Speed','Force'],
    ['Area under a velocity-time graph gives...','Distance','Speed','Force','Time'],
    ['Which point lies on y = 3x?','(2,6)','(6,2)','(3,1)','(0,3)']
  ];

  Q.fractions = [
    ['1/2 + 1/4 = ?','3/4','2/6','1/6','2/4'],
    ['What is 2/3 of 18?','12','9','6','24'],
    ['Write 3/5 as a percentage','60%','35%','53%','30%'],
    ['Write 0.25 as a fraction','1/4','1/25','2/5','25/10'],
    ['1/2 x 2/3 = ?','1/3','2/6 and 1/2','3/5','2/3'],
    ['3/4 divided by 1/2 = ?','3/2','3/8','1/2','2/3'],
    ['Simplify 8/12','2/3','4/6','8/12','3/4'],
    ['What is 25% of 80?','20','25','16','40'],
    ['What is 15% of 200?','30','15','20','45'],
    ['Write 7/10 as a decimal','0.7','7.10','0.07','1.7'],
    ['1/3 + 1/6 = ?','1/2','2/9','1/9','2/6'],
    ['Simplify the ratio 4 : 6','2 : 3','4 : 3','1 : 2','3 : 2'],
    ['5/8 - 1/8 = ?','1/2','4/16','6/8','1/8'],
    ['Increase 50 by 10%','55','60','45','51'],
    ['Write 0.6 as a percentage','60%','6%','0.6%','16%'],
    ['Which is bigger: 2/3 or 3/5?','2/3','3/5','They are equal','Cannot tell'],
    ['What is 1/5 of 45?','9','5','15','8'],
    ['What is 3/4 of 60?','45','40','30','48'],
    ['12 is what percentage of 48?','25%','12%','40%','4%'],
    ['2/7 + 3/7 = ?','5/7','5/14','6/7','5/49'],
    ['Decrease 80 by 25%','60','55','20','75'],
    ['Share 60 in the ratio 1 : 2','20 and 40','30 and 30','15 and 45','25 and 35'],
    ['Write 1.5 as an improper fraction','3/2','1/5','15/10 only','2/3'],
    ['What is 10% of 250?','25','2.5','10','50']
  ];

  Q.cells = [
    ['Which part is the control centre of the cell?','Nucleus','Ribosome','Vacuole','Cell wall'],
    ['Where does aerobic respiration happen?','Mitochondria','Nucleus','Chloroplast','Cytoplasm'],
    ['Which part is found only in plant cells and makes food?','Chloroplast','Mitochondria','Nucleus','Membrane'],
    ['What is the correct order of mitosis?','Prophase, Metaphase, Anaphase, Telophase','Metaphase, Prophase, Anaphase, Telophase','Anaphase, Telophase, Prophase, Metaphase','Telophase, Anaphase, Metaphase, Prophase'],
    ['In prophase the chromosomes...','Condense and become visible','Line up in the middle','Are pulled apart','Form two new nuclei'],
    ['In metaphase the chromosomes...','Line up along the equator','Condense','Are pulled to the poles','Disappear'],
    ['In anaphase...','Sister chromatids are pulled apart','Chromosomes line up','The cell wall forms','DNA is copied'],
    ['In telophase...','Two new nuclei form','Chromosomes line up','DNA replicates','The cell grows'],
    ['What is cytokinesis?','The cytoplasm divides in two','DNA copying','Chromosomes condensing','The nucleus forming'],
    ['How many daughter cells does mitosis produce?','2','4','1','8'],
    ['Daughter cells from mitosis are...','Genetically identical','All different','Half the chromosomes','Always smaller forever'],
    ['A plant cell wall is made of...','Cellulose','Protein','Fat','Chitin'],
    ['Which part controls what enters and leaves the cell?','Cell membrane','Cell wall','Nucleus','Vacuole'],
    ['The jelly where most reactions happen is the...','Cytoplasm','Nucleus','Membrane','Vacuole'],
    ['Meiosis produces...','4 cells with half the chromosomes','2 identical cells','1 large cell','8 identical cells'],
    ['How many chromosomes in a human body cell?','46','23','92','48'],
    ['Where is DNA stored in a eukaryotic cell?','The nucleus','The ribosome','The membrane','The vacuole'],
    ['Ribosomes are the site of...','Protein synthesis','Respiration','Photosynthesis','Digestion'],
    ['The large plant vacuole stores...','Cell sap','Oxygen','Chlorophyll','DNA'],
    ['Mitosis is used by the body for...','Growth and repair','Making gametes','Digestion','Breathing'],
    ['Before mitosis begins, DNA is...','Replicated','Destroyed','Halved','Folded away'],
    ['Which of these has no nucleus?','A bacterial cell','A plant cell','A human skin cell','A yeast cell'],
    ['Uncontrolled mitosis can lead to...','A tumour','Meiosis','Respiration','Osmosis'],
    ['Chromosomes are made of...','DNA','Cellulose','Starch','Lipid']
  ];

  Q.elements = [
    ['What is the chemical symbol for sodium?','Na','So','S','Sd'],
    ['What is the chemical symbol for potassium?','K','P','Po','Pt'],
    ['What is H2O?','Water','Hydrogen peroxide','Helium oxide','Hydroxide'],
    ['The atomic number tells you the number of...','Protons','Neutrons','Shells','Molecules'],
    ['The charge on an electron is...','Negative','Positive','Neutral','It varies'],
    ['Group 1 elements are called...','Alkali metals','Halogens','Noble gases','Transition metals'],
    ['Group 0 elements are called...','Noble gases','Alkali metals','Halogens','Metalloids'],
    ['What is the common name for NaCl?','Salt','Chalk','Sugar','Lime'],
    ['An ionic bond involves...','Transferring electrons','Sharing electrons','Sharing protons','Losing neutrons'],
    ['A covalent bond involves...','Sharing electrons','Transferring electrons','Losing protons','Gaining neutrons'],
    ['A solution with pH 7 is...','Neutral','A strong acid','A strong alkali','Impossible'],
    ['Acid + base gives...','Salt + water','Hydrogen + salt','Carbon dioxide only','Nothing'],
    ['What is CO2?','Carbon dioxide','Carbon monoxide','Calcium oxide','Chlorine dioxide'],
    ['Mass number = protons + ...','Neutrons','Electrons','Shells','Ions'],
    ['Maximum electrons in the first shell?','2','8','18','1'],
    ['Metal + oxygen gives...','A metal oxide','A salt','An acid','Hydrogen'],
    ['Chemical symbol for iron?','Fe','Ir','In','I'],
    ['Noble gases are...','Very unreactive','Highly explosive','Strong acids','All metals'],
    ['A period in the periodic table is a...','Row','Column','Block of metals','Group of gases'],
    ['Which element has atomic number 6?','Carbon','Oxygen','Lithium','Neon'],
    ['Acids have a pH...','Below 7','Above 7','Exactly 7','Above 14'],
    ['A substance made of one type of atom is...','An element','A compound','A mixture','A solution'],
    ['What gas do metals release with acid?','Hydrogen','Oxygen','Chlorine','Nitrogen'],
    ['Chemical symbol for gold?','Au','Go','Gd','Ag']
  ];

  Q.forces = [
    ['F = ma. Force on 10 kg accelerating at 2 m/s^2?','20 N','5 N','12 N','20 kg'],
    ['The unit of force is the...','Newton','Joule','Watt','Pascal'],
    ['Speed = distance divided by...','Time','Mass','Force','Acceleration'],
    ['The unit of energy is the...','Joule','Newton','Watt','Volt'],
    ['Gravitational field strength on Earth is about...','9.8 N/kg','1 N/kg','98 N/kg','0.98 N/kg'],
    ['Weight = mass x ...','Gravitational field strength','Acceleration','Speed','Volume'],
    ['If forces on an object are balanced it...','Keeps constant velocity','Always stops','Always speeds up','Falls faster'],
    ['Newton 3rd law says forces are...','Equal and opposite','Always balanced','Always zero','Always upward'],
    ['The unit of power is the...','Watt','Joule','Newton','Ampere'],
    ['100 J of work in 5 seconds is a power of...','20 W','500 W','105 W','20 J'],
    ['The unit of acceleration is...','m/s^2','m/s','N/kg only','s/m'],
    ['Momentum = mass x ...','Velocity','Acceleration','Force','Time'],
    ['Friction always acts...','Opposite to motion','With the motion','Downwards','Upwards'],
    ['At terminal velocity the forces are...','Balanced','Unbalanced','Zero','Increasing'],
    ['100 m travelled in 20 s is a speed of...','5 m/s','2 m/s','2000 m/s','0.2 m/s'],
    ['KE = 0.5mv^2. m = 2 kg, v = 3 m/s. KE = ?','9 J','6 J','18 J','3 J'],
    ['The SI unit of mass is the...','Kilogram','Newton','Gram','Pound'],
    ['GPE = mgh. m = 2, g = 10, h = 5. GPE = ?','100 J','17 J','25 J','50 J'],
    ['Speed is a...','Scalar','Vector','Force','Unit'],
    ['A vector has magnitude and...','Direction','Mass','Energy','Time'],
    ['Work done = force x ...','Distance moved','Time','Mass','Speed'],
    ['A resultant force of zero means...','No acceleration','No movement ever','Instant stop','Infinite speed'],
    ['Which is a contact force?','Friction','Gravity','Magnetism','Electrostatic'],
    ['Doubling the speed of a car multiplies its KE by...','4','2','8','1']
  ];

  /* ==== MATCHING & SEQUENCING SETS ====================================== */
  const MATCHES = {
    cells: [['Nucleus','Holds the DNA'],['Mitochondria','Releases energy'],['Chloroplast','Makes glucose'],
            ['Ribosome','Builds proteins'],['Cell membrane','Controls entry'],['Vacuole','Stores cell sap']],
    elements: [['Na','Sodium'],['Fe','Iron'],['K','Potassium'],['Au','Gold'],['O','Oxygen'],['He','Helium']],
    forces: [['Newton','Force'],['Joule','Energy'],['Watt','Power'],['m/s','Speed'],['Kilogram','Mass'],['Pascal','Pressure']],
    graphs: [['m','Gradient'],['c','y-intercept'],['Origin','(0, 0)'],['Parabola','y = x squared'],
             ['Horizontal','y = 4'],['Vertical','x = 4']],
    algebra: [['3(x+2)','3x + 6'],['x^2 + 2x','x(x + 2)'],['4a + 3a','7a'],['x^3 x x^2','x^5'],
              ['2x = 10','x = 5'],['x/4 = 3','x = 12']],
    fractions: [['1/2','50%'],['1/4','0.25'],['3/5','60%'],['1/10','0.1'],['3/4','75%'],['2/5','0.4']]
  };
  const SEQUENCES = {
    cells:    { title:'Order the stages of mitosis', items:['Interphase','Prophase','Metaphase','Anaphase','Telophase','Cytokinesis'] },
    forces:   { title:'Order these by increasing speed', items:['A walking person','A running dog','A car in town','A passenger jet','Sound in air','Light'] },
    elements: { title:'Order by atomic number', items:['Hydrogen','Helium','Lithium','Carbon','Oxygen','Neon'] },
    algebra:  { title:'Order the steps to solve 2x + 6 = 14', items:['Write the equation','Subtract 6 from both sides','Get 2x = 8','Divide both sides by 2','Get x = 4','Check by substituting'] },
    fractions:{ title:'Order from smallest to largest', items:['1/10','1/5','1/4','1/3','1/2','3/4'] },
    graphs:   { title:'Order these gradients, shallowest first', items:['y = 0.25x','y = 0.5x','y = x','y = 2x','y = 4x','y = 10x'] }
  };
  /* graph minigame rounds: match the line y = mx + c */
  const GRAPHS = {
    graphs: [ {m:1,c:0}, {m:2,c:1}, {m:-1,c:3}, {m:0.5,c:-2}, {m:-2,c:4}, {m:3,c:-1} ],
    algebra:[ {m:2,c:0}, {m:-1,c:2}, {m:1,c:-3}, {m:-0.5,c:1} ],
    forces: [ {m:2,c:0}, {m:5,c:0}, {m:-1,c:5}, {m:0.5,c:2} ]
  };

  /* ==== ISLANDS ========================================================== */
  /* node kinds: fight elite boss match seq graph gather rest */
  const trail = (kinds) => kinds.map((k,i) => ({ kind:k, i }));
  const PACKS = [
    { id:'algebra', name:'EMBER ALGEBRA', sub:'solve for x, or else',
      col:'#ff9330', col2:'#ff4d5e', el:'fire', icon:'i_flame', sky:{ top:'#e0522a', mid:'#ff9330', bot:'#ffd7a8' },
      bank:'algebra', enemies:['slime','bat','shroom','batB','golem'], boss:'seraph',
      nodes:trail(['fight','match','fight','gather','elite','seq','fight','graph','fight','boss']) },
    { id:'graphs', name:'PRISM PEAK', sub:'lines, gradients, intercepts',
      col:'#49a7ff', col2:'#2358c9', el:'water', icon:'i_bolt', sky:{ top:'#2358c9', mid:'#49a7ff', bot:'#b6ecff' },
      bank:'graphs', enemies:['wisp','bat','slimeB','wispB','golem'], boss:'wyrm',
      nodes:trail(['fight','graph','fight','match','elite','gather','graph','seq','fight','boss']) },
    { id:'fractions', name:'CASCADE FALLS', sub:'fractions, ratio, percent',
      col:'#46ecd5', col2:'#1a9e93', el:'water', icon:'i_flask', sky:{ top:'#1a9e93', mid:'#46ecd5', bot:'#ccfff6' },
      bank:'fractions', enemies:['slimeB','slime','wisp','shroom','batB'], boss:'golemB',
      nodes:trail(['fight','match','gather','fight','seq','elite','fight','match','fight','boss']) },
    { id:'cells', name:'VERDANT GROVE', sub:'cells, mitosis, life',
      col:'#3fe07a', col2:'#1d9a52', el:'nature', icon:'i_paw', sky:{ top:'#1d9a52', mid:'#54d64a', bot:'#ddffc0' },
      bank:'cells', enemies:['shroom','slime','shroomB','bat','golem'], boss:'wyrm',
      nodes:trail(['fight','seq','fight','match','gather','elite','seq','fight','fight','boss']) },
    { id:'elements', name:'CINDER FORGE', sub:'atoms, bonds, the table',
      col:'#a35cff', col2:'#6a27c8', el:'arcane', icon:'i_essence', sky:{ top:'#3b1e6e', mid:'#8b3fa8', bot:'#ffb0c8' },
      bank:'elements', enemies:['golem','batB','wispB','shroomB','golemB'], boss:'seraph',
      nodes:trail(['fight','match','fight','seq','elite','gather','fight','match','fight','boss']) },
    { id:'forces', name:'STORMCLIFF', sub:'forces, motion, energy',
      col:'#ffd23f', col2:'#f0a022', el:'storm', icon:'i_star', sky:{ top:'#2c3f8f', mid:'#6c8cff', bot:'#ffe9a8' },
      bank:'forces', enemies:['wisp','wispB','golem','wyrm','batB'], boss:'seraphB',
      nodes:trail(['fight','graph','fight','match','elite','seq','gather','fight','graph','boss']) }
  ];

  /* ==== expansion ======================================================== */
  function expand(row) {
    return { q:row[0], a:row[1], o:shuffle([row[1],row[2],row[3],row[4]]) };
  }
  const bags = {};
  function question(bankId) {
    const bank = Q[bankId] || Q.algebra;
    if (!bags[bankId]) bags[bankId] = Bag(bank);
    return expand(bags[bankId].next());
  }
  /* a custom deck of {term, def} becomes a question bank, with the wrong
     options drawn from the other cards in the same deck */
  function deckToBank(deck) {
    const cards = deck.cards.filter(c => c.term && c.def);
    if (cards.length < 2) return [];
    return cards.map(c => {
      const others = shuffle(cards.filter(o => o !== c)).slice(0,3).map(o => o.def);
      while (others.length < 3) others.push('None of these');
      return [ (deck.prompt || 'What matches:') + ' ' + c.term, c.def, others[0], others[1], others[2] ];
    });
  }
  function customQuestion(deck) {
    const key = 'custom:'+deck.id;
    if (!bags[key] || bags[key].size !== deck.cards.length) {
      const bank = deckToBank(deck);
      if (!bank.length) return { q:'This deck is empty. Add two cards.', a:'OK', o:['OK'] };
      bags[key] = Bag(bank);
    }
    return expand(bags[key].next());
  }
  function deckMatches(deck) {
    return shuffle(deck.cards.filter(c => c.term && c.def)).slice(0,6).map(c => [c.term, c.def]);
  }

  return { ENEMIES, ELEM, CARDS, POWERS, PACKS, Q, MATCHES, SEQUENCES, GRAPHS,
           question, customQuestion, deckToBank, deckMatches,
           pack: id => PACKS.find(p => p.id === id) };
})();
