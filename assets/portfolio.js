(() => {
  const portal = document.getElementById("portalEntry");
  const site = document.getElementById("siteShell");
  const homeLink = document.querySelector(".logo");
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const menuToggle = document.querySelector(".menu-toggle");
  const sections = navLinks.map((link) => document.getElementById(link.hash.slice(1)));
  const panels = [...document.querySelectorAll(".project-panel")];
  const carousel = document.querySelector(".project-carousel");
  const track = carousel.querySelector(".project-track");
  const carouselItems = [...track.children];
  const projectLinks = carouselItems.map((item) => item.querySelector("a"));
  const featuredProject = panels[0];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let carouselAnimation;

  function carouselSlots() {
    return Number(getComputedStyle(carousel).getPropertyValue("--slots"));
  }

  function syncCarouselLinks() {
    const slots = carouselSlots();
    [...track.children].forEach((item, index) => {
      item.inert = index >= slots;
    });
  }

  function alignCarousel(project) {
    const item = projectLinks.find((link) => link.hash === "#" + project.id).parentElement;
    if ([...track.children].indexOf(item) >= carouselSlots()) {
      const index = carouselItems.indexOf(item);
      track.append(...carouselItems.slice(index), ...carouselItems.slice(0, index));
    }
    syncCarouselLinks();
  }

  async function stepCarousel(direction) {
    if (carouselAnimation) return;
    const items = [...track.children];
    const count = carouselSlots() > 4 ? 3 : 2;
    const step = items[count].offsetLeft - items[0].offsetLeft;
    if (direction < 0) track.prepend(...items.slice(-count));

    if (!reducedMotion.matches) {
      const offsets = direction < 0 ? [-step, 0] : [0, -step];
      carouselAnimation = track.animate(
        offsets.map((x) => ({ transform: "translateX(" + x + "px)" })),
        { duration: 320, easing: "cubic-bezier(.22,.7,.25,1)" }
      );
      await carouselAnimation.finished;
      carouselAnimation = null;
    }

    if (direction > 0) track.append(...items.slice(0, count));
    syncCarouselLinks();
  }

  carousel.querySelectorAll("[data-project-step]").forEach((button) => {
    button.addEventListener("click", () => stepCarousel(Number(button.dataset.projectStep)));
  });

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  }

  menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });

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

  function selectProject(project, animate) {
    const alreadySelected = project.classList.contains("is-selected");
    for (const panel of panels) {
      panel.hidden = panel !== project;
      panel.classList.toggle("is-selected", panel === project);
    }
    for (const link of projectLinks) {
      if (link.hash === "#" + project.id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    if (animate && !alreadySelected && !reducedMotion.matches) {
      project.animate(
        [{ opacity: 0.2, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 380, easing: "cubic-bezier(.22,.7,.25,1)" }
      );
    }
  }

  function showRoute({ fromCarousel = false, focus = false } = {}) {
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
      selectProject(project || featuredProject, focus);
      if (!fromCarousel) {
        alignCarousel(project || featuredProject);
        const target = project ? document.getElementById("projects") : (destination || document.getElementById("top"));
        target.scrollIntoView({ block: "start", behavior: "instant" });
        if (focus) target.focus({ preventScroll: true });
      } else if (project && focus) {
        project.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "instant" : "smooth" });
        project.focus({ preventScroll: true });
      }
    }
    updateNav();
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.closest(".nav-links")) setMenu(false);
    if (link !== homeLink && !link.getAttribute("href")?.startsWith("#")) return;

    event.preventDefault();
    const hash = link === homeLink ? "" : link.hash;
    if (hash !== window.location.hash) {
      history.pushState(null, "", window.location.pathname + window.location.search + hash);
    }
    showRoute({ fromCarousel: Boolean(link.closest(".project-carousel")), focus: true });
  });

  const orbitItems = [...portal.querySelectorAll(".orbit-pill")].map((pill) => ({
    pill,
    orbit: pill.closest(".orbit"),
    phase: Number(pill.dataset.phase) * Math.PI / 180
  }));
  let rotation = 0;
  let orbitFrame = null;
  let previousFrame = null;
  let hoveredBubble = null;

  function drawOrbit() {
    for (const { pill, phase, rotate, rx, ry } of orbitItems) {
      // Place each bubble where its evenly spaced angle intersects its own ellipse.
      const angle = phase + rotation;
      const axisAngle = angle - rotate;
      const radius = 1 / Math.hypot(Math.cos(axisAngle) / rx, Math.sin(axisAngle) / ry);
      pill.style.transform = "translate3d(" + Math.cos(angle) * radius + "px, " + Math.sin(angle) * radius + "px, 0)";
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
      !reducedMotion.matches && !hoveredBubble && !document.activeElement?.matches(".orbit-pill:focus-visible");
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

  function seedStars(field, count) {
    const stars = document.createDocumentFragment();
    const colors = ["#d1ffee", "#f5f9ff", "#cbbdff"];
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement("span");
      const size = 0.9 + Math.random() * 2.2;
      const duration = 3 + Math.random() * 4;
      function placeStar() {
        star.style.setProperty("--star-x", Math.random() * 100 + "%");
        star.style.setProperty("--star-y", Math.random() * 100 + "%");
      }

      star.className = "portal-star";
      placeStar();
      star.style.setProperty("--star-size", size + "px");
      star.style.setProperty("--star-opacity", 0.42 + Math.random() * 0.56);
      star.style.setProperty("--star-glow", size >= 2.3 ? "3px" : "0px");
      star.style.setProperty("--star-duration", duration + "s");
      star.style.setProperty("--star-delay", -Math.random() * duration + "s");
      star.style.setProperty("--star-color", colors[i % colors.length]);
      star.addEventListener("animationiteration", placeStar);
      stars.appendChild(star);
    }
    field.appendChild(stars);
  }

  function setupCursorTrail() {
    const layer = document.querySelector(".cursor-stars");
    const colors = ["#edf5ff", "#c5f5de", "#cbbaff"];
    let lastBurst = -Infinity;

    window.addEventListener("pointermove", (event) => {
      if (reducedMotion.matches || event.pointerType === "touch" || event.timeStamp - lastBurst < 26) return;
      lastBurst = event.timeStamp;

      for (let index = 0; index < 2 && layer.childElementCount < 84; index += 1) {
        const star = document.createElement("span");
        const angle = Math.random() * Math.PI * 2;
        const spread = 9 + Math.random() * 21;
        const drift = 12 + Math.random() * 28;
        const size = Math.random() > 0.84 ? 1.8 + Math.random() * 0.9 : 0.8 + Math.random() * 1.1;
        star.className = "cursor-star";
        star.style.setProperty("--x", event.clientX + Math.cos(angle) * spread + "px");
        star.style.setProperty("--y", event.clientY + Math.sin(angle) * spread + "px");
        star.style.setProperty("--dx", Math.cos(angle) * drift + "px");
        star.style.setProperty("--dy", Math.sin(angle) * drift + "px");
        star.style.setProperty("--color", colors[Math.floor(Math.random() * colors.length)]);
        star.style.setProperty("--size", size + "px");
        star.style.setProperty("--opacity", 0.5 + Math.random() * 0.24);
        star.style.setProperty("--life", 760 + Math.random() * 560 + "ms");
        star.addEventListener("animationend", () => star.remove(), { once: true });
        layer.append(star);
      }
    }, { passive: true });

    reducedMotion.addEventListener("change", () => layer.replaceChildren());
  }

  function setupSkills() {
    const constellation = document.querySelector(".skill-constellation");
    const stars = constellation.querySelector(".skill-stars");
    const marks = [...stars.children];
    const descriptions = [...constellation.querySelectorAll(".skill-descriptions article")];
    const keys = descriptions.map((description) => description.dataset.skill);

    for (let i = keys.length - 1; i > 0; i -= 1) {
      const other = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[other]] = [keys[other], keys[i]];
    }

    // Interleave the shuffled groups so marks that light together are separated.
    const groups = keys.map((key) => marks.filter((mark) => mark.dataset.skill === key));
    const maxMarks = Math.max(...groups.map((group) => group.length));
    for (let index = 0; index < maxMarks; index += 1) {
      const offset = (index * 2) % groups.length;
      const row = [...groups.slice(offset), ...groups.slice(0, offset)];
      stars.append(...row.map((group) => group[index]).filter(Boolean));
    }

    const targets = [...descriptions, ...marks.filter((mark) => mark.matches("button"))];
    let selected = descriptions[0].dataset.skill;
    function highlight(key) {
      for (const target of targets) {
        target.classList.toggle("is-highlighted", target.dataset.skill === key);
        const button = target.matches("button") ? target : target.querySelector("button");
        button.setAttribute("aria-pressed", String(target.dataset.skill === selected));
      }
    }

    for (const target of targets) {
      const key = target.dataset.skill;
      target.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") highlight(key);
      });
      target.addEventListener("focusin", () => highlight(key));
      target.addEventListener("click", () => {
        selected = key;
        highlight(selected);
      });
    }
    constellation.addEventListener("pointerleave", () => highlight(selected));
    constellation.addEventListener("focusout", (event) => {
      if (!constellation.contains(event.relatedTarget)) highlight(selected);
    });
    highlight(selected);
  }

  function setupExperienceReveals() {
    if (!("IntersectionObserver" in window)) return;
    document.getElementById("experience").classList.add("has-reveals");

    const observer = new IntersectionObserver((entries) => {
      for (const { intersectionRatio, target } of entries) {
        target.classList.toggle("is-visible", intersectionRatio >= 0.16);
      }
    }, { threshold: 0.16 });
    document.querySelectorAll("[data-reveal]").forEach((row) => observer.observe(row));
  }

  function setupExperienceComet() {
    const track = document.querySelector(".experience-track");
    const comet = track.querySelector(".experience-comet");
    const periods = [...track.querySelectorAll(".timeline-period")];
    const earlier = track.querySelector(".earlier-roles");
    let frame = null;
    let previousTime = null;
    let position = null;
    let activePeriod = null;
    let anchors = [];

    function updateAnchors() {
      anchors = periods
        .filter((period) => earlier.open || !earlier.contains(period))
        .map((period) => ({
          period,
          center: period.closest(".timeline-entry").offsetTop + period.offsetTop + period.offsetHeight / 2
        }));
      queueDraw();
    }

    function draw(time) {
      frame = null;
      const { top, bottom } = track.getBoundingClientRect();
      if (!anchors.length || reducedMotion.matches || bottom <= 0 || top >= window.innerHeight || document.body.classList.contains("portal-active")) {
        previousTime = position = null;
        comet.hidden = true;
        activePeriod?.classList.remove("is-current-period");
        activePeriod = null;
        return;
      }

      const marker = window.innerHeight * 0.52 - top;
      const target = Math.max(anchors[0].center, Math.min(marker, anchors.at(-1).center));
      const gap = target - (position ?? target);
      const elapsed = previousTime === null ? 16 : Math.min(48, time - previousTime);
      previousTime = time;
      position = Math.abs(gap) < 0.2 ? target : position + gap * (1 - Math.exp(-elapsed / 100));
      comet.style.setProperty("--comet-y", position.toFixed(2) + "px");
      comet.hidden = false;

      const nearest = anchors.reduce((best, next) => (
        Math.abs(next.center - position) < Math.abs(best.center - position) ? next : best
      )).period;
      if (activePeriod !== nearest) {
        activePeriod?.classList.remove("is-current-period");
        nearest.classList.add("is-current-period");
        activePeriod = nearest;
      }

      if (position !== target) queueDraw();
      else previousTime = null;
    }

    function queueDraw() {
      if (frame === null) frame = requestAnimationFrame(draw);
    }

    window.addEventListener("scroll", queueDraw, { passive: true });
    window.addEventListener("resize", updateAnchors, { passive: true });
    window.addEventListener("hashchange", queueDraw);
    earlier.addEventListener("toggle", updateAnchors);
    reducedMotion.addEventListener("change", queueDraw);
    if ("ResizeObserver" in window) new ResizeObserver(updateAnchors).observe(track);
    document.fonts?.ready.then(updateAnchors);
    updateAnchors();
  }

  function setupEarlierExperience() {
    const details = document.querySelector(".earlier-roles");
    const summary = details.querySelector("summary");
    const collapse = details.querySelector(".earlier-collapse");
    details.classList.add("has-end-control");
    collapse.hidden = false;
    details.addEventListener("toggle", () => {
      if (details.open) details.querySelector(".timeline-entry").focus({ preventScroll: true });
    });
    collapse.addEventListener("click", () => {
      details.open = false;
      summary.focus();
    });
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
  seedStars(portal.querySelector(".star-field"), 112);
  seedStars(site.querySelector(".star-field"), 72);
  setupCursorTrail();
  setupSkills();
  setupExperienceReveals();
  setupEarlierExperience();
  setupExperienceComet();
  syncCarouselLinks();
  readOrbit();
  showRoute();

  window.addEventListener("hashchange", () => showRoute({ focus: true }));
  window.addEventListener("resize", () => {
    readOrbit();
    syncCarouselLinks();
  }, { passive: true });
  window.addEventListener("scroll", updateNav, { passive: true });
  reducedMotion.addEventListener("change", syncOrbitMotion);

  for (const pill of portal.querySelectorAll("[data-stat]")) loadStat(pill);
})();
