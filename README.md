# Mobile Grid Columns — Lumiverse Extension

Overrides `grid-template-columns` on the container with id/class/data-attribute
`v15ny_1` when the viewport is **≤ 768 px** (mobile), and populates it with
user-defined cards.

## Features

| Feature | Detail |
|---|---|
| **Column count setting** | Choose 1–6 columns. Rows adjust automatically via CSS Grid. |
| **Card management** | Add, edit, and remove cards through the settings panel. |
| **Persisted settings** | Column count and cards are saved to `spindle.storage`. |
| **Theme-aware** | All styles use Lumiverse CSS variables — works in light and dark themes. |
| **Zero gated permissions** | Uses only Free Tier APIs (`storage`, `dom`, `frontend ↔ backend messaging`, `drawer tabs`). |

## How it works

### CSS override

On screens ≤ 768 px the extension injects:

```css
@media (max-width: 768px) {
  [data-v="v15ny_1"],
  #v15ny_1,
  .v15ny_1 {
    grid-template-columns: repeat(N, 1fr) !important;
  }
}
```

where `N` is your configured column count.  Desktop layout is untouched.

### Card population

On mobile viewports a `<div class="mgc-card-grid">` is appended inside the
target container.  The grid itself uses `grid-template-columns: repeat(N, 1fr)`
so rows grow automatically with the number of cards.

### Settings panel

Open the **Grid Cols** tab in the ViewportDrawer sidebar to:

1. Set the number of columns (1–6).
2. Add / edit / remove cards (each has a **Title** and **Body** field).
3. Press **Save** to persist.

## File structure

```
mobile-grid-columns/
├── spindle.json          ← Extension manifest
├── package.json
├── build.js              ← esbuild build script
├── src/
│   ├── backend.js        ← Storage read/write + message relay
│   └── frontend.js       ← DOM injection, CSS override, settings UI
└── dist/                 ← Built output (committed or gitignored)
    ├── backend.js
    └── frontend.js
```

## Getting started

```bash
npm install
npm run build      # one-off build
npm run dev        # watch mode
```

Then install the extension in Lumiverse by pointing it at this repository.

## Permissions declared

None — this extension uses only **Free Tier** capabilities.

| API | Used for |
|---|---|
| `spindle.storage` | Persist column count and card list |
| `spindle.frontend.send` / `ctx.backend.onMessage` | Pass settings between backend and frontend |
| `ctx.dom.addStyle` | Inject scoped CSS grid override |
| `ctx.dom.inject` | Insert card HTML into `v15ny_1` |
| `ctx.ui.registerDrawerTab` | Settings panel in the sidebar |
| `spindle.toast` | Success/error feedback when saving |
