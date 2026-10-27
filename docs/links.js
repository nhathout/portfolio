// /links: the one link in every bio. A live pixel scene of the Charles (the real Boston sky
// right now), the bio as a menu, cues that make pixel Noah react to each link, and a mail card
// that works inside in-app browsers.
// Copied from contact.js (bound to the home page's DOM, so not loaded here): the sky PHASES,
// bostonHour, phaseForHour and rng, the skyline drawing, pixel Noah (NOAH), BOAT, PLANE and the
// 16x16 link ICONS. Needs /pixel-kit.js (window.PixelKit).
(() => {
  'use strict';
  const kit = window.PixelKit;
  const doc = document;
  const root = doc.documentElement;
  const $ = (s, el) => (el || doc).querySelector(s);
  const $$ = (s, el) => Array.from((el || doc).querySelectorAll(s));
  const media = q => !!(window.matchMedia && window.matchMedia(q).matches);
  const reduced = kit ? kit.reducedMotion : media('(prefers-reduced-motion: reduce)');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const now = () => performance.now();
  const later = (fn, ms) => setTimeout(fn, ms);
  const EMAIL = 'nhathout@bu.edu';
  const BIO = 'Robotics & AI engineer. I build games, robot tools and my own AI crew.';

  // ---- ?from=tiktok (or utm_source): which video sent this visitor. Whitelist only; nothing stored.
  const via = (() => {
    const site = (label, slug) => ({ slug, label, greet: `Hey, welcome from ${label}.`, hi: `hi, ${label}!` });
    const L = {
      tiktok: site('TikTok', 'tiktok'), instagram: site('Instagram', 'instagram'), youtube: site('YouTube', 'youtube'),
      linkedin: site('LinkedIn', 'linkedin'), github: site('GitHub', 'github'), twitch: site('Twitch', 'twitch'),
      x: site('X', 'x'), bluesky: site('Bluesky', 'bluesky'),
      qr: { slug: 'qr', label: 'the QR code', greet: 'Hey, you scanned the code.', hi: 'hi!' },
      share: { slug: 'share', label: 'a shared link', greet: 'Someone sent you this. Hi!', hi: 'hi!' }
    };
    Object.assign(L, { tt: L.tiktok, ig: L.instagram, yt: L.youtube, li: L.linkedin, gh: L.github, twitter: L.x, bsky: L.bluesky });
    let raw = '';
    try {
      const q = new URLSearchParams(location.search);
      raw = (q.get('from') || q.get('utm_source') || '').trim().toLowerCase();
    } catch (error) {
      return null;
    }
    const m = /^([a-z]+)(?:-([a-z0-9]{1,16}))?$/.exec(raw);
    const src = m && Object.prototype.hasOwnProperty.call(L, m[1]) ? L[m[1]] : null;
    if (!src) return null;
    return { slug: src.slug + (m[2] ? `-${m[2]}` : ''), label: src.label + (m[2] ? ` (${m[2]})` : ''), greet: src.greet, hi: src.hi };
  })();

  // ---- theme (exactly the home page's script.js), toast, clipboard, share
  const themeBtn = $('[data-theme-btn]');
  const syncTheme = () => {
    const dark = root.classList.contains('darkmode');
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', label);
    themeBtn.title = label;
  };
  if (themeBtn) {
    themeBtn.hidden = false;
    syncTheme();
    themeBtn.addEventListener('click', () => {
      const dark = root.classList.toggle('darkmode');
      try {
        if (dark) localStorage.setItem('darkmode', 'active');
        else localStorage.removeItem('darkmode');
      } catch (error) {}
      syncTheme();
    });
  }

  const toastEl = $('[data-toast]');
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = later(() => toastEl.classList.remove('is-on'), 1800);
  }

  async function copyText(text, selectEl) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {}
    const ta = doc.body.appendChild(doc.createElement('textarea'));
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = doc.execCommand('copy');
    } catch (error) {}
    ta.remove();
    if (!ok && selectEl) { // leave the text selected so a long-press can copy it
      const range = doc.createRange();
      range.selectNodeContents(selectEl);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
    return ok;
  }
  function copied(btn, ok, what) {
    const label = $('[data-label]', btn);
    if (ok && label) {
      label.dataset.text = label.dataset.text || label.textContent;
      label.textContent = 'Copied!';
      clearTimeout(btn.copyTimer);
      btn.copyTimer = later(() => (label.textContent = label.dataset.text), 1600);
    }
    toast(ok ? `${what} copied` : 'Copy is blocked here. Select the text instead.');
  }

  const shareBtn = $('[data-share]');
  if (shareBtn) {
    const url = 'https://noahhathout.com/links?from=share';
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Noah Hathout', text: BIO, url });
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') return;
        }
      }
      toast((await copyText(url)) ? 'Link copied' : url);
    });
  }

  // ---- greeting, mail links, the composer, the newsletter slot
  const greet = $('[data-greet]');
  if (greet && via) {
    greet.textContent = via.greet;
    greet.hidden = false;
  }
  const tag = via ? ` · from ${via.label}` : '';
  const mailto = (subject, body) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}` +
    (body ? `&body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}` : '');
  const notify = $('[data-notify]');
  if (notify && via) notify.href = mailto(`BROS2 early access${tag}`);

  const LINES = {
    'BROS2 early access': "I'd like early access to BROS2 when it opens.",
    'Keep me posted: first game': 'Please let me know when your first game is announced.',
    Opportunity: "I'd like to talk about a role or an internship.",
    'Research collaboration': "I'd like to talk about a research collaboration.",
    'Saying hi': 'Just wanted to say hi.'
  };
  const form = $('[data-compose]');
  const draft = () => {
    const pick = form.querySelector('input[name="subject"]:checked');
    const topic = pick && LINES[pick.value] ? pick.value : 'Saying hi';
    return { subject: topic + tag, body: `Hi Noah,\n\n${LINES[topic]}\n\n${via ? `Found you via: ${via.label}` : ''}` };
  };
  if (form) {
    const open = $('[data-compose-open]', form);
    const copyMsg = $('[data-compose-copy]', form);
    const sync = () => {
      const d = draft();
      open.href = mailto(d.subject, d.body);
    };
    form.addEventListener('change', sync);
    sync();
    open.hidden = false;
    copyMsg.hidden = false;
    $('[data-compose-submit]', form).hidden = true;
    copyMsg.addEventListener('click', async () => {
      const d = draft();
      copied(copyMsg, await copyText(`To: ${EMAIL}\nSubject: ${d.subject}\n\n${d.body.trimEnd()}`), 'Message');
    });
  }
  const copyEmail = $('[data-copy-email]');
  if (copyEmail) {
    copyEmail.hidden = false;
    copyEmail.addEventListener('click', async () => copied(copyEmail, await copyText(EMAIL, $('[data-addr]')), 'Email'));
  }
  const inApp = $('[data-inapp]');
  if (inApp && /TikTok|musical_ly|Bytedance|Instagram|FBAN|FBAV/i.test(navigator.userAgent || '')) inApp.hidden = false;
  const source = $('[data-slot="newsletter"] [data-source]');
  if (source) source.value = via ? via.slug : '';

  // the codename stays redacted: block glyphs scramble for 6 frames, then settle back to solid
  const redact = $$('[data-redact] i');
  function scramble() {
    if (reduced || scramble.t || !redact.length) return;
    let n = 0;
    scramble.t = setInterval(() => {
      n += 1;
      redact.forEach(cell => (cell.textContent = n > 6 ? '█' : '▓▒░#%&@'[Math.floor(Math.random() * 7)]));
      if (n > 6) {
        clearInterval(scramble.t);
        scramble.t = 0;
      }
    }, 60);
  }

  if (!kit) return; // everything below draws pixels
  const { paint } = kit;
  const hash = kit.art ? kit.art.hash : (x, y) => ((x * 7 + y * 13) % 16) / 16;

  // ---- 16x16 icons (linkedin, github, instagram from contact.js); frame two shows on hover/focus
  const rows = text => text.split(' ');
  const ICONS = {
    linkedin: rows('.IIIIIIIIIIIIII. IIIIIIIIIIIIIIII IIwwIIIIIIIIIIII IIwwIIIIIIIIIIII IIIIIIIIIIIIIIII IIwwIIwwIwwwIIII IIwwIIwwwwwwwIII IIwwIIwwwIIwwwII ' +
      'IIwwIIwwIIIIwwII IIwwIIwwIIIIwwII IIwwIIwwIIIIwwII IIwwIIwwIIIIwwII IIwwIIwwIIIIwwII IIIIIIIIIIIIIIII IIIIIIIIIIIIIIII .IIIIIIIIIIIIII.'),
    github: rows('.....kkkkkk..... ...kkkkkkkkkk... ..kkwkkkkkkwkk.. .kkkwwkkkkwwkkk. .kkkwwwwwwwwkkk. kkkwwwwwwwwwwkkk kkkwwkwwwwkwwkkk kkkwwwwwwwwwwkkk ' +
      'kkkwwwwwwwwwwkkk kkkkwwwwwwwwkkkk .kkkkkwwwwkkkkk. .kwwkkwwwwkkkkk. ..kkwwwwwwkkkk.. ...kkkwwwwkkk... .....kwwwwk..... ......kkkk......'),
    instagram: rows('.UUUUUUUUUUUUUU. VVVVVVVVVVUUUUUU VVVwwwwwwwwwwUUU VVwVVVVVVVVVVwUU XXwXXXXXXVVwVwVU XXwXXXwwwwXVVwVV XXwXXwXXXXwXXwVV YYwYYwYYXXwXXwVV ' +
      'YYwYYwYYYYwXXwXV YYwYYwYYYYwYXwXX ZZwZZZwwwwYYYwXX ZZwZZZZZZYYYYwXX ZZwZZZZZZZZYYwXX QQQwwwwwwwwwwYYX QQQQQQQQZZZZYYYX .QQQQQQQQZZZZYY.'),
    twitch: rows('...JJJJJJJJJJJJ. ..JJJJJJJJJJJJJ. .JJwwwwwwwwwwJJ. JJJwwwwwwwwwwJJ. JJJwwwJJwwJJwJJ. JJJwwwJJwwJJwJJ. JJJwwwJJwwJJwJJ. JJJwwwJJwwJJwJJ. ' +
      'JJJwwwwwwwwwwJJ. JJJwwwwwwwwwJJ.. JJJwwwwwwwwJJ... JJJJJJJJJJJJ.... JJJJJJJJJJJ..... ...JJJJ......... ...JJJ.......... ...JJ...........'),
    resume: rows('..kkkkkkkkk..... ..kwwwwwwwkk.... ..kwwwwwwwkwk... ..kwwwwwwwkkkk.. ..kwGGGGwwwwwk.. ..kwwwwwwwwwwk.. ..kwLLLLLLLLwk.. ..kwwwwwwwwwwk.. ' +
      '..kwLLLLLLwwwk.. ..kwwwwwwwwwwk.. ..kwLLLLLLLLwk.. ..kwwwwwwwwwwk.. ..kwRRRwwwwwwk.. ..kwwwwwwwwwwk.. ..kkkkkkkkkkkk.. ................'),
    arcade: rows('................ ......RRRR...... .....RRwRRR..... .....RRRRRR..... ......RRRR...... .......GG....... .......GG....... .......GG....... ' +
      '.......GG....... ...LLLLLLLLLL... ..LLLLLLLLLLLL.. .kDDyyDDDDrrDDk. .kDDyyDDDDrrDDk. .kDDDDDDDDDDDDk. ..kkkkkkkkkkkk.. ................'),
    crew: rows('.......yy....... .......kk....... ...kkkkkkkkkk... ..kLLLLLLLLLLk.. ..kLnnnnnnnnLk.. ..kLnccnnccnLk.. ..kLnccnnccnLk.. ..kLnnnnnnnnLk.. ' +
      '..kLnnccccnnLk.. ..kLnnnnnnnnLk.. ..kLLLLLLLLLLk.. ...kkkkkkkkkk... ......kGGk...... ....kkGGGGkk.... ...kGGGGGGGGk... ...kkkkkkkkkk...')
  };
  const ICON_COLORS = {
    I: '#0a66c2', U: '#5851db', V: '#833ab4', X: '#c13584', Y: '#e1306c', Z: '#f77737', Q: '#ffdc80',
    u: '#b4b1ef', v: '#c7a6dd', x: '#e3a4c8', y: '#f2a2bd', z: '#fbc2a5', q: '#ffefc6', J: '#9146ff'
  };
  const swapRows = (rows, at) => rows.map((row, y) => (at[y] !== undefined ? at[y] : row));
  const ICONS_B = {
    linkedin: () => ICONS.linkedin.map(row => row.replace(/I/g, 'b')),
    github: () => swapRows(ICONS.github, { 6: 'kkkwwwwwwwkwwkkk' }), // a wink
    instagram: () => ICONS.instagram.map((row, y) => row.replace(/[UVXYZQ]/g, (ch, x) => ([9, 10, 12].includes(x + y) ? ch.toLowerCase() : ch))),
    twitch: () => swapRows(ICONS.twitch, { 4: 'JJJwwwwwwwwwwJJ.', 5: 'JJJwwwwwwwwwwJJ.', 6: 'JJJwwwwwwwwwwJJ.' }),
    resume: () => ICONS.resume.map(row => row.replace(/L/g, 's').replace(/G/g, 'b')),
    arcade: () => swapRows(ICONS.arcade, {
      1: '.........RRRR...', 2: '........RRwRRR..', 3: '........RRRRRR..', 4: '.........RRRR...',
      5: '.........GG.....', 6: '........GG......', 7: '........GG......', 8: '.......GG.......',
      11: '.kDDooDDDDrrDDk.', 12: '.kDDooDDDDrrDDk.'
    }),
    crew: () => swapRows(ICONS.crew, { 0: '.......ll.......', 5: '..kLnnnnnnnnLk..', 8: '..kLncnnnncnLk..', 9: '..kLnnccccnnLk..' })
  };
  $$('[data-icon]').forEach(slot => {
    const name = slot.dataset.icon;
    if (!ICONS[name]) return;
    // y/z are Instagram's pinks only inside its own icon; elsewhere they stay the kit's yellows
    const pal = name === 'instagram' ? ICON_COLORS : Object.assign({}, ICON_COLORS, { y: 0, z: 0 });
    [ICONS[name], ICONS_B[name]()].forEach((rows, i) => {
      const c = slot.appendChild(doc.createElement('canvas'));
      c.width = c.height = 16;
      c.className = i ? 'f2' : 'f1';
      c.setAttribute('aria-hidden', 'true');
      paint(c.getContext('2d'), rows, 0, 0, pal);
    });
    slot.classList.add('has-art');
  });

  // ---- the scene: sky and skyline from contact.js, sized for this page
  const PHASES = {
    dawn: {
      tag: 'SUNRISE', sky: ['#29366f', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75'],
      far: '#5d4a78', near: '#3b3553', trim: '#6b5a8a', off: '#4a4366', water: ['#5b4a7a', '#b86f7c'], window: 0.18, stars: false, glow: '#ffcd75'
    },
    day: {
      tag: 'DAYTIME', sky: ['#3b8ee6', '#41a6f6', '#5cc3f8', '#73eff7', '#b9f6fb'],
      far: '#94b0c2', near: '#566c86', trim: '#b7c8d6', off: '#7d95ab', water: ['#3b7fc4', '#6fb6e8'], window: 0, stars: false, glow: null
    },
    dusk: {
      tag: 'SUNSET', sky: ['#29366f', '#3b5dc9', '#5d275d', '#b13e53', '#ef7d57'],
      far: '#4a3a6a', near: '#2b2440', trim: '#5a4a7a', off: '#3a3252', water: ['#3a2f5a', '#8a4a6a'], window: 0.45, stars: false, glow: '#ef7d57'
    },
    night: {
      tag: 'NIGHT', sky: ['#0d0f1c', '#141729', '#1a1c2c', '#222744', '#29366f'],
      far: '#262b44', near: '#1a1c2c', trim: '#333c57', off: null, water: ['#141a33', '#1f2a4f'], window: 0.62, stars: true, glow: '#ffcd75'
    }
  };
  const PHASE_ORDER = ['dawn', 'day', 'dusk', 'night'];
  function bostonHour() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      return Number(parts.find(p => p.type === 'hour').value) + Number(parts.find(p => p.type === 'minute').value) / 60;
    } catch (error) {
      return new Date().getHours();
    }
  }
  function phaseForHour(hour) {
    if (hour >= 5.5 && hour < 7.5) return 'dawn';
    if (hour >= 7.5 && hour < 17.5) return 'day';
    if (hour >= 17.5 && hour < 20) return 'dusk';
    return 'night';
  }
  function bostonTime() {
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(new Date()).replace(/\s+/g, ' ').toUpperCase();
    } catch (error) {
      return '';
    }
  }
  // deterministic pseudo-random so the skyline is the same every visit
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const NOAH = {
    idle: ['..kkk..', '.kkkkk.', 'kkkkkkk', 'kkmmmkk', 'kkkmkkk', '.mmmmm.', '.kkkkk.', '..kkk..', '.nnnnn.', 'mnnnnnm', '.nnnnn.', '.DD.DD.', '.DD.DD.', '.kk.kk.'],
    wave: ['..kkk.m', '.kkkkkm', 'kkkkkkn', 'kkmmmkn', 'kkkmkkn', '.mmmmmn', '.kkkkkn', '..kkk.n', '.nnnnnn', 'mnnnnn.', '.nnnnn.', '.DD.DD.', '.DD.DD.', '.kk.kk.'],
    wave2: ['..kkk..m', '.kkkkk.m', 'kkkkkkkn', 'kkmmmkkn', 'kkkmkkn.', '.mmmmmn.', '.kkkkkn.', '..kkk.n.', '.nnnnnn.', 'mnnnnn..', '.nnnnn..', '.DD.DD..', '.DD.DD..', '.kk.kk..']
  };
  NOAH.walk = NOAH.idle.slice(0, 11).concat(['..DDD..', '..DDD..', '..kkk..']);
  const BOAT = ['...w....', '...ww...', '...wwk..', '...wwwk.', '...wwww.', '...k....', 'RRRRRRRR', '.RRRRRR.'];
  const PLANE = ['w.......', 'wwww....', '.wwwwww.', '.wLLwwww', '..LL....'];
  // new sprites for the cues
  const COIN = [
    ['.zzz.', 'zyyyz', 'zywyz', 'zyyyz', '.zzz.'], ['..z..', '.zyz.', '.zwz.', '.zyz.', '..z..'],
    ['..z..', '..y..', '..w..', '..y..', '..z..'], ['..z..', '.zyz.', '.zwz.', '.zyz.', '..z..']
  ];
  const QBLOCK = ['kkkkkkkk', 'kwyyyyyk', 'kyyMMMyk', 'kyMyyyMk', 'kyyyyMyk', 'kyyyMyyk', 'kyyyyyyk', 'kyyyMyzk', 'kkkkkkkk'];
  const LOCK = ['.LLL.', 'L...L', 'yyyyy', 'yykyy', 'yykyy', 'yyyyy'];
  const CHECK = ['......g', '.....gg', 'g...gg.', 'gg.gg..', '.ggg...', '..g....'];
  const ROVER = [
    ['.kk.......', '.ck.......', '..k.......', '.TTTTTTTT.', 'HwHHHHHHHH', '.kLk..kLk.', '.kkk..kkk.'],
    ['.kk.......', '.ck.......', '..k.......', '.TTTTTTTT.', 'HwHHHHHHHH', '.Lkk..Lkk.', '.kkk..kkk.']
  ];
  const BOT = [
    ['..y...', '.DDD..', '.cDD..', 'wwDDD.', 'wwGDD.', '..D.D.', '..k.k.'],
    ['..y...', '.DDD..', '.cDD..', 'wwDDD.', 'wwGDD.', '...DD.', '...kk.']
  ];
  const BOT_EMPTY = BOT.map(rows => rows.map(row => row.replace(/w/g, '.')));
  const BOT_HOME = BOT_EMPTY.map(rows => rows.map(row => row.split('').reverse().join('')));
  const TOW_PLANE = ['R........', 'RR.......', 'RwwwwwwwL', '.wwwwwwwk', '...GGG...'];
  const BANNER = [
    ['LLLLLLLLLLLL.', 'LwwwwwwwwwwwL', 'LwwrrwrwwwrwL', 'LwrwwwwrwrwwL', 'LwrwwwwrwrwwL', 'LwwrrwwwrwwwL', '.LLLLLLLLLLLL'],
    ['.LLLLLLLLLLLL', 'LwwwwwwwwwwwL', 'LwwrrwrwwwrwL', 'LwrwwwwrwrwwL', 'LwrwwwwrwrwwL', 'LwwrrwwwrwwwL', 'LLLLLLLLLLLL.']
  ];
  const BENCH = ['zzzzzzzzzzzz', 'MMMMMMMMMMMM', 'zzzzzzzzzzzz', '.k........k.', '.k........k.', '.k........k.'];
  const EXT = { T: '#22c3b6', H: '#0e9a90' };
  const BOT_PAL = { D: '#c2d3e0', G: '#94b0c2' }; // light bots on the evening path
  const SUIT = Object.assign({ n: '#1d2133' }, EXT);
  const GH = ['#0e4429', '#006d32', '#26a641', '#39d353'];
  const suits = new Map();
  const suit = rows => { // a white collar and a red tie on the shirt rows
    if (!suits.has(rows)) suits.set(rows, rows.map((row, y) => (y === 8 ? `${row.slice(0, 2)}wRw${row.slice(5)}` : y === 9 ? `${row.slice(0, 3)}R${row.slice(4)}` : row)));
    return suits.get(rows);
  };
  const R = (g, color, x, y, w, h) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  const CUES = ['arcade', 'untitled', 'bros2', 'sunny', 'instagram', 'github', 'linkedin', 'twitch', 'resume', 'home'];
  // ticks to fast-forward under reduced motion, so a cue shows one still end state
  const STILL = { arcade: 2, untitled: 6, bros2: 30, sunny: 40, github: 40, home: 40 };

  function Scene(host) {
    const canvas = $('canvas', host);
    const ctx = canvas.getContext('2d');
    const bubble = $('[data-bubble]', host);
    const clockBtn = $('[data-clock]', host);
    const clockFace = $('[data-clock-face]', host);
    const clockLive = $('[data-clock-live]');
    const px = (rows, x, y, pal) => paint(ctx, rows, Math.round(x), Math.round(y), pal || EXT);
    let W = 118, H = 46, S = 28, BANK = 36, G = 43, scale = 3, f = 0.54, desk = false, chipR = 0;
    let phaseKey = phaseForHour(bostonHour()), preview = 0;
    let layer = null, windows = [], stars = [], boats = [], lamps = [], piers = [], pru = null, cit = null, bridgeTo = 80;
    const noah = { x: 47, home: 47, target: 47, waveUntil: 0, walking: false };
    let frame = 0, cue = null, owner = null, leaving = null, coins = [], tow = null, flashAt = -1e5, lastFlash = -1e5;
    let visible = false, ratio = 0, timer = 0, slow = false, lastInput = now();
    const top = () => G - 13; // Noah's head row

    function citgo(g, x, y, mode) {
      R(g, '#1a1c2c', x - 1, y, 12, 11);
      R(g, mode === 'purple' ? '#9146ff' : mode === 'lit' ? '#29366f' : '#3b5dc9', x, y + 1, 10, 9);
      g.fillStyle = mode === 'purple' ? '#d9c2ff' : mode === 'lit' ? '#ff4d4d' : '#e0433f';
      for (let r = 0; r < 6; r += 1) g.fillRect(x + 5 - Math.floor(r / 1.3), y + 2 + r, 1 + Math.floor(r * 1.4), 1);
      R(g, mode === 'day' ? '#94b0c2' : '#f4f4f4', x + 1, y + 9, 8, 1);
    }

    function buildStatic() {
      const ph = PHASES[phaseKey], near = ph.near, trim = ph.trim;
      const night = phaseKey === 'night', day = phaseKey === 'day';
      layer = layer || doc.createElement('canvas');
      layer.width = W;
      layer.height = H;
      const g = layer.getContext('2d');
      const rand = rng(1947);
      windows = [];
      // sky: dithered bands (the classic 16-color look), with in-between shades
      const bands = kit.art ? kit.art.expand(ph.sky, desk ? 3 : 2) : ph.sky;
      const bandH = S / bands.length;
      for (let y = 0; y < S; y += 1) {
        const t = y / bandH, i = Math.min(bands.length - 1, Math.floor(t)), frac = t - i;
        R(g, bands[i], 0, y, W, 1);
        g.fillStyle = bands[Math.min(bands.length - 1, i + 1)];
        for (let x = 0; frac > 0.55 && x < W; x += 1) {
          if (frac - 0.55 > [0.2, 0.6, 0.8, 0.4][(x & 1) + ((y & 1) << 1)] * 0.45) g.fillRect(x, y, 1, 1);
        }
      }
      // sun / moon on the right (the clock chip sits top-left)
      const sy0 = desk ? Math.round(S * 0.12) : 4;
      if (night) {
        const mx = Math.round(W * 0.72);
        R(g, '#f4f4f4', mx, sy0 + 1, 5, 5);
        g.fillRect(mx - 1, sy0 + 2, 7, 3);
        R(g, bands[Math.min(bands.length - 1, Math.floor((sy0 + 2) / bandH))], mx + 2, sy0, 4, 5);
      } else if (ph.glow) {
        const sx = Math.round(W * (phaseKey === 'dawn' ? 0.7 : 0.92)), sy = Math.round(S * 0.5);
        g.globalAlpha = 0.35;
        R(g, ph.glow, sx - 7, sy - 3, 15, 13);
        g.globalAlpha = 1;
        g.fillRect(sx - 3, sy, 7, 7);
        g.fillRect(sx - 4, sy + 1, 9, 5);
        R(g, '#fff6d8', sx - 1, sy + 2, 3, 3);
      } else {
        const sx = Math.round(W * 0.74);
        R(g, '#ffcd75', sx, sy0, 6, 6);
        g.fillRect(sx - 1, sy0 + 1, 8, 4);
        R(g, '#fff6d8', sx + 1, sy0 + 1, 3, 3);
      }
      if (day || phaseKey === 'dawn') {
        g.fillStyle = day ? '#f4f4f4' : '#f2c9a0';
        [[0.3, 0.42], [0.62, 0.2], [0.9, 0.34]].forEach(([fx, fy]) => {
          const cx = Math.round(W * fx), cy = Math.max(3, Math.round(S * fy));
          g.fillRect(cx, cy, 14, 2);
          g.fillRect(cx + 3, cy - 2, 7, 2);
          g.fillRect(cx - 2, cy + 1, 18, 2);
        });
      }
      // far skyline silhouette
      g.fillStyle = ph.far;
      for (let x = 0, w = 0; x < W; x += w) {
        w = 4 + Math.floor(rand() * 7);
        const h = Math.round((5 + Math.floor(rand() * 9)) * f);
        g.fillRect(x, S - h - 4, w, h + 4);
      }
      // landmarks; on phones the towers keep clear of the clock chip in the top-left corner
      const lm = { citgo: Math.round(W * 0.16), pru: Math.max(Math.round(W * 0.47), desk ? 0 : chipR) };
      lm.hancock = Math.max(Math.round(W * 0.6), lm.pru + 12);
      lm.bridge = Math.max(Math.round(W * 0.84), lm.hancock + 18);
      const building = (bx, bw, bh) => {
        R(g, near, bx, S - bh, bw, bh);
        R(g, trim, bx, S - bh, bw, 1);
        for (let yy = S - bh + 2; yy < S - 1; yy += 3) {
          for (let xx = bx + 1; xx < bx + bw - 1; xx += 2) {
            const lit = rand() < ph.window;
            windows.push({ x: xx, y: yy, lit, flicker: rand() < 0.08 });
            if (!lit && ph.off) R(g, ph.off, xx, yy, 1, 1);
          }
        }
      };
      // Back Bay rowhouses + mid-rises along the river
      for (let x = 0; x < W;) {
        const low = Object.values(lm).some(pos => Math.abs(pos - x) < 12);
        const w = 5 + Math.floor(rand() * 6);
        building(x, w, Math.round((low ? 4 + Math.floor(rand() * 3) : 6 + Math.floor(rand() * 9)) * f) + 1);
        x += w + (rand() < 0.2 ? 1 : 0);
      }
      // Prudential Tower: square shaft, crown, mast
      const pruH = Math.round(34 * f), mast = Math.round(8 * f) + 1;
      building(lm.pru, 9, pruH);
      R(g, trim, lm.pru + 1, S - pruH - 2, 7, 2);
      R(g, near, lm.pru + 4, S - pruH - 2 - mast, 1, mast);
      R(g, night || phaseKey === 'dusk' ? '#e0433f' : trim, lm.pru + 4, S - pruH - 3 - mast, 1, 1);
      pru = { x: lm.pru, top: S - pruH };
      // 200 Clarendon (Hancock): a slim glass slab that mirrors the sky
      const han = lm.hancock, hanH = Math.round(40 * f);
      for (let yy = S - hanH; yy < S; yy += 1) R(g, bands[Math.min(bands.length - 1, Math.floor(((yy - S + hanH) / hanH) * bands.length))], han, yy, 7, 1);
      R(g, day ? '#e8f7ff' : trim, han + 1, S - hanH, 1, hanH);
      R(g, near, han + 3, S - hanH - 1, 1, 1);
      R(g, day ? '#3b5dc9' : near, han + 6, S - hanH, 1, hanH);
      // the Citgo sign on its Kenmore Square building (glows after dark)
      const citH = Math.round(12 * f);
      building(lm.citgo - 2, 14, citH);
      cit = { x: lm.citgo, y: S - citH - 12 };
      citgo(g, cit.x, cit.y, day ? 'day' : 'lit');
      R(g, near, cit.x + 1, cit.y + 11, 1, 1);
      g.fillRect(cit.x + 8, cit.y + 11, 1, 1);
      // the Longfellow Bridge: deck, "salt and pepper" towers, a row of lamps
      const br = lm.bridge, span = Math.round(26 * f) + 2, towerH = Math.round(7 * f) + 2, towers = [br - 6, br + 4];
      R(g, trim, br - span, S - 2, span * 2, 2);
      towers.forEach(tx => {
        R(g, trim, tx, S - 2 - towerH, 3, towerH);
        g.fillRect(tx - 1, S - 3 - towerH, 5, 1);
        R(g, near, tx + 1, S - 5 - towerH, 1, 2);
      });
      piers = [];
      for (let a = -span + 2; a < span; a += 8) piers.push(br + a);
      lamps = [];
      for (let lx = br - span + 3; lx < Math.min(W - 1, br + span - 2); lx += 5) {
        if (towers.some(tx => lx >= tx - 2 && lx <= tx + 4)) continue;
        lamps.push(lx);
        R(g, trim, lx, S - 4, 1, 2);
        R(g, near, lx, S - 5, 1, 1);
      }
      bridgeTo = Math.max(noah.home + 12, br - span - 9);
      // Esplanade trees, the river wall, stars
      for (let tx = 3; tx < W; tx += 9 + Math.floor(rand() * 7)) {
        if (Object.values(lm).some(pos => tx > pos - 6 && tx < pos + 16) || tx > br - span - 4) continue;
        R(g, night ? '#15282a' : day ? '#257179' : '#223a36', tx, S - 5, 5, 4);
        R(g, night ? '#1f3b36' : day ? '#38b764' : '#2f4f45', tx + 1, S - 6, 3, 3);
      }
      R(g, trim, 0, S - 1, W, 1);
      stars = [];
      for (let i = 0; ph.stars && i < Math.round(W / 9); i += 1) stars.push({ x: Math.floor(rand() * W), y: Math.floor(rand() * S * 0.6), p: Math.floor(rand() * 6) });
    }

    function drawWater(ph) {
      R(ctx, ph.water[0], 0, S, W, BANK - S);
      // reflection: the skyline mirrored and broken into shimmering strips
      for (let y = S; y < BANK && S - 1 - (y - S) * 2 >= 0; y += 1) {
        ctx.globalAlpha = Math.max(0.08, 0.42 - (y - S) * (0.34 / (BANK - S)));
        ctx.drawImage(layer, 0, S - 1 - (y - S) * 2, W, 1, reduced ? 0 : Math.round(Math.sin((y + frame * 0.35) * 0.9) * 1.2), y, W, 1);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = ph.water[1];
      for (let i = 0; i < W; i += 11) {
        if ((i + frame) % 23 < 16) ctx.fillRect(Math.round((i * 7 + (reduced ? 0 : frame * 0.6)) % W), S + 2 + ((i * 13) % Math.max(1, BANK - S - 3)), 3, 1);
      }
      ctx.fillStyle = ph.near;
      piers.forEach(x => ctx.fillRect(x, S, 2, 3));
    }

    function drawBank() {
      const night = phaseKey === 'night', day = phaseKey === 'day', lh = desk ? 18 : 10;
      R(ctx, night ? '#1f2a1f' : day ? '#38b764' : '#2f4a3a', 0, BANK, W, 2);
      R(ctx, night ? '#333c57' : day ? '#94b0c2' : '#566c86', 0, BANK + 2, W, H - BANK - 2);
      ctx.fillStyle = night ? '#262b44' : day ? '#7d95ab' : '#47566f';
      for (let x = 0; x < W; x += 6) ctx.fillRect(x, BANK + 5, 3, 1);
      if (desk) { // the wide desktop path gets a second row of paving and a bench
        for (let x = 3; x < W; x += 6) ctx.fillRect(x, BANK + 12, 3, 1);
        ctx.fillRect(0, H - 2, W, 2);
        px(BENCH, W * 0.56, G - 5, night ? { z: '#6e3b1f', M: '#3b2a24' } : null);
      }
      for (let x = 30; x < W; x += 64) { // lampposts along the Cambridge path
        R(ctx, '#1a1c2c', x, G - lh, 1, lh);
        ctx.fillRect(x - 1, G - lh - 1, 3, 1);
        ctx.fillRect(x - 1, G - 1, 3, 1);
        if (day) continue;
        R(ctx, '#ffcd75', x - 1, G - lh, 3, 1);
        ctx.globalAlpha = 0.22;
        ctx.fillRect(x - 4, G - lh + 1, 9, 4);
        ctx.globalAlpha = 1;
      }
    }

    function hop() {
      if (!cue) return 0;
      if (cue.name === 'arcade') return [0, -2, -3, -3, -2, 0, 0, 0][cue.k % 8];
      const t = (cue.k % 26) - 3;
      return cue.name === 'untitled' && t >= 0 && t < 4 ? [-1, -2, -3, -1][t] : 0;
    }

    // actors behind Noah: the rover and its wire, the bots
    function drawBehind(c) {
      const nx = Math.round(noah.x);
      if (c.name === 'bros2' && c.rx != null) {
        px(ROVER[c.moving ? frame % 2 : 0], c.rx, G - 6);
        if (c.wire > 0) { // a dotted wire from Noah's hand; a packet runs along it (every wire is a real topic)
          const x0 = nx + 7, y0 = G - 4, len = Math.max(1, c.rx - 1 - x0), shown = Math.min(len, c.wire * 4);
          const yAt = i => Math.round(y0 + i / len + 8 * (i / len) * (1 - i / len));
          ctx.fillStyle = '#22c3b6';
          for (let i = 0; i <= shown; i += 2) ctx.fillRect(x0 + i, yAt(i), 1, 1);
          const p = (c.wire * 2) % (len + 4);
          if (shown >= len && p < len) R(ctx, '#ffcd75', x0 + p, yAt(p), 2, 1);
        }
      }
      if (c.name === 'sunny' && c.bots) {
        c.bots.forEach(b => px((c.out ? BOT_HOME : b.has ? BOT : BOT_EMPTY)[b.moving ? frame % 2 : 0], b.x, G - 6, phaseKey === 'day' ? EXT : BOT_PAL));
      }
    }

    // in front of Noah: the ? block and its padlock, the report stack, the check, the coins
    function drawFront(c) {
      const nx = Math.round(noah.x);
      if (c && c.name === 'untitled') {
        const cycle = c.k % 26;
        const bx = nx - 1 + (cycle >= 6 && cycle <= 10 ? [1, -1, 1, -1, 0][cycle - 6] : 0);
        const by = top() - 12 + Math.max(0, 3 - c.k) - (cycle === 5 || cycle === 6 ? 1 : 0);
        px(QBLOCK, bx, by);
        if (cycle >= 7 && cycle <= 13 && cycle % 2) px(LOCK, nx + 1, by - 7);
      }
      if (c && c.name === 'sunny' && !c.out && c.got) {
        for (let j = 0; j < c.got; j += 1) {
          R(ctx, '#f4f4f4', nx + 5, G - 7 - j, 3, 3);
          R(ctx, '#94b0c2', nx + 5, G - 6 - j, 2, 1);
        }
        if (c.checkAt) px(CHECK, nx, top() - 8 + Math.max(0, 2 - (c.k - c.checkAt)));
      }
      coins.forEach(coin => {
        ctx.globalAlpha = coin.age > 5 ? (9 - coin.age) / 4 : 1;
        px(COIN[coin.age % 4], coin.x, coin.y - coin.age);
        ctx.globalAlpha = 1;
      });
    }

    function draw() {
      if (!layer) return;
      const t = now(), c = cue, name = c ? c.name : '';
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0);
      if (name === 'twitch') citgo(ctx, cit.x, cit.y, 'purple');
      stars.forEach(star => {
        if ((frame + star.p) % 9) R(ctx, (frame + star.p) % 5 ? '#f4f4f4' : '#94b0c2', star.x, star.y, 1, 1);
      });
      ctx.fillStyle = '#ffcd75';
      windows.forEach(win => {
        if (win.lit && !(win.flicker && (frame + win.x) % 17 < 3)) ctx.fillRect(win.x, win.y, 1, 1);
      });
      if (name === 'github') { // the Prudential relights bottom-up, like a contribution grid
        for (let r = 0, y = S - 2; y > pru.top + 1 && r <= c.k; r += 1, y -= 2) {
          R(ctx, PHASES[phaseKey].near, pru.x + 1, y - 1, 7, 2);
          for (let cx = 1; cx < 9; cx += 2) R(ctx, GH[Math.floor(hash(cx, r) * 4)], pru.x + cx, y, 1, 1);
        }
      }
      if (name === 'home') { // the bridge lamps light one by one
        lamps.forEach((lx, i) => {
          if (c.k < 2 + i * 2) return;
          R(ctx, '#ffcd75', lx, S - 5, 1, 1);
          ctx.globalAlpha = 0.3;
          ctx.fillRect(lx - 1, S - 6, 3, 3);
          ctx.globalAlpha = 1;
        });
      }
      drawWater(PHASES[phaseKey]);
      boats.forEach(boat => paint(ctx, BOAT, Math.round(boat.x), Math.round(boat.y), phaseKey === 'night' ? { w: '#94b0c2', R: '#b13e53' } : null));
      drawBank();
      if (leaving) drawBehind(leaving);
      if (c) drawBehind(c);
      // pixel Noah: waves, poses for the camera, walks, or wears a blazer and tie for LinkedIn
      let rows = NOAH.idle;
      if (t < noah.waveUntil) rows = frame % 4 < 2 ? NOAH.wave : NOAH.wave2;
      else if (name === 'instagram') rows = NOAH.wave2;
      else if (noah.walking) rows = frame % 2 ? NOAH.walk : NOAH.idle;
      px(name === 'linkedin' ? suit(rows) : rows, noah.x, top() + hop(), name === 'linkedin' ? SUIT : EXT);
      drawFront(c);
      if (tow) { // a small plane tows a CV banner across the sky
        px(BANNER[frame % 2], tow.x, tow.y);
        R(ctx, '#94b0c2', tow.x + 13, tow.y + 3, 1, 1);
        ctx.fillRect(tow.x + 15, tow.y + 3, 1, 1);
        px(TOW_PLANE, tow.x + 16, tow.y + 1);
      }
      if (t - flashAt < 180) { // one soft camera flash per hover, never strobing
        ctx.globalAlpha = 0.35 * (1 - (t - flashAt) / 180);
        R(ctx, '#ffcd75', 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      placeBubble();
    }

    function stepCue(c) {
      c.k += 1;
      const nx = Math.round(noah.x);
      if (c.name === 'arcade' && c.k % 8 === 1) coins.push({ x: nx + 1, y: top() - 7, age: 0 });
      if (c.name === 'bros2') { // a rover rolls in; the wire draws once it parks
        if (c.rx == null) c.rx = W + 2;
        const tx = nx + 20;
        c.moving = c.out || c.rx !== tx;
        if (c.out) {
          c.rx += 6;
          c.wire = 0;
          if (c.rx > W + 4 && leaving === c) leaving = null;
        } else if (c.rx === tx) c.wire = (c.wire || 0) + 1;
        else c.rx = c.rx > tx ? Math.max(tx, c.rx - 4) : Math.min(tx, c.rx + 2);
      }
      if (c.name === 'sunny') { // three bots carry a report each to Noah
        if (!c.bots) {
          c.bots = [0, 1, 2].map(i => ({ x: W + 2 + i * 10, has: true }));
          c.got = 0;
        }
        c.bots.forEach((b, i) => {
          const tx = nx + 10 + i * 8;
          b.moving = c.out || b.x > tx;
          if (c.out) b.x += 4;
          else if (b.x > tx) {
            b.x = Math.max(tx, b.x - 4);
            if (b.x === tx && b.has) {
              b.has = false;
              c.got += 1;
              if (c.got === 3) c.checkAt = c.k;
            }
          }
        });
        if (c.out && leaving === c && c.bots.every(b => b.x > W + 2)) leaving = null;
      }
    }

    function step() {
      frame += 1;
      boats.forEach(boat => {
        boat.x += boat.speed * 3;
        if (boat.x > W + 10) boat.x = -10;
      });
      const d = noah.target - noah.x;
      noah.walking = d !== 0;
      noah.x += Math.sign(d) * Math.min(2, Math.abs(d));
      coins = coins.filter(coin => (coin.age += 1) < 9);
      if (tow && (tow.x += 3) > W + 2) tow = null;
      if (cue) stepCue(cue);
      if (leaving) stepCue(leaving);
    }

    // the loop: 90 ms ticks while the stage is on screen and the tab is visible,
    // about one frame a second after 45 s without input
    const busy = () => !!(cue || leaving || tow || coins.length || noah.walking || noah.x !== noah.target || now() < noah.waveUntil);
    function tick() {
      timer = 0;
      if (!visible || doc.hidden) return;
      step();
      draw();
      schedule();
    }
    function schedule() {
      if (reduced || timer || !visible || doc.hidden) return;
      slow = !busy() && now() - lastInput > 45000;
      timer = later(tick, slow ? 1000 : 90);
    }
    function halt() {
      clearTimeout(timer);
      timer = 0;
    }
    function kick() {
      halt();
      schedule();
    }

    function placeBubble() {
      if (!bubble || !bubble.classList.contains('is-on')) return;
      bubble.style.left = `${(noah.x + 3.5) * scale}px`;
      bubble.style.top = `${(top() - 2 + hop()) * scale}px`;
    }
    function wave(text) {
      noah.waveUntil = now() + 2200;
      if (text && bubble) {
        bubble.textContent = text;
        bubble.classList.remove('is-on');
        void bubble.offsetWidth;
        bubble.classList.add('is-on');
        clearTimeout(wave.t);
        wave.t = later(() => bubble.classList.remove('is-on'), 2400);
      }
      draw();
      if (reduced) {
        clearTimeout(wave.still);
        wave.still = later(draw, 2250);
      } else kick();
    }

    function endCue() {
      if (!cue) return;
      const c = cue;
      cue = owner = null;
      noah.target = noah.home;
      if (reduced) {
        coins = [];
        noah.x = noah.home;
      } else if (c.rx != null || c.bots) { // the rover and the bots leave the way they came
        c.out = true;
        leaving = c;
      }
    }
    function setCue(name, el) {
      if (CUES.indexOf(name) < 0) return wave(); // a link without its own cue still gets a wave
      if (cue && cue.name === name) {
        owner = el;
        return undefined;
      }
      endCue();
      owner = el;
      if (bubble) bubble.classList.remove('is-on');
      if (leaving && leaving.name === name && !reduced) { // it was on its way out: turn it around
        cue = leaving;
        cue.out = false;
        leaving = null;
      } else cue = { name, k: 0 };
      const t = now();
      if (!reduced) {
        if (name === 'instagram' && t - lastFlash > 1500) flashAt = lastFlash = t;
        if (name === 'resume' && !tow) tow = { x: -26, y: Math.round(S * (desk ? 0.24 : 0.4)) };
        if (name === 'home') noah.target = bridgeTo;
      }
      for (let i = 0; reduced && i < (STILL[name] || 0); i += 1) stepCue(cue);
      draw();
      kick();
      return undefined;
    }
    function unCue(el) {
      if (!cue || owner !== el) return;
      endCue();
      draw();
      kick();
    }

    function layout() {
      desk = media('(min-width: 880px)');
      scale = desk ? 4 : 3;
      W = Math.max(80, Math.ceil((host.clientWidth || 352) / scale));
      H = desk ? clamp(Math.floor((window.innerHeight - 96) / scale), 96, 150) : 46;
      S = desk ? Math.round(H * 0.6) : 28;
      BANK = desk ? Math.round(H * 0.79) : 36;
      G = H - (desk ? 7 : 3);
      f = clamp(S / 52, 0.5, 1.25);
      const face = clockBtn && !clockBtn.hidden ? clockFace : null;
      chipR = face ? Math.ceil((face.getBoundingClientRect().right - host.getBoundingClientRect().left) / scale) + 3 : 0;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W * scale}px`;
      canvas.style.height = host.style.height = `${H * scale}px`;
      noah.x = noah.home = Math.round(W * (desk ? 0.3 : 0.4));
      buildStatic();
      noah.target = cue && cue.name === 'home' && !reduced ? bridgeTo : noah.home;
      boats = desk ? [{ x: W * 0.18, y: S + 4, speed: 0.05 }, { x: W * 0.66, y: S + 13, speed: 0.035 }] : [{ x: W * 0.62, y: BANK - 8, speed: 0.04 }];
      draw();
    }

    // the clock chip: real Boston time; each tap previews the next phase, a full cycle (or Esc) returns to now
    const phaseNow = () => phaseForHour(bostonHour());
    function setPhase(key) {
      host.dataset.phase = key;
      if (key === phaseKey) return;
      phaseKey = key;
      buildStatic();
      draw();
    }
    function updateClock(announce) {
      if (!clockFace) return;
      clockFace.textContent = preview ? `PREVIEW · ${PHASES[phaseKey].tag}` : `BOSTON ${bostonTime()} · ${PHASES[phaseKey].tag}`.replace('  ', ' ');
      if (announce && clockLive) clockLive.textContent = clockFace.textContent;
    }
    if (clockBtn) {
      clockBtn.hidden = false;
      clockBtn.addEventListener('click', () => {
        preview = (preview + 1) % 4;
        setPhase(PHASE_ORDER[(PHASE_ORDER.indexOf(phaseNow()) + preview) % 4]);
        updateClock(true);
      });
      doc.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !preview) return;
        preview = 0;
        setPhase(phaseNow());
        updateClock(true);
      });
    }
    setInterval(() => {
      if (!preview) setPhase(phaseNow());
      updateClock(false);
    }, 30000);

    const sizeKey = () => `${host.clientWidth}x${media('(min-width: 880px)') ? window.innerHeight : 0}`;
    let lastSize = sizeKey();
    const relayout = () => {
      clearTimeout(relayout.t);
      relayout.t = later(() => {
        if (sizeKey() === lastSize) return;
        lastSize = sizeKey();
        layout();
      }, 120);
    };
    window.addEventListener('resize', relayout);
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(host.parentElement);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        const e = entries[entries.length - 1];
        visible = e.isIntersecting;
        ratio = e.intersectionRatio;
        if (visible) schedule();
        else halt();
      }, { threshold: [0, 0.3, 0.6, 0.8, 1] }).observe(host);
    } else {
      visible = true;
      ratio = 1;
    }
    doc.addEventListener('visibilitychange', () => (doc.hidden ? halt() : schedule()));

    host.dataset.phase = phaseKey;
    updateClock(false);
    layout();
    schedule();
    return {
      cue: setCue,
      unCue,
      wave,
      setPhase,
      poke() {
        lastInput = now();
        if (slow) kick();
      },
      get ratio() {
        return ratio;
      }
    };
  }

  const stage = $('[data-stage]');
  const scene = stage ? Scene(stage) : null;
  if (!scene) return;
  stage.__scene = scene; // for the automated checks

  // ---- cues: hover, focus or touch a link and pixel Noah reacts; the door's noun lights up in the bio
  const light = (el, on) => {
    const noun = el.dataset.noun && $(`.bio [data-noun="${el.dataset.noun}"]`);
    if (noun) noun.classList.toggle('is-lit', on);
  };
  $$('[data-cue]').forEach(el => {
    const name = el.dataset.cue;
    const st = { hover: false, focus: false, touch: false };
    const on = () => {
      light(el, true);
      scene.cue(name, el);
      if (name === 'untitled') scramble();
    };
    const off = () => {
      if (st.hover || st.focus || st.touch) return;
      light(el, false);
      scene.unCue(el);
    };
    el.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'touch') {
        st.hover = true;
        on();
      }
    });
    el.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'touch') {
        st.hover = false;
        off();
      }
    });
    el.addEventListener('pointerdown', e => { // touch: the cue plays for a moment after the tap
      if (e.pointerType !== 'touch') return;
      st.touch = true;
      clearTimeout(st.t);
      st.t = later(() => {
        st.touch = false;
        off();
      }, 2600);
      on();
    });
    el.addEventListener('focusin', () => {
      if (st.focus) return;
      st.focus = true;
      on();
    });
    el.addEventListener('focusout', e => {
      if (el.contains(e.relatedTarget)) return;
      st.focus = false;
      off();
    });
  });

  // reaching out sends a paper plane up from the control (at most 3 at once), and Noah waves
  const planes = $('[data-planes]');
  let flying = 0;
  function paperPlane(el) {
    if (reduced || !planes || flying >= 3) return;
    const r = el.getBoundingClientRect();
    const c = planes.appendChild(doc.createElement('canvas'));
    c.width = 10;
    c.height = 7;
    const g = c.getContext('2d'); // a 1px dark outline, so it reads on light and dark cards
    [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(([dx, dy]) => paint(g, PLANE, dx, dy, { w: '#1a1c2c', L: '#1a1c2c' }));
    paint(g, PLANE, 1, 1);
    c.style.left = `${Math.round(r.left + r.width / 2 - 20)}px`;
    c.style.top = `${Math.round(r.top - 8)}px`;
    if (!c.animate) return c.remove();
    flying += 1;
    const fly = c.animate([
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
      { transform: 'translate(36px, -54px) rotate(-8deg)', opacity: 1, offset: 0.25 },
      { transform: 'translate(84px, -100px) rotate(4deg)', opacity: 1, offset: 0.5 },
      { transform: 'translate(140px, -150px) rotate(-6deg)', opacity: 1, offset: 0.75 },
      { transform: 'translate(210px, -220px) rotate(-10deg)', opacity: 0 }
    ], { duration: 1200, easing: 'linear', fill: 'forwards' });
    fly.onfinish = fly.oncancel = () => {
      c.remove();
      flying -= 1;
    };
    return undefined;
  }
  $$('[data-mail]').forEach(el => el.addEventListener('click', () => {
    paperPlane(el);
    scene.wave();
  }));

  const avatar = $('[data-avatar]');
  if (avatar) {
    avatar.disabled = false;
    avatar.addEventListener('click', () => scene.wave(via ? via.hi : 'hi!'));
  }
  later(() => scene.wave(via ? via.hi : 'hi!'), 700); // arrival: Noah says hi

  // ---- attract mode, for phones that never hover: after 5 s without input, with the stage at
  // least 60% in view, play the cues of the doors on screen once, 1.6 s apart. Any input ends it.
  const doors = $$('[data-cue][data-noun]');
  let attractDone = reduced, run = null, lastInput = now();
  const onScreen = el => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0) >= r.height * 0.5;
  };
  const release = el => {
    el.classList.remove('is-attract');
    light(el, false);
    scene.unCue(el);
  };
  const onInput = () => {
    lastInput = now();
    scene.poke();
    if (!run) return;
    clearTimeout(run.t);
    if (run.el) release(run.el);
    run = null;
    attractDone = true;
  };
  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(type => window.addEventListener(type, onInput, { passive: true, capture: true }));
  const poll = setInterval(() => {
    if (attractDone) return clearInterval(poll);
    if (run || doc.hidden || now() - lastInput < 5000 || scene.ratio < 0.6) return undefined;
    const list = doors.filter(onScreen);
    if (!list.length) return undefined;
    run = { i: 0, el: null };
    const next = () => {
      if (!run) return;
      if (run.el) release(run.el);
      const el = (run.el = list[run.i++]);
      if (!el) {
        run = null;
        attractDone = true;
        return;
      }
      el.classList.add('is-attract');
      light(el, true);
      scene.cue(el.dataset.cue, el);
      if (el.dataset.cue === 'untitled') scramble();
      run.t = later(next, 1600);
    };
    next();
    return undefined;
  }, 1000);
})();
