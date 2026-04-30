┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│                                                     │
│  Drawer Tab "Length"                                │
│  ┌───────────────────────────────────┐              │
│  │  Column Layout                    │              │
│  │  ──────────────────               │              │
│  │  [====●===========] 2 Columns     │  ◄── slider  │
│  │   1               5              │              │
│  └───────────────────────────────────┘              │
│                                                     │
│  applyColumns(n) injects CSS:                       │
│    .v15ny_14 { grid-template-columns: repeat(n) }   │
│                                                     │
│  sendToBackend("column-layout:set", {columns: n})   │
└──────────────────┬──────────────────────────────────┘
                   │  Spindle message bus
┌──────────────────▼──────────────────────────────────┐
│                    BACKEND                          │
│                                                     │
│  storage.set("column-count", n)   ← persists        │
│  events.broadcast("column-layout:updated", {n})     │
└─────────────────────────────────────────────────────┘
