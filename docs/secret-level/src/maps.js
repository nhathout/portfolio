// Map data. Maps are ASCII grids — edit them like text.
//
// GROUND characters:
//   .  grass (random variant)   *  flowers (animated)   t  tall grass
//   -  path                     s  sand                 w  water (blocked)
//   r  road                     R  road w/ center dash  k  sidewalk
//
// INTERIOR ground characters (maps with `interior: true`):
//   ,  wood floor (random plank variant)   ;  rug        :  kitchen tile
//   #  wall face (solid)                   %  wall top (solid)
//   V  wall + window (solid)               C  wall + framed photo (solid)
//   D  the front door, from inside (solid — the tile below it is the exit)
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
  b_la_house_b: { wt: 4, ht: 2 },
  b_taco_shop: { wt: 4, ht: 2 },
  b_theater: { wt: 5, ht: 2 },
  b_apartment: { wt: 4, ht: 3, stoop: true },
  b_brownstone_b: { wt: 4, ht: 3, stoop: true },
  b_bu_building: { wt: 6, ht: 2 },
  b_neu_building: { wt: 6, ht: 2 },
  b_cafe: { wt: 4, ht: 2 },
};

export const MAPS = {
  // ------------------------------------------------------------- MINI LA
  la: {
    name: "Mini Los Angeles",
    ground: [
      "wwwsss....*........*.......*.........",
      "wwwsss..**......*........**......*...",
      "wwwsss.....*.........*.........*.....",
      "wwwsss.*.........*.........*.........",
      "wwwsss..........................*....",
      "wwwsss.....................**........",
      "wwwsss...............................",
      "wwwss*....---------..................",
      "wwwsss....-...........*..............",
      "wwwsss....-........*.................",
      "wwwsss....-...............*.......*..",
      "wwwsss------------------.......------",
      "wwwsss......*........----------------",
      "wwwsss.*............---....**........",
      "wwwsss....**.......--.....-..........",
      "wwwsss............--......-.....*....",
      "wwwsss...*.......--.......-..........",
      "wwwsss.........---........-.**.......",
      "wwwsss.tttttt..-.........--..........",
      "wwwsss.tttttt.--.....*..--...........",
      "wwwsss.tttttt.-........--.......*....",
      "wwwsss....**..---....--......**......",
      "wwwsss.......*..----.................",
      "wwwsss...*.........*.......*.........",
    ],
    objects: [
      "......T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T",
      "....................b.............b..",
      ".....b............................T..",
      "..........................r.......b..",
      "....P.............................T..",
      ".........................b.........T.",
      "....r................................",
      ".................................T...",
      ".....P....................b.......b.T",
      "......n...............b..............",
      "...b...............................T.",
      "..........l.......l........l...l.....",
      ".......b.............................",
      "...........b................b........",
      "..................b...............T..",
      ".........b.....T...........b.........",
      "...b....................b...s.....T..",
      ".....P.......b......................T",
      ".................b.........b.......b.",
      "....r......b.........................",
      "..................b.............b.T..",
      "....P.......b..........b.............",
      "...b...T.T.T.T.T.....T.T.T.T.T.T.T.T.",
      "......T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T",
    ],
    buildings: [
      // her house ♥ — E on the door fades into the interior scene
      { sprite: "b_la_home", x: 9, y: 6, point: "la_home",
        enter: { to: "la_house_in", spawn: "door" } },
      { sprite: "b_la_house_b", x: 29, y: 6 },
      { sprite: "b_taco_shop", x: 19, y: 11, point: "la_taco" },
      { sprite: "b_theater", x: 24, y: 18, point: "la_theater" },
    ],
    props: [
      { type: "horse", x: 4, y: 15 },    // beach horse (Miami ♥)
      { type: "garden", x: 7, y: 16 },   // tomato patch 🍅
      { type: "pool", x: 21, y: 7 },     // the pool out back
      { type: "lounger", x: 25, y: 7 },
      { type: "lounger", x: 25, y: 10 },
    ],
    points: [
      { id: "la_beach", x: 3, y: 8, w: 3, h: 4 },
      { id: "beach_horse", x: 3, y: 16, w: 3, h: 1, bonus: true },
      { id: "garden", x: 6, y: 17, w: 3, h: 1, bonus: true },
      { id: "la_pool", x: 19, y: 8, w: 5, h: 1, bonus: true },
    ],
    figs: [
      { id: "fig_la", x: 9, y: 20 },
      { id: "fig_la_2", x: 34, y: 3 },
    ],
    pumpkins: [
      { id: "pk_la_1", x: 8, y: 2 },
      { id: "pk_la_2", x: 26, y: 20 },
    ],
    npcs: [
      { id: "la_neighbor", sprite: "npc_old", x: 30, y: 8, dir: "down" },
    ],
    signs: {
      "33,11": ["→ Little Everywhere (300m)", "→ Mini Boston (4,982km… worth it)"],
    },
    exits: [{ x: 35, y: 11, w: 1, h: 3, to: "route", spawn: "west" }],
    spawns: { start: [13, 8], west: [33, 12], door: [15, 8] },
    noahPost: [17, 8],
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
      "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
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
      "....----------.........------------...",
      "...........--..*......*...............",
      "..*.......--.........*....*...........",
      ".....*...--....*.........tttttt.......",
      ".....**..-...........*...tttttt.......",
      "....*...--.........*.....tttttt.......",
      ".......--------------.....*...........",
      "....**......*...........*........**...",
    ],
    objects: [
      "......................................",
      "......................................",
      "......................................",
      "......................................",
      "T....b......................P........T",
      "...T..l...n..T..l.....T.l....P...P....",
      "ffffffffffffffffff..fffffff.P.........",
      "..............................P.......",
      "..........................c...........",
      "..........................c...........",
      "..s.......................c.......P...",
      ".....l.....b...l....b....l..........P.",
      ".T.......b...........................P",
      "....b....b.....b.......b.......P......",
      "T........................b...........T",
      "...b..................b..........b....",
      ".T...................................T",
      "......b.........................b.....",
      "T....b...........b...........b.......T",
      ".........................b............",
      "...b.............b...............b....",
      ".......b................b......b......",
      ".T...b...............................T",
      "..T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T.",
    ],
    buildings: [
      { sprite: "b_bu_building", x: 3, y: 15, point: "bu" },
      { sprite: "b_cafe", x: 16, y: 15, point: "cafe" },
      { sprite: "b_neu_building", x: 27, y: 15, point: "neu" },
      { sprite: "b_apartment", x: 10, y: 21, point: "apartment" },
      { sprite: "b_brownstone_b", x: 15, y: 21 },
      { sprite: "b_brownstone_b", x: 20, y: 21 },
    ],
    props: [
      // 🇦🇼 the paradise oasis past the barriers — opening in one week ♥
      { type: "palapa", x: 32, y: 6 },
      { type: "beachsign", x: 29, y: 9 },
      { type: "turtle", x: 34, y: 11 },
      { type: "lounger", x: 30, y: 12 },
      { type: "divi", x: 36, y: 12 },
      { type: "starfish", x: 36, y: 8 },
      { type: "starfish", x: 35, y: 13 },
      { type: "sailboat", x: 14, y: 2, drift: true },
      { type: "sailboat", x: 30, y: 1, drift: true },
      { type: "radio", x: 21, y: 5 }, // someone left a boombox by the river…
    ],
    points: [
      { id: "aruba_beach", x: 30, y: 8, w: 4, h: 1 },
      { id: "aruba_turtle", x: 33, y: 12, w: 3, h: 1 },
      { id: "esplanade", x: 25, y: 4, w: 3, h: 2 },
      { id: "radio", x: 20, y: 4, w: 3, h: 2, bonus: true },
    ],
    figs: [
      { id: "fig_bos_1", x: 34, y: 5 },
      { id: "fig_bos_2", x: 27, y: 20 },
      { id: "fig_bos_3", x: 6, y: 13 },
    ],
    pumpkins: [
      { id: "pk_bos_1", x: 36, y: 15 },
      { id: "pk_bos_2", x: 3, y: 17 },
    ],
    signs: {
      "2,10": ["← Little Everywhere (300m)", "← Mini LA (a long walk)"],
    },
    npcs: [
      { id: "bos_student", sprite: "npc_woman", x: 22, y: 13, dir: "down" },
      { id: "bos_runner", sprite: "npc_man", x: 8, y: 5, dir: "down" },
      { id: "bos_oldman", sprite: "npc_old", x: 14, y: 12, dir: "left" },
    ],
    exits: [{ x: 0, y: 7, w: 1, h: 4, to: "route", spawn: "east" }],
    spawns: { west: [2, 9], beach: [32, 10] }, // `beach` is a dev shortcut
    noahPost: [13, 21], // only used if she somehow got here without him
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
      // parked in front of the TV, obviously
      { id: "home_bro", sprite: "npc_bro", x: 7, y: 10, dir: "up",
        point: "home_bro" },
      { id: "home_leo", sprite: "leo", pet: true, x: 14, y: 11, dir: "down",
        point: "home_leo", join: "leo" },
      { id: "home_charlie", sprite: "charlie", pet: true, x: 16, y: 11, dir: "down",
        point: "home_charlie", join: "charlie" },
    ],
    exits: [{ x: 8, y: 11, w: 2, h: 1, to: "la", spawn: "door" }],
    spawns: { door: [9, 10] },
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
