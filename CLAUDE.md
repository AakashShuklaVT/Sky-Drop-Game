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
| 4 | Spritesheets (AssetPack) + animations (idle/walk/hurt/cheer) | 🏗️ built, walkthrough pending |
| 5 | Falling items, spawning, object pooling, collision | 🏗️ built, walkthrough pending |
| 6 | Score, lives, combo, HUD | 🏗️ built, walkthrough pending |
| 7 | Scenes: menu → game → game over, loading screen, pause | 🏗️ built, walkthrough pending |
| 8 | Polish: particles, screen shake, tweens | 🏗️ built, walkthrough pending |
| — | Sound (`@pixi/sound`, `audio` bundle, auto-unlock on first tap) | 🏗️ built, walkthrough pending |
| later | Performance (@0.5x textures, profiling), build & deploy (cacheBust) | ⬜ |

### Where things stand (2026-11-23)
On the user's request ("build the whole game & then explain me") Claude built Lessons 4–8 plus sound in one go.
Typecheck, `npm run build` and a headless-Chrome run (menu → game → pause) all pass with a clean console.
**Next:** walk the user through the code lesson by lesson (4 → 8), in the order of the table, using the
usual what → why → how format, ✅ check tables and questions. Suggest committing the built game first.

Key teaching points to cover in the walkthrough:
- 4: manifest + bundles (`Assets.init` / `loadBundle`), trimmed frames keep the anchor on the feet (anchor uses `orig` size), `AnimatedSprite` state machine: setting `textures` calls `gotoAndStop(0)` so only swap on state change and `play()` after; `autoUpdate: false` because autoUpdate uses `Ticker.shared`, not `app.ticker`.
- 5: `Pool`, swap-remove, circle-vs-rect collision, generous catch box vs. small bomb radius, `Spawner` difficulty curve with `lerp`.
- 6: `ScoreKeeper` as single owner of rules (no Pixi), HUD only displays, `SpriteNumber` reuses sprites.
- 7: `Scene` + `SceneManager` (destroy old scene), `Router` interface to avoid circular imports, loading screen with progress, pause (phase flag + `visibilitychange`), `Input.consumePress` / `endFrame`.
- 8: `ParticleContainer` (one texture source, `dynamicProperties`), `BitmapText` for popups, trauma `Shake` on the world only, scene-owned `Tweens`, TilingSprite seam fix in `Background`.
- Gotchas hit while building: Pixi `Container` already has `label` and `effects` properties (don't reuse those names); font family names come from the file name (`"Lilitaone Regular"`); the player frame `hurt.png` clashed with the `hurt` sound in the Cache, so it was renamed `back.png` (it's a back view; the hurt pose uses `hit`).

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

- Vite + TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`) + `pixi.js` v8 + `@pixi/sound` v6 + `@assetpack/core`.
- `npm run dev`: builds assets, then dev server (`--host`, so phones on the LAN can connect).
- `npm run typecheck`: run after every change; it must pass.
- `npm run assets` / `npm run assets:watch`: build `public/assets/` from `raw-assets/`.
- `npm run build`: assets → typecheck → `dist/`.

## Architecture and conventions

```
src/
  main.ts          boot: app.init → Assets.init + fonts → Viewport/layers/Input → LoadingScene
                   → load game+audio → Background + Router → MenuScene; one app.ticker loop
  core/            reusable engine code, knows nothing about Sky Drop
    config.ts      design size only
    Viewport.ts    scales/centers viewport.root; visible + safe (notch) rects; onResize returns unsubscribe
    Input.ts       pointer + keyboard → pointerX / axis; consumePress() one-shot keys; endFrame()
    math.ts        clamp, lerp, randomRange, pickWeighted, circleIntersectsRect
    Pool.ts        generic object pool
    Scene.ts       abstract Scene (update(ticker), resize(visible, safe))
    SceneManager.ts  one current scene; goto() destroys the old one, fades in the new
    Tweens.ts      tiny tween engine + Ease; each scene owns one
    Shake.ts       trauma-based screen shake
    SpriteNumber.ts  numbers drawn from digit frames
    Sfx.ts         playSfx / setMuted over @pixi/sound
    storage.ts     safe localStorage helpers
  game/            Sky Drop–specific code
    tuning.ts      ALL gameplay numbers (no magic numbers elsewhere)
    theme.ts       fonts, colours, BitmapFont install
    items.ts       ItemType data table (GOOD_ITEMS, BOMB)
    context.ts     Router interface, Settings (mute), GameContext passed to scenes
    Player.ts      AnimatedSprite state machine; update(ticker, MoveInput | null)
    Item.ts        pooled falling item; reset() + update(dt)
    Spawner.ts     when/what/where to spawn + difficulty ramp
    ScoreKeeper.ts score, lives, combo rules; saves best score
    Hud.ts         hearts, score, combo, pause button
    Effects.ts     ParticleContainer bursts + BitmapText popups
    Background.ts  TilingSprite bands, cloud parallax (shared by all scenes)
    ui/            Button, Panel, Dimmer, PauseMenu
    scenes/        LoadingScene, MenuScene, GameScene, GameOverScene
raw-assets/        SOURCE art/audio (committed). Folder tags: {m} = bundle, {tps} = spritesheet
  game{m}/player{tps}, items{tps}, hud{tps}, backgrounds/
  audio{m}/, fonts{m}/
public/assets/     GENERATED by AssetPack (not committed)
credits/           asset licenses (Kenney CC0, OFL fonts); keep and ship with the game
```

- **Design space:** all game code uses 720×1280 design units inside `viewport.root`. Never use `app.screen` or `window` sizes in game code. Only the Viewport owns the canvas size (no `resizeTo`).
- **Dependency direction:** `game/` may import `core/`; `core/` never imports `game/`.
- **Game objects:** `extends Container`, visuals composed inside (body sprite, shadow). Keep this pattern for every object. Don't name fields `label` or `effects`: `Container` already has them.
- **Scenes** never import each other; they navigate through `ctx.router`. Anything a scene subscribes to is removed in its `destroy()`.
- **Movement:** units per second using `ticker.deltaMS / 1000`; no per-frame lerps.
- **Listeners:** arrow-function class fields; every `on`/`addEventListener` has a matching removal in `destroy()`.
- **Assets:** load via the manifest and bundles, refer to frames by short name (`"idle"`, `"walk0"`). Short names share one global Cache, so they must be unique across all bundles (that's why the HUD coin is `coin_icon`, to avoid clashing with the `coin` sound).
- **Style:** tabs, double quotes in new code, semicolons, JSDoc on public members. Prettier is planned but not set up yet.
