import type { Container, Ticker } from "pixi.js";
import type { Scene } from "./Scene";
import type { Viewport } from "./Viewport";

/** Seconds a new scene takes to fade in. */
const FADE_IN_SECONDS = 0.25;

/**
 * Owns the current scene: only one exists at a time.
 * Switching destroys the old scene (and everything inside it) and fades the new one in.
 */
export class SceneManager {
	private readonly layer: Container;
	private readonly viewport: Viewport;
	private readonly unsubscribeResize: () => void;
	private current: Scene | null = null;

	/**
	 * @param layer Container the scenes are added to (inside viewport.root).
	 * @param viewport Used to tell each scene the visible / safe areas.
	 */
	constructor(layer: Container, viewport: Viewport) {
		this.layer = layer;
		this.viewport = viewport;
		this.unsubscribeResize = viewport.onResize((visible, safe) => {
			this.current?.resize(visible, safe);
		});
	}

	/** Replace the current scene with `next`. */
	goto(next: Scene): void {
		if (this.current) {
			this.layer.removeChild(this.current);
			this.current.destroy({ children: true }); // frees sprites/text; shared textures stay cached
		}
		this.current = next;
		next.alpha = 0;
		this.layer.addChild(next);
		next.resize(this.viewport.visible, this.viewport.safe);
	}

	/** Forward the frame to the current scene. */
	update(ticker: Ticker): void {
		const scene = this.current;
		if (!scene) return;
		if (scene.alpha < 1) {
			scene.alpha = Math.min(1, scene.alpha + ticker.deltaMS / 1000 / FADE_IN_SECONDS);
		}
		scene.update(ticker);
	}

	/** Destroy the current scene and stop listening for resizes. */
	destroy(): void {
		this.unsubscribeResize();
		this.current?.destroy({ children: true });
		this.current = null;
	}
}
