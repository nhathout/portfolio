// Full-screen minigames: the aquarium 🐠 and the little greenhouse 🌱.
//
// Both take over the whole stage with their own 320x240 pixel canvas laid over
// kaplay's — same internal resolution, same nearest-neighbour upscale, so they
// read as part of the same game rather than a web page bolted on top.
//
// While one is open the world is frozen (world.js sets state.cutscene) and all
// keyboard is swallowed in the capture phase, so Escape closes the minigame
// instead of opening the pause menu underneath it.

const W = 320;
const H = 240;

// ---------------------------------------------------------------- the shell

class Screen {
  /** @param {object} ctx  { audio, dialogue, toast, onOpen, onClose } */
  constructor(ctx, title) {
    this.ctx = ctx;
    this.title = title;
    this.host = document.getElementById("minigame");
    this.host.innerHTML = "";
    this.host.classList.remove("hidden");
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    this.host.appendChild(this.canvas);
    this.g = this.canvas.getContext("2d");
    this.g.imageSmoothingEnabled = false;
    this.t = 0;
    this.closed = false;
    this.pointer = null;      // {x, y} in canvas pixels, while held
    this.clicks = [];         // consumed once per frame by the game
    this.keys = [];           // same, for keydown
    this._bind();
    ctx.onOpen?.();
  }

  _bind() {
    const toCanvas = (ev) => {
      const r = this.canvas.getBoundingClientRect();
      // the canvas is letterboxed inside its box by object-fit: contain
      const scale = Math.min(r.width / W, r.height / H);
      const ox = (r.width - W * scale) / 2;
      const oy = (r.height - H * scale) / 2;
      return {
        x: (ev.clientX - r.left - ox) / scale,
        y: (ev.clientY - r.top - oy) / scale,
      };
    };
    this._onDown = (ev) => {
      ev.preventDefault();
      const p = toCanvas(ev);
      this.pointer = p;
      this.clicks.push(p);
    };
    this._onMove = (ev) => { if (this.pointer) this.pointer = toCanvas(ev); };
    this._onUp = () => { this.pointer = null; };
    this.canvas.addEventListener("pointerdown", this._onDown);
    this.canvas.addEventListener("pointermove", this._onMove);
    window.addEventListener("pointerup", this._onUp);

    // capture phase + stopPropagation: world.js listens on window in the
    // bubble phase, and halting the path here means it never sees these at all
    const OWNED = new Set(["escape", "e", "q", " ", "enter", "f", "w", "a", "s", "d",
      "arrowup", "arrowdown", "arrowleft", "arrowright"]);
    this._onKey = (ev) => {
      const tag = ev.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const key = ev.key.toLowerCase();
      ev.stopPropagation();
      // only eat the keys the minigame actually uses — F5 and friends still work
      if (OWNED.has(key)) ev.preventDefault();
      if (!ev.repeat) this.keys.push(key);
    };
    this._swallow = (ev) => ev.stopPropagation();
    window.addEventListener("keydown", this._onKey, true);
    window.addEventListener("keyup", this._swallow, true);
  }

  run(step) {
    let last = performance.now();
    const frame = (now) => {
      if (this.closed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.t += dt;
      step(dt);
      this.clicks.length = 0;
      this.keys.length = 0;
      this._raf = requestAnimationFrame(frame);
    };
    this._raf = requestAnimationFrame(frame);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    cancelAnimationFrame(this._raf);
    this.canvas.removeEventListener("pointerdown", this._onDown);
    this.canvas.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerup", this._onUp);
    window.removeEventListener("keydown", this._onKey, true);
    window.removeEventListener("keyup", this._swallow, true);
    this.host.classList.add("hidden");
    this.host.innerHTML = "";
    this.ctx.audio?.close();
    this.ctx.onClose?.();
  }

  /** true if any of these keys was pressed this frame */
  pressed(...names) {
    return this.keys.some((k) => names.includes(k));
  }

  /** a click landed inside this rect this frame → returns the point, or null */
  clicked(x, y, w, h) {
    for (const c of this.clicks) {
      if (c.x >= x && c.x <= x + w && c.y >= y && c.y <= y + h) return c;
    }
    return null;
  }
}

// ---------------------------------------------------------------- drawing

const rect = (g, x, y, w, h, col) => {
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** blit an ASCII grid at `scale`, mapping chars through `pal` ('.' = clear) */
function blit(g, rows, x, y, pal, scale = 1, flip = false) {
  const w = rows[0].length;
  for (let j = 0; j < rows.length; j++) {
    for (let i = 0; i < rows[j].length; i++) {
      const col = pal[rows[j][i]];
      if (!col) continue;
      const ix = flip ? w - 1 - i : i;
      g.fillStyle = col;
      g.fillRect(Math.round(x + ix * scale), Math.round(y + j * scale), scale, scale);
    }
  }
}

function text(g, s, x, y, col, size = 8) {
  g.font = `${size}px "Press Start 2P", monospace`;
  g.textBaseline = "top";
  g.fillStyle = col;
  g.fillText(s, Math.round(x), Math.round(y));
}

function textC(g, s, cx, y, col, size = 8) {
  g.font = `${size}px "Press Start 2P", monospace`;
  g.textBaseline = "top";
  g.textAlign = "center";
  g.fillStyle = col;
  g.fillText(s, Math.round(cx), Math.round(y));
  g.textAlign = "left";
}

/** Break `s` into at most `maxLines` lines of `cols` characters. The bottom
 *  strip is only two 8px lines tall and Press Start 2P is a fixed 8px advance,
 *  so anything longer has to wrap or it runs straight off the canvas. */
const COLS = 36;
function wrap(s, cols = COLS, maxLines = 2) {
  const out = [];
  let line = "";
  for (const word of String(s).split(" ")) {
    if (!line.length) line = word;
    else if (line.length + 1 + word.length <= cols) line += ` ${word}`;
    else { out.push(line); line = word; }
    if (out.length === maxLines) break;
  }
  if (out.length < maxLines && line) out.push(line);
  if (out.length === maxLines && out[maxLines - 1].length > cols) {
    out[maxLines - 1] = `${out[maxLines - 1].slice(0, cols - 1)}…`;
  }
  return out;
}

/** the chrome both minigames share: a title strip and a two-line caption strip.
 *  `lines` is [white, grey] — pass the status line second. */
function chrome(g, title, right, lines) {
  rect(g, 0, 0, W, 16, "#231d2e");
  rect(g, 0, 15, W, 1, "#3d3450");
  text(g, title, 6, 4, "#f0d264");
  if (right) {
    g.textAlign = "right";
    text(g, right, W - 6, 4, "#cfc9e0");
    g.textAlign = "left";
  }
  rect(g, 0, H - 26, W, 26, "#231d2e");
  rect(g, 0, H - 27, W, 1, "#3d3450");
  if (lines[0]) text(g, lines[0], 6, H - 21, "#fffdf4");
  if (lines[1]) text(g, lines[1], 6, H - 11, "#8f88a8");
}

// ================================================================= AQUARIUM 🐠

const FISH_ART = {
  round: [
    "......BBB.....",
    "F...BBBBBBB...",
    "FF.BBBBBBBBB..",
    "FFFBBBBBBBBBB.",
    "FFFBBBBBBBBEB.",
    "FFFBBBBBBBBBB.",
    "FF.BBBBBBBBB..",
    "F...BBBBBBB...",
    "......BBB.....",
  ],
  long: [
    "......FFF.......",
    "FF...BBBBBBBB...",
    "FFF.BBBBBBBBBBB.",
    "FFFBBBBBBBBBBBEB",
    "FFF.BBBBBBBBBBB.",
    "FF...BBBBBBBB...",
  ],
  puffer: [
    ".F..FFFF..F..",
    "..FBBBBBBF...",
    ".FBBBBBBBBF..",
    "FBBBBBBBBBBF.",
    ".BBBBBBBBEBB.",
    "FBBBBBBBBBBF.",
    ".FBBBBBBBBF..",
    "..FBBBBBBF...",
    ".F..FFFF..F..",
  ],
  angel: [
    "....FF.....",
    "...FFF.....",
    "..FBBBF....",
    ".FBBBBBF...",
    ".BBBBBBBB.F",
    "FBBBBBBEBFF",
    "FBBBBBBBBFF",
    ".BBBBBBBB.F",
    ".FBBBBBF...",
    "..FBBBF....",
    "...FFF.....",
    "....FF.....",
  ],
};

const FOOD_KEYS = ["f", " ", "enter"];
const SCALE = 2;

function fishArt(kind) {
  return FISH_ART[kind === "pair" ? "round" : kind] || FISH_ART.round;
}

function drawFish(g, f, x, y, flip, blink) {
  const art = fishArt(f.kind);
  const pal = { B: f.body, F: f.fin, E: blink ? f.body : "#1a1620" };
  blit(g, art, x, y, pal, SCALE, flip);
  if (f.kind === "pair") {
    blit(g, art, x + 7 * SCALE, y + 5 * SCALE,
      { B: f.fin, F: f.body, E: blink ? f.fin : "#1a1620" }, SCALE, flip);
  }
}

function fishSize(f) {
  const art = fishArt(f.kind);
  const w = art[0].length * SCALE + (f.kind === "pair" ? 7 * SCALE : 0);
  const h = art.length * SCALE + (f.kind === "pair" ? 5 * SCALE : 0);
  return [w, h];
}

const TANK_TOP = 22;
const TANK_BOT = 196;   // where the gravel starts
const GLASS = 8;

export function openTank(ctx, roster) {
  const scr = new Screen(ctx, "tank");
  const g = scr.g;
  const unlocked = roster.filter((f) => f.unlocked);
  const locked = roster.filter((f) => !f.unlocked);

  // which ones she has already been told about, so a new arrival gets a moment
  let seen;
  try { seen = new Set(JSON.parse(localStorage.getItem("sl_tank_seen") || "[]")); }
  catch { seen = new Set(); }
  const fresh = unlocked.filter((f) => !seen.has(f.id));
  localStorage.setItem("sl_tank_seen", JSON.stringify(unlocked.map((f) => f.id)));

  let fed = parseInt(localStorage.getItem("sl_tank_fed") || "0", 10) || 0;

  const swimmers = unlocked.map((f, i) => {
    const [fw, fh] = fishSize(f);
    return {
      f, fw, fh,
      x: GLASS + 8 + ((i * 47) % Math.max(1, W - 2 * GLASS - fw - 16)),
      y: TANK_TOP + 8 + ((i * 31) % Math.max(1, TANK_BOT - TANK_TOP - fh - 16)),
      vx: (i % 2 ? 1 : -1) * (14 + (i % 5) * 4),
      vy: 0,
      bob: i * 1.7,
      blink: 0,
      ate: 0,
      target: null,
    };
  });

  const pellets = [];
  const hearts = [];
  const bubbles = Array.from({ length: 10 }, (_, i) => ({
    x: GLASS + 6 + ((i * 37) % (W - 2 * GLASS - 12)),
    y: TANK_BOT - (i * 19) % (TANK_BOT - TANK_TOP),
    r: 1 + (i % 2),
    sp: 12 + (i % 4) * 5,
  }));
  const plants = [
    { x: 26, h: 62, hue: "#2f7f4f", tip: "#4fae6a" },
    { x: 34, h: 46, hue: "#3f8f5c", tip: "#5fbe7a" },
    { x: 44, h: 74, hue: "#2a6f45", tip: "#4fae6a" },
    { x: 272, h: 58, hue: "#3f8f5c", tip: "#5fbe7a" },
    { x: 282, h: 78, hue: "#2f7f4f", tip: "#4fae6a" },
    { x: 292, h: 44, hue: "#2a6f45", tip: "#5fbe7a" },
    { x: 148, h: 38, hue: "#3f8f5c", tip: "#5fbe7a" },
  ];

  const IDLE = "click water to feed · fish to pet";
  let caption = fresh.length
    ? `${fresh.map((f) => f.name).join(", ")} — ${fresh.length > 1 ? "new fish!" : "a new fish!"} ♥`
    : IDLE;
  let captionT = fresh.length ? 6 : 0;
  let queued = null;       // caption to run after the current one
  let rosterPage = 0;
  let rosterT = 0;

  if (fresh.length) {
    ctx.audio?.fanfare();
  }

  function feedAt(x, y) {
    if (pellets.length > 22) return;
    pellets.push({ x: Math.max(GLASS + 4, Math.min(W - GLASS - 4, x)), y: Math.max(TANK_TOP + 4, y), vy: 16 + Math.random() * 10 });
    ctx.audio?.blip();
  }

  function say(line, seconds = 3.4, then = null) {
    caption = line;
    captionT = seconds;
    queued = then;   // shown once this one times out
  }

  scr.run((dt) => {
    // ---- input
    if (scr.pressed("escape", "e", "q")) return scr.close();
    if (scr.pressed(...FOOD_KEYS)) {
      feedAt(GLASS + 12 + Math.random() * (W - 2 * GLASS - 24), TANK_TOP + 10);
    }
    for (const c of scr.clicks) {
      if (c.y < TANK_TOP || c.y > TANK_BOT + 16) continue;
      // clicking a fish greets it; clicking open water drops food
      const hit = swimmers.find((s) =>
        c.x >= s.x - 2 && c.x <= s.x + s.fw + 2 && c.y >= s.y - 2 && c.y <= s.y + s.fh + 2);
      if (hit) {
        say(`♥ you earned ${hit.f.name} by ${hit.f.hint}`, 3, { line: hit.f.line, secs: 4.5 });
        hearts.push({ x: hit.x + hit.fw / 2, y: hit.y, t: 0 });
        ctx.audio?.heart();
      } else {
        feedAt(c.x, c.y);
      }
    }

    // ---- pellets sink and get eaten
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i];
      p.y += p.vy * dt;
      p.x += Math.sin(scr.t * 2 + i) * 6 * dt;
      if (p.y > TANK_BOT - 2) pellets.splice(i, 1);
    }

    // ---- fish
    for (const s of swimmers) {
      s.bob += dt;
      s.blink = (s.blink + dt) % 4.2;
      // claim the nearest pellet
      if (!s.target || !pellets.includes(s.target)) {
        s.target = null;
        let best = 1e9;
        for (const p of pellets) {
          const d = Math.hypot(p.x - s.x, p.y - s.y);
          if (d < best && d < 150) { best = d; s.target = p; }
        }
      }
      if (s.target) {
        const dx = s.target.x - (s.x + s.fw / 2);
        const dy = s.target.y - (s.y + s.fh / 2);
        const d = Math.hypot(dx, dy) || 1;
        s.vx = (dx / d) * 62;
        s.vy = (dy / d) * 48;
        if (d < 7) {
          const idx = pellets.indexOf(s.target);
          if (idx >= 0) pellets.splice(idx, 1);
          s.target = null;
          s.ate++;
          fed++;
          localStorage.setItem("sl_tank_fed", String(fed));
          hearts.push({ x: s.x + s.fw / 2, y: s.y, t: 0 });
          ctx.audio?.pickup();
          if (swimmers.every((o) => o.ate > 0) && !scr._allFed) {
            scr._allFed = true;
            ctx.audio?.fanfare();
            say("everybody's been fed. the whole little world is happy ♥", 5);
          }
        }
      } else {
        // idle wander
        s.vx += (Math.sin(s.bob * 0.7) * 10 - s.vx * 0.4) * dt;
        s.vy = Math.sin(s.bob * 1.3) * 9;
        if (Math.abs(s.vx) < 8) s.vx = s.vx < 0 ? -10 : 10;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < GLASS + 2) { s.x = GLASS + 2; s.vx = Math.abs(s.vx); }
      if (s.x + s.fw > W - GLASS - 2) { s.x = W - GLASS - 2 - s.fw; s.vx = -Math.abs(s.vx); }
      s.y = Math.max(TANK_TOP + 3, Math.min(TANK_BOT - s.fh - 3, s.y));
    }

    for (let i = hearts.length - 1; i >= 0; i--) {
      hearts[i].t += dt;
      hearts[i].y -= 22 * dt;
      if (hearts[i].t > 1) hearts.splice(i, 1);
    }
    for (const b of bubbles) {
      b.y -= b.sp * dt;
      if (b.y < TANK_TOP) b.y = TANK_BOT - 2;
    }

    if (captionT > 0) {
      captionT -= dt;
      if (captionT <= 0) {
        if (queued) { caption = queued.line; captionT = queued.secs; queued = null; }
        else caption = IDLE;
      }
    }
    // the locked list cycles slowly through the ones she hasn't earned yet
    rosterT += dt;
    if (rosterT > 3.6) { rosterT = 0; rosterPage = (rosterPage + 1) % Math.max(1, locked.length); }

    // ---------------------------------------------------------- render
    rect(g, 0, 0, W, H, "#14101f");

    // water, banded light to dark
    const bands = 10;
    for (let i = 0; i < bands; i++) {
      const y0 = TANK_TOP + (i * (TANK_BOT - TANK_TOP)) / bands;
      const h = (TANK_BOT - TANK_TOP) / bands + 1;
      const mix = i / (bands - 1);
      const r = Math.round(0x49 - mix * 0x22);
      const gr = Math.round(0xa3 - mix * 0x50);
      const b = Math.round(0xcc - mix * 0x48);
      rect(g, GLASS, y0, W - GLASS * 2, h, `rgb(${r},${gr},${b})`);
    }
    // surface shimmer
    for (let x = GLASS; x < W - GLASS; x += 2) {
      const y = TANK_TOP + 1 + Math.round(Math.sin(x * 0.12 + scr.t * 1.6) * 1.5);
      rect(g, x, y, 2, 2, "#bfeaf8");
    }
    // light shafts
    g.globalAlpha = 0.09;
    for (let i = 0; i < 3; i++) {
      const bx = 50 + i * 95 + Math.sin(scr.t * 0.25 + i) * 12;
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(bx, TANK_TOP);
      g.lineTo(bx + 22, TANK_TOP);
      g.lineTo(bx + 52, TANK_BOT);
      g.lineTo(bx + 12, TANK_BOT);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;

    // plants, swaying
    for (const p of plants) {
      for (let j = 0; j < p.h; j++) {
        const sway = Math.sin(scr.t * 1.1 + p.x * 0.05 + j * 0.09) * (j / p.h) * 4;
        rect(g, p.x + sway, TANK_BOT - 2 - j, 3, 1, j % 5 === 0 ? p.tip : p.hue);
      }
    }
    // the castle
    rect(g, 140, 156, 38, 40, "#8f8776");
    rect(g, 140, 156, 38, 2, "#a9a190");
    rect(g, 148, 168, 8, 14, "#5f5849");
    rect(g, 162, 172, 8, 10, "#5f5849");
    rect(g, 132, 146, 12, 50, "#8f8776");
    rect(g, 174, 146, 12, 50, "#8f8776");
    for (const tx of [132, 138, 174, 180]) rect(g, tx, 142, 6, 5, "#8f8776");
    // gravel
    rect(g, GLASS, TANK_BOT, W - GLASS * 2, 18, "#8a7a63");
    rect(g, GLASS, TANK_BOT, W - GLASS * 2, 2, "#a1906f");
    for (let i = 0; i < 70; i++) {
      const gx = GLASS + ((i * 61) % (W - GLASS * 2));
      rect(g, gx, TANK_BOT + 3 + ((i * 7) % 13), 2, 2, i % 3 ? "#756750" : "#9b8a6c");
    }

    // bubbles
    for (const b of bubbles) rect(g, b.x, b.y, b.r + 1, b.r + 1, "#cfeefc");
    // pellets
    for (const p of pellets) {
      rect(g, p.x - 1, p.y - 1, 3, 3, "#c9853c");
      rect(g, p.x - 1, p.y - 1, 1, 1, "#e8b06a");
    }
    // fish (sorted so the ones nearer the glass draw last)
    for (const s of [...swimmers].sort((a, b) => a.y - b.y)) {
      drawFish(g, s.f, s.x, s.y + Math.sin(s.bob * 2) * 1.5, s.vx < 0, s.blink > 4);
    }
    // hearts
    for (const h of hearts) {
      g.globalAlpha = Math.max(0, 1 - h.t);
      rect(g, h.x - 2, h.y - 1, 2, 2, "#ff7b93");
      rect(g, h.x + 1, h.y - 1, 2, 2, "#ff7b93");
      rect(g, h.x - 2, h.y + 1, 5, 2, "#ff7b93");
      rect(g, h.x - 1, h.y + 3, 3, 1, "#ff7b93");
      g.globalAlpha = 1;
    }

    // the glass itself
    rect(g, 0, TANK_TOP - 4, W, 4, "#3d444d");
    rect(g, 0, TANK_TOP - 4, W, 1, "#5d666f");
    rect(g, 0, TANK_TOP - 4, GLASS, TANK_BOT + 22 - TANK_TOP, "#3d444d");
    rect(g, W - GLASS, TANK_TOP - 4, GLASS, TANK_BOT + 22 - TANK_TOP, "#3d444d");
    rect(g, 0, TANK_BOT + 18, W, 4, "#3d444d");
    g.globalAlpha = 0.16;
    rect(g, GLASS + 3, TANK_TOP + 2, 3, TANK_BOT - TANK_TOP - 6, "#ffffff");
    g.globalAlpha = 1;

    // one locked fish at a time, so she always knows what's still out there
    const nxt = locked.length ? locked[rosterPage % locked.length] : null;
    const lines = wrap(caption, nxt ? 34 : COLS);
    const showHint = lines.length < 2;
    if (showHint) lines.push(nxt ? `next: ${nxt.hint}` : "E / esc to leave · F to feed");
    chrome(g, "OUR TANK 🐠", `${unlocked.length}/${roster.length} · fed ${fed}`, lines);
    // the ghost of the next fish, but only next to its own hint — on its own
    // it just reads as a smudge in the corner
    if (nxt && showHint) {
      g.globalAlpha = 0.5;
      blit(g, fishArt(nxt.kind), W - 20, H - 22, { B: "#514a63", F: "#3d3750", E: "#514a63" }, 1);
      g.globalAlpha = 1;
    }
  });
}

// =============================================================== GREENHOUSE 🌱

const HERBS = [
  { id: "basil", name: "BASIL", leaf: "#4f9e52", leaf2: "#71c274", fruit: null,
    line: "basil. the whole apartment smells like it for an hour afterwards." },
  { id: "tomato", name: "TOMATO", leaf: "#3f8f4a", leaf2: "#5fae64", fruit: "#e8443c",
    line: "one tomato. it took a month. it is the best tomato either of you has ever had." },
  { id: "mint", name: "MINT", leaf: "#5fb08a", leaf2: "#84d0a8", fruit: null,
    line: "mint, which is already trying to escape its pot. mint always is." },
  { id: "rosemary", name: "ROSEMARY", leaf: "#4a7f62", leaf2: "#6a9f7c", fruit: null,
    line: "rosemary — for the potatoes, and for smelling your own hands afterwards." },
  { id: "chili", name: "CHILI", leaf: "#3f8f4a", leaf2: "#66b06a", fruit: "#e8703c",
    line: "two small chilies. you are both going to be extremely brave about these." },
  { id: "parsley", name: "PARSLEY", leaf: "#57a052", leaf2: "#7cc47a", fruit: null,
    line: "parsley. unglamorous, essential, quietly holding the whole meal together." },
];

const SOAK_MS = 3200;      // how long the soil stays wet between waterings
const WATERS_PER_STAGE = 3;
const AWAY_MS = 5 * 60 * 1000;   // gone this long → everything creeps up a stage

function loadGarden() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("sl_garden") || "{}"); } catch { saved = {}; }
  const pots = HERBS.map((h) => ({
    ...h,
    // a brand-new greenhouse starts as six sprouts, not six pots of dirt
    stage: Math.max(0, Math.min(3, saved[h.id]?.stage ?? 1)),
    water: Math.max(0, Math.min(WATERS_PER_STAGE - 1, saved[h.id]?.water ?? 0)),
    wetUntil: 0,
    shake: 0,
    pop: 0,
  }));
  return { pots, lastSeen: saved._seen || 0 };
}

function saveGarden(pots) {
  const out = { _seen: Date.now() };
  for (const p of pots) out[p.id] = { stage: p.stage, water: p.water };
  localStorage.setItem("sl_garden", JSON.stringify(out));
}

/** the plant itself, drawn from the pot rim up. Stage 0 is bare soil. */
function drawHerb(g, p, cx, baseY, t, wobble) {
  if (p.stage === 0) {
    for (let i = 0; i < 4; i++) rect(g, cx - 6 + i * 4, baseY - 1, 2, 1, "#6b5137");
    return;
  }
  const height = [0, 12, 24, 34][p.stage];
  const spread = [0, 5, 9, 13][p.stage];
  const sway = Math.sin(t * 1.4 + cx * 0.07) * 1.6 + wobble;
  // stem
  for (let j = 0; j < height; j++) {
    const s = (sway * j) / height;
    rect(g, cx - 1 + s, baseY - j, 2, 1, "#3d7a3f");
  }
  // leaf pairs up the stem
  const pairs = [1, 2, 3, 4][p.stage - 1] + 1;
  for (let i = 0; i < pairs; i++) {
    const ly = baseY - 5 - (i * (height - 6)) / Math.max(1, pairs - 0.2);
    const s = (sway * (baseY - ly)) / height;
    const lw = Math.max(3, spread - i);
    for (const dir of [-1, 1]) {
      for (let k = 0; k < lw; k++) {
        const th = Math.max(1, 3 - Math.floor(k / 3));
        rect(g, cx + s + dir * (2 + k) - (dir < 0 ? 1 : 0), ly - th / 2 - k * 0.25,
          1, th, k % 2 ? p.leaf : p.leaf2);
      }
    }
  }
  // the payoff
  if (p.stage === 3) {
    if (p.fruit) {
      for (const [fx, fy] of [[-5, 14], [4, 21], [0, 8]]) {
        rect(g, cx + fx + sway * 0.5, baseY - fy, 4, 4, p.fruit);
        rect(g, cx + fx + sway * 0.5, baseY - fy, 4, 1, "#ffffff44");
      }
    } else {
      for (const [fx, fy] of [[-6, 26], [5, 30], [-1, 33]]) {
        rect(g, cx + fx + sway * 0.5, baseY - fy, 3, 3, p.leaf2);
      }
    }
    // ready-to-pick sparkle
    const s = Math.sin(t * 4 + cx) > 0.4;
    if (s) {
      rect(g, cx + 9, baseY - height - 2, 1, 3, "#f8ecc4");
      rect(g, cx + 8, baseY - height - 1, 3, 1, "#f8ecc4");
    }
  }
}

export function openGarden(ctx) {
  const scr = new Screen(ctx, "garden");
  const g = scr.g;
  const { pots, lastSeen } = loadGarden();
  let harvest = parseInt(localStorage.getItem("sl_harvest") || "0", 10) || 0;
  let sel = 0;
  let caption = "← → pick a pot · SPACE to water · E / esc to leave";
  let captionT = 0;
  let canT = 0;                // the watering can tips over the selected pot
  const drops = [];
  const puffs = [];

  // things grow while she's out in the world ♥
  let grew = 0;
  if (lastSeen && Date.now() - lastSeen > AWAY_MS) {
    for (const p of pots) {
      if (p.stage > 0 && p.stage < 3) { p.stage++; grew++; }
      else if (p.stage === 0 && p.water > 0) { p.stage = 1; grew++; }
    }
    if (grew) saveGarden(pots);
  }
  if (grew) {
    caption = `${grew} of them grew while you were out 🌱`;
    captionT = 4.5;
    ctx.audio?.fanfare();
  }

  const potX = (i) => 34 + (i % 3) * 84;
  const potY = (i) => (i < 3 ? 88 : 172);   // the two bench tops

  function say(line, seconds = 3.6) { caption = line; captionT = seconds; }

  function act() {
    const p = pots[sel];
    const now = Date.now();
    if (p.stage === 3) {                       // pick it
      harvest++;
      localStorage.setItem("sl_harvest", String(harvest));
      p.stage = 1;
      p.water = 0;
      p.pop = 1;
      saveGarden(pots);
      ctx.audio?.fanfare();
      for (let i = 0; i < 8; i++) {
        puffs.push({ x: potX(sel) + 24, y: potY(sel) - 40, t: 0,
          vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30, heart: true });
      }
      say(`picked ${p.name.toLowerCase()} — ${p.line}`, 5.5);
      ctx.toast?.(`🌱 ${harvest} harvested`);
      return;
    }
    if (now < p.wetUntil) {                    // still drinking
      p.shake = 0.35;
      ctx.audio?.blip();
      say("the soil's still wet — give it a second 💧", 2);
      return;
    }
    p.wetUntil = now + SOAK_MS;
    p.water++;
    canT = 0.9;
    for (let i = 0; i < 6; i++) {
      drops.push({ x: potX(sel) + 8 + Math.random() * 10, y: potY(sel) - 38,
        vy: 90 + Math.random() * 40, t: 0 });
    }
    ctx.audio?.blip();
    if (p.water >= WATERS_PER_STAGE) {
      p.water = 0;
      p.stage = Math.min(3, p.stage + 1);
      p.pop = 1;
      ctx.audio?.pickup();
      for (let i = 0; i < 6; i++) {
        puffs.push({ x: potX(sel) + 24, y: potY(sel) - 20 - p.stage * 8, t: 0,
          vx: (Math.random() - 0.5) * 34, vy: -18 - Math.random() * 24, heart: false });
      }
      say(p.stage === 3
        ? `${p.name.toLowerCase()} is ready — press SPACE to pick it ♥`
        : `${p.name.toLowerCase()} grew!`, 3.6);
    }
    saveGarden(pots);
  }

  scr.run((dt) => {
    if (scr.pressed("escape", "e", "q")) { saveGarden(pots); return scr.close(); }
    if (scr.pressed("arrowleft", "a")) { sel = (sel + pots.length - 1) % pots.length; ctx.audio?.blip(); }
    if (scr.pressed("arrowright", "d")) { sel = (sel + 1) % pots.length; ctx.audio?.blip(); }
    if (scr.pressed("arrowup", "w")) { sel = (sel + pots.length - 3) % pots.length; ctx.audio?.blip(); }
    if (scr.pressed("arrowdown", "s")) { sel = (sel + 3) % pots.length; ctx.audio?.blip(); }
    if (scr.pressed(" ", "enter")) act();
    for (const c of scr.clicks) {
      let hit = -1;
      for (let i = 0; i < pots.length; i++) {
        if (c.x >= potX(i) && c.x <= potX(i) + 48
            && c.y >= potY(i) - 56 && c.y <= potY(i) + 22) hit = i;
      }
      if (hit >= 0) {
        if (hit === sel) act();
        else { sel = hit; ctx.audio?.blip(); }
      }
    }

    canT = Math.max(0, canT - dt);
    for (const p of pots) {
      p.shake = Math.max(0, p.shake - dt);
      p.pop = Math.max(0, p.pop - dt * 2);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.t += dt;
      d.y += d.vy * dt;
      if (d.t > 0.55) drops.splice(i, 1);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.t > 1.1) puffs.splice(i, 1);
    }
    if (captionT > 0) {
      captionT -= dt;
      if (captionT <= 0) caption = "← → pick a pot · SPACE to water · E / esc to leave";
    }

    // ---------------------------------------------------------- render
    // the glasshouse wall behind everything
    rect(g, 0, 0, W, H, "#bfe0ea");
    for (let i = 0; i < 9; i++) {
      const y0 = 16 + i * 26;
      rect(g, 0, y0, W, 24, i % 2 ? "#cfe9f2" : "#c4e2ec");
    }
    // sun, and the light falling through the glass
    rect(g, 236, 30, 26, 26, "#fbe8a8");
    rect(g, 240, 26, 18, 34, "#fbe8a8");
    rect(g, 232, 34, 34, 18, "#fbe8a8");
    rect(g, 240, 34, 18, 18, "#fdf6d4");
    g.globalAlpha = 0.18;
    for (let i = 0; i < 4; i++) {
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(250 - i * 26, 40);
      g.lineTo(262 - i * 26, 40);
      g.lineTo(120 - i * 40, H);
      g.lineTo(96 - i * 40, H);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
    // glazing bars
    for (let x = 0; x <= W; x += 64) rect(g, x, 16, 4, H - 16, "#9fb8a8");
    for (let y = 42; y < H; y += 58) rect(g, 0, y, W, 3, "#9fb8a8");
    // a couple of hanging plants up in the frame
    for (const hx of [104, 272]) {   // in the gaps between the pot columns
      rect(g, hx, 16, 2, 12, "#7a6b52");
      rect(g, hx - 8, 28, 18, 7, "#b5764e");
      rect(g, hx - 8, 28, 18, 2, "#cf8f63");
      for (let j = 0; j < 16; j++) {
        const s = Math.sin(scr.t * 0.9 + j * 0.4) * 2;
        rect(g, hx - 6 + s, 35 + j, 2, 2, j % 3 ? "#4f9e52" : "#71c274");
        rect(g, hx + 6 - s, 35 + j - 3, 2, 2, j % 4 ? "#4f9e52" : "#71c274");
      }
    }

    // two potting benches
    for (const by of [88, 172]) {
      rect(g, 0, by, W, 6, "#b5854f");
      rect(g, 0, by, W, 2, "#d0a26a");
      rect(g, 0, by + 5, W, 2, "#8a6236");
      for (let x = 12; x < W; x += 74) rect(g, x, by + 7, 6, 22, "#8a6236");
    }

    // the pots
    for (let i = 0; i < pots.length; i++) {
      const p = pots[i];
      const px = potX(i);
      const py = potY(i);
      const sh = p.shake > 0 ? Math.sin(p.shake * 60) * 2 : 0;
      const cx = px + 24 + sh;
      drawHerb(g, p, cx, py - 12, scr.t, p.pop * Math.sin(scr.t * 30) * 1.5);
      // terracotta
      rect(g, px + 10 + sh, py - 14, 28, 14, "#c2704e");
      rect(g, px + 8 + sh, py - 16, 32, 4, "#dd8a63");
      rect(g, px + 10 + sh, py - 3, 28, 3, "#9a5238");
      rect(g, px + 12 + sh, py - 12, 24, 2, "#5b4433");
      // label + the water pips
      const ready = p.stage === 3;
      // a dark plate behind the name — dark green on a tan bench was unreadable
      const nameW = p.name.length * 8 + 6;
      rect(g, cx - nameW / 2, py + 7, nameW, 10, "#2b3a30");
      textC(g, p.name, cx, py + 8, ready ? "#8fe0a0" : "#cfe0d4", 8);
      for (let k = 0; k < WATERS_PER_STAGE; k++) {
        const on = k < p.water;
        rect(g, cx - 11 + k * 8, py + 19, 5, 5, on ? "#3f97d8" : "#8fa5aa");
        if (on) rect(g, cx - 11 + k * 8, py + 19, 5, 2, "#7fc4ea");
      }
      if (i === sel) {
        const bob = Math.sin(scr.t * 4) * 2;
        rect(g, cx - 4, py - 40 + bob, 8, 3, "#e8556a");
        rect(g, cx - 2, py - 37 + bob, 4, 3, "#e8556a");
        rect(g, cx - 1, py - 34 + bob, 2, 2, "#e8556a");
        // a thin bracket, not a translucent slab — the slab read as a glass box
        for (const [bx0, by0] of [[px + 2, py - 46], [px + 2, py + 2]]) {
          rect(g, bx0, by0, 8, 2, "#e8556a");
          rect(g, bx0 + 36, by0, 8, 2, "#e8556a");
        }
        rect(g, px + 2, py - 46, 2, 8, "#e8556a");
        rect(g, px + 42, py - 46, 2, 8, "#e8556a");
        rect(g, px + 2, py - 4, 2, 8, "#e8556a");
        rect(g, px + 42, py - 4, 2, 8, "#e8556a");
      }
    }

    // the watering can, tipping over whichever pot is selected
    {
      const cx = potX(sel) + 20;
      const cy = potY(sel) - 46 - (canT > 0 ? 3 : 0);
      const tip = canT > 0 ? 3 : 0;
      rect(g, cx - 3, cy + tip - 1, 18, 14, "#5c7d84");     // outline
      rect(g, cx - 2, cy + tip, 16, 12, "#9fbfc4");
      rect(g, cx - 2, cy + tip, 16, 4, "#cfe2e5");
      rect(g, cx - 2, cy + tip + 10, 16, 2, "#79a0a8");
      rect(g, cx - 9, cy + tip + 2, 7, 3, "#5c7d84");       // the spout, pointing
      rect(g, cx - 12, cy + tip + 4, 4, 3, "#5c7d84");      // down at the pot
      rect(g, cx + 14, cy + tip + 1, 3, 8, "#5c7d84");      // the handle
      rect(g, cx + 3, cy + tip - 4, 8, 4, "#cfe2e5");       // the filler neck
      rect(g, cx + 3, cy + tip - 4, 8, 1, "#eaf4f6");
    }
    for (const d of drops) rect(g, d.x, d.y, 2, 3, "#7fc4ea");
    for (const p of puffs) {
      g.globalAlpha = Math.max(0, 1 - p.t);
      if (p.heart) {
        rect(g, p.x - 2, p.y - 1, 2, 2, "#ff7b93");
        rect(g, p.x + 1, p.y - 1, 2, 2, "#ff7b93");
        rect(g, p.x - 2, p.y + 1, 5, 2, "#ff7b93");
      } else {
        rect(g, p.x, p.y, 3, 3, "#f8ecc4");
      }
      g.globalAlpha = 1;
    }

    const p = pots[sel];
    const verb = p.stage === 3 ? "SPACE to pick ♥"
      : `SPACE to water ${p.water}/${WATERS_PER_STAGE}`;
    const lines = wrap(caption);
    if (lines.length < 2) {
      lines.push(`${p.name.toLowerCase()}: `
        + `${["bare soil", "a sprout", "coming along", "READY"][p.stage]} · ${verb}`);
    }
    chrome(g, "THE GREENHOUSE 🌱", `${harvest} picked`, lines);
  });
}
