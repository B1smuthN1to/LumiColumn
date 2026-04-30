// frontend.js — Column Layout Extension
// Registers a "Length" drawer tab with a 1–5 column slider.
// Applies a CSS grid-template-columns override to .v15ny_14 containers inside .v15ny_1 wrappers.

(function (ctx) {
  // ─── Constants ────────────────────────────────────────────────────────────
  const DEFAULT_COLUMNS = 3;

  // ─── State ────────────────────────────────────────────────────────────────
  let currentColumns = DEFAULT_COLUMNS;
  let removeStyle = null;
  let sliderEl = null;
  let labelEl = null;
  let previewCells = [];

  // ─── Column CSS injection ─────────────────────────────────────────────────
  function buildColumnCSS(cols) {
    // Target the character-grid container produced by v15ny_1 / v15ny_14.
    // We override with !important to ensure priority over the compiled CSS.
    return `
      /* Column Layout Extension — ${cols} column(s) */
      .v15ny_14 {
        grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important;
      }
    `;
  }

  function applyColumns(cols) {
    if (removeStyle) removeStyle();
    removeStyle = ctx.dom.addStyle(buildColumnCSS(cols));
  }

  // ─── Drawer tab UI ────────────────────────────────────────────────────────
  function buildPreviewGrid(cols) {
    if (!previewCells.length) return;
    const grid = previewCells[0].parentElement;
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  }

  function updateUI(cols) {
    if (sliderEl) sliderEl.value = cols;
    if (labelEl) labelEl.textContent = cols === 1 ? "1 column" : `${cols} columns`;
    buildPreviewGrid(cols);
  }

  function renderDrawerTab(root, initialColumns) {
    // Inline styles use Lumiverse CSS variables for theme compatibility.
    root.innerHTML = `
      <div style="
        padding: 18px 16px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        color: var(--lumiverse-text);
        font-family: inherit;
      ">

        <!-- Header -->
        <div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
            Grid Columns
          </div>
          <div style="font-size: 12px; color: var(--lumiverse-text-dim); line-height: 1.5;">
            Controls how many character cards appear per row in the grid.
          </div>
        </div>

        <!-- Slider section -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
          ">
            <span style="color: var(--lumiverse-text-muted);">Columns</span>
            <span id="cl-col-label" style="
              font-weight: 700;
              font-size: 13px;
              color: var(--lumiverse-accent);
              min-width: 60px;
              text-align: right;
            ">${initialColumns === 1 ? "1 column" : `${initialColumns} columns`}</span>
          </div>

          <!-- Slider row with markers -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input
              id="cl-col-slider"
              type="range"
              min="1"
              max="5"
              step="1"
              value="${initialColumns}"
              style="
                width: 100%;
                accent-color: var(--lumiverse-accent);
                cursor: pointer;
                height: 4px;
              "
            />
            <div style="
              display: flex;
              justify-content: space-between;
              padding: 0 2px;
              font-size: 11px;
              color: var(--lumiverse-text-dim);
              user-select: none;
            ">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>

        <!-- Mini preview grid -->
        <div>
          <div style="font-size: 12px; color: var(--lumiverse-text-muted); margin-bottom: 8px;">
            Preview
          </div>
          <div id="cl-preview-grid" style="
            display: grid;
            grid-template-columns: repeat(${initialColumns}, minmax(0, 1fr));
            gap: 6px;
            transition: grid-template-columns 0.2s ease;
          ">
            ${Array.from({ length: 5 }, (_, i) => `
              <div class="cl-preview-cell" data-index="${i}" style="
                aspect-ratio: 3/4;
                background: var(--lumiverse-fill-subtle);
                border: 1px solid var(--lumiverse-border);
                border-radius: var(--lumiverse-radius);
                display: flex;
                align-items: flex-end;
                padding: 6px;
                font-size: 10px;
                color: var(--lumiverse-text-dim);
                overflow: hidden;
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: 0; left: 0; right: 0; bottom: 0;
                  background: linear-gradient(
                    180deg,
                    transparent 40%,
                    var(--lumiverse-fill-subtle) 100%
                  );
                "></div>
                <span style="position: relative; z-index: 1;">Card ${i + 1}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Divider -->
        <div style="
          height: 1px;
          background: var(--lumiverse-border);
          margin: 0 -16px;
        "></div>

        <!-- Info footer -->
        <div style="
          font-size: 11px;
          color: var(--lumiverse-text-dim);
          line-height: 1.6;
        ">
          Targets the <code style="
            background: var(--lumiverse-fill-subtle);
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 10px;
          ">.v15ny_14</code> character grid. Changes apply immediately and persist across sessions.
        </div>
      </div>
    `;

    // Wire up references
    sliderEl = root.querySelector("#cl-col-slider");
    labelEl = root.querySelector("#cl-col-label");
    previewCells = Array.from(root.querySelectorAll(".cl-preview-cell"));

    // Slider event listener
    sliderEl.addEventListener("input", () => {
      const cols = parseInt(sliderEl.value, 10);
      currentColumns = cols;
      updateUI(cols);
      applyColumns(cols);
      ctx.sendToBackend({ type: "set_columns", columns: cols });
    });
  }

  // ─── Drawer tab registration ───────────────────────────────────────────────
  const tab = ctx.ui.registerDrawerTab({
    id: "length",
    title: "Column Layout",
    shortName: "Length",
    description: "Set the number of character grid columns (1–5)",
    keywords: ["columns", "grid", "layout", "cards", "width", "length"],
    headerTitle: "Length",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="4" height="14" rx="1"/>
      <rect x="8" y="3" width="4" height="14" rx="1"/>
      <rect x="14" y="3" width="4" height="14" rx="1"/>
    </svg>`,
  });

  // ─── Backend communication ─────────────────────────────────────────────────
  // Listen for backend replies
  ctx.onBackendMessage((payload) => {
    if (payload.type === "settings") {
      const cols = Math.min(5, Math.max(1, Number(payload.columns) || DEFAULT_COLUMNS));
      currentColumns = cols;
      applyColumns(cols);
      updateUI(cols);
    }
  });

  // Activate on tab open (lazy render)
  let rendered = false;
  tab.onActivate(() => {
    if (!rendered) {
      rendered = true;
      renderDrawerTab(tab.root, currentColumns);
    }
    updateUI(currentColumns);
  });

  // Request persisted settings from backend
  ctx.sendToBackend({ type: "get_settings" });

  // Apply default columns immediately while we wait for the backend response
  applyColumns(DEFAULT_COLUMNS);

  // Also re-apply whenever the DOM might re-render (e.g. route changes).
  // We watch for the target container appearing using a MutationObserver.
  const observer = new MutationObserver(() => {
    const grids = document.querySelectorAll(".v15ny_14");
    if (grids.length > 0) {
      applyColumns(currentColumns);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})(ctx);
