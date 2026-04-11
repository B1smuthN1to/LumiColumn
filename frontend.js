/**
 * Grid Column Layout — dist/frontend.js
 * Compiled from src/frontend.ts — ready to install as a Lumiverse extension.
 *
 * Targets:
 *   ._scrollContainer_v15ny_1  (scroll container)
 *   ._row_v15ny_14             (card row → becomes N-column grid)
 *
 * No gated permissions required.
 */

const STORAGE_KEY  = 'columnCount';
const DEFAULT_COLS = 3;
const MIN_COLS     = 1;
const MAX_COLS     = 5;

const ROW_SELECTOR       = '[class*="_row_v15ny_"]';
const CONTAINER_SELECTOR = '[class*="_scrollContainer_v15ny_"]';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function updateSliderFill(slider, value) {
  const pct = ((value - MIN_COLS) / (MAX_COLS - MIN_COLS)) * 100;
  slider.style.background = [
    'linear-gradient(to right,',
    `var(--lumiverse-primary,#9370db) 0%,`,
    `var(--lumiverse-primary,#9370db) ${pct}%,`,
    `var(--lumiverse-fill-medium,#00000040) ${pct}%,`,
    `var(--lumiverse-fill-medium,#00000040) 100%)`,
  ].join(' ');
}

// ─── Settings panel ────────────────────────────────────────────────────────────

function buildSettingsUI(root, initialCols, onChange) {
  // Scoped styles
  const style = document.createElement('style');
  style.textContent = `
    .gcl-panel{display:flex;flex-direction:column;gap:24px;padding:20px 16px;
      font-family:var(--lumiverse-font-family,system-ui,sans-serif);
      color:var(--lumiverse-text,#ffffffe6)}
    .gcl-header{display:flex;flex-direction:column;gap:6px}
    .gcl-header h2{font-size:15px;font-weight:700;letter-spacing:.01em;
      color:var(--lumiverse-text,#ffffffe6);margin:0}
    .gcl-header p{font-size:12px;color:var(--lumiverse-text-muted,#ffffffa6);
      margin:0;line-height:1.5}
    .gcl-section{display:flex;flex-direction:column;gap:14px}
    .gcl-label-row{display:flex;align-items:baseline;justify-content:space-between}
    .gcl-label{font-size:13px;font-weight:600;color:var(--lumiverse-text,#ffffffe6)}
    .gcl-value-badge{font-size:13px;font-weight:700;
      color:var(--lumiverse-primary,#9370db);
      background:var(--lumiverse-primary-010,#9370db1a);
      border:1px solid var(--lumiverse-primary-020,#9370db33);
      border-radius:6px;padding:2px 10px;min-width:32px;text-align:center;
      transition:background var(--lumiverse-transition-fast,.15s ease)}
    .gcl-slider-wrap{position:relative;padding:4px 0}
    .gcl-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;
      border-radius:3px;outline:none;cursor:pointer;touch-action:none;min-height:unset}
    .gcl-slider::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:transparent}
    .gcl-slider::-moz-range-track{height:6px;border-radius:3px;background:transparent;border:none}
    .gcl-slider::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;
      border-radius:50%;background:var(--lumiverse-primary,#9370db);
      border:2px solid var(--lumiverse-bg,#1c1826);
      box-shadow:0 0 0 1px var(--lumiverse-primary-020,#9370db33),0 1px 4px rgba(0,0,0,.4);
      cursor:pointer;margin-top:-8px;transition:background var(--lumiverse-transition-fast,.15s ease)}
    .gcl-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;
      background:var(--lumiverse-primary,#9370db);
      border:2px solid var(--lumiverse-bg,#1c1826);
      box-shadow:0 0 0 1px var(--lumiverse-primary-020,#9370db33),0 1px 4px rgba(0,0,0,.4);cursor:pointer}
    .gcl-slider:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--lumiverse-primary-020,#9370db33)}
    .gcl-tick-row{display:flex;justify-content:space-between;padding:0 2px;margin-top:4px}
    .gcl-tick{font-size:11px;color:var(--lumiverse-text-dim,#fff6);width:20px;text-align:center;
      cursor:pointer;transition:color var(--lumiverse-transition-fast,.15s ease);user-select:none}
    .gcl-tick:hover{color:var(--lumiverse-text-muted,#ffffffa6)}
    .gcl-tick.active{color:var(--lumiverse-primary,#9370db);font-weight:700}
    .gcl-preview{display:flex;flex-direction:column;gap:8px}
    .gcl-preview-label{font-size:11px;font-weight:600;letter-spacing:.06em;
      text-transform:uppercase;color:var(--lumiverse-text-dim,#fff6)}
    .gcl-preview-grid{display:grid;gap:5px;padding:10px;
      background:var(--lumiverse-bg-dark,#00000026);
      border:1px solid var(--lumiverse-border,#9370db1f);
      border-radius:var(--lumiverse-radius,8px);
      transition:grid-template-columns .2s ease}
    .gcl-preview-card{height:44px;border-radius:6px;
      background:var(--lumiverse-card-bg,
        linear-gradient(165deg,#1c1826 0%,#181422 50%,#14111e 100%));
      border:1px solid var(--lumiverse-border,#9370db1f);
      display:flex;align-items:center;gap:8px;padding:0 8px;overflow:hidden}
    .gcl-preview-avatar{width:22px;height:22px;border-radius:50%;
      background:var(--lumiverse-primary-010,#9370db1a);
      border:1px solid var(--lumiverse-border,#9370db1f);flex-shrink:0}
    .gcl-preview-line{flex:1;height:6px;border-radius:3px;
      background:var(--lumiverse-fill-medium,#00000040)}
    .gcl-divider{height:1px;background:var(--lumiverse-border,#9370db1f)}
    .gcl-hint{font-size:11px;color:var(--lumiverse-text-dim,#fff6);line-height:1.5;
      padding:10px 12px;border-radius:var(--lumiverse-radius-sm,5px);
      background:var(--lumiverse-fill-subtle,#0000001a);
      border:1px solid var(--lumiverse-border-light,#8080801f)}
  `;
  root.appendChild(style);

  // Panel
  const panel = document.createElement('div');
  panel.className = 'gcl-panel';

  // ── Header ────────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'gcl-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Grid Column Layout';
  const desc = document.createElement('p');
  desc.textContent =
    'Set how many columns the character/content browser uses. ' +
    'Changes apply instantly and are saved for next time.';
  header.appendChild(h2);
  header.appendChild(desc);
  panel.appendChild(header);

  const divider = document.createElement('div');
  divider.className = 'gcl-divider';
  panel.appendChild(divider);

  // ── Columns section ───────────────────────────────────────────────────────
  const section = document.createElement('div');
  section.className = 'gcl-section';

  // Label + live badge
  const labelRow = document.createElement('div');
  labelRow.className = 'gcl-label-row';
  const labelEl = document.createElement('span');
  labelEl.className = 'gcl-label';
  labelEl.textContent = 'Number of Columns';
  const badge = document.createElement('span');
  badge.className = 'gcl-value-badge';
  badge.textContent = String(initialCols);
  labelRow.appendChild(labelEl);
  labelRow.appendChild(badge);
  section.appendChild(labelRow);

  // Slider
  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'gcl-slider-wrap';
  const slider = document.createElement('input');
  slider.type      = 'range';
  slider.className = 'gcl-slider';
  slider.min       = String(MIN_COLS);
  slider.max       = String(MAX_COLS);
  slider.step      = '1';
  slider.value     = String(initialCols);
  slider.setAttribute('aria-label', 'Number of columns');
  updateSliderFill(slider, initialCols);
  sliderWrap.appendChild(slider);
  section.appendChild(sliderWrap);

  // Tick row (1 – 5)
  const tickRow = document.createElement('div');
  tickRow.className = 'gcl-tick-row';
  for (let i = MIN_COLS; i <= MAX_COLS; i++) {
    const tick = document.createElement('span');
    tick.className = 'gcl-tick' + (i === initialCols ? ' active' : '');
    tick.textContent = String(i);
    tick.dataset.col = String(i);
    tick.addEventListener('click', () => {
      slider.value = String(i);
      slider.dispatchEvent(new Event('input'));
    });
    tickRow.appendChild(tick);
  }
  section.appendChild(tickRow);

  // ── Live preview ──────────────────────────────────────────────────────────
  const preview = document.createElement('div');
  preview.className = 'gcl-preview';
  const previewLabel = document.createElement('span');
  previewLabel.className = 'gcl-preview-label';
  previewLabel.textContent = 'Preview';
  preview.appendChild(previewLabel);

  const previewGrid = document.createElement('div');
  previewGrid.className = 'gcl-preview-grid';
  previewGrid.style.gridTemplateColumns = `repeat(${initialCols}, 1fr)`;
  for (let i = 0; i < 5; i++) {
    const card = document.createElement('div');
    card.className = 'gcl-preview-card';
    const avatar = document.createElement('div');
    avatar.className = 'gcl-preview-avatar';
    const line = document.createElement('div');
    line.className = 'gcl-preview-line';
    card.appendChild(avatar);
    card.appendChild(line);
    previewGrid.appendChild(card);
  }
  preview.appendChild(previewGrid);
  section.appendChild(preview);

  panel.appendChild(section);

  // Hint
  const hint = document.createElement('p');
  hint.className = 'gcl-hint';
  hint.textContent =
    'Tip: 2–3 columns works well on most screen sizes. ' +
    'Wider viewports can comfortably accommodate 4 or 5 columns.';
  panel.appendChild(hint);

  root.appendChild(panel);

  // ── Reactivity ──────────────────────────────────────────────────────────────
  const allTicks = tickRow.querySelectorAll('.gcl-tick');

  slider.addEventListener('input', () => {
    const val = clamp(parseInt(slider.value, 10), MIN_COLS, MAX_COLS);

    badge.textContent = String(val);
    updateSliderFill(slider, val);

    allTicks.forEach(t =>
      t.classList.toggle('active', parseInt(t.dataset.col, 10) === val)
    );

    previewGrid.style.gridTemplateColumns = `repeat(${val}, 1fr)`;
    onChange(val);
  });
}

// ─── Main entry ────────────────────────────────────────────────────────────────

export default async function main(ctx) {
  // ── Load persisted column count ──────────────────────────────────────────
  let columns = DEFAULT_COLS;
  try {
    const stored = await ctx.storage.get(STORAGE_KEY);
    if (stored !== null && stored !== undefined) {
      const parsed = parseInt(String(stored), 10);
      if (!isNaN(parsed)) columns = clamp(parsed, MIN_COLS, MAX_COLS);
    }
  } catch (_) {
    // storage unavailable — use default
  }

  // ── Apply grid CSS ────────────────────────────────────────────────────────
  let removeStyle = null;

  function applyGridStyle(cols) {
    if (removeStyle) removeStyle();
    removeStyle = ctx.dom.addStyle(`
      /* Grid Column Layout — active styles */

      /* Allow vertical scroll on the container */
      ${CONTAINER_SELECTOR} {
        overflow: hidden auto !important;
      }

      /* Reflow the card row as a grid */
      ${ROW_SELECTOR} {
        display: grid !important;
        grid-template-columns: repeat(${cols}, 1fr) !important;
        gap: 10px !important;
        padding: 10px !important;
        flex-wrap: unset !important;
        overflow: unset !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      /* Each card fills its cell */
      ${ROW_SELECTOR} > * {
        width: 100% !important;
        min-width: 0 !important;
        flex-shrink: unset !important;
      }
    `);
  }

  applyGridStyle(columns);

  // Re-stamp a data attribute when the scroll container re-mounts so devtools
  // can confirm the extension is active, and so future hooks can key off it.
  const observer = new MutationObserver(() => {
    const container = document.querySelector(CONTAINER_SELECTOR);
    if (container && !container.getAttribute('data-gcl-active')) {
      container.setAttribute('data-gcl-active', '1');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Register the Settings drawer tab ─────────────────────────────────────
  const GEAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83
      2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1
      1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0
      0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0
      4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0
      0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
      l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1
      4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2
      2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0
      1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`;

  const tab = ctx.ui.registerDrawerTab({
    id: 'gcl-settings',
    title: 'Grid Columns',
    iconSvg: GEAR_SVG,
  });

  buildSettingsUI(tab.root, columns, async (newCols) => {
    columns = newCols;
    applyGridStyle(columns);
    try {
      await ctx.storage.set(STORAGE_KEY, String(columns));
    } catch (_) {
      // best-effort persist
    }
  });
}
