// Boot: password gate → kaplay init → asset load → title → game.

import { Chip } from "./audio.js";
import { loadMemories, watchMemories } from "./gate.js";
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
  // 🎩 the townsfolk with personalities (see make_sprites.py)
  "npc_dapper", "npc_hiker", "npc_tourist", "npc_curlers", "npc_jogger",
  "npc_student", "npc_hawaii", "npc_regular", "npc_burgerguy",
  "npc_marina", "npc_mom", "npc_bro", "npc_jack", "npc_wife",
  "npc_innout", "npc_innout2",
  // 🏡 Brookline + the three Boston interiors
  "npc_dad", "npc_hismom", "npc_mia", "npc_barista", "npc_prof", "npc_grad",
  "npc_husky", "npc_aide",
  // 🇪🇸 the friend who playtested it and negotiated his way in
  "npc_mateo"]) {
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
// (`collie` is the OTHER Charlie — Noah's border collie 🐕)
// (the three kit_* sheets are the birthday kittens — she keeps one 🐈)
for (const pet of ["mookie", "leo", "charlie", "chakra", "collie",
  "rhett", "paws", "kit_ginger", "kit_gray", "kit_cream"]) {
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
k.loadSprite("cake", "assets/cake.png", { sliceX: 2, sliceY: 1 });   // 🎂 candles out / lit
// ambient props that cycle on their own — [name, speed, frames, pingpong].
// world.js only knows the anim is called "live"; the frame counts live here.
for (const [n, speed, frames = 2, pingpong = false] of [
  ["pool", 1.4], ["turtle", 0.7], ["in_tv", 2.2],
  ["in_fire", 3.5], ["in_stove", 3.2], ["firepit", 4],
  // 🏢 the apartment, 🤖 the lab, ☕ the cafe
  ["in_tvmount", 2.2], ["in_espresso", 3],
  ["in_aquarium", 2.6, 4],
  ["in_robotarm", 2.4, 4, true],
  ["in_printer3d", 3.2, 4],
]) {
  k.loadSprite(n, `assets/${n}.png`, {
    sliceX: frames, sliceY: 1,
    anims: { live: { from: 0, to: frames - 1, speed, loop: true, pingpong } },
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
  // 🏢 JVUE — their apartment
  "in_sofagray", "in_coffeetable", "in_herbwindow", "in_boxes",
  "in_kitchen2", "in_bed", "in_desk",
  // 🏡 Brookline
  "in_recliner", "in_bakerack", "in_gymbags", "in_hutch",
  // 🎓 Northeastern
  "in_worldwall", "in_globe", "in_unhorseshoe", "in_flagrow",
  "in_coopboard", "in_lecternrows", "in_lectern",
  // 🤖 BU robotics
  "in_workbench", "in_partsbin", "in_rover", "in_drone",
  // ☕ Cafe Bene
  "in_cafetable", "in_cafecounter", "in_pastrycase", "in_hingeframe",
  "in_armchair", "in_beanshelf",
  // 🌷 the care home
  "in_carebed", "in_ivdrip", "in_bedtable", "in_wheelchair",
  "b_la_home", "b_la_jack", "b_la_house_b", "b_shaveice", "b_carehome",
  "b_innout", "b_brownstone_b", "b_bu_building", "b_neu_building",
  // the party 🎂
  "bunting", "balloons", "partytable",
  "b_cafe", "b_jvue", "b_duplex"]) {
  if (n === "figtree") k.loadSprite(n, `assets/${n}.png`, { sliceX: 2, sliceY: 1 });
  else k.loadSprite(n, `assets/${n}.png`);
}

// ---------------------------------------------------------------- loading 🎒
// ~250 sprites. Show a bar, but only if the load actually takes a moment —
// on a warm cache it finishes in a few frames and a flash would be worse.
await (async () => {
  const el = document.getElementById("loading");
  const fill = document.getElementById("load-fill");
  const pct = document.getElementById("load-pct");
  const line = document.getElementById("load-line");
  const LINES = [
    "packing the suitcase…", "feeding the cat…", "planting the figs…",
    "inflating the balloons…", "waking everybody up…",
  ];
  let done = false;
  k.onLoad(() => { done = true; });

  const shown = await new Promise((r) => setTimeout(() => r(!done), 140));
  if (shown) {
    el.classList.remove("hidden");
    line.textContent = LINES[Math.floor(Math.random() * LINES.length)];
  }
  let lineT = 0;
  await new Promise((resolve) => {
    const tick = () => {
      const p = Math.round(Math.min(1, k.loadProgress()) * 100);
      if (shown) {
        fill.style.width = `${p}%`;
        pct.textContent = String(p);
        if (++lineT % 90 === 0) line.textContent = LINES[Math.floor(Math.random() * LINES.length)];
      }
      if (done) {
        if (!shown) return resolve();
        fill.style.width = "100%";
        pct.textContent = "100";
        // let the bar land on full before it goes
        return setTimeout(() => { el.classList.add("hidden"); resolve(); }, 260);
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
})();

// ---------------------------------------------------------------- UI glue
const $ = (id) => document.getElementById(id);
const names = {
  her: memories.meta?.playerName || "you",
  noah: memories.meta?.noahName || "Noah",
  cat: memories.meta?.catName || "Mookie",
  dusya: memories.meta?.grandmaName || "Dusya",
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
    // dev: a button in the pause menu that jumps straight to the party +
    // credits, so the ending can be checked without finishing the game
    if (params.has("dev")) {
      const b = $("btn-test-ending");
      b.classList.remove("hidden");
      b.addEventListener("click", () => {
        setPaused(false);
        game.runParty({ map: game.state.map, spawn: "door" });
      });
    }
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
  // ---- the party 🎂
  showPartyBanner(text) {
    const el = $("party-banner");
    el.firstElementChild.textContent = text;
    el.classList.remove("hidden");
  },
  hidePartyBanner() {
    $("party-banner").classList.add("hidden");
  },
  /** resolves when she dismisses the "happy birthday" card */
  finaleBannerClosed() {
    const banner = $("finale-banner");
    if (banner.classList.contains("hidden")) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        banner.classList.add("hidden");
        $("btn-finale-close").removeEventListener("click", done);
        resolve();
      };
      $("btn-finale-close").addEventListener("click", done);
    });
  },
  /** scrolls the end credits; resolves when they finish or she skips */
  rollCredits(data) {
    const wrap = $("credits");
    const scroll = $("credits-scroll");
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    let html = `<h2>${esc(data.title)}</h2><p class="cr-sub">${esc(data.sub)}</p>`;
    for (const [role, names] of data.groups) {
      html += `<p class="cr-role">${esc(role)}</p>`;
      for (const n of names) html += `<p class="cr-name">${esc(n)}</p>`;
    }
    html += `<p class="cr-end">${esc(data.end)}</p>`;
    scroll.innerHTML = html;
    scroll.classList.remove("roll");
    wrap.classList.remove("hidden");
    // pace the scroll to the amount of text, ~34s for a normal reel
    const secs = Math.max(22, Math.min(70, 10 + scroll.scrollHeight / 26));
    scroll.style.animationDuration = `${secs}s`;
    void scroll.offsetHeight;   // restart the animation
    scroll.classList.add("roll");
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        scroll.removeEventListener("animationend", finish);
        $("btn-credits-skip").removeEventListener("click", finish);
        window.removeEventListener("keydown", onKey);
        wrap.classList.add("hidden");
        scroll.classList.remove("roll");
        resolve();
      };
      const onKey = (e) => { if (e.key === "Escape" || e.key === "Enter") finish(); };
      const timer = setTimeout(finish, secs * 1000 + 1200);
      scroll.addEventListener("animationend", finish);
      $("btn-credits-skip").addEventListener("click", finish);
      window.addEventListener("keydown", onKey);
    });
  },
  /**
   * 🐈 the last thing she does in the game: pick one of three kittens, then
   * name it. Resolves with { id, name } — there is deliberately no way to
   * cancel out of this one.
   */
  chooseKitten(cfg) {
    const overlay = $("kitten");
    const row = $("kit-row");
    const form = $("kit-name-form");
    const input = $("kit-name");
    $("kit-title").textContent = cfg.prompt || "pick your kitten ♥";
    $("kit-sub").textContent = cfg.sub || "";
    $("kit-name-label").textContent = cfg.namePrompt || "…and what's their name?";
    input.placeholder = cfg.namePlaceholder || "name";
    input.value = "";
    $("kit-confirm").textContent = cfg.confirm || "that's the one ♥";
    $("kit-back").textContent = cfg.back || "← pick again";
    row.innerHTML = "";
    form.classList.add("hidden");
    overlay.classList.remove("hidden");
    let picked = null;

    return new Promise((resolve) => {
      const unpick = () => {
        picked = null;
        form.classList.add("hidden");
        for (const c of row.children) c.classList.remove("picked");
      };
      for (const opt of cfg.options || []) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "kit-card";
        const sprite = document.createElement("span");
        sprite.className = "kit-sprite";
        sprite.style.backgroundImage = `url("assets/${opt.sprite}.png")`;
        const label = document.createElement("strong");
        label.textContent = opt.label || "";
        const blurb = document.createElement("em");
        blurb.textContent = opt.blurb || "";
        card.append(sprite, label, blurb);
        card.addEventListener("click", () => {
          picked = opt;
          for (const c of row.children) c.classList.toggle("picked", c === card);
          form.classList.remove("hidden");
          audio.confirm();
          setTimeout(() => input.focus(), 60);
        });
        row.appendChild(card);
      }
      $("kit-back").onclick = () => { audio.close(); unpick(); };
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!picked) return;
        const name = input.value.trim().slice(0, 16) || picked.fallbackName || "kitten";
        overlay.classList.add("hidden");
        audio.fanfare();
        resolve({ id: picked.id, name });
      };
    });
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
function applyMeta() {
  names.her = memories.meta?.playerName || "you";
  names.noah = memories.meta?.noahName || "Noah";
  names.cat = memories.meta?.catName || "Mookie";
  names.dusya = memories.meta?.grandmaName || "Dusya";
  $("title-name").textContent = memories.meta?.title || "our little world";
  $("title-sub").textContent = memories.meta?.subtitle || "";
}
applyMeta();

// dev only (plaintext memories.json): editing the file updates the game live.
// Everything else reads `memories` lazily, so only the meta needs re-applying.
watchMemories(memories, (_mem, err) => {
  applyMeta();
  const el = ui.toast;
  el.textContent = err ? "memories.json didn't parse — see console" : "memories.json reloaded ♥";
  el.classList.remove("hidden", "fade-out");
  clearTimeout(el._t1); clearTimeout(el._t2);
  el._t1 = setTimeout(() => el.classList.add("fade-out"), 1800);
  el._t2 = setTimeout(() => el.classList.add("hidden"), 2350);
});

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
    for (const id of ["leo", "charlie", "chakra", "collie"]) game.save.crew.add(id);
  }
  $("title").classList.add("hidden");
  $("hud").classList.remove("hidden");
  $("mute-btn").classList.remove("hidden");
  game.state.started = true;
  window.addEventListener("pointerdown", () => audio.startMusic(), { once: true });
  if (params.get("map") === "party") {
    // dev: jump straight to the finale party 🎂
    game.runParty({ map: "bos_jvue_in", spawn: "door" });
  } else {
    k.go("map", { map: params.get("map"), spawn: params.get("spawn") || "start", pos: null });
  }
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
