/**
 * Grid Column Control — frontend.js
 *
 * What this does:
 *  1. Injects a <style> block that overrides ._row_v15ny_14 grid columns
 *     on ._scrollContainer_v15ny_1 (the character/volume scroll container).
 *  2. Adds a "Grid Columns" number input directly below the Font Scale slider
 *     inside the Theme > Controls section, matching Lumiverse's native UI style
 *     exactly (same classes: _row_jcp4m_7, _label_jcp4m_13, _value_jcp4m_39).
 *  3. Persists settings via the backend worker (userStorage).
 *
 * Layout landmarks (from the minified source):
 *   ._scrollContainer_v15ny_1   — outer scroll container for the character grid
 *   ._row_v15ny_14              — the CSS-grid row that holds character cards
 *   ._controls_jcp4m_1          — the "Controls" fieldset inside Theme settings
 *   ._row_jcp4m_7               — individual slider row
 *   ._label_jcp4m_13            — row label
 *   ._slider_jcp4m_21           — range input
 *   ._value_jcp4m_39            — value display span
 *
 * Insertion target:
 *   We watch for the Controls block to appear in the DOM, then append our
 *   row after the last child (below UI Scale / Glass effects).
 */

;(function () {
  // ── Constants ──────────────────────────────────────────────────────────────
  const DEFAULT_COLUMNS = 4
  const MIN_COLUMNS = 1
  const MAX_COLUMNS = 10
  const EXT_ID = 'gcc' // short unique prefix for our DOM nodes

  // CSS class names extracted from the minified bundle
  const CLS = {
    scrollContainer: '_scrollContainer_v15ny_1',
    gridRow:         '_row_v15ny_14',
    controls:        '_controls_jcp4m_1',
    sliderRow:       '_row_jcp4m_7',
    label:           '_label_jcp4m_13',
    slider:          '_slider_jcp4m_21',
    value:           '_value_jcp4m_39',
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let currentColumns = DEFAULT_COLUMNS
  let removeStyle = null
  let settingsRowEl = null
  let controlsObserver = null
  let inputEl = null
  let valueEl = null

  // ── Style injection ────────────────────────────────────────────────────────
  function applyGridStyle(columns) {
    if (removeStyle) removeStyle()

    removeStyle = ctx.dom.addStyle(`
      /* Grid Column Control — ${columns} col override */
      .${CLS.scrollContainer} .${CLS.gridRow} {
        grid-template-columns: repeat(${columns}, minmax(0, 1fr)) !important;
      }
    `)
  }

  // ── Settings row (inserted into Theme > Controls) ──────────────────────────
  function buildSettingsRow(columns) {
    const row = document.createElement('label')
    row.id = `${EXT_ID}-settings-row`
    row.className = CLS.sliderRow
    row.style.cssText = 'cursor:default;'

    // Label — matches native "Font Scale", "UI Scale" labels exactly
    const lbl = document.createElement('span')
    lbl.className = CLS.label
    lbl.textContent = 'Grid Columns'

    // Number input — styled to match the native range slider track area
    inputEl = document.createElement('input')
    inputEl.type = 'number'
    inputEl.id = `${EXT_ID}-input`
    inputEl.min = String(MIN_COLUMNS)
    inputEl.max = String(MAX_COLUMNS)
    inputEl.step = '1'
    inputEl.value = String(columns)
    inputEl.style.cssText = [
      'flex:1',
      'min-width:0',
      'background:var(--lumiverse-bg,#0003)',
      'border:1px solid var(--lumiverse-border)',
      'color:var(--lumiverse-text)',
      'border-radius:6px',
      'padding:3px 8px',
      'font-family:inherit',
      'font-size:12px',
      'font-weight:500',
      'text-align:center',
      'outline:none',
      'transition:border-color var(--lumiverse-transition-fast), box-shadow var(--lumiverse-transition-fast)',
      '-moz-appearance:textfield',
      'appearance:textfield',
    ].join(';')

    // Remove spinner arrows (webkit)
    ctx.dom.addStyle(`
      #${EXT_ID}-input::-webkit-outer-spin-button,
      #${EXT_ID}-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
      #${EXT_ID}-input:focus {
        border-color:var(--lumiverse-primary-muted);
        box-shadow:0 0 0 3px var(--lumiverse-primary-010);
      }
    `)

    // Value badge — same pattern as "1.0x" / "1.00x" in native rows
    valueEl = document.createElement('span')
    valueEl.className = CLS.value
    valueEl.style.width = '28px'
    valueEl.textContent = String(columns)

    // Stepper buttons (– and +) flanking the input for quick touch-friendly adjustment
    const btnMinus = makeStepBtn('−', -1)
    const btnPlus  = makeStepBtn('+',  1)

    inputEl.addEventListener('input', () => {
      const v = clampColumns(Number(inputEl.value))
      valueEl.textContent = String(v)
    })
    inputEl.addEventListener('change', () => {
      const v = clampColumns(Number(inputEl.value))
      inputEl.value = String(v)
      valueEl.textContent = String(v)
      commitColumns(v)
    })
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') inputEl.blur()
    })

    row.appendChild(lbl)
    row.appendChild(btnMinus)
    row.appendChild(inputEl)
    row.appendChild(btnPlus)
    row.appendChild(valueEl)

    return row
  }

  function makeStepBtn(label, delta) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = label
    btn.style.cssText = [
      'flex-shrink:0',
      'width:24px',
      'height:24px',
      'border-radius:5px',
      'border:1px solid var(--lumiverse-border)',
      'background:var(--lumiverse-fill-subtle)',
      'color:var(--lumiverse-text-muted)',
      'cursor:pointer',
      'font-size:14px',
      'line-height:1',
      'padding:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'transition:background var(--lumiverse-transition-fast),color var(--lumiverse-transition-fast)',
    ].join(';')
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'var(--lumiverse-fill-hover)'
      btn.style.color = 'var(--lumiverse-text)'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'var(--lumiverse-fill-subtle)'
      btn.style.color = 'var(--lumiverse-text-muted)'
    })
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const next = clampColumns(currentColumns + delta)
      setColumns(next, true)
    })
    return btn
  }

  function clampColumns(n) {
    if (!Number.isFinite(n) || isNaN(n)) return DEFAULT_COLUMNS
    return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.round(n)))
  }

  function setColumns(n, save) {
    currentColumns = n
    applyGridStyle(n)
    // Sync UI if present
    if (inputEl) inputEl.value = String(n)
    if (valueEl) valueEl.textContent = String(n)
    if (save) commitColumns(n)
  }

  function commitColumns(n) {
    currentColumns = n
    applyGridStyle(n)
    ctx.sendToBackend({ type: 'SAVE_SETTINGS', columns: n })
  }

  // ── DOM injection into Theme > Controls ───────────────────────────────────
  function tryInjectSettingsRow() {
    // Already injected?
    if (document.getElementById(`${EXT_ID}-settings-row`)) return

    // Find the Controls fieldset
    const controlsEl = document.querySelector(`.${CLS.controls}`)
    if (!controlsEl) return

    // Find the Font Scale slider row specifically so we can insert right after it
    // The native rows in order are: Corner Radius → Font Scale → UI Scale → Glass effects
    // We want to insert after Font Scale (2nd child, index 1).
    const rows = controlsEl.children
    // Font Scale row contains an input[min="0.85"] based on the JS source
    let fontScaleRow = null
    for (let i = 0; i < rows.length; i++) {
      const rangeInput = rows[i].querySelector('input[type="range"][min="0.85"]')
      if (rangeInput) { fontScaleRow = rows[i]; break }
    }

    settingsRowEl = buildSettingsRow(currentColumns)

    if (fontScaleRow && fontScaleRow.nextSibling) {
      controlsEl.insertBefore(settingsRowEl, fontScaleRow.nextSibling)
    } else if (fontScaleRow) {
      controlsEl.appendChild(settingsRowEl)
    } else {
      // Fallback: just append at the end of the controls block
      controlsEl.appendChild(settingsRowEl)
    }
  }

  function watchForControlsPanel() {
    // Immediately try in case it's already mounted
    tryInjectSettingsRow()

    // MutationObserver for subsequent mounts (user opens Settings)
    if (controlsObserver) controlsObserver.disconnect()
    controlsObserver = new MutationObserver(() => {
      tryInjectSettingsRow()
    })
    controlsObserver.observe(document.body, { childList: true, subtree: true })
  }

  // ── Backend message handling ───────────────────────────────────────────────
  ctx.onBackendMessage((payload) => {
    if (payload.type === 'SETTINGS') {
      const cols = clampColumns(payload.settings?.columns ?? DEFAULT_COLUMNS)
      setColumns(cols, false) // false = don't re-save, we just received it
    }
  })

  // ── Startup ───────────────────────────────────────────────────────────────
  // Apply default style immediately so there's no flash of the native layout
  applyGridStyle(DEFAULT_COLUMNS)

  // Start watching for the settings panel
  watchForControlsPanel()

  // Request persisted settings from backend
  ctx.sendToBackend({ type: 'GET_SETTINGS' })

})()
