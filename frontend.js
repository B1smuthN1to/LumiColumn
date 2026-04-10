/**
 * Mobile Grid Columns — Frontend (dist/frontend.js)
 *
 * Responsibilities:
 *   1. Inject a settings drawer tab so the user can configure column count
 *      and manage cards.
 *   2. Observe the DOM for the target container (v15ny_1) and apply the
 *      mobile grid-template-columns override.
 *   3. Populate the container with user-defined cards on mobile viewports.
 *
 * Lumiverse free-tier APIs used:
 *   - ctx.dom.addStyle()       — inject scoped CSS
 *   - ctx.dom.inject()         — inject HTML into the page
 *   - ctx.dom.query()          — query own injected elements
 *   - ctx.backend.send()       — send messages to the backend
 *   - ctx.backend.onMessage()  — receive messages from the backend
 *   - ctx.ui.registerDrawerTab()  — settings panel in the sidebar drawer
 */

// ── State ──────────────────────────────────────────────────────────────────

let currentSettings = {
  mobileColumns: 2,
  cards: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true when the viewport is in "mobile" territory (≤ 768 px).
 */
function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

/**
 * Build the CSS override string for the target container.
 * On mobile it overrides grid-template-columns to the user-defined column
 * count; on larger viewports it removes the override so the page default wins.
 */
function buildGridCSS(cols) {
  return `
    /* Mobile Grid Columns — injected by mobile_grid_columns extension */
    @media (max-width: 768px) {
      [data-v="v15ny_1"],
      #v15ny_1,
      .v15ny_1 {
        grid-template-columns: repeat(${cols}, 1fr) !important;
      }
    }

    /* ── Extension card styles ── */
    .mgc-card-grid {
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      gap: 12px;
      width: 100%;
      padding: 8px 0;
    }

    @media (min-width: 769px) {
      /* On desktop, revert to the page's own layout */
      .mgc-card-grid {
        display: contents;
      }
    }

    .mgc-card {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      color: var(--lumiverse-text);
      padding: 14px 12px;
      font-size: 0.875rem;
      line-height: 1.5;
      transition: border-color var(--lumiverse-transition-fast),
                  box-shadow var(--lumiverse-transition-fast);
    }

    .mgc-card:hover {
      border-color: var(--lumiverse-border-hover);
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }

    .mgc-card-title {
      font-weight: 600;
      color: var(--lumiverse-accent);
      margin: 0 0 6px;
      font-size: 0.9rem;
    }

    .mgc-card-body {
      color: var(--lumiverse-text-muted);
      margin: 0;
    }

    /* ── Settings panel styles ── */
    .mgc-settings {
      padding: 16px;
      color: var(--lumiverse-text);
      font-size: 0.875rem;
    }

    .mgc-settings h2 {
      margin: 0 0 16px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--lumiverse-text);
      border-bottom: 1px solid var(--lumiverse-border);
      padding-bottom: 8px;
    }

    .mgc-field {
      margin-bottom: 16px;
    }

    .mgc-field label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: var(--lumiverse-text);
    }

    .mgc-field input[type="number"],
    .mgc-field input[type="text"],
    .mgc-field textarea {
      width: 100%;
      padding: 8px 10px;
      background: var(--lumiverse-fill);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      color: var(--lumiverse-text);
      font-size: 0.875rem;
      box-sizing: border-box;
      transition: border-color var(--lumiverse-transition-fast);
    }

    .mgc-field input:focus,
    .mgc-field textarea:focus {
      outline: none;
      border-color: var(--lumiverse-accent);
    }

    .mgc-field textarea {
      resize: vertical;
      min-height: 60px;
    }

    .mgc-hint {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--lumiverse-text-dim);
    }

    .mgc-cards-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 12px;
    }

    .mgc-card-item {
      background: var(--lumiverse-fill);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      padding: 10px 12px;
    }

    .mgc-card-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .mgc-card-item-label {
      font-weight: 500;
      font-size: 0.8rem;
      color: var(--lumiverse-text-muted);
    }

    .mgc-btn-remove {
      background: none;
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text-muted);
      border-radius: var(--lumiverse-radius);
      padding: 2px 8px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: color var(--lumiverse-transition-fast),
                  border-color var(--lumiverse-transition-fast);
    }

    .mgc-btn-remove:hover {
      color: #e05c5c;
      border-color: #e05c5c;
    }

    .mgc-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--lumiverse-radius);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity var(--lumiverse-transition-fast);
      border: none;
    }

    .mgc-btn:hover { opacity: 0.85; }

    .mgc-btn-primary {
      background: var(--lumiverse-accent);
      color: var(--lumiverse-accent-fg);
    }

    .mgc-btn-secondary {
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      border: 1px solid var(--lumiverse-border);
    }

    .mgc-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .mgc-status {
      margin-top: 10px;
      font-size: 0.8rem;
      color: var(--lumiverse-accent);
      min-height: 18px;
    }

    .mgc-divider {
      border: none;
      border-top: 1px solid var(--lumiverse-border);
      margin: 16px 0;
    }

    .mgc-preview-label {
      font-size: 0.8rem;
      color: var(--lumiverse-text-muted);
      margin-bottom: 8px;
    }
  `;
}

// ── Style injection reference (so we can remove & re-inject on update) ─────
let removeStyle = null;

function applyStyles(cols) {
  if (removeStyle) removeStyle();
  removeStyle = ctx.dom.addStyle(buildGridCSS(cols));
}

// ── Card DOM rendering ─────────────────────────────────────────────────────

/**
 * Render (or re-render) the card grid inside the target container.
 * Only does so when on mobile to avoid interfering with the desktop layout.
 */
function renderCards() {
  // Remove any previously-injected card grid
  const existing = document.querySelector(".mgc-card-grid");
  if (existing) existing.remove();

  if (!isMobile()) return;

  const cards = currentSettings.cards || [];
  if (!cards.length) return;

  // Build card HTML
  const cardsHtml = cards
    .map(
      (c) => `
      <div class="mgc-card">
        <p class="mgc-card-title">${escapeHtml(c.title || "")}</p>
        <p class="mgc-card-body">${escapeHtml(c.body || "")}</p>
      </div>`
    )
    .join("");

  const gridHtml = `<div class="mgc-card-grid">${cardsHtml}</div>`;

  // Try to find the target container and append inside it
  const container =
    document.querySelector('[data-v="v15ny_1"]') ||
    document.getElementById("v15ny_1") ||
    document.querySelector(".v15ny_1");

  if (container) {
    ctx.dom.inject('[data-v="v15ny_1"], #v15ny_1, .v15ny_1', gridHtml, "beforeend");
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Settings panel ─────────────────────────────────────────────────────────

function buildSettingsHTML(settings) {
  const cols = settings.mobileColumns ?? 2;
  const cards = settings.cards ?? [];

  const cardItems = cards
    .map(
      (c, i) => `
      <div class="mgc-card-item" data-card-index="${i}">
        <div class="mgc-card-item-header">
          <span class="mgc-card-item-label">Card ${i + 1}</span>
          <button class="mgc-btn-remove" data-remove="${i}">Remove</button>
        </div>
        <div class="mgc-field">
          <label>Title</label>
          <input type="text" class="mgc-card-title-input" data-idx="${i}" value="${escapeHtml(c.title || "")}" placeholder="Card title">
        </div>
        <div class="mgc-field">
          <label>Body</label>
          <textarea class="mgc-card-body-input" data-idx="${i}" placeholder="Card body text">${escapeHtml(c.body || "")}</textarea>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="mgc-settings">
      <h2>Mobile Grid Columns</h2>

      <div class="mgc-field">
        <label for="mgc-col-input">Columns on mobile</label>
        <input
          type="number"
          id="mgc-col-input"
          min="1"
          max="6"
          value="${cols}"
        >
        <span class="mgc-hint">
          Sets <code>grid-template-columns: repeat(N, 1fr)</code> on
          <code>v15ny_1</code> for screens ≤ 768 px.
          Rows adjust automatically.
        </span>
      </div>

      <hr class="mgc-divider">

      <h2>Cards</h2>
      <p class="mgc-preview-label">Cards injected into the grid on mobile viewports.</p>

      <div class="mgc-cards-list" id="mgc-cards-list">
        ${cardItems}
      </div>

      <div class="mgc-actions">
        <button class="mgc-btn mgc-btn-secondary" id="mgc-add-card">+ Add Card</button>
        <button class="mgc-btn mgc-btn-primary" id="mgc-save">Save</button>
      </div>

      <p class="mgc-status" id="mgc-status"></p>
    </div>
  `;
}

function attachSettingsListeners() {
  // Column count live preview
  const colInput = document.getElementById("mgc-col-input");
  if (colInput) {
    colInput.addEventListener("input", () => {
      const v = parseInt(colInput.value, 10);
      if (v >= 1 && v <= 6) applyStyles(v);
    });
  }

  // Remove card buttons
  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.remove, 10);
      currentSettings.cards.splice(idx, 1);
      refreshSettingsPanel();
    });
  });

  // Add card
  const addBtn = document.getElementById("mgc-add-card");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      currentSettings.cards.push({ title: "New Card", body: "" });
      refreshSettingsPanel();
    });
  }

  // Save
  const saveBtn = document.getElementById("mgc-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      collectFormValues();
      ctx.backend.send({ type: "SAVE_SETTINGS", payload: currentSettings });
      applyStyles(currentSettings.mobileColumns);
      renderCards();

      const status = document.getElementById("mgc-status");
      if (status) {
        status.textContent = "Saved!";
        setTimeout(() => {
          status.textContent = "";
        }, 2000);
      }
    });
  }
}

/**
 * Read the current form values back into currentSettings before saving.
 */
function collectFormValues() {
  const colInput = document.getElementById("mgc-col-input");
  if (colInput) {
    const v = parseInt(colInput.value, 10);
    if (v >= 1 && v <= 6) currentSettings.mobileColumns = v;
  }

  document.querySelectorAll(".mgc-card-title-input").forEach((el) => {
    const i = parseInt(el.dataset.idx, 10);
    if (currentSettings.cards[i]) currentSettings.cards[i].title = el.value;
  });

  document.querySelectorAll(".mgc-card-body-input").forEach((el) => {
    const i = parseInt(el.dataset.idx, 10);
    if (currentSettings.cards[i]) currentSettings.cards[i].body = el.value;
  });
}

// ── Settings drawer tab ────────────────────────────────────────────────────

let drawerContainer = null;

function refreshSettingsPanel() {
  if (!drawerContainer) return;
  drawerContainer.innerHTML = buildSettingsHTML(currentSettings);
  attachSettingsListeners();
}

ctx.ui.registerDrawerTab({
  id: "mgc-settings",
  label: "Grid Cols",
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  onMount(container) {
    drawerContainer = container;
    refreshSettingsPanel();
  },
  onUnmount() {
    drawerContainer = null;
  },
});

// ── Backend messaging ──────────────────────────────────────────────────────

ctx.backend.onMessage((msg) => {
  if (msg.type === "SETTINGS" || msg.type === "SETTINGS_SAVED") {
    currentSettings = msg.payload;
    applyStyles(currentSettings.mobileColumns);
    renderCards();
    if (drawerContainer) refreshSettingsPanel();
  }
});

// ── Resize handler ─────────────────────────────────────────────────────────
// Re-render cards when crossing the mobile breakpoint
const mq = window.matchMedia("(max-width: 768px)");
mq.addEventListener("change", () => renderCards());

// ── Startup ────────────────────────────────────────────────────────────────

(function init() {
  // Fetch stored settings from the backend
  ctx.backend.send({ type: "GET_SETTINGS" });

  // Apply default styles immediately so there's no layout flash
  applyStyles(currentSettings.mobileColumns);
})();
