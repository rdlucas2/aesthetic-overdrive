# AESTHETIC OVERDRIVE

A vaporwave, beat-synced, head-on rail shooter with survivor-style upgrades.
**Read `docs/concept-brief.md` before starting any work.** It is the source of truth for design decisions.
Design is discussed in the claude.ai Project "Game Vibe Coding". If code and the brief disagree, ask before diverging, and update the brief when a decision changes.

## Stack
- Phaser 3 + TypeScript + Vite
- Deployed to GitHub Pages via GitHub Actions on merge to `main`
- Later wrappers: Electron/Tauri (Steam), Capacitor (mobile). Keep game code platform-agnostic (no direct DOM/Node APIs outside a thin platform layer).

## Git workflow (always follow)
- Default branch is `main`. Never commit directly to `main`.
- Cut a feature branch off `main` for each piece of work. Open one PR per feature.

## Architecture rules
- Content is data-driven: weapons, enemies, upgrades and tracks are defined in data files/registries, not hard-coded in scenes. This lets meta-progression and A/B variants be added later.
- Stub a save-data layer (localStorage behind an interface) even though v1 has no meta-progression.
- A/B testing: support feature flags/variants through URL query params (e.g. `?variant=b`) and a central config.
- Visuals are procedural first (Graphics/shaders for grid, mountains, moon, stars). Use only free/CC-licensed assets, and record each asset's source and license in `ASSETS.md`.
- Music: every track needs BPM + offset metadata. Gameplay spawns are quantized to the beat clock, which is derived from audio time (not frame time).
- Target 60 fps on mid-range phones. Use object pooling for bullets, enemies and XP.

## Prototype v0 scope
1. Procedural scene: scrolling neon grid, wireframe mountains, moon, starfield
2. Player car (placeholder shape OK) steering in X/Y, with pseudo-3D sprite scaling for objects coming from the horizon
3. One enemy type (loading spinner) + auto-fire
4. XP drops + pick-1-of-3 level-up screen
5. One track with beat-quantized spawns
