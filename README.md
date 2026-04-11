# Grid Column Override — Lumiverse Extension

Override the number of card columns in the virtualizer-based character/card
grid. Instead of the default `auto-fill` layout, you choose exactly how many
columns to show.

---

## How it works

Lumiverse renders character lists with a virtual-scroll container:

| CSS class (mangled) | Role |
|---|---|
| `_scrollContainer_v15ny_1` | Outer scroll host (virtualizer) |
| `_row_v15ny_14` | Each virtual row inside the scroller |
| `_gridLayout_1xexo_62` | The CSS grid that holds the cards |

By default `_gridLayout_1xexo_62` uses  
`grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`.

This extension injects a higher-specificity `!important` rule:  
`grid-template-columns: repeat(N, minmax(0, 1fr))`  
where **N** is whatever you set in the extension settings.

A `MutationObserver` watches the scroll container so the override stays active
even as the virtualizer recycles rows dynamically.

---

## Installation

1. Add the repo URL in **Lumiverse → Extensions → Install**.
2. No permissions need to be granted — this extension uses only the free-tier
   DOM API and `localStorage`.

---

## Settings

Open **Settings → Extensions → Grid Column Override**.

| Setting | Description | Default |
|---|---|---|
| **Number of columns** | How many equal-width columns the card grid should have. | `4` |

Hit **Apply** to apply immediately. The value is saved to `localStorage` and
restored on every page load.

---

## File structure

```
grid-column-override/
├── spindle.json          ← extension manifest
├── src/
│   └── frontend.ts       ← TypeScript source
└── dist/
    └── frontend.js       ← compiled output (ready to use)
```

---

## Building from source

```bash
bun build src/frontend.ts --outfile dist/frontend.js --format esm
```

Or with any bundler that emits ESM with `export function setup(ctx)`.

---

## Compatibility note

The class names `_scrollContainer_v15ny_1`, `_row_v15ny_14`, and
`_gridLayout_1xexo_62` are derived from the minified Lumiverse CSS bundle
(provided as `css.txt`). If Lumiverse updates its bundle, the attribute
selector patterns (`[class*="…"]`) used here will continue to match as long
as the partial name fragments (`v15ny` / `1xexo`) remain stable.
