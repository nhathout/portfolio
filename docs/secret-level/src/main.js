// Boot: password gate → kaplay init → asset load → title → game.

import { Chip } from "./audio.js";
import { loadMemories } from "./gate.js";
import { Dialogue } from "./dialogue.js";
import { startGame } from "./world.js";
import { allPointIds, allFigIds } from "./maps.js";

const audio = new Chip();
const params = new URLSearchParams(location.search);
if (params.has("reset")) {
  localStorage.removeItem("sl_save");
  localStorage.removeItem("sl_pw");
}

const memories = await loadMemories(audio);

// optional recorded sound effects (drop files in assets/sfx/ — synth fallback otherwise)
audio.loadSamples({ meow: "assets/sfx/meow.mp3", noah: "assets/sfx/noah.mp3" });

// ---------------------------------------------------------------- kaplay
const k = kaplay({
  canvas: document.getElementById("game"),
  width: 320,
  height: 240,
  letterbox: true,
  stretch: true,
  crisp: true,
  pixelDensity: 1,
  texFilter: "nearest",
  background: [23, 18, 37],
  global: false,
});

// ---------------------------------------------------------------- assets
const tilesMeta = await (await fetch("assets/tiles.json")).json();
const F = tilesMeta.frames;
// world.js stamps each map's static floor into one texture at load; that needs
// the tile sheet as a plain image it can drawImage() from.
tilesMeta.image = await new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = "assets/tiles.png";
});

k.loadSprite("tiles", "assets/tiles.png", {
  sliceX: tilesMeta.cols,
  sliceY: tilesMeta.rows,
  anims: {
    water: { from: F.water_0, to: F.water_2, speed: 2, loop: true, pingpong: true },
    flower: { from: F.flower_0, to: F.flower_1, speed: 1.6, loop: true },
    flower2: { from: F.flower2_0, to: F.flower2_1, speed: 1.4, loop: true },
    flower3: { from: F.flower3_0, to: F.flower3_1, speed: 1.8, loop: true },
  },
});

const CHAR_ANIMS = {
  "idle-down": 0,
  "walk-down": { from: 0, to: 3, speed: 8, loop: true },
  "idle-up": 4,
  "walk-up": { from: 4, to: 7, speed: 8, loop: true },
  "idle-side": 8,
  "walk-side": { from: 8, to: 11, speed: 8, loop: true },
  cheer: 12,
  stand: 13,
};
k.loadSprite("her", "assets/her.png", { sliceX: 4, sliceY: 4, anims: CHAR_ANIMS });
k.loadSprite("noah", "assets/noah.png", { sliceX: 4, sliceY: 4, anims: CHAR_ANIMS });
for (const npc of ["npc_woman", "npc_man", "npc_old",
  "npc_marina", "npc_mom", "npc_bro", "npc_jack", "npc_wife",
  "npc_innout", "npc_innout2"]) {
  k.loadSprite(npc, `assets/${npc}.png`, { sliceX: 4, sliceY: 4, anims: CHAR_ANIMS });
}
// the same two of them, in In-N-Out paper hats, for after the burger run 🍔
k.loadSprite("her_hat", "assets/her_hat.png", { sliceX: 4, sliceY: 4, anims: CHAR_ANIMS });
k.loadSprite("noah_hat", "assets/noah_hat.png", { sliceX: 4, sliceY: 4, anims: CHAR_ANIMS });
// cats + dogs share a frame layout (row 4 is the sit/idle fidget)
const PET_ANIMS = {
  "idle-down": 0,
  "walk-down": { from: 0, to: 3, speed: 7, loop: true },
  "idle-up": 4,
  "walk-up": { from: 4, to: 7, speed: 7, loop: true },
  "idle-side": 8,
  "walk-side": { from: 8, to: 11, speed: 7, loop: true },
  "sit-flick": { from: 12, to: 15, speed: 2.5, loop: true },
};
for (const pet of ["mookie", "leo", "charlie", "chakra"]) {
  k.loadSprite(pet, `assets/${pet}.png`, { sliceX: 4, sliceY: 4, anims: PET_ANIMS });
}
k.loadSprite("fig", "assets/fig.png", {
  sliceX: 2, sliceY: 1,
  anims: { twinkle: { from: 0, to: 1, speed: 1.6, loop: true } },
});
k.loadSprite("pumpkin", "assets/pumpkin.png", {
  sliceX: 2, sliceY: 1,
  anims: { twinkle: { from: 0, to: 1, speed: 1.6, loop: true } },
});
k.loadSprite("quad_ride", "assets/quad_ride.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("garden", "assets/garden.png", { sliceX: 2, sliceY: 1 });
// two-frame ambient props (pool shimmer, turtle blink, TV flicker, fires)
for (const [n, speed] of [["pool", 1.4], ["turtle", 0.7], ["in_tv", 2.2],
  ["in_fire", 3.5], ["in_stove", 3.2], ["firepit", 4]]) {
  k.loadSprite(n, `assets/${n}.png`, {
    sliceX: 2, sliceY: 1,
    anims: { live: { from: 0, to: 1, speed, loop: true } },
  });
}
k.loadSprite("fx", "assets/fx.png", {
  sliceX: 6, sliceY: 1,
  anims: { sparkle: { from: 2, to: 3, speed: 3.5, loop: true } },
});
k.loadSprite("critters", "assets/critters.png", {
  sliceX: 4, sliceY: 1,
  anims: {
    flutter: { from: 0, to: 1, speed: 9, loop: true },
    glide: { from: 2, to: 3, speed: 2.2, loop: true },
  },
});
for (const n of ["tree", "palm", "figtree", "lamp", "bench", "quad", "torii",
  "barrier", "sailboat", "shadow", "radio", "horse", "column", "pyramid",
  "cypress", "matryoshka", "pisa", "cactus", "barrel", "station",
  // premade travel-log monuments
  "maple", "garita", "lobster", "liberty", "flamingo", "eiffel",
  "bigben", "minitorii", "stein", "balloon", "windmill", "lantern",
  "felucca", "wofstar", "needle", "seoulgate",
  // Aruba 🇦🇼
  "divi", "palapa", "lounger", "starfish", "beachsign",
  // the LA beach 🌊 + the burger place 🍔
  "lifeguard", "umbrella", "surfboards", "volley", "sandcastle", "innoutsign",
  // the Charles River esplanade 🦢
  "bandshell", "willow", "esplsign", "jvuesign",
  // interiors 🏡
  "in_sofa", "in_table", "in_counter", "in_fridge", "in_shelf",
  "in_plant", "in_petbeds", "in_bowl", "in_lamp", "in_rods", "in_ball",
  // the garden house 🌻 — outside…
  "vegbed", "vegbed_b", "corn", "sunflower", "logseat", "hammock",
  "trellis", "herbpots", "dreamcatcher", "bus",
  // …and in
  "in_sofa2", "in_record", "in_guitar", "in_hangplant", "in_bigplant",
  "in_jars", "in_cushions", "in_dogbed", "in_samovar",
  // …and inside the burger place 🍔
  "in_menuboard", "in_frystation", "in_shakes", "in_drinks", "in_till",
  "in_hatstack", "in_booth", "in_tray",
  "b_la_home", "b_la_jack", "b_la_house_b", "b_taco_shop", "b_theater",
  "b_innout", "b_brownstone_b", "b_bu_building", "b_neu_building",
  "b_cafe", "b_jvue", "b_duplex"]) {
  if (n === "figtree") k.loadSprite(n, `assets/${n}.png`, { sliceX: 2, sliceY: 1 });
  else k.loadSprite(n, `assets/${n}.png`);
}

await new Promise((resolve) => k.onLoad(resolve));

// ---------------------------------------------------------------- UI glue
const $ = (id) => document.getElementById(id);
const names = {
  her: memories.meta?.playerName || "you",
  noah: memories.meta?.noahName || "Noah",
  cat: memories.meta?.catName || "Mookie",
};
const dialogue = new Dialogue(audio, names);

const ui = {
  toast: $("toast"),
  fader: $("fader"),
  hudMem: $("hud-mem"),
  hudFig: $("hud-fig"),
  hudPump: $("hud-pump"),
  dialogueEl: $("dialogue"),
  pauseEl: $("pause"),
  bindPause(setPaused) {
    $("btn-resume").addEventListener("click", () => setPaused(false));
    $("btn-exit").addEventListener("click", () => location.assign("../"));
  },
  travelOpen() {
    return !$("travel").classList.contains("hidden");
  },
  openTravelForm(handlers) {
    this._travel = handlers;
    $("tv-country").value = "";
    $("tv-msg").value = "";
    $("travel").classList.remove("hidden");
    this.renderTravelList(handlers.entries || []);
    setTimeout(() => $("tv-country").focus(), 50);
  },
  renderTravelList(entries) {
    const el = $("tv-list");
    el.innerHTML = "";
    el.classList.remove("hidden");
    const chip = (text, cls) => {
      const c = document.createElement("span");
      c.className = `tv-tag ${cls || ""}`;
      c.textContent = text;
      return c;
    };

    // --- the places already on the map (trip baseline) ---
    const heritage = this._travel?.heritage || [];
    if (heritage.length) {
      const head = document.createElement("div");
      head.className = "tv-head";
      head.textContent = "our places";
      el.appendChild(head);
      for (const h of heritage) {
        const row = document.createElement("div");
        row.className = "tv-row";
        const label = document.createElement("span");
        label.textContent = `${h.flag} ${h.country}`;
        row.append(label, chip("heritage", "tv-heritage"));
        if (!h.visited) row.append(chip("soon ♥", "tv-soon"));
        el.appendChild(row);
      }
    }

    // --- logged trips (movable / demolishable) ---
    const head2 = document.createElement("div");
    head2.className = "tv-head";
    head2.textContent = `logged trips (${entries.length})`;
    el.appendChild(head2);
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "tv-empty";
      empty.textContent = "none yet — log your first trip above ♥";
      el.appendChild(empty);
      return;
    }
    for (const e of entries) {
      const row = document.createElement("div");
      row.className = "tv-row";
      const label = document.createElement("span");
      label.textContent = `${e.home ? "⌂" : "✈"} ${e.country}`;
      row.append(label);
      if (e.home) row.append(chip("home ♥", "tv-home"));
      else if (e.soon) row.append(chip("soon ♥", "tv-soon"));
      else if (e._visit > 1) row.append(chip(`trip #${e._visit}`, "tv-count"));
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "edit";
      edit.addEventListener("click", () => {
        const next = prompt(`new message for ${e.country}:`, e.msg || "");
        if (next !== null) this.renderTravelList(this._travel.onEdit(e.id, next));
      });
      row.append(edit);
      if (!e.soon) { // soon plans have no sprite on the map yet
        const move = document.createElement("button");
        move.type = "button";
        move.textContent = "move";
        move.addEventListener("click", () => this.renderTravelList(this._travel.onMove(e.id)));
        row.append(move);
      }
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "demolish";
      del.className = "tv-del";
      del.addEventListener("click", () => {
        if (confirm(`demolish the ${e.country} ${e.soon ? "plan" : "monument"}? (its message is lost)`)) {
          this.renderTravelList(this._travel.onDelete(e.id));
        }
      });
      row.append(del);
      el.appendChild(row);
    }
  },
  closeTravelForm() {
    $("travel").classList.add("hidden");
    document.activeElement?.blur?.();
  },
  setMuted(m) {
    $("mute-btn").classList.toggle("muted", m);
  },
  showFinaleBanner(title, sub) {
    $("finale-title").textContent = title;
    $("finale-sub").textContent = sub;
    $("finale-banner").classList.remove("hidden");
  },
  bindTouch(vkeys, onInteract) {
    if (!("ontouchstart" in window)) return;
    $("touch-ui").classList.remove("hidden");
    for (const btn of document.querySelectorAll("#dpad .pad-btn")) {
      const dir = btn.dataset.dir;
      const on = (e) => { e.preventDefault(); vkeys[dir] = true; };
      const off = (e) => { e.preventDefault(); vkeys[dir] = false; };
      btn.addEventListener("pointerdown", on);
      btn.addEventListener("pointerup", off);
      btn.addEventListener("pointerleave", off);
      btn.addEventListener("pointercancel", off);
    }
    $("btn-a").addEventListener("pointerdown", (e) => { e.preventDefault(); onInteract(); });
  },
};

$("travel-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const country = $("tv-country").value.trim();
  const msg = $("tv-msg").value.trim() || "we were here ♥";
  if (!country) return $("tv-country").focus();
  ui.closeTravelForm();
  ui._travel?.onAdd?.(country, msg);
});
$("tv-cancel").addEventListener("click", () => ui.closeTravelForm());

$("mute-btn").addEventListener("click", () => ui.setMuted(audio.toggle()));
ui.setMuted(audio.muted);
$("btn-finale-close").addEventListener("click", () => {
  audio.heart();
  $("finale-banner").classList.add("hidden");
});

// ---------------------------------------------------------------- game
const game = startGame(k, memories, tilesMeta, dialogue, audio, ui);
window.__sl = { k, game, memories }; // debug handle

// ---------------------------------------------------------------- title
$("title-name").textContent = memories.meta?.title || "our little world";
$("title-sub").textContent = memories.meta?.subtitle || "";

function begin(fresh) {
  audio.confirm();
  audio.startMusic();
  $("title").classList.add("hidden");
  $("hud").classList.remove("hidden");
  $("mute-btn").classList.remove("hidden");
  // make sure no DOM button keeps focus — space/enter would "click" it again
  document.activeElement?.blur?.();
  document.getElementById("game").focus?.();
  game.start(fresh);
}

if (params.get("map")) {
  // dev shortcut: ?map=boston jumps straight in (uses/keeps current save)
  if (params.has("all")) {
    for (const id of allPointIds()) game.save.seen.add(id);
    for (const id of allFigIds()) game.save.figs.add(id);
    game.save.met = true;
    game.save.hats = true;                                                 // 🍔 hats on
    for (const id of ["leo", "charlie", "chakra"]) game.save.crew.add(id); // full herd
  }
  $("title").classList.add("hidden");
  $("hud").classList.remove("hidden");
  $("mute-btn").classList.remove("hidden");
  game.state.started = true;
  window.addEventListener("pointerdown", () => audio.startMusic(), { once: true });
  k.go("map", { map: params.get("map"), spawn: params.get("spawn") || "start", pos: null });
} else {
  $("title").classList.remove("hidden");
  if (game.hasSave) {
    $("btn-continue").classList.remove("hidden");
    $("btn-reset").classList.remove("hidden");
    $("btn-start").textContent = "New Game";
  }
  $("btn-start").addEventListener("click", () => begin(true));
  $("btn-continue").addEventListener("click", () => begin(false));
  $("btn-reset").addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("erase progress and start over?")) {
      localStorage.removeItem("sl_save");
      location.reload();
    }
  });
  // Enter starts too
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !$("title").classList.contains("hidden")) {
      begin(!game.hasSave);
    }
  });
}
