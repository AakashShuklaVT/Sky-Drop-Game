import type { Input } from "../core/Input";
import { setMuted } from "../core/Sfx";
import { loadBool, saveBool } from "../core/storage";
import type { GameResult } from "./ScoreKeeper";
import { STORAGE_MUTED } from "./tuning";

/**
 * Scene navigation. Scenes call `router.toGame()` instead of `new GameScene()`,
 * so scenes never import each other (no circular imports). main.ts implements it.
 */
export interface Router {
	toMenu(): void;
	toGame(): void;
	toGameOver(result: GameResult): void;
}

/** Player preferences that survive a reload. */
export class Settings {
	private mutedValue = loadBool(STORAGE_MUTED, false);

	constructor() {
		setMuted(this.mutedValue); // apply the saved choice on startup
	}

	get muted(): boolean {
		return this.mutedValue;
	}

	/** Flip mute, apply it and save it. Returns the new value. */
	toggleMuted(): boolean {
		this.mutedValue = !this.mutedValue;
		setMuted(this.mutedValue);
		saveBool(STORAGE_MUTED, this.mutedValue);
		return this.mutedValue;
	}
}

/** The shared services every scene receives. */
export interface GameContext {
	readonly input: Input;
	readonly router: Router;
	readonly settings: Settings;
}
