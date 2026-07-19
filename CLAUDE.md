# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Asset pack for **OpenAI Codex desktop pets** (chibi companions that animate while Codex works). There is no application source, build system, package manager, or tests — only pet packages.

Each pet is a self-contained folder:

```
<pet-id>/
  pet.json          # metadata + optional animation atlas
  spritesheet.webp  # lossless WebP with alpha; always 1536×1872 here
```

Current packages: `firefly` (流萤), `fufu-sticker` (芙芙), `ganyu-pet-v2` (甘雨), `rich-paimon` (财神派蒙).

## Spritesheet convention

All sheets in this repo share the same grid (documented fully only on `firefly`):

| Property | Value |
|---|---|
| Size | 1536 × 1872 |
| Grid | 8 columns × 9 rows |
| Cell | 192 × 208 |
| Format | WebP lossless + alpha |

Row → animation state mapping (from `firefly/pet.json`):

| Row | State | Frames | Purpose |
|---|---|---|---|
| 0 | `idle` | 6 | Calm resting / breathing / blink |
| 1 | `running-right` | 8 | Rightward drag movement |
| 2 | `running-left` | 8 | Leftward drag movement |
| 3 | `waving` | 4 | Greeting / attention |
| 4 | `jumping` | 5 | Hover or playful jump |
| 5 | `failed` | 8 | Blocked / failed / cancelled |
| 6 | `waiting` | 6 | Waiting for approval or input |
| 7 | `running` | 6 | Active task / processing |
| 8 | `review` | 6 | Ready or completed output review |

Unused frame slots in a row are expected (grid is fixed width 8).

## `pet.json` formats in this repo

Schemas are **not uniform** across packages. Treat these as three observed shapes:

**Minimal** (`fufu-sticker`, `ganyu-pet-v2`):

```json
{
  "id": "fufu-sticker",
  "displayName": "芙芙 Sticker",
  "description": "...",
  "spritesheetPath": "spritesheet.webp"
}
```

**Marketplace-style** (`rich-paimon`):

```json
{
  "id": "rich-paimon",
  "displayName": "Rich Paimon财神派蒙",
  "description": "...",
  "spritesheetPath": "spritesheet.webp",
  "kind": "object",
  "source": "codex-pets.net",
  "sourceId": "rich-paimon"
}
```

**Full atlas** (`firefly`) — includes grid layout and per-row animation metadata, plus both snake_case and camelCase identity fields:

- Identity: `id` / `pet_id` / `name`, `displayName` / `display_name`
- Layout: `atlas.{columns,rows,cell_width,cell_height,width,height}`
- Animations: `rows[]` with `{state, row, frames, purpose}`
- Optional: `created_at`

When creating a new pet, prefer the **full atlas** shape (as in `firefly`) so animation intent is explicit; keep `id` equal to the folder name and `spritesheetPath` relative as `"spritesheet.webp"`.

## Web preview

Static viewer at repo root: `index.html` + `app.js` + `styles.css`.

```bash
# from this directory
python -m http.server 8765
# open http://localhost:8765/
```

Do not open `index.html` via `file://` if images fail — browsers block local asset loads. The viewer reads each package’s `pet.json` when possible and falls back to the default 8×9 atlas / row map. To register a new pet in the UI, add an entry to `PET_CATALOG` in `app.js`.

## Embed SDK (any webpage)

Reusable widget: `embed/codex-pet.js` (no deps). Existing preview files are left unchanged.

```html
<script src="/path/to/codex-pet.js"></script>
<script>
  CodexPet.mount('#el', {
    petJson: '/pets/firefly/pet.json',
    spritesheet: '/pets/firefly/spritesheet.webp',
    // 兼容：src: '/pets/firefly/' 目录模式仍可用
    mode: 'fixed',
    position: 'bottom-right',
    scale: 1,
    state: 'idle',
  });
</script>
```

Also supports declarative `data-codex-pet` + `data-src` auto-mount. Demo: `embed/example.html` → http://localhost:8765/embed/example.html. Docs: `embed/README.md`.

Cross-origin spritesheets need CORS. Prefer same-origin hosting for pet assets.

## Working in this repo

- No install / build / lint / test commands exist beyond the static preview above.
- Validate a package by checking: folder name == `id`, `spritesheet.webp` present and 1536×1872, `pet.json` parses as JSON.
- Do not recompress spritesheets to lossy WebP (alpha + lossless is intentional).
- Prefer editing `pet.json` metadata over regenerating sheets unless the user provides new art.
- New pets: add a sibling folder; do not nest packages.

## Naming

- Folder and `id`: kebab-case English slug (`ganyu-pet-v2`, `fufu-sticker`)
- `displayName`: human-readable, often bilingual (Chinese + English)
- Animation `state` values: kebab-case English (`running-right`, not `runRight`)
