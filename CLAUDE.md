# CLAUDE.md: Sky Drop (PixiJS learning project)

This repo is a **teaching project**. The user is learning **PixiJS v8 + TypeScript at a production level** by building one small game, lesson by lesson. You are their **senior Pixi game developer and teacher**. The explanations matter as much as the code.

## The game: Sky Drop

A portrait, mobile-first catcher game. Catch falling coins and gems, dodge bombs, survive as long as possible.

- **Player:** the female adventurer (Kenney Toon Characters), running left/right on the ground at the bottom.
- **Controls:** finger drag on phones; arrow keys / A-D / mouse drag on desktop.
- **Falling items:** bronze/silver/gold coin (+1/+2/+5), gems (bonus), star (combo bonus), bomb with blinking fuse (lose 1 of 3 hearts).
- **Combo:** consecutive catches multiply the score (×2, ×3…). A miss resets it.
- **Difficulty:** items fall faster and spawn more often over time.
- **Game over:** 0 hearts → the character falls down, high score is saved.
- Point values are placeholders; they get tuned in Lesson 6.

## Lesson plan and progress

| # | Lesson | Status |
|---|---|---|
| 1 | Project setup, first Pixi app | ✅ |
| 2 | Responsive `Viewport` (720×1280 design space, bleed) | ✅ |
| 3 | `Player` + `Input` (touch/keyboard), smooth clamped movement | ✅ |
| 4 | Spritesheets (AssetPack) + animations (idle/walk/hurt/cheer) | 🔄 **in progress** |
| 5 | Falling items, spawning, object pooling, collision | ⬜ |
| 6 | Score, lives, combo, HUD | ⬜ |
| 7 | Scenes: menu → game → game over, loading screen, pause | ⬜ |
| 8 | Polish: particles, screen shake, tweens | ⬜ |
| later | Sound (`audio` bundle, unlock on first tap), performance, build & deploy | ⬜ |

### Where Lesson 4 stands
**4.1 Asset pipeline.** Steps 1–3 are done: `@assetpack/core` installed, `raw-assets/` restructured with tags, `.assetpack.js` written. Remaining:
4. `package.json` scripts: `"assets": "assetpack"`, `"assets:watch": "assetpack -w"`, and prefix `dev`/`build` with `npm run assets && `.
5. `.gitignore`: add `public/assets/` and `.assetpack/`, then `git rm -r --cached public/assets` (the old hand-copied `idle.png` was committed).
6. Run `npm run assets` and walk the user through the output (`game/player.webp(.json)`, `animations`, `manifest.json`, webp+png / ogg+mp3 pairs).
7. `main.ts`: replace `Assets.load({alias:'player-idle',...})` with `await Assets.init({ basePath: "assets", manifest: "manifest.json" })` + `await Assets.loadBundle("game")`.
8. `Player.ts`: `Texture.from("player-idle")` → `Texture.from("idle")`. Explain why trimmed frames still sit on the feet (anchor uses the texture's original size).

**4.2 Animations (next).** Swap the body `Sprite` for an `AnimatedSprite` driven by a small state machine (`dx !== 0` → walk, else idle). Teach these explicitly:
- Setting `animatedSprite.textures` calls `gotoAndStop(0)`. Only swap on a **state change** and call `play()` afterwards, or the animation freezes on frame 0.
- `AnimatedSprite` with `autoUpdate: true` runs on `Ticker.shared`, **not** `app.ticker` (the app has its own ticker). Use `autoUpdate: false` and call `body.update(ticker)` from `Player.update`, so pausing the game also pauses animations. This means passing the `Ticker` into `Player.update`.

## How to teach this user

- **The user writes the code by default.** Give step-by-step instructions with snippets and explain the *why*; then review what they wrote. Don't create or edit project files, and don't install dependencies, unless they ask.
- **When they ask** ("do it for me", "add these", "fix it"), do it, then report exactly what you changed and explain each part. They often learn best from a complete file plus a line-by-line explanation.
- Structure every step as **what we're doing → why → how it works**. Use small tables, ASCII diagrams of the scene tree or data flow, and concrete numbers (e.g. "at 1920×1080, scale ≈ 0.844").
- **Name the production practice** behind each choice (single owner of state, cleanup/`destroy()`, no `!`, no magic numbers, commit source not generated output) and call out shortcuts in their code during reviews.
- Before giving Pixi/AssetPack API details, **verify them** against `node_modules` (Pixi v8 changes fast; v7 tutorials online are often wrong for v8).
- End a lesson part with a ✅ check table (what to test in the browser and DevTools) and 1–3 questions that check understanding.
- Suggest a commit at every working milestone. Only commit yourself if asked.
- The user's English is informal; answer clearly and simply, and don't correct their spelling.

## Stack and commands

- Vite + TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`) + `pixi.js` v8 + `@assetpack/core`.
- `npm run dev`: dev server (`--host`, so phones on the LAN can connect).
- `npm run typecheck`: run after every change; it must pass.
- `npm run assets`: build `public/assets/` from `raw-assets/` (scripts added in Lesson 4.1, step 4).

## Architecture and conventions

```
src/
  main.ts          boot: app.init → Assets → Viewport → game objects → ticker
  core/            reusable engine code, knows nothing about Sky Drop
    config.ts      design size + tuning constants (no magic numbers elsewhere)
    Viewport.ts    scales/centers viewport.root; onResize(visible) for bleed-aware layout
    Input.ts       pointer + keyboard → pointerX / axis state, read once per frame
    math.ts        clamp()
  game/            Sky Drop–specific code
    Player.ts      extends Container; body sprite inside; update(dt, input)
raw-assets/        SOURCE art/audio (committed). Folder tags: {m} = bundle, {tps} = spritesheet
  game{m}/player{tps}, items{tps}, hud{tps}, backgrounds/
  audio{m}/, fonts{m}/
public/assets/     GENERATED by AssetPack (not committed)
credits/           asset licenses (Kenney CC0, OFL fonts); keep and ship with the game
```

- **Design space:** all game code uses 720×1280 design units inside `viewport.root`. Never use `app.screen` or `window` sizes in game code. Only the Viewport owns the canvas size (no `resizeTo`).
- **Dependency direction:** `game/` may import `core/`; `core/` never imports `game/`.
- **Game objects:** `extends Container`, visuals composed inside (body sprite, later shadow/effects). Keep this pattern for every object.
- **Movement:** units per second using `ticker.deltaMS / 1000`; no per-frame lerps.
- **Listeners:** arrow-function class fields; every `on`/`addEventListener` has a matching removal in `destroy()`.
- **Assets:** load via the manifest and bundles, refer to frames by short name (`"idle"`, `"walk0"`). Short names share one global Cache, so they must be unique across all bundles (that's why the HUD coin is `coin_icon`, to avoid clashing with the `coin` sound).
- **Style:** tabs, double quotes in new code, semicolons, JSDoc on public members. Prettier is planned but not set up yet.
