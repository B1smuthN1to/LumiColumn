/**
 * Mobile Grid Columns — Backend (dist/backend.js)
 *
 * Responsibilities:
 *   - Persist user settings (column count, card data) via spindle.storage
 *   - Relay settings to the frontend on demand
 *   - Handle messages from the frontend to read/write settings
 */

const DEFAULT_SETTINGS = {
  mobileColumns: 2,
  cards: [
    { title: "Card 1", body: "Your first card content goes here." },
    { title: "Card 2", body: "Your second card content goes here." },
    { title: "Card 3", body: "Your third card content goes here." },
    { title: "Card 4", body: "Your fourth card content goes here." },
  ],
};

const SETTINGS_FILE = "settings.json";

/**
 * Read settings from storage, falling back to defaults.
 */
async function loadSettings() {
  try {
    return await spindle.storage.getJson(SETTINGS_FILE, {
      fallback: DEFAULT_SETTINGS,
    });
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persist settings to storage.
 */
async function saveSettings(settings) {
  await spindle.storage.setJson(SETTINGS_FILE, settings, { indent: 2 });
}

// ── Message handlers (frontend → backend) ─────────────────────────────────

spindle.on("message", async (msg) => {
  const { type, payload } = msg;

  if (type === "GET_SETTINGS") {
    const settings = await loadSettings();
    spindle.frontend.send({ type: "SETTINGS", payload: settings });
    return;
  }

  if (type === "SAVE_SETTINGS") {
    try {
      await saveSettings(payload);
      spindle.frontend.send({ type: "SETTINGS_SAVED", payload });
      spindle.toast.success("Grid settings saved!");
    } catch (err) {
      spindle.log.error(`Failed to save settings: ${err.message}`);
      spindle.toast.error("Failed to save settings.");
    }
    return;
  }
});

// On startup, log that the extension is live
spindle.log.info("[mobile_grid_columns] Backend ready.");
