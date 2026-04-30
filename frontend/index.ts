import type { SpindleFrontendAPI } from "lumiverse/spindle";

export default function activate(api: SpindleFrontendAPI) {
  const STYLE_ID = "column-layout-style";
  const DEFAULT_COLUMNS = 2;

  // ─── CSS class names discovered from the compiled bundle ─────────
  //  v15ny_1  → the individual card container class
  //  v15ny_14 → the parent grid / wrapper that holds all card containers
  const CARD_CLASS = "v15ny_1";
  const GRID_CLASS = "v15ny_14";

  // ──────────────────────────────────────────────────────────────────
  //  1.  Inject / update the dynamic stylesheet
  // ──────────────────────────────────────────────────────────────────
  function applyColumns(count: number) {
    const clamped = Math.max(1, Math.min(5, count));

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    // The grid parent gets an explicit column template.
    // Each card stretches to fill its column.
    style.textContent = `
      /* Column Layout extension — dynamic columns */
      .${GRID_CLASS} {
        display: grid !important;
        grid-template-columns: repeat(${clamped}, 1fr) !important;
        gap: 12px !important;
      }

      .${GRID_CLASS} > .${CARD_CLASS} {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
      }

      /* Responsive: on narrow viewports, fall back to fewer columns */
      @media (max-width: 768px) {
        .${GRID_CLASS} {
          grid-template-columns: repeat(${Math.min(clamped, 2)}, 1fr) !important;
        }
      }

      @media (max-width: 480px) {
        .${GRID_CLASS} {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    // Update the slider thumb position if it exists
    const slider = document.getElementById("col-layout-slider") as HTMLInputElement | null;
    if (slider && Number(slider.value) !== clamped) {
      slider.value = String(clamped);
    }

    const label = document.getElementById("col-layout-label");
    if (label) {
      label.textContent = `${clamped} Column${clamped > 1 ? "s" : ""}`;
    }
  }

  // ──────────────────────────────────────────────────────────────────
  //  2.  Build the drawer tab UI
  // ──────────────────────────────────────────────────────────────────
  function buildDrawerContent(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;flex-direction:column;gap:16px;padding:16px;font-family:inherit;";

    // Title
    const title = document.createElement("h3");
    title.textContent = "Column Layout";
    title.style.cssText = "margin:0;font-size:1.1rem;font-weight:600;color:var(--text-primary, #e0e0e0);";
    wrapper.appendChild(title);

    // Description
    const desc = document.createElement("p");
    desc.textContent = "Choose how many columns of character cards to display.";
    desc.style.cssText = "margin:0;font-size:0.85rem;color:var(--text-secondary, #aaa);line-height:1.4;";
    wrapper.appendChild(desc);

    // Slider container
    const sliderContainer = document.createElement("div");
    sliderContainer.style.cssText = "display:flex;flex-direction:column;gap:8px;";

    // Current value label
    const valueLabel = document.createElement("span");
    valueLabel.id = "col-layout-label";
    valueLabel.textContent = `${DEFAULT_COLUMNS} Columns`;
    valueLabel.style.cssText =
      "font-size:0.95rem;font-weight:500;text-align:center;color:var(--text-primary, #e0e0e0);";
    sliderContainer.appendChild(valueLabel);

    // Range input
    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = "col-layout-slider";
    slider.min = "1";
    slider.max = "5";
    slider.step = "1";
    slider.value = String(DEFAULT_COLUMNS);
    slider.style.cssText = `
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--surface-tertiary, #333);
      outline: none;
      cursor: pointer;
    `;
    sliderContainer.appendChild(slider);

    // Min / Max labels
    const minMaxRow = document.createElement("div");
    minMaxRow.style.cssText = "display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary, #888);";
    const minLabel = document.createElement("span");
    minLabel.textContent = "1";
    const maxLabel = document.createElement("span");
    maxLabel.textContent = "5";
    minMaxRow.appendChild(minLabel);
    minMaxRow.appendChild(maxLabel);
    sliderContainer.appendChild(minMaxRow);

    wrapper.appendChild(sliderContainer);

    // ── Slider event ────────────────────────────────────────────────
    slider.addEventListener("input", () => {
      const val = Number(slider.value);
      valueLabel.textContent = `${val} Column${val > 1 ? "s" : ""}`;
      applyColumns(val);
    });

    // Persist on change (mouseup / touchend)
    slider.addEventListener("change", () => {
      const val = Number(slider.value);
      api.sendToBackend("column-layout:set", { columns: val });
    });

    return wrapper;
  }

  // ──────────────────────────────────────────────────────────────────
  //  3.  Register the drawer tab via the UI Placement API
  // ──────────────────────────────────────────────────────────────────
  api.ui.addDrawerTab({
    id: "column-layout-tab",
    label: "Length",
    icon: "columns",          // Lucide icon name used by Lumiverse
    content: buildDrawerContent(),
  });

  // ──────────────────────────────────────────────────────────────────
  //  4.  Fetch initial column count from backend storage
  // ──────────────────────────────────────────────────────────────────
  api.sendToBackend("column-layout:get").then((response: any) => {
    const cols = response?.columns ?? DEFAULT_COLUMNS;
    applyColumns(cols);
  });

  // ──────────────────────────────────────────────────────────────────
  //  5.  Listen for live updates (other tabs / devices)
  // ──────────────────────────────────────────────────────────────────
  api.events.on("column-layout:updated", (payload: any) => {
    applyColumns(payload?.columns ?? DEFAULT_COLUMNS);
  });
}
