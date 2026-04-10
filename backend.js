// dist/backend.js
// Card Column Control — backend module
//
// Responsibilities:
//   1. Persist the column preference to spindle.storage
//   2. Relay the current value to the frontend when it asks
//   3. Relay updated values back to the frontend after saving

const STORAGE_KEY = "column_preference.json";
const DEFAULT_COLUMNS = 3;

async function loadColumns() {
  try {
    const raw = await spindle.storage.getJson(STORAGE_KEY, {
      fallback: { columns: DEFAULT_COLUMNS },
    });
    const n = parseInt(raw.columns, 10);
    return Number.isFinite(n) && n >= 1 && n <= 10 ? n : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

async function saveColumns(n) {
  await spindle.storage.setJson(STORAGE_KEY, { columns: n }, { indent: 2 });
}

// Listen for messages from the frontend
spindle.onFrontendMessage(async (payload) => {
  if (!payload || typeof payload !== "object") return;

  // Frontend is asking for the current value on load
  if (payload.type === "get_columns") {
    const columns = await loadColumns();
    spindle.sendToFrontend({ type: "columns_value", columns });
    return;
  }

  // Frontend is setting a new value
  if (payload.type === "set_columns") {
    const n = parseInt(payload.columns, 10);
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      spindle.sendToFrontend({
        type: "columns_error",
        message: "Column count must be between 1 and 10.",
      });
      return;
    }
    await saveColumns(n);
    spindle.sendToFrontend({ type: "columns_value", columns: n });
    spindle.toast.success(`Card columns set to ${n}`);
    return;
  }
});

spindle.log.info("Card Column Control backend ready.");
