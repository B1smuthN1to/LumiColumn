// ─────────────────────────────────────────────────────────────────────────────
// Grid Column Override — frontend.ts
//
// Targets:
//   ._scrollContainer_v15ny_1  — the virtualizer scroll container
//   ._row_v15ny_14             — each virtualizer row
//   ._gridLayout_1xexo_62      — the card grid inside rows
//
// The extension injects a <style> block that forces grid-template-columns to
// repeat(N, 1fr) and watches the DOM for dynamically rendered rows so the
// style always stays in sync.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'grid_column_override__columns'
const DEFAULT_COLUMNS = 4
const MIN_COLUMNS = 1
const MAX_COLUMNS = 10

// CSS class name fragments extracted from the bundled CSS
const SCROLL_CONTAINER_SEL = '[class*="_scrollContainer_v15ny_"]'
const ROW_SEL = '[class*="_row_v15ny_"]'
const GRID_SEL = '[class*="_gridLayout_1xexo_"]'

// ── helpers ──────────────────────────────────────────────────────────────────

function loadColumns(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const n = parseInt(raw, 10)
      if (!isNaN(n) && n >= MIN_COLUMNS && n <= MAX_COLUMNS) return n
    }
  } catch {}
  return DEFAULT_COLUMNS
}

function saveColumns(n: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(n))
  } catch {}
}

// ── main setup ────────────────────────────────────────────────────────────────

export function setup(ctx: any) {
  let currentColumns = loadColumns()
  let removeGridStyle: (() => void) | null = null
  let removeSettingsStyle: (() => void) | null = null
  let mutationObserver: MutationObserver | null = null

  // ── Grid style injection ────────────────────────────────────────────────────

  function applyGridStyle(cols: number) {
    if (removeGridStyle) {
      removeGridStyle()
      removeGridStyle = null
    }

    removeGridStyle = ctx.dom.addStyle(`
      /* Grid Column Override — ${cols} column(s) */
      ${GRID_SEL} {
        grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important;
      }
    `)
  }

  // ── MutationObserver: keep style live as virtualizer renders new rows ───────

  function watchVirtualizer() {
    if (mutationObserver) return

    mutationObserver = new MutationObserver(() => {
      // Re-inject style when rows are added/changed so new cards pick it up
      applyGridStyle(currentColumns)
    })

    // Observe the scroll container if it exists, else observe body
    const root =
      document.querySelector(SCROLL_CONTAINER_SEL) ?? document.body

    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
    })
  }

  // ── Settings panel UI ───────────────────────────────────────────────────────

  function buildSettingsPanel(): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'gco-settings-wrap'

    wrap.innerHTML = `
      <div class="gco-field">
        <label class="gco-label" for="gco-col-input">
          Number of columns
          <span class="gco-hint">${MIN_COLUMNS}–${MAX_COLUMNS}</span>
        </label>
        <div class="gco-row">
          <input
            id="gco-col-input"
            class="gco-input"
            type="number"
            min="${MIN_COLUMNS}"
            max="${MAX_COLUMNS}"
            step="1"
            value="${currentColumns}"
          />
          <button class="gco-btn gco-btn-primary" id="gco-apply-btn">Apply</button>
        </div>
        <div class="gco-preview-row" aria-hidden="true">
          ${Array.from({ length: MAX_COLUMNS }, (_, i) => `<div class="gco-preview-cell" data-idx="${i + 1}"></div>`).join('')}
        </div>
        <p class="gco-hint-text">
          Overrides the card grid inside the virtualizer scroll container
          (<code>_scrollContainer_v15ny_1</code> → <code>_gridLayout_1xexo_62</code>).
          Default is <strong>${DEFAULT_COLUMNS}</strong> columns. Your setting is saved
          automatically.
        </p>
        <div class="gco-status" id="gco-status" aria-live="polite"></div>
      </div>
    `

    const input = wrap.querySelector<HTMLInputElement>('#gco-col-input')!
    const applyBtn = wrap.querySelector<HTMLButtonElement>('#gco-apply-btn')!
    const statusEl = wrap.querySelector<HTMLElement>('#gco-status')!
    const previewCells = wrap.querySelectorAll<HTMLElement>('.gco-preview-cell')

    function updatePreview(cols: number) {
      previewCells.forEach((cell, i) => {
        cell.classList.toggle('gco-preview-cell--active', i < cols)
      })
    }

    function showStatus(msg: string, type: 'ok' | 'err') {
      statusEl.textContent = msg
      statusEl.className = `gco-status gco-status--${type}`
      setTimeout(() => {
        statusEl.textContent = ''
        statusEl.className = 'gco-status'
      }, 2200)
    }

    updatePreview(currentColumns)

    input.addEventListener('input', () => {
      const val = parseInt(input.value, 10)
      if (!isNaN(val)) updatePreview(Math.min(Math.max(val, MIN_COLUMNS), MAX_COLUMNS))
    })

    applyBtn.addEventListener('click', () => {
      const raw = parseInt(input.value, 10)
      if (isNaN(raw) || raw < MIN_COLUMNS || raw > MAX_COLUMNS) {
        showStatus(`Please enter a number between ${MIN_COLUMNS} and ${MAX_COLUMNS}.`, 'err')
        input.focus()
        return
      }
      currentColumns = raw
      saveColumns(currentColumns)
      applyGridStyle(currentColumns)
      updatePreview(currentColumns)
      showStatus(`Applied — ${currentColumns} column${currentColumns !== 1 ? 's' : ''}.`, 'ok')
    })

    return wrap
  }

  // ── Settings mount ──────────────────────────────────────────────────────────

  function mountSettingsUI() {
    removeSettingsStyle = ctx.dom.addStyle(`
      /* ── Grid Column Override — Settings UI ─────────────────────────────── */
      .gco-settings-wrap {
        padding: 4px 0;
      }
      .gco-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .gco-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        color: var(--lumiverse-text);
      }
      .gco-hint {
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
        width: 80px;
        transition: border-color var(--lumiverse-transition-fast),
                    box-shadow  var(--lumiverse-transition-fast);
        -moz-appearance: textfield;
      }
      .gco-input::-webkit-outer-spin-button,
      .gco-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
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
        transition: background var(--lumiverse-transition-fast),
                    color    var(--lumiverse-transition-fast),
                    border-color var(--lumiverse-transition-fast);
        white-space: nowrap;
      }
      .gco-btn:hover {
        background: var(--lumiverse-fill-subtle);
        color: var(--lumiverse-text);
      }
      .gco-btn-primary {
        background: var(--lumiverse-primary);
        color: var(--lumiverse-primary-contrast, #fff);
        border-color: var(--lumiverse-primary);
      }
      .gco-btn-primary:hover {
        background: var(--lumiverse-primary-hover);
        color: var(--lumiverse-primary-contrast, #fff);
      }

      /* mini column preview strip */
      .gco-preview-row {
        display: flex;
        gap: 3px;
        height: 20px;
        margin-top: 2px;
      }
      .gco-preview-cell {
        flex: 1;
        border-radius: 3px;
        background: var(--lumiverse-fill-subtle);
        border: 1px solid var(--lumiverse-border);
        transition: background var(--lumiverse-transition-fast),
                    border-color var(--lumiverse-transition-fast);
      }
      .gco-preview-cell--active {
        background: var(--lumiverse-primary-010);
        border-color: var(--lumiverse-primary-020);
      }

      .gco-hint-text {
        font-size: 11px;
        line-height: 1.5;
        color: var(--lumiverse-text-dim);
        margin: 0;
      }
      .gco-hint-text code {
        background: var(--lumiverse-fill-subtle);
        border: 1px solid var(--lumiverse-border);
        border-radius: 3px;
        padding: 0 4px;
        font-size: 10px;
        font-family: var(--lumiverse-font-mono, monospace);
        color: var(--lumiverse-text-muted);
      }
      .gco-status {
        font-size: 12px;
        min-height: 18px;
        transition: color var(--lumiverse-transition-fast);
      }
      .gco-status--ok  { color: var(--lumiverse-success, #22c55e); }
      .gco-status--err { color: var(--lumiverse-danger,  #ef4444); }
    `)

    // Mount into settings_extensions slot (the extension settings section)
    const panel = buildSettingsPanel()

    // ctx.ui.mount injects into the known settings mount point
    try {
      ctx.ui.mount('settings_extensions', panel)
    } catch {
      // Fallback: inject via DOM helper if mount point API isn't available
      ctx.dom.inject('[data-ext-settings]', panel.outerHTML, 'beforeend')
    }
  }

  // ── Boot ────────────────────────────────────────────────────────────────────

  applyGridStyle(currentColumns)
  watchVirtualizer()
  mountSettingsUI()

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  return () => {
    mutationObserver?.disconnect()
    mutationObserver = null
    if (removeGridStyle) removeGridStyle()
    if (removeSettingsStyle) removeSettingsStyle()
    ctx.dom.cleanup()
  }
}
