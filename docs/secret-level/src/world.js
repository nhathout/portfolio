// World builder + gameplay systems.

import { MAPS, BUILDING_META, TILE as T, allPointIds, allFigIds, allPumpkinIds } from "./maps.js";

const VIEW_W = 320;
const VIEW_H = 240;
const SAVE_KEY = "sl_save";

const FALLBACK_LINES = [
  { who: "noah", text: "…okay, embarrassing: I haven't written this memory yet. It's coming, I promise. ♥" },
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
};

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
        met: !!raw.met,
        finale: !!raw.finale,
        introDone: !!raw.introDone,
        mounted: !!raw.mounted,
        map: raw.map || "la",
        pos: raw.pos || null,
      };
    } catch {
      return { seen: new Set(), figs: new Set(), pumps: new Set(), met: false, finale: false, introDone: false, mounted: false, map: "la", pos: null };
    }
  }
  function persist() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      seen: [...save.seen], figs: [...save.figs], pumps: [...save.pumps], met: save.met,
      finale: save.finale, introDone: save.introDone, mounted: state.mounted,
      map: state.map, pos: state.playerPos,
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
    if (!p || !p.lines || !p.lines.length) return FALLBACK_LINES;
    return p.lines;
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
      k.sprite("her", { anim: "idle-down" }),
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

  function addFollower(spriteName, px, py, lag, speed) {
    const f = k.add([
      k.sprite(spriteName, { anim: "idle-down" }),
      k.pos(px, py),
      k.anchor("bot"),
      k.z(py),
      "npc",
      { dir: "down", idleT: 0, lag, speed, forcedTarget: null, onArrive: null, isFollower: true },
    ]);
    addShadow(f);

    f.onUpdate(() => {
      f.z = f.pos.y;
      let target = null;
      if (f.forcedTarget) {
        target = f.forcedTarget;
      } else {
        const idx = state.trail.length - 1 - f.lag;
        if (idx >= 0) target = state.trail[idx];
      }
      if (!target && !f.forcedTarget) { idle(); return; }
      const d = target.sub(f.pos);
      const dist = d.len();
      const arriveAt = f.forcedTarget ? 2 : 4;
      if (dist > arriveAt) {
        // keep up with the ATV (noah has to sprint, poor guy)
        const step = Math.min(dist, f.speed * (state.mounted ? 2.15 : 1) * k.dt());
        f.pos = f.pos.add(d.unit().scale(step));
        const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? "right" : "left") : d.y > 0 ? "down" : "up";
        setAnim(f, true, dir);
        f.idleT = 0;
      } else if (f.forcedTarget) {
        f.forcedTarget = null;
        const cb = f.onArrive; f.onArrive = null;
        setAnim(f, false, f.dir);
        cb?.();
      } else {
        idle();
      }
      function idle() {
        f.idleT += k.dt();
        if (spriteName === "mookie" && f.idleT > 4) {
          if (f.curAnim() !== "sit-flick") f.play("sit-flick");
        } else {
          setAnim(f, false, f.dir);
        }
      }
    });
    return f;
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
    if (state.mookie) state.mookie.hidden = true; // he's on the back rack ♥
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
    if (state.mookie) {
      state.mookie.hidden = false;
      state.mookie.pos = state.player.pos.add(-10, 4);
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
    k.setCamPos(cx, cy);
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
    const prompt = memories.finale?.prompt ||
      [{ who: "noah", text: "hey… I have one more thing to show you. meet me at our apartment? ♥" }];
    await dialogue.show(prompt);
    addFinaleMarker();
  }

  function addFinaleMarker() {
    if (state.map !== "boston" || save.finale || !finaleReady()) return;
    if (k.get("finaleMarker").length) return;
    const def = MAPS.boston;
    const apt = def.buildings.find((b) => b.point === "apartment");
    const m = BUILDING_META[apt.sprite];
    const x = (apt.x + Math.floor(m.wt / 2)) * T + 8;
    const y = (apt.y + 1) * T - 40;
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
  function travelEntries() {
    try { return JSON.parse(localStorage.getItem("sl_travels") || "[]"); } catch { return []; }
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

  const loadedTravelSprites = new Set();
  function spawnTravel(e) {
    const name = `t_${e.id}`;
    if (!loadedTravelSprites.has(name)) {
      k.loadSprite(name, travelDataURL(e.country, e.id));
      loadedTravelSprites.add(name);
    }
    k.add([
      k.sprite(name), k.pos(e.x * T + 8, e.y * T + 16), k.anchor("bot"),
      k.area({ shape: new k.Rect(k.vec2(-5, -5), 10, 5) }),
      k.body({ isStatic: true }), k.z(e.y * T + 16),
      "signpost", { lines: [`✈ ${e.country}`, e.msg] },
    ]);
  }

  function travelFreeSpot(def) {
    const entries = travelEntries();
    const taken = new Set(entries.map((e) => `${e.x},${e.y}`));
    for (let i = 0; i < 400; i++) {
      const x = 2 + Math.floor(Math.random() * (def.ground[0].length - 4));
      const y = 2 + Math.floor(Math.random() * (def.ground.length - 4));
      if (def.ground[y][x] !== "." || def.objects[y][x] !== ".") continue;
      if ("T" === def.objects[y - 1]?.[x] || "T" === def.objects[y + 1]?.[x]) continue;
      let bad = taken.has(`${x},${y}`);
      for (const p of def.props || []) if (Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1) bad = true;
      for (const pt of def.points || []) if (x >= pt.x - 1 && x <= pt.x + pt.w && y >= pt.y - 1 && y <= pt.y + pt.h) bad = true;
      for (const f of [...(def.figs || []), ...(def.pumpkins || [])]) if (f.x === x && f.y === y) bad = true;
      if (!bad) return { x, y };
    }
    return { x: 21, y: 6 }; // guaranteed-clear fallback
  }

  function addTravelEntry(country, msg) {
    const def = MAPS.route;
    const spot = travelFreeSpot(def);
    const entry = { id: Date.now(), country, msg, ...spot };
    const entries = travelEntries();
    entries.push(entry);
    localStorage.setItem("sl_travels", JSON.stringify(entries));
    if (state.map === "route") {
      spawnTravel(entry);
      heartBurst(k.vec2(entry.x * T + 8, entry.y * T + 6), 5, 12);
    }
    audio.fanfare();
    toast(`✈ ${country} — added to our little world ♥`);
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
      n.lag = 14;
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

  async function talkMookie() {
    const c = state.mookie;
    audio.meow();
    heartBurst(c.pos.add(0, -14), 1, 4);
    const pool = memories.mookie?.lines || ["(mookie looks at you like you owe him money.)"];
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
    let lines = memories.npcs?.[npc.npcId] || NPC_FALLBACK[npc.npcId] || [{ text: "(they smile and wave.)" }];
    if (lines.length && Array.isArray(lines[0])) lines = lines[npc.said++ % lines.length]; // multiple sets
    await dialogue.show(lines);
    npc.dir = npc.homeDir;
  }

  // ------------------------------------------------------------ interaction
  async function interactPoint(zone) {
    const id = zone.pointId;
    if (id === "apartment" && finaleReady() && !save.finale) return runFinale();
    if (id === "route_quad" && save.seen.has(id)) return mount(); // seen the memory → ride
    if (id === "garden" && save.seen.has(id)) return pickTomato();
    if (id === "travel_station" && save.seen.has(id)) return ui.openTravelForm(addTravelEntry);
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
      if (id === "travel_station") ui.openTravelForm(addTravelEntry);
    }
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
    else if (f.kind === "mookie") talkMookie();
    else if (f.kind === "npc") talkTownsfolk(f.obj);
    else if (f.kind === "sign") { audio.blip(); dialogue.show(f.obj.lines.map((t) => ({ text: t }))); }
    else if (f.kind === "quad") mount();
  }

  // ------------------------------------------------------------ scene builder
  k.scene("map", ({ map, spawn, pos }) => {
    const def = MAPS[map];
    state.map = map;
    state.trail = [];
    state.focus = null;
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
    k.addLevel(def.ground, {
      tileWidth: T, tileHeight: T,
      tiles: {}, // required by kaplay even when only wildcardTile is used
      wildcardTile: (sym, p) => {
        switch (sym) {
          case ".": return [k.sprite("tiles", { frame: grassVar(p.x, p.y) })];
          case "*": return [k.sprite("tiles", { anim: FLOWER_ANIMS[(p.x * 3 + p.y * 5) % 3] })];
          case "t": return [k.sprite("tiles", { frame: F.tallgrass })];
          case "-": return [k.sprite("tiles", { frame: F[`path_${maskAt(p.x, p.y, PATHY)}`] })];
          case "s": return [k.sprite("tiles", { frame: F[`sand_${maskAt(p.x, p.y, SANDY)}`] })];
          case "r": return [k.sprite("tiles", { frame: F.road })];
          case "R": return [k.sprite("tiles", { frame: F.road_dash })];
          case "k": return [k.sprite("tiles", { frame: F.sidewalk })];
          case "w": return [k.sprite("tiles", { anim: "water" })];
        }
      },
    });

    // ---- water colliders (merge horizontal runs)
    def.ground.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        if (row[x] === "w") {
          let x2 = x;
          while (x2 < row.length && row[x2] === "w") x2++;
          solidRect(x * T, y * T, (x2 - x) * T, T);
          x = x2;
        } else x++;
      }
    });

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
        addPointZone({ id: b.point, x: b.x + Math.floor(m.wt / 2), y: b.y + 1, w: 1, h: 1 });
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
    };
    for (const p of def.props || []) {
      const px = (p.x + 0.5) * T;
      const py = (p.y + 1) * T;
      if (p.type === "figtree") {
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
        const boat = k.add([k.sprite("sailboat"), k.pos(px, py), k.anchor("bot"), k.z(py), { t: k.rand(0, 6) }]);
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

    // ---- townsfolk NPCs (background flavor)
    for (const n of def.npcs || []) {
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
        { npcId: n.id, dir, homeDir: dir, bobT: k.rand(0, 6), said: 0 },
      ]);
      if (kind === "side") c.flipX = dir === "left";
      addShadow(c);
      // subtle idle: occasional look-around
      c.onUpdate(() => {
        c.bobT += k.dt();
        if (state.focus?.kind === "npc" && state.focus.obj === c) return;
        if (c.dir !== c.homeDir) setAnim(c, false, c.homeDir);
      });
    }

    // ---- her travel log ✈ (auto-generated monuments on Little Everywhere)
    if (map === "route") for (const e of travelEntries()) spawnTravel(e);

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

    state.mookie = addFollower("mookie", sx - 14, sy + 6, 26, 78);
    if (save.met) {
      state.noah = addFollower("noah", sx - 8, sy + 14, 14, 74);
    } else if (def.noahPost) {
      const [nx, ny] = def.noahPost;
      state.noah = k.add([
        k.sprite("noah", { anim: "idle-down" }),
        k.pos(nx * T + 8, ny * T + 12), k.anchor("bot"),
        k.area({ shape: new k.Rect(k.vec2(-5, -8), 10, 8) }), k.body({ isStatic: true }),
        k.z(ny * T + 12),
        "npc", { dir: "down", isPosted: true, lag: 14, speed: 74, forcedTarget: null, onArrive: null, isFollower: false },
      ]);
      addShadow(state.noah);
      // posted noah gets follower behavior after being met (talkNoah converts him)
      const n = state.noah;
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

    // shared follower logic for converted posted noah
    function followerStep(f) {
      let target = null;
      if (f.forcedTarget) target = f.forcedTarget;
      else {
        const idx = state.trail.length - 1 - f.lag;
        if (idx >= 0) target = state.trail[idx];
      }
      if (!target) return;
      const d = target.sub(f.pos);
      const dist = d.len();
      if (dist > (f.forcedTarget ? 2 : 4)) {
        f.pos = f.pos.add(d.unit().scale(Math.min(dist, f.speed * (state.mounted ? 2.15 : 1) * k.dt())));
        setAnim(f, true, Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? "right" : "left") : d.y > 0 ? "down" : "up");
      } else if (f.forcedTarget) {
        f.forcedTarget = null;
        const cb = f.onArrive; f.onArrive = null;
        setAnim(f, false, f.dir);
        cb?.();
      } else {
        setAnim(f, false, f.dir);
      }
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
        if (state.mookie) {
          const d = state.mookie.pos.dist(player.pos);
          if (d < 20 && d < bestD) { bestD = d; best = { kind: "mookie", obj: state.mookie, focusPos: state.mookie.pos, yOff: -18 }; }
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
    if (save.mounted) mount(true); // she arrived on the ATV
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
    if (map === "boston" && finaleReady() && !save.finale) addFinaleMarker();
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
        save.seen.clear(); save.figs.clear();
        save.met = false; save.finale = false; save.introDone = false;
        save.map = "la"; save.pos = null;
        state.playerPos = null;
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
