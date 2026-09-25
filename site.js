(() => {
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".links a").forEach((a) => a.getAttribute("href") === here && a.classList.add("active"));

  // Scroll reveal
  const els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add("in"));

  // Collection filter
  const chips = document.querySelectorAll(".chip");
  chips.forEach((chip) => chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.toggle("on", c === chip));
    const f = chip.dataset.filter;
    document.querySelectorAll("[data-cat]").forEach((card) => (card.hidden = f !== "all" && card.dataset.cat !== f));
  }));
})();
