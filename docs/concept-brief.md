# AESTHETIC OVERDRIVE — Concept Brief (working draft)

## Title (DECIDED)
- **AESTHETIC OVERDRIVE** (plain: "Aesthetic Overdrive"). Repo: `rdlucas2/aesthetic-overdrive`.
- We dropped "Vapor Harrier" to avoid confusion with Sega's live SPACE HARRIER trademark (US Reg. 3366362, renewed 2018).
- Nearby names to be aware of: *Aesthetic Arena* (Steam, a wave shooter with cars flying at you in a neon desert), *Aesthetic World*, *Aesthetic Melody*. No exact match for "Aesthetic Overdrive" found in a quick web check (Nov 2026). Still to do before launch: a USPTO class 9 search, plus Steam/itch searches.

## One-liner
A head-on, Space Harrier-style rail shooter where you pilot a flying 80s sports car low through neon wireframe mountains toward a giant moon. It has Vampire Survivors-style run-based upgrades, and the waves are synced to the beat of vaporwave tracks.

## Pillars
1. **Ride the beat.** Enemy waves, weapon pulses and the grid glow all follow the music's BPM.
2. **Build-craft every run.** Level up, pick 1 of 3 weapons or power-ups, and find synergies or evolutions.
3. **Chill to chaos.** Every level starts hypnotic and ends in a screen-filling frenzy.
4. **Pure vibe aesthetic.** The art is mostly procedural: neon grid, wireframe mountains, starfield, glowing moon.

## Aesthetic
- Base scene: a purple/magenta synthwave night. A black sky fading to deep purple at the horizon, a dense starfield, a large glowing lavender moon centered high, rows of magenta wireframe mountains along the horizon, and a glowing magenta perspective grid floor scrolling toward the viewer.
- Player: a flying 80s wedge-style sports car (pink/purple body, red taillights, cyan accents) seen from behind. It must be our own design (not a copy of any reference art or a real licensed car).
- 2D only. Depth is faked with Space Harrier-style sprite scaling (pseudo-3D), seen head-on from behind the car.
- Weapons AND enemies are vaporwave-themed (see brainstorm below).

## Core loop
- Steer the car around the screen (X/Y). Weapons auto-fire into the screen.
- Enemies and hazards come in from the horizon, scaling up as they approach.
- Destroyed enemies drop XP. Leveling up gives a choice of 3 upgrades.
- Spawns are quantized to the current track's BPM (no hand-made beatmaps).

## Level structure (DECIDED)
- One run/level = **3 tracks of ~3–4 min each** (~9–12 min total).
- Each track has a **higher BPM** than the last: chill → driving → chaotic.
  - Note: classic vaporwave is slow (~60–90 BPM). Later tracks can move into future funk / synthwave / outrun (~110–130+ BPM) to escalate.
- Track changes are natural phase breaks: crossfade, shift the palette, and possibly a mini-boss. A boss comes at the end of track 3.
- Tracks need a steady, known BPM (store BPM + offset in track metadata).

## Progression
- **No meta-progression for v1.** Each run stands alone.
- Planned later: unlocks between runs (cars, tracks, starter weapons). Build v1 so this can bolt on later (data-driven content definitions, a save-data layer stubbed in).

## Engine & platforms (DECIDED)
- **Engine: Phaser** + TypeScript + Vite (web-first, fastest playtest loop).
- **Playtest/hosting: GitHub Pages.** A/B variants are separate URLs/flags; PR preview builds.
- **Ship targets:** web, Steam/desktop (Electron/NW.js/Tauri wrapper + steamworks.js; Steam Deck via Proton/Linux), mobile (Capacitor).
- **Consoles:** not supported by Phaser. They would need a native port/rewrite later (Vampire Survivors went Phaser → Unity for consoles). Accepted trade-off.
- **Git workflow:** feature branch off `main` per piece of work, one PR per feature, no direct commits to `main`.

## Weapon brainstorm (vaporwave-themed)
- Bouncing DVD logo: ricochets around the screen
- Windows-95 error popups: a shield ring of dialog boxes that block shots
- Cassette tape: tape-ribbon whip / spiral
- Marble bust (Helios-style): slow, heavy orbiting projectile
- Floppy disk launcher: spread shot
- Dial-up modem: screech AoE pulse on the beat
- Pastel Arizona-can sprinkler: arcing splash
- CRT scanline beam: piercing laser
- Evolutions: combine two maxed items (e.g. DVD logo + CRT → "Screensaver Storm")

## Enemy brainstorm (same style)
- Loading spinners / hourglass cursors: swarm fodder
- Wireframe dolphins: leap in arcs from the grid
- Floating "404" glitch cubes: split when hit
- Pop-up ad windows: tanky, spawn smaller ads
- VHS tracking-glitch phantoms: blink in and out
- Mall-escalator worms, palm-tree turrets
- Bosses: giant marble head, a corrupted Windows-95 start menu, the moon itself (final)

## Prototype v0 decisions (implemented)
- Landscape 960x540 logical canvas, scaled to fit. Portrait/mobile layout still open.
- Pseudo-3D: each object has a base position on the player plane plus depth z (0 = horizon, 1 = player); screen scale = z^2. Bullets and enemies share this space, so collision is a depth check plus a base-plane distance check.
- Enemies travel horizon -> player in a whole number of beats (spinner: 8), so they arrive on the beat. Weapon fire is on 16th-note steps.
- v0 music is a procedural Web Audio synth (no audio assets yet). The beat clock reads `AudioContext.currentTime`, compensated for output latency. The level-up screen suspends the audio context so music and clock stay in sync.
- Track sections (data in `src/data/tracks.ts`) ramp spawn formations (single / line / arc / wall) from chill to chaos by bar.

## Open questions
- Control scheme: touch drag vs. virtual stick, and keyboard/gamepad
- Final starter weapon set + evolution rules
- Music sourcing: royalty-free or CC-licensed tracks with a steady BPM and licenses that allow commercial use
