// src/backend.ts — Column Layout Extension
// Persists the user's chosen column count and forwards it to the frontend.

declare const spindle: any;

const SETTINGS_FILE = "settings.json";
const DEFAULT_COLUMNS = 3;

interface Settings {
  columns: number;
}

async function loadSettings(): Promise<Settings> {
  try {
    return await spindle.storage.getJson<Settings>(SETTINGS_FILE, {
      fallback: { columns: DEFAULT_COLUMNS },
    });
  } catch {
    return { columns: DEFAULT_COLUMNS };
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await spindle.storage.setJson(SETTINGS_FILE, settings, { indent: 2 });
}

spindle.onFrontendMessage(async (payload: any) => {
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
