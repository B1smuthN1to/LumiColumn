/**
 * char_grid_columns — backend.js
 *
 * Persists the full settings object in userStorage.
 * Responds to:
 *   { type: "GET_SETTINGS" }                  → { settings: { columns, gap, radius, nameSize } }
 *   { type: "SET_SETTINGS", settings: {...} } → { settings: {...} }
 *
 * Also handles the legacy single-value protocol from v1 for smooth upgrades:
 *   { type: "GET_COLUMNS" }        → { columns: number }
 *   { type: "SET_COLUMNS", value } → { columns: number }
 */

const STORAGE_KEY = "settings_v2";

const DEFAULTS = { columns: 4, gap: 16, radius: 16, nameSize: 14 };
const LIMITS   = {
  columns:  { min: 1,  max: 12 },
  gap:      { min: 4,  max: 32 },
  radius:   { min: 0,  max: 24 },
  nameSize: { min: 10, max: 18 },
};

function clamp(val, min, max) {
  const n = parseInt(val, 10);
  return isNaN(n) ? min : Math.max(min, Math.min(max, n));
}

function sanitize(raw) {
  const base = typeof raw === "object" && raw !== null ? raw : {};
  return {
    columns:  clamp(base.columns  ?? DEFAULTS.columns,  LIMITS.columns.min,  LIMITS.columns.max),
    gap:      clamp(base.gap      ?? DEFAULTS.gap,      LIMITS.gap.min,      LIMITS.gap.max),
    radius:   clamp(base.radius   ?? DEFAULTS.radius,   LIMITS.radius.min,   LIMITS.radius.max),
    nameSize: clamp(base.nameSize ?? DEFAULTS.nameSize, LIMITS.nameSize.min, LIMITS.nameSize.max),
  };
}

export default async function backend(spindle) {

  spindle.onMessage(async (msg, { reply, userId }) => {
    switch (msg.type) {

      // ── Current protocol ─────────────────────────────────────────────────
      case "GET_SETTINGS": {
        let settings = { ...DEFAULTS };
        try {
          const raw = await spindle.userStorage.get(STORAGE_KEY, userId);
          if (raw) settings = sanitize(JSON.parse(raw));
        } catch (_) { /* use defaults */ }
        reply({ settings });
        break;
      }

      case "SET_SETTINGS": {
        const settings = sanitize(msg.settings ?? {});
        await spindle.userStorage.set(STORAGE_KEY, JSON.stringify(settings), userId);
        spindle.log(`[char_grid_columns] settings saved: ${JSON.stringify(settings)}`);
        reply({ settings });
        break;
      }

      // ── Legacy v1 protocol (backwards compat) ────────────────────────────
      case "GET_COLUMNS": {
        let settings = { ...DEFAULTS };
        try {
          const raw = await spindle.userStorage.get(STORAGE_KEY, userId);
          if (raw) settings = sanitize(JSON.parse(raw));
        } catch (_) { /* use defaults */ }
        reply({ columns: settings.columns });
        break;
      }

      case "SET_COLUMNS": {
        let settings = { ...DEFAULTS };
        try {
          const raw = await spindle.userStorage.get(STORAGE_KEY, userId);
          if (raw) settings = sanitize(JSON.parse(raw));
        } catch (_) { /* ignore */ }
        settings.columns = clamp(msg.value, LIMITS.columns.min, LIMITS.columns.max);
        await spindle.userStorage.set(STORAGE_KEY, JSON.stringify(settings), userId);
        reply({ columns: settings.columns });
        break;
      }

      default:
        break;
    }
  });
}
