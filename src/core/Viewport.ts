import { Container, Rectangle, type Application } from "pixi.js";
import { DESIGN_WIDTH, DESIGN_HEIGHT } from "./config";

/** A function that wants to be told the new visible area whenever the screen size changes. */
type ResizeListener = (visible: Rectangle) => void;

/**
 * Viewport = the "camera" of the game.
 *
 * The whole game is built in a fixed 720×1280 DESIGN space.
 * Viewport scales + centers `root` so that design space always fits any screen,
 * and tells everyone (via onResize) which part of the design space is visible.
 */
export class Viewport {
	/** Put the whole game inside this. It's scaled + centered for you. */
	readonly root = new Container();

	/** The part of design space the player can see (can be bigger than 720×1280 → "bleed"). */
	readonly visible = new Rectangle();

	/** How many CSS pixels one design unit takes on screen. */
	scale = 1;

	private readonly app: Application;
	private listeners: ResizeListener[] = [];
	private resizeQueued = false;

	constructor(app: Application) {
		this.app = app;
		app.stage.addChild(this.root);

		// The browser calls queueResize every time the window size changes.
		window.addEventListener("resize", this.queueResize);

		// Lay out once right now for the current screen size.
		this.applyResize();
	}

	/**
	 * Subscribe to screen size changes.
	 * `listener` is called immediately once, and again after every resize.
	 */
	onResize(listener: ResizeListener): void {
		this.listeners.push(listener);
		listener(this.visible);
	}

	/**
	 * Called by the browser on every "resize" event (can be many per frame).
	 * Makes sure applyResize runs at most ONCE per frame.
	 */
	private queueResize = (): void => {
		if (this.resizeQueued) return; // already scheduled → ignore this event

		this.resizeQueued = true; // mark as scheduled

		requestAnimationFrame(() => {
			this.resizeQueued = false; // allow the next one to be scheduled
			this.applyResize();
		});
	};

	/** Does the actual math: resize canvas, scale + center root, update visible, notify listeners. */
	private applyResize(): void {
		const w = window.innerWidth;
		const h = window.innerHeight;

		// 1. Make the canvas exactly the size of the window.
		this.app.renderer.resize(w, h);

		// 2. Fit the 720×1280 design area inside the screen (the smaller ratio wins).
		this.scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);

		// 3. Scale root and center it (split the leftover space equally on both sides).
		this.root.scale.set(this.scale);
		this.root.position.set(
			Math.round((w - DESIGN_WIDTH * this.scale) / 2),
			Math.round((h - DESIGN_HEIGHT * this.scale) / 2),
		);

		// 4. Work out which part of design space the screen shows (in design units).
		this.visible.width = w / this.scale;
		this.visible.height = h / this.scale;
		this.visible.x = (DESIGN_WIDTH - this.visible.width) / 2;
		this.visible.y = (DESIGN_HEIGHT - this.visible.height) / 2;

		// 5. Tell every subscriber about the new visible area.
		for (const notify of this.listeners) {
			notify(this.visible);
		}
	}
}
