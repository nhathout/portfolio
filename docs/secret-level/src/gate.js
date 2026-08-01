// Password gate. All personal text lives in data/memories.enc, encrypted with
// AES-GCM; the password IS the decryption key (PBKDF2-SHA256), so nothing
// spoilable is readable in the public repo.
//
// Local development: if data/memories.json exists (it is gitignored), it is
// loaded directly and the gate is skipped.

const PW_CACHE_KEY = "sl_pw";

// set when loadMemories() took the plaintext path — watchMemories() is a no-op
// otherwise, so nothing polls on the deployed (encrypted) site.
let devText = null;

const b64dec = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password, salt, iterations, usages = ["decrypt"]) {
  const raw = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    raw, { name: "AES-GCM", length: 256 }, false, usages);
}

/**
 * v1 bundles derive the content key straight from the password.
 * v2 bundles encrypt the content once with a random data key and wrap that key
 * once per accepted password, so several passwords can open the same file
 * without any of them being recoverable from the public repo.
 */
export async function decryptBundle(bundle, password) {
  const iter = bundle.iter || 150000;
  let key;
  if ((bundle.v || 1) >= 2) {
    let dataKey = null;
    for (const slot of bundle.keys || []) {
      try {
        const wrap = await deriveKey(password, b64dec(slot.salt), iter);
        dataKey = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: b64dec(slot.iv) }, wrap, b64dec(slot.ct));
        break;
      } catch { /* not this slot — try the next password's */ }
    }
    if (!dataKey) throw new Error("no key slot for that password");
    key = await crypto.subtle.importKey("raw", dataKey, "AES-GCM", false, ["decrypt"]);
  } else {
    key = await deriveKey(password, b64dec(bundle.salt), iter);
  }
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64dec(bundle.iv) }, key, b64dec(bundle.ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

async function tryFetchText(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function tryFetchJSON(url) {
  const text = await tryFetchText(url);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Dev-only live reload: poll data/memories.json and, when it changes on disk,
 * swap the new text into the SAME `memories` object the game is holding.
 * Everything (points, npcs, pets, party, credits) is read lazily at interact
 * time, so edits show up on the next E press — no page refresh, no lost save.
 *
 * No-op unless loadMemories() actually took the plaintext path.
 * `onUpdate(memories, err)` fires on every successful swap, and once with an
 * `err` when the file stops parsing (so the game can say so on screen).
 */
export function watchMemories(memories, onUpdate, intervalMs = 900) {
  if (devText === null) return () => {};
  let badShown = false;
  const timer = setInterval(async () => {
    const text = await tryFetchText("data/memories.json");
    if (text === null || text === devText) return;
    let next;
    try {
      next = JSON.parse(text);
    } catch (e) {
      // half-written file, or a real typo — say it once, keep the old content
      // live, and keep polling so the fix picks itself up.
      if (!badShown) {
        badShown = true;
        console.warn("[secret-level] memories.json didn't parse:", e.message);
        onUpdate?.(memories, e);
      }
      return;
    }
    devText = text;
    badShown = false;
    // mutate in place — main.js/world.js closed over this exact object
    for (const key of Object.keys(memories)) delete memories[key];
    Object.assign(memories, next);
    console.info("[secret-level] memories.json reloaded ♥");
    onUpdate?.(memories, null);
  }, intervalMs);
  return () => clearInterval(timer);
}

/** Resolves with the decrypted memories object (leaves the gate visible until then). */
export async function loadMemories(audio) {
  const gate = document.getElementById("gate");
  // `?gate` forces the real password screen even on your machine, where the
  // plaintext memories.json would normally skip it. Use it to check what she
  // will actually see.
  const forceGate = new URLSearchParams(location.search).has("gate");
  if (forceGate) localStorage.removeItem(PW_CACHE_KEY);

  // dev shortcut: plaintext memories.json (gitignored, never deployed)
  if (!forceGate) {
    const text = await tryFetchText("data/memories.json");
    let dev = null;
    try { dev = text === null ? null : JSON.parse(text); } catch { dev = null; }
    if (dev) {
      devText = text;
      gate.classList.add("hidden");
      // say so, loudly enough to stop anyone wondering where the password went
      document.getElementById("devbadge")?.classList.remove("hidden");
      console.info(
        "[secret-level] dev mode: loaded plaintext data/memories.json, so the "
        + "password gate was skipped. Add ?gate to the URL to see it.");
      return dev;
    }
    if (text !== null) {
      console.warn(
        "[secret-level] data/memories.json is present but isn't valid JSON — "
        + "falling back to the encrypted bundle. (trailing comma? smart quote?)");
    }
  }

  const bundle = await tryFetchJSON("data/memories.enc");
  if (!bundle) {
    document.getElementById("gate-msg").textContent =
      "couldn't load the level data — is data/memories.enc deployed?";
    document.getElementById("gate-msg").classList.add("err");
    return new Promise(() => {}); // dead end, stay on gate
  }

  // remembered password from an earlier visit?
  const cached = localStorage.getItem(PW_CACHE_KEY);
  if (cached) {
    try {
      const mem = await decryptBundle(bundle, cached);
      gate.classList.add("hidden");
      return mem;
    } catch {
      localStorage.removeItem(PW_CACHE_KEY);
    }
  }

  // interactive unlock
  return new Promise((resolve) => {
    const form = document.getElementById("gate-form");
    const input = document.getElementById("gate-input");
    const msg = document.getElementById("gate-msg");
    let fails = 0;
    input.focus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pw = input.value.trim();
      if (!pw) return;
      msg.classList.remove("err");
      msg.textContent = "…";
      try {
        const mem = await decryptBundle(bundle, pw);
        localStorage.setItem(PW_CACHE_KEY, pw);
        audio?.confirm();
        gate.classList.add("hidden");
        resolve(mem);
      } catch {
        fails++;
        audio?.denied();
        msg.classList.add("err");
        msg.textContent = fails >= 3 && bundle.hint
          ? `hint: ${bundle.hint}`
          : "hmm, that's not it…";
        gate.classList.add("shake");
        setTimeout(() => gate.classList.remove("shake"), 450);
        input.select();
      }
    });
  });
}
