/* ============================================================================
   v4.2 — Sun creation screen + share ribbon (shared across v4.2 pages)
   • Enables the "Light your sun" button (always accessible) and opens a working
     creation modal whose three avenues (Follow / Share / Give) reflect the
     current persona's done-state.
   • On any share tap, drops a temporary congratulations ribbon from the top.
   ============================================================================ */
(function () {
  // per-persona completed actions
  const ACTS = {
    anonymous:       { follow: 0, share: 0, give: 0 },
    close_friend:    { follow: 1, share: 1, give: 1 },
    extrovert:       { follow: 1, share: 1, give: 0 },
    shared_by_extro: { follow: 0, share: 0, give: 0 },
    returning_lapsed:{ follow: 1, share: 0, give: 1 },
    profile_owner:   { follow: 1, share: 0, give: 1 }
  };
  const isProfile = /profile/.test(location.pathname);
  const overlayOn = () => document.body.getAttribute("data-overlay") === "on";
  function persona() { return document.body.getAttribute("data-persona") || "anonymous"; }
  function acts() { return ACTS[persona()] || ACTS.anonymous; }

  /* ---------- creation modal ---------- */
  const modal = document.createElement("div");
  modal.className = "suncreate";
  modal.innerHTML =
    '<div class="suncreate__panel">' +
      '<div class="suncreate__bar"><h3>Your sun</h3><button class="suncreate__x" aria-label="Close">×</button></div>' +
      '<p class="muted" style="font-size:var(--hrt-size-font-body-sm);margin:0 0 var(--hrt-size-spacing-2)">Follow places your sun · sharing colours it · giving grows it. Anonymous by default.</p>' +
      '<div class="avenue" data-av="follow"><span class="avenue__ic"><svg><use href="#i-bell"/></svg></span><span class="avenue__t"><b>Follow this cause</b>Places your sun on the page.</span><span class="avenue__state">locked</span></div>' +
      '<div class="avenue" data-av="share"><span class="avenue__ic"><svg><use href="#i-share"/></svg></span><span class="avenue__t"><b>Share it</b>Unlocks colour for your sun.</span><span class="avenue__state">locked</span></div>' +
      '<div class="avenue" data-av="give"><span class="avenue__ic"><svg><use href="#i-heart"/></svg></span><span class="avenue__t"><b>Give</b>Grows your sun.</span><span class="avenue__state">locked</span></div>' +
      '<div style="margin-top:var(--hrt-size-spacing-3)"><div class="label">Key gradient <span class="muted" style="font-weight:var(--hrt-font-weight-regular)">· a curated set (no free colour picker)</span></div>' +
      '<div class="gradrow">' +
        '<button class="gradsw" aria-pressed="true" style="background:linear-gradient(135deg,#acf86c,#4a9d44)" aria-label="Lime"></button>' +
        '<button class="gradsw" aria-pressed="false" style="background:linear-gradient(135deg,#ffd863,#f6a93b)" aria-label="Gold"></button>' +
        '<button class="gradsw" aria-pressed="false" style="background:linear-gradient(135deg,#a7e3e3,#185b93)" aria-label="Teal"></button>' +
        '<button class="gradsw" aria-pressed="false" style="background:linear-gradient(135deg,#eccff6,#642878)" aria-label="Violet"></button>' +
      '</div></div>' +
      '<label class="consent"><input type="checkbox" id="sc-name"> Show my name on my sun <span class="muted">(optional · anonymous by default)</span></label>' +
      '<div class="create__preview"><span class="mark mark--lime" style="width:44px;height:44px"></span><div><div style="font-weight:var(--hrt-font-weight-bold);font-size:var(--hrt-size-font-body-sm)" class="sc-pv-t">Your sun</div><div class="muted" style="font-size:var(--hrt-size-font-body-xs)" class="sc-pv-s">Light it by taking any action above</div></div></div>' +
      '<button class="btn btn--primary btn--block sc-confirm" style="margin-top:var(--hrt-size-spacing-2)">Light my sun</button>' +
    '</div>';
  document.body.appendChild(modal);

  function syncModal() {
    const a = acts();
    modal.querySelectorAll(".avenue").forEach(av => {
      const done = a[av.dataset.av];
      av.classList.toggle("avenue--done", !!done);
      av.querySelector(".avenue__state").textContent = done ? "✓ done" : "locked";
    });
    const any = a.follow || a.share || a.give;
    modal.querySelector(".sc-pv-t").textContent = any ? "Your sun is lit" : "Your sun";
    modal.querySelector(".sc-pv-s").textContent = a.share ? "Coloured because you shared · grows when you give"
      : (any ? "Following — sharing will colour it" : "Light it by taking any action above");
  }
  function openModal() { syncModal(); modal.classList.add("open"); }
  function closeModal() { modal.classList.remove("open"); }
  modal.querySelector(".suncreate__x").addEventListener("click", closeModal);
  modal.querySelector(".sc-confirm").addEventListener("click", function () { closeModal(); ribbon("✨ Your sun is shining on this page"); });
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  modal.querySelectorAll(".gradsw").forEach(sw => sw.addEventListener("click", function () {
    modal.querySelectorAll(".gradsw").forEach(s => s.setAttribute("aria-pressed", "false"));
    sw.setAttribute("aria-pressed", "true");
    modal.querySelector(".create__preview .mark").style.background = sw.style.background;
  }));

  /* ---------- enable + label the intro button ---------- */
  function syncBtn() {
    const btn = document.querySelector(".marks-intro__btn"); if (!btn) return;
    btn.removeAttribute("disabled");
    const any = acts().follow || acts().share || acts().give;
    btn.textContent = any ? "View your sun" : "Light your sun";
  }
  document.addEventListener("click", e => {
    if (e.target.closest(".marks-intro__btn") && !overlayOn()) { e.preventDefault(); openModal(); }
  });

  /* ---------- temporary congratulations ribbon ---------- */
  let rib, ribT;
  function ribbon(html) {
    if (!rib) { rib = document.createElement("div"); rib.className = "sun-ribbon"; document.body.appendChild(rib); }
    rib.innerHTML = html;
    rib.classList.add("show");
    clearTimeout(ribT); ribT = setTimeout(() => rib.classList.remove("show"), 3200);
  }
  // share taps → congratulations ribbon (followers on profile, people elsewhere)
  document.addEventListener("click", e => {
    if (e.target.closest(".js-share") && !overlayOn()) {
      const n = 2 + Math.floor(Math.random() * 4);
      ribbon(isProfile
        ? '🎉 Nice — your share brought <span class="sun-ribbon__em">&nbsp;' + n + ' new followers</span>'
        : '🎉 Nice — your share reached <span class="sun-ribbon__em">&nbsp;' + n + ' new people</span>');
    }
  });

  function init() { syncBtn(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  document.addEventListener("personachange", function () { syncBtn(); if (modal.classList.contains("open")) syncModal(); });
})();
