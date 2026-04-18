// backend.ts — Column Layout extension
// Persists the column-count setting and pushes it to the frontend.

const SETTINGS_FILE = "settings.json";
const DEFAULT_COLUMNS = 2;

interface Settings {
  columns: number;
}

async function loadSettings(): Promise<Settings> {
  return spindle.storage.getJson<Settings>(SETTINGS_FILE, {
    fallback: { columns: DEFAULT_COLUMNS },
  });
}

async function saveSettings(settings: Settings): Promise<void> {
  await spindle.storage.setJson(SETTINGS_FILE, settings, { indent: 2 });
}

// ── Startup ──────────────────────────────────────────────────────────────────

const initialSettings = await loadSettings();

// Push the current setting to the frontend as soon as it connects.
spindle.sendToFrontend({ type: "init_columns", columns: initialSettings.columns });

spindle.log.info(
  `[column_layout] started — columns: ${initialSettings.columns}`
);

// ── Frontend message handler ─────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload: any) => {
  switch (payload.type) {
    // Frontend (settings UI) changed the slider value.
    case "set_columns": {
      const columns = Math.max(1, Math.min(5, Number(payload.columns) || DEFAULT_COLUMNS));
      await saveSettings({ columns });
      // Echo back to frontend so all contexts stay in sync.
      spindle.sendToFrontend({ type: "columns_updated", columns });
      spindle.log.info(`[column_layout] columns set to ${columns}`);
      break;
    }

    // Frontend requests the current value (e.g. after hot-reload).
    case "get_columns": {
      const settings = await loadSettings();
      spindle.sendToFrontend({ type: "init_columns", columns: settings.columns });
      break;
    }
  }
});
