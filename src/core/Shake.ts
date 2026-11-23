import type { Container } from "pixi.js";
import { randomRange } from "./math";

/**
 * Trauma-based screen shake.
 *
 * `add(0.5)` adds "trauma" (0..1). Every frame the target is offset by
 * maxOffset × trauma², so small hits barely move it and big hits really shake.
 * Trauma decays linearly back to 0. The target's resting position is always (0, 0).
 */
export class Shake {
	private readonly target: Container;
	private readonly maxOffset: number;
	private readonly decayPerSecond: number;
	private trauma = 0;

	/**
	 * @param target Container to move (the game world, never the HUD).
	 * @param maxOffset Biggest offset at full trauma, in design units.
	 * @param decayPerSecond How much trauma disappears per second.
	 */
	constructor(target: Container, maxOffset: number, decayPerSecond: number) {
		this.target = target;
		this.maxOffset = maxOffset;
		this.decayPerSecond = decayPerSecond;
	}

	/** Add trauma (clamped to 1). */
	add(amount: number): void {
		this.trauma = Math.min(1, this.trauma + amount);
	}

	/** Apply this frame's offset. */
	update(dt: number): void {
		this.trauma = Math.max(0, this.trauma - this.decayPerSecond * dt);
		const power = this.trauma * this.trauma * this.maxOffset;
		this.target.position.set(randomRange(-power, power), randomRange(-power, power));
	}
}
