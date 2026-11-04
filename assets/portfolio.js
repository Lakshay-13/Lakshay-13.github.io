(() => {
  const portal = document.getElementById("portalEntry");
  const site = document.getElementById("siteShell");
  const homeLink = document.querySelector(".logo");
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const sections = navLinks.map((link) => document.getElementById(link.hash.slice(1)));
  const panels = [...document.querySelectorAll(".project-panel")];
  const projectLinks = [...document.querySelectorAll(".project-constellation a, .project-directory a")];
  const featuredProject = panels[0];
  const selectedStar = document.querySelector(".project-current");
  const selectedStarLink = selectedStar.querySelector("a");
  const selectedStarName = selectedStar.querySelector(".project-index-name");
  const mobile = window.matchMedia("(max-width: 720px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let selectedProject = featuredProject;

  function updateNav() {
    let active = null;
    if (!document.body.classList.contains("portal-active")) {
      const marker = window.innerHeight * 0.34;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) active = section;
      }
    }

    navLinks.forEach((link, index) => {
      if (sections[index] === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function selectProject(project) {
    selectedProject = project;
    for (const panel of panels) {
      panel.hidden = panel !== project && !(mobile.matches && panel.classList.contains("project-featured"));
      panel.classList.toggle("is-selected", panel === project);
    }

    const hash = "#" + project.id;
    const isFeatured = project.classList.contains("project-featured");
    selectedStar.hidden = isFeatured;
    if (!isFeatured) {
      selectedStarLink.href = hash;
      selectedStarName.textContent = project.querySelector("h3").textContent;
    }

    for (const link of projectLinks) {
      const active = link.hash === hash && (link !== selectedStarLink || !isFeatured);
      if (active) {
        link.setAttribute("aria-current", "location");
        const group = link.closest(".directory-group");
        if (group) group.open = true;
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function showRoute({ fromConstellation = false, focus = false } = {}) {
    const hash = window.location.hash;
    const destination = document.getElementById(hash.slice(1));
    const project = destination?.classList.contains("project-panel") ? destination : null;
    const showPortal = !hash;

    document.body.classList.toggle("portal-active", showPortal);
    portal.inert = !showPortal;
    site.inert = showPortal;
    syncOrbitMotion();

    if (showPortal) {
      window.scrollTo({ top: 0, behavior: "instant" });
      if (focus) portal.querySelector(".portal-core").focus({ preventScroll: true });
    } else {
      selectProject(project || featuredProject);
      const target = project && !mobile.matches ? document.getElementById("projects") : (destination || document.getElementById("top"));
      if (!fromConstellation || mobile.matches) {
        target.scrollIntoView({ block: "start", behavior: "instant" });
        if (focus) (project || target).focus({ preventScroll: true });
      }
    }
    updateNav();
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link !== homeLink && !link.getAttribute("href")?.startsWith("#")) return;

    event.preventDefault();
    const hash = link === homeLink ? "" : link.hash;
    if (hash !== window.location.hash) {
      history.pushState(null, "", window.location.pathname + window.location.search + hash);
    }
    showRoute({ fromConstellation: Boolean(link.closest(".project-constellation")), focus: true });
  });

  const orbitItems = [...portal.querySelectorAll(".orbit-pill")].map((pill) => ({
    pill,
    orbit: pill.closest(".orbit"),
    phase: Number(pill.dataset.phase) * Math.PI / 180
  }));
  const motionButton = portal.querySelector(".orbit-motion");
  let rotation = 0;
  let orbitFrame = null;
  let previousFrame = null;
  let manuallyPaused = false;
  let hoveredBubble = null;

  function drawOrbit() {
    for (const { pill, phase, rotate, rx, ry } of orbitItems) {
      // Place each bubble where its evenly spaced angle intersects its own ellipse.
      const angle = phase + rotation - rotate;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      const radius = 1 / Math.hypot(x / rx, y / ry);
      pill.style.transform = "translate3d(" + x * radius + "px, " + y * radius + "px, 0) rotate(" + -rotate + "rad)";
    }
  }

  function readOrbit() {
    for (const item of orbitItems) {
      item.rotate = Number(item.orbit.dataset.rotate) * Math.PI / 180;
      item.rx = item.orbit.offsetWidth / 2;
      item.ry = item.orbit.offsetHeight / 2;
    }
    drawOrbit();
  }

  function animateOrbit(timestamp) {
    if (previousFrame !== null) {
      rotation = (rotation + Math.min(timestamp - previousFrame, 32) * Math.PI * 2 / 38000) % (Math.PI * 2);
    }
    previousFrame = timestamp;
    drawOrbit();
    orbitFrame = requestAnimationFrame(animateOrbit);
  }

  function syncOrbitMotion() {
    const shouldAnimate = document.body.classList.contains("portal-active") &&
      !reducedMotion.matches && !manuallyPaused && !hoveredBubble && !document.activeElement?.matches(".orbit-pill:focus-visible");
    if (shouldAnimate && orbitFrame === null) {
      orbitFrame = requestAnimationFrame(animateOrbit);
    } else if (!shouldAnimate && orbitFrame !== null) {
      cancelAnimationFrame(orbitFrame);
      orbitFrame = null;
      previousFrame = null;
    }
  }

  for (const { pill } of orbitItems) {
    pill.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      hoveredBubble = pill;
      syncOrbitMotion();
    });
    pill.addEventListener("pointerleave", () => {
      if (hoveredBubble === pill) hoveredBubble = null;
      syncOrbitMotion();
    });
    pill.addEventListener("focus", syncOrbitMotion);
    pill.addEventListener("blur", () => requestAnimationFrame(syncOrbitMotion));
  }

  motionButton.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    motionButton.setAttribute("aria-pressed", String(manuallyPaused));
    motionButton.title = manuallyPaused ? "Resume orbit" : "Pause orbit";
    syncOrbitMotion();
  });

  function syncMotionPreference() {
    motionButton.hidden = reducedMotion.matches;
    syncOrbitMotion();
  }

  function seedStars() {
    const field = portal.querySelector(".star-field");
    const stars = document.createDocumentFragment();
    const colors = ["#d1ffee", "#eef6ff", "#b9a7ff"];
    for (let i = 0; i < 95; i += 1) {
      const star = document.createElement("span");
      star.className = "portal-star";
      star.style.setProperty("--star-x", Math.random() * 100 + "%");
      star.style.setProperty("--star-y", Math.random() * 100 + "%");
      star.style.setProperty("--star-size", 0.8 + Math.random() * 2 + "px");
      star.style.setProperty("--star-opacity", 0.14 + Math.random() * 0.55);
      star.style.setProperty("--star-color", colors[i % colors.length]);
      stars.appendChild(star);
    }
    field.appendChild(stars);
  }

  const stats = {
    fren: { endpoint: "https://www.nextgenaischool.in/api/fren/stats", fields: ["totalServers"], fallback: "Fren" },
    notifyme: { endpoint: "https://www.nextgenaischool.in/api/notifyme/usage", fields: ["totalSent"], fallback: "NotifyMe" },
    url: { endpoint: "https://url.nextgenaischool.in/stats", fields: ["total_unique_media"], fallback: "URL Extractor" },
    artgridx: { endpoint: "https://artgridx.nextgenaischool.in/api/stats", fields: ["profilesHosted", "portfoliosHosted"], fallback: "ArtGridX" }
  };
  const exactNumber = new Intl.NumberFormat("en-US");
  const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  let statsFallback;

  async function fetchStat(url) {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout?.(6000) });
    if (!response.ok) throw new Error("Stats HTTP " + response.status);
    return response;
  }

  function readStatNumber(value) {
    if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
    const count = Number(String(value).replaceAll(",", ""));
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
  }

  async function loadStat(pill) {
    const { endpoint, fields, fallback } = stats[pill.dataset.stat];
    let count = null;
    try {
      const payload = await (await fetchStat(endpoint)).json();
      const source = payload?.data ?? payload;
      count = fields.map((field) => readStatNumber(source?.[field])).find((value) => value !== null) ?? null;
    } catch {
      // The shared public snapshot also covers providers with restricted CORS.
    }

    if (count === null) {
      try {
        statsFallback ||= fetchStat("https://www.nextgenaischool.in/api/portfolio/full-stats.svg").then((response) => response.text());
        const svg = await statsFallback;
        const value = svg.match(new RegExp(fallback + ":\\s*([\\d,]+)"))?.[1];
        count = readStatNumber(value);
      } catch {
        // Keep the unavailable mark and leave the link usable.
      }
    }

    if (count === null) return;
    const full = exactNumber.format(count);
    pill.querySelector(".orbit-count").textContent = count < 100000 ? full : compactNumber.format(count);
    const label = pill.dataset.name + ", " + pill.dataset.metric + ": " + full;
    pill.setAttribute("aria-label", label);
    pill.title = label;
  }

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.body.classList.add("portal-ready");
  seedStars();
  readOrbit();
  syncMotionPreference();
  showRoute();

  window.addEventListener("hashchange", () => showRoute({ focus: true }));
  window.addEventListener("resize", readOrbit, { passive: true });
  window.addEventListener("scroll", updateNav, { passive: true });
  mobile.addEventListener("change", () => selectProject(selectedProject));
  reducedMotion.addEventListener("change", syncMotionPreference);

  for (const pill of portal.querySelectorAll("[data-stat]")) loadStat(pill);
})();
