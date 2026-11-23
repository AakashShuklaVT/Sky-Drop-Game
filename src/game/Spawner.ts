import { DESIGN_WIDTH } from "../core/config";
import { lerp, pickWeighted, randomRange } from "../core/math";
import { BOMB, GOOD_ITEMS, type ItemType } from "./items";
import {
	BOMB_CHANCE_END,
	BOMB_CHANCE_START,
	DIFFICULTY_RAMP_SECONDS,
	FALL_SPEED_END,
	FALL_SPEED_JITTER,
	FALL_SPEED_START,
	SPAWN_INTERVAL_END,
	SPAWN_INTERVAL_START,
	SPAWN_MARGIN_X,
} from "./tuning";

/** Called for each new item: what it is, where (x), and how fast it falls. */
export type SpawnHandler = (type: ItemType, x: number, speed: number) => void;

/**
 * Decides WHEN, WHAT and WHERE things fall, and makes it harder over time.
 * It doesn't create sprites itself: it calls `onSpawn` and lets the scene (which owns the pool) do that.
 */
export class Spawner {
	private readonly onSpawn: SpawnHandler;
	private elapsed = 0;
	private timer = 0.6; // short grace period before the first item

	constructor(onSpawn: SpawnHandler) {
		this.onSpawn = onSpawn;
	}

	/** 0 at the start → 1 at full difficulty. */
	get difficulty(): number {
		return Math.min(1, this.elapsed / DIFFICULTY_RAMP_SECONDS);
	}

	/** Advance time and spawn whatever is due. */
	update(dt: number): void {
		this.elapsed += dt;
		this.timer -= dt;
		// `while`, not `if`: after a long frame several spawns may be due.
		while (this.timer <= 0) {
			this.spawnOne();
			this.timer += lerp(SPAWN_INTERVAL_START, SPAWN_INTERVAL_END, this.difficulty);
		}
	}

	private spawnOne(): void {
		const d = this.difficulty;
		const isBomb = Math.random() < lerp(BOMB_CHANCE_START, BOMB_CHANCE_END, d);
		const type = isBomb ? BOMB : pickWeighted(GOOD_ITEMS);
		const x = randomRange(SPAWN_MARGIN_X, DESIGN_WIDTH - SPAWN_MARGIN_X);
		const jitter = randomRange(1 - FALL_SPEED_JITTER, 1 + FALL_SPEED_JITTER);
		this.onSpawn(type, x, lerp(FALL_SPEED_START, FALL_SPEED_END, d) * jitter);
	}
}
