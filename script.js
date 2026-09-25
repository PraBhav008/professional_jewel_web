(() => {
  /* ---------- Navbar ---------- */
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".burger");
  const links = document.querySelector(".links");
  const pinned = nav.classList.contains("solid");
  const onScroll = () => nav.classList.toggle("solid", pinned || window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Scroll cue ---------- */
  const cue = document.getElementById("scrollCue");
  if (cue) cue.addEventListener("click", () => document.getElementById("collections").scrollIntoView({ behavior: "smooth" }));

  /* ---------- Contact form (demo) ---------- */
  const form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Demo only: connect to a backend or form service here.
    document.getElementById("formOk").hidden = false;
    form.reset();
  });

  /* ---------- Diamond burst ---------- */
  const layer = document.createElement("div");
  layer.className = "burst-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `<svg width="0" height="0" style="position:absolute"><defs>
    <clipPath id="dm-clip"><polygon points="16,4 48,4 62,20 32,54 2,20"/></clipPath>
    <linearGradient id="dm-glint" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs></svg>`;
  document.body.appendChild(layer);

  const DIAMOND = `<svg viewBox="0 0 64 56" width="100%" height="100%">
    <g stroke="#fff" stroke-opacity=".75" stroke-width=".8" stroke-linejoin="round">
      <polygon points="16,4 24,20 2,20" fill="#fff" fill-opacity=".5"/>
      <polygon points="16,4 48,4 40,20 24,20" fill="#fff" fill-opacity=".8"/>
      <polygon points="48,4 62,20 40,20" fill="#cfd8e6" fill-opacity=".6"/>
      <polygon points="2,20 24,20 32,54" fill="#9fb3cf" fill-opacity=".55"/>
      <polygon points="24,20 40,20 32,54" fill="#e8eef7" fill-opacity=".75"/>
      <polygon points="40,20 62,20 32,54" fill="#8298b8" fill-opacity=".55"/>
    </g>
    <g clip-path="url(#dm-clip)"><polygon class="glint" points="-10,60 2,60 22,-4 10,-4" fill="url(#dm-glint)"/></g></svg>`;
  const SPARK = `<svg class="spark" viewBox="0 0 12 12"><path d="M6 0l1.4 4.6L12 6 7.4 7.4 6 12 4.6 7.4 0 6l4.6-1.4z" fill="#fff"/></svg>`;
  const SPARKS = [{ x: -34, y: -24, s: 0.8, d: 50 }, { x: 36, y: -12, s: 0.6, d: 120 }, { x: -18, y: 26, s: 0.55, d: 180 }];
  const EASE = "cubic-bezier(.2,.8,.2,1)";

  function burst(x, y) {
    const old = layer.querySelectorAll(".burst");
    if (old.length >= 6) old[0].remove(); // never let them pile up
    const b = document.createElement("div");
    b.className = "burst";
    b.style.left = x + "px";
    b.style.top = y + "px";
    b.innerHTML = DIAMOND + SPARKS.map(() => SPARK).join("");
    layer.appendChild(b);

    b.querySelector(".glint").animate(
      [{ transform: "translateX(-10px)" }, { transform: "translateX(78px)" }],
      { duration: 500, delay: 150, easing: "ease-in-out", fill: "both" }
    );
    b.querySelectorAll(".spark").forEach((el, i) => {
      const p = SPARKS[i];
      el.animate([
        { transform: "translate(0,0) scale(0)", opacity: 0 },
        { transform: `translate(${p.x * 0.6}px,${p.y * 0.6}px) scale(${p.s})`, opacity: 1, offset: 0.5 },
        { transform: `translate(${p.x}px,${p.y}px) scale(0)`, opacity: 0 },
      ], { duration: 550, delay: p.d, easing: "ease-out", fill: "both" });
    });
    const a = b.animate([
      { transform: "translateY(0) scale(0) rotate(-15deg)", opacity: 0, offset: 0, easing: EASE },
      { transform: "translateY(0) scale(1.15) rotate(5deg)", opacity: 1, offset: 0.28, easing: EASE },
      { transform: "translateY(-6px) scale(1) rotate(0deg)", opacity: 1, offset: 0.45, easing: "ease-out" },
      { transform: "translateY(-28px) scale(1) rotate(0deg)", opacity: 0, offset: 1 },
    ], { duration: 850, fill: "forwards" });
    a.onfinish = () => b.remove();
  }

  /* ---------- Diamond burst on any click/tap across the site ---------- */
  // Cards handle their own tap-vs-drag; keyboard clicks (detail 0) and form fields are skipped.
  document.addEventListener("click", (e) => {
    if (e.detail === 0 || e.target.closest(".sticker, input, textarea, select")) return;
    burst(e.clientX, e.clientY);
  });

  /* ---------- Draggable stickers (Pointer Events + rAF spring) ---------- */
  const box = document.querySelector(".stickers");
  if (!box) return;
  const SLOP = 10, MAX_TILT = 8;
  let zTop = 10, raf = 0, last = 0;

  const cards = [...box.querySelectorAll(".sticker")].map((el) => ({
    el, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 0, s: 1, ts: 1,
    drag: false, moved: false, sx: 0, sy: 0, gx: 0, gy: 0, minX: 0, maxX: 0, minY: 0, maxY: 0,
  }));

  const active = (c) =>
    c.drag || Math.abs(c.vx) > 0.05 || Math.abs(c.vy) > 0.05 || Math.abs(c.r) > 0.05 || Math.abs(c.s - c.ts) > 0.002;

  function tick(now) {
    const dt = Math.min((now - last) / 16.67, 2.5);
    last = now;
    let any = false;
    for (const c of cards) {
      if (!active(c)) continue;
      any = true;
      if (c.drag) { // spring toward pointer
        c.vx += (c.tx - c.x) * 0.22 * dt; c.vy += (c.ty - c.y) * 0.22 * dt;
        const d = Math.pow(0.72, dt); c.vx *= d; c.vy *= d;
      } else { // inertia + damping
        const d = Math.pow(0.93, dt); c.vx *= d; c.vy *= d;
      }
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.x < c.minX) { c.x = c.minX; c.vx *= -0.4; } else if (c.x > c.maxX) { c.x = c.maxX; c.vx *= -0.4; }
      if (c.y < c.minY) { c.y = c.minY; c.vy *= -0.4; } else if (c.y > c.maxY) { c.y = c.maxY; c.vy *= -0.4; }
      const tr = Math.max(-MAX_TILT, Math.min(MAX_TILT, c.vx * 1.2));
      c.r += (tr - c.r) * 0.15 * dt;
      c.s += (c.ts - c.s) * 0.2 * dt;
      c.el.style.transform = `translate3d(${c.x}px,${c.y}px,0) rotate(${c.r}deg) scale(${c.s})`;
    }
    raf = any ? requestAnimationFrame(tick) : 0;
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  cards.forEach((c) => {
    const el = c.el;
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !c.drag) { c.ts = 1.05; wake(); } });
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !c.drag) { c.ts = 1; wake(); } });

    el.addEventListener("pointerdown", (e) => {
      if (c.drag || (e.pointerType === "mouse" && e.button !== 0)) return;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = ++zTop;
      el.classList.add("grabbing");
      c.drag = true; c.moved = false; c.ts = 1.07;
      c.sx = e.clientX; c.sy = e.clientY;
      c.gx = e.clientX - c.x; c.gy = e.clientY - c.y;
      c.tx = c.x; c.ty = c.y;
      c.minX = -el.offsetLeft; c.maxX = box.clientWidth - el.offsetWidth - el.offsetLeft;
      c.minY = -el.offsetTop; c.maxY = box.clientHeight - el.offsetHeight - el.offsetTop;
      wake();
    });

    el.addEventListener("pointermove", (e) => {
      if (!c.drag) return;
      if (!c.moved && Math.hypot(e.clientX - c.sx, e.clientY - c.sy) >= SLOP) c.moved = true;
      c.tx = Math.max(c.minX, Math.min(c.maxX, e.clientX - c.gx));
      c.ty = Math.max(c.minY, Math.min(c.maxY, e.clientY - c.gy));
    });

    const end = (e, cancelled) => {
      if (!c.drag) return;
      c.drag = false;
      c.ts = e.pointerType === "mouse" && el.matches(":hover") ? 1.05 : 1;
      el.classList.remove("grabbing");
      if (!cancelled && !c.moved) burst(e.clientX, e.clientY); // tap, not drag
      wake();
    };
    el.addEventListener("pointerup", (e) => end(e, false));
    el.addEventListener("pointercancel", (e) => end(e, true));
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("dragstart", (e) => e.preventDefault());
  });
})();
