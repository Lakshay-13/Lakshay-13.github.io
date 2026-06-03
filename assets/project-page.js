(() => {
  const root = document.documentElement;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  function ensureHalo() {
    if (document.querySelector(".page-cursor-halo")) return;
    const halo = document.createElement("div");
    halo.className = "page-cursor-halo";
    halo.setAttribute("aria-hidden", "true");
    document.body.prepend(halo);
  }

  function setHaloPosition() {
    root.style.setProperty("--page-cursor-x", `${x}px`);
    root.style.setProperty("--page-cursor-y", `${y}px`);
  }

  window.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
    setHaloPosition();
  }, { passive: true });

  window.addEventListener("scroll", setHaloPosition, { passive: true });
  window.addEventListener("resize", () => {
    x = Math.min(x, window.innerWidth);
    y = Math.min(y, window.innerHeight);
    setHaloPosition();
  }, { passive: true });

  ensureHalo();
  setHaloPosition();
})();
