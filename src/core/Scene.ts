import { Container, type Rectangle, type Ticker } from "pixi.js";

/**
 * Base class for a screen of the game (loading, menu, gameplay, game over).
 * The SceneManager adds it to the stage, calls `update` every frame and `resize` on screen changes,
 * and calls `destroy()` when leaving it, so override `destroy` to remove any listeners you added.
 */
export abstract class Scene extends Container {
	/** Called every frame while this is the current scene. */
	update(_ticker: Ticker): void {}

	/**
	 * Called once when shown and again after every resize.
	 * @param _visible Part of design space the player can see (includes bleed).
	 * @param _safe `_visible` minus notches / home bars: keep buttons and text inside this.
	 */
	resize(_visible: Rectangle, _safe: Rectangle): void {}
}
