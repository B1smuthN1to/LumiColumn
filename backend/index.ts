import type { SpindleBackendAPI } from "lumiverse/spindle";

export default function activate(api: SpindleBackendAPI) {
  const STORAGE_KEY = "column-count";
  const DEFAULT_COLUMNS = 2;

  // ── Initialise storage with default ──────────────────────────────
  async function ensureDefault() {
    const existing = await api.storage.get(STORAGE_KEY);
    if (existing === null || existing === undefined) {
      await api.storage.set(STORAGE_KEY, DEFAULT_COLUMNS);
    }
  }

  ensureDefault();

  // ── Listen for the frontend asking for the current value ─────────
  api.events.on("column-layout:get", async (_payload, reply) => {
    const count = (await api.storage.get(STORAGE_KEY)) ?? DEFAULT_COLUMNS;
    reply({ columns: count });
  });

  // ── Listen for the frontend saving a new value ───────────────────
  api.events.on("column-layout:set", async (payload) => {
    const raw = Number(payload?.columns);
    const clamped = Math.max(1, Math.min(5, isNaN(raw) ? DEFAULT_COLUMNS : raw));
    await api.storage.set(STORAGE_KEY, clamped);

    // Broadcast to every connected frontend so all tabs update live
    api.events.broadcast("column-layout:updated", { columns: clamped });
  });
}}

// ── Style management ──────────────────────────────────────────────────────────

function applyGridStyle(ctx, cols) {
  if (removeStyle) {
    removeStyle();
    removeStyle = null;
  }
  currentColumns = cols;
  removeStyle = ctx.dom.addStyle(buildGridCSS(cols));
}

// ── Settings UI injection ─────────────────────────────────────────────────────

function injectSettingsUI(ctx, panel) {
  if (document.getElementById(SETTINGS_EL_ID)) return;

  const wrapper = document.createElement('div');
  wrapper.id = SETTINGS_EL_ID;
  wrapper.className = '_section_1gfvo_8';
  wrapper.style.cssText = 'margin-top: 8px;';

  wrapper.innerHTML = `
    <div class="_sectionLabel_1gfvo_14" style="margin-bottom:6px;">
      Mobile Column Count
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <input
        id="mcl-col-input"
        type="number"
        min="${MIN_COLUMNS}"
        max="${MAX_COLUMNS}"
        step="1"
        value="${currentColumns}"
        class="_input_18qkb_94"
        style="width:72px;padding:7px 10px;text-align:center;"
        aria-label="Number of columns on mobile"
      />
      <button
        id="mcl-col-apply"
        class="_actionBtn_1gfvo_28"
        style="flex:unset;padding:7px 16px;"
        aria-label="Apply column count"
      >Apply</button>
      <span
        id="mcl-col-status"
        style="font-size:11px;color:var(--lumiverse-text-dim);opacity:0;transition:opacity .3s ease;"
      ></span>
    </div>
    <p class="_formHint_18qkb_44" style="margin-top:6px;">
      Number of columns in the character/content list on mobile
      (&le;&thinsp;${MOBILE_BREAKPOINT}&thinsp;px).
      Accepted range: ${MIN_COLUMNS}&ndash;${MAX_COLUMNS}.
      Changes apply immediately and are saved per user.
    </p>
  `.trim();

  panel.appendChild(wrapper);

  // ── Event wiring ─────────────────────────────────────────────────────────

  const input    = wrapper.querySelector('#mcl-col-input');
  const applyBtn = wrapper.querySelector('#mcl-col-apply');
  const statusEl = wrapper.querySelector('#mcl-col-status');
  let   statusTimer = null;

  function showStatus(text, color) {
    statusEl.textContent = text;
    statusEl.style.color = color || 'var(--lumiverse-text-dim)';
    statusEl.style.opacity = '1';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { statusEl.style.opacity = '0'; }, 2400);
  }

  function commitColumns() {
    const raw     = parseInt(input.value, 10);
    if (isNaN(raw)) {
      showStatus('Invalid', 'var(--lumiverse-danger, #ef4444)');
      return;
    }
    const clamped = Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, raw));
    if (clamped !== raw) input.value = clamped;

    // Optimistically apply the CSS so the user sees the change right away
    applyGridStyle(ctx, clamped);

    // Persist via backend
    ctx.backend.send({ type: 'SET_COLUMNS', columns: clamped });
    applyBtn.disabled    = true;
    applyBtn.textContent = 'Saving…';
  }

  applyBtn.addEventListener('click', commitColumns);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitColumns(); }
  });

  // Listen for backend confirmation messages from within the settings block
  ctx.backend.onMessage((msg) => {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'COLUMNS_SAVED') {
      applyBtn.disabled    = false;
      applyBtn.textContent = 'Apply';
      input.value          = msg.columns;
      showStatus('✓ Saved', 'var(--lumiverse-success, #22c55e)');
    }

    if (msg.type === 'COLUMNS_ERROR') {
      applyBtn.disabled    = false;
      applyBtn.textContent = 'Apply';
      showStatus('Error saving', 'var(--lumiverse-danger, #ef4444)');
    }
  });
}

// ── Themes panel watcher ──────────────────────────────────────────────────────

function watchForThemesPanel(ctx) {
  if (settingsObserver) return;

  function tryInject() {
    const panel = document.querySelector(SEL_THEMES_PANEL);
    if (panel) injectSettingsUI(ctx, panel);
  }

  tryInject(); // immediate attempt if panel is already open

  settingsObserver = new MutationObserver(() => {
    if (!document.getElementById(SETTINGS_EL_ID)) tryInject();
  });

  settingsObserver.observe(document.body, { childList: true, subtree: true });
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function init(ctx) {
  // ── Step 1: request the persisted column value from the backend ──────────
  ctx.backend.onMessage((msg) => {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'COLUMNS_VALUE') {
      currentColumns = msg.columns;
      applyGridStyle(ctx, currentColumns);

      // Sync the input if the settings panel is already open
      const input = document.getElementById('mcl-col-input');
      if (input) input.value = currentColumns;
    }
  });

  ctx.backend.send({ type: 'GET_COLUMNS' });

  // ── Step 2: apply a baseline style immediately so there is no flash ───────
  applyGridStyle(ctx, DEFAULT_COLUMNS);

  // ── Step 3: watch for the Themes panel ────────────────────────────────────
  watchForThemesPanel(ctx);

  // ── Step 4: graceful cleanup when the extension is disabled ───────────────
  ctx.on('EXTENSION_UNLOADED', () => {
    if (removeStyle)        { removeStyle(); removeStyle = null; }
    if (settingsObserver)   { settingsObserver.disconnect(); settingsObserver = null; }
    const block = document.getElementById(SETTINGS_EL_ID);
    if (block) block.remove();
  });
}
