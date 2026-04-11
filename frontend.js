// ─────────────────────────────────────────────────────────────────────────────
// Grid Column Override — dist/frontend.js  (compiled, no build step needed)
//
// Targets Lumiverse virtualizer containers:
//   _scrollContainer_v15ny_1  → scroll host
//   _row_v15ny_14             → each virtual row
//   _gridLayout_1xexo_62      → card grid inside rows
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'grid_column_override__columns'
const DEFAULT_COLS  = 4
const MIN_COLS      = 1
const MAX_COLS      = 10

const SCROLL_SEL = '[class*="_scrollContainer_v15ny_"]'
const GRID_SEL   = '[class*="_gridLayout_1xexo_"]'

// ── persistence ───────────────────────────────────────────────────────────────

function loadCols() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const n = parseInt(raw, 10)
      if (!isNaN(n) && n >= MIN_COLS && n <= MAX_COLS) return n
    }
  } catch (_) {}
  return DEFAULT_COLS
}

function saveCols(n) {
  try { localStorage.setItem(STORAGE_KEY, String(n)) } catch (_) {}
}

// ── main ──────────────────────────────────────────────────────────────────────

export function setup(ctx) {
  let currentCols   = loadCols()
  let removeGrid    = null
  let removeStyles  = null
  let observer      = null

  // ── apply override style ──────────────────────────────────────────────────

  function applyGrid(cols) {
    if (removeGrid) { removeGrid(); removeGrid = null }
    removeGrid = ctx.dom.addStyle(`
      /* Grid Column Override — active: ${cols} col(s) */
      ${GRID_SEL} {
        grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important;
      }
    `)
  }

  // ── watch virtualizer so style survives row recycling ────────────────────

  function watchDOM() {
    if (observer) return
    observer = new MutationObserver(() => applyGrid(currentCols))
    observer.observe(
      document.querySelector(SCROLL_SEL) ?? document.body,
      { childList: true, subtree: true }
    )
  }

  // ── settings panel ────────────────────────────────────────────────────────

  function buildPanel() {
    const wrap = document.createElement('div')
    wrap.className = 'gco-wrap'

    // preview cells HTML
    const cells = Array.from({ length: MAX_COLS }, (_, i) =>
      `<div class="gco-cell" data-i="${i + 1}"></div>`
    ).join('')

    wrap.innerHTML = `
      <div class="gco-field">
        <label class="gco-lbl" for="gco-inp">
          Number of columns
          <span class="gco-badge">${MIN_COLS}–${MAX_COLS}</span>
        </label>

        <div class="gco-row">
          <input id="gco-inp" class="gco-input" type="number"
            min="${MIN_COLS}" max="${MAX_COLS}" step="1" value="${currentCols}" />
          <button class="gco-btn gco-primary" id="gco-apply">Apply</button>
        </div>

        <div class="gco-preview">${cells}</div>

        <p class="gco-note">
          Sets <code>grid-template-columns</code> on
          <code>_gridLayout_1xexo_62</code> inside the virtualizer scroll
          container (<code>_scrollContainer_v15ny_1</code>).
          Default is <strong>${DEFAULT_COLS}</strong>. Saved automatically.
        </p>

        <div class="gco-status" id="gco-st" aria-live="polite"></div>
      </div>
    `

    const inp    = wrap.querySelector('#gco-inp')
    const applyB = wrap.querySelector('#gco-apply')
    const st     = wrap.querySelector('#gco-st')
    const cells_ = wrap.querySelectorAll('.gco-cell')

    function refreshPreview(n) {
      cells_.forEach((c, i) => c.classList.toggle('gco-cell--on', i < n))
    }

    function flash(msg, type) {
      st.textContent = msg
      st.className = `gco-status gco-st--${type}`
      setTimeout(() => { st.textContent = ''; st.className = 'gco-status' }, 2400)
    }

    refreshPreview(currentCols)

    inp.addEventListener('input', () => {
      const v = parseInt(inp.value, 10)
      if (!isNaN(v)) refreshPreview(Math.min(Math.max(v, MIN_COLS), MAX_COLS))
    })

    applyB.addEventListener('click', () => {
      const v = parseInt(inp.value, 10)
      if (isNaN(v) || v < MIN_COLS || v > MAX_COLS) {
        flash(`Enter a number from ${MIN_COLS} to ${MAX_COLS}.`, 'err')
        inp.focus()
        return
      }
      currentCols = v
      saveCols(currentCols)
      applyGrid(currentCols)
      refreshPreview(currentCols)
      flash(`Applied — ${currentCols} column${currentCols !== 1 ? 's' : ''}.`, 'ok')
    })

    return wrap
  }

  // ── settings styles ───────────────────────────────────────────────────────

  function mountSettings() {
    removeStyles = ctx.dom.addStyle(`
      .gco-wrap { padding: 4px 0; }

      .gco-field {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .gco-lbl {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        color: var(--lumiverse-text);
      }

      .gco-badge {
        font-size: 11px;
        font-weight: 400;
        color: var(--lumiverse-text-dim);
        border: 1px solid var(--lumiverse-border);
        border-radius: 4px;
        padding: 1px 6px;
      }

      .gco-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .gco-input {
        background: var(--lumiverse-bg, #0003);
        border: 1px solid var(--lumiverse-border);
        border-radius: 8px;
        color: var(--lumiverse-text);
        font-family: inherit;
        font-size: 13px;
        padding: 8px 12px;
        width: 84px;
        transition: border-color var(--lumiverse-transition-fast),
                    box-shadow  var(--lumiverse-transition-fast);
        -moz-appearance: textfield;
      }
      .gco-input::-webkit-inner-spin-button,
      .gco-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      .gco-input:focus {
        border-color: var(--lumiverse-primary-muted);
        box-shadow: 0 0 0 3px var(--lumiverse-primary-010);
        outline: none;
      }

      .gco-btn {
        border-radius: var(--lumiverse-radius, 8px);
        border: 1px solid var(--lumiverse-border);
        color: var(--lumiverse-text-muted);
        cursor: pointer;
        font-family: inherit;
        font-size: 13px;
        font-weight: 500;
        padding: 8px 14px;
        background: transparent;
        white-space: nowrap;
        transition: background var(--lumiverse-transition-fast),
                    color var(--lumiverse-transition-fast),
                    border-color var(--lumiverse-transition-fast);
      }
      .gco-btn:hover {
        background: var(--lumiverse-fill-subtle);
        color: var(--lumiverse-text);
      }
      .gco-primary {
        background: var(--lumiverse-primary);
        color: var(--lumiverse-primary-contrast, #fff);
        border-color: var(--lumiverse-primary);
      }
      .gco-primary:hover {
        background: var(--lumiverse-primary-hover, var(--lumiverse-primary));
        color: var(--lumiverse-primary-contrast, #fff);
      }

      /* column preview strip */
      .gco-preview {
        display: flex;
        gap: 3px;
        height: 22px;
      }
      .gco-cell {
        flex: 1;
        border-radius: 3px;
        background: var(--lumiverse-fill-subtle);
        border: 1px solid var(--lumiverse-border);
        transition: background var(--lumiverse-transition-fast),
                    border-color var(--lumiverse-transition-fast);
      }
      .gco-cell--on {
        background: var(--lumiverse-primary-010);
        border-color: var(--lumiverse-primary-020);
      }

      .gco-note {
        font-size: 11px;
        line-height: 1.5;
        color: var(--lumiverse-text-dim);
        margin: 0;
      }
      .gco-note code {
        background: var(--lumiverse-fill-subtle);
        border: 1px solid var(--lumiverse-border);
        border-radius: 3px;
        padding: 0 4px;
        font-size: 10px;
        font-family: var(--lumiverse-font-mono, monospace);
        color: var(--lumiverse-text-muted);
      }

      .gco-status { font-size: 12px; min-height: 18px; }
      .gco-st--ok  { color: var(--lumiverse-success, #22c55e); }
      .gco-st--err { color: var(--lumiverse-danger, #ef4444); }
    `)

    const panel = buildPanel()

    // Try official settings mount first, fall back to DOM injection
    if (ctx.ui && typeof ctx.ui.mount === 'function') {
      try {
        ctx.ui.mount('settings_extensions', panel)
        return
      } catch (_) {}
    }
    // Fallback: append serialised HTML (DOMPurify sanitised by host)
    ctx.dom.inject('[data-spindle-ext-settings]', panel.outerHTML, 'beforeend')
  }

  // ── boot ─────────────────────────────────────────────────────────────────

  applyGrid(currentCols)
  watchDOM()
  mountSettings()

  // ── teardown ──────────────────────────────────────────────────────────────

  return () => {
    if (observer) { observer.disconnect(); observer = null }
    if (removeGrid)   removeGrid()
    if (removeStyles) removeStyles()
    ctx.dom.cleanup()
  }
}
