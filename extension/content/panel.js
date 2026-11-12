// The viteCV side panel, injected into every page. It stays out of the way
// (no tab, no work) unless the page looks like a job posting, or the user
// clicks the toolbar button.
//
// Everything lives in a shadow root so the host page's CSS cannot reach in
// and ours cannot leak out. All network access goes through the background
// worker, which also holds the token.
(() => {
  if (window.top !== window || globalThis.__vcvPanelLoaded) return;
  globalThis.__vcvPanelLoaded = true;

  const api = globalThis.browser ?? globalThis.chrome;
  const { APP_BASE_URL } = globalThis.VCV_CONFIG;

  const TYPE_ALIASES = {
    CONTRACT: "CONTRACTOR",
    INTERNSHIP: "INTERN",
    FULLTIME: "FULL_TIME",
    PARTTIME: "PART_TIME",
    TEMP: "TEMPORARY",
  };
  const TYPES = [
    ["", "Select type"],
    ["FULL_TIME", "Full-time"],
    ["PART_TIME", "Part-time"],
    ["CONTRACTOR", "Contract"],
    ["INTERN", "Internship"],
    ["TEMPORARY", "Temporary"],
  ];
  const STATUSES = [
    ["SAVED", "Saved"],
    ["APPLIED", "Applied"],
    ["INTERVIEWING", "Interviewing"],
    ["OFFER", "Offer"],
    ["REJECTED", "Rejected"],
  ];
  const STORED_STATUS_LABEL = {
    saved: "Saved",
    applied: "Applied",
    interview: "Interviewing",
    offer: "Offer",
    rejected: "Rejected",
  };
  const MIN_ANALYSIS_CHARS = 200;

  // --- State ---------------------------------------------------------------

  const state = {
    open: false,
    phase: "loading", // loading | disconnected | ready
    pairError: "",
    pairing: false,
    scan: "idle", // idle | scanning | none | error
    scanError: "",
    job: null, // editable copy of the extracted job
    saved: null, // { id, status, matchScore } when already tracked
    saving: false,
    saveMessage: null, // { text, kind }
    analysis: { status: "idle" }, // idle | running | done | error | skipped
    scanToken: 0, // invalidates in-flight work when the page changes
  };

  // --- Helpers -------------------------------------------------------------

  async function send(type, payload = {}) {
    try {
      return await api.runtime.sendMessage({ type, ...payload });
    } catch {
      return {
        ok: false,
        error: "The extension was updated. Reload this page.",
      };
    }
  }

  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else if (key in el) el[key] = value;
      else el.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child);
    }
    return el;
  }

  function normalizeEmploymentType(value) {
    const first = String(value ?? "").split(",")[0];
    const normalized = first.toUpperCase().trim().replace(/[\s-]+/g, "_");
    const mapped = TYPE_ALIASES[normalized] ?? normalized;
    return TYPES.some(([v]) => v === mapped) ? mapped : "";
  }

  function looksLikeJobPage() {
    const { hostname, pathname, search } = location;

    if (/(^|\.)linkedin\.com$/.test(hostname)) {
      return (
        pathname.startsWith("/jobs/view") ||
        (pathname.startsWith("/jobs") && search.includes("currentJobId"))
      );
    }

    if (
      /(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|smartrecruiters\.com)$/.test(
        hostname,
      )
    ) {
      return true;
    }

    for (const script of document.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      if (script.textContent?.includes("JobPosting")) return true;
    }

    return /\/(jobs?|careers?|positions?|openings?|vacanc(y|ies))\//i.test(
      pathname,
    );
  }

  // --- Shell ---------------------------------------------------------------

  const host = h("div", { id: "vcv-root" });
  const root = host.attachShadow({ mode: "open" });

  const style = h("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .vcv {
      --bg: #ffffff; --surface: #fafafa; --border: #e4e4e7; --text: #171717;
      --muted: #52525b; --accent: #0a66c2; --accent-text: #ffffff;
      --good: #15803d; --good-bg: #dcfce7; --warn: #b45309; --warn-bg: #fef3c7;
      --bad: #b91c1c; --bad-bg: #fee2e2;
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text);
    }
    @media (prefers-color-scheme: dark) {
      .vcv {
        --bg: #222222; --surface: #1a1a1a; --border: #333333; --text: #f5f5f5;
        --muted: #a3a3a3; --accent: #54a6d8; --accent-text: #1a1a1a;
        --good: #4ade80; --good-bg: #14301f; --warn: #fbbf24; --warn-bg: #3a2c0a;
        --bad: #f87171; --bad-bg: #3b1515;
      }
    }
    .tab {
      position: fixed; top: 40%; right: 0; z-index: 2147483646;
      writing-mode: vertical-rl; padding: 12px 7px; border: 0;
      border-radius: 10px 0 0 10px; cursor: pointer; font: 600 12px/1 inherit;
      letter-spacing: .04em; background: var(--accent); color: var(--accent-text);
      box-shadow: -2px 2px 10px rgba(0,0,0,.25);
    }
    .tab[hidden] { display: none; }
    .panel {
      position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 100vw;
      z-index: 2147483647; display: flex; flex-direction: column;
      background: var(--bg); border-left: 1px solid var(--border);
      box-shadow: -8px 0 30px rgba(0,0,0,.18);
      transform: translateX(105%); transition: transform .22s ease;
    }
    .panel.open { transform: none; }
    .panel.docked { box-shadow: none; }
    @media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
    header {
      display: flex; align-items: center; gap: 8px; padding: 12px 14px;
      border-bottom: 1px solid var(--border);
    }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; letter-spacing: -.015em; flex: 1; }
    .brand svg { width: 22px; height: 22px; flex-shrink: 0; }
    .brand span { color: var(--accent); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--good); }
    .dot.off { background: var(--muted); }
    .body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
    footer { padding: 12px 14px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
    .card { border: 1px solid var(--border); border-radius: 12px; padding: 12px; background: var(--bg); }
    h2 { margin: 0 0 4px; font-size: 14px; }
    p { margin: 0; }
    .muted { color: var(--muted); font-size: 12px; }
    label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
    input, select, textarea {
      width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px;
      background: var(--bg); color: var(--text); font: inherit;
    }
    textarea { min-height: 120px; resize: vertical; font-size: 12px; }
    input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible, a:focus-visible, summary:focus-visible {
      outline: 2px solid var(--accent); outline-offset: 1px;
    }
    .code-input { font: 600 20px/1 ui-monospace, monospace; letter-spacing: .15em; text-align: center; text-transform: uppercase; }
    .row { display: flex; gap: 8px; }
    .row > * { flex: 1; min-width: 0; }
    .field { margin-bottom: 10px; }
    button.btn {
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
      border-radius: 8px; padding: 9px 12px; font: 600 13px/1 inherit; cursor: pointer;
    }
    button.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
    button.btn:disabled { opacity: .55; cursor: default; }
    button.ghost { border: 0; background: none; color: var(--muted); cursor: pointer; font: inherit; padding: 4px 6px; border-radius: 6px; }
    button.ghost:hover { color: var(--text); background: var(--surface); }
    .notice { padding: 8px 10px; border-radius: 8px; font-size: 12px; }
    .notice.error { background: var(--bad-bg); color: var(--bad); }
    .notice.success { background: var(--good-bg); color: var(--good); }
    .notice.info { background: var(--surface); color: var(--muted); }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--good-bg); color: var(--good); }
    .score { display: flex; align-items: center; gap: 14px; }
    .ring { width: 72px; height: 72px; flex: none; }
    .ring text { font: 700 20px/1 inherit; fill: var(--text); }
    .tier { margin-top: 10px; }
    .tier h3 { margin: 0 0 4px; font-size: 12px; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip { padding: 2px 8px; border-radius: 999px; font-size: 12px; background: var(--bad-bg); color: var(--bad); }
    .skeleton { height: 12px; border-radius: 6px; background: var(--surface); animation: pulse 1.2s ease-in-out infinite; }
    @keyframes pulse { 50% { opacity: .45; } }
    @media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
    details summary { cursor: pointer; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    a { color: var(--accent); }
    .src { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
  `;

  const wrap = h("div", { class: "vcv" });
  const tab = h(
    "button",
    {
      class: "tab",
      hidden: true,
      "aria-label": "Open viteCV panel",
      onclick: () => setOpen(true),
    },
    "viteCV",
  );
  const panel = h("aside", {
    class: "panel",
    role: "complementary",
    "aria-label": "viteCV",
  });
  const headerEl = h("header");
  const bodyEl = h("div", { class: "body" });
  const footerEl = h("footer");
  panel.append(headerEl, bodyEl, footerEl);
  wrap.append(tab, panel);
  root.append(style, wrap);

  // The host is appended lazily, so pages that are not job postings carry
  // nothing at all in their DOM.
  function mount() {
    if (!host.isConnected) document.documentElement.append(host);
  }

  // --- Rendering -----------------------------------------------------------

  // The viteCV mark (public/brand/mark.svg), drawn in the panel's accent so it
  // follows light and dark. A static string, never page or user data.
  const MARK_SVG =
    '<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="144" fill="currentColor"/>' +
    '<g fill="var(--accent-text)" transform="translate(256 258) scale(0.88) translate(-260 -282.5)">' +
    '<path d="M149.7 193.3L137.3 170.7Q103.5 198.4 79.3 243.7L209.8 481.8Q288.6 337.2 357.4 186.1L351.6 182.3Q285.7 255.7 226.5 333.4Z"/>' +
    '<path d="M343.8 200.7Q369.0 144.7 323.3 103.8Q379.3 129.0 420.2 83.3Q395.0 139.3 440.7 180.2Q384.7 155.0 343.8 200.7Z"/></g></svg>';

  function brandMark() {
    const mark = h("span", { style: "display:flex;color:var(--accent)" });
    mark.innerHTML = MARK_SVG;
    return mark;
  }

  function renderHeader() {
    const connected = state.phase === "ready";
    headerEl.replaceChildren(
      h("div", { class: "brand" }, brandMark(), "vite", h("span", {}, "CV")),
      h("span", {
        class: `dot${connected ? "" : " off"}`,
        title: connected ? "Connected" : "Not connected",
      }),
      connected &&
        h(
          "button",
          { class: "ghost", onclick: disconnect, title: "Disconnect this browser" },
          "Disconnect",
        ),
      h(
        "button",
        {
          class: "ghost",
          "aria-label": "Close panel",
          onclick: () => setOpen(false),
        },
        "✕",
      ),
    );
  }

  function notice(text, kind = "info") {
    const message = text == null ? "" : String(text).trim();
    if (!message || message.toLowerCase() === "null") return null;
    return h("div", { class: `notice ${kind}`, role: kind === "error" ? "alert" : "status" }, message);
  }

  function renderDisconnected() {
    const input = h("input", {
      class: "code-input",
      placeholder: "XXXX-XXXX",
      maxLength: 9,
      autocomplete: "off",
      spellcheck: false,
      "aria-label": "Connection code",
      onkeydown: (event) => {
        event.stopPropagation(); // keep page hotkeys from eating keystrokes
        if (event.key === "Enter") submit();
      },
      onkeyup: (event) => event.stopPropagation(),
      onkeypress: (event) => event.stopPropagation(),
    });

    const button = h(
      "button",
      { class: "btn primary", onclick: submit, disabled: state.pairing },
      state.pairing ? "Connecting…" : "Connect",
    );

    async function submit() {
      const code = input.value.trim();
      if (!code || state.pairing) return;
      state.pairing = true;
      state.pairError = "";
      renderBody();
      const result = await send("pair", { code });
      state.pairing = false;
      if (result?.ok) {
        state.phase = "ready";
        renderAll();
        void scan();
      } else {
        state.pairError = result?.error || "Could not connect.";
        renderBody();
      }
    }

    bodyEl.replaceChildren(
      h(
        "div",
        { class: "card" },
        h("h2", {}, "Connect to viteCV"),
        h(
          "p",
          { class: "muted" },
          "Get a one-time code on the Extension page of the web app, then enter it here.",
        ),
        h("div", { class: "field", style: "margin-top:12px" }, input),
        state.pairError && notice(state.pairError, "error"),
        h("div", { style: "margin-top:10px;display:flex;flex-direction:column;gap:8px" }, button),
      ),
      h(
        "a",
        { href: `${APP_BASE_URL}/extension`, target: "_blank", rel: "noopener" },
        "Open the Extension page →",
      ),
    );
    footerEl.replaceChildren();
    if (!state.pairing) queueMicrotask(() => input.focus());
  }

  function renderJobCard() {
    const slot = bodyEl.querySelector("[data-slot=job]");
    if (!slot) return;
    slot.replaceChildren(buildJobCard());
  }

  function buildJobCard() {
    if (state.scan === "scanning" || state.scan === "idle") {
      return h(
        "div",
        { class: "card", "aria-busy": "true" },
        h("div", { class: "skeleton", style: "width:70%;margin-bottom:8px" }),
        h("div", { class: "skeleton", style: "width:45%;margin-bottom:8px" }),
        h("div", { class: "skeleton", style: "width:90%" }),
      );
    }

    if (state.scan !== "ready" || !state.job) {
      return h(
        "div",
        { class: "card" },
        h("h2", {}, "No job found on this page"),
        h(
          "p",
          { class: "muted" },
          state.scanError || "Open a job posting, then scan again.",
        ),
        h(
          "div",
          { style: "margin-top:10px" },
          h("button", { class: "btn", onclick: () => void scan() }, "Scan again"),
        ),
      );
    }

    const job = state.job;
    const bind = (key) => (event) => {
      job[key] = event.target.value;
      if (key === "description") renderMatch(); // analysis depends on it
    };
    const stop = (event) => event.stopPropagation();
    const field = (label, control) =>
      h("div", { class: "field" }, h("label", {}, label), control);
    const text = (key, attrs = {}) =>
      h("input", {
        value: job[key] ?? "",
        oninput: (event) => (job[key] = event.target.value),
        onkeydown: stop,
        onkeyup: stop,
        onkeypress: stop,
        ...attrs,
      });
    const select = (key, options) => {
      const el = h(
        "select",
        { onchange: bind(key) },
        options.map(([value, label]) => h("option", { value }, label)),
      );
      el.value = job[key] ?? "";
      return el;
    };

    let sourceLink = null;
    try {
      const source = new URL(job.url);
      sourceLink = h(
        "a",
        { class: "src", href: source.href, target: "_blank", rel: "noopener" },
        source.hostname + source.pathname,
      );
    } catch {
      // Unusable URL: the server will reject the save with a clear message.
    }

    return h(
      "div",
      { class: "card" },
      state.saved &&
        h(
          "div",
          { style: "margin-bottom:8px" },
          h(
            "span",
            { class: "pill" },
            `Tracked · ${STORED_STATUS_LABEL[state.saved.status] ?? "Saved"}`,
          ),
        ),
      field("Job title", text("title")),
      field("Company", text("company")),
      field("Location", text("location")),
      h(
        "div",
        { class: "row" },
        field("Type", select("employmentType", TYPES)),
        !state.saved && field("Status", select("status", STATUSES)),
      ),
      h(
        "details",
        {},
        h("summary", {}, "Description"),
        h("textarea", {
          value: job.description ?? "",
          oninput: bind("description"),
          onkeydown: stop,
          onkeyup: stop,
          onkeypress: stop,
          "aria-label": "Job description",
        }),
      ),
      sourceLink,
    );
  }

  function ring(score) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const color =
      score >= 70 ? "var(--good)" : score >= 45 ? "var(--warn)" : "var(--bad)";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 72 72");
    svg.setAttribute("class", "ring");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `${score} percent match`);
    const make = (tag, attrs) => {
      const el = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };
    svg.append(
      make("circle", { cx: 36, cy: 36, r: radius, fill: "none", stroke: "var(--surface)", "stroke-width": 7 }),
      make("circle", {
        cx: 36, cy: 36, r: radius, fill: "none", stroke: color, "stroke-width": 7,
        "stroke-linecap": "round", transform: "rotate(-90 36 36)",
        "stroke-dasharray": `${(score / 100) * circumference} ${circumference}`,
      }),
    );
    const label = make("text", { x: 36, y: 42, "text-anchor": "middle" });
    label.textContent = String(score);
    svg.append(label);
    return svg;
  }

  function renderMatch() {
    const slot = bodyEl.querySelector("[data-slot=match]");
    if (!slot) return;
    slot.replaceChildren(buildMatch());
  }

  function buildMatch() {
    if (state.scan !== "ready" || !state.job) return h("div");
    const a = state.analysis;
    const enoughText = (state.job.description ?? "").trim().length >= MIN_ANALYSIS_CHARS;

    const runButton = (label) =>
      h("button", { class: "btn", onclick: () => void analyze() }, label);

    let content;
    if (a.status === "running") {
      content = [
        h("div", { class: "score", "aria-busy": "true" },
          h("div", { class: "skeleton", style: "width:72px;height:72px;border-radius:50%" }),
          h("div", { style: "flex:1;display:flex;flex-direction:column;gap:8px" },
            h("div", { class: "skeleton", style: "width:80%" }),
            h("div", { class: "skeleton", style: "width:55%" }))),
      ];
    } else if (a.status === "done") {
      const { score, resume, missing = [] } = a.data;
      content = [
        h("div", { class: "score" },
          ring(score.score),
          h("div", {},
            h("div", { style: "font-weight:600" }, `${score.matched} of ${score.total} requirements`),
            h("div", { class: "muted" }, `vs. ${resume.title}`))),
        ...missing.map((group) =>
          h("div", { class: "tier" },
            h("h3", {}, group.title),
            h("div", { class: "chips" }, group.terms.map((term) => h("span", { class: "chip" }, term))))),
        missing.length === 0 && h("p", { class: "muted", style: "margin-top:8px" }, "Nothing missing — nice."),
        h("div", { style: "margin-top:12px;display:flex;gap:8px" },
          h("button", { class: "btn primary", onclick: tailor }, "Tailor my resume"),
          runButton("Re-run")),
      ];
    } else if (a.status === "error") {
      content = [
        notice(a.error, "error"),
        a.code === "no-resume"
          ? h("a", { href: `${APP_BASE_URL}/resume`, target: "_blank", rel: "noopener" }, "Add a resume →")
          : h("div", { style: "margin-top:8px" }, runButton("Try again")),
      ];
    } else if (!enoughText) {
      content = [
        h("p", { class: "muted" }, "This page has little job text to compare. Paste the description above for a better score."),
        h("div", { style: "margin-top:8px" }, runButton("Analyse anyway")),
      ];
    } else {
      content = [h("div", { style: "margin-top:2px" }, runButton("Analyse against my resume"))];
    }

    return h("div", { class: "card" }, h("h2", {}, "Resume match"), content);
  }

  function renderFooter() {
    if (state.phase !== "ready") return footerEl.replaceChildren();

    const canSave = state.scan === "ready" && state.job;
    footerEl.replaceChildren(
      state.saveMessage && notice(state.saveMessage.text, state.saveMessage.kind),
      canSave &&
        h(
          "button",
          { class: "btn primary", onclick: save, disabled: state.saving },
          state.saving ? "Saving…" : state.saved ? "Update saved job" : "Save job",
        ),
      h(
        "a",
        { href: `${APP_BASE_URL}/job-tracker`, target: "_blank", rel: "noopener" },
        "Open job tracker →",
      ),
    );
  }

  function renderBody() {
    if (state.phase === "loading") {
      bodyEl.replaceChildren(h("div", { class: "skeleton", style: "width:60%" }));
      footerEl.replaceChildren();
    } else if (state.phase === "disconnected") {
      renderDisconnected();
    } else {
      bodyEl.replaceChildren(h("div", { "data-slot": "job" }), h("div", { "data-slot": "match" }));
      renderJobCard();
      renderMatch();
      renderFooter();
    }
  }

  function renderAll() {
    renderHeader();
    renderBody();
  }

  // --- Actions -------------------------------------------------------------

  // Docking: narrow <html> by the panel's width so the page reflows into the
  // strip that is left, instead of the panel covering it. The inline values
  // we overwrite are saved and put back exactly on close. Sites that pin
  // elements with `position: fixed; right: 0` (chat bubbles, some sticky
  // bars) do not follow <html>'s width and may sit under the panel.
  const PANEL_WIDTH = 380;
  const MIN_DOCK_VIEWPORT = 700; // below this the page would be crushed
  let docked = null; // the page's own inline width / transition, while docked

  function applyDock() {
    const page = document.documentElement.style;
    const shouldDock = state.open && window.innerWidth >= MIN_DOCK_VIEWPORT;

    if (shouldDock && !docked) {
      docked = {
        width: page.getPropertyValue("width"),
        widthPriority: page.getPropertyPriority("width"),
        transition: page.getPropertyValue("transition"),
        transitionPriority: page.getPropertyPriority("transition"),
      };
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        page.setProperty("transition", "width .22s ease", "important");
      }
      page.setProperty("width", `calc(100% - ${PANEL_WIDTH}px)`, "important");
    } else if (!shouldDock && docked) {
      const saved = docked;
      docked = null;
      page.removeProperty("width");
      if (saved.width) page.setProperty("width", saved.width, saved.widthPriority);
      // Put the transition back only after the width has animated out.
      setTimeout(() => {
        if (docked) return; // re-docked in the meantime
        page.removeProperty("transition");
        if (saved.transition) {
          page.setProperty("transition", saved.transition, saved.transitionPriority);
        }
      }, 250);
    }

    panel.classList.toggle("docked", Boolean(docked));
  }

  window.addEventListener("resize", applyDock);
  // A page restored from the back/forward cache must not come back narrowed.
  window.addEventListener("pagehide", () => {
    if (state.open) setOpen(false);
  });

  function setOpen(open) {
    mount();
    state.open = open;
    applyDock();
    panel.classList.toggle("open", open);
    panel.inert = !open; // closed panel must not take focus
    tab.hidden = open || !state.detected;
    if (!open) return;
    if (state.phase === "loading") void init();
    else if (state.phase === "ready" && state.scan === "idle") void scan();
  }

  async function disconnect() {
    await send("disconnect");
    state.phase = "disconnected";
    state.saved = null;
    state.analysis = { status: "idle" };
    renderAll();
  }

  async function scan() {
    const token = ++state.scanToken;
    state.scan = "scanning";
    state.job = null;
    state.saved = null;
    state.saveMessage = null;
    state.analysis = { status: "idle" };
    renderBody();

    const result = await send("extract");
    if (token !== state.scanToken) return;

    const data = result?.job;
    if (!result?.ok || !data?.title) {
      state.scan = "none";
      state.scanError = result?.error || "";
      renderBody();
      return;
    }

    state.job = {
      title: data.title ?? "",
      company: data.company ?? "",
      location: data.location ?? "",
      employmentType: normalizeEmploymentType(data.employmentType),
      description: globalThis.jobTrackerHtmlToText(data.descriptionHtml ?? ""),
      status: "SAVED",
      url: data.url,
      datePosted: data.datePosted ?? null,
      extractionMethod: data.extractionMethod,
    };
    state.scan = "ready";
    renderBody();

    const lookup = await send("lookup", { url: state.job.url });
    if (token !== state.scanToken) return;
    if (lookup?.code === "unauthorized") return reauth();
    if (lookup?.ok && lookup.data?.saved) {
      state.saved = lookup.data;
      renderJobCard();
      renderFooter();
    }

    if ((state.job.description ?? "").trim().length >= MIN_ANALYSIS_CHARS) {
      void analyze();
    }
  }

  function reauth() {
    state.phase = "disconnected";
    state.pairError = "The connection was rejected. Get a new code.";
    renderAll();
  }

  async function analyze() {
    const token = state.scanToken;
    if (!state.job || state.analysis.status === "running") return;
    state.analysis = { status: "running" };
    renderMatch();

    const result = await send("analyze", {
      description: state.job.description,
      url: state.job.url,
    });
    if (token !== state.scanToken) return;

    if (result?.code === "unauthorized") return reauth();
    if (result?.ok) {
      state.analysis = { status: "done", data: result.data };
      if (state.saved) state.saved.matchScore = result.data.score.score;
    } else {
      state.analysis = { status: "error", error: result?.error, code: result?.code };
    }
    renderMatch();
  }

  function payload() {
    const job = state.job;
    return {
      title: job.title.trim(),
      company: job.company.trim(),
      location: job.location.trim() || null,
      employmentType: job.employmentType || null,
      description: job.description.trim() || null,
      status: job.status,
      url: job.url,
      datePosted: job.datePosted,
      extractionMethod: job.extractionMethod,
    };
  }

  // Returns the saved job id, or null after surfacing the error.
  async function persist() {
    state.saving = true;
    state.saveMessage = null;
    renderFooter();

    const result = await send("save", { job: payload() });
    state.saving = false;

    if (result?.code === "unauthorized") {
      reauth();
      return null;
    }
    if (!result?.ok) {
      state.saveMessage = { text: result?.error || "Could not save.", kind: "error" };
      renderFooter();
      return null;
    }

    const first = !state.saved;
    state.saved = {
      id: result.data.id,
      status: state.saved?.status ?? "saved",
      matchScore: state.saved?.matchScore ?? null,
    };
    state.saveMessage = {
      text: result.data.created === false ? "Already tracked — details refreshed." : "Saved to your tracker.",
      kind: "success",
    };
    renderJobCard();
    renderFooter();

    // The score was computed before the job existed to hold it. The result is
    // cached server-side, so re-running just records it, at no model cost.
    if (first && state.analysis.status === "done") {
      void send("analyze", { description: state.job.description, url: state.job.url });
    }
    return result.data.id;
  }

  async function save() {
    if (state.saving) return;
    if (!state.job.title.trim() || !state.job.company.trim()) {
      state.saveMessage = { text: "Title and company are required.", kind: "error" };
      renderFooter();
      return;
    }
    await persist();
  }

  // Opens Job Match with this posting prefilled. The page reads the tracked
  // job by id, so the job has to be saved first.
  async function tailor() {
    const id = state.saved?.id ?? (await persist());
    if (id) window.open(`${APP_BASE_URL}/job-match?job=${encodeURIComponent(id)}`, "_blank", "noopener");
  }

  // --- Lifecycle -----------------------------------------------------------

  async function init() {
    const status = await send("status");
    state.phase = status?.connected ? "ready" : "disconnected";
    renderAll();
    if (state.phase === "ready" && state.scan === "idle") void scan();
  }

  api.runtime.onMessage.addListener((message) => {
    if (message?.type === "toggle") setOpen(!state.open);
  });

  // Job sites like LinkedIn swap postings without a page load, so watch the
  // URL and rescan when it changes.
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    state.detected = looksLikeJobPage();
    tab.hidden = state.open || !state.detected;
    if (state.detected) mount();
    if (state.open && state.phase === "ready") void scan();
    else state.scan = "idle";
  }, 1000);

  state.detected = looksLikeJobPage();
  if (state.detected) {
    mount();
    tab.hidden = false;
  }
  panel.inert = true;
  renderAll();
})();
