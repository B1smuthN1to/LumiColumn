/**
 * Mobile Column Layout — backend.js
 *
 * Responsibilities:
 *  - Persist the user's chosen column count via spindle.userStorage
 *  - Relay the current setting to the frontend on request
 *  - Relay save requests from the frontend back to storage
 *
 * All storage keys follow the pattern:  mobile_column_layout:<key>
 */

const STORAGE_KEY = 'mobile_column_layout:columns';
const DEFAULT_COLUMNS = 2;

/**
 * Clamp and validate a raw column value coming from the frontend.
 * Accepted range: 2–6 columns.
 */
function sanitiseColumns(raw) {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return DEFAULT_COLUMNS;
  return Math.min(6, Math.max(2, n));
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

spindle.on('EXTENSION_LOADED', async () => {
  spindle.log.info('[mobile_column_layout] backend loaded');

  // Ensure a default value exists if the user has never saved a preference.
  const existing = await spindle.userStorage.get(STORAGE_KEY);
  if (existing === null || existing === undefined) {
    await spindle.userStorage.set(STORAGE_KEY, String(DEFAULT_COLUMNS));
    spindle.log.info(`[mobile_column_layout] initialised default columns → ${DEFAULT_COLUMNS}`);
  }
});

// ── Message handlers (frontend → backend) ────────────────────────────────────

/**
 * Frontend sends  { type: 'GET_COLUMNS' }
 * Backend replies { columns: <number> }
 */
spindle.on('MESSAGE_FROM_FRONTEND', async (msg) => {
  if (!msg || typeof msg !== 'object') return;

  // ── GET_COLUMNS ─────────────────────────────────────────────────────────────
  if (msg.type === 'GET_COLUMNS') {
    let columns = DEFAULT_COLUMNS;
    try {
      const stored = await spindle.userStorage.get(STORAGE_KEY);
      if (stored !== null && stored !== undefined) {
        columns = sanitiseColumns(stored);
      }
    } catch (err) {
      spindle.log.warn(`[mobile_column_layout] failed to read storage: ${err.message}`);
    }

    spindle.sendToFrontend({ type: 'COLUMNS_VALUE', columns });
    return;
  }

  // ── SET_COLUMNS ─────────────────────────────────────────────────────────────
  if (msg.type === 'SET_COLUMNS') {
    const columns = sanitiseColumns(msg.columns);
    try {
      await spindle.userStorage.set(STORAGE_KEY, String(columns));
      spindle.log.info(`[mobile_column_layout] columns saved → ${columns}`);
      // Confirm back to the frontend so it can apply the new value immediately.
      spindle.sendToFrontend({ type: 'COLUMNS_SAVED', columns });
    } catch (err) {
      spindle.log.error(`[mobile_column_layout] failed to save columns: ${err.message}`);
      spindle.sendToFrontend({ type: 'COLUMNS_ERROR', message: err.message });
    }
    return;
  }
});
