/* ============================================================================
   v4.2 — Ambient "Suns" gravity background (bucket-fill + live controls)
   Gapless bottom-up skyline pack of the GoFundMe rising-sun mark. Density and
   size-contrast are live-tunable. The viewer's own sun is highlighted in the
   pile when their persona has one. Cascades in via a staggered CSS fall; masked
   to fade toward the content column; faint scatter on narrow screens.
   ============================================================================ */
(function () {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GRADS = ["lime", "gold", "teal", "violet", "forest"];
  const LETTERS = "SMTAPJELRKN".split("");
  const LS = { dens: "sunsDensity1", contr: "sunsContrast1", pct: "sunsPct1" };
  // defaults: least-dense + highest size contrast (per request)
  let DENS = parseFloat(localStorage.getItem(LS.dens)); if (isNaN(DENS)) DENS = 0.74;
  let CONTR = parseFloat(localStorage.getItem(LS.contr)); if (isNaN(CONTR)) CONTR = 1;
  let PCT = parseFloat(localStorage.getItem(LS.pct)); if (isNaN(PCT)) PCT = 0.78;   // fundraiser funded %
  DENS = Math.max(0, Math.min(1, DENS)); CONTR = Math.max(0, Math.min(1, CONTR)); PCT = Math.max(0.05, Math.min(1, PCT));

  // personas that have already left a sun (so we highlight "yours")
  const HAS_SUN = ["close_friend", "extrovert", "returning_lapsed", "profile_owner"];

  let layer, panel, main, W = 0, docH = 0, leftInner = 0, rightInner = 0, rt = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function persona() { return document.body.getAttribute("data-persona") || "anonymous"; }
  function pickSizeClass() { const t = [["xs",22,.1],["sm",28,.22],["md",40,.34],["lg",54,.26],["xl",68,.08]]; let r = Math.random(), a = 0; for (const s of t) { a += s[2]; if (r <= a) return s; } return t[2]; }

  // gapless bottom-up skyline pack with depth-driven size + gap (bucket fill)
  function solveColumn(x0, x1) {
    const w = x1 - x0; if (w < 8) return [];
    const binW = 26, bins = Math.max(1, Math.floor(w / binW));
    const colH = new Array(bins).fill(0);
    const topD = lerp(42, 74, CONTR), botD = lerp(34, 15, CONTR);   // big & sparse up top, small at bottom
    const SCALE = lerp(1.7, 0.82, PCT);   // funded %: low = fewer, larger suns (comfortable, never empty); high = many small suns (crowded)
    const out = []; let guard = 0;
    while (guard++ < 9000) {
      // choose randomly among the lowest few bins → organic "cottonballs", not concentric arcs
      let minH = Infinity; for (let i = 0; i < bins; i++) if (colH[i] < minH) minH = colH[i];
      if (minH > docH + 40) break;   // always fill the full gutter; funded % changes sun SIZE, not emptiness
      const cands = []; for (let i = 0; i < bins; i++) if (colH[i] <= minH + 26) cands.push(i);
      let bi = cands[(Math.random() * cands.length) | 0];
      let support = colH[bi];
      const f = clamp01(support / docH + (Math.random() - 0.5) * 0.18);   // jittered depth breaks size banding
      let d = Math.round(lerp(botD, topD, f) * (0.78 + Math.random() * 0.44) * SCALE);
      d = Math.max(13, Math.min(120, d));
      const r = d / 2;
      const span = Math.max(1, Math.min(bins, Math.round(d / binW)));
      let start = Math.min(bi, bins - span); if (start < 0) start = 0;
      for (let i = start; i < start + span; i++) support = Math.max(support, colH[i]);
      // soft pile: small positive floor gap so suns nestle like cotton (no hard overlap rings)
      const gap = SCALE * lerp(lerp(30, 4, DENS), lerp(92, 30, DENS), clamp01(support / docH));
      const y = docH - support - r;
      const x = x0 + start * binW + (span * binW) / 2 + (Math.random() - 0.5) * (binW * 0.9);
      for (let i = start; i < start + span; i++) colH[i] = support + d + gap;
      out.push({ d, r, x, y });
    }
    return out;
  }

  function emit(B) {
    const frag = document.createDocumentFragment();
    for (const b of B) {
      const colored = Math.random() < 0.5;
      const grad = colored ? GRADS[(Math.random() * GRADS.length) | 0] : "";
      const el = document.createElement("span");
      el.className = "mark" + (grad ? " mark--" + grad : "");
      el.style.width = b.d + "px"; el.style.height = b.d + "px";
      el.style.left = (b.x - b.r) + "px"; el.style.top = (b.y - b.r) + "px";
      if (colored && b.d >= 34 && Math.random() < 0.62) {
        const bb = document.createElement("b"); bb.className = "mark__l";
        bb.textContent = LETTERS[(Math.random() * LETTERS.length) | 0];
        bb.style.fontSize = Math.round(b.d * 0.34) + "px"; el.appendChild(bb);
      }
      if (!REDUCED) {
        el.style.setProperty("--fall", "-" + Math.round(b.y + b.d + 120) + "px");
        el.style.animationDelay = (Math.random() * 0.5 + (1 - b.y / docH) * 0.35).toFixed(2) + "s";
        el.classList.add("mark--fall");
      }
      b.el = el; frag.appendChild(el);
    }
    layer.appendChild(frag);
  }

  // promote one sun in the pile to highlighted (yours, or the sharer's), with a ring + label
  function highlightMine(B, label) {
    let pick = null;
    for (const b of B) { if (b.y > 150 && b.y < 1000 && b.d >= 26) { if (!pick || b.x < pick.x) pick = b; } }
    if (!pick) pick = B[0]; if (!pick) return;
    const d = Math.max(54, pick.d);
    pick.el.className = "mark mark--lime mark--mine";
    pick.el.style.width = d + "px"; pick.el.style.height = d + "px";
    pick.el.querySelectorAll(".mark__l").forEach(n => n.remove());
    const cx = pick.x, cy = pick.y;
    const ring = document.createElement("div"); ring.className = "sun-ring";
    ring.style.width = ring.style.height = (d + 16) + "px";
    ring.style.left = (cx - (d + 16) / 2) + "px"; ring.style.top = (cy - (d + 16) / 2) + "px";
    const tag = document.createElement("div"); tag.className = "sun-you"; tag.textContent = label;
    tag.style.left = cx + "px"; tag.style.top = (cy - (d + 16) / 2 - 8) + "px";
    layer.appendChild(ring); layer.appendChild(tag);
  }

  function setMask() {
    const F = Math.max(30, Math.min(140, Math.min(leftInner, W - rightInner) * 0.6));
    const g = "linear-gradient(to right, #000 0, #000 " + Math.max(0, leftInner - F) + "px, transparent " + leftInner + "px, transparent " + rightInner + "px, #000 " + (rightInner + F) + "px, #000 100%)";
    layer.style.webkitMaskImage = g; layer.style.maskImage = g;
  }

  function scatter() {
    layer.classList.add("marks-bg--faint");
    layer.style.webkitMaskImage = "none"; layer.style.maskImage = "none";
    const frag = document.createDocumentFragment();
    const n = Math.min(140, Math.round((W * docH) / 24000));
    for (let i = 0; i < n; i++) {
      const [cls, d] = pickSizeClass();
      const colored = Math.random() < 0.5, grad = colored ? GRADS[(Math.random() * GRADS.length) | 0] : "";
      const el = document.createElement("span"); el.className = "mark mark--" + cls + (grad ? " mark--" + grad : "");
      el.style.left = (Math.random() * W) + "px"; el.style.top = (Math.random() * docH) + "px"; el.style.opacity = "0.17";
      frag.appendChild(el);
    }
    layer.appendChild(frag);
  }

  function run() {
    if (!layer) return;
    layer.innerHTML = "";
    W = document.documentElement.clientWidth;
    docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    layer.style.height = docH + "px";
    const r = main.getBoundingClientRect();
    leftInner = Math.max(0, r.left); rightInner = Math.min(W, r.right);
    if (leftInner < 80 || (W - rightInner) < 80) { scatter(); return; }
    layer.classList.remove("marks-bg--faint");
    setMask();
    const Lb = solveColumn(0, leftInner); emit(Lb);
    const Rb = solveColumn(rightInner, W); emit(Rb);
    const who = persona();
    if (who === "shared_by_extro") highlightMine(Lb, "Mike T. shared this");
    else if (HAS_SUN.indexOf(who) !== -1) highlightMine(Lb, "Your sun");
  }

  /* ---- live control panel ---- */
  function buildPanel() {
    panel = document.createElement("div"); panel.className = "marks-panel";
    panel.innerHTML =
      '<div class="marks-panel__h"><svg width="16" height="16"><use href="#i-heart"/></svg> Suns</div>' +
      row("dens", "Density", DENS) + row("contr", "Size contrast", CONTR) + row("pct", "Funded %", PCT);
    document.body.appendChild(panel);
    panel.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("input", () => {
        if (inp.dataset.k === "dens") { DENS = inp.value / 100; localStorage.setItem(LS.dens, DENS); }
        else if (inp.dataset.k === "contr") { CONTR = inp.value / 100; localStorage.setItem(LS.contr, CONTR); }
        else { PCT = Math.max(0.05, inp.value / 100); localStorage.setItem(LS.pct, PCT); }
        clearTimeout(rt); rt = setTimeout(run, 120);
      });
    });
    function row(k, label, val) {
      return '<label class="marks-panel__row"><span>' + label + '</span><input type="range" min="0" max="100" value="' + Math.round(val * 100) + '" data-k="' + k + '"></label>';
    }
  }

  function build() {
    main = document.querySelector("main"); if (!main) return;
    layer = document.querySelector(".marks-bg");
    if (!layer) { layer = document.createElement("div"); layer.className = "marks-bg"; layer.setAttribute("aria-hidden", "true"); document.body.appendChild(layer); }
    buildPanel();
    run();
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(run, 350); });
    document.addEventListener("personachange", () => { clearTimeout(rt); rt = setTimeout(run, 60); });
    new MutationObserver(() => { if (document.body.getAttribute("data-mode") !== "before") run(); })
      .observe(document.body, { attributes: true, attributeFilter: ["data-mode"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
