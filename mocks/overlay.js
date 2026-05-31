/* ============================================================================
   Metric Overlay + Persona Switcher — controller
   Implements design-overlay.md + the persona fixtures from design-personas.md.
   Demo-only (NEXT_PUBLIC_DEMO_MODE). State persisted to localStorage:
     overlayOn : boolean   |   overlayPersona : slug   |   demoMode : before|after
   Slot personalization in the page is authored declaratively:
     <el data-show="close_friend returning_lapsed">  -> shown only for those personas
     <el data-show="all">                            -> always shown
   This keeps every persona state visible in the static HTML (the source of truth).
   ========================================================================== */
(function () {
  const PERSONAS = [
    { slug: "anonymous",        name: "Anonymous",   label: "Anonymous",   desc: "First-timer — every fallback",     bg: "#f5f5f5", fg: "#6f6f6f", bd: "#6f6f6f", initial: "" },
    { slug: "close_friend",     name: "Sarah K.",    label: "Sarah K.",    desc: "Repeat donor, personal tie",       bg: "#ffd863", fg: "#68570d", initial: "S" },
    { slug: "extrovert",        name: "Mike T.",     label: "Mike T.",     desc: "Big follow graph, shares a lot",   bg: "#ccf88e", fg: "#274a34", initial: "M" },
    { slug: "shared_by_extro",  name: "Shared link", label: "Shared link", desc: "Arrived via Mike’s WhatsApp",      bg: "#f5f5f5", fg: "#6f6f6f", bd: "#4a9d44", initial: "?" },
    { slug: "returning_lapsed", name: "Priya M.",    label: "Priya M.",    desc: "Donated 14 months ago",            bg: "#e9fcce", fg: "#274a34", initial: "P" },
    { slug: "profile_owner",    name: "Janahan S.",  label: "Janahan S.",  desc: "Janahan viewing his own profile",  bg: "#232323", fg: "#ffffff", initial: "J" },
  ];
  const personGlyph = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z"/></svg>';

  const LS = {
    get on()      { return localStorage.getItem("overlayOn") === "true"; },
    set on(v)     { localStorage.setItem("overlayOn", v ? "true" : "false"); },
    get persona() { return localStorage.getItem("overlayPersona") || "anonymous"; },
    set persona(v){ localStorage.setItem("overlayPersona", v); },
    get mode()    { return localStorage.getItem("demoMode") || "after"; },
    set mode(v)   { localStorage.setItem("demoMode", v); },
  };

  let highlights = [];     // instrumented elements, in DOM order
  let blobIndex = -1;

  /* ---------- build DOM chrome ---------- */
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  const dim   = el("div", "ov-dim");
  const pill  = el("button", "ov-pill"); pill.setAttribute("aria-pressed", "false");
  const menu  = el("div", "ov-menu"); menu.setAttribute("role", "menu");
  const blob  = el("div", "ov-blob"); blob.setAttribute("role", "dialog");
  const ba    = el("div", "ba-toggle");
  ba.innerHTML = '<button data-mode="before">Before</button><button data-mode="after">After</button>';

  function personaBySlug(s) { return PERSONAS.find(p => p.slug === s) || PERSONAS[0]; }

  function avatarHTML(p, size) {
    const border = p.bd ? `border:1px solid ${p.bd};` : "";
    return `<span class="ov-ava" style="background:${p.bg};color:${p.fg};${border}">${p.initial || personGlyph}</span>`;
  }

  function buildMenu() {
    menu.innerHTML = "";
    const tog = el("button", "ov-menu__row ov-menu__toggle");
    tog.setAttribute("role", "menuitemcheckbox");
    tog.innerHTML = `<span>Show metric overlay</span><span class="ov-switch" aria-hidden="true"></span>`;
    tog.addEventListener("click", () => setOverlay(!LS.on));
    menu.appendChild(tog);
    menu.appendChild(el("hr", "ov-menu__divider"));
    menu.appendChild(el("div", "ov-menu__head", "View as…"));
    PERSONAS.forEach(p => {
      const row = el("button", "ov-menu__row");
      row.setAttribute("role", "menuitemradio");
      row.dataset.persona = p.slug;
      row.innerHTML = `${avatarHTML(p)}<span><span class="ov-menu__name">${p.name}</span><span class="ov-menu__desc">${p.desc}</span></span><span class="ov-menu__check" aria-hidden="true">✓</span>`;
      row.addEventListener("click", () => { setPersona(p.slug); });
      menu.appendChild(row);
    });
    buildNav();
  }

  const NAV_PAGES = [["Fundraiser", "fundraiser"], ["Community", "community"], ["Profile", "profile"]];
  function currentFile() { return (location.pathname.split("/").pop() || "index.html"); }
  function fileFor(slug, v) { return slug + (v === 1 ? "" : "-v" + v) + ".html"; }
  function buildNav() {
    menu.appendChild(el("hr", "ov-menu__divider"));
    menu.appendChild(el("div", "ov-menu__head", "Go to page"));
    const cur = currentFile();
    const VS = [["1",""],["2","-v2"],["3","-v3"],["4","-v4"],["4.2","-v4.2"],["5","-v5"]];
    NAV_PAGES.forEach(([label, slug]) => {
      const row = el("div", "ov-nav__row");
      row.appendChild(el("span", "ov-nav__label", label));
      const sel = document.createElement("select");
      sel.className = "ov-nav__sel"; sel.setAttribute("aria-label", label + " version");
      VS.forEach(([lab, suf]) => {
        const f = slug + suf + ".html";
        const o = document.createElement("option");
        o.value = f; o.textContent = "v" + lab;
        if (f === cur) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", () => { location.href = sel.value; });
      row.appendChild(sel);
      menu.appendChild(row);
    });
    const idx = document.createElement("a");
    idx.className = "ov-nav__all"; idx.href = "index.html"; idx.textContent = "All versions ↗";
    menu.appendChild(idx);
    const mob = document.createElement("a");
    mob.className = "ov-nav__all"; mob.href = "mobile.html"; mob.textContent = "Mobile views ↗";
    menu.appendChild(mob);
  }

  function syncMenu() {
    const cur = LS.persona;
    menu.querySelectorAll("[data-persona]").forEach(r => r.setAttribute("aria-checked", r.dataset.persona === cur ? "true" : "false"));
    const tog = menu.querySelector(".ov-menu__toggle");
    if (tog) tog.setAttribute("aria-checked", LS.on ? "true" : "false");
  }

  function syncPill() {
    const p = personaBySlug(LS.persona);
    const state = LS.on ? " · overlay on" : "";
    pill.innerHTML = `${avatarHTML(p)}<span>${p.label}${state}</span><span aria-hidden="true">▾</span>`;
    pill.setAttribute("aria-pressed", LS.on ? "true" : "false");
  }

  /* ---------- persona-driven slot visibility ---------- */
  function applyPersona() {
    const cur = LS.persona;
    document.querySelectorAll("[data-show]").forEach(node => {
      const list = node.getAttribute("data-show").split(/\s+/);
      const show = list.includes("all") || list.includes(cur);
      node.classList.toggle("hidden", !show);
    });
    document.body.setAttribute("data-persona", cur);
    document.dispatchEvent(new CustomEvent("personachange", { detail: { persona: cur } }));
  }

  function setPersona(slug) {
    LS.persona = slug;
    syncPill(); syncMenu(); applyPersona();
    if (LS.on) buildHighlights(); // positions may shift as slots collapse/expand
  }

  /* ---------- overlay ---------- */
  function setOverlay(on) {
    LS.on = on;
    document.body.setAttribute("data-overlay", on ? "on" : "off");
    syncPill(); syncMenu();
    closeBlob();
    if (on) buildHighlights(); else clearHighlights();
  }

  function clearHighlights() { highlights = []; }

  function buildHighlights() {
    highlights = Array.from(document.querySelectorAll("[data-overlay-tier]"))
      .filter(n => n.offsetParent !== null || n.getClientRects().length);
    highlights.forEach((n, i) => {
      n.setAttribute("role", "button");
      n.setAttribute("aria-label", "Show metric for " + (n.getAttribute("data-overlay-metric") || "element"));
      n.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openBlob(i); };
    });
  }

  /* ---------- metric blob ---------- */
  function openBlob(i) {
    if (i < 0 || i >= highlights.length) return;
    blobIndex = i;
    const n = highlights[i];
    const tier = n.getAttribute("data-overlay-tier");
    const events = (n.getAttribute("data-overlay-events") || "").split(",").filter(Boolean);
    const delta = n.getAttribute("data-overlay-delta") || "";
    const metric = n.getAttribute("data-overlay-metric") || "";
    const why = n.getAttribute("data-overlay-why") || "";
    const dash = n.getAttribute("data-overlay-dashboard") || "dashboard";
    blob.innerHTML =
      `<div class="ov-blob__top">
         <span class="ov-blob__tier ov-blob__tier--${tier}">${tier === "1" ? "Tier 1 · Core conversion" : "Tier 2 · Loop / retention"}</span>
         <button class="ov-blob__close" aria-label="Close">×</button>
       </div>
       <div class="ov-blob__events">${events.map(e => `<span class="ov-blob__event">${e.trim()}</span>`).join("")}</div>
       <h3 class="ov-blob__title">${metric}</h3>
       <p class="ov-blob__why">${why}</p>
       <a class="ov-blob__dash" href="#">See it in the ${dash} chart →</a>
       <div class="ov-blob__nav">
         <button data-nav="prev" aria-label="Previous">◂</button>
         <button data-nav="next" aria-label="Next">▸</button>
         <span class="ov-blob__count">${i + 1} / ${highlights.length}</span>
       </div>`;
    blob.querySelector(".ov-blob__close").onclick = closeBlob;
    blob.querySelector('[data-nav="prev"]').onclick = () => openBlob((blobIndex - 1 + highlights.length) % highlights.length);
    blob.querySelector('[data-nav="next"]').onclick = () => openBlob((blobIndex + 1) % highlights.length);
    blob.classList.add("open");
    positionBlob(n);
  }
  function positionBlob(n) {
    if (window.innerWidth <= 767) return; // bottom-sheet via CSS
    const r = n.getBoundingClientRect();
    const bw = 360, bh = blob.offsetHeight || 240;
    let left = Math.min(Math.max(8, r.left), window.innerWidth - bw - 8);
    let top = r.bottom + 8;
    if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 8);
    blob.style.left = left + "px";
    blob.style.top = top + "px";
  }
  function closeBlob() { blob.classList.remove("open"); blobIndex = -1; }

  /* ---------- menu open/close ---------- */
  function toggleMenu(force) {
    const open = force != null ? force : !menu.classList.contains("open");
    menu.classList.toggle("open", open);
  }

  /* ---------- before/after ---------- */
  function setMode(m) {
    LS.mode = m;
    document.body.setAttribute("data-mode", m);
    ba.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === m ? "true" : "false"));
    if (LS.on) buildHighlights();
  }

  /* ---------- wire up ---------- */
  function init() {
    document.body.appendChild(dim);
    document.body.appendChild(menu);
    document.body.appendChild(blob);
    document.body.appendChild(pill);
    document.body.appendChild(ba);
    buildMenu();

    pill.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
    ba.querySelectorAll("button").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
    dim.addEventListener("click", closeBlob);
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== pill && !pill.contains(e.target)) toggleMenu(false);
      if (!blob.contains(e.target)) { /* blob closed by dim/own buttons */ }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { toggleMenu(false); closeBlob(); }
    });
    window.addEventListener("resize", () => { if (blobIndex >= 0 && highlights[blobIndex]) positionBlob(highlights[blobIndex]); });

    // restore state
    document.body.setAttribute("data-mode", LS.mode);
    ba.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === LS.mode ? "true" : "false"));
    document.body.setAttribute("data-overlay", LS.on ? "on" : "off");
    syncPill(); syncMenu(); applyPersona();
    if (LS.on) buildHighlights();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
