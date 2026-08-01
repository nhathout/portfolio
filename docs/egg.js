// ♥ there is a secret level ♥
// ONE way in: find (and click) the tiny heart in the footer. It asks for a
// password on the other side.
(() => {
  const DEST = "./secret-level/";
  let launching = false;

  function launch() {
    if (launching) return;
    launching = true;
    const o = document.createElement("div");
    o.id = "eggWarp";
    o.style.cssText =
      "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;" +
      "justify-content:center;background:#171225;opacity:0;transition:opacity .45s ease;";
    const heart = document.createElement("span");
    heart.textContent = "♥";
    heart.style.cssText =
      "font-size:96px;color:#e8697f;transform:scale(.2);" +
      "transition:transform .55s cubic-bezier(.34,1.56,.64,1);will-change:transform;";
    o.appendChild(heart);
    document.body.appendChild(o);
    // double rAF so the initial styles are committed before transitioning
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        o.style.opacity = "1";
        heart.style.transform = "scale(1)";
      })
    );
    setTimeout(() => location.assign(DEST), 750);
  }

  // --- the tiny heart -----------------------------------------------------
  const slot = document.getElementById("eggHeart");
  if (slot) {
    slot.innerHTML =
      '<svg width="14" height="13" viewBox="0 0 7 6" style="image-rendering:pixelated;display:block;pointer-events:none;" aria-hidden="true">' +
      '<path fill="currentColor" d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z"/></svg>';
    slot.style.cssText =
      "display:inline-flex;align-items:center;cursor:pointer;color:#9ca3af;opacity:.5;" +
      "transition:all .25s ease;padding:6px;border:none;background:none;";
    slot.title = "?";
    slot.addEventListener("mouseenter", () => {
      slot.style.color = "#e8697f";
      slot.style.opacity = "1";
      slot.style.transform = "scale(1.35)";
    });
    slot.addEventListener("mouseleave", () => {
      slot.style.color = "#9ca3af";
      slot.style.opacity = ".5";
      slot.style.transform = "scale(1)";
    });
    // capture-phase + preventDefault/stopPropagation so no parent link,
    // download attribute, or site script can hijack the click
    slot.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        launch();
      },
      true
    );
    // a heartbeat every so often, for the observant
    setInterval(() => {
      slot.style.transform = "scale(1.3)";
      setTimeout(() => (slot.style.transform = "scale(1)"), 180);
    }, 12000);
  }
})();
