# AESTHETIC OVERDRIVE

Vaporwave, beat-synced, head-on rail shooter with survivor-style upgrades. See `docs/concept-brief.md`.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build in dist/
```

URL params: `?variant=b` (A/B config in `src/config.ts`), `?debug=1` (overlay).

## Controls
Drag (touch/mouse) or WASD/arrows to steer. Weapons auto-fire on the beat. Collect yellow gems, pick 1 of 3 upgrades on level-up.

## Layout
- `src/data/` weapons, enemies, upgrades, tracks (data-driven content)
- `src/audio/` beat clock (audio time) + procedural synth track
- `src/core/` object pool, pseudo-3D projection
- `src/render/` procedural backdrop + textures
- `src/platform/`, `src/save/` platform shims and save-data layer (localStorage behind an interface)
