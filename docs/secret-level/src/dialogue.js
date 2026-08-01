// Pokémon-style DOM dialogue box with typewriter effect.
//
// Lines can be plain strings (narration) or { who: "her"|"noah"|"cat"|string,
// text: "..." } objects. `who` picks the name-tag color; unknown speakers get
// the default dark tag.

const CPS = 45; // typewriter chars per second

export class Dialogue {
  constructor(audio, names = {}) {
    this.audio = audio;
    this.names = names; // { her, noah, cat } display names
    this.box = document.getElementById("dialogue");
    this.nameEl = document.getElementById("dlg-name");
    this.textEl = document.getElementById("dlg-text");
    this.moreEl = document.getElementById("dlg-more");
    this.pages = [];
    this.page = 0;
    this.typing = false;
    this._timer = null;
    this._resolve = null;
  }

  get open() {
    return !this.box.classList.contains("hidden");
  }

  normalize(lines) {
    return (Array.isArray(lines) ? lines : [lines]).map((l) =>
      typeof l === "string" ? { text: l } : l);
  }

  /** Show a sequence of pages; resolves when the box closes. */
  show(lines) {
    // if a dialogue is somehow already open, release its waiter first —
    // otherwise the awaiting code hangs forever (soft-lock)
    if (this._resolve) {
      const r = this._resolve;
      this._resolve = null;
      r();
    }
    clearInterval(this._timer);
    this.pages = this.normalize(lines);
    if (!this.pages.length) return Promise.resolve();
    this.page = 0;
    this.box.classList.remove("hidden");
    this.renderPage();
    return new Promise((r) => (this._resolve = r));
  }

  renderPage() {
    const p = this.pages[this.page];
    const who = p.who;
    if (who) {
      const display = this.names[who] || who;
      this.nameEl.textContent = display;
      this.nameEl.className = "";
      if (who === "her" || who === "noah" || who === "cat" || who === "dusya") {
        this.nameEl.classList.add(`who-${who}`);
      }
    } else {
      this.nameEl.classList.add("hidden");
      this.nameEl.className = "hidden";
    }
    this.moreEl.style.visibility = "hidden";
    this.textEl.textContent = "";
    this.typing = true;

    const text = p.text;
    let i = 0;
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      i++;
      this.textEl.textContent = text.slice(0, i);
      if (i % 3 === 0 && text[i - 1] !== " ") this.audio?.blip();
      if (i >= text.length) this.finishPage();
    }, 1000 / CPS);
  }

  finishPage() {
    clearInterval(this._timer);
    this.typing = false;
    this.textEl.textContent = this.pages[this.page].text;
    this.moreEl.style.visibility = "visible";
    this.moreEl.textContent = this.page < this.pages.length - 1 ? "▼" : "♥";
  }

  /** Advance (interact key). Returns true if the event was consumed. */
  advance() {
    if (!this.open) return false;
    if (this.typing) {
      this.finishPage();
      return true;
    }
    if (this.page < this.pages.length - 1) {
      this.page++;
      this.audio?.blip();
      this.renderPage();
    } else {
      this.close();
    }
    return true;
  }

  close() {
    clearInterval(this._timer);
    this.box.classList.add("hidden");
    this.audio?.close();
    const r = this._resolve;
    this._resolve = null;
    r?.();
  }
}
