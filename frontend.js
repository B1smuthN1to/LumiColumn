// dist/frontend.js
// Card Column Control — frontend module
//
// What this does:
//   1. Registers a drawer tab with a polished column-picker UI
//   2. On load, fetches the saved preference from the backend
//   3. When the user changes the value, tells the backend + applies the override
//   4. Applies the override by injecting a <style> tag that forces grid columns
//      AND by patching the ResizeObserver min-column behaviour via a MutationObserver
//      that watches for the grid rows and rewrites gridTemplateColumns in-place.

export default function init(ctx) {
  // ─── State ────────────────────────────────────────────────────────────────
  let currentColumns = 3;
  let styleTag = null;
  let patchObserver = null;

  // ─── Drawer tab ───────────────────────────────────────────────────────────
  const tab = ctx.ui.registerDrawerTab({
    id: "col-control",
    title: "Columns",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="4" height="14" rx="1"/>
      <rect x="8" y="3" width="4" height="14" rx="1"/>
      <rect x="14" y="3" width="4" height="14" rx="1"/>
    </svg>`,
  });

  // ─── Inject tab CSS ────────────────────────────────────────────────────────
  ctx.ui.injectStyle(`
    .ccc-root {
      font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
      padding: 18px 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 0;
      color: var(--lumiverse-text, #e8e0f0);
    }

    .ccc-eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--lumiverse-text-dim, #9080a8);
      margin-bottom: 12px;
    }

    .ccc-card {
      background: var(--lumiverse-surface-2, rgba(255,255,255,.045));
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,.08));
      border-radius: 12px;
      padding: 18px 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ccc-preview {
      display: grid;
      gap: 5px;
      height: 52px;
      transition: grid-template-columns 200ms cubic-bezier(.4,0,.2,1);
    }

    .ccc-preview-cell {
      border-radius: 5px;
      background: var(--lumiverse-primary, #9370db);
      opacity: .25;
      transition: opacity 200ms;
    }
    .ccc-preview-cell.active { opacity: .75; }

    .ccc-label-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .ccc-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--lumiverse-text, #e8e0f0);
    }

    .ccc-value-badge {
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
      color: var(--lumiverse-primary, #9370db);
      font-variant-numeric: tabular-nums;
      min-width: 28px;
      text-align: right;
    }

    .ccc-slider-wrap {
      position: relative;
      height: 28px;
      display: flex;
      align-items: center;
    }

    .ccc-track {
      position: absolute;
      left: 0; right: 0;
      height: 4px;
      border-radius: 99px;
      background: var(--lumiverse-border, rgba(255,255,255,.1));
      pointer-events: none;
    }

    .ccc-fill {
      position: absolute;
      left: 0;
      height: 4px;
      border-radius: 99px;
      background: var(--lumiverse-primary, #9370db);
      pointer-events: none;
      transition: width 120ms;
    }

    .ccc-range {
      position: relative;
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      height: 28px;
      background: transparent;
      cursor: pointer;
      outline: none;
      z-index: 1;
    }
    .ccc-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--lumiverse-primary, #9370db);
      border: 2px solid var(--lumiverse-bg, #1a1425);
      box-shadow: 0 0 0 0 rgba(147,112,219,.4);
      transition: box-shadow 150ms;
    }
    .ccc-range:focus::-webkit-slider-thumb,
    .ccc-range:active::-webkit-slider-thumb {
      box-shadow: 0 0 0 5px rgba(147,112,219,.3);
    }
    .ccc-range::-moz-range-thumb {
      width: 18px; height: 18px;
      border-radius: 50%;
      background: var(--lumiverse-primary, #9370db);
      border: 2px solid var(--lumiverse-bg, #1a1425);
    }

    .ccc-step-row {
      display: flex;
      gap: 6px;
    }

    .ccc-step {
      flex: 1;
      height: 32px;
      border-radius: 7px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,.1));
      background: transparent;
      color: var(--lumiverse-text-dim, #9080a8);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 120ms, color 120ms, border-color 120ms;
    }
    .ccc-step:hover {
      background: var(--lumiverse-surface-2, rgba(255,255,255,.06));
      color: var(--lumiverse-text, #e8e0f0);
    }
    .ccc-step.active {
      background: color-mix(in srgb, var(--lumiverse-primary, #9370db) 18%, transparent);
      border-color: var(--lumiverse-primary, #9370db);
      color: var(--lumiverse-primary, #9370db);
    }

    .ccc-number-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ccc-number-label {
      flex: 1;
      font-size: 11px;
      color: var(--lumiverse-text-dim, #9080a8);
    }

    .ccc-number-input {
      width: 56px;
      height: 30px;
      border-radius: 7px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,.1));
      background: var(--lumiverse-surface-2, rgba(255,255,255,.04));
      color: var(--lumiverse-text, #e8e0f0);
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      outline: none;
      transition: border-color 120ms;
      -moz-appearance: textfield;
    }
    .ccc-number-input::-webkit-outer-spin-button,
    .ccc-number-input::-webkit-inner-spin-button { -webkit-appearance: none; }
    .ccc-number-input:focus {
      border-color: var(--lumiverse-primary, #9370db);
    }

    .ccc-hint {
      font-size: 10.5px;
      color: var(--lumiverse-text-dim, #9080a8);
      line-height: 1.5;
      margin-top: 2px;
    }

    .ccc-status {
      font-size: 11px;
      font-weight: 600;
      min-height: 16px;
      color: var(--lumiverse-success, #22c55e);
      opacity: 0;
      transition: opacity 300ms;
      text-align: center;
    }
    .ccc-status.show { opacity: 1; }
    .ccc-status.error { color: var(--lumiverse-danger, #ef4444); }
  `);

  // ─── Build tab DOM ─────────────────────────────────────────────────────────
  const MIN = 1;
  const MAX = 10;
  const PRESETS = [1, 2, 3, 4, 5, 6];

  const root = document.createElement("div");
  root.className = "ccc-root";

  root.innerHTML = `
    <div class="ccc-eyebrow">Character Grid</div>
    <div class="ccc-card">

      <!-- Live mini-preview -->
      <div class="ccc-preview" id="ccc-preview"></div>

      <!-- Label + big number -->
      <div class="ccc-label-row">
        <span class="ccc-label">Columns per row</span>
        <span class="ccc-value-badge" id="ccc-badge">3</span>
      </div>

      <!-- Slider -->
      <div class="ccc-slider-wrap">
        <div class="ccc-track"></div>
        <div class="ccc-fill" id="ccc-fill"></div>
        <input class="ccc-range" id="ccc-range" type="range" min="${MIN}" max="${MAX}" step="1" value="3">
      </div>

      <!-- Preset buttons -->
      <div class="ccc-step-row" id="ccc-steps">
        ${PRESETS.map(n => `<button class="ccc-step" data-n="${n}">${n}</button>`).join("")}
      </div>

      <!-- Direct number input -->
      <div class="ccc-number-row">
        <span class="ccc-number-label">Or type a value (1–10):</span>
        <input class="ccc-number-input" id="ccc-number" type="number" min="${MIN}" max="${MAX}" value="3">
      </div>

      <div class="ccc-hint">Changes apply instantly to the character browser grid. Your preference is saved automatically.</div>
      <div class="ccc-status" id="ccc-status"></div>
    </div>
  `;

  tab.root.appendChild(root);

  // ─── DOM refs ──────────────────────────────────────────────────────────────
  const previewEl   = root.querySelector("#ccc-preview");
  const badgeEl     = root.querySelector("#ccc-badge");
  const fillEl      = root.querySelector("#ccc-fill");
  const rangeEl     = root.querySelector("#ccc-range");
  const stepsEl     = root.querySelector("#ccc-steps");
  const numberEl    = root.querySelector("#ccc-number");
  const statusEl    = root.querySelector("#ccc-status");

  // ─── Helpers ───────────────────────────────────────────────────────────────
  let statusTimer = null;

  function showStatus(msg, isError = false) {
    clearTimeout(statusTimer);
    statusEl.textContent = msg;
    statusEl.className = "ccc-status show" + (isError ? " error" : "");
    statusTimer = setTimeout(() => {
      statusEl.className = "ccc-status";
    }, 2400);
  }

  function updateUI(n) {
    const pct = ((n - MIN) / (MAX - MIN)) * 100;

    badgeEl.textContent = n;
    rangeEl.value = n;
    numberEl.value = n;
    fillEl.style.width = pct + "%";

    // Preview cells
    previewEl.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    previewEl.innerHTML = Array.from({ length: n })
      .map((_, i) => `<div class="ccc-preview-cell${i === 0 ? " active" : ""}"></div>`)
      .join("");

    // Preset buttons
    stepsEl.querySelectorAll(".ccc-step").forEach(btn => {
      btn.classList.toggle("active", parseInt(btn.dataset.n) === n);
    });
  }

  // ─── Apply override to the page ───────────────────────────────────────────
  //
  // Strategy: inject a <style> that overrides the inline gridTemplateColumns
  // on any ._row_v15ny_14 element. Because the row style is set inline via JS,
  // we can't beat it with a stylesheet rule alone — so we ALSO run a lightweight
  // MutationObserver that patches new row elements as they're added to the DOM.

  function applyColumnOverride(n) {
    currentColumns = n;

    // 1. Style-tag override (for rows that already exist or get added)
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "ccc-override";
      document.head.appendChild(styleTag);
    }
    // The !important here wins over the inline style
    styleTag.textContent = `
      ._row_v15ny_14 {
        grid-template-columns: repeat(${n}, 1fr) !important;
      }
    `;

    // 2. MutationObserver — patches inline style on each new row element
    //    (the virtualizer sets gridTemplateColumns inline per row)
    if (patchObserver) patchObserver.disconnect();

    patchObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          patchRow(node);
          node.querySelectorAll("._row_v15ny_14").forEach(patchRow);
        }
      }
    });

    // Patch existing rows immediately
    document.querySelectorAll("._row_v15ny_14").forEach(patchRow);

    // Watch the whole app for new rows
    patchObserver.observe(document.body, { childList: true, subtree: true });
  }

  function patchRow(el) {
    if (!el.classList.contains("_row_v15ny_14")) return;
    // Force the column count — overrides whatever the virtualizer set
    el.style.setProperty("grid-template-columns", `repeat(${currentColumns}, 1fr)`, "important");
  }

  // ─── Event wiring ─────────────────────────────────────────────────────────

  function commitValue(n) {
    n = Math.max(MIN, Math.min(MAX, n));
    if (!Number.isFinite(n)) return;
    updateUI(n);
    applyColumnOverride(n);
    ctx.sendToBackend({ type: "set_columns", columns: n });
  }

  rangeEl.addEventListener("input", () => {
    commitValue(parseInt(rangeEl.value, 10));
  });

  stepsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".ccc-step");
    if (!btn) return;
    commitValue(parseInt(btn.dataset.n, 10));
  });

  numberEl.addEventListener("change", () => {
    const n = parseInt(numberEl.value, 10);
    if (Number.isFinite(n)) commitValue(n);
  });
  numberEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const n = parseInt(numberEl.value, 10);
      if (Number.isFinite(n)) commitValue(n);
    }
  });

  // ─── Backend messages ─────────────────────────────────────────────────────
  ctx.onBackendMessage((payload) => {
    if (!payload) return;

    if (payload.type === "columns_value") {
      currentColumns = payload.columns;
      updateUI(payload.columns);
      applyColumnOverride(payload.columns);
      return;
    }

    if (payload.type === "columns_error") {
      showStatus(payload.message, true);
    }
  });

  // ─── Init: ask backend for saved value ────────────────────────────────────
  updateUI(currentColumns);          // render default immediately
  applyColumnOverride(currentColumns);
  ctx.sendToBackend({ type: "get_columns" });

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  // Returned from init — called when the extension is disabled/removed
  return () => {
    if (patchObserver) patchObserver.disconnect();
    if (styleTag && styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
    tab.destroy();
  };
}
