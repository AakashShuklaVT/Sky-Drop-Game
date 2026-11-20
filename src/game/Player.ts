import { Container, Sprite, Texture } from "pixi.js";
import type { Input } from "../core/Input";
import { DESIGN_WIDTH, PLAYER_HALF_WIDTH, PLAYER_SPEED } from "../core/config";
import { clamp } from "../core/math";

export class Player extends Container {
	private readonly body: Sprite;

	constructor() {
		super(); // must run before you use `this`: the Container part is built first

		this.body = new Sprite(Texture.from("player-idle")); // looks up the alias loaded in main.ts
		this.body.anchor.set(0.5, 1); // origin = middle of her feet
		this.addChild(this.body);
	}

	/** Move for one frame. `dt` = seconds since the last frame. */
	update(dt: number, input: Input): void {
		// The furthest she may move this frame (same top speed for touch and keyboard).
		const maxStep = PLAYER_SPEED * dt;
		let dx: number;

		if (input.pointerX !== null) {
			// Run toward the finger, but never faster than maxStep → no teleporting.
			const diff = input.pointerX - this.x;
			dx = Math.abs(diff) <= maxStep ? diff : Math.sign(diff) * maxStep;
		} else {
			// Keyboard: axis is -1, 0 or 1.
			dx = input.axis * maxStep;
		}

		// Keep her whole body inside the design area.
		this.x = clamp(this.x + dx, PLAYER_HALF_WIDTH, DESIGN_WIDTH - PLAYER_HALF_WIDTH);

		// Face the way she's moving. Flip only the body, not the Player container.
		if (dx !== 0) this.body.scale.x = Math.sign(dx);
	}
}
