# Mobile Column Layout

A Lumiverse extension that overrides the single-column character/content list on mobile devices to display multiple columns side-by-side, giving users a denser, card-grid view of their characters.

---

## What it does

On viewports ≤ 600 px (Lumiverse's mobile breakpoint) the character list
(`_scrollContainer_v15ny_1 > _row_v15ny_14`) normally renders as a single
vertical stack of full-width rows.

This extension converts that container into a CSS grid with a user-configurable
number of columns. Each card — whether it is a `_card_q6j3q_1`,
`_gridCard_1xexo_72`, or `_listCard_1xexo_177` — reflows into a portrait-aspect
(3 ∶ 4) grid tile that matches the existing Lumiverse card aesthetic.

Desktop layout is **not touched** — the injection is scoped behind an
`@media (max-width: 600px)` rule.

---

## Settings

Open **Settings → Themes** in the Lumiverse sidebar.  
At the bottom of the Themes panel you will find a **Mobile Column Count** input:

| Setting | Default | Range |
|---------|---------|-------|
| Column count | 2 | 2 – 6 |

Type a value and press **Apply** (or hit Enter).  
The grid updates immediately and the value is saved to your user storage.

---

## Architecture

```
mobile-column-layout/
├── spindle.json          # manifest — declares app_manipulation permission
├── src/
│   ├── backend.js        # Bun worker: read/write column count via userStorage
│   └── frontend.js       # Browser: inject grid CSS + settings UI
└── dist/
    ├── backend.js        # ← Lumiverse loads this
    └── frontend.js       # ← Lumiverse loads this
```

### Backend (`dist/backend.js`)

- Listens for `GET_COLUMNS` and `SET_COLUMNS` messages from the frontend.
- Reads/writes `mobile_column_layout:columns` in `spindle.userStorage`.
- Replies with `COLUMNS_VALUE` (on GET) or `COLUMNS_SAVED` / `COLUMNS_ERROR` (on SET).

### Frontend (`dist/frontend.js`)

- On `init(ctx)`:
  1. Sends `GET_COLUMNS` to the backend; applies the response via `ctx.dom.addStyle()`.
  2. Applies a default 2-column style immediately to avoid flash of unstyled content.
  3. Starts a `MutationObserver` watching `document.body` for `._panel_1gfvo_1`
     (the Themes panel) — injects the column-count control when found.
  4. Cleans up styles, observer, and DOM nodes on `EXTENSION_UNLOADED`.

---

## Permissions

| Permission | Why |
|---|---|
| `app_manipulation` | Required to inject CSS overrides that apply across the entire app (the Theme API). |

No network requests are made. No data leaves the device. The `cors_proxy`
permission is **not** required.

---

## CSS selectors used

These were identified from the minified CSS bundle:

| Selector | Role |
|---|---|
| `._scrollContainer_v15ny_1` | Outer scroll wrapper for the content list |
| `._row_v15ny_14` | Row/list container — converted to a CSS grid |
| `._panel_1gfvo_1` | Themes settings panel root — settings UI appended here |
| `._section_1gfvo_8` | Section block inside the Themes panel (style class reused) |
| `._sectionLabel_1gfvo_14` | Section label style |
| `._actionBtn_1gfvo_28` | Apply-button style |
| `._input_18qkb_94` | Standard form input style |
| `._formHint_18qkb_44` | Hint/description text style |
| `._card_q6j3q_1` | Standard character card |
| `._imageWrap_q6j3q_40` | Card image wrapper |
| `._gridCard_1xexo_72` | Grid-layout card variant |
| `._gridCardImage_1xexo_89` | Grid card image area |
| `._listCard_1xexo_177` | List-layout card (reflowed as portrait tile) |
| `._listCardInfo_1xexo_199` | Text section inside a list card |

> **Note:** Lumiverse uses hashed/obfuscated class names. If the app updates
> and class names change, update the selectors in `dist/frontend.js` accordingly.

---

## Installation

1. Fork / clone this repo.
2. In Lumiverse → Extensions, install via the GitHub URL.
3. Grant the `app_manipulation` permission when prompted.
4. Open Settings → Themes and set your preferred column count.
