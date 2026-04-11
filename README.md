# Grid Column Layout

A Lumiverse extension that transforms the character/content browser from a single horizontal row into a configurable multi-column grid.

## What it does

The browser's card container (`.scrollContainer_v15ny_1`) normally renders cards in a single horizontal scrolling row (`.row_v15ny_14`). This extension overrides that layout with a CSS grid, letting you choose between **1 and 5 columns** via a slider in the sidebar.

## Installation

1. In Lumiverse, open **Extensions → Install from GitHub**.
2. Paste your fork's GitHub URL and confirm.
3. No extra permissions need to be granted — the extension uses only free-tier APIs (DOM, Storage, Drawer Tabs).

## Settings

Open the **Grid Columns** tab in the ViewportDrawer sidebar (gear icon). Move the slider to pick a column count (1–5). The layout updates immediately and the value is saved for future sessions.

## Permissions

None required. This extension uses only free-tier Lumiverse APIs:

| API | Usage |
|-----|-------|
| `ctx.dom.addStyle` | Injects the grid CSS override |
| `ctx.storage.get/set` | Persists the column count across sessions |
| `ctx.ui.registerDrawerTab` | Adds the Settings tab to the sidebar |

## File structure

```
grid-column-layout/
├── spindle.json          ← extension manifest
├── README.md
├── src/
│   └── frontend.ts       ← TypeScript source
└── dist/
    └── frontend.js       ← compiled output (loaded by Lumiverse)
```

## How it works

The extension uses attribute-substring selectors (`[class*="_row_v15ny_"]`) to target the hashed class names in the Lumiverse bundle without coupling to a specific hash string. When the slider changes:

1. The previous `<style>` injection is removed via the handle returned by `ctx.dom.addStyle`.
2. A new style block is injected with the updated `grid-template-columns: repeat(N, 1fr)` value.
3. The new column count is written to `ctx.storage` for the next session.

A `MutationObserver` stamps `data-gcl-active` on the scroll container whenever it appears in the DOM, which is useful for debugging and future hook points.
