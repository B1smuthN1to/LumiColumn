/**
 * Grid Column Control — backend.js
 *
 * Responsibilities:
 *  - Persist the user's chosen column count in userStorage
 *  - Relay the stored setting to the frontend on startup
 *  - Handle save/load messages from the frontend
 */

const DEFAULT_COLUMNS = 4
const STORAGE_KEY = 'settings.json'

async function loadSettings(userId) {
  return spindle.userStorage.getJson(STORAGE_KEY, {
    fallback: { columns: DEFAULT_COLUMNS },
    userId,
  })
}

async function saveSettings(userId, settings) {
  await spindle.userStorage.setJson(STORAGE_KEY, settings, { userId })
}

// ── Frontend message handler ─────────────────────────────────────────────────
spindle.onFrontendMessage(async (payload, userId) => {
  switch (payload.type) {
    case 'GET_SETTINGS': {
      const settings = await loadSettings(userId)
      spindle.sendToFrontend({ type: 'SETTINGS', settings })
      break
    }

    case 'SAVE_SETTINGS': {
      const settings = { columns: Number(payload.columns) || DEFAULT_COLUMNS }
      await saveSettings(userId, settings)
      // Echo back so all connected frontends (multi-tab) stay in sync
      spindle.sendToFrontend({ type: 'SETTINGS', settings })
      spindle.log.info(`[grid_column_control] Saved columns=${settings.columns} for user ${userId}`)
      break
    }

    default:
      spindle.log.warn(`[grid_column_control] Unknown message type: ${payload.type}`)
  }
})

spindle.log.info('[grid_column_control] Backend ready.')
