// Password gate. All personal text lives in data/memories.enc, encrypted with
// AES-GCM; the password IS the decryption key (PBKDF2-SHA256), so nothing
// spoilable is readable in the public repo.
//
// Local development: if data/memories.json exists (it is gitignored), it is
// loaded directly and the gate is skipped.

const PW_CACHE_KEY = "sl_pw";

const b64dec = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password, salt, iterations) {
  const raw = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    raw, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}

export async function decryptBundle(bundle, password) {
  const key = await deriveKey(password, b64dec(bundle.salt), bundle.iter || 150000);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64dec(bundle.iv) }, key, b64dec(bundle.ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

async function tryFetchJSON(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Resolves with the decrypted memories object (leaves the gate visible until then). */
export async function loadMemories(audio) {
  const gate = document.getElementById("gate");

  // dev shortcut: plaintext memories.json (gitignored, never deployed)
  const dev = await tryFetchJSON("data/memories.json");
  if (dev) {
    gate.classList.add("hidden");
    return dev;
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
