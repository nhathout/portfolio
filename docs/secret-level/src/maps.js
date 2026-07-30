// Map data. Maps are ASCII grids — edit them like text.
//
// GROUND characters:
//   .  grass (random variant)   *  flowers (animated)   t  tall grass
//   -  path                     s  sand                 w  water (blocked)
//   r  road                     R  road w/ center dash  k  sidewalk
//
// INTERIOR ground characters (maps with `interior: true`):
//   ,  wood floor (random plank variant)   ;  rug        :  kitchen tile
//   ~  woven kilim rug (the garden house)
//   #  wall face (solid)                   %  wall top (solid)
//   V  wall + window (solid)               C  wall + framed photo (solid)
//   M  wall + macramé hanging (solid)      H  wall + herb shelf (solid)
//   X  wall + the stairs up to Mia's floor (solid)
//   D  the front door, from inside (solid — the tile below it is the exit)
//
// IN-N-OUT interior characters (la_innout_in):
//   x  red/white checker floor (alternates on x+y)   Y  white tile wall top
//   I  white tile wall + red stripe (solid)          O  I + a big window (solid)
//   K  the service counter (solid — tiles across the whole room)
//   Z  the glass door, from inside (solid — tile below it is the exit)
//
// JVUE interior (bos_jvue_in) — flat white walls, pale oak, tall glass:
//   1  oak floor      _  the flat-weave rug     ^  white wall top (solid)
//   !  white wall face (solid)                  2  floor-to-ceiling glass (solid)
//   3  wall + the two prints (solid)            4  the apartment door (solid)
//   +  the upper half of the glass, at ceiling height (solid)
//
// NORTHEASTERN interior (bos_neu_in) — terrazzo + limestone + NU red:
//   5  terrazzo floor  7  wall top (solid)      6  wall face (solid)
//   8  tall window (solid)   9  the pinned world map (solid)   0  door (solid)
//
// BU ROBOTICS interior (bos_bu_in) — epoxy floor, painted block, scarlet stripe:
//   a  lab floor       Q  wall top (solid)      q  wall face (solid)
//   e  corridor window (solid)   u  whiteboard (solid)   U  lab door (solid)
//
// CAFE BENE interior (bos_cafe_in) — herringbone + chocolate wainscot:
//   g  parquet floor   A  wall top (solid)      G  wall face (solid)
//   B  the storefront window (solid)   J  the chalk menu (solid)  L  door (solid)
//
// OBJECT characters ('.' = nothing):
//   T tree   P palm   f fence   b bush   r rock   l lamp post
//   n bench  s sign   c construction barrier
//
// Buildings/props/points are placed via lists below (tile coordinates,
// x → right, y → down; a building's `y` is the row its base sits on).
//
// `points` are the interactable memory spots — their ids must match entries
// in data/memories.json → points.

export const TILE = 16;

// wall footprint per building sprite (must mirror tools/make_sprites.py).
// `doorCol` = which tile column inside the sprite holds the door (defaults to
// the middle) — that's where the interact zone goes.
export const BUILDING_META = {
  b_la_home: { wt: 8, ht: 3, doorCol: 6 },
  b_la_jack: { wt: 8, ht: 3, doorCol: 4 },
  b_la_house_b: { wt: 4, ht: 2 },
  b_taco_shop: { wt: 4, ht: 2 },
  b_theater: { wt: 5, ht: 2 },
  b_innout: { wt: 5, ht: 2, doorCol: 2 },
  b_brownstone_b: { wt: 4, ht: 3, stoop: true },
  b_bu_building: { wt: 6, ht: 3, doorCol: 4 },
  b_neu_building: { wt: 6, ht: 3 },
  b_cafe: { wt: 5, ht: 2 },
  b_jvue: { wt: 5, ht: 4, doorCol: 2, stoop: true },
  b_duplex: { wt: 6, ht: 3, doorCol: 3 },
};

export const MAPS = {
  // ------------------------------------------------------------- MINI LA
  la: {
    name: "Mini Los Angeles",
    ground: [
      "wwwwwwssssss....*........*.......*.........",
      "wwwwwwssssss..**......*........**......*...",
      "wwwwwwssssss.....*.........*.........*.....",
      "wwwwwwssssss.*.........*.........*.........",
      "wwwwwwssssss..........................*....",
      "wwwwwwssssss.....................**........",
      "wwwwwwssssss...............................",
      "wwwwwwssssss....---------..................",
      "wwwwwwssssss....-...........*..............",
      "wwwwwwssssss....-........*.................",
      "wwwwwwssssss....-...............*.......*..",
      "wwwwwwssssss------------------.......------",
      // ---- the burger place: driveway off the road, apron in front 🍔
      "wwwwwwssssss..-............----------------",
      "wwwwwwssssss.*-...........---....**........",
      "wwwwwwssssss..-..........--.....-..........",
      "wwwwwwssssss..-------...--......-.....*....",
      "wwwwwwssssss...*.......--.......-..........",
      "wwwwwwssssss.........---........-.**.......",
      "wwwwwwssssss.tttttt..-.........--..........",
      "wwwwwwssssss.tttttt.--.....*..--...........",
      "wwwwwwssssss.tttttt.-........--.......*....",
      "wwwwwwssssss....**..---....--......**......",
      // ---- down the road: Jack's place and the garden 🌻
      "wwwwwwssssss..........-----................",
      "wwwwwwssssss...........--..................",
      "wwwwwwssssss....*......--.........*........",
      "wwwwwwssssss...........--..................",
      "wwwwwwssssss...........-------.............",
      "wwwwwwssssss....-----------------..........",
      "wwwwwwssssss..*.......*.......*....*.......",
      "wwwwwwssssss.....*.......*.........*.......",
      "wwwwwwssssss..*........*.....*.....*.......",
      "wwwwwwssssss....*.....*.........*..........",
      "wwwwwwssssss.......*.......................",
      "wwwwwwssssss...*.........*.......*.........",
    ],
    objects: [
      "............T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T",
      "..........................b.............b..",
      "........................................T..",
      "................................r.......b..",
      "..........P.............................T..",
      "...............................b.........T.",
      "..........r................................",
      ".......................................T...",
      "...........P....................b.......b.T",
      "........P...n..............................",
      ".......................................s.T.",
      "................l.......l........l...l.....",
      ".............b.............................",
      "..................................b........",
      "........................b...............T..",
      "..........................T......b.........",
      "..............................b...s.....T..",
      "...........P.......b......................T",
      ".......................b.................b.",
      "..........r......b.........................",
      "........................b.............b.T..",
      ".......P..P.......b..........b.............",
      // ---- the garden block (kept clear where the beds and the pit go)
      ".............T.....b..................T....",
      "....................b.................T....",
      "..................b..................b.....",
      "............b.........T................T...",
      "...............s.........................T.",
      "..........P...T..........................b.",
      "........................................T..",
      ".......................................b...",
      ".........................................T.",
      "...........................................",
      ".............T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.",
      "............T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T",
    ],
    buildings: [
      // her house ♥ — E on the door fades into the interior scene
      { sprite: "b_la_home", x: 15, y: 6, point: "la_home",
        enter: { to: "la_house_in", spawn: "door" } },
      { sprite: "b_la_house_b", x: 35, y: 6 },
      { sprite: "b_taco_shop", x: 25, y: 11, point: "la_taco" },
      { sprite: "b_theater", x: 30, y: 18, point: "la_theater" },
      // 🍔 In-N-Out, off the main road. Interior comes later.
      { sprite: "b_innout", x: 15, y: 14, point: "innout",
        enter: { to: "la_innout_in", spawn: "door" } },
      // Jack's place, five minutes down the road ♥
      { sprite: "b_la_jack", x: 25, y: 25, point: "jack_home",
        enter: { to: "la_jack_in", spawn: "door" } },
    ],
    props: [
      { type: "horse", x: 10, y: 15 },    // beach horse (Miami ♥)
      { type: "garden", x: 13, y: 16 },   // tomato patch 🍅
      { type: "pool", x: 27, y: 7 },      // the pool out back
      { type: "lounger", x: 26, y: 4 },   // …and the two chairs at its head
      { type: "lounger", x: 29, y: 4 },
      // 🌊 the beach — six tiles of ocean and six of sand now, so it needed
      // actual furniture instead of three palms and a horse
      { type: "lifeguard", x: 8, y: 6 },
      { type: "umbrella", x: 9, y: 11 },
      { type: "lounger", x: 7, y: 13 },
      { type: "surfboards", x: 9, y: 20 },
      { type: "volley", x: 8, y: 24 },
      { type: "sandcastle", x: 7, y: 29 },
      { type: "starfish", x: 10, y: 3 },
      { type: "starfish", x: 7, y: 32 },
      { type: "sailboat", x: 2, y: 9, drift: true },
      { type: "sailboat", x: 3, y: 26, drift: true },
      // 🍔 the arrow sign, out by the road where it belongs
      { type: "innoutsign", x: 21, y: 14 },
      // 🌻 the garden — they grow most of what they eat
      { type: "corn", x: 13, y: 25 },
      { type: "corn", x: 15, y: 26 },
      { type: "sunflower", x: 18, y: 25 },
      { type: "sunflower", x: 20, y: 26 },
      { type: "dreamcatcher", x: 22, y: 26 },
      { type: "vegbed", x: 14, y: 29 },
      { type: "vegbed_b", x: 20, y: 29 },
      { type: "vegbed", x: 17, y: 31 },
      { type: "trellis", x: 13, y: 31 },
      { type: "herbpots", x: 25, y: 28 },
      { type: "firepit", x: 29, y: 30 },
      { type: "logseat", x: 26, y: 30 },
      { type: "logseat", x: 32, y: 30 },
      { type: "hammock", x: 36, y: 24 },
      { type: "bus", x: 37, y: 28 },
    ],
    points: [
      { id: "la_beach", x: 9, y: 8, w: 3, h: 4 },
      { id: "la_lifeguard", x: 7, y: 7, w: 3, h: 1, bonus: true },
      { id: "beach_horse", x: 9, y: 16, w: 3, h: 1, bonus: true },
      { id: "la_surf", x: 8, y: 21, w: 3, h: 1, bonus: true },
      { id: "garden", x: 12, y: 17, w: 3, h: 1, bonus: true },
      { id: "la_pool", x: 25, y: 8, w: 5, h: 1, bonus: true },
      { id: "jack_garden", x: 13, y: 30, w: 8, h: 1, bonus: true },
      { id: "jack_firepit", x: 28, y: 31, w: 4, h: 1, bonus: true },
      { id: "jack_bus", x: 36, y: 29, w: 4, h: 1, bonus: true },
    ],
    figs: [
      { id: "fig_la", x: 15, y: 20 },
      { id: "fig_la_2", x: 40, y: 3 },
      { id: "fig_la_3", x: 6, y: 18 },
    ],
    pumpkins: [
      { id: "pk_la_1", x: 14, y: 2 },
      { id: "pk_la_2", x: 32, y: 20 },
      { id: "pk_la_3", x: 11, y: 30 },
    ],
    npcs: [
      { id: "la_neighbor", sprite: "npc_old", x: 36, y: 8, dir: "down" },
    ],
    signs: {
      "39,10": ["→ Little Everywhere (300m)", "→ Mini Boston (4,982km… worth it)"],
      "34,16": ["← the beach (400m)", "↓ the garden house (5 min)"],
      "15,26": ["🌻 THE GARDEN 🌻", "take what you need,", "leave the tomatoes alone. — Jack"],
    },
    exits: [{ x: 41, y: 11, w: 1, h: 3, to: "route", spawn: "west" }],
    spawns: {
      start: [19, 8], west: [39, 12], door: [21, 8], jackdoor: [29, 27],
      innoutdoor: [17, 15],
    },
    noahPost: [23, 8],
  },

  // ------------------------------------------------------------- THE ROUTE
  route: {
    name: "Little Everywhere · all our places",
    ground: [
      ".....*..........*.........*...",
      "..*........*.........*.......*",
      ".....*..tttt..*.........*.....",
      "...*....tttt......*........*..",
      "*.......tttt..*.......**......",
      "....*.......*.....*.......*...",
      "...*.....*.......*.....*......",
      "----.....*..................*.",
      "...------........*....--------",
      "........*----------------.....",
      "..*..........................*",
      "...wwwww.........*....*.......",
      "..wwwwwww....tttttt.......*...",
      "..wwwwwww....tttttt....*......",
      "...wwwww..*..tttttt.......**..",
      "....*........*.......*........",
    ],
    objects: [
      "T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.",
      "..............................",
      "T....r.......................T",
      "..............................",
      ".b...........................T",
      "...................b.........T",
      "T..r..........................",
      "..s.......b.................s.",
      "..............................",
      "..............................",
      "T...r.....................r..T",
      "..r......b.......b...........T",
      ".r.........n..................",
      ".r...........b................",
      ".T......T.T.T.T.T.T.T.T.T.T.T.",
      "T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.",
    ],
    buildings: [],
    props: [
      { type: "figtree", x: 14, y: 5 },
      { type: "quad", x: 17, y: 7 },
      // one landmark per country ♥ (each is readable — lm_* points below)
      { type: "column", x: 11, y: 4 },      // Greece (next to the fig tree)
      { type: "pyramid", x: 26, y: 5 },     // Egypt
      { type: "pisa", x: 3, y: 4 },         // Italy
      { type: "cypress", x: 2, y: 6 },      //   (little Italian garden)
      { type: "cypress", x: 5, y: 6 },
      { type: "barrel", x: 25, y: 12 },     // Moldova
      { type: "matryoshka", x: 23, y: 10 }, // Russia
      { type: "divi", x: 20, y: 12 },       // Aruba 🇦🇼 — next stop ♥
      { type: "starfish", x: 22, y: 13 },
      { type: "station", x: 14, y: 11 },    // ✈ the travel log
    ],
    points: [
      { id: "route_figtree", x: 13, y: 6, w: 3, h: 1, givesFig: "fig_tree" },
      { id: "route_quad", x: 16, y: 8, w: 3, h: 1 },
      { id: "route_pond", x: 9, y: 12, w: 2, h: 2 },
      { id: "lm_greece", x: 10, y: 5, w: 3, h: 1, bonus: true },
      { id: "lm_egypt", x: 25, y: 6, w: 3, h: 1, bonus: true },
      { id: "lm_italy", x: 2, y: 5, w: 3, h: 1, bonus: true },
      { id: "lm_moldova", x: 24, y: 13, w: 3, h: 1, bonus: true },
      { id: "lm_russia", x: 22, y: 11, w: 3, h: 1, bonus: true },
      { id: "lm_aruba", x: 19, y: 13, w: 3, h: 1, bonus: true },
      { id: "travel_station", x: 13, y: 12, w: 3, h: 1, bonus: true },
    ],
    figs: [
      { id: "fig_route_1", x: 7, y: 5 },
      { id: "fig_route_2", x: 21, y: 13 },
      { id: "fig_route_3", x: 28, y: 4 },
      { id: "fig_route_4", x: 10, y: 10 },
    ],
    pumpkins: [{ id: "pk_route_1", x: 27, y: 1 }],
    npcs: [
      { id: "route_hiker", sprite: "npc_man", x: 24, y: 6, dir: "down" },
      // admiring the pyramid from a respectful distance
      { id: "route_admirer", sprite: "npc_woman", x: 23, y: 4, dir: "right" },
    ],
    signs: {
      "2,7": ["← Mini LA (300m)", "→ Mini Boston (600m)"],
      "28,7": ["→ Mini Boston (300m)", "← Mini LA (600m)"],
    },
    exits: [
      { x: 0, y: 7, w: 1, h: 3, to: "la", spawn: "west" },
      { x: 29, y: 8, w: 1, h: 3, to: "boston", spawn: "west" },
    ],
    spawns: { west: [1, 8], east: [28, 9] },
  },

  // ------------------------------------------------------------- MINI BOSTON
  boston: {
    name: "Mini Boston",
    ground: [
      "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
      // ---- the riverbank: the Charles on one side, the esplanade on the other
      "ssssssssssssssssssssssssssswwwwwwwwwww",
      "........*..........-.......*..ssssss..",
      "....**....*........-......**.sssssssss",
      ".....*.......*.....-....*...ssssssssss",
      "kkkkkkkkkkkkkkkkkkkkkkkkkkksssssssssss",
      "RRRRRRRRRRRRRRRRRRkkRRRRRRRsssssssssss",
      "rrrrrrrrrrrrrrrrrrkkrrrrrrrsssssssssss",
      "kkkkkkkkkkkkkkkkkkkkkkkkkkksssssssssss",
      "......*............-......ssssssssssss",
      "...**......*.......-....*.....ssssssss",
      ".....*...........--....*.........sssss",
      "....*...........--.....*....*.........",
      "...*...........--...........*.........",
      // ---- one continuous sidewalk in front of BU · Cafe Bene · Northeastern
      "....-------------------------------...",
      "........--.....*......*...............",
      "..*....--............*....*...........",
      ".....*.--......*.........tttttt.......",
      ".....**-.............*...tttttt.......",
      "....*..-...........*.....tttttt.......",
      // ---- JVUE's front strip, then the street
      ".......-.................*............",
      "......-------------------.*...........",
      // ---- down to Brookline 🏡
      "...*.......-.......*..........*.......",
      "......*....-..*...............*.......",
      "....*......-........*.................",
      "..*........-...........*..........*...",
      "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
      "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
      "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr",
      "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
      "...*.......*.........*.........*......",
      "......*.........*.......*.......*.....",
    ],
    objects: [
      "......................................",
      "......................................",
      "......................................",
      "......l.......l.......l...............",
      "T....b.n...............n....P........T",
      "..................l..........P...P....",
      "fffffffffff....fff..fffffff.P.........",
      "..............................P.......",
      "..........................c...........",
      "..........................c...........",
      "..s.......................c.......P...",
      ".....l.....b...l....b....l..........P.",
      ".T...................................P",
      "........................b.............",
      "T........................b...........T",
      "......................b..........b....",
      ".T...................................T",
      "......b.........................b.....",
      "T....b...........b...........b.......T",
      ".........................b............",
      "...b.............................b....",
      ".......b................b......b......",
      ".T...................................T",
      "......................................",
      "..b.....................b.............",
      "T.......b..............b............T.",
      ".T...........................b.......T",
      ".b..................................T.",
      "..........l..........l...........l....",
      "......................................",
      "......................................",
      "....s.................................",
      "..b.......b.........b.........b.......",
      "..T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.",
    ],
    buildings: [
      { sprite: "b_bu_building", x: 3, y: 15, point: "bu",
        enter: { to: "bos_bu_in", spawn: "door" } },
      { sprite: "b_cafe", x: 16, y: 15, point: "cafe",
        enter: { to: "bos_cafe_in", spawn: "door" } },
      { sprite: "b_neu_building", x: 27, y: 15, point: "neu",
        enter: { to: "bos_neu_in", spawn: "door" } },
      // 🏢 JVUE at the LMA — her new place. The finale happens upstairs now,
      // so the door is just a door and she can come and go.
      { sprite: "b_jvue", x: 9, y: 21, point: "apartment",
        enter: { to: "bos_jvue_in", spawn: "door" } },
      { sprite: "b_brownstone_b", x: 15, y: 21 },
      { sprite: "b_brownstone_b", x: 20, y: 21 },
      // 🏡 Brookline: his parents' half of the duplex, and the neighbours
      { sprite: "b_la_house_b", x: 4, y: 27 },
      { sprite: "b_duplex", x: 13, y: 27, point: "parents_home",
        enter: { to: "bos_parents_in", spawn: "door" } },
      { sprite: "b_brownstone_b", x: 25, y: 27 },
    ],
    props: [
      // 🇦🇼 the paradise oasis past the barriers — opening in one week ♥
      { type: "palapa", x: 32, y: 6 },
      { type: "beachsign", x: 29, y: 9 },
      { type: "turtle", x: 35, y: 5 },   // up at the waterline now
      { type: "lounger", x: 34, y: 12 },
      { type: "divi", x: 36, y: 12 },
      { type: "starfish", x: 36, y: 8 },
      { type: "starfish", x: 35, y: 13 },
      // 🌳 the esplanade: the Hatch Shell, willows leaning over the water
      { type: "esplsign", x: 2, y: 5 },
      { type: "willow", x: 7, y: 5 },
      { type: "bandshell", x: 12, y: 5 },
      { type: "willow", x: 16, y: 5 },
      { type: "willow", x: 25, y: 4 },
      { type: "radio", x: 21, y: 5 }, // someone left a boombox by the river…
      { type: "sailboat", x: 13, y: 2, drift: true },
      { type: "sailboat", x: 30, y: 1, drift: true },
      // 🏢 the monument sign on JVUE's front strip
      { type: "jvuesign", x: 9, y: 22 },
    ],
    points: [
      { id: "aruba_beach", x: 30, y: 8, w: 4, h: 1 },
      { id: "aruba_turtle", x: 35, y: 6, w: 2, h: 1 },
      { id: "esplanade", x: 12, y: 6, w: 3, h: 1 },
      { id: "radio", x: 20, y: 4, w: 3, h: 2, bonus: true },
    ],
    figs: [
      { id: "fig_bos_1", x: 34, y: 5 },
      { id: "fig_bos_2", x: 27, y: 20 },
      { id: "fig_bos_3", x: 6, y: 12 },
      { id: "fig_bos_4", x: 30, y: 26 },
    ],
    pumpkins: [
      { id: "pk_bos_1", x: 36, y: 15 },
      { id: "pk_bos_2", x: 3, y: 17 },
      { id: "pk_bos_3", x: 5, y: 3 },
    ],
    signs: {
      "2,10": ["← Little Everywhere (300m)", "← Mini LA (a long walk)"],
      "4,31": ["🏡 BROOKLINE", "↑ Longwood · JVUE (900m)", "↑ the Esplanade (2.1km)"],
    },
    npcs: [
      { id: "bos_student", sprite: "npc_woman", x: 22, y: 13, dir: "down" },
      { id: "bos_runner", sprite: "npc_man", x: 8, y: 4, dir: "down" },
      { id: "bos_oldman", sprite: "npc_old", x: 14, y: 12, dir: "left" },
      { id: "bos_neighbor", sprite: "npc_woman", x: 21, y: 26, dir: "down" },
    ],
    exits: [{ x: 0, y: 7, w: 1, h: 4, to: "route", spawn: "east" }],
    // `beach` / `esplanade` / `brookline` are dev shortcuts; the *door spawns
    // are where each interior puts her back down on the street
    spawns: {
      west: [2, 9], beach: [32, 10], esplanade: [12, 6], brookline: [16, 28],
      budoor: [7, 16], cafedoor: [18, 16], neudoor: [30, 16],
      jvuedoor: [11, 22], parentsdoor: [16, 28],
    },
    // deliberately no `noahPost`: until she talks to him he stays put on
    // his bench in Mini LA, so he can't show up here having never met her
  },

  // ------------------------------------------------------- INSIDE HER HOUSE
  // One big warm room: kitchen on the left, living room in the middle,
  // dining + fireplace on the right. Marina, her mom and her little brother
  // are here, and so are Leo and Charlie (who will happily leave with her).
  la_house_in: {
    name: "home ♥",
    interior: true,
    ground: [
      "%%%%%%%%%%%%%%%%%%%%",
      "##V##C###V###C##V###",
      "#,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,#",
      "#,,,;;;;;;,,,,,,,,,#",
      "#,,,;;;;;;,,,,,,,,,#",
      "#,,,;;;;;;,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,#",
      "#:::::,,,,,,,,,,,,,#",
      "#:::::,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,#",
      "########DD##########",
    ],
    objects: [],
    buildings: [],
    props: [
      { type: "in_counter", x: 3, y: 9 },
      { type: "in_fridge", x: 1, y: 7 },
      { type: "in_sofa", x: 6, y: 4 },
      { type: "in_tv", x: 6, y: 8 },
      { type: "in_lamp", x: 10, y: 4 },
      { type: "in_table", x: 13, y: 6 },
      { type: "in_fire", x: 16, y: 3 },
      { type: "in_shelf", x: 17, y: 9 },
      { type: "in_plant", x: 1, y: 4 },
      { type: "in_plant", x: 18, y: 6 },
      { type: "in_petbeds", x: 15, y: 11 },
      { type: "in_bowl", x: 12, y: 11 },
      // her brother's corner: rods against the wall, ball at his feet 🎣 ⚽
      { type: "in_rods", x: 11, y: 2 },
      { type: "in_ball", x: 13, y: 3 },
    ],
    points: [],
    figs: [{ id: "fig_home", x: 2, y: 11 }],
    pumpkins: [{ id: "pk_home", x: 18, y: 2 }],
    // everyone lives here — talking to each one is a memory (♥ counter),
    // and the two with `join` come along afterwards
    npcs: [
      { id: "home_marina", sprite: "npc_marina", x: 3, y: 7, dir: "down",
        point: "home_marina" },
      { id: "home_mom", sprite: "npc_mom", x: 12, y: 8, dir: "down",
        point: "home_mom" },
      // nowhere near the TV — he's re-rigging a rod for the weekend
      { id: "home_bro", sprite: "npc_bro", x: 12, y: 3, dir: "down",
        point: "home_bro" },
      { id: "home_leo", sprite: "leo", pet: true, x: 14, y: 11, dir: "down",
        point: "home_leo", join: "leo" },
      { id: "home_charlie", sprite: "charlie", pet: true, x: 16, y: 11, dir: "down",
        point: "home_charlie", join: "charlie" },
    ],
    exits: [{ x: 8, y: 11, w: 2, h: 1, to: "la", spawn: "door" }],
    spawns: { door: [9, 10] },
  },

  // ------------------------------------------------- INSIDE JACK'S HOUSE
  // Bigger and messier than her mom's: a kilim in the middle, plants in every
  // corner, records and a guitar, jars of everything Jack's wife grew, and a
  // wood stove that is on even in California. Chakra owns the place.
  la_jack_in: {
    name: "the garden house 🌻",
    interior: true,
    ground: [
      "%%%%%%%%%%%%%%%%%%%%%%",
      "##V##M###V##H###V##C##",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,~~~~~~,,,,,,,,,,,#",
      "#,,,~~~~~~,,,,,,,,,,,#",
      "#,,,~~~~~~,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#::::::,,,,,,,,,,,,,,#",
      "#::::::,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "##########DD##########",
    ],
    objects: [],
    buildings: [],
    props: [
      { type: "in_counter", x: 3, y: 9 },
      { type: "in_fridge", x: 1, y: 7 },
      { type: "in_jars", x: 17, y: 9 },
      { type: "in_sofa2", x: 6, y: 3 },
      { type: "in_cushions", x: 6, y: 7 },
      { type: "in_record", x: 11, y: 4 },
      { type: "in_guitar", x: 14, y: 3 },
      { type: "in_stove", x: 17, y: 4 },
      { type: "in_samovar", x: 13, y: 7 },
      { type: "in_lamp", x: 16, y: 7 },
      { type: "in_table", x: 9, y: 12 },
      { type: "in_bigplant", x: 1, y: 4 },
      { type: "in_bigplant", x: 19, y: 12 },
      { type: "in_hangplant", x: 9, y: 2 },
      { type: "in_hangplant", x: 19, y: 2 },
      { type: "in_dogbed", x: 16, y: 12 },
      { type: "in_bowl", x: 14, y: 12 },
    ],
    points: [],
    figs: [{ id: "fig_jack", x: 2, y: 13 }],
    pumpkins: [{ id: "pk_jack", x: 20, y: 3 }],
    npcs: [
      { id: "home_jack", sprite: "npc_jack", x: 12, y: 10, dir: "down",
        point: "home_jack" },
      { id: "home_jackwife", sprite: "npc_wife", x: 6, y: 10, dir: "left",
        point: "home_jackwife" },
      // she is coming with us and there was never any doubt about it 🖤
      { id: "home_chakra", sprite: "chakra", pet: true, x: 17, y: 11, dir: "down",
        point: "home_chakra", join: "chakra" },
    ],
    exits: [{ x: 10, y: 13, w: 2, h: 1, to: "la", spawn: "jackdoor" }],
    spawns: { door: [11, 12] },
  },

  // ------------------------------------------------- INSIDE IN-N-OUT 🍔
  // Red-and-white checker floor, white tile walls, a stainless counter that
  // runs the whole width of the room (so she can't wander into the fryer), the
  // line working behind it, and booths in the front half. The order goes in at
  // the till — and yes, they'll give you the hats if you ask.
  la_innout_in: {
    name: "IN-N-OUT BURGER 🍔",
    interior: true,
    ground: [
      "YYYYYYYYYYYYYYYYYY",
      "YYYYYYYYYYYYYYYYYY",
      "IIIOOIIIOOIIIOOIII",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IKKKKKKKKKKKKKKKKI",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IxxxxxxxxxxxxxxxxI",
      "IIIIIIIIZZIIIIIIII",
    ],
    objects: [],
    buildings: [],
    props: [
      // the menu, hung high enough to clear the line below it
      { type: "in_menuboard", x: 8, y: 2 },
      // the line, behind the counter and out of reach
      { type: "in_frystation", x: 2, y: 4 },
      { type: "in_shakes", x: 6, y: 4 },
      { type: "in_drinks", x: 9, y: 4 },
      // …and what sits on the counter
      { type: "in_till", x: 12, y: 5 },
      { type: "in_hatstack", x: 15, y: 5 },
      // the front half
      { type: "in_booth", x: 4, y: 9 },
      { type: "in_booth", x: 12, y: 9 },
      { type: "in_booth", x: 13, y: 13 },
      { type: "in_bigplant", x: 16, y: 8 },
      // their order only exists once they've actually ordered it ♥
      { type: "in_tray", x: 4, y: 8, after: "innout_order" },
    ],
    points: [
      { id: "innout_order", x: 11, y: 6, w: 3, h: 1 },
      { id: "innout_menu", x: 7, y: 6, w: 3, h: 1, bonus: true },
      { id: "innout_fries", x: 2, y: 6, w: 3, h: 1, bonus: true },
    ],
    figs: [{ id: "fig_innout", x: 16, y: 12 }],
    pumpkins: [{ id: "pk_innout", x: 1, y: 13 }],
    npcs: [
      { id: "io_cook", sprite: "npc_innout2", x: 4, y: 4, dir: "down" },
      { id: "io_cashier", sprite: "npc_innout", x: 12, y: 4, dir: "down" },
      { id: "io_customer", sprite: "npc_man", x: 2, y: 10, dir: "up" },
    ],
    exits: [{ x: 8, y: 13, w: 2, h: 1, to: "la", spawn: "innoutdoor" }],
    spawns: { door: [9, 12] },
  },

  // ------------------------------------------------- INSIDE JVUE 🏢
  // Their apartment, eleven days old. White walls, pale oak, glass across the
  // whole top wall. TV on the left with the grey sofa in front of it, the
  // aquarium on its own table on the right, and a planter under the windows.
  // Two of the things in this room open onto their own little games ♥
  bos_jvue_in: {
    name: "our place ♥",
    interior: true,
    ground: [
      "^^^^^^^^^++++^++++^^^^",
      "!!!!!!!!32222!2222!3!!",
      "!11111111111111111111!",
      "!11111111111111111111!",
      "!11111111111111111111!",
      "!11111111111111111111!",
      "!1______1111111111111!",
      "!1______1111111111111!",
      "!1______1111111111111!",
      "!1______1111111111111!",
      "!1______1111111111111!",
      "!1______1111111111111!",
      "!11111111111111111111!",
      "!11111111111111111111!",
      "!!!!!!!!!!44!!!!!!!!!!",
    ],
    objects: [],
    buildings: [],
    props: [
      // the living end: TV on the left wall, sofa in front of it
      { type: "in_tvmount", x: 3, y: 3 },
      { type: "in_coffeetable", x: 3, y: 7 },
      { type: "in_sofagray", x: 3, y: 10 },
      { type: "in_lamp", x: 7, y: 5 },
      // 🌱 the planter under the windows → the greenhouse
      { type: "in_herbwindow", x: 10, y: 3 },
      // 🐠 the tank on its stand → the aquarium
      { type: "in_aquarium", x: 16, y: 5 },
      // the rest of the flat
      { type: "in_desk", x: 12, y: 9 },
      { type: "in_bed", x: 8, y: 13 },
      { type: "in_kitchen2", x: 17, y: 12 },
      { type: "in_fridge", x: 19, y: 9 },
      { type: "in_boxes", x: 5, y: 13 },
      { type: "in_bigplant", x: 20, y: 3 },
      { type: "in_hangplant", x: 1, y: 2 },
      { type: "in_petbeds", x: 14, y: 13 },
      { type: "in_bowl", x: 12, y: 13 },
    ],
    points: [
      // standing at the window is where the finale happens, once she's found
      // everything else — until then it's just their apartment ♥
      { id: "jvue_home", x: 12, y: 2, w: 3, h: 1 },
      { id: "jvue_tank", x: 15, y: 6, w: 3, h: 1 },
      { id: "jvue_herbs", x: 9, y: 4, w: 3, h: 1 },
      { id: "jvue_boxes", x: 4, y: 13, w: 3, h: 1, bonus: true },
      { id: "jvue_tv", x: 2, y: 4, w: 3, h: 1, bonus: true },
    ],
    figs: [{ id: "fig_jvue", x: 20, y: 7 }],
    pumpkins: [{ id: "pk_jvue", x: 1, y: 11 }],
    npcs: [],
    exits: [{ x: 10, y: 13, w: 2, h: 1, to: "boston", spawn: "jvuedoor" }],
    spawns: { door: [11, 12] },
  },

  // ------------------------------------------- INSIDE HIS PARENTS' PLACE 🏡
  // Brookline, bottom floor of the duplex. His mom is baking, his dad has a
  // joke ready, and the other Charlie has been waiting by the door since the
  // car pulled up. Mia and Brandon are at the gym — their bags aren't.
  bos_parents_in: {
    name: "the Brookline house 🏡",
    interior: true,
    ground: [
      "%%%%%%%%%%%%%%%%%%%%%%",
      "##V##C###V###C##V##X##",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,;;;;;;,#",
      "#::::::,,,,,,,;;;;;;,#",
      "#::::::,,,,,,,;;;;;;,#",
      "#::::::,,,,,,,;;;;;;,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,#",
      "##########DD##########",
    ],
    objects: [],
    buildings: [],
    props: [
      // the kitchen end — something is always in that oven
      { type: "in_counter", x: 3, y: 7 },
      { type: "in_fridge", x: 1, y: 4 },
      { type: "in_stove", x: 6, y: 4 },
      { type: "in_bakerack", x: 4, y: 10 },
      // the middle: the table everybody ends up around
      { type: "in_table", x: 10, y: 9 },
      { type: "in_hutch", x: 11, y: 3 },
      { type: "in_lamp", x: 8, y: 4 },
      // the living end
      { type: "in_sofa", x: 17, y: 5 },
      { type: "in_tv", x: 17, y: 9 },
      { type: "in_recliner", x: 19, y: 7 },
      { type: "in_bigplant", x: 1, y: 13 },
      // 🏋 Mia and Brandon left about an hour ago
      { type: "in_gymbags", x: 6, y: 13 },
      // 🐶 and the other Charlie's corner
      { type: "in_dogbed", x: 17, y: 13 },
      { type: "in_bowl", x: 20, y: 13 },
    ],
    points: [
      { id: "parents_gym", x: 5, y: 13, w: 3, h: 1, bonus: true },
      { id: "parents_stairs", x: 18, y: 2, w: 2, h: 1, bonus: true },
      { id: "parents_oven", x: 5, y: 8, w: 3, h: 1, bonus: true },
    ],
    figs: [{ id: "fig_parents", x: 2, y: 12 }],
    pumpkins: [{ id: "pk_parents", x: 20, y: 3 }],
    npcs: [
      { id: "home_hismom", sprite: "npc_hismom", x: 6, y: 8, dir: "up",
        point: "home_hismom" },
      { id: "home_dad", sprite: "npc_dad", x: 16, y: 8, dir: "down",
        point: "home_dad" },
      // he is coming with us. he was always coming with us 🐕
      { id: "home_collie", sprite: "collie", pet: true, x: 12, y: 12,
        dir: "down", point: "home_collie", join: "collie" },
    ],
    exits: [{ x: 10, y: 13, w: 2, h: 1, to: "boston", spawn: "parentsdoor" }],
    spawns: { door: [11, 12] },
  },

  // --------------------------------------------- INSIDE NORTHEASTERN 🎓
  // The International Affairs floor. A pinned world map the length of one
  // wall, the Model UN room mid-session, the co-op board that runs everyone's
  // life, and a globe that has been spun approximately one million times.
  bos_neu_in: {
    name: "Northeastern · International Affairs 🎓",
    interior: true,
    ground: [
      "7777777777777777777777",
      "6688886669999966888866",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6555555555555555555556",
      "6666666666006666666666",
    ],
    objects: [],
    buildings: [],
    props: [
      // 🌍 the wall she stands in front of every single day
      { type: "in_worldwall", x: 11, y: 2 },
      { type: "in_flagrow", x: 4, y: 4 },
      // 🇺🇳 the horseshoe, placards still out from this morning's session
      { type: "in_unhorseshoe", x: 10, y: 9 },
      { type: "in_lectern", x: 17, y: 8 },
      { type: "in_lecternrows", x: 15, y: 14 },
      // the corner that decides everybody's next six months
      { type: "in_coopboard", x: 2, y: 9 },
      { type: "in_globe", x: 19, y: 5 },
      { type: "in_shelf", x: 1, y: 14 },
      { type: "in_bigplant", x: 20, y: 12 },
    ],
    points: [
      { id: "neu_map", x: 10, y: 4, w: 4, h: 1 },
      { id: "neu_un", x: 9, y: 10, w: 5, h: 1 },
      { id: "neu_globe", x: 18, y: 6, w: 3, h: 1, bonus: true },
      { id: "neu_coop", x: 1, y: 10, w: 3, h: 1, bonus: true },
      { id: "neu_flags", x: 3, y: 5, w: 4, h: 1, bonus: true },
    ],
    figs: [{ id: "fig_neu", x: 20, y: 2 }],
    pumpkins: [{ id: "pk_neu", x: 1, y: 6 }],
    npcs: [
      { id: "neu_prof", sprite: "npc_prof", x: 16, y: 11, dir: "left" },
      { id: "neu_husky", sprite: "npc_husky", x: 5, y: 12, dir: "down" },
    ],
    exits: [{ x: 10, y: 14, w: 2, h: 1, to: "boston", spawn: "neudoor" }],
    spawns: { door: [11, 13] },
  },

  // ------------------------------------------------- INSIDE BU ROBOTICS 🤖
  // Epoxy floor, painted block, a scarlet safety stripe round the whole room,
  // two printers running something that will definitely fail at 94%, and an
  // arm that has been picking the same cube up since 2019.
  bos_bu_in: {
    name: "BU Robotics Lab 🤖",
    interior: true,
    ground: [
      "QQQQQQQQQQQQQQQQQQQQQQ",
      "qqeeeqqquuuuuuqqqeeeqq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qaaaaaaaaaaaaaaaaaaaaq",
      "qqqqqqqqqqUUqqqqqqqqqq",
    ],
    objects: [],
    buildings: [],
    props: [
      // 🦾 the arm, on its own pedestal, roped off in spirit only
      { type: "in_robotarm", x: 4, y: 7 },
      // 🖨 the print farm (two of them, both mid-job)
      { type: "in_printer3d", x: 9, y: 5 },
      { type: "in_printer3d", x: 12, y: 5 },
      { type: "in_workbench", x: 17, y: 9 },
      { type: "in_partsbin", x: 19, y: 5 },
      { type: "in_rover", x: 8, y: 12 },
      { type: "in_drone", x: 14, y: 12 },
      { type: "in_shelf", x: 1, y: 6 },
      { type: "in_bigplant", x: 1, y: 13 },
    ],
    points: [
      { id: "bu_arm", x: 3, y: 8, w: 3, h: 1 },
      { id: "bu_printer", x: 9, y: 6, w: 5, h: 1 },
      { id: "bu_rover", x: 7, y: 13, w: 3, h: 1, bonus: true },
      { id: "bu_bench", x: 16, y: 10, w: 4, h: 1, bonus: true },
      { id: "bu_board", x: 9, y: 2, w: 5, h: 1, bonus: true },
    ],
    figs: [{ id: "fig_bu", x: 19, y: 13 }],
    pumpkins: [{ id: "pk_bu", x: 20, y: 2 }],
    npcs: [
      { id: "bu_grad", sprite: "npc_grad", x: 16, y: 6, dir: "down" },
    ],
    exits: [{ x: 10, y: 13, w: 2, h: 1, to: "boston", spawn: "budoor" }],
    spawns: { door: [11, 12] },
  },

  // ------------------------------------------------- INSIDE CAFE BENE ☕
  // Herringbone floor, chocolate wainscot, the chalk menu that hasn't changed
  // in years — and the little two-top by the front window. That one's ours.
  bos_cafe_in: {
    name: "Cafe Bene ☕",
    interior: true,
    ground: [
      "AAAAAAAAAAAAAAAAAAAA",
      "GGGGGGGJJJGGGGGGGGGG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GggggggggggggggggggG",
      "GGGGBBBBBLLBBBBBGGGG",
    ],
    objects: [],
    buildings: [],
    props: [
      { type: "in_cafecounter", x: 8, y: 3 },
      { type: "in_espresso", x: 12, y: 2 },
      { type: "in_pastrycase", x: 4, y: 3 },
      { type: "in_beanshelf", x: 17, y: 6 },
      // 💛 the wall piece about how they actually met
      { type: "in_hingeframe", x: 16, y: 2 },
      // ☕ THE table — the two-top closest to the door and the front window
      { type: "in_cafetable", x: 6, y: 11 },
      { type: "in_cafetable", x: 14, y: 11 },
      { type: "in_armchair", x: 2, y: 9 },
      { type: "in_bigplant", x: 1, y: 12 },
      { type: "in_hangplant", x: 18, y: 2 },
    ],
    points: [
      { id: "cafe_table", x: 5, y: 12, w: 3, h: 1 },
      { id: "cafe_hinge", x: 15, y: 4, w: 3, h: 1 },
      { id: "cafe_counter", x: 8, y: 5, w: 4, h: 1, bonus: true },
      { id: "cafe_pastry", x: 3, y: 5, w: 3, h: 1, bonus: true },
    ],
    figs: [{ id: "fig_cafe", x: 18, y: 11 }],
    pumpkins: [{ id: "pk_cafe", x: 1, y: 3 }],
    npcs: [
      { id: "cafe_barista", sprite: "npc_barista", x: 13, y: 5, dir: "down" },
      { id: "cafe_regular", sprite: "npc_old", x: 14, y: 9, dir: "down" },
    ],
    exits: [{ x: 9, y: 12, w: 2, h: 1, to: "boston", spawn: "cafedoor" }],
    spawns: { door: [10, 11] },
  },
};

// Pad every ground/objects row to a common width (and match object rows to
// ground rows) so map art can be authored without counting trailing spaces.
for (const def of Object.values(MAPS)) {
  const w = def.ground[0].length; // first row defines the canonical width
  const rows = def.ground.length;
  const fit = (r) => r.padEnd(w, ".").slice(0, w);
  def.ground = def.ground.map(fit);
  const obj = (def.objects || []).slice(0, rows);
  while (obj.length < rows) obj.push("");
  def.objects = obj.map(fit);
}

/** every memory point id, in "story order" (bonus spots don't gate the finale) */
export function allPointIds() {
  const ids = [];
  for (const def of Object.values(MAPS)) {
    for (const b of def.buildings) if (b.point) ids.push(b.point);
    for (const p of def.points) if (!p.bonus) ids.push(p.id);
    // people are memories too — the house crew fills the ♥ counter
    for (const n of def.npcs || []) if (n.point && !n.bonus) ids.push(n.point);
  }
  return ids;
}

export function allFigIds() {
  const ids = ["fig_tree"]; // from the fig tree itself
  for (const def of Object.values(MAPS)) {
    for (const f of def.figs) ids.push(f.id);
  }
  return ids;
}

export function allPumpkinIds() {
  const ids = [];
  for (const def of Object.values(MAPS)) {
    for (const p of def.pumpkins || []) ids.push(p.id);
  }
  return ids;
}
