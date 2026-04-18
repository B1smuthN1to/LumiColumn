// frontend.ts — Column Layout extension
import type { SpindleFrontendContext } from "lumiverse-spindle-types";

export function setup(ctx: SpindleFrontendContext) {
  // ── State ─────────────────────────────────────────────────────────────────
  let currentColumns = 2;
  let removeStyle: (() => void) | null = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Build the CSS that forces v15ny_14 inside every v15ny_1 to use N columns */
  function buildGridCSS(n: number): string {
    return `
      /* Column Layout extension – ${n} column(s) */
      .v15ny_1 .v15ny_14 {
        display: grid !important;
        grid-template-columns: repeat(${n}, minmax(0, 1fr)) !important;
        gap: 12px !important;
      }

      /* Make direct children (cards) fill their grid cell */
      .v15ny_1 .v15ny_14 > * {
        width: 100% !important;
        min-width: 0 !important;
      }

      /* Inject a card-like polish when multiple columns are active */
      ${n > 1 ? `
      .v15ny_1 .v15ny_14 > * {
        border-radius: var(--lumiverse-radius) !important;
        border: 1px solid var(--lumiverse-border) !important;
        background: var(--lumiverse-fill-subtle) !important;
        padding: 10px !important;
        transition: border-color var(--lumiverse-transition-fast),
                    box-shadow var(--lumiverse-transition-fast) !important;
      }
      .v15ny_1 .v15ny_14 > *:hover {
        border-color: var(--lumiverse-border-hover) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,.15) !important;
      }
      ` : ""}
    `;
  }

  /** Apply (or re-apply) the column CSS override */
  function applyColumns(n: number) {
    currentColumns = n;
    if (removeStyle) removeStyle();
    removeStyle = ctx.dom.addStyle(buildGridCSS(n));
  }

  // ── Settings UI (Drawer Tab) ──────────────────────────────────────────────

  const tab = ctx.ui.registerDrawerTab({
    id: "column-settings",
    title: "Column Layout",
    iconSvg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"
        xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="5" height="14" rx="1"
        fill="currentColor" opacity=".9"/>
      <rect x="7.5" y="3" width="5" height="14" rx="1"
        fill="currentColor" opacity=".9"/>
      <rect x="14" y="3" width="5" height="14" rx="1"
        fill="currentColor" opacity=".9"/>
    </svg>`,
  });

  // Inject settings HTML into the drawer tab
  tab.root.innerHTML = `
    <div class="cl-settings">
      <h2 class="cl-title">Column Layout</h2>
      <p class="cl-desc">
        Controls how many columns are displayed inside
        <code>v15ny_14</code> containers.
      </p>

      <div class="cl-field">
        <div class="cl-label-row">
          <label class="cl-label" for="cl-slider">Columns</label>
          <span class="cl-badge" id="cl-badge">2</span>
        </div>

        <input
          id="cl-slider"
          class="cl-slider"
          type="range"
          min="1"
          max="5"
          step="1"
          value="2"
        />

        <div class="cl-tick-row">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>

      <div class="cl-preview" id="cl-preview">
        <!-- live card preview injected by JS -->
      </div>

      <p class="cl-hint">Changes take effect immediately.</p>
    </div>
  `;

  // Style the settings tab
  ctx.dom.addStyle(`
    .cl-settings {
      padding: 16px;
      font-family: inherit;
      color: var(--lumiverse-text);
    }
    .cl-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 6px;
      color: var(--lumiverse-text);
    }
    .cl-desc {
      font-size: .825rem;
      color: var(--lumiverse-text-muted);
      margin: 0 0 20px;
      line-height: 1.5;
    }
    .cl-desc code {
      background: var(--lumiverse-fill);
      border: 1px solid var(--lumiverse-border);
      border-radius: 3px;
      padding: 1px 4px;
      font-size: .8rem;
    }
    .cl-field {
      margin-bottom: 20px;
    }
    .cl-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .cl-label {
      font-size: .875rem;
      font-weight: 500;
      color: var(--lumiverse-text);
    }
    .cl-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 22px;
      padding: 0 6px;
      border-radius: 99px;
      background: var(--lumiverse-accent);
      color: var(--lumiverse-accent-fg);
      font-size: .8rem;
      font-weight: 700;
    }
    .cl-slider {
      width: 100%;
      accent-color: var(--lumiverse-accent);
      cursor: pointer;
      margin: 0;
    }
    .cl-tick-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 2px 0;
      font-size: .75rem;
      color: var(--lumiverse-text-dim);
      user-select: none;
    }
    .cl-preview {
      display: grid;
      gap: 8px;
      margin-top: 16px;
    }
    .cl-card {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      padding: 12px 10px;
      font-size: .8rem;
      color: var(--lumiverse-text-muted);
      text-align: center;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cl-hint {
      font-size: .775rem;
      color: var(--lumiverse-text-dim);
      margin: 10px 0 0;
      text-align: center;
    }
  `);

  // ── Preview renderer ───────────────────────────────────────────────────────

  function renderPreview(n: number) {
    const preview = tab.root.querySelector("#cl-preview") as HTMLElement | null;
    if (!preview) return;
    preview.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    preview.innerHTML = Array.from(
      { length: Math.min(n * 2, 10) },
      (_, i) => `<div class="cl-card">Card ${i + 1}</div>`
    ).join("");
  }

  // ── Slider wiring ─────────────────────────────────────────────────────────

  function syncSlider(n: number) {
    const slider = tab.root.querySelector("#cl-slider") as HTMLInputElement | null;
    const badge = tab.root.querySelector("#cl-badge") as HTMLElement | null;
    if (slider) slider.value = String(n);
    if (badge) badge.textContent = String(n);
    renderPreview(n);
  }

  const slider = tab.root.querySelector("#cl-slider") as HTMLInputElement | null;
  if (slider) {
    slider.addEventListener("input", (e) => {
      const n = parseInt((e.target as HTMLInputElement).value, 10);
      const badge = tab.root.querySelector("#cl-badge") as HTMLElement | null;
      if (badge) badge.textContent = String(n);
      renderPreview(n);
      applyColumns(n);
      // Persist via backend
      ctx.sendToBackend({ type: "set_columns", columns: n });
    });
  }

  // ── Backend message handler ────────────────────────────────────────────────

  ctx.onBackendMessage((payload: any) => {
    if (
      payload.type === "init_columns" ||
      payload.type === "columns_updated"
    ) {
      const n = Math.max(1, Math.min(5, Number(payload.columns) || 2));
      applyColumns(n);
      syncSlider(n);
    }
  });

  // ── Request current value from backend ────────────────────────────────────
  ctx.sendToBackend({ type: "get_columns" });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  return () => {
    if (removeStyle) removeStyle();
    ctx.dom.cleanup();
    tab.destroy();
  };
}
