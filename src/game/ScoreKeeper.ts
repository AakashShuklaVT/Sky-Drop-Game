import { loadNumber, saveNumber } from "../core/storage";
import type { ItemType } from "./items";
import { COMBO_MAX_MULTIPLIER, COMBO_STEP, START_LIVES, STORAGE_BEST } from "./tuning";

/** What the game-over screen needs to know. */
export interface GameResult {
	score: number;
	best: number;
	isNewBest: boolean;
}

/**
 * The single owner of score, lives and combo. Pure rules: no Pixi, no sprites.
 * The scene asks it what happened and then decides how to SHOW it (HUD, sounds, particles).
 */
export class ScoreKeeper {
	score = 0;
	lives = START_LIVES;
	/** Catches in a row without a miss or a bomb. */
	streak = 0;

	/** Current multiplier: ×1 for the first COMBO_STEP catches, then ×2, ×3 … up to the max. */
	get multiplier(): number {
		return Math.min(COMBO_MAX_MULTIPLIER, 1 + Math.floor(this.streak / COMBO_STEP));
	}

	/** Caught a good item. Returns the points actually gained (after the multiplier). */
	collect(type: ItemType): number {
		// A star is worth a whole combo step: it bumps the multiplier straight away.
		this.streak += type.kind === "star" ? COMBO_STEP : 1;
		const gained = type.points * this.multiplier;
		this.score += gained;
		return gained;
	}

	/** A good item hit the ground. */
	miss(): void {
		this.streak = 0;
	}

	/** Caught a bomb. Returns the lives left. */
	hitBomb(): number {
		this.streak = 0;
		this.lives = Math.max(0, this.lives - 1);
		return this.lives;
	}

	/** Save the high score and report the result. */
	finish(): GameResult {
		const previousBest = loadNumber(STORAGE_BEST, 0);
		const isNewBest = this.score > previousBest;
		if (isNewBest) saveNumber(STORAGE_BEST, this.score);
		return { score: this.score, best: Math.max(previousBest, this.score), isNewBest };
	}
}
