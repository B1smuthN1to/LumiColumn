// dist/backend.js — Column Layout extension (compiled)
// Persists the column-count setting and pushes it to the frontend.

const SETTINGS_FILE = "settings.json";
const DEFAULT_COLUMNS = 2;

async function loadSettings() {
  return spindle.storage.getJson(SETTINGS_FILE, {
    fallback: { columns: DEFAULT_COLUMNS },
  });
}

async function saveSettings(settings) {
  await spindle.storage.setJson(SETTINGS_FILE, settings, { indent: 2 });
}

// ── Startup ───────────────────────────────────────────────────────────────────

const initialSettings = await loadSettings();
spindle.sendToFrontend({ type: "init_columns", columns: initialSettings.columns });
spindle.log.info(`[column_layout] started — columns: ${initialSettings.columns}`);

// ── Frontend message handler ──────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload, _userId) => {
  switch (payload.type) {
    case "set_columns": {
      const columns = Math.max(1, Math.min(5, Number(payload.columns) || DEFAULT_COLUMNS));
      await saveSettings({ columns });
      spindle.sendToFrontend({ type: "columns_updated", columns });
      spindle.log.info(`[column_layout] columns set to ${columns}`);
      break;
    }
    case "get_columns": {
      const settings = await loadSettings();
      spindle.sendToFrontend({ type: "init_columns", columns: settings.columns });
      break;
    }
  }
});
