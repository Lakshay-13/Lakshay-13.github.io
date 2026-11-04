const showcase = document.getElementById("showcase");
const controls = document.getElementById("showcase-controls");
const previous = document.getElementById("project-prev");
const next = document.getElementById("project-next");
const position = document.getElementById("showcase-position");

const projects = Array.from(showcase.children);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let selected = -1;
let pendingFrame = null;

function scrollOffset(index) {
  return projects[index].offsetLeft - projects[0].offsetLeft;
}

function updateControls() {
  let closest = 0;
  const maxScroll = showcase.scrollWidth - showcase.clientWidth;
  if (maxScroll > 0 && showcase.scrollLeft >= maxScroll - 2) {
    closest = projects.length - 1;
  } else {
    projects.forEach((_, index) => {
      if (Math.abs(scrollOffset(index) - showcase.scrollLeft) <
          Math.abs(scrollOffset(closest) - showcase.scrollLeft)) {
        closest = index;
      }
    });
  }
  if (closest === selected) return;
  selected = closest;
  previous.disabled = selected === 0;
  next.disabled = selected === projects.length - 1;
  const number = (value) => String(value).padStart(2, "0");
  position.textContent = number(selected + 1) + " / " + number(projects.length);
}

function moveBy(step) {
  const index = Math.max(0, Math.min(selected + step, projects.length - 1));
  showcase.scrollTo({
    left: scrollOffset(index),
    behavior: reducedMotion.matches ? "instant" : "smooth"
  });
}

previous.addEventListener("click", () => moveBy(-1));
next.addEventListener("click", () => moveBy(1));
showcase.addEventListener("keydown", (event) => {
  if (event.target !== showcase || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  moveBy(event.key === "ArrowLeft" ? -1 : 1);
});

showcase.addEventListener("scroll", () => {
  if (pendingFrame !== null) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null;
    updateControls();
  });
}, { passive: true });
window.addEventListener("resize", updateControls, { passive: true });
updateControls();
controls.hidden = false;
