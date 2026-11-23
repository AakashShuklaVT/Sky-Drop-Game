import { Application, Assets, Container } from "pixi.js";
import "./style.css";
import { Input } from "./core/Input";
import { SceneManager } from "./core/SceneManager";
import { Viewport } from "./core/Viewport";
import { Background } from "./game/Background";
import { Settings, type GameContext } from "./game/context";
import { GameOverScene } from "./game/scenes/GameOverScene";
import { GameScene } from "./game/scenes/GameScene";
import { LoadingScene } from "./game/scenes/LoadingScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { installBitmapFonts } from "./game/theme";

/**
 * Boot order:
 *   1. Pixi app + canvas
 *   2. Assets.init(manifest) → load the tiny "fonts" bundle (the loading screen needs them)
 *   3. Viewport, scene layers, Input, show LoadingScene
 *   4. Load "game" (with progress) + "audio" (optional) in parallel
 *   5. Background + router → MenuScene
 */
async function boot(): Promise<void> {
	const app = new Application();

	// No `resizeTo` here: the Viewport is the single owner of the canvas size.
	await app.init({
		background: "#c4e3fe",
		antialias: true,
		autoDensity: true,
		resolution: Math.min(window.devicePixelRatio, 2),
	});

	// Fail with a clear message instead of using `!` (TS narrows `host` to HTMLElement after this).
	const host = document.getElementById("app");
	if (!host) throw new Error('Missing <div id="app"> in index.html');
	host.appendChild(app.canvas);

	// The manifest (written by AssetPack) lists every bundle and every file in it.
	// From now on assets are requested by alias ("idle", "coin") instead of by URL.
	await Assets.init({ basePath: "assets", manifest: "manifest.json" });
	await Assets.loadBundle("fonts");
	installBitmapFonts(); // needs the fonts above

	const viewport = new Viewport(app);
	const backdropLayer = new Container(); // background: shared by all scenes
	const sceneLayer = new Container(); // current scene: replaced on every scene change
	viewport.root.addChild(backdropLayer, sceneLayer);

	const scenes = new SceneManager(sceneLayer, viewport);
	const input = new Input(app, viewport.root);

	const loading = new LoadingScene();
	scenes.goto(loading);

	// One game loop. Order matters: scenes read input, THEN we forget unused key presses.
	app.ticker.add((ticker) => {
		scenes.update(ticker);
		input.endFrame();
	});

	await Promise.all([
		Assets.loadBundle("game", (progress) => loading.setProgress(progress)),
		// Sound is nice-to-have: if it fails (old browser, bad file), play silently instead of crashing.
		Assets.loadBundle("audio").catch((err: unknown) => {
			console.warn("Audio failed to load; continuing without sound.", err);
		}),
	]);

	const background = new Background();
	backdropLayer.addChild(background);
	viewport.onResize((visible) => background.resize(visible));
	app.ticker.add((ticker) => background.update(ticker.deltaMS / 1000));

	// Arrow functions, so scenes can pass e.g. `ctx.router.toGame` straight to a button.
	const ctx: GameContext = {
		input,
		settings: new Settings(),
		router: {
			toMenu: () => scenes.goto(new MenuScene(ctx)),
			toGame: () => scenes.goto(new GameScene(ctx)),
			toGameOver: (result) => scenes.goto(new GameOverScene(ctx, result)),
		},
	};
	ctx.router.toMenu();
}

boot().catch((err) => {
	console.error("Sky Drop failed to start:", err);
});
