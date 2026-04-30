// backend.js — Column Layout Extension
// Persists the user's chosen column count and forwards it to the frontend.

const SETTINGS_FILE = "settings.json";
const DEFAULT_COLUMNS = 3;

async function loadSettings() {
  try {
    return await spindle.storage.getJson(SETTINGS_FILE, {
      fallback: { columns: DEFAULT_COLUMNS },
    });
  } catch {
    return { columns: DEFAULT_COLUMNS };
  }
}

async function saveSettings(settings) {
  await spindle.storage.setJson(SETTINGS_FILE, settings, { indent: 2 });
}

// Send current settings to the frontend as soon as it connects.
spindle.onFrontendMessage(async (payload) => {
  switch (payload.type) {
    case "get_settings": {
      const settings = await loadSettings();
      spindle.sendToFrontend({ type: "settings", ...settings });
      break;
    }

    case "set_columns": {
      const columns = Math.min(5, Math.max(1, Number(payload.columns) || DEFAULT_COLUMNS));
      await saveSettings({ columns });
      spindle.sendToFrontend({ type: "settings", columns });
      break;
    }

    default:
      break;
  }
});
