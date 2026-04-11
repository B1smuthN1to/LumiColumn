/**
 * char_grid_columns — frontend.js
 *
 * Settings managed:
 *  • columns  (1–12)   — number of cards per row
 *  • gap      (4–32px) — spacing between cards
 *  • radius   (0–24px) — card corner radius override
 *  • nameSize (10–18px)— card name font-size override
 *
 * DOM targets (identified from minified source):
 *   _scrollContainer_v15ny_1  → virtualised scroll container
 *   _row_v15ny_14             → each virtual row div (inline grid styles)
 *   _card_q6j3q_1             → card root element
 *   _name_q6j3q_178           → card name label
 *   _info_q6j3q_171           → card info area (padding)
 *   _imageWrap_q6j3q_40       → card image wrapper
 *
 * The virtual list writes inline `grid-template-columns` and `gap` on every
 * row. Because inline styles beat any CSS rule, we use a MutationObserver to
 * patch those properties on every row as it is mounted.
 */

// ── Selectors ──────────────────────────────────────────────────────────────
const SEL_SCROLL = "._scrollContainer_v15ny_1";
const CLS_ROW    = "_row_v15ny_14";
const CLS_CARD   = "_card_q6j3q_1";
const CLS_NAME   = "_name_q6j3q_178";
const CLS_INFO   = "_info_q6j3q_171";

// ── Defaults (mirror the app's own values) ─────────────────────────────────
const DEFAULTS = { columns: 4, gap: 16, radius: 16, nameSize: 14 };
const LIMITS   = {
  columns:  { min: 1,  max: 12 },
  gap:      { min: 4,  max: 32 },
  radius:   { min: 0,  max: 24 },
  nameSize: { min: 10, max: 18 },
};

export default async function frontend(ctx) {

  // ── 1. Load all saved settings ────────────────────────────────────────────
  let cfg = { ...DEFAULTS };

  try {
    const res = await ctx.backend.send({ type: "GET_SETTINGS" });
    if (res && res.settings) cfg = { ...DEFAULTS, ...res.settings };
  } catch (_) { /* use defaults */ }

  // ── 2. CSS injection ──────────────────────────────────────────────────────
  // CSS vars are used for the properties that CSS can win on.
  // Inline-style properties (grid-template-columns, gap on rows) are handled
  // by the MutationObserver below.
  ctx.dom.addStyle(`
    :root {
      --cgc-radius:    ${cfg.radius}px;
      --cgc-name-size: ${cfg.nameSize}px;
    }

    /* Card corner radius */
    .${CLS_CARD} {
      border-radius: var(--cgc-radius) !important;
    }

    /* Card name font size */
    .${CLS_NAME} {
      font-size: var(--cgc-name-size) !important;
    }

    /* Row fallback — the observer handles inline overrides but this
       covers any brief flash before the observer fires. */
    .${CLS_ROW} {
      grid-template-columns: repeat(var(--cgc-columns, ${cfg.columns}), 1fr) !important;
      gap: var(--cgc-gap, ${cfg.gap}px) !important;
    }
  `);

  // Set initial CSS vars
  function applyCSSVars(c) {
    const r = document.documentElement;
    r.style.setProperty("--cgc-columns",  String(c.columns));
    r.style.setProperty("--cgc-gap",      `${c.gap}px`);
    r.style.setProperty("--cgc-radius",   `${c.radius}px`);
    r.style.setProperty("--cgc-name-size",`${c.nameSize}px`);
  }
  applyCSSVars(cfg);

  // ── 3. MutationObserver — patch inline styles on virtual rows ─────────────
  function patchRows() {
    document.querySelectorAll(`.${CLS_ROW}`).forEach((row) => {
      if (row.style.gridTemplateColumns) {
        row.style.gridTemplateColumns = `repeat(${cfg.columns}, 1fr)`;
      }
      if (row.style.gap !== undefined) {
        row.style.gap = `${cfg.gap}px`;
      }
      // Also patch the padding so cards don't crowd the container edges
      row.style.paddingLeft  = `${cfg.gap / 2}px`;
      row.style.paddingRight = `${cfg.gap / 2}px`;
      row.style.paddingBottom= `${cfg.gap}px`;
    });
  }

  const observer = new MutationObserver(patchRows);

  function attachObserver() {
    const el = document.querySelector(SEL_SCROLL);
    if (el) {
      observer.observe(el, { childList: true, subtree: true });
      patchRows();
      return true;
    }
    return false;
  }

  // Retry with backoff until the container appears
  let retries = 0;
  function tryAttach() {
    if (!attachObserver() && retries++ < 6) {
      setTimeout(tryAttach, 300 * Math.min(retries, 4));
    }
  }
  tryAttach();

  ctx.events.on("route_change", () => {
    observer.disconnect();
    retries = 0;
    setTimeout(tryAttach, 300);
  });

  // ── 4. Master apply function ──────────────────────────────────────────────
  function applyAll(patch) {
    cfg = { ...cfg, ...patch };
    applyCSSVars(cfg);
    patchRows();
  }

  // ── 5. Drawer Tab — settings UI ──────────────────────────────────────────
  const tab = ctx.ui.registerDrawerTab({
    id: "cgc_settings",
    title: "Grid Columns",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2"  y="2" width="4" height="16" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="8"  y="2" width="4" height="16" rx="1" fill="currentColor" opacity="0.6"/>
      <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" opacity="0.3"/>
    </svg>`,
  });

  // ── Build HTML ─────────────────────────────────────────────────────────────
  tab.root.innerHTML = `
    <div class="cgc-panel">

      <!-- ── Header ── -->
      <header class="cgc-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" class="cgc-icon-primary">
          <rect x="2"  y="2" width="4" height="16" rx="1" fill="currentColor"/>
          <rect x="8"  y="2" width="4" height="16" rx="1" fill="currentColor" opacity="0.65"/>
          <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" opacity="0.35"/>
        </svg>
        <span class="cgc-header-title">Character Grid Columns</span>
        <span class="cgc-badge" id="cgc-unsaved-badge" style="display:none">Unsaved</span>
      </header>

      <!-- ── Live mini-preview ── -->
      <div class="cgc-preview-wrap">
        <p class="cgc-section-label">Preview</p>
        <div class="cgc-preview" id="cgc-preview">
          <!-- filled by JS -->
        </div>
      </div>

      <!-- ── Columns ── -->
      <div class="cgc-field">
        <div class="cgc-field-header">
          <label class="cgc-field-label" for="cgc-col-input">Columns</label>
          <span class="cgc-field-value" id="cgc-col-display">${cfg.columns}</span>
        </div>
        <input id="cgc-col-input" class="cgc-slider" type="range"
               min="${LIMITS.columns.min}" max="${LIMITS.columns.max}" step="1" value="${cfg.columns}"/>
        <div class="cgc-presets">
          ${[1,2,3,4,5,6,8,10,12].map(n =>
            `<button class="cgc-chip${n === cfg.columns ? " cgc-chip--active" : ""}"
                     data-field="columns" data-val="${n}">${n}</button>`
          ).join("")}
        </div>
      </div>

      <!-- ── Gap ── -->
      <div class="cgc-field">
        <div class="cgc-field-header">
          <label class="cgc-field-label" for="cgc-gap-input">Card gap</label>
          <span class="cgc-field-value" id="cgc-gap-display">${cfg.gap}px</span>
        </div>
        <input id="cgc-gap-input" class="cgc-slider" type="range"
               min="${LIMITS.gap.min}" max="${LIMITS.gap.max}" step="2" value="${cfg.gap}"/>
      </div>

      <!-- ── Card radius ── -->
      <div class="cgc-field">
        <div class="cgc-field-header">
          <label class="cgc-field-label" for="cgc-radius-input">Card radius</label>
          <span class="cgc-field-value" id="cgc-radius-display">${cfg.radius}px</span>
        </div>
        <input id="cgc-radius-input" class="cgc-slider" type="range"
               min="${LIMITS.radius.min}" max="${LIMITS.radius.max}" step="1" value="${cfg.radius}"/>
        <div class="cgc-presets">
          ${[0,6,10,16,24].map(n =>
            `<button class="cgc-chip${n === cfg.radius ? " cgc-chip--active" : ""}"
                     data-field="radius" data-val="${n}">${n === 0 ? "None" : n === 24 ? "Full" : n + "px"}</button>`
          ).join("")}
        </div>
      </div>

      <!-- ── Name font size ── -->
      <div class="cgc-field">
        <div class="cgc-field-header">
          <label class="cgc-field-label" for="cgc-name-input">Name size</label>
          <span class="cgc-field-value" id="cgc-name-display">${cfg.nameSize}px</span>
        </div>
        <input id="cgc-name-input" class="cgc-slider" type="range"
               min="${LIMITS.nameSize.min}" max="${LIMITS.nameSize.max}" step="1" value="${cfg.nameSize}"/>
      </div>

      <!-- ── Actions ── -->
      <div class="cgc-actions">
        <button id="cgc-reset-btn" class="cgc-btn cgc-btn--ghost">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset
        </button>
        <button id="cgc-save-btn" class="cgc-btn cgc-btn--primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Save
        </button>
      </div>

      <div id="cgc-status" class="cgc-status" aria-live="polite"></div>

    </div>
  `;

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const colSlider    = tab.root.querySelector("#cgc-col-input");
  const gapSlider    = tab.root.querySelector("#cgc-gap-input");
  const radSlider    = tab.root.querySelector("#cgc-radius-input");
  const nameSlider   = tab.root.querySelector("#cgc-name-input");
  const colDisplay   = tab.root.querySelector("#cgc-col-display");
  const gapDisplay   = tab.root.querySelector("#cgc-gap-display");
  const radDisplay   = tab.root.querySelector("#cgc-radius-display");
  const nameDisplay  = tab.root.querySelector("#cgc-name-display");
  const saveBtn      = tab.root.querySelector("#cgc-save-btn");
  const resetBtn     = tab.root.querySelector("#cgc-reset-btn");
  const statusEl     = tab.root.querySelector("#cgc-status");
  const unsavedBadge = tab.root.querySelector("#cgc-unsaved-badge");
  const previewEl    = tab.root.querySelector("#cgc-preview");
  const allChips     = tab.root.querySelectorAll(".cgc-chip");

  // ── Live preview ───────────────────────────────────────────────────────────
  function renderPreview() {
    const n = cfg.columns;
    const g = cfg.gap;
    const r = cfg.radius;
    // Show up to 8 mock cards, capped to 2 rows
    const count = Math.min(n * 2, 8);
    previewEl.style.gap = `${Math.round(g * 0.4)}px`;
    previewEl.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    previewEl.innerHTML = Array.from({ length: count }, (_, i) => `
      <div class="cgc-mock-card" style="border-radius:${Math.round(r * 0.5)}px">
        <div class="cgc-mock-img"></div>
        <div class="cgc-mock-name"></div>
      </div>`).join("");
  }
  renderPreview();

  // ── Unsaved state tracking ────────────────────────────────────────────────
  let savedCfg = { ...cfg };
  function setUnsaved(yes) {
    unsavedBadge.style.display = yes ? "inline-flex" : "none";
  }
  function isDirty() {
    return JSON.stringify(cfg) !== JSON.stringify(savedCfg);
  }

  // ── Chip helpers ──────────────────────────────────────────────────────────
  function syncChips(field, val) {
    allChips.forEach((c) => {
      if (c.dataset.field === field) {
        c.classList.toggle("cgc-chip--active", Number(c.dataset.val) === val);
      }
    });
  }

  // ── Slider wiring ─────────────────────────────────────────────────────────
  function wireSlider(slider, field, displayEl, unit, cb) {
    slider.addEventListener("input", () => {
      const v = parseInt(slider.value, 10);
      displayEl.textContent = v + unit;
      applyAll({ [field]: v });
      renderPreview();
      syncChips(field, v);
      setUnsaved(isDirty());
      if (cb) cb(v);
    });
  }

  wireSlider(colSlider,  "columns",  colDisplay,  "",    null);
  wireSlider(gapSlider,  "gap",      gapDisplay,  "px",  null);
  wireSlider(radSlider,  "radius",   radDisplay,  "px",  null);
  wireSlider(nameSlider, "nameSize", nameDisplay, "px",  null);

  // ── Chip clicks ───────────────────────────────────────────────────────────
  allChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const field = chip.dataset.field;
      const val   = Number(chip.dataset.val);
      // sync the matching slider
      const sliders = { columns: colSlider, radius: radSlider };
      if (sliders[field]) sliders[field].value = String(val);
      // sync display
      const displays = {
        columns: colDisplay,
        radius:  radDisplay,
      };
      const units = { columns: "", radius: "px" };
      if (displays[field]) displays[field].textContent = val + (units[field] || "");
      applyAll({ [field]: val });
      renderPreview();
      syncChips(field, val);
      setUnsaved(isDirty());
    });
  });

  // ── Reset ─────────────────────────────────────────────────────────────────
  resetBtn.addEventListener("click", () => {
    applyAll({ ...DEFAULTS });
    // sync sliders
    colSlider.value  = String(cfg.columns);
    gapSlider.value  = String(cfg.gap);
    radSlider.value  = String(cfg.radius);
    nameSlider.value = String(cfg.nameSize);
    // sync displays
    colDisplay.textContent  = cfg.columns;
    gapDisplay.textContent  = cfg.gap  + "px";
    radDisplay.textContent  = cfg.radius  + "px";
    nameDisplay.textContent = cfg.nameSize + "px";
    // sync chips
    syncChips("columns", cfg.columns);
    syncChips("radius",  cfg.radius);
    renderPreview();
    setUnsaved(isDirty());
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  saveBtn.addEventListener("click", async () => {
    const snapshot = { ...cfg };
    saveBtn.disabled = true;
    statusEl.textContent = "";

    try {
      await ctx.backend.send({ type: "SET_SETTINGS", settings: snapshot });
      savedCfg = { ...snapshot };
      setUnsaved(false);
      statusEl.textContent = "✓ Saved";
      statusEl.className   = "cgc-status cgc-status--ok";
    } catch (_) {
      statusEl.textContent = "⚠ Could not save — changes apply this session only.";
      statusEl.className   = "cgc-status cgc-status--warn";
    } finally {
      saveBtn.disabled = false;
      setTimeout(() => { statusEl.textContent = ""; statusEl.className = "cgc-status"; }, 3500);
    }
  });

  // ── 6. Panel + card CSS ────────────────────────────────────────────────────
  ctx.dom.addStyle(`
    /* ── Panel shell ─────────────────────────────────────── */
    .cgc-panel {
      padding: 14px 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      font-family: var(--lumiverse-font-family);
      color: var(--lumiverse-text);
      min-height: 0;
      overflow-y: auto;
    }

    .cgc-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--lumiverse-text);
      padding-bottom: 12px;
      border-bottom: 1px solid var(--lumiverse-border);
    }

    .cgc-header-title { flex: 1; }

    .cgc-icon-primary { color: var(--lumiverse-primary); flex-shrink: 0; }

    .cgc-badge {
      background: var(--lumiverse-warning-020, #f59e0b33);
      color: var(--lumiverse-warning);
      border: 1px solid var(--lumiverse-warning-050, #f59e0b80);
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      letter-spacing: .03em;
    }

    /* ── Mini preview ────────────────────────────────────── */
    .cgc-preview-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cgc-preview {
      display: grid;
      background: var(--lumiverse-bg-dark, #00000026);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius, 8px);
      padding: 8px;
      transition: grid-template-columns .2s ease, gap .2s ease;
    }

    .cgc-mock-card {
      background: var(--lumiverse-card-bg, linear-gradient(165deg,#1c1826 0%,#181422 50%,#14111e 100%));
      border: 1px solid var(--lumiverse-border-neutral, #80808026);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-radius .2s ease;
    }

    .cgc-mock-img {
      background: var(--lumiverse-card-image-bg, linear-gradient(135deg,#14111c 0%,#1c1628 100%));
      aspect-ratio: 3/4;
      width: 100%;
    }

    .cgc-mock-name {
      height: 6px;
      background: var(--lumiverse-fill-medium, #00000040);
      border-radius: 3px;
      margin: 6px 6px 5px;
    }

    /* ── Section label ───────────────────────────────────── */
    .cgc-section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--lumiverse-text-muted);
    }

    /* ── Field row ───────────────────────────────────────── */
    .cgc-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cgc-field-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .cgc-field-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--lumiverse-text-muted);
    }

    .cgc-field-value {
      font-size: 12px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--lumiverse-primary);
      min-width: 32px;
      text-align: right;
    }

    /* ── Range slider ────────────────────────────────────── */
    .cgc-slider {
      width: 100%;
      height: 4px;
      appearance: none;
      background: var(--lumiverse-fill-medium, #00000040);
      border-radius: 2px;
      cursor: pointer;
      touch-action: none;
      min-height: unset;
    }

    .cgc-slider::-webkit-slider-runnable-track {
      background: var(--lumiverse-fill-medium, #00000040);
      border-radius: 2px;
      height: 4px;
    }
    .cgc-slider::-moz-range-track {
      background: var(--lumiverse-fill-medium, #00000040);
      border: none;
      border-radius: 2px;
      height: 4px;
    }
    .cgc-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      background: var(--lumiverse-primary, #8c82ff);
      border: 2px solid var(--lumiverse-bg, #1c1826);
      width: 18px;
      height: 18px;
      border-radius: 50%;
      box-shadow: 0 0 0 1px var(--lumiverse-primary-020, #8c82ff33);
      cursor: pointer;
      margin-top: -7px;
    }
    .cgc-slider::-moz-range-thumb {
      background: var(--lumiverse-primary, #8c82ff);
      border: 2px solid var(--lumiverse-bg, #1c1826);
      width: 18px;
      height: 18px;
      border-radius: 50%;
      box-shadow: 0 0 0 1px var(--lumiverse-primary-020, #8c82ff33);
      cursor: pointer;
    }
    .cgc-slider:focus { outline: none; }
    .cgc-slider:focus-visible::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px var(--lumiverse-primary-020, #8c82ff33);
    }

    /* ── Preset chips ────────────────────────────────────── */
    .cgc-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .cgc-chip {
      background: var(--lumiverse-fill-subtle, #0000001a);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      color: var(--lumiverse-text-muted);
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 10px;
      transition: background var(--lumiverse-transition-fast),
                  color var(--lumiverse-transition-fast),
                  border-color var(--lumiverse-transition-fast);
    }
    .cgc-chip:hover {
      background: var(--lumiverse-fill-hover, #0003);
      color: var(--lumiverse-text);
    }
    .cgc-chip--active {
      background: var(--lumiverse-primary-015, #9370db26);
      border-color: var(--lumiverse-primary-muted);
      color: var(--lumiverse-primary);
    }

    /* ── Actions ─────────────────────────────────────────── */
    .cgc-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding-top: 4px;
    }

    .cgc-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: 8px;
      border: 1px solid var(--lumiverse-border);
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      padding: 7px 16px;
      transition: background var(--lumiverse-transition-fast),
                  color var(--lumiverse-transition-fast);
    }
    .cgc-btn:disabled { opacity: .4; cursor: not-allowed; }

    .cgc-btn--ghost {
      background: transparent;
      color: var(--lumiverse-text-muted);
    }
    .cgc-btn--ghost:hover {
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
    }

    .cgc-btn--primary {
      background: var(--lumiverse-primary);
      border-color: var(--lumiverse-primary);
      color: var(--lumiverse-primary-contrast, #fff);
    }
    .cgc-btn--primary:hover {
      background: var(--lumiverse-primary-hover);
    }

    /* ── Status line ─────────────────────────────────────── */
    .cgc-status {
      font-size: 12px;
      min-height: 16px;
      text-align: right;
      color: var(--lumiverse-text-dim);
    }
    .cgc-status--ok   { color: var(--lumiverse-success); }
    .cgc-status--warn { color: var(--lumiverse-warning); }
  `);
}
