import { Application, Assets, Graphics } from 'pixi.js';
import './style.css'
import { Viewport } from './core/Viewport';
import { DESIGN_WIDTH, DESIGN_HEIGHT, GROUND_Y } from './core/config';
import { Player } from './game/Player';
import { Input } from './core/Input';

async function boot(): Promise<void> {
    const app = new Application();

    // No `resizeTo` here: the Viewport is the single owner of the canvas size.
    await app.init({
        background: "#000000",
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio, 2),
    });

    await Assets.load({
        alias: 'player-idle',
        src: "assets/player/idle.png"
    });

    // Fail with a clear message instead of using `!` (TS narrows `host` to HTMLElement after this).
    const host = document.getElementById('app');
    if (!host) throw new Error('Missing <div id="app"> in index.html');
    host.appendChild(app.canvas);

    const viewport = new Viewport(app);

    const bleed = new Graphics();
	viewport.root.addChild(bleed);
	viewport.onResize((v) => {
		bleed.clear().rect(v.x, v.y, v.width, v.height).fill("#26311d");
	});

	const frame = new Graphics()
		.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
		.stroke({ width: 6, color: "#ffffff" });
	viewport.root.addChild(frame);

    const player = new Player();
    player.position.set(DESIGN_WIDTH / 2, GROUND_Y);
    viewport.root.addChild(player);

    const input = new Input(app, viewport.root);

	app.ticker.add((ticker) => {
		player.update(ticker.deltaMS / 1000, input); // deltaMS → seconds
	});
}

boot().catch((err) => {
    console.error('Sky Drop failed to start:', err);
});