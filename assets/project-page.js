(() => {
  const root = document.documentElement;
  const layer = document.createElement("div");
  const starLimit = 120;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let starTimer = null;

  layer.className = "page-cursor-field";
  layer.setAttribute("aria-hidden", "true");
  document.body.prepend(layer);

  function getAccentColors() {
    const style = getComputedStyle(document.body);
    return [
      "rgba(255, 255, 255, 0.92)",
      "color-mix(in srgb, " + style.getPropertyValue("--accent").trim() + " 82%, transparent)",
      "color-mix(in srgb, " + style.getPropertyValue("--accent-2").trim() + " 72%, transparent)"
    ];
  }

  function setPointerPosition(nextX, nextY) {
    x = nextX;
    y = nextY;
    root.style.setProperty("--page-cursor-x", `${x}px`);
    root.style.setProperty("--page-cursor-y", `${y}px`);
  }

  function spawnStars(count) {
    const colors = getAccentColors();
    const existing = layer.childElementCount;
    for (let i = 0; i < count && existing + i < starLimit; i += 1) {
      const star = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const spread = 9 + Math.random() * 30;
      const drift = 12 + Math.random() * 34;
      const size = Math.random() > 0.84 ? 1.8 + Math.random() * 1.2 : 0.8 + Math.random() * 1.1;
      const color = colors[Math.floor(Math.random() * colors.length)];

      star.className = "page-cursor-star";
      star.style.setProperty("--star-x", `${(x + Math.cos(angle) * spread).toFixed(1)}px`);
      star.style.setProperty("--star-y", `${(y + Math.sin(angle) * spread).toFixed(1)}px`);
      star.style.setProperty("--star-dx", `${(Math.cos(angle) * drift).toFixed(1)}px`);
      star.style.setProperty("--star-dy", `${(Math.sin(angle) * drift).toFixed(1)}px`);
      star.style.setProperty("--star-size", `${size.toFixed(2)}px`);
      star.style.setProperty("--star-glow", `${(5 + Math.random() * 12).toFixed(1)}px`);
      star.style.setProperty("--star-life", `${(760 + Math.random() * 560).toFixed(0)}ms`);
      star.style.setProperty("--star-opacity", `${(0.56 + Math.random() * 0.44).toFixed(2)}`);
      star.style.setProperty("--star-color", color);
      layer.appendChild(star);
      window.setTimeout(() => {
        star.remove();
      }, 1500);
    }
  }

  function startStars() {
    if (starTimer) return;
    starTimer = window.setInterval(() => {
      spawnStars(2);
    }, 130);
  }

  function stopStars() {
    clearInterval(starTimer);
    starTimer = null;
  }

  window.addEventListener("pointermove", (event) => {
    setPointerPosition(event.clientX, event.clientY);
    startStars();
    spawnStars(event.buttons ? 6 : 3);
  }, { passive: true });

  window.addEventListener("pointerenter", (event) => {
    setPointerPosition(event.clientX, event.clientY);
    startStars();
    spawnStars(16);
  }, { passive: true });

  window.addEventListener("pointerleave", stopStars, { passive: true });

  window.addEventListener("resize", () => {
    setPointerPosition(Math.min(x, window.innerWidth), Math.min(y, window.innerHeight));
  }, { passive: true });

  setPointerPosition(x, y);
})();
