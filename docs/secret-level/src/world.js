// World builder + gameplay systems.

import { MAPS, BUILDING_META, TILE as T, allPointIds, allFigIds, allPumpkinIds } from "./maps.js";
import { openTank, openGarden } from "./minigames.js";

const VIEW_W = 320;
const VIEW_H = 240;
const SAVE_KEY = "sl_save";

const FALLBACK_LINES = [
  { who: "noah", text: "…okay, embarrassing: I haven't written this memory yet. It's coming, I promise. ♥" },
];

// Built-in copy for the newer spots so they read properly even before Noah
// writes them into memories.json — anything he puts in `points` wins.
const POINT_FALLBACK = {
  la_home: [
    "Your house. The big one, sun on it all day, pool out back.",
    { who: "noah", text: "Santa Clarita. I knew every room in this place before I ever set foot in it." },
    { who: "noah", text: "go on — everybody's inside. press E at the door ♥" },
  ],
  la_pool: [
    "The pool. Perfectly still, absurdly blue, faintly smug about it.",
    { who: "noah", text: "one day we're going to argue about whether the water is 'too cold' again. I'm going to lose again." },
  ],
  home_marina: [
    { text: "Marina looks up from the counter and immediately starts wiping something that was already clean." },
    { who: "her", text: "Marina!!" },
    { text: "Marina: \"So. This is the boy. Hmph. …He is taller than the photo.\"" },
    { text: "(she is smiling. she will deny this.)" },
  ],
  home_mom: [
    { text: "Your mom hugs you the way moms do — like she's checking you're all still there." },
    { text: "Mom: \"Are you eating? You're not eating. Sit, I'll make something.\"" },
    { who: "noah", text: "…I love it here." },
  ],
  home_bro: [
    { text: "Your brother is threading a line through a rod that already had a line in it." },
    { text: "\"Hey. …Happy birthday. Don't make it weird.\"" },
    { text: "\"We're going out at five tomorrow. You can come. Only if you're quiet.\"" },
    { who: "noah", text: "he scored four last weekend. FOUR. he told me twice." },
    { text: "(he makes it weird. he hugs you. it's very sweet.)" },
  ],
  // ---- Jack's place 🌻
  jack_home: [
    "Jack's house — the long low one behind all the sunflowers.",
    { who: "noah", text: "you can smell the garden from the street. tomatoes and woodsmoke." },
    { who: "noah", text: "go on, knock. nobody in there has ever knocked on anything ♥" },
  ],
  jack_garden: [
    "Rows and rows of it: tomatoes up the stakes, corn taller than Jack, lettuce, peppers, herbs.",
    { who: "noah", text: "they genuinely grow most of what ends up on that table." },
    { who: "her", text: "…we're taking some home." },
    { text: "(you were always taking some home.)" },
  ],
  jack_firepit: [
    "A ring of stones, a proper fire, three logs pulled up close.",
    { who: "noah", text: "this is the spot. this is where the night goes long and nobody notices." },
    { who: "noah", text: "[TODO Noah: the story from the fire pit ♥]" },
  ],
  jack_bus: [
    "The van. Rainbow down the side, peace sign on the panel, curtains half drawn.",
    { text: "It has not moved in a while. It does not need to." },
  ],
  home_jack: [
    { text: "Jack fills the doorway the way weather fills a sky." },
    { text: "Jack: \"So! You brought him.\" (he has not let go of your shoulders yet)" },
    { who: "noah", text: "he shook my hand and I felt it in my spine." },
    { text: "Jack: \"Sit. Eat. We are not discussing it.\"" },
  ],
  home_jackwife: [
    { text: "Dez pushes a curl out of her face with the back of a floury hand." },
    { text: "\"Ignore him, he's been loud since he was six.\"" },
    { text: "(she hands you something warm before you've said a word.)" },
  ],
  home_chakra: [
    { text: "Chakra crosses the whole room in about two steps." },
    { who: "noah", text: "she's the size of a small horse and she thinks she's a lap dog." },
    { text: "(Chakra leans her entire weight against your leg. This is affection. This is also a takeover.)" },
    { text: "(Chakra joined your little crowd! 🖤)" },
  ],
  home_leo: [
    { text: "Leo, all seventeen pounds of orange menace, blinks at you slowly." },
    { who: "noah", text: "he's judging me." },
    { text: "(Leo decides he is coming too. Leo joined your little crowd! 🐱)" },
  ],
  home_charlie: [
    { text: "Charlie spins in a full circle before you even say his name." },
    { text: "(Charlie has decided this is the best day of his entire life.)" },
    { text: "(Charlie joined your little crowd! 🐶)" },
  ],
  aruba_beach: [
    "Past the barriers the road just… stops, and turns into white sand.",
    "A little palapa bar stands in the sun. The board on it says CLOSED.",
    { who: "noah", text: "yeah. closed. for one more week." },
    { who: "noah", text: "then it's you, me, and an entire island. happy birthday, my love ♥" },
  ],
  aruba_turtle: [
    "A sea turtle is sitting in the warm sand, entirely unbothered.",
    { text: "Turtle: \"…\"" },
    { text: "Turtle: \"one week.\"" },
    { who: "her", text: "did the turtle just—" },
    { text: "Turtle: \"see you on the beach.\" (he goes back to sleep.)" },
  ],
  lm_aruba: [
    "A divi-divi tree, bent permanently southwest by wind that never stops blowing.",
    { who: "noah", text: "this one isn't a memory yet. it's a promise — next week ♥" },
  ],
  // ---- 🍔 the burger place + the wider beach
  innout: [
    "White walls, red stripe, and a yellow arrow you can see from three blocks away.",
    { who: "noah", text: "[TODO Noah: the In-N-Out order. Animal style? the whole thing.]" },
    { who: "noah", text: "double-double, fries well done, and a twenty minute argument about the milkshake." },
    { text: "(the arrow points down the road like it knows something.)" },
  ],
  la_lifeguard: [
    "The tower's shutters are open and nobody's in it. Just the flag, snapping.",
    { who: "noah", text: "we sat under one of these for four hours once and didn't go in the water a single time." },
  ],
  la_surf: [
    "Two boards planted nose-up in the sand, still wet.",
    { who: "noah", text: "[TODO Noah: whether either of us can actually surf ♥]" },
  ],
  // ---- 🦢 Boston
  esplanade: [
    "The Charles, flat and bright, and the shell sitting on the grass like a giant ear.",
    { who: "noah", text: "the esplanade. we've walked this whole thing more times than I can count." },
    { who: "noah", text: "willows, swan boats, someone's speaker, and about four miles of us talking." },
    { who: "noah", text: "[TODO Noah: the walk along here that mattered most ♥]" },
  ],
  // ---- 🍔 inside the burger place
  innout_order: [
    { text: "The associate straightens her paper hat. \"Hi! What can I get started for you?\"" },
    { who: "her", text: "okay. okay okay okay. …a LOT of burgers." },
    { who: "noah", text: "she means it. don't round down." },
    { who: "her", text: "raw onion. extra cheese. extra spread. on all of them." },
    { text: "Associate, typing, entirely unbothered: \"…extra spread on all of them. Got it.\"" },
    { who: "noah", text: "fries animal style. that's not optional, that's structural." },
    { who: "her", text: "two drinks. and a shake." },
    { who: "noah", text: "…one shake?" },
    { who: "her", text: "one shake. two straws." },
    { text: "(the associate looks up. the associate approves.)" },
    { who: "her", text: "and — this is going to sound strange — could we have two of the hats?" },
    { text: "Associate: \"Nobody has ever asked me that so politely.\"" },
    { text: "She slides two folded paper hats across the counter, one for each of you." },
    { text: "(you both put them on immediately. neither of you takes them off.)" },
    { who: "noah", text: "[TODO Noah: what actually happened the first time we came here ♥]" },
  ],
  innout_menu: [
    "Red board, white letters, five things on it and not one thing more.",
    { who: "noah", text: "the whole menu fits on one sign and it's still the correct answer every time." },
    { who: "her", text: "…the prices on this board are from 1976." },
    { who: "noah", text: "it's my pixel restaurant. the double-double is two forty-five and I won't be taking questions." },
  ],
  innout_fries: [
    "Whole potatoes going into the slicer at one end, fries coming out under the heat lamp at the other.",
    { who: "her", text: "they cut them RIGHT THERE. every time this delights me." },
    { who: "noah", text: "every time. I have watched you watch this." },
  ],
  parents_home: [
    "White clapboard, wooden trim, the bottom half of a big Brookline duplex. The porch light is on.",
    { who: "noah", text: "my parents' place. bottom floor's ours — the whole thing smells like whatever mom's cooking." },
    { who: "noah", text: "they already love you. they asked about you before they asked about me." },
    { who: "noah", text: "go on. knock. …actually don't knock, just walk in, they'll be offended if you knock." },
  ],

  // ---- 🏢 JVUE, inside: their apartment, eleven days old
  apartment: [
    "Glass, warm panels, and a lobby light that's on at every hour you've ever walked past it.",
    { who: "noah", text: "our building. OURS. I still say it weird every time." },
    { who: "noah", text: "fourth floor, corner unit, and the windows face the good way." },
    { who: "noah", text: "come up ♥" },
  ],
  jvue_home: [
    "The whole top wall is glass. Longwood, a slice of sky, and the light coming in flat and gold.",
    { who: "her", text: "…we live here." },
    { who: "noah", text: "we live here." },
    { who: "her", text: "there are still eleven boxes." },
    { who: "noah", text: "we live here WITH eleven boxes. that's a detail." },
    { text: "(you stand at the window for a while. Neither of you says anything. It's the good kind.)" },
    { who: "noah", text: "[TODO Noah: the first night in this apartment ♥]" },
  ],
  jvue_tank: [
    "The tank hums quietly on its stand. Gravel, a castle, a lot of very green plants.",
    { who: "noah", text: "okay so. this started as 'one small fish'." },
    { who: "her", text: "it is not one small fish." },
    { who: "noah", text: "it's a whole little world. and every time we hit something together, it gets a new one." },
    { text: "(press E again any time to sit in front of the tank ♥)" },
  ],
  jvue_herbs: [
    "A shelf of terracotta under the windows. Soil, a trowel, one very earnest watering can.",
    { who: "her", text: "I want to grow things. Actual things. Tomatoes. Basil." },
    { who: "noah", text: "we are extremely going to grow things." },
    { who: "noah", text: "this is the starter set. water them, pick them, and we'll scale up to the balcony in spring." },
    { text: "(press E again any time to step into the little greenhouse 🌱)" },
  ],
  jvue_boxes: [
    "Eleven boxes. One says MUGS. One just says US, in her handwriting.",
    { who: "noah", text: "we'll do them this weekend." },
    { who: "her", text: "you said that about last weekend." },
    { who: "noah", text: "and I'll say it about next weekend. it's a tradition now." },
  ],
  jvue_tv: [
    "The TV on the left wall, the grey sofa parked square in front of it, the blanket already crumpled.",
    { who: "noah", text: "we have watched roughly four minutes of anything on this." },
    { who: "her", text: "we talk through all of it." },
    { who: "noah", text: "yeah. best four minutes of TV I've ever had." },
  ],

  // ---- 🏡 Brookline, inside
  home_hismom: [
    { text: "His mom turns around with flour on one cheek and a tray in both hands." },
    { text: "\"There she IS.\" (the tray goes down. you do not.)" },
    { text: "Mom: \"Sit, sit — no, first, taste this. Then sit.\"" },
    { who: "noah", text: "she's been baking since eight this morning. for four people." },
    { text: "Mom: \"There are SIX of us if Mia comes back hungry.\"" },
    { text: "(she pushes a warm one into your hand before you can answer. It's perfect.)" },
    { who: "noah", text: "[TODO Noah: what mom actually said about her ♥]" },
  ],
  home_dad: [
    { text: "His dad looks up over his glasses, entirely delighted, and does not get up." },
    { text: "Dad: \"Ah — you must be the famous Sasha.\"" },
    { who: "her", text: "hi! it's so good to finally—" },
    { text: "Dad: \"I hear you're studying international relations.\"" },
    { who: "her", text: "…I am?" },
    { text: "Dad: \"Good. Because relations in THIS house are strictly domestic.\"" },
    { text: "(silence. he is thrilled with himself.)" },
    { who: "noah", text: "he has been holding that one since Tuesday." },
    { text: "Dad: \"Since MONDAY.\" (he shakes your hand with both of his.)" },
    { text: "Dad: \"He talks about you constantly, you know. Constantly. It's become a whole thing.\"" },
  ],
  home_collie: [
    { text: "A border collie comes around the corner at roughly the speed of sound." },
    { text: "White, with black over one ear and most of one eye — so he always looks like he's asking a question." },
    { who: "her", text: "oh he's BEAUTIFUL — what's his name?" },
    { who: "noah", text: "…Charlie." },
    { who: "her", text: "Charlie." },
    { who: "noah", text: "Charlie." },
    { who: "her", text: "we have two Charlies." },
    { who: "noah", text: "we have two Charlies. nobody planned it. nobody's fixing it." },
    { text: "(Charlie #2 does one lap of the whole room to celebrate.)" },
    { text: "(He spots Mookie. He stops. He side-eyes Mookie the entire way past.)" },
    { text: "(He decides you are his person now. Charlie joined your little crowd! 🐕)" },
  ],
  parents_gym: [
    "Two gym bags dumped by the door, and a shaker bottle that rolled under the radiator.",
    { who: "noah", text: "Mia and Brandon. they left about an hour ago." },
    { who: "noah", text: "they go together every single day. it's genuinely impressive and slightly menacing." },
    { who: "her", text: "…should we be going to the gym." },
    { who: "noah", text: "we should be going to the gym. we are not going to the gym. we're eating whatever mom just made." },
  ],
  parents_stairs: [
    "The stairs up to the rest of the house. Somebody's shoes are on the third step.",
    { who: "noah", text: "Mia's floor. those are hers — she leaves them exactly there, every time." },
    { who: "noah", text: "you'll meet her when she's back. fair warning: she'll like you more than she likes me inside ten minutes." },
  ],
  parents_oven: [
    "The oven light is on. Something in there is going gold at the edges.",
    { who: "her", text: "what is that." },
    { who: "noah", text: "I don't know yet. that's the fun part." },
    { text: "(His mom, without turning around: \"Twelve more minutes. Nobody opens it.\")" },
  ],

  // ---- 🎓 Northeastern
  neu: [
    "Red brick, a limestone arch, and two NU-red banners moving in the wind off Huntington.",
    { who: "noah", text: "your school ♥ international affairs, up on the third floor." },
    { who: "her", text: "and poli sci. and, briefly, economics. we don't talk about economics." },
    { who: "noah", text: "we don't talk about economics." },
  ],
  neu_map: [
    "A pinned world map the length of the wall, red string running between five thumbtacks.",
    { who: "her", text: "this is the wall. everyone in the program has put a pin in this wall." },
    { who: "noah", text: "which ones are yours?" },
    { who: "her", text: "…all five of these, actually." },
    { who: "noah", text: "of COURSE they are." },
    { who: "her", text: "international affairs and political science. which mostly means I get very upset about places I've never been." },
    { who: "noah", text: "and then you go to them. that's the part people miss." },
    { text: "(she moves one pin two centimetres to the left. It was bothering her.)" },
  ],
  neu_un: [
    "The Model UN room, still set from this morning: placards out, water glasses full, gavel unclaimed.",
    { who: "her", text: "oh no." },
    { who: "noah", text: "oh YES. which one were you?" },
    { who: "her", text: "…I chaired." },
    { who: "noah", text: "you CHAIRED." },
    { who: "her", text: "somebody had to. two delegates were arguing about a comma." },
    { text: "(She picks up the gavel. She absolutely should not. She does it anyway.)" },
    { text: "*TOK*" },
    { who: "her", text: "the motion carries." },
    { who: "noah", text: "what motion" },
    { who: "her", text: "the one where we get food after this." },
    { text: "(Unanimous. The gavel goes back exactly where it was.)" },
  ],
  neu_globe: [
    "A floor globe on a brass meridian, worn smooth around the equator by ten thousand hands.",
    { text: "(She spins it, closes her eyes, and puts a finger down.)" },
    { text: "…the middle of the Pacific Ocean." },
    { who: "noah", text: "booking it." },
  ],
  neu_coop: [
    "The co-op board. Six months on, six months off, and every posting has its tabs torn off.",
    { who: "noah", text: "the famous co-op. this board runs this entire university." },
    { who: "her", text: "it runs my entire LIFE. I have a spreadsheet." },
    { who: "noah", text: "you have a spreadsheet about a corkboard." },
    { who: "her", text: "I have a spreadsheet about a corkboard and it is COLOR CODED." },
  ],
  neu_flags: [
    "A row of little flags on brass poles, none of them hanging quite level.",
    { text: "One for every language taught on this floor." },
    { who: "her", text: "I can order coffee wrong in four of these." },
    { who: "noah", text: "that's four more than me." },
  ],

  // ---- 🤖 BU robotics
  bu: [
    "Scarlet band, ribbon of lab windows, and one very well-lit ground-floor bay.",
    { who: "noah", text: "my building. well — the wing that matters." },
    { who: "noah", text: "half of everything I know happened in that room and about a third of it was on a Sunday." },
    { who: "noah", text: "come see ♥" },
  ],
  bu_arm: [
    "A six-axis arm on a pedestal, sweeping slowly through the same arc, over and over.",
    { who: "noah", text: "okay. this is the one. this is my favourite object in the building." },
    { text: "He taps something. The arm swings out, closes on a little red cube, lifts it, sets it down half an inch to the left." },
    { who: "noah", text: "it has been doing that since 2019." },
    { who: "her", text: "…that's it? that's the whole thing?" },
    { who: "noah", text: "that's the whole thing. and getting it to do THAT reliably is about nine hundred hours of somebody's life." },
    { text: "(The arm sets the cube down. Perfectly. Again.)" },
    { who: "her", text: "okay it's kind of beautiful." },
    { who: "noah", text: "IT'S KIND OF BEAUTIFUL." },
    { text: "(She makes it wave. It waves. She's delighted.)" },
  ],
  bu_printer: [
    "Two printers running. Gantries tracking left and right, beds sliding, layers stacking up one at a time.",
    { who: "her", text: "what are they making?" },
    { who: "noah", text: "that one's a bracket. that one is… hm." },
    { text: "(You both lean in. The part on the second bed is unmistakably a small pink heart.)" },
    { who: "noah", text: "…somebody's calibrating." },
    { who: "her", text: "somebody is NOT calibrating." },
    { who: "noah", text: "somebody put that on the queue eleven minutes ago and I refuse to say who." },
    { text: "(It finishes. He pops it off the bed with a spatula while it's still warm and hands it to you.)" },
    { text: "(You put it in your pocket. It stays there.)" },
  ],
  bu_rover: [
    "A tracked rover parked by the wall. There's masking tape on the side with a name on it — crossed out twice.",
    { who: "noah", text: "it's had three names. currently it's 'ROOMBA (LEGALLY DISTINCT)'." },
    { who: "her", text: "what were the other two?" },
    { who: "noah", text: "we don't say the second one out loud in this building." },
  ],
  bu_bench: [
    "The bench: an oscilloscope drawing a lazy green line, an iron still warm, and four spools of wire.",
    { who: "noah", text: "I have burned myself on that iron more times than I've burned myself cooking." },
    { who: "her", text: "you've burned yourself cooking a LOT." },
    { who: "noah", text: "which is what makes the statistic impressive." },
  ],
  bu_board: [
    "A whiteboard nobody has erased since March. Kinematics, a half-rubbed plot, and a doodle of a very angry robot.",
    { text: "In the corner, small, in different handwriting: DO NOT ERASE (SERIOUSLY)" },
    { who: "noah", text: "that's mine. and I no longer remember what it was for." },
  ],

  // ---- ☕ Cafe Bene 💛
  cafe: [
    "Chocolate fascia, cream letters, and two big warm windows you can see from down the block.",
    { who: "noah", text: "Cafe Bene." },
    { who: "noah", text: "…this is the one. this is where I actually saw you, in real life, for the first time." },
    { who: "noah", text: "go in. the table's still there." },
  ],
  cafe_table: [
    "The little two-top by the front window. Two chairs, a round marble top, and the good light.",
    { who: "noah", text: "here." },
    { who: "noah", text: "this table. this exact table." },
    { who: "noah", text: "I came through that door, I was looking at my phone, and I looked up — and you were sitting right there in that chair." },
    { who: "her", text: "I remember what I was wearing." },
    { who: "noah", text: "I remember EVERYTHING you were wearing. I also remember walking straight past you and then standing at the counter for a full minute deciding whether to turn around." },
    { who: "her", text: "you turned around." },
    { who: "noah", text: "I turned around." },
    { text: "(You both sit down in the same two chairs. It fits exactly the way it did.)" },
    { who: "noah", text: "[TODO Noah: what you actually said when you turned around ♥]" },
  ],
  cafe_hinge: [
    "A framed screenshot on the wall in a slightly-too-serious black frame, with a little brass plaque under it.",
    { text: "It's two tiny profile cards side by side, with a heart between them." },
    { who: "her", text: "…did they frame a dating app." },
    { who: "noah", text: "the plaque says 'THE ALGORITHM: 1, EVERY WELL-MEANING FRIEND WE HAVE: 0'." },
    { who: "her", text: "we met on HINGE." },
    { who: "noah", text: "we met on Hinge! the app designed to be deleted! and we deleted it! it WORKED!" },
    { who: "her", text: "your first message was about my third photo." },
    { who: "noah", text: "it was a GOOD third photo. I thought about that message for twenty minutes." },
    { who: "her", text: "it was eleven words." },
    { who: "noah", text: "twenty minutes. eleven words. best return on investment of my entire life." },
    { text: "(Somewhere out there is a server with the exact timestamp on it. Neither of you needs to look it up.)" },
  ],
  cafe_counter: [
    "The counter: tip jar, card reader, a stack of cups, and a barista who has seen you two a lot.",
    { text: "Barista: \"The usual? Cortado and the cold brew?\"" },
    { who: "her", text: "…yes please." },
    { text: "Barista, already making it: \"You always take the window table.\"" },
    { who: "noah", text: "we always take the window table." },
  ],
  cafe_pastry: [
    "The glass case. Two shelves, eight things, and one long-running argument.",
    { who: "her", text: "the almond croissant." },
    { who: "noah", text: "every time." },
    { who: "her", text: "because it's the correct one." },
    { who: "noah", text: "I'm not arguing. I'm noting the consistency." },
  ],
};

// Animals she can recruit. `lag` = how far back on her breadcrumb trail they
// aim; `side` = how far off to the side, so the crew spreads out into a little
// herd instead of a conga line.
const COMPANIONS = {
  mookie: { sprite: "mookie", lag: 12, side: -9, speed: 78, name: "Mookie" },
  leo: { sprite: "leo", lag: 17, side: 12, speed: 82, name: "Leo" },
  charlie: { sprite: "charlie", lag: 21, side: -15, speed: 88, name: "Charlie" },
  chakra: { sprite: "chakra", lag: 26, side: 18, speed: 94, name: "Chakra" },
  // the OTHER Charlie 🐕 — Noah's border collie. Fastest thing in the herd and
  // it is not close. Kept as `collie` internally because `charlie` was already
  // taken by, well, Charlie.
  collie: { sprite: "collie", lag: 15, side: -22, speed: 104, name: "Charlie",
    joinToast: "Charlie joined you! ♥ (…the other Charlie 🐕)" },
};

// ---------------------------------------------------------------- the tank 🐠
// Every fish in the apartment aquarium is a milestone she already earned
// somewhere else in the world — walk into a memory, find a fig, pick up a
// pumpkin, talk an animal into coming with you, and one more shows up in the
// glass. `body`/`fin` are the two pixel colours; `kind` picks the silhouette.
// test(save, memoriesRead, totals) — `totals` so "all of them" gates keep
// working when a new fig or a new memory point gets added to the world.
const FISH = [
  {
    id: "pip", name: "Pip", kind: "round", body: "#f0913c", fin: "#f6bb72",
    hint: "he came with the tank",
    line: "Pip does one confident lap and returns to exactly where he started.",
    test: () => true,
  },
  {
    id: "olive", name: "Olive", kind: "long", body: "#5fae6f", fin: "#8fd28f",
    hint: "read 5 memories",
    line: "Olive hangs near the plants and pretends she isn't watching you.",
    test: (s, mem) => mem >= 5,
  },
  {
    id: "fig", name: "Fig", kind: "round", body: "#8f5aa0", fin: "#c78ae0",
    hint: "find 3 figs 🫒",
    line: "Fig is purple, round, and has never once hurried.",
    test: (s) => s.figs.size >= 3,
  },
  {
    id: "gourd", name: "Gourd", kind: "puffer", body: "#e8913c", fin: "#f4c05a",
    hint: "find 3 pumpkins 🎃",
    line: "Gourd puffs up at his own reflection. Every day. Forever.",
    test: (s) => s.pumps.size >= 3,
  },
  {
    id: "mook", name: "Mook", kind: "long", body: "#a97f4f", fin: "#f2ead8",
    hint: "read 8 memories",
    line: "Mook is shaped like a cat's opinion of a fish.",
    test: (s, mem) => mem >= 8,
  },
  {
    id: "clem", name: "Clem", kind: "round", body: "#e8556a", fin: "#f8c8d8",
    hint: "bring Leo home 🐱",
    line: "Clem circles. Leo watches. Nobody blinks.",
    test: (s) => s.crew.has("leo"),
  },
  {
    id: "biscuit", name: "Biscuit", kind: "long", body: "#f6f2e6", fin: "#e8a0a8",
    hint: "bring Charlie home 🐶",
    line: "Biscuit is small, white and thrilled about everything.",
    test: (s) => s.crew.has("charlie"),
  },
  {
    id: "shadow", name: "Shadow", kind: "long", body: "#4d4857", fin: "#7a7389",
    hint: "bring Chakra home 🖤",
    line: "Shadow is twice everyone's size and gentle about it.",
    test: (s) => s.crew.has("chakra"),
  },
  {
    id: "sprint", name: "Sprint", kind: "long", body: "#f4efe2", fin: "#2c2731",
    hint: "bring the collie home 🐕",
    line: "Sprint crosses the tank twice while you read this.",
    test: (s) => s.crew.has("collie"),
  },
  {
    id: "patty", name: "Patty", kind: "puffer", body: "#da291c", fin: "#fbf8ee",
    hint: "get the paper hats 🍔",
    line: "Patty is red and white and refuses to explain herself.",
    test: (s) => s.hats,
  },
  {
    id: "basil", name: "Basil", kind: "round", body: "#3f8f5c", fin: "#9fd6a8",
    hint: "harvest 5 herbs 🌱",
    line: "Basil arrived the day the herbs did. No questions.",
    test: () => (parseInt(localStorage.getItem("sl_harvest") || "0", 10) || 0) >= 5,
  },
  {
    id: "atlas", name: "Atlas", kind: "angel", body: "#7a9ce8", fin: "#c6e0ff",
    hint: "read 15 memories",
    line: "Atlas drifts like he's due somewhere next week.",
    test: (s, mem, tot) => mem >= Math.min(15, Math.ceil(tot.mem * 0.6)),
  },
  {
    id: "koi", name: "Koi", kind: "angel", body: "#f0d264", fin: "#f8ecc4",
    hint: "find every fig 🫒",
    line: "Koi is gold. Koi knows.",
    test: (s, mem, tot) => s.figs.size >= tot.figs,
  },
  {
    id: "us", name: "Us", kind: "pair", body: "#f278a2", fin: "#2f7f6f",
    hint: "finish the story ♥",
    line: "One pink, one teal. They only swim side by side.",
    test: (s) => s.finale,
  },
];

// Default townsfolk one-liners (Noah can override any of these in
// memories.json → "npcs"). Each is an array of pages, or an array-of-arrays to
// cycle through several on repeat interactions.
const NPC_FALLBACK = {
  la_neighbor: [
    [{ text: "Lovely couple. You two remind me of me and my wife." },
     { text: "Now shoo — you're standing on my sprinklers." }],
    [{ text: "Back again? The taco place down the street is the real landmark." }],
  ],
  route_hiker: [
    [{ text: "Careful past here — I saw someone on a quad bike screaming about figs." },
     { text: "…wait. Was that YOU two?" }],
  ],
  route_admirer: [
    [{ text: "(she squints at the pyramid, counting on her fingers)" },
     { text: "Greece, Italy, Egypt, Mexico, Moldova… all that together? I can't even commit to a coffee order." }],
    [{ text: "One little road, a whole world on it. You two collect countries like I collect parking tickets." }],
  ],
  io_cashier: [
    [{ text: "\"Take your time. The board hasn't changed since 1948.\"" }],
    [{ text: "\"…the hats suit you both, honestly.\"" }],
  ],
  io_cook: [
    [{ text: "He turns a basket of fries without looking up." },
     { text: "\"Animal style takes an extra minute. It's worth the extra minute.\"" }],
  ],
  io_customer: [
    [{ text: "A man is halfway through a double-double and will not be interrupted." },
     { text: "He raises the burger a few inches. That's the whole greeting." }],
  ],
  bos_neighbor: [
    [{ text: "You're the one from downstairs' boy's girl, aren't you." },
     { text: "…that came out wrong. Anyway. Welcome to Brookline." }],
    [{ text: "Trash goes out Tuesday. Somebody had to tell you." }],
  ],
  bos_student: [
    [{ text: "Is that a cat following you? Lucky." },
     { text: "My cat won't even make eye contact with me." }],
  ],
  bos_runner: [
    [{ text: "Go Terriers! …or Huskies. I always forget which school I actually go to." }],
  ],
  bos_oldman: [
    [{ text: "The Charles is beautiful this time of year." },
     { text: "Don't drink it, though. Trust me." }],
  ],
  // ---- 🎓 Northeastern
  neu_prof: [
    [{ text: "She looks up from a stack of position papers, glasses pushed into her hair." },
     { text: "\"Ah — one of mine. Good. Tell me you finished the Moldova brief.\"" },
     { text: "(You did. You finished it four days early. She already knows.)" }],
    [{ text: "\"The trick isn't having an opinion. Everyone has an opinion.\"" },
     { text: "\"The trick is being able to argue the other side well enough that it hurts.\"" }],
  ],
  neu_husky: [
    [{ text: "\"Do you know if the spring co-op postings are up yet?\"" },
     { text: "\"…they're not up yet. I've checked eleven times. I'm going to check again.\"" }],
    [{ text: "\"Six months in class, six months at a desk, forever. It's a beautiful system.\"" },
     { text: "\"I have no idea what month it is.\"" }],
  ],
  // ---- 🤖 BU robotics
  bu_grad: [
    [{ text: "A grad student surfaces from behind a monitor, holding a screwdriver like a pen." },
     { text: "\"Oh — hey. Don't touch the arm.\" (a pause) \"…okay, touch the arm. It's fine. It's rated for it.\"" }],
    [{ text: "\"Print's at ninety-four percent. It'll fail at ninety-six. It always fails at ninety-six.\"" },
     { text: "\"I've stopped being sad about it. Now it's just a thing that happens, like weather.\"" }],
    [{ text: "\"You're the one from the photo on his desk.\"" },
     { text: "(you didn't know there was a photo on his desk.)" },
     { text: "\"There's a photo on his desk.\"" }],
  ],
  // ---- ☕ Cafe Bene
  cafe_barista: [
    [{ text: "\"Window table's free.\" (she says it before either of you asks.)" },
     { text: "\"It's always free when you two come in. I don't make the rules.\"" }],
    [{ text: "\"You know you ordered the exact same thing the first time you sat there.\"" },
     { text: "\"I remember because he ordered wrong twice.\"" }],
  ],
  cafe_regular: [
    [{ text: "An older man with a newspaper he is not reading." },
     { text: "\"Same table every time, you two.\"" },
     { text: "\"Me too. Forty-one years with mine. Same booth. Keep the table.\"" }],
  ],
};

// ---------------------------------------------------------------- travel log
// The landmarks already on Little Everywhere count as the couple's trip
// baseline. Logging a country again at the easel gets a visit-number badge.
const HERITAGE_LIST = [
  { country: "Greece", flag: "🇬🇷", visited: true },
  { country: "Egypt", flag: "🇪🇬", visited: true },
  { country: "Italy", flag: "🇮🇹", visited: true },
  // LA is her hometown → heritage; its map marker is the seeded Walk-of-Fame
  // star trip (no static landmark, so the sprite isn't duplicated — the ×2
  // badge on the star covers both).
  { country: "Los Angeles", flag: "🌴", visited: true },
  // (Mexico is a logged trip, not heritage — see SEED_TRIPS)
  { country: "Moldova", flag: "🇲🇩", visited: false }, // soon ♥
  { country: "Russia", flag: "🇷🇺", visited: false },  // soon ♥
];

// Starter entries for the travel log — trips already taken (+ NY planned).
// Seeded once per browser via the sl_travels_seeded tombstone list, so a
// demolished one never comes back. `sprite` overrides the country's default
// monument (Egypt trip #2 was spent sleeping on a Nile boat ♥).
const SEED_TRIPS = [
  { id: 1, country: "Mexico", msg: "tacos, sun, and one very smug cactus. [TODO Noah: the Mexico trip ♥]" },
  { id: 2, country: "Canada", msg: "maple syrup country. everyone was so polite. [TODO Noah: the Canada trip ♥]" },
  { id: 3, country: "Egypt", sprite: "felucca", msg: "New Year's on the Nile — we literally slept on a boat. [TODO Noah: the rest of the story ♥]" },
  { id: 4, country: "Puerto Rico", msg: "Old San Juan, garitas, and very loud coquís. [TODO Noah: the PR trip ♥]" },
  { id: 5, country: "Los Angeles", msg: "the hometown tour: beaches, palms, and one very specific taco spot. [TODO Noah ♥]" },
  { id: 6, country: "New York", soon: true, msg: "the city that never sleeps is waiting for us. soon ♥" },
  { id: 7, country: "Boston", home: true, msg: "our city — where every trip starts and ends. home ♥" },
  { id: 8, country: "Seattle", msg: "World Cup road trip — screaming for Egypt under the Space Needle. [TODO Noah: the Seattle trip ♥]" },
  { id: 9, country: "Japan", soon: true, msg: "torii gates, vending machines, cherry blossoms — the pier teaser was a promise. soon ♥" },
  { id: 10, country: "Korea", soon: true, msg: "seoul nights, street food, and a certain concert. soon ♥" },
  { id: 11, country: "Aruba", soon: true, msg: "one island, one week, one birthday girl. the divi-divi trees are already leaning our way ♥" },
];

// typed country/city (normalized) → premade monument sprite
const COUNTRY_SPRITES = {
  greece: "column", egypt: "pyramid", italy: "pisa", mexico: "cactus",
  moldova: "barrel", russia: "matryoshka",
  aruba: "divi", oranjestad: "divi",
  canada: "maple",
  "puerto rico": "garita", puertorico: "garita",
  boston: "lobster",
  "new york": "liberty", newyork: "liberty", nyc: "liberty",
  usa: "liberty", us: "liberty", america: "liberty", "united states": "liberty",
  miami: "flamingo", florida: "flamingo",
  "los angeles": "wofstar", la: "wofstar", hollywood: "wofstar", california: "wofstar",
  seattle: "needle", washington: "needle",
  korea: "seoulgate", "south korea": "seoulgate", southkorea: "seoulgate", seoul: "seoulgate",
  france: "eiffel", paris: "eiffel",
  uk: "bigben", england: "bigben", london: "bigben", "united kingdom": "bigben",
  japan: "minitorii", tokyo: "minitorii", kyoto: "minitorii",
  germany: "stein", berlin: "stein", munich: "stein",
  turkey: "balloon", istanbul: "balloon", cappadocia: "balloon",
  netherlands: "windmill", holland: "windmill", amsterdam: "windmill",
  china: "lantern", beijing: "lantern", shanghai: "lantern",
};

// collision boxes for premade monuments (anchor "bot", like other props)
const MONUMENT_HITS = {
  column: { ox: -4, w: 8, h: 5 }, pyramid: { ox: -13, w: 26, h: 8 },
  pisa: { ox: -5, w: 10, h: 6 }, cactus: { ox: -6, w: 12, h: 6 },
  barrel: { ox: -6, w: 12, h: 6 }, matryoshka: { ox: -4, w: 8, h: 5 },
  maple: { ox: -5, w: 10, h: 5 }, garita: { ox: -5, w: 10, h: 5 },
  lobster: { ox: -7, w: 14, h: 5 }, liberty: { ox: -6, w: 12, h: 6 },
  flamingo: { ox: -4, w: 8, h: 5 }, eiffel: { ox: -8, w: 16, h: 6 },
  bigben: { ox: -5, w: 10, h: 6 }, minitorii: { ox: -8, w: 16, h: 5 },
  stein: { ox: -5, w: 10, h: 5 }, balloon: { ox: -5, w: 10, h: 5 },
  windmill: { ox: -6, w: 12, h: 6 }, lantern: { ox: -4, w: 8, h: 5 },
  felucca: { ox: -8, w: 16, h: 5 }, wofstar: { ox: -7, w: 14, h: 6 },
  needle: { ox: -5, w: 10, h: 5 }, seoulgate: { ox: -8, w: 16, h: 6 },
  divi: { ox: -8, w: 16, h: 6 },
};

// tiny 3×5 pixel glyphs for the badges drawn on monuments (×N / soon / ♥)
const BADGE_GLYPHS = {
  0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"], 3: ["111", "001", "011", "001", "111"],
  4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"],
  8: ["111", "101", "111", "101", "111"], 9: ["111", "101", "111", "001", "111"],
  "×": ["000", "101", "010", "101", "000"],
  s: ["111", "100", "111", "001", "111"], o: ["111", "101", "101", "101", "111"],
  n: ["110", "101", "101", "101", "101"],
  "♥": ["01010", "11111", "11111", "01110", "00100"],
};

function badgeDataURL(text, color) {
  const glyphs = [...text].map((ch) => BADGE_GLYPHS[ch]).filter(Boolean);
  const w = glyphs.reduce((a, g) => a + g[0].length + 1, 1);
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = 9;
  const g = cv.getContext("2d");
  g.fillStyle = "#2b2028";
  g.fillRect(0, 0, w, 9);
  g.fillStyle = color;
  let x = 1;
  for (const gl of glyphs) {
    for (let r = 0; r < 5; r++)
      for (let cx = 0; cx < gl[r].length; cx++)
        if (gl[r][cx] === "1") g.fillRect(x + cx, 2 + r, 1, 1);
    x += gl[0].length + 1;
  }
  return cv.toDataURL();
}

const normCountry = (s) =>
  String(s || "").toLowerCase().normalize("NFKD")
    .replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();

function monumentSprite(country) {
  const n = normCountry(country);
  return COUNTRY_SPRITES[n] || COUNTRY_SPRITES[n.replace(/ /g, "")] || null;
}

export function startGame(k, memories, tilesMeta, dialogue, audio, ui) {
  const F = tilesMeta.frames;
  const requiredIds = allPointIds();
  const figIds = allFigIds();
  const pumpkinIds = allPumpkinIds();

  // ------------------------------------------------------------ save state
  const save = loadSave();
  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      return {
        seen: new Set(raw.seen || []),
        figs: new Set(raw.figs || []),
        pumps: new Set(raw.pumps || []),
        crew: new Set(raw.crew || []),
        met: !!raw.met,
        hats: !!raw.hats,
        finale: !!raw.finale,
        introDone: !!raw.introDone,
        mounted: !!raw.mounted,
        map: raw.map || "la",
        pos: raw.pos || null,
      };
    } catch {
      return blankSave();
    }
  }
  function blankSave() {
    return {
      seen: new Set(), figs: new Set(), pumps: new Set(), crew: new Set(),
      met: false, finale: false, introDone: false, mounted: false,
      map: "la", pos: null,
    };
  }
  function persist() {
    // keep `save` the single source of truth — an earlier build read a stale
    // save.mounted at every scene entry and kept re-mounting the ATV
    save.mounted = state.mounted;
    save.map = state.map;
    save.pos = state.playerPos;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      seen: [...save.seen], figs: [...save.figs], pumps: [...save.pumps],
      crew: [...save.crew], met: save.met, hats: save.hats,
      finale: save.finale, introDone: save.introDone, mounted: save.mounted,
      map: save.map, pos: save.pos,
    }));
  }

  // ------------------------------------------------------------ run state
  const state = {
    started: false,
    paused: false,
    mounted: false,
    map: save.map,
    playerPos: save.pos,
    cutscene: false,
    transitioning: false,
    exitCooldown: 0,
    focus: null,
    promptShown: false,
    chatIdx: 0,
    catIdx: 0,
    player: null,
    noah: null,
    mookie: null,
    party: [],      // everyone currently following her (noah + the animals)
    trail: [],
  };
  const vkeys = { left: false, right: false, up: false, down: false };
  const held = new Set(); // window-level key state (focus-independent)

  const locked = () => dialogue.open || state.cutscene || state.transitioning || !state.started || state.paused;

  function setPaused(on) {
    if (!state.started) return;
    state.paused = on;
    ui.pauseEl.classList.toggle("hidden", !on);
    if (on) persist();
  }

  // ------------------------------------------------------------ helpers
  // (plain setTimeout — kaplay's k.wait proved unreliable in some environments)
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

  function toast(text, ms = 2400) {
    const el = ui.toast;
    el.textContent = text;
    el.classList.remove("hidden", "fade-out");
    clearTimeout(el._t1); clearTimeout(el._t2);
    el._t1 = setTimeout(() => el.classList.add("fade-out"), ms);
    el._t2 = setTimeout(() => el.classList.add("hidden"), ms + 550);
  }

  function fade(on) {
    ui.fader.classList.toggle("on", on);
    return wait(0.33);
  }

  function updateHUD() {
    ui.hudMem.textContent = `${[...save.seen].filter((i) => requiredIds.includes(i)).length}/${requiredIds.length}`;
    ui.hudFig.textContent = `${save.figs.size}/${figIds.length}`;
    if (ui.hudPump) ui.hudPump.textContent = `${save.pumps.size}/${pumpkinIds.length}`;
  }

  function finaleReady() {
    return requiredIds.every((i) => save.seen.has(i)) && figIds.every((i) => save.figs.has(i));
  }

  function linesFor(id) {
    const p = memories.points?.[id];
    if (p?.lines?.length) return p.lines;
    const built = POINT_FALLBACK[id];
    if (built?.length) return built;
    return FALLBACK_LINES;
  }

  // ------------------------------------------------------------ characters
  function setAnim(obj, moving, dir) {
    obj.dir = dir;
    const kind = dir === "left" || dir === "right" ? "side" : dir;
    const name = `${moving ? "walk" : "idle"}-${kind}`;
    if (obj.curAnim() !== name) obj.play(name);
    if (kind === "side") obj.flipX = dir === "left";
  }

  function addShadow(owner, w = 12) {
    const sh = k.add([
      k.sprite("shadow"), k.pos(owner.pos), k.anchor("center"), k.z(0.5), k.opacity(0.8),
    ]);
    sh.onUpdate(() => {
      if (!owner.exists()) return sh.destroy();
      sh.pos = owner.pos.add(0, -2);
    });
    return sh;
  }

  function addPlayer(px, py) {
    const p = k.add([
      k.sprite(save.hats ? "her_hat" : "her", { anim: "idle-down" }),
      k.pos(px, py),
      k.anchor("bot"),
      k.area({ shape: new k.Rect(k.vec2(-5, -8), 10, 8) }),
      k.body(),
      k.z(py),
      "player",
      { dir: "down", speed: 70, stepT: 0, stepAlt: false },
    ]);
    addShadow(p);

    p.onUpdate(() => {
      p.z = p.pos.y;
      state.playerPos = [Math.round(p.pos.x), Math.round(p.pos.y)];
      syncCamera(p);
      if (locked()) { setAnim(p, false, p.dir); return; }

      // read from our own window-level key state (kaplay's isKeyDown needs
      // canvas focus, which DOM overlay buttons steal) + touch d-pad
      const down = (...ks) => ks.some((key) => held.has(key));
      let dx = 0, dy = 0;
      if (down("arrowleft", "a") || vkeys.left) dx -= 1;
      if (down("arrowright", "d") || vkeys.right) dx += 1;
      if (down("arrowup", "w") || vkeys.up) dy -= 1;
      if (down("arrowdown", "s") || vkeys.down) dy += 1;

      if (dx || dy) {
        const run = down("shift");
        const spd = state.mounted ? 148 : p.speed * (run ? 1.6 : 1);
        const v = k.vec2(dx, dy).unit().scale(spd);
        p.move(v.x, v.y);
        const dir = dx !== 0 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        setAnim(p, true, dir);
        p.stepT += k.dt() * (run ? 1.5 : 1);
        if (p.stepT > (state.mounted ? 0.16 : 0.26)) {
          p.stepT = 0;
          p.stepAlt = !p.stepAlt;
          state.mounted ? audio.engine(p.stepAlt) : audio.step(p.stepAlt);
        }
        const last = state.trail[state.trail.length - 1];
        if (!last || last.dist(p.pos) > 3) {
          state.trail.push(p.pos.clone());
          if (state.trail.length > 140) state.trail.shift();
        }
      } else {
        setAnim(p, false, p.dir);
      }
    });
    return p;
  }

  // ---------------------------------------------------------------- the herd
  // Everyone chases a point on her breadcrumb trail, offset sideways so the
  // group fans out; then a small boids-style separation push keeps them from
  // stacking on top of each other. Result: a little crowd that flows behind
  // her and re-forms when she stops. ♥
  const HERD_SEP = 15;      // personal space, px
  const HERD_PUSH = 28;     // how hard they shove apart

  function trailTarget(f) {
    const idx = state.trail.length - 1 - f.lag;
    if (idx < 0) return null;
    const t = state.trail[idx];
    // heading at that point on the trail → offset perpendicular to it
    const prev = state.trail[Math.max(0, idx - 5)];
    let hx = t.x - prev.x, hy = t.y - prev.y;
    const hl = Math.hypot(hx, hy);
    if (hl < 0.01) { hx = 0; hy = 1; } else { hx /= hl; hy /= hl; }
    // y is squashed a bit: the world is top-down but reads isometric-ish
    return k.vec2(t.x - hy * f.side, t.y + hx * f.side * 0.55);
  }

  function separation(f) {
    let sx = 0, sy = 0;
    for (const o of state.party) {
      if (o === f || !o.exists() || o.hidden) continue;
      const dx = f.pos.x - o.pos.x;
      const dy = (f.pos.y - o.pos.y) * 1.5;
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.01 || d2 > HERD_SEP * HERD_SEP) continue;
      const d = Math.sqrt(d2);
      const w = (HERD_SEP - d) / HERD_SEP;
      sx += (dx / d) * w;
      sy += (dy / d) * w;
    }
    return k.vec2(sx, sy);
  }

  function followerStep(f) {
    f.z = f.pos.y;
    const target = f.forcedTarget || trailTarget(f);
    if (!target) { followerIdle(f); return; }
    const d = target.sub(f.pos);
    const dist = d.len();
    const arriveAt = f.forcedTarget ? 2 : 5;
    const sep = separation(f);
    if (dist > arriveAt) {
      // keep up with the ATV (Noah has to sprint, poor guy). Speed eases in
      // with distance so nobody teleports when the group bunches up.
      const urgency = Math.min(1, 0.45 + dist / 60);
      const spd = f.speed * urgency * (state.mounted ? 2.15 : 1);
      const step = Math.min(dist, spd * k.dt());
      const v = d.unit().scale(step).add(sep.scale(HERD_PUSH * k.dt()));
      f.pos = f.pos.add(v);
      const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? "right" : "left") : d.y > 0 ? "down" : "up";
      setAnim(f, true, dir);
      f.idleT = 0;
    } else if (f.forcedTarget) {
      f.forcedTarget = null;
      const cb = f.onArrive; f.onArrive = null;
      setAnim(f, false, f.dir);
      cb?.();
    } else {
      // still settle into personal space while idling, so the pile untangles
      if (sep.x || sep.y) f.pos = f.pos.add(sep.scale(HERD_PUSH * 0.6 * k.dt()));
      followerIdle(f);
    }
  }

  function followerIdle(f) {
    f.idleT += k.dt();
    if (f.isPet && f.idleT > 4) {
      if (f.curAnim() !== "sit-flick") f.play("sit-flick");
    } else {
      setAnim(f, false, f.dir);
    }
  }

  function addFollower(spriteName, px, py, opts = {}) {
    const f = k.add([
      k.sprite(spriteName, { anim: "idle-down" }),
      k.pos(px, py),
      k.anchor("bot"),
      k.z(py),
      "npc",
      {
        dir: "down", idleT: 0,
        lag: opts.lag ?? 14, side: opts.side ?? 0, speed: opts.speed ?? 76,
        forcedTarget: null, onArrive: null, isFollower: true,
        isPet: !!opts.isPet, crewId: opts.crewId || null,
        talkKey: opts.talkKey || null,
      },
    ]);
    addShadow(f);
    state.party.push(f);
    f.onUpdate(() => followerStep(f));
    return f;
  }

  /** an animal decided she's their person now ♥ */
  function recruit(id, atPos) {
    if (!COMPANIONS[id] || save.crew.has(id)) return;
    save.crew.add(id);
    const c = COMPANIONS[id];
    const p = atPos || state.player.pos.add(-12, 8);
    addFollower(c.sprite, p.x, p.y, {
      lag: c.lag, side: c.side, speed: c.speed,
      isPet: true, crewId: id, talkKey: id,
    });
    heartBurst(p.add(0, -12), 5, 12);
    audio.fanfare();
    toast(c.joinToast || `${c.name} joined you! ♥`);
    persist();
  }

  function walkTo(f, target) {
    return new Promise((resolve) => {
      f.forcedTarget = target.clone();
      f.onArrive = resolve;
    });
  }

  function faceEachOther(a, b) {
    const d = b.pos.sub(a.pos);
    const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? "right" : "left") : d.y > 0 ? "down" : "up";
    const opp = { left: "right", right: "left", up: "down", down: "up" };
    setAnim(a, false, dir);
    setAnim(b, false, opp[dir]);
  }

  // ------------------------------------------------------------ particles
  function sparkleBurst(pos, n = 6) {
    for (let i = 0; i < n; i++) {
      const s = k.add([
        k.sprite("fx", { frame: 2 + (i % 2) }),
        k.pos(pos.add(k.rand(-10, 10), k.rand(-14, 2))),
        k.anchor("center"), k.z(1e5), k.opacity(1),
        { t: 0 },
      ]);
      s.onUpdate(() => {
        s.t += k.dt();
        s.pos.y -= 18 * k.dt();
        s.opacity = 1 - s.t / 0.7;
        if (s.t > 0.7) s.destroy();
      });
    }
  }

  function heartBurst(pos, n = 8, spread = 22, tint = null) {
    for (let i = 0; i < n; i++) {
      const h = k.add([
        k.sprite("fx", { frame: i % 3 === 0 ? 0 : 1 }),
        k.pos(pos.add(k.rand(-spread, spread), k.rand(-10, 6))),
        k.anchor("center"), k.z(1e5), k.opacity(1),
        ...(tint ? [k.color(...tint)] : []),
        { t: 0, vx: k.rand(-8, 8), life: k.rand(0.9, 1.5) },
      ]);
      h.onUpdate(() => {
        h.t += k.dt();
        h.pos.y -= 26 * k.dt();
        h.pos.x += Math.sin(h.t * 7 + i) * 12 * k.dt() + h.vx * k.dt();
        h.opacity = 1 - h.t / h.life;
        if (h.t > h.life) h.destroy();
      });
    }
  }

  // ------------------------------------------------------------ the ATV 🛵
  function spawnQuadParked(px, py) {
    k.add([
      k.sprite("quad"), k.pos(px, py), k.anchor("bot"),
      k.area({ shape: new k.Rect(k.vec2(-13, -9), 26, 9) }),
      k.body({ isStatic: true }), k.z(py), "quadProp",
    ]);
  }

  function mount(silent) {
    if (state.mounted) return;
    state.mounted = true;
    k.get("quadProp").forEach((q) => q.destroy());
    // the animals ride on the back rack ♥
    for (const p of state.party) if (p.crewId) p.hidden = true;
    const ride = k.add([
      k.sprite("quad_ride", { frame: 0 }),
      k.pos(state.player.pos), k.anchor("bot"), k.z(0), { t: 0 },
    ]);
    state.rideObj = ride;
    state.player.hidden = true;
    ride.onUpdate(() => {
      const p = state.player;
      if (!p?.exists()) return;
      ride.t += k.dt();
      const moving = p.curAnim()?.startsWith("walk");
      ride.pos = k.vec2(p.pos.x, p.pos.y + (moving ? Math.sin(ride.t * 18) * 0.8 : 0));
      ride.z = p.pos.y + 0.1;
      ride.frame = p.dir === "up" ? 1 : p.dir === "down" ? 0 : 2;
      ride.flipX = p.dir === "left";
    });
    if (!silent) {
      audio.rev();
      toast("vroom! mookie hopped on the back · E to park");
    }
    persist();
  }

  function dismount() {
    if (!state.mounted) return;
    state.mounted = false;
    state.player.hidden = false;
    let n = 0;
    for (const p of state.party) {
      if (!p.crewId) continue;
      p.hidden = false;
      p.pos = state.player.pos.add(-10 + (n % 3) * 9, 4 + Math.floor(n / 3) * 7);
      n++;
    }
    state.rideObj?.destroy();
    state.rideObj = null;
    const dx = state.player.dir === "left" ? -20 : state.player.dir === "right" ? 20 : 0;
    const dy = state.player.dir === "up" ? -6 : 14;
    spawnQuadParked(state.player.pos.x + dx, state.player.pos.y + dy);
    audio.close();
    persist();
  }

  // ------------------------------------------------------------ camera
  function syncCamera(p) {
    const def = MAPS[state.map];
    const mw = def.ground[0].length * T;
    const mh = def.ground.length * T;
    const cx = mw <= VIEW_W ? mw / 2 : k.clamp(p.pos.x, VIEW_W / 2, mw - VIEW_W / 2);
    const cy = mh <= VIEW_H ? mh / 2 : k.clamp(p.pos.y - 6, VIEW_H / 2, mh - VIEW_H / 2);
    // Snap to whole world pixels. The player moves in fractions of a pixel, and
    // a fractional camera makes nearest-neighbour sampling pick a different
    // source pixel for each sprite at slightly different moments — which reads
    // as a shimmer/tear line crawling across the map while she walks. Rounding
    // costs nothing and the camera still tracks her smoothly at this scale.
    k.setCamPos(Math.round(cx), Math.round(cy));
  }

  // ------------------------------------------------------------ pumpkins
  function collectPumpkin(id, pos) {
    if (save.pumps.has(id)) return;
    save.pumps.add(id);
    audio.pickup();
    sparkleBurst(pos, 8);
    const tpl = memories.pumpkins?.collect || "PUMPKINN!! ({n}/{total})";
    toast(tpl.replace("{n}", save.pumps.size).replace("{total}", pumpkinIds.length));
    if (save.pumps.size === pumpkinIds.length && memories.pumpkins?.all) {
      setTimeout(() => { if (!dialogue.open) dialogue.show(memories.pumpkins.all); }, 1400);
    }
    updateHUD();
    persist();
  }

  // ------------------------------------------------------------ fig collection
  function collectFig(id, pos) {
    if (save.figs.has(id)) return;
    save.figs.add(id);
    audio.pickup();
    sparkleBurst(pos, 8);
    const tpl = memories.figs?.collect || "you found a fig! ({n}/{total})";
    toast(tpl.replace("{n}", save.figs.size).replace("{total}", figIds.length));
    if (save.figs.size === figIds.length && memories.figs?.all) {
      setTimeout(() => { if (!dialogue.open) dialogue.show(memories.figs.all); }, 1400);
    }
    updateHUD();
    persist();
    checkFinaleReady();
  }

  // ------------------------------------------------------------ finale
  async function checkFinaleReady() {
    if (!finaleReady() || save.finale || state.promptShown) return;
    state.promptShown = true;
    await wait(0.6);
    // if she's inside the aquarium or the greenhouse, let her finish first
    while (state.cutscene || dialogue.open) await wait(0.4);
    const prompt = memories.finale?.prompt ||
      [{ who: "noah", text: "hey… I have one more thing to show you. meet me at our apartment? ♥" }];
    await dialogue.show(prompt);
    addFinaleMarker();
  }

  /** the floating heart that says "here". On the street it sits over JVUE's
   *  door; upstairs it sits over the window, which is where it actually
   *  happens now. */
  function addFinaleMarker() {
    if (save.finale || !finaleReady()) return;
    if (k.get("finaleMarker").length) return;
    let x, y;
    if (state.map === "boston") {
      const apt = MAPS.boston.buildings.find((b) => b.point === "apartment");
      const m = BUILDING_META[apt.sprite];
      x = (apt.x + Math.floor(m.wt / 2)) * T + 8;
      y = (apt.y + 1) * T - 40;
    } else if (state.map === "bos_jvue_in") {
      const spot = MAPS.bos_jvue_in.points.find((p) => p.id === "jvue_home");
      x = (spot.x + spot.w / 2) * T;
      y = (spot.y + 1) * T - 4;   // floating over the floor in front of the glass
    } else {
      return;
    }
    const h = k.add([
      k.sprite("fx", { frame: 0 }), k.pos(x, y), k.anchor("bot"), k.z(1e5), "finaleMarker", { t: 0 },
    ]);
    h.onUpdate(() => { h.t += k.dt(); h.pos.y = y + Math.sin(h.t * 3) * 3; });
  }

  async function runFinale() {
    state.cutscene = true;
    audio.heart();
    if (state.noah) {
      await walkTo(state.noah, state.player.pos.add(k.vec2(state.player.pos.x < 100 ? 22 : -22, 0)));
      faceEachOther(state.noah, state.player);
    }
    await wait(0.4);
    audio.fanfare();
    await dialogue.show(memories.finale?.lines?.length ? memories.finale.lines : FALLBACK_LINES);
    state.player.play("cheer");
    if (state.noah) state.noah.play("cheer");
    for (let i = 0; i < 6; i++) {
      heartBurst(state.player.pos.add(0, -14), 7, 30);
      audio.heart();
      await wait(0.45);
    }
    save.finale = true;
    persist();
    k.get("finaleMarker").forEach((m) => m.destroy());
    ui.showFinaleBanner(memories.finale?.title || "happy birthday ♥", memories.finale?.subtitle || "");
    state.cutscene = false;
  }

  // ------------------------------------------------------------ tomato garden 🍅
  async function pickTomato() {
    const g = k.get("gardenProp")[0];
    if (!g) return;
    if (g.frame === 0) {
      g.frame = 1;
      audio.pickup();
      sparkleBurst(g.pos.add(0, -12), 6);
      heartBurst(g.pos.add(0, -14), 2, 10);
      const n = (parseInt(localStorage.getItem("sl_tomatoes") || "0", 10) || 0) + 1;
      localStorage.setItem("sl_tomatoes", String(n));
      toast(`TOMATO!! 🍅 (${n} picked)`);
      setTimeout(() => { if (g.exists()) g.frame = 0; }, 40000); // they regrow
    } else {
      await dialogue.show([{ text: "(the tomatoes are still growing… patience, farmer.)" }]);
    }
  }

  // ------------------------------------------------------------ travel log ✈
  // seed starter trips exactly once per browser (tombstoned by id, so a
  // demolished seed stays demolished — see phase-8/9 lesson)
  let seedsChecked = false;
  function applySeedTrips() {
    let seeded, entries;
    try { seeded = JSON.parse(localStorage.getItem("sl_travels_seeded") || "[]"); } catch { seeded = []; }
    const missing = SEED_TRIPS.filter((s) => !seeded.includes(s.id));
    if (!missing.length) return;
    try { entries = JSON.parse(localStorage.getItem("sl_travels") || "[]"); } catch { entries = []; }
    for (const s of missing) {
      entries.push({ ...s, ...travelFreeSpot(MAPS.route, entries) });
      seeded.push(s.id);
    }
    localStorage.setItem("sl_travels", JSON.stringify(entries));
    localStorage.setItem("sl_travels_seeded", JSON.stringify(seeded));
  }

  function travelEntries() {
    if (!seedsChecked) {
      seedsChecked = true;
      applySeedTrips();
    }
    try {
      const all = JSON.parse(localStorage.getItem("sl_travels") || "[]");
      // one-time cleanup: an earlier build briefly seeded the heritage
      // landmarks into this list — they're hand-placed map props again,
      // so drop any stragglers to avoid duplicates
      const entries = all.filter((e) => !e.heritage);
      if (entries.length !== all.length) {
        localStorage.setItem("sl_travels", JSON.stringify(entries));
      }
      return entries;
    } catch {
      return [];
    }
  }

  function travelDataURL(country, id) {
    const cv = document.createElement("canvas");
    cv.width = 16; cv.height = 26;
    const g = cv.getContext("2d");
    let h = 0;
    for (const ch of `${country}${id}`) h = ((h * 31 + ch.charCodeAt(0)) >>> 0);
    const pals = [["#e8556a", "#f0d264"], ["#7a9ce8", "#f4f1e4"], ["#5fae6f", "#f0d264"],
      ["#c78ae0", "#f8c8d8"], ["#e8913c", "#f4f1e4"], ["#4fc4b8", "#2b2028"]];
    const [c1, c2] = pals[h % pals.length];
    g.fillStyle = "#74747c"; g.fillRect(3, 24, 10, 2);   // pedestal
    g.fillStyle = "#8f8f97"; g.fillRect(4, 21, 8, 3);
    g.fillStyle = "#8a683c"; g.fillRect(7, 5, 2, 17);    // pole
    g.fillStyle = "#2b2028"; g.fillRect(6, 4, 4, 1);     // finial
    g.fillStyle = c1; g.fillRect(9, 5, 7, 7);            // flag
    g.fillStyle = c2;
    const style = (h >> 3) % 3;
    if (style === 0) g.fillRect(9, 8, 7, 2);
    else if (style === 1) g.fillRect(12, 5, 2, 7);
    else g.fillRect(11, 7, 3, 3);
    g.fillStyle = "#2b2028"; g.fillRect(9, 12, 7, 1);    // flag shadow line
    return cv.toDataURL();
  }

  /** visit number for an entry, counted among logged trips only — the
   *  heritage landmarks are memories, not counts. "soon" entries are plans
   *  and "home" is where we live, so neither counts either. */
  function visitNumber(entry, entries) {
    const n = normCountry(entry.country);
    const prior = entries.filter((e) => !e.soon && !e.home && normCountry(e.country) === n && e.id < entry.id).length;
    return prior + 1;
  }

  const loadedTravelSprites = new Set();
  function spawnTravel(e) {
    if (e.soon) return; // plans live in the menu only — no sprite until logged
    // per-entry sprite override (e.g. the Nile felucca) → country's premade
    // monument → procedural flag for unknown places
    const premade = (e.sprite && MONUMENT_HITS[e.sprite] && e.sprite) || monumentSprite(e.country);
    let spriteComp;
    if (premade) {
      spriteComp = k.sprite(premade);
    } else {
      const name = `t_${e.id}`;
      if (!loadedTravelSprites.has(name)) {
        k.loadSprite(name, travelDataURL(e.country, e.id));
        loadedTravelSprites.add(name);
      }
      spriteComp = k.sprite(name);
    }
    const hit = (premade && MONUMENT_HITS[premade]) || { ox: -5, w: 10, h: 5 };
    const visit = e.home ? 0 : visitNumber(e, travelEntries());
    const title = e.home
      ? `⌂ ${e.country} · home ♥`
      : `✈ ${e.country}${visit > 1 ? ` · trip #${visit}` : ""}`;
    const obj = k.add([
      spriteComp, k.pos(e.x * T + 8, e.y * T + 16), k.anchor("bot"),
      k.area({ shape: new k.Rect(k.vec2(hit.ox, -hit.h), hit.w, hit.h) }),
      k.body({ isStatic: true }), k.z(e.y * T + 16),
      "signpost", "travelmark", { lines: [title, e.msg] },
    ]);
    // tiny corner badge on the sprite itself: gold ×N for repeat trips,
    // a little heart for home
    const badge = e.home ? ["♥", "#ff7b93"]
      : visit > 1 ? [`×${visit}`, "#f0d264"] : null;
    if (badge) {
      const name = `bdg_${badge[0]}`;
      if (!loadedTravelSprites.has(name)) {
        k.loadSprite(name, badgeDataURL(badge[0], badge[1]));
        loadedTravelSprites.add(name);
      }
      const h = obj.height || 18;
      k.add([
        k.sprite(name), k.pos(e.x * T + 13, e.y * T + 18 - h),
        k.anchor("center"), k.z(e.y * T + 17), "travelmark",
      ]);
    }
  }

  function refreshTravelObjs() {
    if (state.map !== "route") return;
    respaceTravels();
    k.get("travelmark").forEach((o) => o.destroy());
    for (const e of travelEntries()) spawnTravel(e);
  }

  /** handlers for the travel-log form: add, move (re-roll spot), demolish */
  function travelManage() {
    const saveEntries = (entries) => localStorage.setItem("sl_travels", JSON.stringify(entries));
    const decorate = (entries) => {
      for (const e of entries) e._visit = e.soon || e.home ? 0 : visitNumber(e, entries);
      return entries;
    };
    // heritage rows carry only the heritage tag — logged trips are counted
    // separately below, so going to Egypt once isn't shown as "twice"
    const heritageRows = () =>
      HERITAGE_LIST.map((h) => ({ country: h.country, flag: h.flag, visited: h.visited }));
    return {
      entries: decorate(travelEntries()),
      heritage: heritageRows(),
      onAdd: addTravelEntry,
      onEdit: (id, msg) => {
        const entries = travelEntries();
        const e = entries.find((x) => x.id === id);
        const next = String(msg || "").trim();
        if (e && next) {
          e.msg = next;
          saveEntries(entries);
          refreshTravelObjs();
          audio.confirm();
          toast(`✎ ${e.country} — message updated`);
        }
        return decorate(entries);
      },
      onMove: (id) => {
        const entries = travelEntries();
        const e = entries.find((x) => x.id === id);
        if (e) {
          const spot = travelFreeSpot(MAPS.route);
          e.x = spot.x;
          e.y = spot.y;
          saveEntries(entries);
          refreshTravelObjs();
          audio.confirm();
          toast(`✈ ${e.country} found a new spot`);
        }
        return decorate(entries);
      },
      onDelete: (id) => {
        const all = travelEntries();
        const e = all.find((x) => x.id === id);
        const entries = all.filter((x) => x.id !== id);
        saveEntries(entries);
        if (e && state.map === "route") sparkleBurst(k.vec2(e.x * T + 8, e.y * T + 8), 8);
        refreshTravelObjs();
        audio.close();
        toast(`💥 ${e ? e.country : "monument"} demolished`);
        return decorate(entries);
      },
    };
  }

  // Monuments are wide sprites with readable signposts under them, so two of
  // them on neighbouring tiles overlap into one unreadable pile. Every landmark
  // — authored prop, logged trip, or NPC — needs a clear tile between it and
  // the next one.
  const GAP = 2; // Chebyshev tiles: 2 means "never directly adjacent"
  const clearOf = (list, x, y) =>
    !list.some((o) => Math.abs(o.x - x) < GAP && Math.abs(o.y - y) < GAP);

  function travelFreeSpot(def, entriesOverride) {
    const entries = entriesOverride || travelEntries();
    const placed = entries.filter((e) => !e.soon && Number.isFinite(e.x));
    for (let i = 0; i < 400; i++) {
      const x = 2 + Math.floor(Math.random() * (def.ground[0].length - 4));
      const y = 2 + Math.floor(Math.random() * (def.ground.length - 4));
      if (def.ground[y][x] !== "." || def.objects[y][x] !== ".") continue;
      if ("T" === def.objects[y - 1]?.[x] || "T" === def.objects[y + 1]?.[x]) continue;
      if (!clearOf(placed, x, y)) continue;          // …and not beside a trip
      if (!clearOf(def.props || [], x, y)) continue; // …or a heritage landmark
      if (!clearOf(def.npcs || [], x, y)) continue;
      let bad = false;
      for (const pt of def.points || []) if (x >= pt.x - 1 && x <= pt.x + pt.w && y >= pt.y - 1 && y <= pt.y + pt.h) bad = true;
      for (const f of [...(def.figs || []), ...(def.pumpkins || [])]) if (f.x === x && f.y === y) bad = true;
      if (!bad) return { x, y };
    }
    return { x: 21, y: 6 }; // guaranteed-clear fallback
  }

  /** Trips logged before the spacing rule existed can already be sitting on top
   *  of each other. Re-home any that are, once, on load. */
  function respaceTravels() {
    const def = MAPS.route;
    const entries = travelEntries();
    const keep = [];
    let moved = 0;
    for (const e of entries) {
      if (e.soon || !Number.isFinite(e.x)) { keep.push(e); continue; }
      if (clearOf(keep.filter((o) => !o.soon && Number.isFinite(o.x)), e.x, e.y)
          && clearOf(def.props || [], e.x, e.y)) {
        keep.push(e);
        continue;
      }
      Object.assign(e, travelFreeSpot(def, keep));
      keep.push(e);
      moved++;
    }
    if (moved) localStorage.setItem("sl_travels", JSON.stringify(entries));
  }

  function addTravelEntry(country, msg) {
    const def = MAPS.route;
    const entries = travelEntries();
    // logging a country we'd planned as "soon" turns the plan into the real
    // trip — its sprite finally appears on the map
    const plan = entries.find((e) => e.soon && normCountry(e.country) === normCountry(country));
    let entry;
    if (plan) {
      delete plan.soon;
      plan.msg = msg;
      Object.assign(plan, travelFreeSpot(def, entries));
      entry = plan;
    } else {
      entry = { id: Date.now(), country, msg, ...travelFreeSpot(def, entries) };
      entries.push(entry);
    }
    localStorage.setItem("sl_travels", JSON.stringify(entries));
    if (state.map === "route") {
      spawnTravel(entry);
      heartBurst(k.vec2(entry.x * T + 8, entry.y * T + 6), 5, 12);
    }
    const visit = visitNumber(entry, entries);
    audio.fanfare();
    toast(plan
      ? `✈ ${entry.country} — we finally went! ♥`
      : visit > 1
        ? `✈ ${country} — trip #${visit}! ♥`
        : `✈ ${country} — added to our little world ♥`);
  }

  // ------------------------------------------------------------ NPC talk
  async function talkNoah() {
    const n = state.noah;
    if (!n) return;
    audio.noahVoice(); // plays only if a recorded sample exists
    faceEachOther(n, state.player);
    if (!save.met) {
      state.cutscene = true;
      const greet = memories.noah?.[`greet_${state.map}`] || memories.noah?.greet_la || FALLBACK_LINES;
      await dialogue.show(greet);
      save.met = true;
      n.isPosted = false;
      if (n.has("body")) n.unuse("body");
      n.lag = 8;
      if (!state.party.includes(n)) state.party.push(n);
      heartBurst(n.pos.add(0, -18), 3, 8);
      persist();
      state.cutscene = false;
      return;
    }
    if (finaleReady() && !save.finale) {
      const prompt = memories.finale?.prompt || FALLBACK_LINES;
      await dialogue.show(prompt);
      addFinaleMarker();
      return;
    }
    const pool = save.finale && memories.noah?.after?.length ? memories.noah.after : memories.noah?.chat || [];
    if (!pool.length) return dialogue.show(FALLBACK_LINES);
    const lines = pool[state.chatIdx % pool.length];
    state.chatIdx++;
    await dialogue.show(lines);
  }

  // one-liner pools for the animals that joined her
  const PET_CHATTER = {
    leo: [
      ["(Leo flops over sideways with total confidence that someone will catch him.)"],
      ["Leo: mrrrp.", "(that was the whole speech.)"],
      ["(Leo and Mookie exchange a long look. Diplomacy is ongoing.)"],
    ],
    charlie: [
      ["(Charlie's whole back half is wagging. All of it.)"],
      ["Charlie: !!!!!", "(he has no further comment.)"],
      ["(Charlie tries to herd the cats. It is not going well. He is undeterred.)"],
    ],
    chakra: [
      ["(Chakra sits on your foot. Both of your feet. It's fine, you didn't need those.)"],
      ["Chakra: whuff.", "(that was the deepest sound anyone has ever made.)"],
      ["(Charlie has been trying to get Chakra to play for ten minutes. She has blinked once.)"],
      ["(Chakra checks over her shoulder every few steps to make sure you're still there. 🖤)"],
    ],
    collie: [
      ["(Charlie — the collie one — has already run the length of the street twice.)",
       "(He is back. He is somehow not tired.)"],
      ["(He drops a stick at your feet. You did not throw a stick. He found a stick.)"],
      ["(Charlie is very carefully herding the entire group into a tighter shape.)",
       "(Nobody agreed to this. It is working anyway.)"],
      ["(Charlie glances at Mookie. Mookie does not glance back.)",
       "(Charlie decides to walk on the far side of you. Just in case. 👀)"],
      ["(Two Charlies. You call one name and get two heads.)",
       { who: "noah", text: "we've fully accepted it. they answer as a unit now." }],
      ["Charlie: !!!", "(one eye is black, one eye is white, both eyes are locked on you.)"],
    ],
  };

  async function talkPet(pet) {
    const id = pet.crewId || "mookie";
    if (id === "mookie") audio.meow(); else audio.confirm();
    heartBurst(pet.pos.add(0, -14), 1, 4);
    let pool = id === "mookie"
      ? (memories.mookie?.lines || ["(mookie looks at you like you owe him money.)"])
      : (memories.pets?.[id] || PET_CHATTER[id] || [["(they are delighted to see you.)"]]);
    const lines = pool[state.catIdx % pool.length];
    state.catIdx++;
    await dialogue.show(lines);
  }

  async function talkTownsfolk(npc) {
    // face the player
    const d = state.player.pos.sub(npc.pos);
    npc.dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? "right" : "left") : d.y > 0 ? "down" : "up";
    setAnim(npc, false, npc.dir);
    audio.confirm();

    // people with a `point` are memories: their lines come from memories.json
    // and reading them ticks the ♥ counter.
    if (npc.pointId) {
      const first = !save.seen.has(npc.pointId);
      await dialogue.show(linesFor(npc.pointId));
      if (first) {
        save.seen.add(npc.pointId);
        if (npc.marker?.exists()) { sparkleBurst(npc.marker.pos.add(0, -4)); npc.marker.destroy(); }
        updateHUD();
        persist();
      }
      if (npc.joinId && !save.crew.has(npc.joinId)) {
        const at = npc.pos.clone();
        npc.destroy();
        recruit(npc.joinId, at);
      }
      if (first) checkFinaleReady();
      npc.dir = npc.homeDir;
      return;
    }

    let lines = memories.npcs?.[npc.npcId] || NPC_FALLBACK[npc.npcId] || [{ text: "(they smile and wave.)" }];
    if (lines.length && Array.isArray(lines[0])) lines = lines[npc.said++ % lines.length]; // multiple sets
    await dialogue.show(lines);
    npc.dir = npc.homeDir;
  }

  // ------------------------------------------------------------ interaction
  async function interactPoint(zone) {
    const id = zone.pointId;
    // the finale is at the apartment window now, not on the street outside —
    // so the front door stays a door and she can always get back to the tank
    if (id === "jvue_home" && finaleReady() && !save.finale) return runFinale();
    if (id === "route_quad" && save.seen.has(id)) return mount(); // seen the memory → ride
    if (id === "garden" && save.seen.has(id)) return pickTomato();
    if (id === "jvue_tank" && save.seen.has(id)) return openAquarium();
    if (id === "jvue_herbs" && save.seen.has(id)) return openGreenhouse();
    if (id === "travel_station" && save.seen.has(id)) return ui.openTravelForm(travelManage());
    // a door she's already opened once just opens again
    if (zone.enterTo && save.seen.has(id)) {
      audio.confirm();
      return goMap(zone.enterTo, zone.enterSpawn);
    }
    if (id === "radio") { audio.kpop(); heartBurst(zone.focusPos.clone(), 7, 16, [162, 108, 255]); }
    if (id === "beach_horse") { audio.neigh(); heartBurst(zone.focusPos.clone(), 3, 10); }
    audio.confirm();
    await dialogue.show(linesFor(id));
    if (zone.givesFig && !save.figs.has(zone.givesFig)) {
      collectFig(zone.givesFig, zone.focusPos.clone());
      k.get("figtreeProp").forEach((t) => (t.frame = 1));
    }
    if (!save.seen.has(id)) {
      save.seen.add(id);
      if (zone.marker?.exists()) { sparkleBurst(zone.marker.pos.add(0, -4)); zone.marker.destroy(); }
      updateHUD();
      persist();
      checkFinaleReady();
      if (id === "route_quad") mount(); // first time: memory, then she rides off
      if (id === "garden") pickTomato();
      if (id === "travel_station") ui.openTravelForm(travelManage());
      if (id === "innout_order") collectOrder(zone);
      if (id === "jvue_tank") openAquarium();
      if (id === "jvue_herbs") openGreenhouse();
      if (zone.enterTo) goMap(zone.enterTo, zone.enterSpawn);
    }
  }

  // ------------------------------------------------------------ minigames 🐠🌱
  // Both take over the whole screen (a DOM canvas over the top of kaplay), so
  // the world has to know it's paused while one is open — otherwise she walks
  // out of the room behind it.
  function minigameCtx() {
    return {
      audio,
      dialogue,
      toast,
      save,                              // read-only, for the unlock gates
      onOpen: () => { state.cutscene = true; },
      onClose: () => { state.cutscene = false; state.exitCooldown = 0.4; },
    };
  }
  function openAquarium() {
    audio.confirm();
    openTank(minigameCtx(), unlockedFish());
  }
  function openGreenhouse() {
    audio.confirm();
    openGarden(minigameCtx());
  }

  /** Which fish are swimming, based on what she's actually done in the game.
   *  Every milestone is something she earned somewhere else in the world ♥ */
  function unlockedFish() {
    const memCount = [...save.seen].filter((i) => requiredIds.includes(i)).length;
    const totals = { mem: requiredIds.length, figs: figIds.length, pumps: pumpkinIds.length };
    return FISH.map((f) => ({ ...f, unlocked: !!f.test(save, memCount, totals) }));
  }

  /** the tray lands, and the two of them get the paper hats 🍔 */
  function collectOrder(zone) {
    // the tray is a normal prop with `after: "innout_order"`, so it will be
    // there on every later visit — this is just so it appears now, in front of
    // her, instead of the next time she walks in
    const tray = MAPS[state.map].props.find((p) => p.type === "in_tray");
    if (tray) {
      const py = (tray.y + 1) * T;
      k.add([k.sprite("in_tray"), k.pos((tray.x + 0.5) * T, py),
        k.anchor("bot"), k.z(py + 34)]);
    }
    audio.fanfare();
    heartBurst(zone.focusPos.clone().add(0, -10), 7, 16);
    wearHats();
  }

  /** swap her and Noah onto their hatted sheets. `use()` drops the current
   *  animation, but the walk/idle state is re-derived every frame, so it snaps
   *  back on the next tick. */
  function wearHats() {
    if (save.hats) return;
    save.hats = true;
    persist();
    if (state.player) state.player.use(k.sprite("her_hat", { anim: "idle-down" }));
    if (state.noah) state.noah.use(k.sprite("noah_hat", { anim: "idle-down" }));
    toast("two paper hats, on the house 🍔♥");
  }

  function doInteract() {
    if (!state.started || ui.travelOpen?.()) return;
    if (dialogue.advance()) return;
    if (state.cutscene || state.transitioning || state.paused) return;
    if (state.mounted) return dismount();
    const f = state.focus;
    if (!f) return;
    if (f.kind === "point") interactPoint(f.obj);
    else if (f.kind === "noah") talkNoah();
    else if (f.kind === "pet") talkPet(f.obj);
    else if (f.kind === "npc") talkTownsfolk(f.obj);
    else if (f.kind === "sign") {
      audio.blip();
      // lines may already be {who,text} objects (heritage dialogue) — only
      // plain strings (regular signs / simple travel postcards) get wrapped
      dialogue.show(f.obj.lines.map((t) => (typeof t === "string" ? { text: t } : t)));
    }
    else if (f.kind === "quad") mount();
  }

  // --------------------------------------------------------- baked ground
  // Drawing every tile as its own game object cost ~1,300 objects on Mini LA
  // once the beach got wider, and the frame rate showed it. Instead each map's
  // static floor is stamped into an offscreen canvas once and handed to kaplay
  // as a single sprite; the animated tiles (water, flowers) are the only ones
  // that stay as objects. Baked sprites live in kaplay's asset store, which
  // survives scene rebuilds, so this runs once per map per session.
  const BAKED = new Set();
  const WATER_BOX = new Map();      // map name → [tileX, tileY] of the strip

  function bakeGround(name, def, cols, rows, staticFrame) {
    if (BAKED.has(name)) return;
    const img = tilesMeta.image;
    const at = (frame) =>
      [(frame % tilesMeta.cols) * T, Math.floor(frame / tilesMeta.cols) * T];
    const surface = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      return [c, g];
    };

    const [floor, fg] = surface(cols * T, rows * T);
    let wx0 = Infinity, wy0 = Infinity, wx1 = -1, wy1 = -1;
    for (let y = 0; y < rows; y++) {
      const row = def.ground[y];
      for (let x = 0; x < cols; x++) {
        if (row[x] === "w") {       // note the extent, draw it separately
          if (x < wx0) wx0 = x;
          if (y < wy0) wy0 = y;
          if (x > wx1) wx1 = x;
          if (y > wy1) wy1 = y;
          continue;
        }
        const frame = staticFrame(row[x], x, y);
        if (frame == null) continue;
        const [sx, sy] = at(frame);
        fg.drawImage(img, sx, sy, T, T, x * T, y * T, T, T);
      }
    }
    k.loadSprite(`bake_${name}`, floor, { singular: true });

    if (wx1 >= 0) {
      const ww = wx1 - wx0 + 1;
      const wh = wy1 - wy0 + 1;
      const [strip, sg] = surface(ww * T * 3, wh * T);
      for (let phase = 0; phase < 3; phase++) {
        const [sx, sy] = at(F[`water_${phase}`]);
        for (let y = wy0; y <= wy1; y++) {
          for (let x = wx0; x <= wx1; x++) {
            if (def.ground[y][x] !== "w") continue;
            sg.drawImage(img, sx, sy, T, T,
              (phase * ww + x - wx0) * T, (y - wy0) * T, T, T);
          }
        }
      }
      k.loadSprite(`water_${name}`, strip, {
        singular: true, sliceX: 3, sliceY: 1,
        anims: { live: { from: 0, to: 2, speed: 2, loop: true, pingpong: true } },
      });
      WATER_BOX.set(name, [wx0, wy0]);
    }
    BAKED.add(name);
  }

  // ------------------------------------------------------------ scene builder
  k.scene("map", ({ map, spawn, pos }) => {
    const def = MAPS[map];
    state.map = map;
    state.trail = [];
    state.party = [];   // objects were destroyed with the old scene
    state.focus = null;
    state.noah = null;
    state.mookie = null;
    validate(def, map);

    const cols = def.ground[0].length;
    const rows = def.ground.length;

    // ---- ground
    const grassVar = (x, y) => {
      const h = (x * 31 + y * 17 + x * y) % 10;
      return h < 7 ? F.grass_a : h < 9 ? F.grass_b : F.grass_c;
    };
    // neighbor-mask autotiling: open sides of paths/sand get wavy grass edges
    const PATHY = new Set(["-", "k", "r", "R", "s"]);
    const SANDY = new Set(["s", "w", "-", "k", "r", "R"]);
    const maskAt = (x, y, set) => {
      const at = (a, b) => {
        const row = def.ground[b];
        if (!row || a < 0 || a >= row.length) return true; // map edge = connected
        return set.has(row[a]);
      };
      return (at(x, y - 1) ? 1 : 0) | (at(x + 1, y) ? 2 : 0) | (at(x, y + 1) ? 4 : 0) | (at(x - 1, y) ? 8 : 0);
    };
    const FLOWER_ANIMS = ["flower", "flower2", "flower3"];
    const woodVar = (x, y) => {
      const h = (x * 13 + y * 7) % 3;
      return h === 0 ? F.wood_a : h === 1 ? F.wood_b : F.wood_c;
    };
    const oakVar = (x, y) => {
      const h = (x * 11 + y * 5) % 3;
      return h === 0 ? F.jv_oak_a : h === 1 ? F.jv_oak_b : F.jv_oak_c;
    };
    // atlas frame for a tile, or null if that tile animates and therefore has
    // to stay a real game object
    const staticFrame = (sym, x, y) => {
      switch (sym) {
        case ".": return grassVar(x, y);
        case "t": return F.tallgrass;
        case "-": return F[`path_${maskAt(x, y, PATHY)}`];
        case "s": return F[`sand_${maskAt(x, y, SANDY)}`];
        case "r": return F.road;
        case "R": return F.road_dash;
        case "k": return F.sidewalk;
        // ---- interiors 🏡
        case ",": return woodVar(x, y);
        case ";": return F[`rug_${(x + y) % 2 ? "a" : "b"}`];
        case "~": return F[`boho_${(x + y) % 2 ? "a" : "b"}`];
        case ":": return F.ktile;
        case "#": return F.wallface;
        case "%": return F.walltop;
        case "V": return F.wallwin;
        case "C": return F.wallpic;
        case "M": return F.wallmac;
        case "H": return F.wallherb;
        case "X": return F.wallstair;
        case "D": return F.indoor;
        // ---- the burger place 🍔
        case "x": return (x + y) % 2 ? F.chk_a : F.chk_b;
        case "Y": return F.io_top;
        case "I": return F.io_face;
        case "O": return F.io_win;
        case "K": return F.io_counter;
        case "Z": return F.io_door;
        // ---- JVUE 🏢
        case "1": return oakVar(x, y);
        case "_": return F.jv_rug;
        case "^": return F.jv_top;
        case "!": return F.jv_face;
        case "2": return F.jv_win;
        case "+": return F.jv_wintop;
        case "3": return F.jv_art;
        case "4": return F.jv_door;
        // ---- Northeastern 🎓
        case "5": return F.nu_floor;
        case "7": return F.nu_top;
        case "6": return F.nu_face;
        case "8": return F.nu_win;
        case "9": return F.nu_map;
        case "0": return F.nu_door;
        // ---- BU robotics 🤖
        case "a": return F.lab_floor;
        case "Q": return F.lab_top;
        case "q": return F.lab_face;
        case "e": return F.lab_win;
        case "u": return F.lab_board;
        case "U": return F.lab_door;
        // ---- Cafe Bene ☕
        case "g": return F.cf_floor;
        case "A": return F.cf_top;
        case "G": return F.cf_face;
        case "B": return F.cf_win;
        case "J": return F.cf_menu;
        case "L": return F.cf_door;
        default: return null;   // "*" flowers and "w" water
      }
    };
    bakeGround(map, def, cols, rows, staticFrame);

    // one sprite for the whole static floor instead of ~1,300 tile objects
    k.add([k.sprite(`bake_${map}`), k.pos(0, 0), k.anchor("topleft"), k.z(-1000)]);
    // …and one three-frame sprite for all the water, wherever it is
    const wbox = WATER_BOX.get(map);
    if (wbox) {
      k.add([k.sprite(`water_${map}`, { anim: "live" }),
        k.pos(wbox[0] * T, wbox[1] * T), k.anchor("topleft"), k.z(-999)]);
    }
    // flowers are the only ground tiles left that need their own object
    for (let y = 0; y < rows; y++) {
      const row = def.ground[y];
      for (let x = 0; x < cols; x++) {
        if (row[x] !== "*") continue;
        k.add([k.sprite("tiles", { anim: FLOWER_ANIMS[(x * 3 + y * 5) % 3] }),
          k.pos(x * T, y * T), k.anchor("topleft"), k.z(-998)]);
      }
    }

    // ---- blocked ground (water outside, walls inside). Horizontal runs get
    // merged, then identical runs stack vertically — the LA ocean goes from 34
    // colliders down to one.
    const SOLID_GROUND = new Set(["w", "#", "%", "V", "C", "M", "H", "X", "D",
      "Y", "I", "O", "K", "Z",
      "^", "!", "2", "3", "4", "+",         // JVUE 🏢
      "7", "6", "8", "9", "0",              // Northeastern 🎓
      "Q", "q", "e", "u", "U",              // BU robotics 🤖
      "A", "G", "B", "J", "L"]);            // Cafe Bene ☕
    const slabs = [];
    let openRuns = new Map();       // "x0,x1" → index into slabs
    def.ground.forEach((row, y) => {
      const next = new Map();
      let x = 0;
      while (x < row.length) {
        if (!SOLID_GROUND.has(row[x])) { x++; continue; }
        let x2 = x;
        while (x2 < row.length && SOLID_GROUND.has(row[x2])) x2++;
        const key = `${x},${x2}`;
        const prev = openRuns.get(key);
        if (prev !== undefined && slabs[prev].y1 === y) {
          slabs[prev].y1 = y + 1;
          next.set(key, prev);
        } else {
          slabs.push({ x0: x, x1: x2, y0: y, y1: y + 1 });
          next.set(key, slabs.length - 1);
        }
        x = x2;
      }
      openRuns = next;
    });
    for (const s of slabs) {
      solidRect(s.x0 * T, s.y0 * T, (s.x1 - s.x0) * T, (s.y1 - s.y0) * T);
    }

    // ---- map perimeter
    solidRect(-T, -T, cols * T + 2 * T, T);
    solidRect(-T, rows * T, cols * T + 2 * T, T);
    solidRect(-T, 0, T, rows * T);
    solidRect(cols * T, 0, T, rows * T);

    function solidRect(x, y, w, h) {
      k.add([k.pos(x, y), k.area({ shape: new k.Rect(k.vec2(0), w, h) }), k.body({ isStatic: true })]);
    }

    // ---- objects grid ([sprite, atlasFrame|null, offsetX, hitW, hitH])
    const OBJ = {
      T: ["tree", null, -6, 12, 6],
      P: ["palm", null, -6, 12, 6],
      f: ["tiles", F.fence, -8, 16, 13],
      b: ["tiles", F.bush, -7, 14, 10],
      r: ["tiles", F.rock, -6, 12, 7],
      l: ["lamp", null, -3, 6, 4],
      n: ["bench", null, -11, 22, 8],
      s: ["tiles", F.sign, -6, 12, 9],
      c: ["barrier", null, -11, 22, 8],
    };
    def.objects.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const o = OBJ[ch];
        if (!o) return;
        let [name, frame, ox, w, h] = o;
        if (ch === "b") frame = (x * 7 + y * 11) % 2 ? F.bush : F.bush_b; // variety
        const comps = [
          frame === null ? k.sprite(name) : k.sprite(name, { frame }),
          k.pos(x * T + 8, y * T + T),
          k.anchor("bot"),
          k.area({ shape: new k.Rect(k.vec2(ox, -h), w, h) }),
          k.body({ isStatic: true }),
          k.z(y * T + T),
        ];
        // signs with directions/distances become readable (E to read)
        const signLines = ch === "s" ? def.signs?.[`${x},${y}`] : null;
        if (signLines) comps.push("signpost", { lines: signLines });
        k.add(comps);
      });
    });

    // ---- buildings
    for (const b of def.buildings) {
      const m = BUILDING_META[b.sprite];
      const baseY = (b.y + 1) * T;
      k.add([k.sprite(b.sprite), k.pos(b.x * T + m.wt * 8, baseY), k.anchor("bot"), k.z(baseY)]);
      solidRect(b.x * T, baseY - m.ht * T, m.wt * T, m.ht * T);
      if (b.point) {
        const doorCol = m.doorCol ?? Math.floor(m.wt / 2);
        const zone = addPointZone({ id: b.point, x: b.x + doorCol, y: b.y + 1, w: 1, h: 1 });
        if (b.enter) { zone.enterTo = b.enter.to; zone.enterSpawn = b.enter.spawn; }
      }
    }

    // ---- props
    const DECOR = {
      column: { ox: -4, w: 8, h: 5 },
      pyramid: { ox: -13, w: 26, h: 8 },
      cypress: { ox: -3, w: 6, h: 5 },
      matryoshka: { ox: -4, w: 8, h: 5 },
      radio: { ox: -6, w: 12, h: 6 },
      horse: { ox: -10, w: 20, h: 8 },
      pisa: { ox: -5, w: 10, h: 6 },
      cactus: { ox: -6, w: 12, h: 6 },
      barrel: { ox: -6, w: 12, h: 6 },
      station: { ox: -10, w: 20, h: 8 },
      // 🇦🇼 Aruba
      divi: { ox: -8, w: 16, h: 6 },
      palapa: { ox: -22, w: 44, h: 11 },
      beachsign: { ox: -6, w: 12, h: 5 },
      // 🌊 the LA beach + 🍔 the sign by the road
      lifeguard: { ox: -13, w: 26, h: 11 },
      umbrella: { ox: -4, w: 8, h: 5 },
      surfboards: { ox: -10, w: 20, h: 6 },
      volley: { ox: -21, w: 42, h: 6 },
      sandcastle: { ox: -12, w: 24, h: 8 },
      innoutsign: { ox: -12, w: 24, h: 6 },
      // 🦢 the esplanade
      bandshell: { ox: -24, w: 48, h: 12 },
      willow: { ox: -6, w: 12, h: 6 },
      esplsign: { ox: -13, w: 26, h: 6 },
      jvuesign: { ox: -20, w: 40, h: 8 },
      // 🏡 interiors
      in_sofa: { ox: -23, w: 46, h: 12 },
      in_table: { ox: -25, w: 50, h: 16 },
      in_counter: { ox: -32, w: 64, h: 20 },
      in_fridge: { ox: -10, w: 20, h: 12 },
      in_shelf: { ox: -13, w: 26, h: 14 },
      in_plant: { ox: -7, w: 14, h: 8 },
      in_lamp: { ox: -5, w: 10, h: 5 },
      in_rods: { ox: -10, w: 20, h: 9 },
      // 🌻 the garden
      vegbed: { ox: -19, w: 38, h: 12 },
      vegbed_b: { ox: -19, w: 38, h: 12 },
      corn: { ox: -8, w: 16, h: 7 },
      sunflower: { ox: -7, w: 14, h: 6 },
      logseat: { ox: -11, w: 22, h: 7 },
      hammock: { ox: -22, w: 44, h: 10 },
      trellis: { ox: -14, w: 28, h: 8 },
      herbpots: { ox: -13, w: 26, h: 8 },
      dreamcatcher: { ox: 0, w: 8, h: 4 },
      bus: { ox: -22, w: 44, h: 12 },
      // 🌿 …and the rooms behind it
      in_sofa2: { ox: -25, w: 50, h: 13 },
      in_record: { ox: -13, w: 26, h: 12 },
      in_guitar: { ox: -8, w: 16, h: 8 },
      in_bigplant: { ox: -10, w: 20, h: 12 },
      in_jars: { ox: -14, w: 28, h: 14 },
      in_samovar: { ox: -12, w: 24, h: 14 },
      // 🍔 the burger place. The line sits behind a counter she can't cross, so
      // these only need colliders deep enough to stop her clipping their fronts.
      in_frystation: { ox: -24, w: 48, h: 10 },
      in_shakes: { ox: -15, w: 30, h: 10 },
      in_drinks: { ox: -18, w: 36, h: 10 },
      in_booth: { ox: -23, w: 46, h: 24 },
      // 🏢 JVUE — their apartment
      in_sofagray: { ox: -24, w: 48, h: 12 },
      in_coffeetable: { ox: -16, w: 32, h: 10 },
      in_herbwindow: { ox: -17, w: 34, h: 10 },
      in_boxes: { ox: -17, w: 34, h: 16 },
      in_kitchen2: { ox: -32, w: 64, h: 20 },
      in_bed: { ox: -22, w: 44, h: 24 },
      in_desk: { ox: -21, w: 42, h: 14 },
      // 🏡 Brookline
      in_recliner: { ox: -14, w: 28, h: 14 },
      in_bakerack: { ox: -17, w: 34, h: 10 },
      in_hutch: { ox: -15, w: 30, h: 16 },
      // 🎓 Northeastern
      in_worldwall: { ox: -32, w: 64, h: 8 },
      in_globe: { ox: -13, w: 26, h: 10 },
      in_unhorseshoe: { ox: -34, w: 68, h: 14 },
      in_flagrow: { ox: -26, w: 52, h: 6 },
      in_coopboard: { ox: -22, w: 44, h: 8 },
      in_lecternrows: { ox: -33, w: 66, h: 24 },
      in_lectern: { ox: -12, w: 24, h: 14 },
      // 🤖 BU robotics
      in_workbench: { ox: -30, w: 60, h: 14 },
      in_partsbin: { ox: -17, w: 34, h: 16 },
      in_rover: { ox: -14, w: 28, h: 8 },
      in_drone: { ox: -15, w: 30, h: 8 },
      // ☕ Cafe Bene
      in_cafetable: { ox: -14, w: 28, h: 16 },
      in_cafecounter: { ox: -33, w: 66, h: 18 },
      in_pastrycase: { ox: -17, w: 34, h: 12 },
      in_hingeframe: { ox: -15, w: 30, h: 6 },
      in_armchair: { ox: -14, w: 28, h: 14 },
      in_beanshelf: { ox: -16, w: 32, h: 14 },
    };
    // props with more than one frame that just sit there and cycle. The frame
    // count and speed live in main.js (the loader); all any of them need here
    // is a collision box — the anim is always called "live".
    const FLICKER = {
      in_tv: { ox: -17, w: 34, h: 12 },
      in_fire: { ox: -20, w: 40, h: 12 },
      in_stove: { ox: -13, w: 26, h: 14 },
      firepit: { ox: -17, w: 34, h: 11 },
      in_tvmount: { ox: -21, w: 42, h: 12 },
      in_aquarium: { ox: -23, w: 46, h: 16 },
      in_robotarm: { ox: -12, w: 24, h: 12 },
      in_printer3d: { ox: -15, w: 30, h: 12 },
      in_espresso: { ox: -16, w: 32, h: 10 },
    };
    // decor with no collider. FLOOR_* sits flat on the ground, so it draws
    // underneath whoever is standing on it (pet beds, starfish…)
    const FLOOR_DECOR = new Set(["starfish", "in_petbeds", "in_bowl",
      "in_dogbed", "in_cushions", "in_ball", "in_gymbags"]);
    // in_hangplant hangs off the ceiling — she walks under it, not through it
    const SOFT_DECOR = new Set(["lounger", "in_hangplant", "in_menuboard",
      "in_till", "in_hatstack", "in_tray", ...FLOOR_DECOR]);
    // things that sit ON something else and have to beat its z to be seen: the
    // tray is on a booth table, the till and the hats are on the counter
    const ON_TOP = { in_tray: 34, in_till: 8, in_hatstack: 8 };
    for (const p of def.props || []) {
      // `after` gates a prop on a memory being read — the burger tray doesn't
      // exist until she's actually ordered it
      if (p.after && !save.seen.has(p.after)) continue;
      const px = (p.x + 0.5) * T;
      const py = (p.y + 1) * T;
      if (p.type === "pool") {
        const pool = k.add([
          k.sprite("pool", { anim: "live" }), k.pos(px, py), k.anchor("bot"),
          k.area({ shape: new k.Rect(k.vec2(-36, -34), 72, 26) }),
          k.body({ isStatic: true }), k.z(py),
        ]);
        pool.z = py - 2; // she can stand on the near deck
      } else if (p.type === "turtle") {
        k.add([
          k.sprite("turtle", { anim: "live" }), k.pos(px, py), k.anchor("bot"),
          k.area({ shape: new k.Rect(k.vec2(-11, -8), 22, 8) }),
          k.body({ isStatic: true }), k.z(py),
        ]);
      } else if (FLICKER[p.type]) {
        const d = FLICKER[p.type];
        k.add([
          k.sprite(p.type, { anim: "live" }), k.pos(px, py), k.anchor("bot"),
          k.area({ shape: new k.Rect(k.vec2(d.ox, -d.h), d.w, d.h) }),
          k.body({ isStatic: true }), k.z(py),
        ]);
      } else if (SOFT_DECOR.has(p.type)) {
        k.add([k.sprite(p.type), k.pos(px, py), k.anchor("bot"),
          k.z(FLOOR_DECOR.has(p.type) ? py - 24 : py + (ON_TOP[p.type] || 0))]);
      } else if (p.type === "figtree") {
        k.add([
          k.sprite("figtree", { frame: save.figs.has("fig_tree") ? 1 : 0 }),
          k.pos(px, py), k.anchor("bot"),
          k.area({ shape: new k.Rect(k.vec2(-10, -6), 20, 6) }), k.body({ isStatic: true }),
          k.z(py), "figtreeProp",
        ]);
      } else if (p.type === "quad") {
        if (!save.mounted) spawnQuadParked(px, py); // she rode it off somewhere
      } else if (p.type === "garden") {
        k.add([
          k.sprite("garden", { frame: 0 }),
          k.pos(px, py), k.anchor("bot"),
          k.area({ shape: new k.Rect(k.vec2(-17, -14), 34, 14) }),
          k.body({ isStatic: true }), k.z(py), "gardenProp",
        ]);
      } else if (DECOR[p.type]) {
        const d = DECOR[p.type];
        k.add([
          k.sprite(p.type), k.pos(px, py), k.anchor("bot"),
          k.area({ shape: new k.Rect(k.vec2(d.ox, -d.h), d.w, d.h) }),
          k.body({ isStatic: true }), k.z(py),
        ]);
      } else if (p.type === "torii") {
        k.add([k.sprite("torii"), k.pos(px, py), k.anchor("bot"), k.z(py)]);
      } else if (p.type === "sailboat") {
        const boat = k.add([k.sprite("sailboat"), k.pos(px, py), k.anchor("bot"),
          k.z(py), { t: k.rand(0, 6) }]);
        boat.onUpdate(() => {
          boat.t += k.dt();
          boat.pos.y = py + Math.sin(boat.t * 1.3) * 2;
          boat.pos.x = px + Math.sin(boat.t * 0.35) * 14;
        });
      }
    }

    // ---- memory points
    function addPointZone(p) {
      const zone = k.add([
        k.pos(p.x * T, p.y * T),
        k.area({ shape: new k.Rect(k.vec2(0), p.w * T, p.h * T) }),
        "pointZone",
        {
          pointId: p.id,
          givesFig: p.givesFig || null,
          focusPos: k.vec2((p.x + p.w / 2) * T, p.y * T + 4),
          marker: null,
        },
      ]);
      if (!save.seen.has(p.id)) {
        zone.marker = k.add([
          k.sprite("fx", { anim: "sparkle" }),
          k.pos(zone.focusPos.x, p.y * T - 8), k.anchor("bot"), k.z(1e5), { t: k.rand(0, 5) },
        ]);
        const my = p.y * T - 8;
        zone.marker.onUpdate(() => { zone.marker.t += k.dt(); zone.marker.pos.y = my + Math.sin(zone.marker.t * 2.5) * 2; });
      }
      return zone;
    }
    for (const p of def.points) addPointZone(p);

    // ---- figs
    for (const f of def.figs) {
      if (save.figs.has(f.id)) continue;
      k.add([
        k.sprite("fig", { anim: "twinkle" }),
        k.pos(f.x * T + 8, f.y * T + 14), k.anchor("bot"),
        k.area({ shape: new k.Rect(k.vec2(-6, -10), 12, 10) }),
        k.z(f.y * T + 14),
        "figPickup", { figId: f.id },
      ]);
    }

    // ---- pumpkins (PUMPKINN!!)
    for (const p of def.pumpkins || []) {
      if (save.pumps.has(p.id)) continue;
      k.add([
        k.sprite("pumpkin", { anim: "twinkle" }),
        k.pos(p.x * T + 8, p.y * T + 14), k.anchor("bot"),
        k.area({ shape: new k.Rect(k.vec2(-6, -10), 12, 10) }),
        k.z(p.y * T + 14),
        "pumpkinPickup", { pumpId: p.id },
      ]);
    }

    // ---- townsfolk NPCs (background flavor + the house crew)
    for (const n of def.npcs || []) {
      // an animal that already left with her isn't standing here any more
      if (n.join && save.crew.has(n.join)) continue;
      const px = (n.x + 0.5) * T;
      const py = (n.y + 1) * T;
      const dir = n.dir || "down";
      const kind = dir === "left" || dir === "right" ? "side" : dir;
      const c = k.add([
        k.sprite(n.sprite, { anim: `idle-${kind}` }),
        k.pos(px, py), k.anchor("bot"),
        k.area({ shape: new k.Rect(k.vec2(-5, -8), 10, 8) }),
        k.body({ isStatic: true }),
        k.z(py), "townsfolk",
        {
          npcId: n.id, dir, homeDir: dir, bobT: k.rand(0, 6), said: 0,
          pointId: n.point || null, joinId: n.join || null, isPet: !!n.pet,
        },
      ]);
      if (kind === "side") c.flipX = dir === "left";
      addShadow(c);
      // people with a memory get the same sparkle as a memory spot
      if (n.point && !save.seen.has(n.point)) {
        const my = py - (n.pet ? 20 : 34);
        const mk = k.add([
          k.sprite("fx", { anim: "sparkle" }),
          k.pos(px, my), k.anchor("bot"), k.z(1e5), { t: k.rand(0, 5) },
        ]);
        mk.onUpdate(() => { mk.t += k.dt(); mk.pos.y = my + Math.sin(mk.t * 2.5) * 2; });
        c.marker = mk;
      }
      // subtle idle: pets settle into a loaf, people glance around
      c.onUpdate(() => {
        c.bobT += k.dt();
        if (state.focus?.kind === "npc" && state.focus.obj === c) return;
        if (c.isPet) {
          if (c.bobT > 5 && c.curAnim() !== "sit-flick") c.play("sit-flick");
        } else if (c.dir !== c.homeDir) {
          setAnim(c, false, c.homeDir);
        }
      });
    }

    // ---- ambient wildlife: butterflies over the flowers, gulls over water
    if (!def.interior) {
      const flowerSpots = [];
      const seaRows = new Map();   // row → [minX, maxX] of open water
      def.ground.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          if (ch === "*") flowerSpots.push([x, y]);
          else if (ch === "w") {
            const r = seaRows.get(y);
            if (r) { r[0] = Math.min(r[0], x); r[1] = Math.max(r[1], x); }
            else seaRows.set(y, [x, x]);
          }
        });
      });
      // gulls only over real open water — the little pond on the route would
      // otherwise send them gliding across the whole tree line
      const gullRows = [...seaRows.entries()].filter(([, [a, b]]) => b - a >= 2);
      const pick = (list) => list[Math.floor(Math.random() * list.length)];

      for (let i = 0; i < Math.min(7, flowerSpots.length); i++) {
        const [hx, hy] = pick(flowerSpots);
        const b = k.add([
          k.sprite("critters", { anim: "flutter" }),
          k.pos(hx * T + 8, hy * T + 6), k.anchor("center"), k.z(1e4),
          { t: k.rand(0, 9), hx: hx * T + 8, hy: hy * T + 6, r: k.rand(10, 26) },
        ]);
        b.onUpdate(() => {
          b.t += k.dt() * 0.6;
          b.pos.x = b.hx + Math.cos(b.t * 1.7) * b.r;
          b.pos.y = b.hy + Math.sin(b.t * 2.3) * b.r * 0.55 + Math.sin(b.t * 9) * 1.5;
          b.flipX = Math.sin(b.t * 1.7) > 0;
        });
      }
      for (let i = 0; i < Math.min(3, gullRows.length); i++) {
        const [gy, [ax, bx]] = pick(gullRows);
        const x0 = ax * T - 12;
        const x1 = (bx + 1) * T + 12;
        const g = k.add([
          k.sprite("critters", { anim: "glide" }),
          k.pos(x0, gy * T), k.anchor("center"), k.z(1e4),
          { t: k.rand(0, 12), gy: gy * T + 6, x0, span: x1 - x0 },
        ]);
        g.onUpdate(() => {
          g.t += k.dt() * 0.3;
          const u = (g.t % 2) / 2;                      // sweep across, then wrap
          g.pos.x = g.x0 + u * g.span;
          g.pos.y = g.gy + Math.sin(g.t * 3) * 4;
        });
      }
    }

    // ---- her travel log ✈ (auto-generated monuments on Little Everywhere)
    if (map === "route") {
      respaceTravels();   // spread out anything logged before the spacing rule
      for (const e of travelEntries()) spawnTravel(e);
    }

    // ---- exits
    for (const e of def.exits) {
      k.add([
        k.pos(e.x * T, e.y * T),
        k.area({ shape: new k.Rect(k.vec2(0), e.w * T, e.h * T) }),
        "exit", { to: e.to, spawn: e.spawn },
      ]);
    }

    // ---- player + followers
    const [sx, sy] = spawnPx(def, spawn, pos);
    const player = addPlayer(sx, sy);
    state.player = player;
    for (let i = 0; i < 24; i++) state.trail.push(player.pos.clone());

    // ---- the crowd: Mookie always, Noah once met, plus every recruited animal
    // (spread carefully — `sprite`/`name` would collide with kaplay's own
    // component fields, so only the tuning numbers get copied across)
    state.mookie = addFollower("mookie", sx - 14, sy + 6, {
      lag: COMPANIONS.mookie.lag, side: COMPANIONS.mookie.side,
      speed: COMPANIONS.mookie.speed,
      isPet: true, crewId: "mookie", talkKey: "mookie",
    });
    for (const id of save.crew) {
      const c = COMPANIONS[id];
      if (!c) continue;
      addFollower(c.sprite, sx + c.side, sy + 8, {
        lag: c.lag, side: c.side, speed: c.speed,
        isPet: true, crewId: id, talkKey: id,
      });
    }
    if (save.met) {
      state.noah = addFollower(save.hats ? "noah_hat" : "noah",
        sx - 8, sy + 14, { lag: 8, side: 10, speed: 76 });
    } else if (def.noahPost) {
      const [nx, ny] = def.noahPost;
      state.noah = k.add([
        k.sprite(save.hats ? "noah_hat" : "noah", { anim: "idle-down" }),
        k.pos(nx * T + 8, ny * T + 12), k.anchor("bot"),
        k.area({ shape: new k.Rect(k.vec2(-5, -8), 10, 8) }), k.body({ isStatic: true }),
        k.z(ny * T + 12),
        "npc", {
          dir: "down", isPosted: true, idleT: 0, lag: 8, side: 10, speed: 76,
          forcedTarget: null, onArrive: null, isFollower: false, isPet: false,
        },
      ]);
      addShadow(state.noah);
      // posted noah gets follower behavior after being met (talkNoah converts him)
      const n = state.noah;
      state.party.push(n);
      n.onUpdate(() => {
        n.z = n.pos.y;
        if (n.isPosted) {
          // face the player when she's close
          const d = player.pos.sub(n.pos);
          if (d.len() < 40) {
            const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? "right" : "left") : d.y > 0 ? "down" : "up";
            setAnim(n, false, dir);
          }
          return;
        }
        followerStep(n);
      });
    } else {
      state.noah = null;
    }

    // ---- exclamation bubble over posted noah
    if (state.noah && !save.met) {
      const n = state.noah;
      const ex = k.add([k.sprite("fx", { frame: 5 }), k.pos(n.pos.x, n.pos.y - 30), k.anchor("bot"), k.z(1e5), { t: 0 }]);
      ex.onUpdate(() => {
        if (save.met) return ex.destroy();
        ex.t += k.dt();
        ex.pos.y = n.pos.y - 30 + Math.sin(ex.t * 3) * 2;
      });
    }

    // ---- interaction focus + bubble
    const bubble = k.add([k.sprite("fx", { frame: 4 }), k.pos(0, 0), k.anchor("bot"), k.z(1e6), { t: 0 }]);
    bubble.hidden = true;
    k.onUpdate(() => {
      state.exitCooldown = Math.max(0, state.exitCooldown - k.dt());
      let best = null, bestD = 1e9;
      if (!locked() && !state.mounted) {
        for (const z of k.get("pointZone")) {
          const cx = z.pos.x, cy = z.pos.y;
          const zw = z.area.shape.width, zh = z.area.shape.height;
          const px = player.pos.x, py = player.pos.y;
          const pad = 6;
          if (px > cx - pad && px < cx + zw + pad && py > cy - pad && py < cy + zh + pad + 6) {
            const d = k.vec2(cx + zw / 2, cy + zh / 2).dist(player.pos);
            if (d < bestD) { bestD = d; best = { kind: "point", obj: z, focusPos: z.focusPos, yOff: -14 }; }
          }
        }
        if (state.noah) {
          const d = state.noah.pos.dist(player.pos);
          if (d < 26 && d < bestD) { bestD = d; best = { kind: "noah", obj: state.noah, focusPos: state.noah.pos, yOff: -32 }; }
        }
        for (const pet of state.party) {
          if (!pet.crewId || !pet.exists() || pet.hidden) continue;
          const d = pet.pos.dist(player.pos);
          if (d < 20 && d < bestD) { bestD = d; best = { kind: "pet", obj: pet, focusPos: pet.pos, yOff: -18 }; }
        }
        for (const t of k.get("townsfolk")) {
          const d = t.pos.dist(player.pos);
          if (d < 26 && d < bestD) { bestD = d; best = { kind: "npc", obj: t, focusPos: t.pos, yOff: -32 }; }
        }
        for (const s of k.get("signpost")) {
          const d = s.pos.dist(player.pos);
          if (d < 22 && d < bestD) { bestD = d; best = { kind: "sign", obj: s, focusPos: s.pos, yOff: -20 }; }
        }
        if (save.seen.has("route_quad")) {
          for (const q of k.get("quadProp")) {
            const d = q.pos.dist(player.pos);
            if (d < 26 && d < bestD) { bestD = d; best = { kind: "quad", obj: q, focusPos: q.pos, yOff: -18 }; }
          }
        }
      }
      state.focus = best;
      bubble.hidden = !best;
      if (best) {
        bubble.t += k.dt();
        const fp = best.kind === "point" ? best.focusPos : best.obj.pos;
        bubble.pos = k.vec2(fp.x, fp.y + best.yOff + Math.sin(bubble.t * 3) * 1.5);
      }
    });

    // ---- collisions
    player.onCollide("figPickup", (f) => {
      collectFig(f.figId, f.pos.clone());
      f.destroy();
    });
    player.onCollide("pumpkinPickup", (p) => {
      collectPumpkin(p.pumpId, p.pos.clone());
      p.destroy();
    });
    player.onCollide("exit", (e) => {
      if (state.transitioning || state.exitCooldown > 0) return;
      goMap(e.to, e.spawn);
    });

    // ---- entry
    state.mounted = false; // scene objects were rebuilt; remount fresh if needed
    state.rideObj = null;
    if (save.mounted && !def.interior) mount(true); // she arrived on the ATV
    state.exitCooldown = 0.8;
    state.transitioning = false;
    fade(false);
    toast(def.name);
    updateHUD();
    persist();

    if (map === "la" && !save.introDone) {
      save.introDone = true;
      persist();
      setTimeout(() => {
        if (memories.meta?.intro?.length && !dialogue.open) dialogue.show(memories.meta.intro);
      }, 700);
    }
    // the heart marker: over JVUE's door on the street, over the window upstairs
    if ((map === "boston" || map === "bos_jvue_in") && finaleReady() && !save.finale) {
      addFinaleMarker();
    }
  });

  function spawnPx(def, spawn, pos) {
    if (pos) return pos;
    const s = def.spawns[spawn] || Object.values(def.spawns)[0];
    return [s[0] * T + 8, s[1] * T + 12];
  }

  async function goMap(to, spawn) {
    state.transitioning = true;
    audio.close();
    await fade(true);
    state.playerPos = null;
    k.go("map", { map: to, spawn, pos: null });
  }

  function validate(def, name) {
    const w = def.ground[0].length;
    def.ground.forEach((r, i) => {
      if (r.length !== w) throw new Error(`${name} ground row ${i} width ${r.length} != ${w}`);
    });
    def.objects.forEach((r, i) => {
      if (r.length !== w) throw new Error(`${name} objects row ${i} width ${r.length} != ${w}`);
    });
    if (def.objects.length !== def.ground.length) throw new Error(`${name}: objects rows != ground rows`);
  }

  // ------------------------------------------------------------ input
  // All keyboard is handled at the window level so it keeps working after the
  // player clicks a DOM button (Start / mute), which would otherwise steal
  // focus from kaplay's canvas and silently kill every key.
  const INTERACT = new Set([" ", "enter", "e"]);
  window.addEventListener("keydown", (ev) => {
    const tag = ev.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return; // let the gate type
    const key = ev.key.toLowerCase();
    held.add(key);
    if (ui.travelOpen?.()) { // the travel-log form is typing-first
      if (key === "escape") ui.closeTravelForm();
      return;
    }
    if (key === "escape") { if (!ev.repeat) setPaused(!state.paused); return; }
    if (state.paused) return;
    if (INTERACT.has(key)) { ev.preventDefault(); if (!ev.repeat) doInteract(); }
    else if (key === "m") ui.setMuted(audio.toggle());
    else if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) ev.preventDefault();
  });
  window.addEventListener("keyup", (ev) => {
    held.delete(ev.key.toLowerCase());
  });
  window.addEventListener("blur", () => held.clear()); // don't stick keys on tab-out
  ui.dialogueEl.addEventListener("pointerdown", () => dialogue.advance());
  ui.bindTouch(vkeys, doInteract);
  ui.bindPause(setPaused);

  // ------------------------------------------------------------ start
  return {
    start(fresh) {
      if (fresh) {
        // wipe EVERY progress field — pumpkins, the crew and the ATV used to
        // survive a New Game, which is what made restarting look broken
        Object.assign(save, blankSave());
        state.playerPos = null;
        state.mounted = false;
        state.rideObj = null;
        state.promptShown = false;
        state.chatIdx = 0;
        state.catIdx = 0;
        state.cutscene = false;
        state.transitioning = false;
        state.map = "la";
        localStorage.removeItem(SAVE_KEY);
      }
      state.started = true;
      updateHUD();
      k.go("map", { map: fresh ? "la" : save.map, spawn: "start", pos: fresh ? null : save.pos });
    },
    hasSave: save.seen.size > 0 || save.met || save.figs.size > 0,
    state, save,
  };
}
